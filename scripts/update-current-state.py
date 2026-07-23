#!/usr/bin/env python3
"""Rebuild the auto-generated section of vault/CURRENT_STATE.md from task frontmatter.

Standard library only. Never touches manually maintained project context: everything before the
`BEGIN AUTO-GENERATED` marker and after the `END AUTO-GENERATED` marker is preserved byte-for-byte.
If the markers are missing (e.g. a hand-edited file that dropped them), this script refuses to
guess and exits non-zero instead of silently deleting manual content.

Usage:
    python3 scripts/update-current-state.py [--root .]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import vault_common as vc  # noqa: E402

BEGIN_MARKER = "<!-- BEGIN AUTO-GENERATED: DO NOT EDIT BELOW THIS LINE -->"
END_MARKER = "<!-- END AUTO-GENERATED -->"

STATUS_GROUPS = [
    ("active", ["active", "ready"]),
    ("blocked", ["blocked"]),
    ("in review", ["implementation-complete", "qa-review", "changes-requested"]),
    ("approved / released", ["approved", "released"]),
]


def collect_tasks(root: Path) -> list[dict]:
    tasks_dir = root / "vault" / "05-tasks"
    out = []
    if not tasks_dir.exists():
        return out
    for sub in ("active", "blocked", "review", "completed"):
        d = tasks_dir / sub
        if not d.exists():
            continue
        for path in sorted(d.rglob("*.md")):
            fm, _ = vc.read_frontmatter(path)
            if fm.get("doc_type") != "task":
                continue
            fm["_path"] = path.relative_to(root).as_posix()
            fm["_folder"] = sub
            out.append(fm)
    return out


def render_auto_section(tasks: list[dict]) -> str:
    lines = [BEGIN_MARKER, ""]
    lines.append(f"_Last rebuilt by `scripts/update-current-state.py`. {len(tasks)} task file(s) found._")
    lines.append("")

    by_status: dict[str, list[dict]] = {}
    for t in tasks:
        by_status.setdefault(t.get("status", "unknown"), []).append(t)

    for label, statuses in STATUS_GROUPS:
        rows = [t for s in statuses for t in by_status.get(s, [])]
        lines.append(f"### {label.capitalize()} ({len(rows)})")
        if not rows:
            lines.append("_None._")
        else:
            lines.append("| Task | Title | Status | Owner | Reviewer | Priority | Path |")
            lines.append("|------|-------|--------|-------|----------|----------|------|")
            for t in sorted(rows, key=lambda x: x.get("task_id", "")):
                lines.append(
                    f"| {t.get('task_id','?')} | {t.get('title','')} | {t.get('status','')} | "
                    f"{t.get('owner','')} | {t.get('reviewer') or '—'} | {t.get('priority','')} | "
                    f"`{t.get('_path','')}` |"
                )
        lines.append("")

    known_statuses = {s for _, statuses in STATUS_GROUPS for s in statuses}
    other = [t for t in tasks if t.get("status") not in known_statuses]
    if other:
        lines.append(f"### Other / draft ({len(other)})")
        for t in sorted(other, key=lambda x: x.get("task_id", "")):
            lines.append(f"- {t.get('task_id','?')} — {t.get('title','')} ({t.get('status','')})")
        lines.append("")

    lines.append(END_MARKER)
    return "\n".join(lines)


def update_current_state(root: Path) -> str:
    path = root / "vault" / "CURRENT_STATE.md"
    if not path.exists():
        raise SystemExit(f"ERROR: {path} does not exist")

    text = path.read_text(encoding="utf-8")
    if BEGIN_MARKER not in text or END_MARKER not in text:
        raise SystemExit(
            f"ERROR: {path} is missing the AUTO-GENERATED markers; refusing to guess where "
            "manual content ends. Restore the markers (see vault/_templates) before rerunning."
        )

    before, rest = text.split(BEGIN_MARKER, 1)
    _, after = rest.split(END_MARKER, 1)

    tasks = collect_tasks(root)
    new_section = render_auto_section(tasks)

    new_text = before + new_section + after
    path.write_text(new_text, encoding="utf-8")
    return new_text


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root (default: cwd)")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    update_current_state(root)
    print(f"OK: rebuilt auto-generated section of vault/CURRENT_STATE.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
