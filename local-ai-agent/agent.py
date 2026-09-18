"""Local AI agent CLI: chat + tool-calling + RAG, backed by a local Ollama server.

Usage:
    python agent.py                       # start chatting (uses config defaults)
    python agent.py --model qwen2.5 --workdir C:\\projects\\myrepo

In-chat commands:
    /index <path>   index a file or folder into the local RAG store
    /reset          clear the conversation history
    /help           show available commands
    /exit           quit
"""
import argparse
import json
import sys

from rich.console import Console
from rich.markdown import Markdown

from config import Config
from ollama_client import OllamaClient, OllamaError
from rag import VectorStore, index_path_into_store
from tools import TOOL_SCHEMAS, ToolBox

SYSTEM_PROMPT = """Ban la mot tro ly AI chay hoan toan tren may local cua nguoi dung.
Ban co the goi cac cong cu (tools) khi can: doc/ghi file trong thu muc lam viec,
liet ke thu muc, tra cuu kho tai lieu da index (search_documents), tinh toan,
va lay ngay gio hien tai. Chi goi tool khi thuc su can thiet de tra loi chinh xac.
Neu khong can tool, hay tra loi truc tiep bang tieng Viet, ngan gon va ro rang."""


def build_console() -> Console:
    return Console()


def run_agent_turn(client: OllamaClient, toolbox: ToolBox, messages: list[dict], max_iterations: int, console: Console) -> str:
    for _ in range(max_iterations):
        try:
            message = client.chat(messages, tools=TOOL_SCHEMAS)
        except OllamaError as exc:
            return f"[Loi] {exc}"

        tool_calls = message.get("tool_calls")
        if not tool_calls:
            content = message.get("content", "")
            messages.append({"role": "assistant", "content": content})
            return content

        messages.append(message)
        for call in tool_calls:
            fn = call.get("function", {})
            name = fn.get("name", "")
            raw_args = fn.get("arguments", {})
            if isinstance(raw_args, str):
                try:
                    raw_args = json.loads(raw_args)
                except json.JSONDecodeError:
                    raw_args = {}
            console.print(f"[dim]-> goi tool: {name}({raw_args})[/dim]")
            result = toolbox.dispatch(name, raw_args)
            messages.append({"role": "tool", "content": str(result), "name": name})

    return "[Loi] Da vuot qua so lan goi tool toi da cho mot luot tra loi."


def main() -> None:
    cfg = Config()
    parser = argparse.ArgumentParser(description="Local AI agent (Ollama + tools + RAG)")
    parser.add_argument("--model", default=cfg.chat_model, help="Ten model chat trong Ollama")
    parser.add_argument("--embed-model", default=cfg.embed_model, help="Ten model embedding trong Ollama")
    parser.add_argument("--host", default=cfg.ollama_host, help="Dia chi Ollama server")
    parser.add_argument("--workdir", default=cfg.workdir, help="Thu muc goc ma cac tool file duoc phep truy cap")
    parser.add_argument("--index-path", default=cfg.index_path, help="File luu tru RAG index (JSON)")
    args = parser.parse_args()

    console = build_console()
    client = OllamaClient(host=args.host, chat_model=args.model, embed_model=args.embed_model)
    store = VectorStore(args.index_path)
    toolbox = ToolBox(workdir=args.workdir, client=client, store=store, top_k=cfg.top_k)

    console.print(f"[bold cyan]Local AI Agent[/bold cyan] - model: {args.model} | workdir: {toolbox.workdir}")
    console.print("Go /help de xem cac lenh. Go /exit de thoat.\n")

    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        try:
            user_input = console.input("[bold green]Ban:[/bold green] ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\nTam biet!")
            break

        if not user_input:
            continue

        if user_input == "/exit":
            break
        if user_input == "/reset":
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            console.print("[yellow]Da xoa lich su hoi thoai.[/yellow]")
            continue
        if user_input == "/help":
            console.print(
                "/index <duong_dan>  index file/thu muc vao RAG store\n"
                "/reset              xoa lich su hoi thoai\n"
                "/exit               thoat"
            )
            continue
        if user_input.startswith("/index"):
            parts = user_input.split(maxsplit=1)
            if len(parts) != 2:
                console.print("[red]Dung: /index <duong_dan_file_hoac_thu_muc>[/red]")
                continue
            try:
                added = index_path_into_store(client, store, parts[1], cfg.chunk_size, cfg.chunk_overlap)
                console.print(f"[green]Da index {added} doan van ban tu '{parts[1]}'.[/green]")
            except OllamaError as exc:
                console.print(f"[red]{exc}[/red]")
            except OSError as exc:
                console.print(f"[red]Loi doc duong dan: {exc}[/red]")
            continue

        messages.append({"role": "user", "content": user_input})
        reply = run_agent_turn(client, toolbox, messages, cfg.max_tool_iterations, console)
        console.print("[bold blue]Agent:[/bold blue]")
        console.print(Markdown(reply or "(khong co phan hoi)"))
        console.print()


if __name__ == "__main__":
    main()
