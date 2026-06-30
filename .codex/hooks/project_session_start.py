#!/usr/bin/env python3
import json
import sys


def main() -> None:
    try:
        json.load(sys.stdin)
    except Exception:
        pass

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": (
                "dream_welcomer is a Next.js 15 / React 19 app using pnpm@9.15.9. "
                "Prefer pnpm commands and keep source work under src/. Project hooks "
                "guard against dependency-manager drift and run bounded stop checks "
                "for changed source/config files."
            ),
        }
    }))


if __name__ == "__main__":
    main()
