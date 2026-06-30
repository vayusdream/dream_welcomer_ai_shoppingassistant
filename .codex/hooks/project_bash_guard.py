#!/usr/bin/env python3
import json
import re
import sys


def load_payload() -> dict:
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def command_from(payload: dict) -> str:
    tool_input = payload.get("tool_input") or {}
    return (
        tool_input.get("command")
        or tool_input.get("cmd")
        or payload.get("command")
        or payload.get("cmd")
        or ""
    )


def emit(obj: dict) -> None:
    print(json.dumps(obj))


def deny(reason: str) -> None:
    emit({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    })


def add_context(message: str) -> None:
    emit({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": message,
        }
    })


def main() -> None:
    payload = load_payload()
    command = command_from(payload)
    compact = re.sub(r"\s+", " ", command).strip()
    lowered = compact.lower()

    dependency_drift_patterns = [
        r"\bnpm\s+(?:install|i|add|remove|uninstall|update)\b",
        r"\byarn\s+(?:add|remove|install|upgrade|up|set\s+version)\b",
        r"\bbun\s+(?:add|remove|install|update)\b",
    ]

    for pattern in dependency_drift_patterns:
        if re.search(pattern, lowered):
            deny(
                "dream_welcomer is locked to pnpm@9.15.9. Use pnpm add/remove/install "
                "so pnpm-lock.yaml stays authoritative."
            )
            return

    if re.search(r"\b(?:npm\s+run|npx|yarn\s+run|bun\s+run)\b", lowered):
        add_context(
            "dream_welcomer uses pnpm@9.15.9; prefer pnpm scripts such as "
            "`pnpm build`, `pnpm dev`, or `pnpm lint`."
        )


if __name__ == "__main__":
    main()
