#!/usr/bin/env python3
"""Validate the multi-agent operating system scaffold in this repository (or `--root PATH`).

Standard library only. Exits non-zero with readable diagnostics on any failure. Run after any
structural change to `.claude/`, `vault/`, `schemas/`, or the automation scripts themselves.

Checks performed (see README.md "How to run validation and tests" for the full list):
  - required files/folders exist
  - agent frontmatter is well-formed and names are unique
  - agent files contain every required section
  - task files match schemas/task.schema.json (fields, status enum, single owner, reviewer
    when required, dependency references exist, no duplicate task IDs)
  - optional per-task status_history obeys the lifecycle transition graph
  - approval-gate documents (QA reports for approved/released tasks, accepted ADRs, approved
    releases) carry the evidence the gate requires
  - Markdown/wikilinks in vault documents resolve to a real file
  - no obvious committed secrets or credential-shaped values
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import vault_common as vc  # noqa: E402

REQUIRED_PATHS = [
    "CLAUDE.md",
    "README.md",
    ".claude/settings.json",
    ".claude/agents/orchestrator.md",
    ".claude/agents/research-technical.md",
    ".claude/agents/research-critical.md",
    ".claude/agents/architect.md",
    ".claude/agents/ui-ux.md",
    ".claude/agents/frontend-developer.md",
    ".claude/agents/backend-developer.md",
    ".claude/agents/data-infrastructure-developer.md",
    ".claude/agents/qa-engineer.md",
    ".claude/agents/release-engineer.md",
    ".claude/commands/start-project.md",
    ".claude/commands/research.md",
    ".claude/commands/plan-feature.md",
    ".claude/commands/implement-task.md",
    ".claude/commands/review-task.md",
    ".claude/commands/release-check.md",
    "vault/HOME.md",
    "vault/CURRENT_STATE.md",
    "vault/00-product/vision.md",
    "vault/00-product/requirements.md",
    "vault/00-product/success-metrics.md",
    "vault/00-product/assumptions.md",
    "vault/01-research/README.md",
    "vault/01-research/templates",
    "vault/02-architecture/system-design.md",
    "vault/02-architecture/data-model.md",
    "vault/02-architecture/api-contracts.md",
    "vault/02-architecture/non-functional-requirements.md",
    "vault/02-architecture/templates",
    "vault/03-ui-ux/user-flows.md",
    "vault/03-ui-ux/design-system.md",
    "vault/03-ui-ux/accessibility.md",
    "vault/03-ui-ux/templates",
    "vault/04-decisions/README.md",
    "vault/04-decisions/ADR-template.md",
    "vault/05-tasks/BACKLOG.md",
    "vault/05-tasks/active",
    "vault/05-tasks/blocked",
    "vault/05-tasks/review",
    "vault/05-tasks/completed",
    "vault/06-implementation/README.md",
    "vault/07-qa/test-strategy.md",
    "vault/07-qa/traceability-matrix.md",
    "vault/07-qa/reports",
    "vault/08-releases/release-template.md",
    "vault/08-releases/rollback-template.md",
    "vault/09-retrospectives/retrospective-template.md",
    "scripts/validate-agent-system.py",
    "scripts/create-task.py",
    "scripts/update-current-state.py",
    "schemas/task.schema.json",
    "tests/test_agent_system.py",
]

REQUIRED_AGENT_SECTIONS = [
    "## Mission",
    "## Inputs",
    "## Required outputs",
    "## Allowed tools and write scope",
    "## Files it must read before acting",
    "## Files it may modify",
    "## Forbidden actions",
    "## Completion criteria",
    "## Handoff format",
    "## Escalation rules",
    "## Verification responsibilities",
]

CANONICAL_LINK_SCAN_DIRS = ["vault"]

TEXT_EXTENSIONS = {".md", ".json", ".py", ".txt", ".yml", ".yaml"}
SKIP_DIR_NAMES = {".git", "__pycache__", "node_modules", ".venv"}


class Diagnostics:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    @property
    def ok(self) -> bool:
        return not self.errors


def check_required_paths(root: Path, diag: Diagnostics) -> None:
    for rel in REQUIRED_PATHS:
        if not (root / rel).exists():
            diag.error(f"missing required path: {rel}")


def check_agents(root: Path, diag: Diagnostics) -> None:
    agents_dir = root / ".claude" / "agents"
    if not agents_dir.exists():
        return
    names: dict[str, Path] = {}
    for path in sorted(agents_dir.rglob("*.md")):
        fm, body = vc.read_frontmatter(path)
        rel = path.relative_to(root)
        if "name" not in fm or not fm.get("name"):
            diag.error(f"{rel}: missing required frontmatter field 'name'")
            continue
        if "description" not in fm or not fm.get("description"):
            diag.error(f"{rel}: missing required frontmatter field 'description'")
        name = fm["name"]
        if name in names:
            diag.error(f"{rel}: duplicate agent name '{name}' (also in {names[name]})")
        else:
            names[name] = rel
        for section in REQUIRED_AGENT_SECTIONS:
            if section not in body:
                diag.error(f"{rel}: agent definition missing required section '{section}'")


def check_commands(root: Path, diag: Diagnostics) -> None:
    commands_dir = root / ".claude" / "commands"
    if not commands_dir.exists():
        return
    for path in sorted(commands_dir.glob("*.md")):
        fm, _ = vc.read_frontmatter(path)
        rel = path.relative_to(root)
        if "description" not in fm or not fm.get("description"):
            diag.error(f"{rel}: missing required frontmatter field 'description'")


def _task_files(root: Path) -> list[Path]:
    tasks_dir = root / "vault" / "05-tasks"
    if not tasks_dir.exists():
        return []
    out = []
    for sub in ("active", "blocked", "review", "completed"):
        d = tasks_dir / sub
        if d.exists():
            out.extend(sorted(d.rglob("*.md")))
    return out


def check_tasks(root: Path, diag: Diagnostics) -> dict[str, Path]:
    task_ids: dict[str, Path] = {}
    all_files = _task_files(root)
    parsed: dict[Path, dict] = {}

    for path in all_files:
        fm, _ = vc.read_frontmatter(path)
        rel = path.relative_to(root)
        parsed[path] = fm

        if fm.get("doc_type") != "task":
            diag.error(f"{rel}: doc_type must be 'task'")
            continue

        task_id = fm.get("task_id")
        if not task_id or not isinstance(task_id, str) or not vc.TASK_ID_RE.match(task_id):
            diag.error(f"{rel}: malformed or missing task_id '{task_id}'")
        else:
            if task_id in task_ids:
                diag.error(
                    f"{rel}: duplicate task_id '{task_id}' (also used by {task_ids[task_id]})"
                )
            else:
                task_ids[task_id] = rel

        if not fm.get("title"):
            diag.error(f"{rel}: missing required field 'title'")

        status = fm.get("status")
        if status not in vc.TASK_STATUSES:
            diag.error(f"{rel}: invalid status '{status}' (must be one of {vc.TASK_STATUSES})")

        owner = fm.get("owner")
        if not owner or not isinstance(owner, str) or isinstance(owner, list):
            diag.error(f"{rel}: task must have exactly one owner (string), got {owner!r}")

        priority = fm.get("priority")
        if priority not in vc.TASK_PRIORITIES:
            diag.error(f"{rel}: invalid priority '{priority}' (must be one of {vc.TASK_PRIORITIES})")

        reviewer = fm.get("reviewer")
        if status in vc.REVIEW_REQUIRED_STATUSES and not reviewer:
            diag.error(f"{rel}: status '{status}' requires a non-empty 'reviewer'")

        deps = fm.get("dependencies")
        if deps is None:
            diag.error(f"{rel}: missing required field 'dependencies' (use [] if none)")
        elif not isinstance(deps, list):
            diag.error(f"{rel}: 'dependencies' must be a list")

        for field in ("created", "updated"):
            v = fm.get(field)
            if not v or not isinstance(v, str) or not vc.re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                diag.error(f"{rel}: field '{field}' must be a YYYY-MM-DD date string, got {v!r}")

        history = fm.get("status_history")
        if isinstance(history, list) and len(history) >= 2:
            for a, b in zip(history, history[1:]):
                if not vc.is_valid_transition(a, b):
                    diag.error(
                        f"{rel}: invalid lifecycle transition in status_history: '{a}' -> '{b}'"
                    )

    # dependency references must exist
    for path, fm in parsed.items():
        rel = path.relative_to(root)
        for dep in fm.get("dependencies") or []:
            if not isinstance(dep, str) or not vc.TASK_ID_RE.match(dep):
                diag.error(f"{rel}: malformed dependency id '{dep}'")
            elif dep not in task_ids:
                diag.error(f"{rel}: dependency '{dep}' does not reference an existing task file")

    return task_ids


def check_approval_gates(root: Path, diag: Diagnostics, task_ids: dict[str, Path]) -> None:
    # Gate: task approved/released requires an existing QA report.
    for path in _task_files(root):
        fm, _ = vc.read_frontmatter(path)
        if fm.get("doc_type") != "task":
            continue
        status = fm.get("status")
        task_id = fm.get("task_id")
        if status in ("approved", "released") and task_id:
            qa_report = root / "vault" / "07-qa" / "reports" / f"{task_id}-qa-report.md"
            if not qa_report.exists():
                diag.error(
                    f"approval gate violation: {task_id} has status '{status}' but no QA report "
                    f"at vault/07-qa/reports/{task_id}-qa-report.md"
                )

    # Gate: accepted ADRs must record a decision date.
    decisions_dir = root / "vault" / "04-decisions"
    if decisions_dir.exists():
        for path in sorted(decisions_dir.glob("ADR-*.md")):
            if path.name == "ADR-template.md":
                continue
            fm, _ = vc.read_frontmatter(path)
            rel = path.relative_to(root)
            if fm.get("status") == "accepted" and not fm.get("decided"):
                diag.error(
                    f"approval gate violation: {rel} is 'accepted' but has no 'decided' date "
                    "recorded (architecture requires a recorded human decision)"
                )

    # Gate: releases marked human_approval:true must record who/when.
    releases_dir = root / "vault" / "08-releases"
    if releases_dir.exists():
        for path in sorted(releases_dir.glob("*.md")):
            if path.name in ("release-template.md", "rollback-template.md"):
                continue
            fm, _ = vc.read_frontmatter(path)
            rel = path.relative_to(root)
            if fm.get("doc_type") == "release" and fm.get("human_approval") is True:
                if not fm.get("human_approved_by") or not fm.get("human_approved_date"):
                    diag.error(
                        f"approval gate violation: {rel} has human_approval:true but is missing "
                        "human_approved_by/human_approved_date"
                    )


def check_links(root: Path, diag: Diagnostics) -> None:
    vault_root = root / "vault"
    if not vault_root.exists():
        return
    for path in sorted(vault_root.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(root)
        for target in vc.find_wikilinks(text):
            if not vc.wikilink_resolves(vault_root, path, target):
                diag.error(f"{rel}: broken wikilink [[{target}]]")
        for target in vc.find_md_links(text):
            if not vc.md_link_resolves(path, target):
                diag.error(f"{rel}: broken markdown link ({target})")

    readme = root / "README.md"
    if readme.exists():
        text = readme.read_text(encoding="utf-8")
        for target in vc.find_md_links(text):
            if not vc.md_link_resolves(readme, target):
                diag.warn(f"README.md: possibly broken link ({target})")


def check_secrets(root: Path, diag: Diagnostics) -> None:
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        if path.suffix not in TEXT_EXTENSIONS:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        hits = vc.find_secret_matches(text)
        if hits:
            rel = path.relative_to(root)
            for hit in hits:
                diag.error(f"{rel}: possible committed secret/credential: {hit!r}")


def run_validation(root: Path) -> Diagnostics:
    diag = Diagnostics()
    check_required_paths(root, diag)
    check_agents(root, diag)
    check_commands(root, diag)
    task_ids = check_tasks(root, diag)
    check_approval_gates(root, diag, task_ids)
    check_links(root, diag)
    check_secrets(root, diag)
    return diag


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root to validate (default: cwd)")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    diag = run_validation(root)

    for w in diag.warnings:
        print(f"WARNING: {w}")
    for e in diag.errors:
        print(f"ERROR: {e}")

    if diag.ok:
        print(f"OK: validation passed ({len(diag.warnings)} warning(s))")
        return 0
    print(f"FAILED: {len(diag.errors)} error(s), {len(diag.warnings)} warning(s)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
