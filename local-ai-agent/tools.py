"""Tool definitions (schemas + implementations) available to the agent.

Every filesystem tool is confined to `workdir` to keep the agent from
wandering outside the folder the user pointed it at.
"""
import ast
import datetime
import os

from ollama_client import OllamaClient
from rag import VectorStore

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Doc noi dung mot file van ban trong thu muc lam viec.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Duong dan file, tuong doi so voi thu muc lam viec."}
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Ghi (tao moi hoac ghi de) noi dung vao mot file van ban trong thu muc lam viec.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Duong dan file, tuong doi so voi thu muc lam viec."},
                    "content": {"type": "string", "description": "Noi dung can ghi."},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "Liet ke file/thu muc con ben trong mot thu muc trong thu muc lam viec.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Duong dan thu muc, mac dinh la thu muc goc."}
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Tim kiem trong kho tai lieu da duoc index (RAG) de lay ngu canh lien quan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Cau hoi hoac tu khoa can tim."}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Tinh toan mot bieu thuc so hoc, vi du '12 * (3 + 4) / 2'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Bieu thuc can tinh."}
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_datetime",
            "description": "Lay ngay gio hien tai cua may.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


class ToolBox:
    def __init__(self, workdir: str, client: OllamaClient, store: VectorStore, top_k: int):
        self.workdir = os.path.abspath(workdir)
        self.client = client
        self.store = store
        self.top_k = top_k

    def _resolve(self, path: str) -> str:
        full = os.path.abspath(os.path.join(self.workdir, path))
        if os.path.commonpath([full, self.workdir]) != self.workdir:
            raise PermissionError(f"Duong dan '{path}' nam ngoai thu muc lam viec, khong duoc phep.")
        return full

    def read_file(self, path: str) -> str:
        full = self._resolve(path)
        if not os.path.isfile(full):
            return f"Loi: khong tim thay file '{path}'."
        with open(full, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()[:20000]

    def write_file(self, path: str, content: str) -> str:
        full = self._resolve(path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Da ghi {len(content)} ky tu vao '{path}'."

    def list_directory(self, path: str = ".") -> str:
        full = self._resolve(path)
        if not os.path.isdir(full):
            return f"Loi: '{path}' khong phai thu muc."
        entries = sorted(os.listdir(full))
        return "\n".join(entries) if entries else "(thu muc rong)"

    def search_documents(self, query: str) -> str:
        if not self.store.records:
            return "Kho tai lieu chua duoc index. Dung lenh /index <duong_dan> truoc."
        embedding = self.client.embed(query)
        results = self.store.search(embedding, self.top_k)
        if not results:
            return "Khong tim thay ket qua lien quan."
        parts = []
        for r in results:
            parts.append(f"[Nguon: {r['source']} | diem: {r['score']:.3f}]\n{r['text']}")
        return "\n\n".join(parts)

    def calculator(self, expression: str) -> str:
        allowed_nodes = (
            ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant,
            ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.Mod,
            ast.FloorDiv, ast.USub, ast.UAdd,
        )
        try:
            node = ast.parse(expression, mode="eval")
            for n in ast.walk(node):
                if not isinstance(n, allowed_nodes):
                    raise ValueError("Bieu thuc chua ky tu khong duoc phep.")
                if isinstance(n, ast.Constant) and not isinstance(n.value, (int, float)):
                    raise ValueError("Bieu thuc chua gia tri khong duoc phep.")
            return str(eval(compile(node, "<calc>", "eval")))
        except Exception as exc:
            return f"Loi tinh toan: {exc}"

    def get_current_datetime(self) -> str:
        return datetime.datetime.now().isoformat(timespec="seconds")

    def dispatch(self, name: str, arguments: dict) -> str:
        handlers = {
            "read_file": self.read_file,
            "write_file": self.write_file,
            "list_directory": self.list_directory,
            "search_documents": self.search_documents,
            "calculator": self.calculator,
            "get_current_datetime": self.get_current_datetime,
        }
        handler = handlers.get(name)
        if handler is None:
            return f"Loi: khong co tool ten '{name}'."
        try:
            return handler(**arguments)
        except PermissionError as exc:
            return f"Loi quyen truy cap: {exc}"
        except TypeError as exc:
            return f"Loi tham so goi tool '{name}': {exc}"
