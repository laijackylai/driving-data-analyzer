#!/usr/bin/env python3
"""Create a properly structured task file under vault/05-tasks/.

Standard library only. Rejects malformed task IDs and duplicate task IDs (a task_id already used
by any file under vault/05-tasks/**). Writes a file matching vault/_templates/task-template.md's
structure with the given metadata filled in and every other section left for its owner to
complete.

Usage:
    python3 scripts/create-task.py --id TASK-101 --title "Add login form" \\
        --owner frontend-developer --reviewer qa-engineer --priority P1 \\
        --dependencies TASK-100 [--output vault/05-tasks/active/TASK-101-add-login-form.md] \\
        [--root .]
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import vault_common as vc  # noqa: E402


class CreateTaskError(Exception):
    pass


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "task"


def existing_task_ids(root: Path) -> dict[str, Path]:
    ids: dict[str, Path] = {}
    tasks_dir = root / "vault" / "05-tasks"
    if not tasks_dir.exists():
        return ids
    for sub in ("active", "blocked", "review", "completed"):
        d = tasks_dir / sub
        if not d.exists():
            continue
        for path in sorted(d.rglob("*.md")):
            fm, _ = vc.read_frontmatter(path)
            tid = fm.get("task_id")
            if tid:
                ids[tid] = path.relative_to(root)
    return ids


def render_task(
    task_id: str,
    title: str,
    owner: str,
    reviewer: str,
    priority: str,
    dependencies: list[str],
    today: str,
) -> str:
    deps_yaml = "[]" if not dependencies else "[" + ", ".join(dependencies) + "]"
    reviewer_line = reviewer if reviewer else ""
    return f"""---
doc_type: task
task_id: {task_id}
title: {title}
status: draft
owner: {owner}
reviewer: {reviewer_line}
priority: {priority}
dependencies: {deps_yaml}
created: {today}
updated: {today}
related: []
---

# {task_id}: {title}

## Objective
<Fill in: what must be true when this task is done.>

## Background
<Why this task exists. Link the approved requirement/ADR it derives from.>
- Requirement: [[../../00-product/requirements]]

## Context manifest
- **Required files** (must read before acting): <list>
- **Optional reference files**: <list>
- **Explicitly excluded areas**: <list>
- **Expected outputs**: <files this task must produce/modify>
- **Maximum write scope**: <exact paths this owner may write>

## In scope
- <bullet list>

## Out of scope
- <bullet list>

## Acceptance criteria
- [ ] <testable criterion 1>

## Interfaces / contracts
<Link or quote the exact contract this task must satisfy.>

## Write scope
<Exact file/path globs this task's owner may modify.>

## Test requirements
- <unit/integration/contract/accessibility/smoke as applicable>

## Security considerations
- <or "none identified" with reasoning>

## Assumptions
- <explicit assumptions>

## Blockers
- none

## Implementation evidence
<Filled in by the developer.>

## QA evidence
<Filled in by qa-engineer.>

## Approval history
| Date | Decision | By | Notes |
|------|----------|----|-------|
| {today} | created (draft) | orchestrator | via scripts/create-task.py |

## Handoff notes
<Use vault/_templates/handoff-template.md format. Most recent handoff first.>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", required=True, dest="task_id", help="Task ID, e.g. TASK-101")
    parser.add_argument("--title", required=True)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--reviewer", default="")
    parser.add_argument("--priority", default="P2", choices=vc.TASK_PRIORITIES)
    parser.add_argument(
        "--dependencies", default="", help="Comma-separated task IDs, e.g. TASK-001,TASK-002"
    )
    parser.add_argument("--output", default=None, help="Output path (default: auto-generated)")
    parser.add_argument("--root", default=".", help="Repository root (default: cwd)")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    if not vc.TASK_ID_RE.match(args.task_id):
        print(f"ERROR: malformed task id '{args.task_id}' (expected e.g. TASK-101)")
        return 1

    existing = existing_task_ids(root)
    if args.task_id in existing:
        print(f"ERROR: duplicate task id '{args.task_id}' already used by {existing[args.task_id]}")
        return 1

    dependencies = [d.strip() for d in args.dependencies.split(",") if d.strip()]
    for dep in dependencies:
        if not vc.TASK_ID_RE.match(dep):
            print(f"ERROR: malformed dependency id '{dep}'")
            return 1

    if args.output:
        output = Path(args.output)
        if not output.is_absolute():
            output = root / output
    else:
        slug = slugify(args.title)
        output = root / "vault" / "05-tasks" / "active" / f"{args.task_id}-{slug}.md"

    if output.exists():
        print(f"ERROR: output path already exists: {output}")
        return 1

    content = render_task(
        task_id=args.task_id,
        title=args.title,
        owner=args.owner,
        reviewer=args.reviewer,
        priority=args.priority,
        dependencies=dependencies,
        today=date.today().isoformat(),
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")
    print(f"OK: created {output.relative_to(root) if output.is_relative_to(root) else output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
