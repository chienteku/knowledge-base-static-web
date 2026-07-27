# Missing JavaScript Terms — AI Knowledge-Base Gap Analysis

> **Purpose of this file.** The current curriculum in `terms/level_01` … `terms/level_10`
> defines **117 terms** (see `_meta/javascript_terms_zero_to_hero.md`). Reviewing it as a
> junior engineer trying to *learn JavaScript from these files alone*, I hit **gaps**:
> concepts that the existing docs **use, assume, or reference in prose but never define as
> their own term**. This file catalogs those gaps so an AI can generate the missing term
> docs and make the knowledge base self-contained.
>
> **How to read this file.**
> - **Section 1** — the critical gaps (concepts used everywhere but never taught).
> - **Section 2** — the full list of missing terms, grouped by the level they belong to.
>   Each row is shaped to drop straight into the term-doc template: it names the
>   **prerequisites** and **related terms** so the `## 1. Prerequisites` and
>   `## 7. Related Terms` sections can be filled in automatically.
> - **Section 3** — the relationship map (dependency graph) between missing terms and
>   existing terms.
> - **Section 4** — suggested generation priority.
>
> **Evidence method.** "Gap" = concept appears in prose/code of ≥1 existing term file but
> has no dedicated `terms/level_XX/<term>.md`. Counts below are files that mention the
> concept (found via `grep -rl` across `terms/`).

---

## 1. Critical Gaps (used pervasively, never defined)

These block comprehension the most because existing lessons rely on them without explanation.

| Gap | Evidence (files mentioning it) | Why it blocks learning |
|-----|-------------------------------|------------------------|
| **Strict vs Loose Equality (`===` / `==`)** | `===` in ~29 files; `technology_context.md` *mandates* `===` | The most-used operator in every code sample is never defined. A learner sees `===` everywhere but no doc explains why not `==`, or what coercion `==` triggers. |
| **Error Handling (`try` / `catch` / `finally`)** | `try` in ~43 files, `catch` in ~11, `throw` in ~31; `technology_context.md` requires `try...catch` in async code | The guidelines demand error handling, and `.catch()` (Term #72) implies rejection handling, but the `try/catch/finally` statement and the `throw` mechanism are never taught. |
| **`Error` object & error types** | referenced alongside `throw`/`catch` | `TypeError`, `RangeError`, custom errors, and `error.message` are used in examples but undefined. |
| **Timers (`setTimeout` / `setInterval` / `clearTimeout`)** | `setTimeout` in ~13 files, `setInterval` in ~3 | The **Macrotask Queue** (Term #76), **Debounce** (#106), and **Throttle** (#107) docs all depend on `setTimeout`, yet it has no term of its own. |
| **`JSON` / `JSON.stringify` / `JSON.parse`** | ~7 files | Fundamental for `fetch` responses (Term #74) and data handling; used but never defined. |
| **Reference vs Value (copy semantics)** | implied across Object/Array/closure docs | Junior devs' #1 confusion. Objects/arrays are "copied by reference"; primitives "by value" — assumed by `spread`, `Object.assign`, closures, but never stated. |
| **`window` / `document` / BOM** | `window` in ~19 files | The DOM docs assume a global `window`/`document` host object; the Browser Object Model is never introduced. |
| **Comparison operators (`>`, `<`, `>=`, `<=`) & arithmetic operators (`+ - * / %`)** | used in nearly every loop/condition | Loops and `if` conditions rely on operators that have no foundational term. |

---

## 2. Missing Terms by Level

> Legend for **Category**: `Language Core` / `Browser API / DOM` / `Ecosystem / Tooling`
> (per `technology_context.md`). **Prereqs** and **Related** reference existing terms by
> name (see zero-to-hero list) or other *missing* terms (marked with 🆕).

### Level 1 — Foundations (operators & number model)

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Operator** [DONE] | Symbol that performs an operation on operands (umbrella concept). | Language Core | Expression, Statement | Arithmetic/Comparison/Assignment Operators |
| **Arithmetic Operators** [DONE] | `+ - * / % **` for math on numbers. | Language Core | Number, Operator | Type Coercion, NaN |
| **Assignment Operators** [DONE] | `=`, `+=`, `-=`, `*=`, … store/update values. | Language Core | Variable, Operator | let, const |
| **Comparison Operators** [DONE] | `> < >= <=` compare two values, yielding a Boolean. | Language Core | Boolean, Operator | Strict/Loose Equality, if/else |
| **Strict vs Loose Equality (`===` vs `==`)** [DONE] | Identity comparison with/without type coercion; `!==`/`!=`. | Language Core | Type Coercion, Boolean | Comparison Operators, Truthy/Falsy, NaN |
| **Increment / Decrement (`++` / `--`)** [DONE] | Add/subtract one; prefix vs postfix. | Language Core | Number, Variable | for Loop, Arithmetic Operators |
| **Ternary / Conditional Operator (`? :`)** [DONE] | Inline one-expression `if/else`. | Language Core | if/else, Expression | Truthy/Falsy, Logical Operators |
| **Operator Precedence & Associativity** [DONE] | The order operators evaluate in an expression. | Language Core | Operator, Expression | Arithmetic Operators |
| **`NaN`** [DONE] | "Not-a-Number"; result of invalid math; not equal to itself. | Language Core | Number, Type Coercion | Strict Equality, parseInt |
| **`Infinity` / `-Infinity`** [DONE] | Numeric value beyond the max representable number. | Language Core | Number | NaN, Arithmetic Operators |
| **`BigInt`** [DONE] | Primitive for arbitrarily large integers (`123n`). | Language Core | Number, Primitive Types | typeof |
| **Dynamic & Weak Typing** [DONE] | Types attach to values at runtime; JS auto-coerces. | Language Core | Type Coercion, typeof | Primitive Types, TypeScript |
| **Automatic Semicolon Insertion (ASI)** [DONE] | How/when JS inserts missing semicolons; pitfalls. | Language Core | Statement | comments |

### Level 2 — Control Flow, Built-in Objects & Data Access

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **`break` / `continue`** [DONE] | Exit a loop early / skip to next iteration. | Language Core | for Loop, while Loop | switch, 🆕 Labeled Statements |
| **Property Access (dot vs bracket notation)** [DONE] | `obj.key` vs `obj["key"]`; dynamic keys. | Language Core | Object, Property | 🆕 Computed Property Names, Method |
| **Array Index & `.length`** [DONE] | Zero-based positional access and size of an array. | Language Core | Array | for Loop, 🆕 Array mutating methods |
| **String Methods** [DONE] | `slice`, `split`, `toUpperCase`, `includes`, `trim`, … | Language Core | String | Template Literals, 🆕 Array Methods |
| **Number Methods & Parsing** [DONE] | `parseInt`, `parseFloat`, `toFixed`, `Number()`. | Language Core | Number, Type Coercion | NaN, Math object |
| **`Math` object** [DONE] | Built-in math utilities (`round`, `random`, `max`…). | Language Core | Number | Number Methods |
| **`Date` object** [DONE] | Representing and manipulating dates/times. | Language Core | Object | 🆕 Timers, JSON |

### Level 3 — Functions & Scope

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Recursion** [DONE] | A function that calls itself until a base case. | Language Core | Function, return Statement, Call Stack | Higher-Order Function, 🆕 Tail Call Optimization |
| **Lexical (Static) Scope / Environment** [DONE] | Scope determined by *where* code is written, not called. | Language Core | Scope, Block Scope | Closure, Hoisting, Arrow Function |
| **Pure Function & Side Effects** [DONE] | Output depends only on input; no external mutation. | Language Core | Function, parameters | 🆕 Immutability, 🆕 Functional Programming |
| **Anonymous Function** [DONE] | A function without a name (often a callback/expression). | Language Core | Function Expression, Callback Function | Arrow Function, IIFE |
| **`call` / `apply` / `bind`** [DONE] (relocated to Level 7) | Explicitly set a function's `this` and arguments. | Language Core | Function, Arguments | this Keyword, Reference vs Value |
| **Default `this` Binding Rules** [DONE] (relocated to Level 7) | Implicit/explicit/new/arrow rules for `this`. | Language Core | this Keyword | call/apply/bind, Arrow Function, new Keyword |

### Level 4 — Array Methods (beyond iteration helpers)

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Mutating vs Non-mutating Methods** [DONE] | Which array methods change the original vs return new. | Language Core | Array, 🆕 Reference vs Value | 🆕 Immutability, Spread Syntax |
| **`push` / `pop` / `shift` / `unshift`** [DONE] | Add/remove at the end/start of an array (mutating). | Language Core | Array, Array Index & length | Mutating vs Non-mutating |
| **`slice` / `splice`** [DONE] | Copy a sub-array (pure) vs insert/remove in place (mutating). | Language Core | Array, Array Index | push/pop, Spread Syntax |
| **`concat` / `join` / `split`** [DONE] | Merge arrays / array→string / string→array. | Language Core | Array, String | Spread Syntax, String Methods |
| **`indexOf` / `includes` / `findIndex`** [DONE] | Search for elements/positions in an array. | Language Core | Array, Strict Equality | find, some |
| **`sort` / `reverse`** [DONE] | Order elements (with comparator) / reverse order. | Language Core | Array, Callback Function | Comparison Operators |
| **`flat` / `flatMap`** [DONE] | Flatten nested arrays / map-then-flatten. | Language Core | Array, map | reduce |
| **`Array.from` / `Array.of` / `Array.isArray`** [DONE] | Create arrays from iterables/args; type-check. | Language Core | Array, 🆕 Iterables | Spread Syntax, Set |
| **Method Chaining** [DONE] | Calling array methods in sequence (`.filter().map()…`). | Language Core | map, filter, reduce | Pure Function |

### Level 5 — DOM & Browser Environment

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **`window` object / BOM** [DONE] | The browser global object hosting timers, location, etc. | Browser API / DOM | Global Scope, JavaScript Engine | DOM, document object, Web Storage |
| **`document` object** [DONE] | Entry point to the DOM tree for a page. | Browser API / DOM | DOM, Node, window object | document.querySelector |
| **`querySelectorAll` & NodeList** [DONE] | Select *all* matching elements; iterate a NodeList. | Browser API / DOM | document.querySelector | for...of, forEach |
| **`getElementById` / `getElementsByClassName`** [DONE] | Legacy element selection APIs. | Browser API / DOM | DOM, Node | document.querySelector |
| **DOM Manipulation (`createElement`, `appendChild`, `remove`)** [DONE] | Create/insert/delete nodes dynamically. | Browser API / DOM | DOM, Node, document object | innerHTML/textContent |
| **`innerHTML` / `textContent` / `innerText`** [DONE] | Read/write element content (HTML vs text). | Browser API / DOM | Node, DOM Manipulation | 🆕 XSS safety |
| **`classList` & `setAttribute`/`getAttribute`** [DONE] | Modify element classes and attributes. | Browser API / DOM | Node | DOM Manipulation |
| **Event object** [DONE] | The object passed to listeners (`target`, `type`, `key`). | Browser API / DOM | Event, Event Listener | event.target vs currentTarget, Event Delegation |
| **`event.target` vs `event.currentTarget`** [DONE] | Element that fired vs element the listener is on. | Browser API / DOM | Event object, Event Delegation | Event Bubbling |
| **DOM Traversal** [DONE] | `parentNode`, `children`, `nextSibling`, `closest`. | Browser API / DOM | DOM, Node | Event Delegation |
| **Web Storage (`localStorage` / `sessionStorage`)** [DONE] | Persist key/value string data in the browser. | Browser API / DOM | window object, 🆕 JSON | 🆕 Cookies |
| **Timers (`setTimeout` / `setInterval` / `clearTimeout`)** [DONE] | Schedule deferred/repeated callbacks. | Browser API / DOM | Callback Function, window object | Macrotask Queue, Debounce, Throttle, Event Loop |
| **`DOMContentLoaded` / `load` events** [DONE] | Lifecycle events for when the page/DOM is ready. | Browser API / DOM | Event, Event Listener | document object |

### Level 6 — Asynchronous JavaScript

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **`Promise.all` / `allSettled` / `race` / `any`** [DONE] | Combinators for running promises in parallel. | Language Core | Promise, then/catch | Fetch API, async/await |
| **`Promise.resolve` / `Promise.reject`** [DONE] | Create already-settled promises. | Language Core | Promise | then/catch, Promise.all |
| **Promise Chaining** [DONE] | Sequencing `.then()` calls; returning values/promises. | Language Core | Promise, then/catch | Callback Hell, async/await |
| **`try/catch` with `async/await`** [DONE] | Error handling for awaited promises. | Language Core | async/await, Error Handling | then/catch, Fetch API |
| **`for await...of` / Async Iterators** [DONE] | Iterating over asynchronously produced values. | Language Core | async/await, 🆕 Iterators & Iterables | Generator, for...of |
| **`AbortController`** [DONE] | Cancel in-flight fetches/async operations. | Browser API / DOM | Fetch API, Event object | Promise |
| **Web Workers** [DONE] | Run scripts on background threads. | Browser API / DOM | Asynchronous, Call Stack | Event Loop, window object |

### Level 7 — Objects & Prototypes

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Reference vs Value (copy semantics)** [DONE] | Primitives copy by value; objects/arrays by reference. | Language Core | Primitive Types, Object | Closure, Spread Syntax, Shallow/Deep Copy |
| **Shallow Copy vs Deep Copy** [DONE] | Copying top-level vs fully nested structures. | Language Core | Reference vs Value, Object | Spread Syntax, Object.assign, JSON, 🆕 structuredClone |
| **`JSON` / `JSON.stringify` / `JSON.parse`** [DONE] | Serialize/parse the JSON data-interchange format. | Language Core | Object, Array, String | Fetch API, Web Storage, Deep Copy |
| **`Object.assign`** [DONE] | Copy own enumerable props into a target object. | Language Core | Object, Reference vs Value | Spread Syntax, Shallow Copy |
| **`Object.freeze` / `Object.seal`** [DONE] | Make objects immutable / non-extensible. | Language Core | Object | 🆕 Immutability, const |
| **`Object.create`** [DONE] | Create an object with an explicit prototype. | Language Core | Object, Prototype | Prototypal Inheritance, new Keyword |
| **`hasOwnProperty` / `Object.getPrototypeOf`** [DONE] | Distinguish own vs inherited properties. | Language Core | Object, Prototype Chain | for...in, Prototypal Inheritance |
| **Getters & Setters** [DONE] | Accessor properties (`get`/`set`) that run on access. | Language Core | Object, Property, Method | Class, Computed Property Names |
| **Computed Property Names** [DONE] | Dynamic object keys via `{ [expr]: value }`. | Language Core | Object, Property Access | Symbol, Template Literals |
| **Shorthand Properties & Methods** [DONE] | `{ x }` and `{ method() {} }` object shorthands. | Language Core | Object, Property, Method | Destructuring |
| **`instanceof`** [DONE] | Test whether an object is built from a constructor. | Language Core | new Keyword, Prototype Chain | Class, typeof, constructor Function |
| **Static Methods & Properties** [DONE] | Class members on the class itself, not instances. | Language Core | Class | extends, new Keyword |
| **Private Class Fields (`#`)** [DONE] | Truly private members inside a class. | Language Core | Class, Closure | Getters & Setters |
| **`call` / `apply` / `bind`** [DONE] | Explicitly set a function's `this` and arguments. | Language Core | Function, Arguments | this Keyword, Reference vs Value |
| **Default `this` Binding Rules** [DONE] | Implicit/explicit/new/arrow rules for `this`. | Language Core | this Keyword | call/apply/bind, Arrow Function, new Keyword |

### Level 8 — Modern JavaScript (ES6+)

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Iterators & Iterables (protocol)** [DONE] | The `[Symbol.iterator]()` / `next()` contract. | Language Core | Object, Symbol | for...of, Generator, Spread Syntax, Array.from |
| **`WeakMap` / `WeakSet`** [DONE] | Collections with garbage-collectable keys. | Language Core | Map, Set, Garbage Collection | Reference vs Value |
| **Named vs Default Exports** [DONE] | Two module export styles and their import syntax. | Language Core | Modules | Dynamic import, CommonJS vs ESM |
| **Dynamic `import()`** [DONE] | Load modules on demand, returning a Promise. | Language Core | Modules, Promise | Bundler, Code Splitting |
| **Tagged Template Literals** [DONE] | Functions that process template literal parts. | Language Core | Template Literals, Function | String Methods |
| **Logical Assignment (`??=`, `||=`, `&&=`)** [DONE] | Combine logical ops with assignment. | Language Core | Nullish Coalescing, Logical Operators | Assignment Operators |
| **`globalThis`** [DONE] | Standard reference to the global object anywhere. | Language Core | Global Scope | window object, Node.js |

### Level 9 — Advanced Concepts & Patterns

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Error Handling (`try`/`catch`/`finally`)** [DONE] | Structured exception handling flow. | Language Core | Statement, Function | throw, Error object, async/await |
| **`throw` statement** [DONE] | Raise an exception to unwind the call stack. | Language Core | Error Handling | Error object, Call Stack |
| **`Error` object & Error Types** [DONE] | `Error`, `TypeError`, `RangeError`, custom errors. | Language Core | throw, Class (extends) | Error Handling |
| **Regular Expressions (`RegExp`)** [DONE] | Pattern matching for strings. | Language Core | String, String Methods | form validation |
| **Immutability** [DONE] | Never mutating data; producing new copies instead. | Language Core | Reference vs Value, Object.freeze | Pure Function, Spread Syntax |
| **Functional Programming & Composition** [DONE] | Composing pure functions; `compose`/`pipe`. | Language Core | Higher-Order Function, Pure Function | Currying, Partial Application |
| **Partial Application** [DONE] | Fixing some arguments of a function. | Language Core | Closure, call/apply/bind | Currying, Higher-Order Function |
| **Design Patterns (Module, Singleton, Observer, Factory)** [DONE] | Reusable solution templates in JS. | Language Core | Closure, IIFE, Object | Event Emitter |
| **`structuredClone`** [DONE] | Built-in deep-cloning API. | Language Core | Deep Copy | JSON, Reference vs Value |
| **`Reflect`** [DONE] | Methods mirroring Proxy trap operations. | Language Core | Proxy, Object | instanceof |

### Level 10 — Ecosystem & Tooling

| Proposed Term | One-line description | Category | Prerequisites | Related |
|---------------|----------------------|----------|---------------|---------|
| **Runtime vs Compile Time** [DONE] | When code is checked/transformed vs executed. | Ecosystem / Tooling | JavaScript Engine | Babel, TypeScript, Transpiler |
| **Transpiler vs Compiler** [DONE] | Source-to-source vs source-to-machine translation. | Ecosystem / Tooling | Babel | TypeScript, Polyfill |
| **CommonJS vs ES Modules (`require` vs `import`)** [DONE] | Node's legacy module system vs the ES standard. | Ecosystem / Tooling | Modules, Node.js | package.json, Bundler |
| **Specific Bundlers (Webpack / Vite / Rollup / esbuild)** [DONE] | Concrete bundling tools and their trade-offs. | Ecosystem / Tooling | Bundler, Modules | Tree Shaking, Dev Server |
| **Tree Shaking & Code Splitting** [DONE] | Removing dead code / lazy-loading bundles. | Ecosystem / Tooling | Bundler, Modules | Dynamic import, Minification |
| **Minification & Source Maps** [DONE] | Shrinking code; mapping bundles back to source. | Ecosystem / Tooling | Bundler | Babel |
| **Linter (ESLint) & Formatter (Prettier)** [DONE] | Static analysis and auto-formatting tools. | Ecosystem / Tooling | Ecosystem basics | Strict Mode, TypeScript |
| **Semantic Versioning & Lockfiles** [DONE] | `^`/`~` ranges and `package-lock.json`. | Ecosystem / Tooling | npm, package.json | CommonJS vs ESM |
| **Alternative Runtimes (Deno / Bun)** [DONE] | Modern JS/TS runtimes beyond Node.js. | Ecosystem / Tooling | Node.js | TypeScript, globalThis |
| **Browser DevTools & Debugging** [DONE] | Inspecting, breakpoints, `debugger`, profiling. | Ecosystem / Tooling | console.log, JavaScript Engine | Error object |
| **Unit Testing (Jest / Vitest)** [DONE] | Automated test runners and assertions. | Ecosystem / Tooling | Function, npm | Pure Function |
| **Framework vs Library (React / Vue / Angular)** [DONE] | Inversion-of-control distinction; where JSX fits. | Ecosystem / Tooling | SPA, JSX | Bundler, CommonJS vs ESM |
| **Web APIs vs the Language** [DONE] | Distinguishing engine (ECMAScript) from host APIs. | Ecosystem / Tooling | JavaScript Engine, ECMAScript | window object, DOM |

---

## 3. Relationship Map (dependency graph)

How the missing terms connect to each other and to existing terms. `A → B` means
"understanding A meaningfully requires B" (B is a prerequisite of A).

### 3.1 Foundational chains (unblock the most downstream terms)

```
Type Coercion (exists)
   → Strict vs Loose Equality (===/==)  🆕
        → Comparison Operators 🆕 → if/else, while, for (exist)
        → NaN 🆕 → Number Methods/parseInt 🆕
   → Dynamic & Weak Typing 🆕 → TypeScript (exists)

Primitive Types + Object (exist)
   → Reference vs Value 🆕   ← THE keystone gap
        → Shallow vs Deep Copy 🆕
             → Object.assign 🆕, Spread Syntax (exists), JSON 🆕, structuredClone 🆕
        → Immutability 🆕 → Object.freeze 🆕, Pure Function 🆕
        → Mutating vs Non-mutating array methods 🆕
        → call/apply/bind 🆕 (this rebinding), WeakMap/WeakSet 🆕
```

### 3.2 Error-handling cluster (currently absent, referenced ~43 files)

```
throw 🆕 → Error object & types 🆕 → Error Handling (try/catch/finally) 🆕
Error Handling 🆕 ⇄ async/await (exists), Fetch API (exists)   [try/catch with await 🆕]
Error Handling 🆕 → Promise.catch / then-catch (exists)         [same concept, two syntaxes]
```

### 3.3 Timers & async cluster

```
Callback Function (exists) + window 🆕
   → Timers: setTimeout/setInterval 🆕
        → Macrotask Queue (exists)   [setTimeout is THE canonical macrotask]
        → Debounce (exists), Throttle (exists)   [both built on setTimeout]
Promise (exists)
   → Promise chaining 🆕 → Promise.all/race/allSettled/any 🆕
   → async iterators / for await...of 🆕 ← Iterators & Iterables 🆕
```

### 3.4 DOM & browser cluster

```
JavaScript Engine + Global Scope (exist)
   → window / BOM 🆕 → document object 🆕
        → querySelectorAll 🆕, getElementById 🆕  (siblings of existing querySelector)
        → DOM Manipulation 🆕 → innerHTML/textContent 🆕, classList/setAttribute 🆕
        → Web Storage (localStorage) 🆕  ← needs JSON 🆕
        → Timers 🆕, Web Workers 🆕
Event (exists)
   → Event object 🆕 → event.target vs currentTarget 🆕
        → Event Delegation (exists), Event Bubbling (exists)  [both need Event object props]
```

### 3.5 Objects/OOP cluster

```
Prototype / Prototype Chain (exist)
   → Object.create 🆕, hasOwnProperty/getPrototypeOf 🆕, instanceof 🆕
Class (exists)
   → Static Methods 🆕, Private Fields (#) 🆕, Getters & Setters 🆕
   → Error types 🆕 (custom errors extend Error)
Object + Property (exist)
   → Property Access dot/bracket 🆕 → Computed Property Names 🆕
   → Shorthand Properties/Methods 🆕 (pairs with Destructuring, exists)
```

### 3.6 Functional cluster

```
Higher-Order Function (exists) + Pure Function 🆕
   → Functional Programming & Composition 🆕
        → Currying (exists), Partial Application 🆕
Closure (exists) → Lexical Scope 🆕 (should arguably PRECEDE closure)
   → call/apply/bind 🆕, Partial Application 🆕, Private Fields 🆕
Recursion 🆕 → Call Stack (exists)   [stack overflow demo], Tail Call Optimization
```

### 3.7 Tooling cluster

```
Babel (exists) → Runtime vs Compile Time 🆕 → Transpiler vs Compiler 🆕 → Polyfill (exists)
Modules (exists) → CommonJS vs ESM 🆕 → Named/Default Exports 🆕, Dynamic import 🆕
Bundler (exists) → Webpack/Vite/Rollup 🆕 → Tree Shaking 🆕, Minification/Source Maps 🆕
npm + package.json (exist) → Semantic Versioning & Lockfiles 🆕
SPA + JSX (exist) → Framework vs Library 🆕 → Unit Testing 🆕, DevTools 🆕
```

---

## 4. Suggested Generation Priority

Ordered so each batch unblocks the next (and repairs the most existing prose references).

| Tier | Rationale | Terms |
|------|-----------|-------|
| **P0 — Repairs pervasive references** | Used in existing docs but undefined | Strict vs Loose Equality; Error Handling (try/catch/finally); `throw`; Error object & types; Timers (setTimeout/setInterval); JSON; `window`/BOM; Comparison & Arithmetic Operators |
| **P1 — Keystone mental models** | Unblock many downstream terms | Reference vs Value; Shallow vs Deep Copy; Lexical Scope; Recursion; Ternary Operator; `document` object; Event object |
| **P2 — Core breadth (daily use)** | Round out everyday fluency | Array mutating/search/sort methods; String/Number/Math/Date methods; call/apply/bind; DOM Manipulation; querySelectorAll; Promise combinators; Web Storage; instanceof; Object.assign/freeze/create; Getters/Setters |
| **P3 — Modern & advanced** | Deepen ES6+ and patterns | Iterators & Iterables; WeakMap/WeakSet; Logical Assignment; Tagged Templates; Named/Default Exports + Dynamic import; RegExp; Immutability; Functional Composition; Partial Application; Design Patterns; Reflect; structuredClone; async iterators; AbortController; Web Workers; Static/Private class members |
| **P4 — Ecosystem literacy** | Professional context | CommonJS vs ESM; Runtime vs Compile Time; Transpiler vs Compiler; specific bundlers; Tree Shaking/Minification/Source Maps; ESLint/Prettier; SemVer/lockfiles; Deno/Bun; DevTools; Unit Testing; Framework vs Library; Web APIs vs language; globalThis |

---

## 5. Notes for the Generating AI

- **Follow the existing template.** Every new file must mirror the 8-section structure used in
  `terms/level_XX/*.md` (Prerequisites → Term Category → Environment Context → Explanation
  [Design Motivation / Reality Metaphor / Code Examples] → Common Mistakes → Practice Exercises
  → Related Terms → Key Takeaways) and obey `_meta/technology_context.md` (TC39 storytelling
  persona; `const`-first, `===`-only, semicolons, `try/catch` in async code).
- **Wire the cross-links.** Use the **Prerequisites** and **Related** columns in Section 2 to
  populate `## 1. Prerequisites` and `## 7. Related Terms` with correct relative paths
  (`../level_XX/<term>.md`). When a new term links to another new term, create both.
- **Renumber intentionally.** The zero-to-hero list ends at #117; either append new numbers or
  switch to level-relative numbering — decide once and stay consistent.
- **Update the trackers.** After generating, add each new term to
  `_meta/javascript_terms_zero_to_hero.md` and remove it from this gap list (or mark it done),
  mirroring how `_meta/missing_terms.md` records already-closed gaps.
- **Environment tags.** DOM/BOM/Web Storage/Timers/Workers = **Browser Only**; `require`/CommonJS
  and most tooling = **Node.js / Server Only**; language-core terms = **Universal**.
