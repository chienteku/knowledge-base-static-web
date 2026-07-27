# Missing Vue Terms — AI Knowledge Base (Gap Analysis)

> **Purpose:** This document is an input for an AI generation pass. It lists the terms
> that are **used in the existing `07-vue/` prose but never defined as their own term**,
> the terms the index **promised but never delivered**, and the terms a learner needs to
> reach "hero"/mastery that the curriculum never introduces — plus the relationships each
> missing term has to other missing terms and to existing terms. Every row is pre-shaped to
> drop directly into the curriculum's 8-section term template
> (`Prerequisites → Category → Environment → Explanation → Common Mistakes → Exercises → Related Terms → Key Takeaways`).
>
> **Scope reviewed:** 50 existing term files across `terms/level_01` … `terms/level_10`,
> plus `_meta/vue_terms_zero_to_hero.md` and `_meta/technology_context.md`.
>
> **Method:** (1) Diffed the index's declared filenames against the files on disk — there are
> **four promised-but-missing files, four delivered-but-unindexed files, and one filename typo**
> (Section 0). (2) `grep`-scanned the corpus for concepts that appear in prose/code but have no
> term file, counting how many files lean on each, to prioritize by blast radius. No broken
> `../level_XX/*.md` links exist, so "missing" means **index divergence** and **conceptual** gaps,
> not dangling references.

---

## 0. Structural findings the generating AI must know first

### Finding 1 — The index diverges from the files at **Levels 9 & 10** (reconcile first).

A filename diff of `_meta/vue_terms_zero_to_hero.md` against `terms/` shows three separate issues:

| Issue | Detail | Fix |
|---|---|---|
| **Filename typo** | Index says `nuxtjs.md`; the file is `nuxt.md` | Point the index at `nuxt.md` |
| **Promised but never written** (📌) | Index lists `ssg.md`, `vueuse.md`, `transition.md` — none exist on disk | Generate them (they're real gaps — see Section 2) |
| **Delivered but unindexed** | `csr.md`, `build_step.md`, `vue_cli.md` exist on disk but aren't in the index | Add them to the index |

The file headers already use the *correct* level titles (Level 9 = "Server-Side Rendering (SSR) &
Nuxt", Level 10 = "Tooling & Build Step"); it's the **index** that's stale. Reconcile by adopting
the on-disk files and adding the three 📌 terms.

**Exact index rewrite the generating AI must apply** to `_meta/vue_terms_zero_to_hero.md`
(Levels 1–8 are already correct and unchanged):

```
## Level 9: Server-Side Rendering (SSR) & Nuxt
41. Client-Side Rendering (CSR)   (csr.md)
42. Server-Side Rendering (SSR)   (ssr.md)
43. Hydration (Vue)               (hydration.md)
44. Universal Code                (universal_code.md)
45. Nuxt.js                       (nuxt.md)
     + NEW: Static Site Generation (SSG)  (ssg.md)   ← 📌 generate

## Level 10: Tooling & Build Step
46. The Build Step                (build_step.md)
47. Vite                          (vite.md)
48. Vue CLI (legacy)              (vue_cli.md)
49. Vue DevTools                  (vue_devtools.md)
50. Vue Test Utils                (vue_test_utils.md)
     + NEW: VueUse                (vueuse.md)         ← 📌 generate
     + NEW: Transitions & Animations (transition.md)  ← 📌 generate
```

This makes the index match the 50 existing files and folds the 3 promised terms back in as
honest, additive gaps.

### Finding 2 — No `missing_*` deliverable or `_meta/missing_terms.md` tracker exists yet.
When these terms are generated, create `_meta/missing_terms.md` to record them, mirroring the
`03-javascript`/`05-nodejs` tracker convention.

---

## 1. Critical gaps — concepts used in existing prose but never defined

These block comprehension the most because existing terms *depend* on them in prose/code.

| Missing Term | Why it blocks learning | Evidence (files referencing it) |
|---|---|---|
| **`v-for` (List Rendering) & `:key`** | Named as a "core directive" in `directives.md`, used in real code across the KB, and its `:key` pitfall is even *taught* inside `virtual_dom.md` — yet it's the **only core directive with no term file** (v-bind, v-on, v-model, v-if/show all have one) | `directives`, `virtual_dom`, `scoped_slots`, `v_once_memo` (4) |
| **Reactivity Loss on Destructuring & `toRefs`** | `reactive.md` and `proxy_reactivity.md` both cite "destructuring destroys reactivity" as a known trap ("You learned in Level 2…"), but the fix (`toRefs`/`toRef`) is never taught | `reactive`, `proxy_reactivity` (2, + a Level-2 forward-reference) |
| **`<script setup>` & Compiler Macros** | The mandated modern syntax appears in ~24 files and `technology_context.md` requires it, but it's never formalized as a term; macros like `defineExpose`/`defineModel` are undefined machinery | 24 files use it; `props`/`emit` show `defineProps`/`defineEmits` without defining the macro system |
| **Event, Key & Form Modifiers** | `directives.md`/`v_on.md` introduce `.prevent`/`.stop`/`.enter`, but the full modifier system (key modifiers, `.lazy`/`.number`/`.trim` on `v-model`) is scattered and never consolidated | `directives`, `v_on`, `v_model` (3) |
| **Dynamic Components (`<component :is>`)** | `keepalive.md` explains caching dynamic components but the `<component :is>` mechanism it caches is never defined | `keepalive` (+ async component discussion) |

---

## 2. Missing terms by level

Each row: **Proposed Term | description | Category | Prerequisites | Related**.
Categories follow `technology_context.md` guidance — *Vue Core Concept*, *Directive*,
*Vue Reactivity API*, *Component Pattern*, *Ecosystem Tool* (plus *Rendering Mechanic* where the
engine is the subject). Environments use the KB's set — *Client-Side*, *Server-Side*, *Build-Time*,
*Universal*, or *Composition API (`<script setup>`)*.
🆕 = used-but-undefined · 📌 = promised by index, never written · ➕ = absent but needed for mastery.

### Level 2 — Reactivity System (fix the destructuring cliff)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 `toRefs` / `toRef` | Convert a `reactive` object into refs so you can destructure without losing reactivity | Vue Reactivity API | `reactive`, `ref` | Proxy Reactivity, Composables |
| ➕ `watchEffect` (as its own term) | Auto-tracking effect that re-runs when any reactive value it reads changes (currently only a sub-note in `watchers.md`) | Vue Reactivity API | Watchers, `ref` | Computed Properties, Watchers |
| ➕ `shallowRef` / `markRaw` | Reactivity escape hatches for performance with large or external objects | Vue Reactivity API | `ref`, `reactive`, Proxy Reactivity | Virtual DOM, `v-memo` |

### Level 3 — Directives (the biggest hole in the curriculum)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 `v-for` (List Rendering) & `:key` | Loop over arrays/objects to render lists; why every item needs a stable unique `:key` | Directive | Directives, Template Syntax | Virtual DOM, `v-if` / `v-show`, `v-memo` |
| 🆕 Event, Key & Form Modifiers | The `.prevent`/`.stop`/`.enter`/`.lazy`/`.number`/`.trim` suffixes that move DOM logic into the template | Directive | `v-on`, `v-model` | Directives |
| ➕ Custom Directives (`v-*`) | Writing your own directive with lifecycle hooks (`mounted`, `updated`) for low-level DOM access | Directive | Directives, Component Lifecycle | `v-bind`, Composables |

### Level 4 — Components & Props (formalize the syntax everyone already uses)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 `<script setup>` & Compiler Macros | The compile-time sugar for Composition API components, and its macros (`defineProps`, `defineEmits`, `defineModel`, `defineExpose`) | Vue Core Concept | Composition API, Components | Props, Emitting Events, SFC |
| ➕ Dynamic Components (`<component :is>`) | Swapping which component renders at runtime by binding `:is` | Component Pattern | Components, `v-bind` | KeepAlive, Async Components |
| ➕ Fallthrough Attributes (`$attrs`) | How non-prop attributes/listeners pass through a component to its root element | Component Pattern | Props, Components | Emitting Events |
| ➕ `nextTick` | Awaiting the next DOM flush after a reactive change (why the DOM "isn't updated yet") | Vue Core Concept | Reactive State, Component Lifecycle | Watchers, Virtual DOM |

### Level 5 — Advanced Component Architecture (async UX)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| ➕ `<Suspense>` (Vue) | Built-in wrapper that shows a fallback while nested async setup/components resolve | Component Pattern | Async Components, Composables | Teleport, Hydration |

### Level 6 — Routing (the everyday router API)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| ➕ Programmatic Navigation (`useRouter` / `useRoute`) | Navigating and reading route params from script instead of `<router-link>` | Ecosystem Tool | Vue Router, Composition API | Navigation Guards, Dynamic Routing |
| ➕ Route Params, Query & Meta | Reading `:id` params, query strings, and per-route `meta` fields | Ecosystem Tool | Dynamic Routing, Nested Routes | Navigation Guards |

### Level 9 — SSR & Nuxt (the promised rendering strategy)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 📌 Static Site Generation (SSG) | Pre-rendering pages to static HTML at build time (the third strategy alongside CSR/SSR) | Rendering Mechanic | Server-Side Rendering, Universal Code | Client-Side Rendering, Nuxt.js, Hydration |

### Level 10 — Tooling & Build Step (the promised ecosystem + testing depth)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 📌 VueUse | The collection of ready-made composables (mouse, storage, debounce) that models composable design | Ecosystem Tool | Composables, `ref` | `watchEffect`, `toRefs` |
| 📌 Transitions & Animations (`<Transition>` / `<TransitionGroup>`) | Built-in components that animate elements/lists entering and leaving the DOM | Component Pattern | Components, `v-if` / `v-show`, `v-for` | Dynamic Components |
| ➕ Vitest (Unit Testing) | The Vite-native test runner that pairs with Vue Test Utils | Ecosystem Tool | Vue Test Utils, Vite | Build Step |
| ➕ TypeScript with Vue | Typing props/emits/refs and using `defineProps<T>()` generics | Ecosystem Tool | `<script setup>` & Compiler Macros, Props | Composables |

---

## 3. Relationship map (dependency graph)

Notation: `A → B` means **"A requires / builds on B"**. **Bold** = existing term; plain = missing.

### Cluster 1 — The reactivity system (deepens Level 2)
```
**reactive** → toRefs / toRef   (the fix for the destructuring trap)
**ref** → shallowRef / markRaw  (escape hatches)
**Watchers** → watchEffect
**Proxy Reactivity** → toRefs   (explains *why* destructuring breaks tracking)
```

### Cluster 2 — Directives & the template (deepens Level 3, the biggest hole)
```
**Directives** → v-for (List Rendering) & :key → **Virtual DOM** (diffing needs keys)
**Directives** → Event, Key & Form Modifiers → **v-on** / **v-model**
**Directives** → Custom Directives → **Component Lifecycle**
v-for & :key → **v-memo** / **v-once**   (list-level optimization)
```

### Cluster 3 — Component authoring syntax (deepens Level 4)
```
**Composition API** → <script setup> & Compiler Macros
                        ├─→ **Props** (defineProps)
                        ├─→ **Emitting Events** (defineEmits)
                        └─→ defineModel / defineExpose
**Components** → Dynamic Components (<component :is>) → **KeepAlive** / **Async Components**
**Components** → Fallthrough Attributes ($attrs)
Reactive State → nextTick   (await the DOM flush)
```

### Cluster 4 — Async & advanced architecture (Level 5)
```
**Async Components** → <Suspense> → **Teleport** (overlay UX)
<Suspense> → **Hydration**   (SSR async boundaries)
```

### Cluster 5 — Routing in practice (Level 6)
```
**Vue Router** → Programmatic Navigation (useRouter / useRoute)
**Dynamic Routing** → Route Params, Query & Meta → **Navigation Guards**
```

### Cluster 6 — Rendering strategies & tooling (Levels 9–10)
```
**CSR** / **SSR** → Static Site Generation (SSG) → **Nuxt.js** → **Hydration**
**Composables** → VueUse
**v-if/show** + v-for → Transitions & Animations (<Transition>/<TransitionGroup>)
**Vue Test Utils** → Vitest → **Build Step** / **Vite**
<script setup> & Macros → TypeScript with Vue
```

---

## 4. Suggested generation priority

| Tier | Rationale | Terms |
|---|---|---|
| **P0 — Reconcile the index (Levels 9–10)** | Structural fix from Section 0 so numbering/filenames are stable before adding terms | *Rename `nuxtjs.md`→`nuxt.md`; add `csr.md`/`build_step.md`/`vue_cli.md`; fold in the 3 📌 terms* |
| **P1 — Fill the glaring directive/syntax holes** | Concepts existing prose already leans on and teaches around | `v-for` (List Rendering) & `:key` · `<script setup>` & Compiler Macros · `toRefs` / `toRef` · Event/Key/Form Modifiers |
| **P2 — The promised-but-missing terms** | Index literally advertises these files | Static Site Generation (SSG) · VueUse · Transitions & Animations |
| **P3 — Everyday APIs a junior hits fast** | Needed for real components/apps | Dynamic Components (`<component :is>`) · `nextTick` · Programmatic Navigation (`useRouter`/`useRoute`) · Fallthrough Attributes (`$attrs`) · `watchEffect` |
| **P4 — Mastery breadth** | Rounds out the "hero" path | Custom Directives · `<Suspense>` · Route Params/Query/Meta · `shallowRef`/`markRaw` · Vitest · TypeScript with Vue |

---

## 5. Notes for the generating AI

1. **Follow the existing 8-section template exactly** (see `terms/level_02/ref.md` and
   `terms/level_03/directives.md`): Prerequisites → Term Category → Environment Context →
   Explanation (1. Design Motivation / 2. How it works under the hood / 3. Real-world application
   & trade-offs) → Common Mistakes & Pitfalls (with a "Golden Rule") → Practice Exercises (with a
   `<details>` hint block) → Related Terms → Key Takeaways.
2. **Obey `_meta/technology_context.md`**: Senior Frontend Architect persona — pragmatic,
   performance-oriented, "magic is just well-hidden machinery." Emphasize **Vue 3 + Composition
   API + `<script setup>`**; briefly acknowledge the Options API for Vue 2 transitioners but assert
   Composition API is the future. Explicitly contrast Vue's **Proxy-based reactivity** ("state
   tracks its own dependencies") with React's re-render model. Treat **Vite** and **Pinia** as the
   modern standards (Vue CLI/Vuex are legacy). Praise SFCs and standard HTML/CSS over JSX.
3. **Use the KB's Category vocabulary** — *Vue Core Concept*, *Directive*, *Vue Reactivity API*,
   *Component Pattern*, *Ecosystem Tool* (Section 2 assigns one per term). **Environment** must be
   one of *Client-Side*, *Server-Side*, *Build-Time*, *Universal*, or *Composition API
   (`<script setup>`)*.
4. **Reconcile the index first (Section 0, Finding 1).** Apply the exact Level 9–10 rewrite:
   fix the `nuxtjs.md`→`nuxt.md` typo, add the three unindexed files, and add the three 📌 terms.
   Levels 1–8 are already correct — do not touch them.
5. **Code style must match `technology_context.md`:** all examples in Vue 3 `<script setup>`;
   use `ref`/`reactive` correctly (remember `.value` in script, auto-unwrap in template); specify
   the language on every code block (`vue`, `javascript`, `html`).
6. **Wire cross-links** using the relative format `../level_XX/<file>.md`, matching the
   Prerequisites/Related columns in Section 2. Every new term must be reachable from at least one
   existing term (add it to that term's Related section too) — e.g. add `v-for` to `directives.md`
   and `virtual_dom.md` Related lists.
7. **Renumber consistently.** Existing terms use `# Term #N:` headers numbered 1–50. Decide whether
   new terms append after #50 or adopt level-relative numbering, and apply it uniformly; when you
   insert a term mid-curriculum (e.g. `v-for` into Level 3), update the index and downstream
   numbers together.
8. **Create `_meta/missing_terms.md`** (it does not exist here yet) and record each generated term,
   mirroring the tracker convention in the other knowledge bases.
9. **Marker meaning:** 🆕 = used-but-undefined in existing prose/code (highest priority — closes
   holes in what's already taught, e.g. `v-for`). 📌 = the index promised a file that was never
   written (SSG, VueUse, Transitions). ➕ = absent but needed for mastery (not yet referenced).
   Generate in the Section 4 priority order.
