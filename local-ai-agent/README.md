# Local AI Agent

Agent AI chạy hoàn toàn local, dùng [Ollama](https://ollama.com) làm backend LLM.
Hỗ trợ chat, gọi công cụ (tool-calling: đọc/ghi file, liệt kê thư mục, tính toán,
lấy ngày giờ) và RAG (tìm kiếm trong tài liệu riêng của bạn).

## Cài đặt

1. Cài Ollama: https://ollama.com/download
2. Tải model chat và model embedding:

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

   (Có thể đổi sang model khác hỗ trợ tool-calling, ví dụ `qwen2.5`, `mistral-nemo`.)

3. Đảm bảo Ollama đang chạy (mặc định tự chạy nền sau khi cài, hoặc chạy `ollama serve`).

4. Cài thư viện Python (khuyến khích dùng venv):

```bash
cd local-ai-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Sử dụng

```bash
python agent.py
```

Tuỳ chọn:

```bash
python agent.py --model qwen2.5 --embed-model nomic-embed-text --workdir "C:\du\an\cua\ban"
```

- `--workdir`: thư mục gốc mà các tool đọc/ghi file được phép truy cập (mặc định là thư mục hiện tại).
- `--host`: địa chỉ Ollama server (mặc định `http://localhost:11434`).

### Lệnh trong khi chat

| Lệnh | Ý nghĩa |
|---|---|
| `/index <đường_dẫn>` | Index một file hoặc thư mục (.txt, .md, .py, .json, .csv, .log) vào kho RAG |
| `/reset` | Xoá lịch sử hội thoại |
| `/help` | Xem trợ giúp |
| `/exit` | Thoát |

Sau khi `/index`, agent có thể tự gọi tool `search_documents` để trả lời dựa trên
nội dung tài liệu bạn đã nạp.

## Cấu trúc project

- `agent.py` — vòng lặp CLI + vòng lặp gọi tool
- `ollama_client.py` — client gọi API `/api/chat` và `/api/embed` của Ollama
- `tools.py` — định nghĩa và triển khai các tool (giới hạn trong `--workdir`)
- `rag.py` — chunk văn bản, lưu/tìm vector bằng numpy (không cần vector DB ngoài)
- `config.py` — cấu hình mặc định, có thể override bằng biến môi trường hoặc CLI flag

## Mở rộng

Muốn thêm tool mới: viết hàm trong `tools.py`, thêm schema vào `TOOL_SCHEMAS`, và
đăng ký trong `ToolBox.dispatch`. Model sẽ tự quyết định khi nào gọi tool đó, miễn
là mô tả (`description`) đủ rõ ràng.
