import base64
import json
import os
import re
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def load_dotenv_file() -> None:
    env_file = Path(__file__).with_name(".env")
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


if load_dotenv:
    load_dotenv()
else:
    load_dotenv_file()

DEFAULT_SAVE_DIRECTORY = r"C:\Users\Aarons\OneDrive\SoFlo"


def resolve_save_directory() -> Path:
    configured = os.getenv("CARICATURE_SAVE_DIR", DEFAULT_SAVE_DIRECTORY)
    save_dir = Path(configured).expanduser()
    save_dir.mkdir(parents=True, exist_ok=True)
    return save_dir


def decode_data_url(image_data: str) -> bytes:
    if not image_data:
        raise ValueError("Missing imageData.")

    if "," in image_data:
        _, image_data = image_data.split(",", 1)

    return base64.b64decode(image_data)


def sanitize_filename(value: str) -> str:
    cleaned = re.sub(r'[\x00-\x1f\x7f<>:"/\\|?*]', "_", value.strip())
    cleaned = cleaned.replace(" ", "_")
    if not cleaned:
        return "kiosk_capture"
    return cleaned


def build_filename(email: Optional[str] = None) -> str:
    if email:
        base_name = sanitize_filename(email.lower())
        return f"{base_name}.jpg"
    else:
        base_name = "kiosk_capture"
        return f"{base_name}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"


def save_image_to_disk(image_bytes: bytes, email: Optional[str] = None) -> str:
    save_dir = resolve_save_directory()
    destination = save_dir / build_filename(email)
    with open(destination, "wb") as image_file:
        image_file.write(image_bytes)
    return str(destination)


def send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class CaptureHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/save-capture":
            send_json(self, 404, {"error": "Not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length).decode("utf-8")
            payload = json.loads(raw_body)
            image_bytes = decode_data_url(payload.get("imageData", ""))
            email = payload.get("email")
            saved_path = save_image_to_disk(image_bytes, email)
            send_json(self, 200, {"path": saved_path})
        except Exception as error:
            send_json(self, 500, {"error": str(error)})


def main():
    host = os.getenv("CARICATURE_HOST", "0.0.0.0")
    port = int(os.getenv("CARICATURE_PORT", "5001"))
    server = HTTPServer((host, port), CaptureHandler)
    print(f"Photo capture service running at http://{host}:{port}/save-capture")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
