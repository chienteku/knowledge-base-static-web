# Reactive State

> **Level 2 — Reactivity System**
> JavaScript data that Vue actively monitors. When this data changes, Vue automatically updates any part of the HTML template that depends on it.

---

## 1. Prerequisites
- [Declarative Rendering](../level_01/declarative_rendering.md) — The concept that relies entirely on reactive state.
---

## 2. Term Category
- **Vue Core Concept**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In normal JavaScript, variables are "dumb". If you have `let age = 30` and a paragraph `<p id="age">30</p>`, changing `age = 31` does absolutely nothing to the paragraph. The paragraph has no idea the variable changed. You have to manually write `document.getElementById('age').innerText = age`.
Vue replaces these "dumb" variables with **Reactive State**. Vue creates special data objects that act like they have alarm bells attached to them. When the value changes, the alarm rings, and Vue instantly rushes to the DOM to update the text.

### (2) How it works (The Dependency Graph)
Vue's reactivity system works like a sophisticated spreadsheet (like Excel). 
1. **Tracking:** When Vue first renders your template (e.g., `<h1>{{ name }}</h1>`), it notes down: *"Ah, this `<h1>` tag relies on the `name` variable."*
2. **Triggering:** If you later change the `name` variable, Vue doesn't blindly re-render the whole page. It looks at its notes, sees exactly which `<h1>` tag depends on `name`, and surgically updates just that one word in the DOM.

### (3) The Difference from React
This is a fundamental architectural difference from React!
In React, when state changes, React re-renders the *entire component* from top to bottom, generates a massive Virtual DOM tree, and compares it to find changes.
In Vue, the state *knows who relies on it*. Vue only re-evaluates the exact piece of the DOM that actually needs to change. This makes Vue incredibly efficient out-of-the-box.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting standard variables to be reactive

**The mistake:** A developer writes:
```javascript
<script setup>
let count = 0; // Standard JS variable
function add() { count++; }
</script>
<template><button @click="add">{{ count }}</button></template>
```

**Why it's wrong:** Vue has no way to track standard JavaScript `let` or `const` variables. When the button is clicked, `count` will increment to 1 in memory, but the UI will permanently stay at "0" because no alarm bells rang.
**Golden Rule:** If you want data to update the UI, you MUST wrap it in Vue's specific reactivity functions ([`ref`](../level_02/ref.md) or [`reactive`](../level_02/reactive.md)).

---

### Mistake 2: Mutating State Asynchronously Without Vue Tracking Context

**The mistake:** Modifying external plain variables and expecting templates to update.

**Why it's wrong:** Vue can track mutations ONLY on reactive proxies created via `ref()` or `reactive()`. Plain JavaScript variables do not trigger Virtual DOM re-renders.

*Incorrect:*
```javascript
let count = 0; // Plain variable
function add() { count++; } // ❌ UI does not re-render!
```

*Fix:*
```javascript
const count = ref(0); // Reactive proxy
function add() { count.value++; } // Triggers template re-render
```

---

### Mistake 3: Accessing Reactive State Before Component Initialization

**The mistake:** Reading reactive state outside setup scope in global module contexts.

**Why it's wrong:** Reactive state initialized outside component setups lacks lifecycle management and causes shared state leaks across server-side rendering (SSR) requests.

*Incorrect:*
```javascript
// Global scope in module file
export const globalState = reactive({ user: null }); // ❌ Shared state leak across SSR requests!
```

*Fix:*
```javascript
// Wrap state in Pinia stores or composables initialized per request
```


---

## 6. Practice Exercises

### Exercise 1: Reactivity vs Re-rendering

**Problem:** You have a massive Vue component with 50 paragraphs. The very last paragraph uses a reactive variable `counter`. If you change `counter`, does Vue re-render the first 49 paragraphs?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> Vue tracks dependencies at an extremely granular level. It knows that the first 49 paragraphs do not depend on `counter`. It will only touch the 50th paragraph.
> ```
> - Vue is surgical. It isn't React.

---

### Exercise 2: Deep Reactivity Tracking

**Problem:** Does mutating a deeply nested property (`state.a.b.c = 10`) inside `reactive()` trigger UI re-renders?

**Expected output:**
> [!check]- Answer
> ```text
> Yes. Vue 3 reactive() creates deep Proxy wrappers that track mutations at all nesting levels.
> ```
> - Vue 3 reactive proxies are deeply reactive by default.
> 
> ```javascript
> const state = reactive({ nested: { count: 0 } });
> state.nested.count++; // Triggers template re-render!
> ```

---

### Exercise 3: State Immutability Best Practice

**Problem:** Why is component-level state mutation preferred inside explicit action/setter functions rather than inline template handlers?

**Expected output:**
> [!check]- Answer
> ```text
> Explicit action functions centralize state mutation logic, improving debuggability and code traceability.
> ```
> - Centralized methods make state changes traceable.
> 
> ```javascript
> function increment() { count.value++; }
> ```


---

## 7. Related Terms
- [`ref`](ref.md) — The function used to create reactive state for primitives.
- [`reactive`](reactive.md) — The function used to create reactive state for objects.
- [Declarative Rendering](../level_01/declarative_rendering.md) — Related concept: Declarative Rendering.
- [Options API](../level_01/options_api.md) — Related concept: Options API.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — Related concept: `v-if` / `v-show`.
- [Composition API](../level_01/composition_api.md) — Related concept: Composition API.
---

## 8. Key Takeaways
- **Reactive State** is data that Vue actively monitors for changes.
- When reactive state changes, Vue automatically and surgically updates the DOM.
- Normal JavaScript variables (`let`, `const`) do NOT trigger UI updates.
- Vue tracks dependencies automatically, meaning it knows exactly which HTML elements rely on which variables, resulting in excellent performance without manual optimization.
