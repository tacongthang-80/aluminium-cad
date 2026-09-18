"""Thin wrapper around the local Ollama HTTP API (chat + embeddings)."""
import json
from typing import Any

import requests


class OllamaError(RuntimeError):
    pass


class OllamaClient:
    def __init__(self, host: str, chat_model: str, embed_model: str):
        self.host = host.rstrip("/")
        self.chat_model = chat_model
        self.embed_model = embed_model

    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.chat_model,
            "messages": messages,
            "stream": False,
        }
        if tools:
            payload["tools"] = tools
        try:
            resp = requests.post(f"{self.host}/api/chat", json=payload, timeout=300)
        except requests.ConnectionError as exc:
            raise OllamaError(
                f"Khong the ket noi toi Ollama tai {self.host}. "
                "Hay chac chan Ollama dang chay (lenh: `ollama serve`)."
            ) from exc
        if resp.status_code != 200:
            raise OllamaError(f"Ollama chat API loi {resp.status_code}: {resp.text}")
        data = resp.json()
        if "message" not in data:
            raise OllamaError(f"Phan hoi khong hop le tu Ollama: {data}")
        return data["message"]

    def embed(self, text: str) -> list[float]:
        payload = {"model": self.embed_model, "input": text}
        try:
            resp = requests.post(f"{self.host}/api/embed", json=payload, timeout=120)
        except requests.ConnectionError as exc:
            raise OllamaError(
                f"Khong the ket noi toi Ollama tai {self.host} de tao embedding."
            ) from exc
        if resp.status_code != 200:
            raise OllamaError(f"Ollama embed API loi {resp.status_code}: {resp.text}")
        data = resp.json()
        embeddings = data.get("embeddings")
        if not embeddings:
            raise OllamaError(f"Phan hoi embedding khong hop le: {data}")
        return embeddings[0]

    def list_models(self) -> list[str]:
        resp = requests.get(f"{self.host}/api/tags", timeout=30)
        resp.raise_for_status()
        return [m["name"] for m in resp.json().get("models", [])]
