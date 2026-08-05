# Provide / Inject

> **Level 5 — Advanced Component Architecture**
> A mechanism to pass data from an ancestor component directly down to a deeply nested descendant component, completely bypassing the intermediate components in between.

---

## 1. Prerequisites
- [Props](../level_04/props.md) — The standard way of passing data, which suffers from "Prop Drilling".
- [Components](../level_04/components.md) — Understanding the hierarchy of Vue apps.

---

## 2. Term Category
- **Vue Core Concept / Data Flow**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you have a theme setting (`isDarkMode`) in your root `<App>` component. You need to pass this setting down to a `<Button>` component that is nested 10 levels deep.
If you use standard [Props](../level_04/props.md), you have to pass the prop from App -> Layout -> Header -> Navigation -> Dropdown -> ... -> Button. 
This is called **Prop Drilling**. The 8 components in the middle don't care about `isDarkMode`, but they are forced to declare and pass it along anyway. It clutters the codebase.
**Provide / Inject** solves this. It acts like a wormhole. The Root `<App>` *Provides* the data into the ether. The deeply nested `<Button>` *Injects* the data directly out of the ether.

### (2) Providing Data (The Ancestor)
```vue
<!-- App.vue (Ancestor) -->
<script setup>
import { provide, ref } from 'vue'

const isDarkMode = ref(true)

// 1. Provide the data with a unique "key" ('theme')
provide('theme', isDarkMode)
</script>
```

### (3) Injecting Data (The Descendant)
```vue
<!-- Button.vue (Descendant - 10 levels deep!) -->
<script setup>
import { inject } from 'vue'

// 2. Inject the data using the exact same "key"
// You can also provide a default value (false) in case the provider is missing
const isDarkMode = inject('theme', false)
</script>

<template>
  <button :class="{ 'dark': isDarkMode }">Click Me</button>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating injected data directly

**The mistake:** A deeply nested child component injects `isDarkMode` and writes a function to toggle it: `isDarkMode.value = false`.

**Why it's wrong:** It breaks the "One-Way Data Flow" principle! If 5 different deeply nested components are mutating the provided data randomly, you will have no idea where state changes are originating from, making debugging impossible.
**Golden Rule:** Injected data should be treated as Read-Only. If a child needs to change the provided data, the Provider should *also* provide a function to mutate it!
`provide('themeTools', { isDarkMode, toggleTheme })`

---

### Mistake 2: Mutating Provided Reactive State Inside Injecting Child Components

**The mistake:** Writing `injectedTheme.value = 'dark'` directly inside a deep descendant child component.

**Why it's wrong:** Mutating provided state inside descendant components breaks One-Way Data Flow and makes state changes hard to trace. Provide mutation functions alongside provided state.

*Incorrect:*
```javascript
// Child component mutating injected state directly
const theme = inject('theme');
function toggle() { theme.value = 'dark'; } // ❌ Direct mutation anti-pattern!
```

*Fix:*
```javascript
// Parent provides state AND update function:
provide('theme', { theme, toggleTheme });

// Child calls update function:
const { theme, toggleTheme } = inject('theme');
toggleTheme(); // State mutation handled at source
```

---

### Mistake 3: Using Plain Un-Keyed Strings for Injection Keys (Namespace Collision)

**The mistake:** Using generic strings like `provide('user', userData)` in large enterprise codebases.

**Why it's wrong:** Generic string keys risk collision across third-party plugins or deeply nested component trees. Use Symbol injection keys (`const themeKey = Symbol('theme')`).

*Incorrect:*
```javascript
provide('data', state); // ❌ Collision risk with other packages using key 'data'!
```

*Fix:*
```javascript
// Use Symbol keys for guaranteed injection key uniqueness:
export const themeKey = Symbol('theme');
provide(themeKey, state);
```


---

## 6. Practice Exercises

### Exercise 1: Provide/Inject vs State Management

**Problem:** You are building a massive application. You need to share the `currentUser` object across 50 different components. Should you use Provide/Inject in the `App.vue`?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> While Provide/Inject works for simple things like a UI theme or a localization language, complex global state (like user auth, shopping carts, etc.) should be managed by a dedicated State Management tool like Pinia or Vuex.
> Provide/Inject is hard to debug at scale because there are no DevTools to track exactly who is providing and injecting what.
> ```
> - Is Provide/Inject meant to replace Redux/Pinia?

---

### Exercise 2: Provide Inject Default Fallback Value

**Problem:** Write `inject()` statement specifying default fallback value `'light'` if key `'theme'` is not provided by ancestors.

**Expected output:**
> [!check]- Answer
> ```javascript
> const theme = inject('theme', 'light');
> ```
> - The 2nd argument of `inject()` specifies default fallback values.
> 
> ```javascript
> const theme = inject('theme', 'light');
> ```

---

### Exercise 3: Symbol Injection Keys with TypeScript

**Problem:** Write TypeScript `InjectionKey<User>` declaration for a strongly-typed `userKey`.

**Expected output:**
> [!check]- Answer
> ```typescript
> import type { InjectionKey } from 'vue'; export const userKey = Symbol() as InjectionKey<User>;
> ```
> - `InjectionKey<T>` binds type definitions to Symbol keys.
> 
> ```typescript
> import type { InjectionKey } from 'vue';
> interface User { name: string; }
> export const userKey = Symbol() as InjectionKey<User>;
> ```


---

## 7. Related Terms
- [Props](../level_04/props.md) — The alternative that causes Prop Drilling.
- [Pinia](../level_07/pinia.md) — The ultimate solution for Global State.
- [Components](../level_04/components.md) — Component tree.

---

## 8. Key Takeaways
- **Provide / Inject** solves the "Prop Drilling" problem.
- An ancestor component **Provides** data with a specific key.
- Any deeply nested descendant component can **Inject** that data using the key.
- Components should NOT mutate injected data directly. Provide a mutation function alongside the data.
- Do not use Provide/Inject as a replacement for full-scale Global State Management (like Pinia).
