import os
from dataclasses import dataclass


@dataclass
class Config:
    ollama_host: str = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    chat_model: str = os.environ.get("AGENT_CHAT_MODEL", "llama3.1")
    embed_model: str = os.environ.get("AGENT_EMBED_MODEL", "nomic-embed-text")
    workdir: str = os.environ.get("AGENT_WORKDIR", os.getcwd())
    index_path: str = os.environ.get("AGENT_INDEX_PATH", os.path.join(os.path.dirname(__file__), "data", "index.json"))
    max_tool_iterations: int = 8
    top_k: int = 4
    chunk_size: int = 800
    chunk_overlap: int = 100
