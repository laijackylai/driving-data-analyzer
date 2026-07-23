# Local Storage (Dexie/IndexedDB) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist up to 10 previously analyzed files (raw CSV + analysis results) in IndexedDB via Dexie, allowing instant reload from a history selector on the landing page.

**Architecture:** A single Dexie database (`DrivingAnalyzerDB`) with one table (`sessions`). Each row stores the raw CSV text, the full `ExtendedAnalysisResponse` payload, the original filename, and a timestamp. A `useSessionHistory` hook exposes CRUD + FIFO eviction. The landing page gets a history list; the dashboard gets a "back to history" path.

**Tech Stack:** Dexie 4.x, dexie-react-hooks (`useLiveQuery`), existing Next.js/React/TypeScript stack.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/db/schema.ts` | Dexie DB instance + table type definition |
| Create | `src/lib/db/sessionStore.ts` | CRUD operations: save, delete, getAll, count, evict |
| Create | `src/hooks/useSessionHistory.ts` | React hook wrapping `useLiveQuery` for reactive session list |
| Create | `src/components/features/SessionHistory.tsx` | UI: list of past sessions on landing page |
| Modify | `src/components/features/DashboardView.tsx` | After analysis completes, save session; support loading from history |
| Modify | `src/components/features/LandingView.tsx` | Render `<SessionHistory>` below file upload |
| Modify | `src/types/index.ts` | Add `StoredSession` interface |
| Create | `src/test/sessionStore.test.ts` | Unit tests for CRUD + FIFO eviction |
| Create | `src/test/SessionHistory.test.tsx` | Component tests for session history UI |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dexie and dexie-react-hooks**

```bash
npm install dexie dexie-react-hooks
```

- [ ] **Step 2: Install fake-indexeddb for testing**

```bash
npm install -D fake-indexeddb
```

- [ ] **Step 3: Verify installation**

```bash
npm ls dexie dexie-react-hooks fake-indexeddb
```

Expected: all three packages listed without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add dexie, dexie-react-hooks, fake-indexeddb"
```

---

### Task 2: Define StoredSession Type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add StoredSession interface to types**

Add at the bottom of `src/types/index.ts`, before the closing of the file:

```typescript
// ── Stored Session (IndexedDB) ──

export interface StoredSession {
  id?: number;               // Auto-incremented primary key
  fileName: string;          // Original CSV filename
  fileSize: number;          // File size in bytes
  rawCsv: string;            // Raw CSV text for re-analysis
  analysisResponse: ExtendedAnalysisResponse; // Full analysis payload
  createdAt: number;         // Date.now() timestamp
}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add StoredSession interface for IndexedDB persistence"
```

---

### Task 3: Create Dexie Database Schema

**Files:**
- Create: `src/lib/db/schema.ts`

- [ ] **Step 1: Write the failing test**

Create `src/test/sessionStore.test.ts`:

```typescript
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/schema";

describe("Dexie schema", () => {
  beforeEach(async () => {
    await db.sessions.clear();
  });

  it("creates a sessions table with auto-increment id", async () => {
    const id = await db.sessions.add({
      fileName: "test.csv",
      fileSize: 1024,
      rawCsv: "a;b;c",
      analysisResponse: {} as never,
      createdAt: Date.now(),
    });
    expect(id).toBe(1);
    const count = await db.sessions.count();
    expect(count).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/sessionStore.test.ts
```

Expected: FAIL — cannot resolve `@/lib/db/schema`.

- [ ] **Step 3: Write the database schema**

Create `src/lib/db/schema.ts`:

```typescript
import Dexie, { type EntityTable } from "dexie";
import type { StoredSession } from "@/types";

const db = new Dexie("DrivingAnalyzerDB") as Dexie & {
  sessions: EntityTable<StoredSession, "id">;
};

db.version(1).stores({
  sessions: "++id, createdAt",
});

export { db };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/sessionStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts src/test/sessionStore.test.ts
git commit -m "feat: add Dexie database schema with sessions table"
```

---

### Task 4: Implement Session Store CRUD + FIFO Eviction

**Files:**
- Create: `src/lib/db/sessionStore.ts`
- Modify: `src/test/sessionStore.test.ts`

- [ ] **Step 1: Write failing tests for CRUD + eviction**

Append to `src/test/sessionStore.test.ts`:

```typescript
import { saveSession, deleteSession, getAllSessions, MAX_SESSIONS } from "@/lib/db/sessionStore";
import type { ExtendedAnalysisResponse } from "@/types";

const mockResponse = {
  success: true as const,
  timeSeries: [],
  gps: [],
  derived: {
    wheelSpeedDiffs: [],
    cvtEffectiveRatio: [],
    fuelBySpeedBucket: [],
    engineZones: [],
    awdEngagementEvents: [],
    fuelDistanceSeries: [],
    thermalDelta: [],
    torqueSplit: [],
    ratioError: [],
    torqueConverterSlip: [],
    volumetricEfficiency: [],
    stftStability: [],
  },
  thresholds: {} as ExtendedAnalysisResponse["thresholds"],
} satisfies ExtendedAnalysisResponse;

describe("sessionStore", () => {
  beforeEach(async () => {
    await db.sessions.clear();
  });

  it("saves and retrieves a session", async () => {
    await saveSession("drive1.csv", 500, "csv-text", mockResponse);
    const sessions = await getAllSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].fileName).toBe("drive1.csv");
    expect(sessions[0].rawCsv).toBe("csv-text");
  });

  it("returns sessions ordered newest-first", async () => {
    await saveSession("a.csv", 100, "a", mockResponse);
    await saveSession("b.csv", 200, "b", mockResponse);
    const sessions = await getAllSessions();
    expect(sessions[0].fileName).toBe("b.csv");
    expect(sessions[1].fileName).toBe("a.csv");
  });

  it("deletes a session by id", async () => {
    await saveSession("x.csv", 100, "x", mockResponse);
    const sessions = await getAllSessions();
    await deleteSession(sessions[0].id!);
    expect(await getAllSessions()).toHaveLength(0);
  });

  it("evicts oldest session when exceeding MAX_SESSIONS", async () => {
    for (let i = 0; i < MAX_SESSIONS; i++) {
      await saveSession(`file${i}.csv`, 100, `csv${i}`, mockResponse);
    }
    // Adding one more should evict the oldest (file0.csv)
    await saveSession("overflow.csv", 100, "overflow", mockResponse);
    const sessions = await getAllSessions();
    expect(sessions).toHaveLength(MAX_SESSIONS);
    const fileNames = sessions.map((s) => s.fileName);
    expect(fileNames).not.toContain("file0.csv");
    expect(fileNames).toContain("overflow.csv");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/sessionStore.test.ts
```

Expected: FAIL — cannot resolve `@/lib/db/sessionStore`.

- [ ] **Step 3: Implement sessionStore**

Create `src/lib/db/sessionStore.ts`:

```typescript
import { db } from "@/lib/db/schema";
import type { ExtendedAnalysisResponse } from "@/types";

export const MAX_SESSIONS = 10;

export async function saveSession(
  fileName: string,
  fileSize: number,
  rawCsv: string,
  analysisResponse: ExtendedAnalysisResponse,
): Promise<number> {
  // Evict oldest if at capacity
  const count = await db.sessions.count();
  if (count >= MAX_SESSIONS) {
    const oldest = await db.sessions.orderBy("createdAt").first();
    if (oldest?.id) {
      await db.sessions.delete(oldest.id);
    }
  }

  return db.sessions.add({
    fileName,
    fileSize,
    rawCsv,
    analysisResponse,
    createdAt: Date.now(),
  });
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

export async function getAllSessions() {
  return db.sessions.orderBy("createdAt").reverse().toArray();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/sessionStore.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/sessionStore.ts src/test/sessionStore.test.ts
git commit -m "feat: implement session store with CRUD and FIFO eviction (max 10)"
```

---

### Task 5: Create useSessionHistory Hook

**Files:**
- Create: `src/hooks/useSessionHistory.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useSessionHistory.ts`:

```typescript
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { saveSession, deleteSession } from "@/lib/db/sessionStore";
import type { StoredSession, ExtendedAnalysisResponse } from "@/types";

export function useSessionHistory() {
  const sessions: StoredSession[] | undefined = useLiveQuery(
    () => db.sessions.orderBy("createdAt").reverse().toArray(),
    [],
  );

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
    saveSession,
    deleteSession,
  };
}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSessionHistory.ts
git commit -m "feat: add useSessionHistory hook with useLiveQuery"
```

---

### Task 6: Build SessionHistory Component

**Files:**
- Create: `src/components/features/SessionHistory.tsx`
- Create: `src/test/SessionHistory.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `src/test/SessionHistory.test.tsx`:

```typescript
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionHistory } from "@/components/features/SessionHistory";
import { db } from "@/lib/db/schema";
import type { ExtendedAnalysisResponse } from "@/types";

const mockResponse = {
  success: true as const,
  timeSeries: [],
  gps: [],
  derived: {
    wheelSpeedDiffs: [],
    cvtEffectiveRatio: [],
    fuelBySpeedBucket: [],
    engineZones: [],
    awdEngagementEvents: [],
    fuelDistanceSeries: [],
    thermalDelta: [],
    torqueSplit: [],
    ratioError: [],
    torqueConverterSlip: [],
    volumetricEfficiency: [],
    stftStability: [],
  },
  thresholds: {} as ExtendedAnalysisResponse["thresholds"],
} satisfies ExtendedAnalysisResponse;

describe("SessionHistory", () => {
  beforeEach(async () => {
    await db.sessions.clear();
  });

  it("shows empty state when no sessions exist", async () => {
    render(<SessionHistory onSessionSelect={vi.fn()} />);
    await waitFor(() => {
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });

  it("renders saved sessions", async () => {
    await db.sessions.add({
      fileName: "trip.csv",
      fileSize: 2048,
      rawCsv: "data",
      analysisResponse: mockResponse,
      createdAt: Date.now(),
    });
    render(<SessionHistory onSessionSelect={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("trip.csv")).toBeInTheDocument();
    });
  });

  it("calls onSessionSelect when a session is clicked", async () => {
    await db.sessions.add({
      fileName: "trip.csv",
      fileSize: 2048,
      rawCsv: "data",
      analysisResponse: mockResponse,
      createdAt: Date.now(),
    });
    const onSelect = vi.fn();
    render(<SessionHistory onSessionSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText("trip.csv")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trip.csv"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].fileName).toBe("trip.csv");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/SessionHistory.test.tsx
```

Expected: FAIL — cannot resolve `@/components/features/SessionHistory`.

- [ ] **Step 3: Implement the component**

Create `src/components/features/SessionHistory.tsx`:

```typescript
"use client";

import { useSessionHistory } from "@/hooks/useSessionHistory";
import { formatFileSize } from "@/lib/utils";
import type { StoredSession } from "@/types";

interface SessionHistoryProps {
  onSessionSelect: (session: StoredSession) => void;
}

export function SessionHistory({ onSessionSelect }: SessionHistoryProps) {
  const { sessions, isLoading, deleteSession } = useSessionHistory();

  if (isLoading || sessions.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <h3 className="text-xs font-medium uppercase tracking-widest text-sapphire-500 mb-3">
        Previous Analyses
      </h3>
      <ul className="space-y-2">
        {sessions.map((session) => (
          <li key={session.id} role="listitem">
            <button
              onClick={() => onSessionSelect(session)}
              className="w-full text-left glass-card px-4 py-3 rounded-xl transition-all duration-200 hover:bg-sapphire-800/40 border border-transparent hover:border-sapphire-700/40 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-sapphire-200 truncate">
                    {session.fileName}
                  </p>
                  <p className="text-xs text-sapphire-500 mt-0.5">
                    {formatFileSize(session.fileSize)} &middot;{" "}
                    {new Date(session.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (session.id) deleteSession(session.id);
                  }}
                  className="shrink-0 p-1.5 rounded-lg text-sapphire-600 hover:text-accent-red-400 hover:bg-sapphire-800/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${session.fileName}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/SessionHistory.test.tsx
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/features/SessionHistory.tsx src/test/SessionHistory.test.tsx
git commit -m "feat: add SessionHistory component with delete support"
```

---

### Task 7: Integrate into LandingView

**Files:**
- Modify: `src/components/features/LandingView.tsx`

- [ ] **Step 1: Read LandingView.tsx to understand current structure**

Read `src/components/features/LandingView.tsx` fully before editing.

- [ ] **Step 2: Add SessionHistory import and onSessionSelect prop**

Add to the imports section of `LandingView.tsx`:

```typescript
import { SessionHistory } from "@/components/features/SessionHistory";
import type { StoredSession } from "@/types";
```

Add `onSessionSelect` to the `LandingViewProps` interface usage (the component receives it as a prop from `DashboardView`):

```typescript
// Update the component's props to accept onSessionSelect
export function LandingView({
  onFileSelect,
  onSessionSelect,
}: {
  onFileSelect: (file: File) => void;
  onSessionSelect: (session: StoredSession) => void;
}) {
```

- [ ] **Step 3: Render SessionHistory below FileUpload**

Place `<SessionHistory onSessionSelect={onSessionSelect} />` below the `<FileUpload>` component in the JSX, inside the same container:

```tsx
<SessionHistory onSessionSelect={onSessionSelect} />
```

- [ ] **Step 4: Run type check**

```bash
npm run type-check
```

Expected: errors in `DashboardView.tsx` (missing `onSessionSelect` prop) — expected, fixed in Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/components/features/LandingView.tsx
git commit -m "feat: add session history list to landing view"
```

---

### Task 8: Integrate Save + Load into DashboardView

**Files:**
- Modify: `src/components/features/DashboardView.tsx`

This is the main integration task. Two changes:
1. **Save:** After successful analysis, persist the session to IndexedDB.
2. **Load:** When a user clicks a past session, hydrate state from the stored `ExtendedAnalysisResponse` (skip the API call and pixelize animation).

- [ ] **Step 1: Add imports**

Add to the imports in `DashboardView.tsx`:

```typescript
import { saveSession } from "@/lib/db/sessionStore";
import type { StoredSession } from "@/types";
```

- [ ] **Step 2: Store rawCsv in state for persistence**

Add a ref to hold the raw CSV text and filename for saving after analysis:

```typescript
const pendingFileRef = useRef<{ name: string; size: number; text: string } | null>(null);
```

Update `analyzeFile` to read the file text before uploading, and save to IndexedDB on success:

```typescript
const analyzeFile = useCallback(async (file: File) => {
  setError(null);
  try {
    const rawCsv = await file.text();
    pendingFileRef.current = { name: file.name, size: file.size, text: rawCsv };

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/analyze", { method: "POST", body: formData });
    const data: ExtendedAnalysisResponse & { error?: string } = await response.json();

    if (!response.ok) {
      setError(data.error || "Analysis failed");
      setViewState("landing");
      return;
    }

    const derivedData = data.derived ?? null;
    const thresholdsData = data.thresholds ?? null;

    setResult(data.result ?? null);
    setTimeSeries(data.timeSeries ?? []);
    setGps(data.gps ?? []);
    setDerived(derivedData);
    setThresholds(thresholdsData);
    setDataSource(data.dataSource ?? "obd2");
    setCobbResult(data.cobbResult ?? null);
    setCobbMetadata(data.cobbMetadata ?? null);

    if (!derivedData || !thresholdsData) {
      setError("Analysis failed");
      setViewState("landing");
      return;
    }

    // Persist to IndexedDB
    if (pendingFileRef.current) {
      saveSession(
        pendingFileRef.current.name,
        pendingFileRef.current.size,
        pendingFileRef.current.text,
        data,
      );
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Analysis failed");
    setViewState("landing");
  }
}, []);
```

- [ ] **Step 3: Add handleSessionSelect to load from history**

```typescript
const handleSessionSelect = useCallback((session: StoredSession) => {
  const data = session.analysisResponse;
  setResult(data.result ?? null);
  setTimeSeries(data.timeSeries ?? []);
  setGps(data.gps ?? []);
  setDerived(data.derived ?? null);
  setThresholds(data.thresholds ?? null);
  setDataSource(data.dataSource ?? "obd2");
  setCobbResult(data.cobbResult ?? null);
  setCobbMetadata(data.cobbMetadata ?? null);
  setError(null);
  // Skip animation — go straight to dashboard
  setShowDotLoader(false);
  setViewState("dashboard");
}, []);
```

- [ ] **Step 4: Pass onSessionSelect to LandingView**

Update the `<LandingView>` JSX:

```tsx
<LandingView onFileSelect={handleFileSelect} onSessionSelect={handleSessionSelect} />
```

- [ ] **Step 5: Run type check and dev server**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npm run test
```

Expected: all PASS (existing tests may need mock adjustments if they render `LandingView` — update their props accordingly).

- [ ] **Step 7: Commit**

```bash
git add src/components/features/DashboardView.tsx
git commit -m "feat: save analysis to IndexedDB on success, load from session history"
```

---

### Task 9: Update LandingViewProps Type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update LandingViewProps to include onSessionSelect**

In `src/types/index.ts`, update:

```typescript
export interface LandingViewProps {
  onFileSelect: (file: File) => void;
  onSessionSelect: (session: StoredSession) => void;
}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: update LandingViewProps with onSessionSelect"
```

---

### Task 10: Fix Existing Tests

**Files:**
- Modify: `src/test/LandingView.test.tsx`
- Modify: `src/test/DashboardView.test.tsx`

- [ ] **Step 1: Read existing test files**

Read both test files to understand what needs updating.

- [ ] **Step 2: Update LandingView tests**

Add `fake-indexeddb/auto` import at the top and pass `onSessionSelect={vi.fn()}` wherever `<LandingView>` is rendered.

- [ ] **Step 3: Update DashboardView tests**

Add `fake-indexeddb/auto` import at the top. The `DashboardView` component doesn't take new props, but its children now use IndexedDB — the `fake-indexeddb` import ensures tests don't crash.

- [ ] **Step 4: Run all tests**

```bash
npm run test
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/test/LandingView.test.tsx src/test/DashboardView.test.tsx
git commit -m "test: update existing tests for IndexedDB integration"
```

---

### Task 11: Manual Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Upload a CSV file and verify analysis completes**

Check browser DevTools → Application → IndexedDB → `DrivingAnalyzerDB` → `sessions` table. A row should appear.

- [ ] **Step 3: Click home, verify session appears in history list**

The landing page should show "Previous Analyses" with the file you just uploaded.

- [ ] **Step 4: Click the session — verify dashboard loads instantly (no API call, no animation)**

- [ ] **Step 5: Upload 11 files, verify the oldest is evicted (only 10 remain)**

- [ ] **Step 6: Delete a session via the trash icon, verify it disappears**

---

## Summary of Data Flow

```
Upload CSV → POST /api/analyze → ExtendedAnalysisResponse
                                       ↓
                              saveSession(fileName, size, rawCsv, response)
                                       ↓
                              IndexedDB: DrivingAnalyzerDB.sessions
                                       ↓
                              useLiveQuery → SessionHistory component
                                       ↓
                              Click session → hydrate state → dashboard (no API call)
```
