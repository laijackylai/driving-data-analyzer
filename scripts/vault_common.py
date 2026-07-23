"""Shared helpers for the vault automation scripts.

Standard library only, on purpose: this operating system must not require installing
third-party packages just to validate or maintain itself. Implements a minimal YAML-frontmatter
subset (flat keys, inline `[a, b]` lists, block `- item` lists, quoted/unquoted scalars,
null/true/false, bare date strings) — enough for every frontmatter block used in this repo.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?", re.DOTALL)

TASK_STATUSES = [
    "draft",
    "ready",
    "active",
    "blocked",
    "implementation-complete",
    "qa-review",
    "changes-requested",
    "approved",
    "released",
]

TASK_PRIORITIES = ["P0", "P1", "P2", "P3"]

# Valid forward/back edges in the task lifecycle graph (CLAUDE.md / README.md are the narrative
# source of truth; this is its executable form).
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"ready"},
    "ready": {"active"},
    "active": {"blocked", "implementation-complete"},
    "blocked": {"active"},
    "implementation-complete": {"qa-review"},
    "qa-review": {"approved", "changes-requested"},
    "changes-requested": {"active"},
    "approved": {"released"},
    "released": set(),
}

REVIEW_REQUIRED_STATUSES = {"qa-review", "changes-requested", "approved", "released"}

TASK_ID_RE = re.compile(r"^TASK-\d{3,}$")


def is_valid_transition(old: str, new: str) -> bool:
    """True if moving a task from `old` status to `new` status is a legal lifecycle edge.

    A no-op (old == new) is always considered valid so re-saving an unchanged file never fails.
    """
    if old == new:
        return True
    return new in ALLOWED_TRANSITIONS.get(old, set())


def _scalar(val: str) -> Any:
    val = val.strip()
    if val.startswith("[") and val.endswith("]"):
        inner = val[1:-1].strip()
        if not inner:
            return []
        return [_scalar(x.strip()) for x in _split_top_level(inner)]
    if len(val) >= 2 and val[0] == val[-1] and val[0] in ("'", '"'):
        return val[1:-1]
    if val in ("null", "~", ""):
        return None
    if val == "true":
        return True
    if val == "false":
        return False
    if re.match(r"^-?\d+$", val):
        return int(val)
    if re.match(r"^-?\d+\.\d+$", val):
        return float(val)
    return val


def _split_top_level(s: str) -> list[str]:
    parts, depth, cur = [], 0, ""
    for ch in s:
        if ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return parts


def parse_simple_yaml(fm_text: str) -> dict[str, Any]:
    data: dict[str, Any] = {}
    lines = fm_text.split("\n")
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if not line.strip() or line.strip().startswith("#"):
            i += 1
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", line)
        if not m:
            i += 1
            continue
        key, val = m.group(1), m.group(2).strip()
        if val == "":
            items = []
            j = i + 1
            while j < n and re.match(r"^\s+-\s*", lines[j]):
                item = re.sub(r"^\s+-\s*", "", lines[j]).strip()
                items.append(_scalar(item))
                j += 1
            if items:
                data[key] = items
                i = j
                continue
            data[key] = None
            i += 1
            continue
        data[key] = _scalar(val)
        i += 1
    return data


def split_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """Return (frontmatter_dict, body). Empty dict if no frontmatter block is present."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    return parse_simple_yaml(m.group(1)), text[m.end():]


def read_frontmatter(path: Path) -> tuple[dict[str, Any], str]:
    return split_frontmatter(path.read_text(encoding="utf-8"))


WIKILINK_RE = re.compile(r"\[\[([^\]\|#]+)(?:#[^\]\|]*)?(?:\\?\|[^\]]*)?\]\]")
MDLINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")


def find_wikilinks(text: str) -> list[str]:
    # A wikilink alias inside a Markdown table cell is written `\|alias` so the table parser
    # doesn't treat the pipe as a column separator; strip that trailing backslash from the target.
    return [m.group(1).strip().rstrip("\\") for m in WIKILINK_RE.finditer(text)]


def find_md_links(text: str) -> list[str]:
    return [m.group(1).strip() for m in MDLINK_RE.finditer(text)]


def wikilink_resolves(vault_root: Path, file_path: Path, target: str) -> bool:
    """Mimic Obsidian's forgiving link resolution: exact relative path, then vault-root-relative,
    then a basename/suffix match anywhere in the vault. Ambiguous matches count as resolved.
    """
    target = target.strip()
    if not target:
        return True
    if not target.endswith(".md"):
        target_md = target + ".md"
    else:
        target_md = target

    candidate = (file_path.parent / target_md)
    if candidate.exists():
        return True
    candidate2 = (vault_root / target_md)
    if candidate2.exists():
        return True

    target_parts = tuple(part for part in Path(target_md).parts if part not in (".", ".."))
    if not target_parts:
        return False
    for p in vault_root.rglob("*.md"):
        if p.parts[-len(target_parts):] == target_parts:
            return True
    return False


def md_link_resolves(file_path: Path, target: str) -> bool:
    """Only checks local relative file links; skips URLs, mailto, and pure anchors."""
    if not target or target.startswith("#"):
        return True
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.\-]*:", target):  # scheme:// or mailto: etc.
        return True
    target = target.split("#")[0]
    if not target:
        return True
    candidate = (file_path.parent / target)
    return candidate.exists()


SECRET_PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----"),
    re.compile(r"(?im)^\s*[\w.\-]*(secret|token|api[_-]?key|password|passwd)[\w.\-]*\s*[:=]\s*['\"]([A-Za-z0-9+/_\-]{20,})['\"]"),
    re.compile(r"(?i)sk-[A-Za-z0-9]{20,}"),
]


def find_secret_matches(text: str) -> list[str]:
    hits = []
    for pat in SECRET_PATTERNS:
        for m in pat.finditer(text):
            hits.append(m.group(0)[:60])
    return hits
