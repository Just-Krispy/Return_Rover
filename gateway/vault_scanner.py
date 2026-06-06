import os
import re
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
TTL_SECONDS = 600


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_utc(timestamp=None) -> str:
    if timestamp is None:
        dt = utc_now()
    elif isinstance(timestamp, datetime):
        dt = timestamp.astimezone(timezone.utc)
    else:
        dt = datetime.fromtimestamp(timestamp, timezone.utc)
    return dt.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_tags(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        raw_tags = re.split(r"[,\s]+", value)
    elif isinstance(value, (list, tuple, set)):
        raw_tags = []
        for item in value:
            if isinstance(item, str):
                raw_tags.extend(re.split(r"[,\s]+", item))
            else:
                raw_tags.append(str(item))
    else:
        raw_tags = [str(value)]
    return sorted({tag.strip().lstrip("#") for tag in raw_tags if tag and tag.strip()})


def safe_title_to_filename(title: str) -> str:
    clean = re.sub(r"[\\/:*?\"<>|]+", "-", title).strip()
    clean = re.sub(r"\s+", " ", clean)
    return clean or f"Untitled {iso_utc()}"


class VaultScanner:
    def __init__(self, vault_path=None, ttl_seconds=TTL_SECONDS):
        self.vault_path = Path(vault_path or os.environ.get("VAULT_PATH", "~/The-Vault")).expanduser()
        self.ttl_seconds = ttl_seconds
        self._cache = None
        self._cache_time = 0.0
        self._last_indexed = iso_utc(0)

    def refresh(self) -> list[dict[str, Any]]:
        notes = self._scan()
        self._cache = notes
        self._cache_time = time.time()
        if notes:
            self._last_indexed = max(note["modified"] for note in notes)
        else:
            self._last_indexed = iso_utc()
        return notes

    def get_all_notes(self, force: bool = False) -> list[dict[str, Any]]:
        if force or self._cache is None or (time.time() - self._cache_time) > self.ttl_seconds:
            return self.refresh()
        return self._cache

    @property
    def last_indexed(self) -> str:
        self.get_all_notes()
        return self._last_indexed

    def get_notes_by_folder(self, folder: str, limit: int = 500) -> list[dict[str, Any]]:
        notes = self.get_all_notes()
        if folder and folder.lower() != "all":
            folder_norm = folder.strip("/\\").lower()
            notes = [
                note
                for note in notes
                if note["folder"].lower() == folder_norm
                or note["file"].lower().startswith(f"{folder_norm}/")
            ]
        return sorted(notes, key=lambda note: note["modified"], reverse=True)[:limit]

    def get_note_content(self, file_path: str):
        safe_path = self._resolve_note_path(file_path)
        if not safe_path or not safe_path.exists() or safe_path.suffix.lower() != ".md":
            return None
        raw = safe_path.read_text(encoding="utf-8", errors="replace")
        frontmatter, body = self._parse_frontmatter(raw)
        relative = self._relative_path(safe_path)
        stat = safe_path.stat()
        title = str(frontmatter.get("title") or safe_path.stem)
        return {
            "file": relative,
            "title": title,
            "content": body,
            "frontmatter": frontmatter,
            "modified": iso_utc(stat.st_mtime),
        }

    def get_recent_activity(self, n: int = 20) -> list[dict[str, Any]]:
        notes = sorted(self.get_all_notes(), key=lambda note: note["modified"], reverse=True)[: max(n, 0)]
        events = []
        for note in notes:
            event_type = "capture" if self._is_bookmark(note) else "edit"
            if abs(note.get("modified_ts", 0) - note.get("created_ts", 0)) < 2:
                event_type = "ingest"
            title = note["title"]
            events.append(
                {
                    "type": event_type,
                    "text": f"Ingested <strong>{title}</strong>" if event_type == "ingest" else f"Updated <strong>{title}</strong>",
                    "timestamp": note["modified"],
                    "file": note["file"],
                }
            )
        return events

    def get_growth_data(self, days: int = 7) -> dict[str, Any]:
        days = max(1, min(days, 365))
        notes = self.get_all_notes()
        today = utc_now().date()
        modified_counts = Counter()
        for note in notes:
            dt = datetime.fromtimestamp(note.get("modified_ts", 0), timezone.utc).date()
            modified_counts[dt.isoformat()] += 1
        daily = []
        total = len(notes)
        for offset in range(days - 1, -1, -1):
            day = today - timedelta(days=offset)
            daily.append({"date": day.isoformat(), "count": total - sum(v for k, v in modified_counts.items() if k > day.isoformat())})
        return {"daily": daily, "total_notes": total}

    def get_tags_summary(self) -> dict[str, Any]:
        notes = self.get_all_notes()
        counter: Counter[str] = Counter()
        notes_with_tags = 0
        for note in notes:
            tags = note.get("tags", [])
            if tags:
                notes_with_tags += 1
                counter.update(tags)
        return {
            "top_tags": counter.most_common(25),
            "unique_tags": len(counter),
            "notes_with_tags": notes_with_tags,
            "total_notes": len(notes),
        }

    def search_notes(self, query: str, n: int = 8) -> list[dict[str, Any]]:
        query = (query or "").strip()
        if not query:
            return []
        terms = [term.lower() for term in re.findall(r"\w+", query)]
        if not terms:
            return []
        # Use subprocess grep for fast file-based search (avoid holding 8K+ notes in memory)
        import subprocess
        try:
            grep_pattern = "|".join(re.escape(t) for t in terms)
            result = subprocess.run(
                ["grep", "-rl", "-E", grep_pattern, str(self.vault_path)],
                capture_output=True, text=True, timeout=10
            )
            matching_files = set()
            for line in (result.stdout or "").strip().splitlines():
                p = Path(line.strip())
                if p.suffix.lower() == ".md":
                    matching_files.add(self._relative_path(p))
        except (subprocess.TimeoutExpired, OSError):
            matching_files = set()

        # Score matches against cached metadata
        results = []
        for note in self.get_all_notes():
            if note["file"] not in matching_files:
                continue
            haystack = f"{note.get('title', '')} {note.get('content', '')}".lower()
            score = sum(haystack.count(term) for term in terms)
            snippet = self._make_snippet(note.get("content", ""), terms[0])
            results.append(
                {
                    "file": note["file"],
                    "title": note["title"],
                    "snippet": snippet,
                    "score": float(score),
                }
            )
        return sorted(results, key=lambda item: item["score"], reverse=True)[: max(n, 0)]

    def get_bookmark_stats(self) -> dict[str, Any]:
        notes = self.get_all_notes()
        today = utc_now().date()
        bookmarks = [note for note in notes if self._is_bookmark(note)]
        today_count = sum(
            1
            for note in bookmarks
            if datetime.fromtimestamp(note.get("created_ts", 0), timezone.utc).date() == today
        )
        return {
            "total_captured": len(bookmarks),
            "today": today_count,
            "vault_inbox": str(self.vault_path / "Inbox"),
        }

    def save_note(self, folder: str, title: str, content: str, tags=None) -> dict[str, Any]:
        folder = folder.strip("/\\") if folder else "Inbox"
        target_dir = (self.vault_path / folder).resolve()
        if not self._is_inside_vault(target_dir):
            raise ValueError("Folder must stay inside vault")
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{safe_title_to_filename(title)}.md"
        path = target_dir / filename
        counter = 2
        while path.exists():
            path = target_dir / f"{safe_title_to_filename(title)}-{counter}.md"
            counter += 1
        tag_list = normalize_tags(tags)
        frontmatter = {
            "title": title,
            "tags": tag_list,
            "date": iso_utc(),
        }
        yaml_text = yaml.safe_dump(frontmatter, sort_keys=False, allow_unicode=True).strip()
        path.write_text(f"---\n{yaml_text}\n---\n\n{content or ''}\n", encoding="utf-8")
        self.refresh()
        return self.get_note_content(self._relative_path(path)) or {"file": self._relative_path(path), "title": title}

    def _scan(self) -> list[dict[str, Any]]:
        if not self.vault_path.exists():
            return []
        notes = []
        for root, dirs, files in os.walk(self.vault_path):
            dirs[:] = [d for d in dirs if not d.startswith(".")]
            for filename in files:
                if not filename.lower().endswith(".md"):
                    continue
                path = Path(root) / filename
                try:
                    raw = path.read_text(encoding="utf-8", errors="replace")
                    frontmatter, body = self._parse_frontmatter(raw)
                    stat = path.stat()
                    relative = self._relative_path(path)
                    links = self._extract_wikilinks(body)
                    title = str(frontmatter.get("title") or path.stem)
                    tags = normalize_tags(frontmatter.get("tags") or frontmatter.get("tag"))
                    folder = relative.split("/", 1)[0] if "/" in relative else ""
                    # Don't cache full content in memory — too expensive for 8K+ notes
                    # Content is loaded on-demand by get_note_content()
                    notes.append(
                        {
                            "file": relative,
                            "path": str(path),
                            "title": title,
                            "folder": folder,
                            "tags": tags,
                            "date": self._stringify_date(frontmatter.get("date")),
                            "frontmatter": frontmatter,
                            "links": links,
                            "wikilinks": links,
                            "modified": iso_utc(stat.st_mtime),
                            "created": iso_utc(stat.st_ctime),
                            "modified_ts": stat.st_mtime,
                            "created_ts": stat.st_ctime,
                            "size": stat.st_size,
                            "content": body[:500],  # Truncated for snippets; full content via get_note_content()
                            # Don't store full search text in memory — search uses file grep on demand
                        }
                    )
                except OSError:
                    continue
        return notes

    def _parse_frontmatter(self, raw: str):
        match = FRONTMATTER_RE.match(raw)
        if not match:
            return {}, raw
        frontmatter_text = match.group(1)
        body = raw[match.end():]
        try:
            parsed = yaml.safe_load(frontmatter_text) or {}
            if not isinstance(parsed, dict):
                parsed = {}
        except yaml.YAMLError:
            parsed = {}
        return parsed, body

    def _extract_wikilinks(self, content: str) -> list[str]:
        links = []
        for match in WIKILINK_RE.findall(content or ""):
            target = match.split("|", 1)[0].split("#", 1)[0].strip()
            if target:
                links.append(target)
        return sorted(set(links))

    def _relative_path(self, path: Path) -> str:
        return path.resolve().relative_to(self.vault_path.resolve()).as_posix()

    def _resolve_note_path(self, file_path: str):
        if not file_path:
            return None
        candidate = (self.vault_path / file_path).resolve()
        if not self._is_inside_vault(candidate):
            return None
        return candidate

    def _is_inside_vault(self, path: Path) -> bool:
        try:
            path.resolve().relative_to(self.vault_path.resolve())
            return True
        except ValueError:
            return False

    def _is_bookmark(self, note: dict[str, Any]) -> bool:
        text = " ".join(
            [
                note.get("file", ""),
                note.get("title", ""),
                str(note.get("frontmatter", {}).get("type", "")),
                str(note.get("frontmatter", {}).get("source", "")),
            ]
        ).lower()
        return "bookmark" in text or "captured" in text

    def _make_snippet(self, content: str, term: str, width: int = 180) -> str:
        content = re.sub(r"\s+", " ", content or "").strip()
        lower = content.lower()
        index = lower.find(term.lower())
        if index < 0:
            return content[:width]
        start = max(0, index - width // 2)
        end = min(len(content), start + width)
        return content[start:end]

    def _stringify_date(self, value):
        if value is None:
            return None
        if isinstance(value, datetime):
            return iso_utc(value)
        return str(value)
