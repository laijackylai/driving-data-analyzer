"""Automated tests for the multi-agent operating system scaffold and its automation scripts.

Standard library only (unittest — no pytest/jsonschema dependency, matching the rest of this
repo's dependency-light philosophy). Tests that need a repository build a minimal fixture under
a temporary directory rather than modifying the real project state; a couple of tests exercise
the real repository read-only, since that is the delivered artifact under test.

Run with:
    python3 -m unittest discover -s tests -v
"""
from __future__ import annotations

import importlib.util as ilu
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = REPO_ROOT / "scripts"

sys.path.insert(0, str(SCRIPTS))
import vault_common as vc  # noqa: E402


def _load_module(name: str, path: Path):
    spec = ilu.spec_from_file_location(name, path)
    mod = ilu.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


validate_mod = _load_module("validate_agent_system", SCRIPTS / "validate-agent-system.py")


def run_py(script: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True,
        text=True,
    )


REQUIRED_AGENT_NAMES = [
    "orchestrator",
    "research-technical",
    "research-critical",
    "architect",
    "ui-ux",
    "frontend-developer",
    "backend-developer",
    "data-infrastructure-developer",
    "qa-engineer",
    "release-engineer",
]

COMMAND_NAMES = [
    "start-project",
    "research",
    "plan-feature",
    "implement-task",
    "review-task",
    "release-check",
]

AGENT_SECTIONS = "\n".join(f"{h}\ncontent" for h in validate_mod.REQUIRED_AGENT_SECTIONS)


def _write_agent(agents_dir: Path, name: str) -> None:
    (agents_dir / f"{name}.md").write_text(
        f"---\nname: {name}\ndescription: test agent {name}\n---\n\n{AGENT_SECTIONS}\n",
        encoding="utf-8",
    )


def build_minimal_repo(root: Path) -> None:
    """Smallest fixture that satisfies validate-agent-system.py's required-paths and agent/
    command checks, so each test can layer on the one thing it wants to break.
    """
    (root / ".claude" / "agents").mkdir(parents=True)
    (root / ".claude" / "commands").mkdir(parents=True)
    (root / ".claude" / "settings.json").write_text("{}\n", encoding="utf-8")

    for name in REQUIRED_AGENT_NAMES:
        _write_agent(root / ".claude" / "agents", name)

    for name in COMMAND_NAMES:
        (root / ".claude" / "commands" / f"{name}.md").write_text(
            f"---\ndescription: test command {name}\n---\n\nDo the {name} thing.\n",
            encoding="utf-8",
        )

    (root / "CLAUDE.md").write_text("# CLAUDE.md\ntest\n", encoding="utf-8")
    (root / "README.md").write_text("# README\ntest\n", encoding="utf-8")

    vault = root / "vault"
    for rel_dir in [
        "00-product",
        "01-research/templates",
        "02-architecture/templates",
        "03-ui-ux/templates",
        "04-decisions",
        "05-tasks/active",
        "05-tasks/blocked",
        "05-tasks/review",
        "05-tasks/completed",
        "06-implementation",
        "07-qa/reports",
        "08-releases",
        "09-retrospectives",
    ]:
        (vault / rel_dir).mkdir(parents=True)

    (vault / "HOME.md").write_text("# HOME\n", encoding="utf-8")
    (vault / "CURRENT_STATE.md").write_text(
        "# state\n\n"
        "<!-- BEGIN AUTO-GENERATED: DO NOT EDIT BELOW THIS LINE -->\n"
        "old\n"
        "<!-- END AUTO-GENERATED -->\n",
        encoding="utf-8",
    )
    for f in ["vision.md", "requirements.md", "success-metrics.md", "assumptions.md"]:
        (vault / "00-product" / f).write_text(f"# {f}\n", encoding="utf-8")
    (vault / "01-research" / "README.md").write_text("# research\n", encoding="utf-8")
    for f in ["system-design.md", "data-model.md", "api-contracts.md", "non-functional-requirements.md"]:
        (vault / "02-architecture" / f).write_text(f"# {f}\n", encoding="utf-8")
    for f in ["user-flows.md", "design-system.md", "accessibility.md"]:
        (vault / "03-ui-ux" / f).write_text(f"# {f}\n", encoding="utf-8")
    (vault / "04-decisions" / "README.md").write_text("# decisions\n", encoding="utf-8")
    (vault / "04-decisions" / "ADR-template.md").write_text("# ADR template\n", encoding="utf-8")
    (vault / "05-tasks" / "BACKLOG.md").write_text("# backlog\n", encoding="utf-8")
    (vault / "06-implementation" / "README.md").write_text("# impl\n", encoding="utf-8")
    (vault / "07-qa" / "test-strategy.md").write_text("# strategy\n", encoding="utf-8")
    (vault / "07-qa" / "traceability-matrix.md").write_text("# matrix\n", encoding="utf-8")
    (vault / "08-releases" / "release-template.md").write_text("# release\n", encoding="utf-8")
    (vault / "08-releases" / "rollback-template.md").write_text("# rollback\n", encoding="utf-8")
    (vault / "09-retrospectives" / "retrospective-template.md").write_text("# retro\n", encoding="utf-8")

    scripts_dir = root / "scripts"
    scripts_dir.mkdir()
    for f in ["validate-agent-system.py", "create-task.py", "update-current-state.py"]:
        (scripts_dir / f).write_text("# stub\n", encoding="utf-8")
    (root / "schemas").mkdir()
    (root / "schemas" / "task.schema.json").write_text("{}\n", encoding="utf-8")
    (root / "tests").mkdir()
    (root / "tests" / "test_agent_system.py").write_text("# stub\n", encoding="utf-8")


def write_task(
    tasks_root: Path,
    subdir: str,
    task_id: str,
    *,
    status: str = "draft",
    owner: str = "backend-developer",
    reviewer: str = "",
    priority: str = "P2",
    dependencies: list[str] | None = None,
    extra_frontmatter: str = "",
    filename: str | None = None,
) -> Path:
    deps = dependencies or []
    deps_yaml = "[]" if not deps else "[" + ", ".join(deps) + "]"
    content = textwrap.dedent(f"""\
        ---
        doc_type: task
        task_id: {task_id}
        title: Test task {task_id}
        status: {status}
        owner: {owner}
        reviewer: {reviewer}
        priority: {priority}
        dependencies: {deps_yaml}
        created: 2026-01-01
        updated: 2026-01-01
        related: []
        {extra_frontmatter}
        ---

        # {task_id}

        body
        """)
    d = tasks_root / subdir
    d.mkdir(parents=True, exist_ok=True)
    path = d / (filename or f"{task_id}.md")
    path.write_text(content, encoding="utf-8")
    return path


class TempRepoTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self._tmpdir.name)

    def tearDown(self) -> None:
        self._tmpdir.cleanup()


class TestValidScaffold(TempRepoTestCase):
    def test_minimal_scaffold_passes_required_paths(self):
        build_minimal_repo(self.tmp_path)
        diag = validate_mod.run_validation(self.tmp_path)
        missing = [e for e in diag.errors if "missing required path" in e]
        self.assertEqual(missing, [])

    def test_real_repository_passes_validation(self):
        """The actual delivered repository must pass its own validator with zero errors."""
        diag = validate_mod.run_validation(REPO_ROOT)
        self.assertEqual(diag.errors, [], "\n".join(diag.errors))


class TestMissingRequiredFiles(TempRepoTestCase):
    def test_missing_required_file_is_detected(self):
        build_minimal_repo(self.tmp_path)
        (self.tmp_path / "CLAUDE.md").unlink()
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("CLAUDE.md" in e for e in diag.errors))


class TestTaskStatus(TempRepoTestCase):
    def test_invalid_task_status_is_detected(self):
        build_minimal_repo(self.tmp_path)
        write_task(self.tmp_path / "vault" / "05-tasks", "active", "TASK-101", status="not-a-real-status")
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("invalid status" in e for e in diag.errors))


class TestTaskOwner(TempRepoTestCase):
    def test_missing_task_owner_is_detected(self):
        build_minimal_repo(self.tmp_path)
        write_task(self.tmp_path / "vault" / "05-tasks", "active", "TASK-102", owner="")
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("exactly one owner" in e for e in diag.errors))


class TestLifecycleTransitions(TempRepoTestCase):
    def test_is_valid_transition_pure_function(self):
        self.assertTrue(vc.is_valid_transition("draft", "ready"))
        self.assertTrue(vc.is_valid_transition("qa-review", "approved"))
        self.assertTrue(vc.is_valid_transition("qa-review", "changes-requested"))
        self.assertTrue(vc.is_valid_transition("changes-requested", "active"))
        self.assertTrue(vc.is_valid_transition("active", "active"))  # no-op is valid
        self.assertFalse(vc.is_valid_transition("draft", "released"))
        self.assertFalse(vc.is_valid_transition("approved", "draft"))
        self.assertFalse(vc.is_valid_transition("released", "active"))

    def test_invalid_status_history_is_detected(self):
        build_minimal_repo(self.tmp_path)
        write_task(
            self.tmp_path / "vault" / "05-tasks",
            "active",
            "TASK-103",
            extra_frontmatter="status_history: [draft, released]",
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("invalid lifecycle transition" in e for e in diag.errors))


class TestDuplicateTaskId(TempRepoTestCase):
    def test_duplicate_task_id_is_detected(self):
        build_minimal_repo(self.tmp_path)
        write_task(self.tmp_path / "vault" / "05-tasks", "active", "TASK-104", filename="a.md")
        write_task(self.tmp_path / "vault" / "05-tasks", "blocked", "TASK-104", filename="b.md")
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("duplicate task_id" in e for e in diag.errors))


class TestBrokenReferences(TempRepoTestCase):
    def test_broken_dependency_reference_is_detected(self):
        build_minimal_repo(self.tmp_path)
        write_task(
            self.tmp_path / "vault" / "05-tasks",
            "active",
            "TASK-105",
            dependencies=["TASK-999"],
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("does not reference an existing task file" in e for e in diag.errors))

    def test_broken_wikilink_in_vault_is_detected(self):
        build_minimal_repo(self.tmp_path)
        (self.tmp_path / "vault" / "HOME.md").write_text(
            "# HOME\n\nSee [[nonexistent-note-xyz]] for details.\n", encoding="utf-8"
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("broken wikilink" in e for e in diag.errors))


class TestApprovalGates(TempRepoTestCase):
    def test_approved_task_without_qa_report_is_a_gate_violation(self):
        build_minimal_repo(self.tmp_path)
        write_task(
            self.tmp_path / "vault" / "05-tasks",
            "review",
            "TASK-106",
            status="approved",
            reviewer="qa-engineer",
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(
            any("approval gate violation" in e and "TASK-106" in e for e in diag.errors)
        )

    def test_approved_task_with_qa_report_satisfies_gate(self):
        build_minimal_repo(self.tmp_path)
        write_task(
            self.tmp_path / "vault" / "05-tasks",
            "completed",
            "TASK-107",
            status="approved",
            reviewer="qa-engineer",
        )
        (self.tmp_path / "vault" / "07-qa" / "reports" / "TASK-107-qa-report.md").write_text(
            "# qa report\n", encoding="utf-8"
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertFalse(
            any("approval gate violation" in e and "TASK-107" in e for e in diag.errors)
        )

    def test_qa_review_without_reviewer_is_detected(self):
        build_minimal_repo(self.tmp_path)
        write_task(
            self.tmp_path / "vault" / "05-tasks", "review", "TASK-108", status="qa-review", reviewer=""
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("requires a non-empty 'reviewer'" in e for e in diag.errors))

    def test_accepted_adr_without_decided_date_is_a_gate_violation(self):
        build_minimal_repo(self.tmp_path)
        (self.tmp_path / "vault" / "04-decisions" / "ADR-0001-example.md").write_text(
            "---\ndoc_type: adr\nadr_id: ADR-0001\nstatus: accepted\ndecided: null\n---\n\nbody\n",
            encoding="utf-8",
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(
            any("approval gate violation" in e and "ADR-0001" in e for e in diag.errors)
        )

    def test_release_marked_approved_without_human_signoff_is_a_gate_violation(self):
        build_minimal_repo(self.tmp_path)
        (self.tmp_path / "vault" / "08-releases" / "RELEASE-0001.md").write_text(
            "---\ndoc_type: release\nhuman_approval: true\nhuman_approved_by: null\n"
            "human_approved_date: null\n---\n\nbody\n",
            encoding="utf-8",
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(
            any("approval gate violation" in e and "RELEASE-0001" in e for e in diag.errors)
        )


class TestSecretScanning(TempRepoTestCase):
    def test_secret_pattern_is_detected(self):
        build_minimal_repo(self.tmp_path)
        (self.tmp_path / "vault" / "00-product" / "leaky.md").write_text(
            'api_key: "abcdefghijklmnopqrstuvwx1234"\n', encoding="utf-8"
        )
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertTrue(any("possible committed secret" in e for e in diag.errors))

    def test_clean_repo_has_no_secret_findings(self):
        build_minimal_repo(self.tmp_path)
        diag = validate_mod.run_validation(self.tmp_path)
        self.assertFalse(any("possible committed secret" in e for e in diag.errors))


class TestCreateTaskScript(TempRepoTestCase):
    def test_create_task_script_creates_valid_file(self):
        build_minimal_repo(self.tmp_path)
        out = self.tmp_path / "vault" / "05-tasks" / "active" / "TASK-200-demo.md"
        result = run_py(
            "create-task.py",
            "--id", "TASK-200",
            "--title", "Demo task",
            "--owner", "frontend-developer",
            "--reviewer", "qa-engineer",
            "--priority", "P1",
            "--output", str(out),
            "--root", str(self.tmp_path),
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(out.exists())
        fm, _ = vc.read_frontmatter(out)
        self.assertEqual(fm["task_id"], "TASK-200")
        self.assertEqual(fm["owner"], "frontend-developer")
        self.assertEqual(fm["status"], "draft")

    def test_create_task_script_rejects_malformed_id(self):
        build_minimal_repo(self.tmp_path)
        result = run_py(
            "create-task.py",
            "--id", "NOT-A-TASK-ID",
            "--title", "x",
            "--owner", "y",
            "--output", str(self.tmp_path / "out.md"),
            "--root", str(self.tmp_path),
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("malformed", (result.stdout + result.stderr).lower())

    def test_create_task_script_rejects_duplicate_id(self):
        build_minimal_repo(self.tmp_path)
        write_task(self.tmp_path / "vault" / "05-tasks", "active", "TASK-201")
        result = run_py(
            "create-task.py",
            "--id", "TASK-201",
            "--title", "Duplicate",
            "--owner", "backend-developer",
            "--output", str(self.tmp_path / "vault" / "05-tasks" / "active" / "dup.md"),
            "--root", str(self.tmp_path),
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate", (result.stdout + result.stderr).lower())


class TestUpdateCurrentStateScript(TempRepoTestCase):
    def test_preserves_manual_section_and_rebuilds_auto_section(self):
        build_minimal_repo(self.tmp_path)
        state_path = self.tmp_path / "vault" / "CURRENT_STATE.md"
        state_path.write_text(
            "# Current State\n\n"
            "## Manual\nThis must survive.\n\n"
            "<!-- BEGIN AUTO-GENERATED: DO NOT EDIT BELOW THIS LINE -->\n"
            "stale content\n"
            "<!-- END AUTO-GENERATED -->\n"
            "\nFooter must survive too.\n",
            encoding="utf-8",
        )
        write_task(self.tmp_path / "vault" / "05-tasks", "active", "TASK-300", status="active")

        result = run_py("update-current-state.py", "--root", str(self.tmp_path))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

        new_text = state_path.read_text(encoding="utf-8")
        self.assertIn("This must survive.", new_text)
        self.assertIn("Footer must survive too.", new_text)
        self.assertNotIn("stale content", new_text)
        self.assertIn("TASK-300", new_text)

    def test_refuses_when_markers_missing(self):
        build_minimal_repo(self.tmp_path)
        (self.tmp_path / "vault" / "CURRENT_STATE.md").write_text(
            "# no markers here\n", encoding="utf-8"
        )
        result = run_py("update-current-state.py", "--root", str(self.tmp_path))
        self.assertNotEqual(result.returncode, 0)


class TestValidatorCli(unittest.TestCase):
    def test_validator_cli_exits_zero_on_real_repo(self):
        result = run_py("validate-agent-system.py", "--root", str(REPO_ROOT))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
