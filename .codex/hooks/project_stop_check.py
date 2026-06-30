#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WATCHED_PREFIXES = ("src/",)
WATCHED_FILES = {
    "package.json",
    "pnpm-lock.yaml",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
}
STATE_FILE = ROOT / ".codex/hooks/.state/stop-check-state.json"


def emit(obj: dict) -> None:
    print(json.dumps(obj))
    sys.exit(0)


def run(args: list[str], timeout: int) -> tuple[int | None, str, str, bool]:
    try:
        result = subprocess.run(
            args,
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        return result.returncode, result.stdout, result.stderr, False
    except subprocess.TimeoutExpired as exc:
        return None, exc.stdout or "", exc.stderr or "", True
    except Exception as exc:
        return None, "", str(exc), False


def truncate(text: str, limit: int = 6000) -> str:
    clean = text.strip()
    if len(clean) <= limit:
        return clean
    return clean[:limit] + "\n... output truncated ..."


def is_inside_project(payload: dict) -> bool:
    raw_cwd = payload.get("cwd") or os.getcwd()
    try:
        Path(raw_cwd).resolve().relative_to(ROOT.resolve())
        return True
    except Exception:
        return False


def is_watched(path: str) -> bool:
    return path in WATCHED_FILES or path.startswith(WATCHED_PREFIXES)


def watched_paths() -> list[Path]:
    paths: list[Path] = []
    for relative in WATCHED_FILES:
        path = ROOT / relative
        if path.exists():
            paths.append(path)

    src = ROOT / "src"
    if src.exists():
        for path in src.rglob("*"):
            if path.is_file() and path.suffix in {".ts", ".tsx", ".js", ".jsx", ".css", ".json"}:
                paths.append(path)

    return paths


def load_last_checked() -> float:
    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return float(data.get("last_checked_mtime", 0))
    except Exception:
        return 0.0


def save_last_checked(value: float) -> None:
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps({"last_checked_mtime": value, "updated_at": time.time()}) + "\n", encoding="utf-8")
    except Exception:
        pass


def newest_mtime(paths: list[Path]) -> float:
    newest = 0.0
    for path in paths:
        try:
            newest = max(newest, path.stat().st_mtime)
        except OSError:
            pass
    return newest


def files_changed_since(paths: list[Path], last_checked: float) -> list[Path]:
    changed: list[Path] = []
    for path in paths:
        try:
            if path.stat().st_mtime > last_checked:
                changed.append(path)
        except OSError:
            continue
    return changed


def scan_conflict_markers(paths: list[Path]) -> list[str]:
    issues: list[str] = []
    markers = ("<<<<<<<", "=======", ">>>>>>>")
    for path in paths:
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        for index, line in enumerate(content.splitlines(), start=1):
            stripped = line.lstrip()
            if any(stripped.startswith(marker) for marker in markers):
                relative = path.relative_to(ROOT)
                issues.append(f"{relative}:{index}: possible merge conflict marker")
                break

    return issues


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    if payload.get("stop_hook_active"):
        emit({"continue": True})

    if not is_inside_project(payload):
        emit({"continue": True})

    paths = watched_paths()
    latest_mtime = newest_mtime(paths)
    last_checked = load_last_checked()
    changed = files_changed_since(paths, last_checked)
    if not changed:
        emit({"continue": True})

    marker_issues = scan_conflict_markers(changed)
    if marker_issues:
        emit({
            "decision": "block",
            "reason": (
                "dream_welcomer source/config files contain possible merge conflict markers. "
                "Fix these before final:\n\n"
                + "\n".join(marker_issues)
            ),
        })

    tsc = ROOT / "node_modules/.bin/tsc"
    if not tsc.exists():
        save_last_checked(latest_mtime)
        emit({
            "continue": True,
            "systemMessage": (
                "dream_welcomer Stop hook could not find node_modules/.bin/tsc; "
                "run pnpm install before relying on automatic type checks."
            ),
        })

    code, stdout, stderr, timed_out = run([str(tsc), "--noEmit", "--pretty", "false"], timeout=20)
    if timed_out:
        save_last_checked(latest_mtime)
        emit({
            "continue": True,
            "systemMessage": (
                "dream_welcomer Stop hook type check exceeded 20s and was skipped. "
                "Mention this if validation was expected."
            ),
        })
    if code not in (0, None):
        emit({
            "decision": "block",
            "reason": (
                "dream_welcomer TypeScript check failed. Fix these errors before final:\n\n"
                + truncate(stdout + stderr)
            ),
        })

    save_last_checked(latest_mtime)
    emit({"continue": True})


if __name__ == "__main__":
    main()
