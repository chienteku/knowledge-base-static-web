# Missing React Terms — AI Knowledge Base (Gap Analysis)

> **Purpose:** This document is an input for an AI generation pass. It lists the terms
> that are **used in the existing `06-react/` prose but never defined as their own term**,
> plus the terms a learner needs to reach "hero"/mastery that the curriculum never introduces,
> plus the relationships each missing term has to other missing terms and to existing terms.
> Every row is pre-shaped to drop directly into the curriculum's 8-section term template
> (`Prerequisites → Category → Environment → Explanation → Common Mistakes → Exercises → Related Terms → Key Takeaways`).
>
> **Scope reviewed:** 56 existing term files across `terms/level_01` … `terms/level_11`,
> plus `_meta/react_terms_zero_to_hero.md`, `_meta/technology_context.md`, and the helper
> scripts (`check_mismatch.js`, `fix_react_links.js`, `shift_headers.js`).
>
> **Method:** (1) Ran the repo's own `check_mismatch.js` — the index and the files on disk are a
> **perfect 1:1 match** (no phantom index entries, no orphan files), so — unlike `04-apis` and
> `05-nodejs` — there is **no index↔files divergence to resolve**. (2) `grep`-scanned the corpus
> for concepts that appear in prose/code but have no term file, counting how many files lean on
> each, to prioritize by blast radius. No broken `../level_XX/*.md` links exist, so "missing"
> here means **conceptual** gaps, not dangling references.

---

## 0. Structural findings the generating AI must know first

### Finding 1 — The index is clean; do **not** re-title or re-map anything.
`check_mismatch.js` reports empty "IN META BUT MISSING FROM DISK" and "ON DISK BUT MISSING FROM
META" sets. Every one of the 56 index entries maps to exactly one file and vice-versa. This KB is
in far better shape than `04-apis`/`05-nodejs` — all gaps below are **additive** (new terms), none
require re-labeling existing levels.

### Finding 2 — Header numbering bug in `level_10/` and `level_11/` (quick fix).
The `_meta` index correctly calls the last two levels **Level 10** and **Level 11**, but the files'
own `> **Level N — …**` headers are off by one and drift in title:

| Dir | Index title | **Actual file header (wrong)** | Should be |
|---|---|---|---|
| level_10 | Modern React & Architectures | `> **Level 9 — Next.js & Server-Side React**` | `> **Level 10 — …**` |
| level_11 | Ecosystem Libraries | `> **Level 10 — The React Ecosystem**` | `> **Level 11 — …**` |

This produces a **duplicate "Level 9"** in the corpus (`level_09/*` and `level_10/*` both say
"Level 9"). The generating AI should bump the `level_10/*` headers to **Level 10** and the
`level_11/*` headers to **Level 11** (a `shift_headers.js` script already exists here and may be the
intended tool). Pick one canonical title per level and align the index and headers to match.

### Finding 3 — No `missing_*` deliverable or `_meta/missing_terms.md` tracker exists yet.
When these terms are generated, create `_meta/missing_terms.md` to record them, mirroring the
`03-javascript`/`05-nodejs` tracker convention.

---

## 1. Critical gaps — concepts used in existing prose but never defined

These block comprehension the most because existing terms *depend* on them in prose/code.

| Missing Term | Why it blocks learning | Evidence (files referencing it) |
|---|---|---|
| **Reconciliation** | `virtual_dom.md` builds its whole explanation around "The Reconciliation Process (Diffing)," and `technology_context.md` lists Reconciliation as a headline *Rendering Mechanic* category — yet it has no term of its own | `virtual_dom` (+ every re-render discussion) |
| **Render Purity ("components must be pure")** | Asserted as React's "core rule" in `side_effects.md`, and Reducers/HOCs are all defined as "Pure Functions," but purity itself is never taught | `side_effects`, `use_reducer`, `state_management`, `redux`, `hoc` (5+) |
| **Automatic Batching** | `use_state.md` explains state is "Asynchronous / Batched" to justify the updater pattern, but batching is never defined | `use_state`, `re_rendering` |
| **The Fiber Architecture** | Named in `technology_context.md` as a core *Rendering Mechanic* example; it's the engine that makes Concurrent features and Suspense possible, but there's no term | `technology_context` (referenced as expected) |
| **The Bundler (Webpack / Vite / Babel)** | `code_splitting.md`, `nextjs.md`, and `ssr.md` all assume a bundler chops code into `bundle.js`/chunks — the mechanism behind lazy loading is never defined | `code_splitting`, `nextjs`, `ssr` (3) |

---

## 2. Missing terms by level

Each row: **Proposed Term | description | Category | Prerequisites | Related**.
Categories use the **exact four** from `technology_context.md` — *Core Hook*, *Component Pattern*,
*Rendering Mechanic*, *Ecosystem* (with *Tooling* noted where none fits). Environments use the
KB's three — *Client-Side (SPA)*, *Server-Side (SSR/SSG)*, *Universal*.
🆕 = concept used in existing prose/code but undefined · ➕ = absent but needed for mastery (not yet referenced).

### Level 1 — Core Concepts (finish the rendering-engine story)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Reconciliation** [DONE] | The diffing algorithm that compares old vs new Virtual DOM trees and computes the minimal real-DOM update | Rendering Mechanic | Virtual DOM | Fiber, Re-rendering, Lists & Keys |
| **The Fiber Architecture** [DONE] | React's internal unit-of-work engine that lets rendering pause, resume, and prioritize | Rendering Mechanic | Virtual DOM, Reconciliation | Concurrent Rendering, Suspense |
| **Fragments (`<>…</>`)** [DONE] | Grouping siblings without adding a wrapper DOM node | Component Pattern | JSX, Components | Lists & Keys, Children Prop |
| **Render Purity** [DONE] | The rule that a component must be a pure function of its props/state — no side effects during render | Rendering Mechanic | Components, Props | Side Effects, Strict Mode, useEffect |

### Level 2 — State & Reactivity (the state-shape essentials)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Automatic Batching** [DONE] | React grouping multiple `setState` calls into one re-render (why state looks "async") | Rendering Mechanic | State, Re-rendering, `useState` | Unidirectional Flow |
| **Lifting State Up** [DONE] | Moving shared state to the closest common ancestor so siblings can sync | Component Pattern | State, Props, Unidirectional Flow | Prop Drilling, Context API |
| **Derived State** [DONE] | Computing values during render instead of storing redundant state in `useState` | Rendering Mechanic | State, Re-rendering | `useMemo`, Render Purity |

### Level 3 — Lifecycle & Effects (the effect pitfalls everyone hits)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Data Fetching & Race Conditions** [DONE] | Why two in-flight fetches can resolve out of order, and cleaning up with a flag/`AbortController` | Core Hook | `useEffect`, Cleanup Functions | Suspense for Data Fetching, `useState` |
| **Stale Closures** [DONE] | Effects/callbacks capturing an old value because a dependency was omitted | Rendering Mechanic | `useEffect`, Dependency Array | `useCallback`, Rules of Hooks |
| **`useLayoutEffect`** [DONE] | The synchronous sibling of `useEffect` that fires before the browser paints (for measuring DOM) | Core Hook | `useEffect`, Component Lifecycle | `useRef`, `useEffect` |

### Level 4 — Advanced Hooks (round out the hook toolbox)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Memoization (the concept)** [DONE] | Caching a computed result keyed on inputs — the shared idea behind `useMemo`/`useCallback`/`React.memo` | Rendering Mechanic | `useMemo`, `useCallback` | React.memo, Referential Equality |
| **Referential Equality** [DONE] | Why React compares objects/functions by reference, breaking naive memoization | Rendering Mechanic | Immutability, `useMemo` | `useCallback`, React.memo |
| **`forwardRef` & `useImperativeHandle`** [DONE] | Passing a ref through a component to its DOM node / exposing an imperative API | Component Pattern | `useRef`, Components | Portals, Custom Hooks |
| **`useId`** [DONE] | Generating stable unique IDs that match across server and client (accessibility, SSR) | Core Hook | Rules of Hooks | Hydration, Accessibility |

### Level 7 — Component Patterns (fill the composition gaps)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Composition over Inheritance** [DONE] | React's core reuse strategy — compose components instead of extending classes | Component Pattern | Components, Children Prop | HOC, Render Props |
| **Compound Components** [DONE] | A parent + subcomponents sharing implicit state via context (`<Tabs><Tab/></Tabs>`) | Component Pattern | Context API, Children Prop | Render Props, Composition over Inheritance |

### Level 8 — Performance Optimization (React 18 concurrency)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Concurrent Rendering** [DONE] | React 18's ability to interrupt/prioritize rendering (the reason renders must be pure) | Rendering Mechanic | Fiber, Render Purity | Suspense, `useTransition` |
| **`useTransition`** [DONE] | Marking state updates as non-urgent so the UI stays responsive | Core Hook | Concurrent Rendering, `useState` | `useDeferredValue`, Suspense |
| **`useDeferredValue`** [DONE] | Deferring a re-render of expensive UI until the browser is idle | Core Hook | Concurrent Rendering, Re-rendering | `useTransition`, `useMemo` |
| **Bundler & Tree-Shaking** [DONE] | How Webpack/Vite/Rollup bundle code and drop unused exports (the basis of code splitting) | Tooling / Ecosystem | Code Splitting | Suspense, Next.js |
| **The React Profiler** [DONE] | The DevTools tab that measures render cost and finds wasted re-renders | Ecosystem | React DevTools, Re-rendering | React.memo, `useMemo` |

### Level 10 — Modern React & Architectures (the RSC depth that's missing)
> Note: fix these files' `> **Level 9**` headers to **Level 10** (Section 0, Finding 2).

| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Client vs Server Components & "use client"** [DONE] | The directive boundary that splits components into server- and client-rendered | Rendering Mechanic | RSC, Hydration | Server Actions, Next.js |
| **Server Actions & "use server"** [DONE] | Calling server functions directly from components without a manual API route | Component Pattern | RSC, Client vs Server Components | Next.js, Data Fetching |
| **Suspense for Data Fetching & the use() Hook** [DONE] | Suspending a component while a promise resolves; the new `use()` primitive | Core Hook | Suspense, RSC | Data Fetching & Race Conditions, Streaming SSR |
| **Streaming SSR** [DONE] | Sending HTML to the browser in chunks as it's ready, instead of all at once | Rendering Mechanic | SSR, Suspense | Hydration, Concurrent Rendering |

### Level 11 — Ecosystem Libraries (the missing pillars)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Testing: React Testing Library + Jest** [DONE] | Rendering components in a fake DOM and asserting behavior (an entirely absent pillar) | Ecosystem | Components, Synthetic Events | Custom Hooks, Strict Mode |
| **TypeScript with React** [DONE] | Typing props, state, and hooks (`FC`, generics on `useState`) — the industry default | Ecosystem | Props, `useState` | Custom Hooks |
| **Zustand** [DONE] | The minimal external store the KB repeatedly cites as the modern Redux alternative | Ecosystem | State Management, `useReducer` | Redux, `useSyncExternalStore` |
| **`useSyncExternalStore`** [DONE] | The hook libraries like Redux/Zustand use to subscribe React to an external store | Core Hook | State Management, Rules of Hooks | Zustand, Redux |

---

## 3. Relationship map (dependency graph)

Notation: `A → B` means **"A requires / builds on B"**. **Bold** = existing term; plain = missing.

### Cluster 1 — The rendering engine (deepens Level 1, the KB's foundation)
```
**Virtual DOM** → Reconciliation → The Fiber Architecture
The Fiber Architecture → Concurrent Rendering → Suspense (existing) / **Strict Mode**
Render Purity → **Side Effects** (the "impure" escape hatch)
Render Purity → Concurrent Rendering   (purity is what makes interruption safe)
Fragments → **JSX** + **Lists & Keys**
```

### Cluster 2 — State shape & data flow (Level 2 completion)
```
**useState** → Automatic Batching  (why updates look async → updater pattern)
**Unidirectional Flow** → Lifting State Up → **Prop Drilling** → **Context API**
Derived State → **Re-rendering** + **useMemo**   (don't store what you can compute)
```

### Cluster 3 — Effects & the hook pitfalls (Level 3–4)
```
**useEffect** → Data Fetching & Race Conditions → AbortController / cleanup
**Dependency Array** → Stale Closures → **useCallback**
**useEffect** → useLayoutEffect   (sync vs async timing)
**useMemo / useCallback** → Memoization → Referential Equality → **React.memo**
**useRef** → forwardRef & useImperativeHandle
```

### Cluster 4 — Composition patterns (Level 6–7)
```
**Children Prop** → Composition over Inheritance → **HOC** / **Render Props**
**Context API** → Compound Components → Children Prop
```

### Cluster 5 — Concurrency & performance (Level 8, React 18)
```
Concurrent Rendering → useTransition / useDeferredValue
**Code Splitting** → Bundler & Tree-Shaking → **Suspense** (lazy loading)
**React DevTools** → The React Profiler → **React.memo**
```

### Cluster 6 — Server & modern architecture (Level 10)
```
**RSC** → Client vs Server Components ("use client") → **Hydration**
Client vs Server Components → Server Actions ("use server")
**Suspense** → Suspense for Data Fetching & use() → Streaming SSR → **SSR**
```

### Cluster 7 — Ecosystem & external state (Level 11)
```
**State Management** → Zustand → useSyncExternalStore ← **Redux**
Testing (RTL + Jest) → **Components** + **Synthetic Events** + **Custom Hooks**
TypeScript with React → **Props** + **useState** + **Custom Hooks**
```

---

## 4. Suggested generation priority

| Tier | Rationale | Terms |
|---|---|---|
| **P0 — Fix the header numbering** | Structural cleanup from Section 0 so level labels are consistent before adding terms | *Bump `level_10/*` headers → Level 10, `level_11/*` → Level 11 (see `shift_headers.js`)* |
| **P1 — Engine gaps that existing prose leans on** | Reconciliation/purity/batching are asserted as "core rules" but never defined | Reconciliation · Render Purity · Automatic Batching · The Fiber Architecture · Bundler & Tree-Shaking |
| **P2 — Everyday pitfalls a junior hits immediately** | The bugs that block real work | Lifting State Up · Data Fetching & Race Conditions · Stale Closures · Referential Equality · Memoization · Derived State · Fragments |
| **P3 — React 18 / concurrency & missing hooks** | Required for "modern React (v18+)" that `technology_context.md` mandates | Concurrent Rendering · `useTransition` · `useDeferredValue` · `useLayoutEffect` · `useId` · `forwardRef` & `useImperativeHandle` |
| **P4 — Server depth, patterns, ecosystem breadth** | Rounds out the "hero" path | Client vs Server Components (`"use client"`) · Server Actions · Suspense for Data Fetching & `use()` · Streaming SSR · Composition over Inheritance · Compound Components · React Profiler · Testing (RTL + Jest) · TypeScript with React · Zustand · `useSyncExternalStore` |

---

## 5. Notes for the generating AI

1. **Follow the existing 8-section template exactly** (see `terms/level_01/virtual_dom.md` and
   `terms/level_03/use_effect.md`): Prerequisites → Term Category → Environment Context →
   Explanation (Design Motivation / a Reality Metaphor or process breakdown / Code Examples) →
   Common Mistakes & Pitfalls → Practice Exercises → Related Terms → Key Takeaways.
2. **Obey `_meta/technology_context.md`**: React Core Contributor / Senior Frontend Architect
   persona. **Functional components ONLY** — never class components (except when explaining a
   legacy pattern). Use hooks idiomatically, the updater pattern `setX(prev => …)`, destructured
   props in the signature, `className`, and avoid unnecessary `useEffect` where derived state
   suffices. Assume the reader already knows ES6 (closures, destructuring, Promises).
3. **Use the KB's exact Category vocabulary** — *Core Hook*, *Component Pattern*,
   *Rendering Mechanic*, *Ecosystem* (Section 2 assigns one per term; a couple of tooling terms
   note "Tooling / Ecosystem" — fold them under *Ecosystem*). **Environment** must be one of
   *Client-Side (SPA)*, *Server-Side (SSR/SSG)*, or *Universal*.
4. **Fix the header numbering first (Section 0, Finding 2).** Bump `level_10/*` headers to
   "Level 10" and `level_11/*` to "Level 11", and reconcile each level's title between the index
   and the file headers so they read identically.
5. **Wire cross-links** using the relative format `../level_XX/<file>.md`, matching the
   Prerequisites/Related columns in Section 2. Every new term must be reachable from at least one
   existing term (add it to that term's Related section too). Re-run `check_mismatch.js` and, if
   present, `fix_react_links.js` after generation to confirm nothing broke.
6. **Renumber consistently.** Existing terms use `# Term #N:` headers numbered 1–56. Decide whether
   new terms append after #56 or adopt level-relative numbering, and apply it uniformly. If you
   insert terms mid-curriculum (e.g. Reconciliation into Level 1), update the index and downstream
   numbers together, or use the existing helper scripts to reshuffle.
7. **Create `_meta/missing_terms.md`** (it does not exist here yet) and record each generated term,
   mirroring the tracker convention in the other knowledge bases.
8. **🆕 vs ➕ distinction:** 🆕 terms are *used-but-undefined in existing prose/code* (highest
   priority — they close holes in what's already taught). ➕ terms are *absent but needed for
   mastery* — not currently referenced, but a learner cannot become a React "hero" without them
   (React 18 hooks, RSC directives, testing, TypeScript). Generate in the Section 4 priority order.
