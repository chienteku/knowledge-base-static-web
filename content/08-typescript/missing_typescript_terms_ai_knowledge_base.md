# Missing TypeScript Terms — AI Knowledge Base (Gap Analysis)

> **Purpose:** This document is an input for an AI generation pass. It lists the terms
> that are **used in the existing `08-typescript/` prose but never defined as their own term**,
> plus the terms a learner needs to reach "hero"/mastery that the curriculum never introduces,
> plus the relationships each missing term has to other missing terms and to existing terms.
> Every row is pre-shaped to drop directly into the curriculum's 8-section term template
> (`Prerequisites → Category → Environment → Explanation → Common Mistakes → Exercises → Related Terms → Key Takeaways`).
>
> **Scope reviewed:** 58 existing term files across `terms/level_01` … `terms/level_10`,
> plus `_meta/typescript_terms_zero_to_hero.md` and `_meta/technology_context.md`.
>
> **Method:** (1) Diffed the index's declared filenames against disk — a **perfect 1:1 match by
> filename** (all 58 present, none orphaned). (2) Cross-checked each file's internal
> `# Term #N` number and `> **Level X — …**` header against the index and its directory — this
> surfaced a **level-grouping inconsistency** (Section 0). (3) `grep`-scanned the corpus for
> concepts that appear in prose/code but have no term file, filtering false positives (e.g.
> "inferred" vs the `infer` keyword) by matching real token usage. No broken links exist, so
> "missing" means **conceptual** gaps plus the grouping inconsistency, not dangling references.

---

## 0. Structural findings the generating AI must know first

### Finding 1 — Term numbers are a clean spine, but the **level grouping disagrees three ways**.

Every term carries a correct, unique `# Term #N` (1–58) and every index filename exists on disk.
**Do not renumber the terms.** However, for terms **31–45**, the *index*, the *directory folders*,
and the *files' own `> **Level X**` headers* group and title them inconsistently — and two
directories even contain files with **two different level titles**:

| Terms | Index (`_meta`) says | Directory on disk | Internal `> **Level**` header(s) |
|---|---|---|---|
| 31–35 (generics core) | **Level 7: Generics** | `terms/level_08/` | `Level 8 — Generics` |
| 36–40 (utility types) | **Level 7: Generics** (same level) | `terms/level_07/` | `Level 7 — Utility Types` |
| 41, 44, 45 (keyof, conditional, mapped) | **Level 8: Advanced Types** | `terms/level_10/` | `Level 10 — Advanced TypeScript Concepts` |
| 42, 43 (typeof, indexed access) | **Level 8: Advanced Types** | `terms/level_08/` | `Level 8 — Advanced Types` |
| 52–58 (modules/config) | **Level 10: Modules…** | `terms/level_10/` | `Level 10 — Modules, Declaration Files & Configuration` |

So generics term #31 physically lives in `level_08/`, while advanced-type terms #41/#44/#45 live in
`level_10/` next to the modules terms — and `level_08/` and `level_10/` each mix two level titles.
Minor drift also exists in Level 9: `static_members.md` says "Level 9 — Classes & OOP in TypeScript"
while its five siblings say "Level 9 — Object-Oriented Programming (OOP)".

**Recommended canonical grouping (adopt one scheme and make the index, dir names, and headers all
agree).** Because the term-number blocks 31–35 / 36–40 / 41–45 are already coherent, the cleanest
fix is to treat them as three distinct levels — an **11-level** curriculum:

```
Level 7  — Generics                                 (31–35)  → generics, multiple_generics,
                                                                generic_constraints,
                                                                generic_interfaces_classes,
                                                                default_generics
Level 8  — Utility Types                             (36–40)  → utility_types, partial_required,
                                                                pick_omit, record, returntype
Level 9  — Advanced Types                            (41–45)  → keyof, typeof, indexed_access,
                                                                conditional_types, mapped_types
Level 10 — Classes & OOP in TypeScript               (46–51)  → classes, access_modifiers,
                                                                implements, abstract_classes,
                                                                static_members, parameter_properties
Level 11 — Modules, Declaration Files & Configuration (52–58) → modules, namespaces,
                                                                declaration_files, definitely_typed,
                                                                enums, const_assertions, strict_mode
```

If the "10 levels" count must be preserved, instead merge Classes & OOP + Modules/Config into one
final level — but either way, **make one grouping authoritative and rewrite the mismatched
directory names and `> **Level X**` headers to match it** (and fix the `static_members.md` title).
This is a labeling/foldering fix only; no term content or numbering changes.

### Finding 2 — No `missing_*` deliverable or `_meta/missing_terms.md` tracker exists yet.
When these terms are generated, create `_meta/missing_terms.md` to record them, mirroring the
`03-javascript`/`05-nodejs` tracker convention.

---

## 1. Critical gaps — concepts used in existing prose but never defined

These block comprehension the most because existing terms *depend* on them in prose/code.

| Missing Term | Why it blocks learning | Evidence (files referencing it) |
|---|---|---|
| **Structural Typing / Duck Typing** | `technology_context.md` mandates it as a headline concept ("TypeScript is a **Structural** Type System, not Nominal"), and four terms lean on it to explain themselves — yet it has no term of its own | `in_operator`, `generic_constraints`, `implements` (+ tech context) |
| **The `infer` Keyword** | Conditional types and `ReturnType` are *built on* `infer R`, and `conditional_types.md`/`literal_types.md` use it directly, but the keyword is never defined | `conditional_types`, `literal_types`, (`returntype` depends on it) |
| **Declaration Merging** | Cited as *the* distinguishing feature of `interface` vs `type` in three places (and a "common mistake"), but never given its own term | `interfaces`, `type_aliases` (3) |
| **Type-Only Imports (`import type`)** | `modules.md` introduces `import type` and ties it to build-time erasure and dependency cycles, but it's only a sub-note | `modules` |
| **Exhaustiveness Checking (with `never`)** | Discriminated unions + `never` combine into the exhaustive-`switch` pattern referenced as best practice, but the pattern is never taught as a term | `discriminated_unions`, `void_never` (3) |
| **Extended Utility Types (`Exclude` / `Extract` / `NonNullable` / `Parameters` / `Awaited`)** | Used as examples in `returntype.md` and `conditional_types.md`, and implied by the `utility_types` overview, but only Partial/Required/Pick/Omit/Record/ReturnType get their own files | `returntype`, `conditional_types`, `utility_types` |

---

## 2. Missing terms by level

Each row: **Proposed Term | description | Category | Prerequisites | Related**.
Categories follow `technology_context.md` (Types, Compiler, Architecture) refined into the ones the
KB already implies — *Type System Fundamental*, *Type Operator*, *Advanced Type*, *Utility Type*,
*OOP*, *Compiler / Config*, *Module System*. **Environment** must be *Build-time*, *Runtime*, or
*Both* (the crucial TS distinction). 🆕 = used-but-undefined · ➕ = absent but needed for mastery.
*Level numbers below use the canonical 11-level grouping from Section 0.*

### Level 1 — Core Concepts (the foundational mental model that's mandated but missing)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 Structural Typing / Duck Typing | TS compares types by *shape*, not name — "if it has the right properties, it fits" | Type System Fundamental | TypeScript, Static vs Dynamic Typing | Interfaces, `implements`, Generic Constraints |
| ➕ Type Widening | Why `let x = "a"` is inferred as `string` (widened) but `const x = "a"` as `"a"` (literal) | Type System Fundamental | Type Inference, Literal Types | Const Assertions, `satisfies` |

### Level 2 — Basic Types (null-safety, the core of strict mode)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 `null`, `undefined` & `strictNullChecks` | How TS models absence and why `strict` forces you to handle it (`T \| null`) | Type System Fundamental | Primitive Types, `void` & `never` | Strict Mode, Non-null Assertion, Type Narrowing |

### Level 3 — Object Types & Interfaces (the interface-vs-type differentiators)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 Declaration Merging | Declaring the same `interface`/`namespace` twice merges them — the key `interface`-only power | Type System Fundamental | Interfaces, Type Aliases | Namespaces, Declaration Files |
| ➕ Excess Property Checks | Why object *literals* are checked more strictly than variables assigned to the same type | Type System Fundamental | Object Types, Interfaces | Type Assertions, Optional Properties |

### Level 5 — Union & Intersection Types (the assertion escape hatches)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| ➕ Non-null Assertion (`!`) | The postfix `!` that tells the compiler "trust me, this isn't null" (and when it's a foot-gun) | Type Operator | Type Assertions, `null`/`undefined` & strictNullChecks | Type Narrowing, Optional Properties |
| ➕ `satisfies` Operator | Validate a value against a type *without* widening it away (TS 4.9) | Type Operator | Type Assertions, Type Widening | Const Assertions, Literal Types |

### Level 6 — Type Narrowing & Guards (complete the guard family)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 Exhaustiveness Checking (`never`) | Using a `never` assignment in the `default`/`else` to force handling every union member | Type System Fundamental | Discriminated Unions, `void` & `never` | Custom Type Guards, Union Types |
| ➕ Assertion Functions (`asserts`) | Functions that narrow by *throwing* (`asserts x is Foo`) — the sibling of `is` guards | Type Operator | Custom Type Guards, Type Narrowing | Non-null Assertion |

### Level 8 — Utility Types (fill out the standard library)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 `Exclude` / `Extract` / `NonNullable` | The union-filtering utilities used in examples but never defined | Utility Type | Utility Types Overview, Union Types | Conditional Types, `keyof` |
| 🆕 `Parameters` / `ConstructorParameters` / `Awaited` | Extract a function's arg tuple or unwrap a Promise's resolved type | Utility Type | Utility Types Overview, `ReturnType` | `infer`, Conditional Types |

### Level 9 — Advanced Types (the type-level programming engine)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 The `infer` Keyword | Capture a type inside a conditional type (`T extends (infer U)[] ? U : never`) | Advanced Type | Conditional Types, Generics | `ReturnType`, `Awaited` |
| ➕ Template Literal Types | Build & manipulate string types (`` `get${Capitalize<K>}` ``) — the string engine of modern TS | Advanced Type | Literal Types, Union Types | Mapped Types, `keyof` |
| ➕ Key Remapping in Mapped Types (`as`) | Rename/filter keys while mapping (`[K in keyof T as ...]`) — TS 4.1 | Advanced Type | Mapped Types, `keyof`, Template Literal Types | Conditional Types |
| ➕ Branded / Nominal Types | Simulate nominal typing (e.g. `UserId` vs `string`) on top of a structural system | Advanced Type | Structural Typing / Duck Typing, Intersection Types | Type Aliases, Literal Types |

### Level 10 — Classes & OOP (the missing framework-critical feature)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| ➕ Decorators | `@Component`-style annotations that add metadata/behavior to classes & members (Angular/NestJS) | OOP | Classes, Access Modifiers | Static Members, Declaration Files |

### Level 11 — Modules, Declaration Files & Configuration (build-graph reality)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| 🆕 Type-Only Imports/Exports (`import type`) | Imports that are erased at build time — avoids runtime cycles & bloat | Module System | ES Modules in TypeScript, Declaration Files | Declaration Merging, tsconfig |
| ➕ Module Resolution & Path Aliases | How `tsc` finds modules (`node`/`bundler`) and `paths`/`baseUrl` aliases | Compiler / Config | tsconfig.json, ES Modules in TypeScript | Declaration Files, DefinitelyTyped |

---

## 3. Relationship map (dependency graph)

Notation: `A → B` means **"A requires / builds on B"**. **Bold** = existing term; plain = missing.

### Cluster 1 — The structural foundation (deepens Level 1, mandated by tech context)
```
**TypeScript** → Structural Typing / Duck Typing
Structural Typing → **Interfaces** / **implements** / **Generic Constraints**  (all explain via it)
Structural Typing → Branded / Nominal Types   (how to *escape* structural when you need nominal)
**Type Inference** → Type Widening → Const Assertions / satisfies
```

### Cluster 2 — Null safety & assertions (Levels 2 & 5)
```
**Strict Mode** → null/undefined & strictNullChecks → Non-null Assertion (!)
null/undefined → **Type Narrowing** → Assertion Functions (asserts)
Type Widening → satisfies Operator → **Const Assertions**
```

### Cluster 3 — Narrowing & guards completion (Level 6)
```
**Custom Type Guards** (is) → Assertion Functions (asserts)
**Discriminated Unions** + **never** → Exhaustiveness Checking → **Union Types**
```

### Cluster 4 — Interfaces, merging & modules (Levels 3 & 11)
```
**Interfaces** → Declaration Merging → **Namespaces** (also merge)
**ES Modules** → Type-Only Imports (import type) → **Declaration Files**
**tsconfig.json** → Module Resolution & Path Aliases → **DefinitelyTyped**
```

### Cluster 5 — The type-level programming engine (Levels 8–9)
```
**Conditional Types** → the infer Keyword → **ReturnType** / Awaited / Parameters
**Utility Types** → Exclude / Extract / NonNullable   (union filtering via Conditional Types)
**Literal Types** → Template Literal Types → Key Remapping in Mapped Types (as)
**Mapped Types** + **keyof** → Key Remapping in Mapped Types
Structural Typing → Branded / Nominal Types → **Intersection Types**
```

### Cluster 6 — OOP metadata (Level 10)
```
**Classes** → Decorators → **Access Modifiers** / **Static Members**
Decorators → Declaration Files   (typing third-party decorators)
```

---

## 4. Suggested generation priority

| Tier | Rationale | Terms |
|---|---|---|
| **P0 — Unify the level grouping** | Structural fix from Section 0 so levels/dirs/headers agree (no renumbering) | *Adopt the canonical grouping; rewrite mismatched dir names & `> **Level X**` headers; fix `static_members.md` title* |
| **P1 — Foundational concepts existing prose leans on** | Asserted/used everywhere but undefined | Structural Typing / Duck Typing · The `infer` Keyword · Declaration Merging · null/undefined & strictNullChecks |
| **P2 — Complete half-taught families** | Referenced as examples/sub-notes, need their own term | Exclude/Extract/NonNullable · Parameters/Awaited · Exhaustiveness Checking (`never`) · Type-Only Imports (`import type`) |
| **P3 — Modern everyday TS (v4.9–v5+)** | Required to write current idiomatic TypeScript | Template Literal Types · `satisfies` Operator · Non-null Assertion (`!`) · Assertion Functions (`asserts`) · Key Remapping in Mapped Types · Type Widening |
| **P4 — Mastery breadth & ecosystem** | Rounds out the "hero" path | Decorators · Branded / Nominal Types · Excess Property Checks · Module Resolution & Path Aliases |

---

## 5. Notes for the generating AI

1. **Follow the existing 8-section template exactly** (see `terms/level_02/unknown.md`,
   `terms/level_10/conditional_types.md`): Prerequisites → Term Category → Environment Context →
   Explanation (1. Design Motivation / 2. Core mechanics / 3. Real-world usage) → Common Mistakes
   & Pitfalls (with a "Golden Rule") → Practice Exercises (with a `<details>` hint block) →
   Related Terms → Key Takeaways. Use the `> **Level X — [Name]**` quote block under the H1.
2. **Obey `_meta/technology_context.md`**: Senior Full-Stack Architect persona; pragmatic, exact,
   structural. Champion **Strict Mode** and **Type Inference**; treat **`any` as a code smell**
   (steer to `unknown`/generics); stress the **Type Aliases vs Interfaces** distinction; and
   repeatedly frame TS as a **Structural (Duck-Typed)** system — which is exactly why the new
   "Structural Typing" term (P1) is so load-bearing.
3. **Always mark the Build-time vs Runtime boundary** in Section 3 — it's the crux of many of these
   terms (`import type` erases at build time; Decorators emit runtime code; type-level features like
   `infer`/mapped types vanish at runtime).
4. **Unify the level grouping first (Section 0, Finding 1).** Pick the canonical scheme, then make
   the `_meta` index, the directory names, and every file's `> **Level X**` header agree. Do **not**
   change any `# Term #N` number — the numbering is already correct and is the stable spine.
5. **Use the KB's Category vocabulary** — the tech context names *Types, Compiler, Architecture*;
   Section 2 refines these (*Type System Fundamental, Type Operator, Advanced Type, Utility Type,
   OOP, Compiler / Config, Module System*). Align each new term to the closest label already in use.
6. **Wire cross-links** using relative paths `../level_XX/<file>.md`, matching the
   Prerequisites/Related columns in Section 2. Every new term must be reachable from at least one
   existing term (add it to that term's Related section too) — e.g. add `infer` to
   `conditional_types.md` and `returntype.md`, and Structural Typing to `implements.md`.
7. **Renumber additions consistently.** Existing terms run `# Term #1`…`#58`. Decide whether new
   terms append after #58 or slot into their level with a decimal/level-relative scheme, and apply
   it uniformly across the index and headers.
8. **Create `_meta/missing_terms.md`** (it does not exist here yet) and record each generated term,
   mirroring the tracker convention in the other knowledge bases.
9. **Marker meaning:** 🆕 = used-but-undefined in existing prose/code (highest priority — closes
   holes in what's already taught, e.g. `infer`, Structural Typing). ➕ = absent but needed for
   mastery (modern TS a "hero" must know: Template Literals, `satisfies`, Decorators). Generate in
   the Section 4 priority order.
