import json
import os
import shutil
import socket
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request

from graph_builder import GraphBuilder
from vault_scanner import VaultScanner, iso_utc, normalize_tags


VERSION = "1.0.0"
CORS_ORIGIN = "https://just-krispy.github.io"

app = Flask(__name__)
scanner = VaultScanner()
graph_builder = GraphBuilder()


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return ("", 204)
    return None


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = CORS_ORIGIN
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


def clamp_int(value: Any, default: int, minimum: int = 0, maximum: int = 1000) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(parsed, maximum))


def ok(payload: dict[str, Any], status: int = 200):
    return jsonify(payload), status


def request_json() -> dict[str, Any]:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def summarize_note(note: dict[str, Any]) -> dict[str, Any]:
    return {
        "file": note.get("file"),
        "title": note.get("title"),
        "tags": note.get("tags", []),
        "folder": note.get("folder", ""),
        "modified": note.get("modified"),
    }


def disk_usage_percent(path: Path) -> str:
    probe = path if path.exists() else Path.home()
    usage = shutil.disk_usage(probe)
    used = round((usage.used / usage.total) * 100) if usage.total else 0
    return f"{used}%"


def memory_usage_percent() -> str:
    meminfo = Path("/proc/meminfo")
    if meminfo.exists():
        values = {}
        for line in meminfo.read_text(encoding="utf-8", errors="replace").splitlines():
            key, _, value = line.partition(":")
            parts = value.strip().split()
            if parts and parts[0].isdigit():
                values[key] = int(parts[0])
        total = values.get("MemTotal", 0)
        available = values.get("MemAvailable", 0)
        if total:
            return f"{round(((total - available) / total) * 100)}%"
    return "0%"


def load_average() -> str:
    try:
        return f"{os.getloadavg()[0]:.2f}"
    except (AttributeError, OSError):
        return "0.00"


def n8n_port_status() -> str:
    try:
        with socket.create_connection(("127.0.0.1", 5678), timeout=0.6):
            return "Up (via port 5678)"
    except OSError:
        return "Down"


def fetch_n8n_workflows() -> dict[str, Any]:
    urls = [
        "http://127.0.0.1:5678/rest/workflows",
        "http://127.0.0.1:5678/api/v1/workflows",
    ]
    for url in urls:
        try:
            with urllib.request.urlopen(url, timeout=1.5) as response:
                payload = json.loads(response.read().decode("utf-8"))
            raw_workflows = payload.get("data", payload) if isinstance(payload, dict) else payload
            if not isinstance(raw_workflows, list):
                raw_workflows = []
            workflows = [
                {"name": item.get("name", "Unnamed Workflow"), "active": bool(item.get("active"))}
                for item in raw_workflows
                if isinstance(item, dict)
            ]
            return {"workflows": workflows, "count": len(workflows), "n8n_status": "Up"}
        except (OSError, urllib.error.URLError, json.JSONDecodeError):
            continue
    return {"workflows": [], "count": 0, "n8n_status": "Down"}


def estimate_chunks(notes: list[dict[str, Any]]) -> int:
    total = 0
    for note in notes:
        paragraphs = [part for part in (note.get("content") or "").split("\n\n") if part.strip()]
        total += max(1, len(paragraphs))
    return total


def vault_quality() -> dict[str, Any]:
    notes = scanner.get_all_notes()
    tiers: Counter[str] = Counter()
    scored = []
    for note in notes:
        content = note.get("content") or ""
        score = 0
        score += min(35, len(content) // 80)
        score += 20 if note.get("frontmatter") else 0
        score += 20 if note.get("tags") else 0
        score += min(25, len(note.get("links") or []) * 5)
        if score >= 85:
            tier = "A"
        elif score >= 70:
            tier = "B"
        elif score >= 50:
            tier = "C"
        elif score >= 30:
            tier = "D"
        else:
            tier = "F"
        tiers[tier] += 1
        scored.append((score, note.get("file", "")))
    avg_score = round(sum(score for score, _ in scored) / len(scored)) if scored else 0
    bottom_notes = [file for _, file in sorted(scored)[:10]]
    return {
        "avg_score": avg_score,
        "tiers": {tier: tiers.get(tier, 0) for tier in ["A", "B", "C", "D", "F"]},
        "bottom_notes": bottom_notes,
    }


@app.route("/", methods=["GET", "OPTIONS"])
def root():
    return ok({"status": "ok", "gateway": "running", "version": VERSION})


@app.route("/api/health", methods=["GET", "OPTIONS"])
def api_health():
    notes = scanner.get_all_notes()
    return ok(
        {
            "gateway": "running",
            "disk": disk_usage_percent(scanner.vault_path),
            "memory": memory_usage_percent(),
            "load": load_average(),
            "n8n": n8n_port_status(),
            "vault_path": str(scanner.vault_path),
            "total_notes": len(notes),
        }
    )


@app.route("/api/rag/stats", methods=["GET", "OPTIONS"])
def rag_stats():
    notes = scanner.get_all_notes()
    return ok(
        {
            "total_notes": len(notes),
            "indexed_notes": len(notes),
            "total_chunks": estimate_chunks(notes),
            "embedding_model": "local-scan",
            "last_indexed": scanner.last_indexed,
        }
    )


@app.route("/api/chat/stats", methods=["GET", "OPTIONS"])
def chat_stats():
    return ok({"questions_asked": 0, "avg_response_time_ms": 0, "active_sessions": 0})


@app.route("/api/chat/history", methods=["GET", "OPTIONS"])
def chat_history():
    return ok({"history": []})


@app.route("/api/chat/chat", methods=["GET", "OPTIONS"])
def chat_chat():
    return ok(
        {
            "answer": "Chat RAG is not yet connected. The gateway is live and reading your vault.",
            "sources": [],
            "session": request.args.get("session", ""),
        }
    )


@app.route("/api/bookmarks/stats", methods=["GET", "OPTIONS"])
def bookmarks_stats():
    return ok(scanner.get_bookmark_stats())


@app.route("/api/bookmarks/capture", methods=["POST", "OPTIONS"])
def bookmarks_capture():
    data = request_json()
    url = request.args.get("url") or data.get("url") or ""
    title = request.args.get("title") or data.get("title") or url or "Captured Bookmark"
    tags = request.args.get("tags") or data.get("tags") or ["bookmark", "captured"]
    tag_list = sorted(set(normalize_tags(tags) + ["bookmark", "captured"]))
    content = f"Source: {url}\n\nCaptured at: {iso_utc()}\n"
    note = scanner.save_note("Inbox", title, content, tag_list)
    return ok({"status": "ok", "message": "Bookmark captured", "note": summarize_note(note)})


@app.route("/api/graph/graph", methods=["GET", "OPTIONS"])
def graph_graph():
    max_nodes = clamp_int(request.args.get("max_nodes"), 250, minimum=1, maximum=1000)
    return ok(graph_builder.build_graph(scanner.get_all_notes(), max_nodes=max_nodes))


@app.route("/api/stats/growth", methods=["GET", "OPTIONS"])
def stats_growth():
    days = clamp_int(request.args.get("days"), 7, minimum=1, maximum=365)
    return ok(scanner.get_growth_data(days=days))


@app.route("/api/stats/activity", methods=["GET", "OPTIONS"])
def stats_activity():
    n = clamp_int(request.args.get("n"), 20, minimum=0, maximum=200)
    return ok({"events": scanner.get_recent_activity(n=n)})


@app.route("/api/notes/list", methods=["GET", "OPTIONS"])
def notes_list():
    folder = request.args.get("folder", "all")
    limit = clamp_int(request.args.get("limit"), 500, minimum=1, maximum=2000)
    notes = scanner.get_all_notes()
    if folder.lower() != "all":
        folder_norm = folder.strip("/\\").lower()
        notes = [
            note
            for note in notes
            if note.get("folder", "").lower() == folder_norm
            or note.get("file", "").lower().startswith(f"{folder_norm}/")
        ]
    notes = sorted(notes, key=lambda note: note.get("modified", ""), reverse=True)
    return ok({"notes": [summarize_note(note) for note in notes[:limit]], "total": len(notes), "folder": folder})


@app.route("/api/notes/content", methods=["GET", "OPTIONS"])
def notes_content():
    file_path = request.args.get("file", "")
    note = scanner.get_note_content(file_path)
    if not note:
        return ok({"error": "Note not found", "file": file_path}, status=404)
    return ok(note)


@app.route("/api/notes/braindump", methods=["POST", "OPTIONS"])
def notes_braindump():
    data = request_json()
    title = data.get("title") or f"Braindump {datetime.now(timezone.utc).strftime('%Y-%m-%d %H%M%S')}"
    content = data.get("content") or ""
    tags = data.get("tags") or ["braindump"]
    note = scanner.save_note("Inbox", title, content, tags)
    return ok({"status": "ok", "message": "Braindump saved", "note": summarize_note(note)})


@app.route("/api/health/workflows", methods=["GET", "OPTIONS"])
def health_workflows():
    return ok(fetch_n8n_workflows())


@app.route("/api/health/vault-tags", methods=["GET", "OPTIONS"])
def health_vault_tags():
    return ok(scanner.get_tags_summary())


@app.route("/api/rag/search", methods=["GET", "OPTIONS"])
def rag_search():
    q = request.args.get("q", "")
    n = clamp_int(request.args.get("n"), 8, minimum=0, maximum=100)
    return ok({"results": scanner.search_notes(q, n=n)})


@app.route("/api/rag/index", methods=["POST", "OPTIONS"])
def rag_index():
    force = request.args.get("force", "false").lower() == "true"
    notes = scanner.get_all_notes(force=force)
    if not force:
        notes = scanner.refresh()
    return ok({"status": "ok", "message": "Cache refreshed", "notes_indexed": len(notes)})


@app.route("/api/health/vault-quality", methods=["GET", "OPTIONS"])
def health_vault_quality():
    return ok(vault_quality())


@app.route("/api/health/pawsitiveid-research", methods=["GET", "OPTIONS"])
def health_pawsitiveid_research():
    return ok({"status": "ok", "notes": 0, "coverage": []})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "9888"))
    app.run(host="0.0.0.0", port=port)
