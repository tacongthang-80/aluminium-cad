"""Minimal local RAG: chunk text files, embed with Ollama, search with cosine similarity.

No external vector DB dependency - the index is a JSON file with one entry per
chunk (text + metadata + embedding), loaded into a numpy matrix at query time.
Fine for personal/local use up to a few thousand chunks.
"""
import json
import os

import numpy as np

from ollama_client import OllamaClient

TEXT_EXTENSIONS = {".txt", ".md", ".py", ".json", ".csv", ".log"}


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks = []
    step = max(chunk_size - overlap, 1)
    for start in range(0, len(words), step):
        chunk = " ".join(words[start:start + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        if start + chunk_size >= len(words):
            break
    return chunks


def iter_source_files(path: str) -> list[str]:
    if os.path.isfile(path):
        return [path]
    files = []
    for root, _dirs, names in os.walk(path):
        for name in names:
            if os.path.splitext(name)[1].lower() in TEXT_EXTENSIONS:
                files.append(os.path.join(root, name))
    return files


class VectorStore:
    def __init__(self, index_path: str):
        self.index_path = index_path
        self.records: list[dict] = []
        self._load()

    def _load(self) -> None:
        if os.path.exists(self.index_path):
            with open(self.index_path, "r", encoding="utf-8") as f:
                self.records = json.load(f)

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        with open(self.index_path, "w", encoding="utf-8") as f:
            json.dump(self.records, f)

    def add(self, text: str, embedding: list[float], source: str) -> None:
        self.records.append({"text": text, "embedding": embedding, "source": source})

    def search(self, query_embedding: list[float], top_k: int) -> list[dict]:
        if not self.records:
            return []
        matrix = np.array([r["embedding"] for r in self.records], dtype=np.float32)
        q = np.array(query_embedding, dtype=np.float32)
        denom = (np.linalg.norm(matrix, axis=1) * np.linalg.norm(q)) + 1e-8
        scores = (matrix @ q) / denom
        top_idx = np.argsort(-scores)[:top_k]
        return [
            {"text": self.records[i]["text"], "source": self.records[i]["source"], "score": float(scores[i])}
            for i in top_idx
        ]


def index_path_into_store(client: OllamaClient, store: VectorStore, path: str, chunk_size: int, overlap: int) -> int:
    files = iter_source_files(path)
    added = 0
    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except OSError:
            continue
        for chunk in chunk_text(content, chunk_size, overlap):
            embedding = client.embed(chunk)
            store.add(chunk, embedding, source=file_path)
            added += 1
    store.save()
    return added
