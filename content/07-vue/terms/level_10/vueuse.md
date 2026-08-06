# VueUse

> **Level 10 — Ecosystem & Tooling**
> An open-source library containing a vast collection of essential, battle-tested Vue Composition API composable utility functions that wrap browser APIs, state utilities, and network connections reactively.

---

## 1. Prerequisites
- [Composables](../level_05/composables.md) — The reuse pattern for stateful logic.
- [`ref`](../level_02/ref.md) — The basic reactive state wrapper.
- [`watchEffect`](../level_02/watch_effect.md) — Reactive dependency tracking.

---

## 2. Term Category
- **Ecosystem Tool**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
With Vue 3, the Composition API introduced a powerful pattern: Composables. Suddenly, developers could package complex browser behaviors (like listening to window resizing or checking if an element is in the viewport) into reusable functions.

However, developers soon found themselves writing the same utility composables over and over:
- Syncing a variable to `localStorage` (`useLocalStorage`).
- Tracking coordinates of the user's cursor (`useMouse`).
- Debouncing input keystrokes to limit API requests (`useDebounceFn`).
- Detecting if a DOM element is visible on the screen (`useIntersectionObserver`).

Writing these from scratch is time-consuming and error-prone, especially when managing browser event listeners and cleanup to prevent memory leaks. 

**VueUse** was created to act as the unofficial "standard library" for the Composition API. It provides a massive collection of hundreds of high-quality, pre-optimized, and well-maintained reactive composables, allowing developers to focus on building features rather than low-level browser integrations.

### (2) How it works under the hood
VueUse composables wrap native browser APIs in Vue's reactivity system. 

For example, `useStorage` returns a ref that stays in sync with `localStorage` or `sessionStorage`:
```javascript
const bannerDismissed = useStorage('dismiss-banner', false)
```
When you read `bannerDismissed.value`, VueUse retrieves the item from storage. When you change `.value`, VueUse intercepts the setter and writes the new value back to storage.

Additionally, VueUse utilities are **lifecycle-aware**. If a composable sets up an event listener (like a `resize` listener in `useWindowSize`), it listens to the parent component's state. When the component that loaded the composable is unmounted, VueUse automatically calls `onUnmounted` internally to detach the event listener, preventing memory leaks automatically.

### (3) Code Examples

#### Short Snippet
Synchronizing state to local storage and tracking cursor coordinates:
```vue
<script setup>
import { useMouse, useStorage } from '@vueuse/core'

// 1. Mouse coordinates ref
const { x, y } = useMouse()

// 2. State synced with localStorage key 'theme-color'
const selectedTheme = useStorage('theme-color', 'dark')
</script>

<template>
  <div>
    <p>Cursor: {{ x }}, {{ y }}</p>
    <select v-model="selectedTheme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>
</template>
```

#### Fuller Example
Below, we use `useIntersectionObserver` to trigger a lazy data fetch when a card scrolls into view, and `refDebounced` to limit text input updates during search typing.

```vue
<script setup>
import { ref } from 'vue'
import { useIntersectionObserver, refDebounced } from '@vueuse/core'

// 1. Debouncing search inputs
const searchInput = ref('')
const debouncedSearch = refDebounced(searchInput, 500) // Wait 500ms after typing

// 2. Lazy loading elements when they enter the viewport
const triggerElement = ref(null)
const isLoaded = ref(false)

const { stop } = useIntersectionObserver(
  triggerElement,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      console.log('Element scrolled into view! Fetching data...')
      isLoaded.value = true
      stop() // Stop observing once loaded
    }
  }
)
</script>

<template>
  <div class="container">
    <input v-model="searchInput" placeholder="Search items..." />
    <p>Searching for: {{ debouncedSearch || '...' }}</p>
    
    <div style="height: 1000px;">Scroll down to load card...</div>
    
    <div ref="triggerElement" class="lazy-card">
      <p v-if="isLoaded">Data loaded dynamically!</p>
      <p v-else>Loading widget...</p>
    </div>
  </div>
</template>

<style scoped>
.lazy-card {
  height: 200px;
  background: #f0f0f0;
  display: grid;
  place-items: center;
}
</style>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring object values incorrectly, destroying reactivity

**The mistake:** Destructuring properties returned from a VueUse utility when the utility returns a single reactive state object rather than an object of refs.

**Why it's wrong:** Some VueUse utilities return a standard `reactive` object. If you destructure it, you copy the values and destroy their reactivity.

*Incorrect:*
```javascript
import { useWindowSize } from '@vueuse/core'

// WRONG: useWindowSize returns refs, but if a utility returns a reactive object,
// destructuring it directly like this will break tracking!
const { width } = useWindowSize() 
```
*Note: In VueUse, `useWindowSize` specifically returns an object of refs so destructuring works, but other hooks (like state objects) return reactive proxy interfaces. Always check the API signature.*

*Fix:* Keep the object container, or pass it through `toRefs` if destructuring is required.
```javascript
import { useWindowSize } from '@vueuse/core'
const size = useWindowSize()
console.log(size.width.value) // Correct: Access properties off returned object
```

**Golden Rule:** Verify if a VueUse composable returns an object of individual `ref` objects (safe to destructure) or a single `reactive` object (use directly, or use `toRefs`).

---

### Mistake 2: Re-Inventing Common Browser APIs Manually Instead of Using Tested VueUse Composables

**The mistake:** Writing 50 lines of custom `window.addEventListener('resize')` logic manually.

**Why it's wrong:** VueUse provides 200+ battle-tested, tree-shakable utility composables (`useWindowSize`, `useLocalStorage`, `useDark`, `useClipboard`) that handle edge cases and cleanup automatically.

*Incorrect:*
```vue
/* Writing manual event listeners for window size tracking */
```

*Fix:*
```javascript
import { useWindowSize } from '@vueuse/core';
const { width, height } = useWindowSize(); // Clean reactive window size tracking
```

---

### Mistake 3: Passing Non-Ref Primitive Values to VueUse Composables That Expect Refs

**The mistake:** Passing raw string `'light'` to a VueUse composable expecting a reactive `ref` source.

**Why it's wrong:** Many VueUse composables accept `MaybeRef<T>` parameters to reactively track changes. Passing raw non-reactive primitives prevents composables from updating when state changes.

*Incorrect:*
```javascript
useTitle('Static Title'); // ❌ Document title will not update when state changes!
```

*Fix:*
```javascript
const pageTitle = ref('Dynamic Title');
useTitle(pageTitle); // Document title updates dynamically when pageTitle ref changes!
```


---

## 6. Practice Exercises

### Exercise 1: Dark Mode Toggle

**Problem:** You are building a theme manager. Create a button that switches the application's dark mode theme. Fill in the code using VueUse's `useDark` and `useToggle`.

```vue
<script setup>
import { useDark, useToggle } from '@vueuse/core'

// 1. Detect and set theme class on <html> tag (e.g. class="dark")
const isDark = useDark()

// 2. Create the toggle handler
const toggleDark = useToggle(isDark)
</script>

<template>
  <button @click="toggleDark">
    Theme: {{ isDark ? 'Dark' : 'Light' }}
  </button>
</template>
```

**Expected output:**
> [!check]- Answer
> ```text
> Clicking the button toggles the theme. VueUse automatically handles injecting/removing the class="dark" attribute on the root HTML tag.
> ```
> - `useDark()` automatically reads system preferences and manages DOM attributes.
> - `useToggle` accepts a boolean ref and returns a toggling function.
> 
---

### Exercise 2: useLocalStorage Composable Pattern

**Problem:** Write VueUse `useLocalStorage()` snippet creating reactive ref `username` synchronized with `localStorage` key `'user-key'` and default `'Guest'`. 

**Expected output:**
> [!check]- Answer
> ```javascript
> import { useLocalStorage } from '@vueuse/core'; const username = useLocalStorage('user-key', 'Guest');
> ```
> - `useLocalStorage()` creates reactive refs bound to localStorage.
> 
> ```javascript
> import { useLocalStorage } from '@vueuse/core';
> const username = useLocalStorage('user-key', 'Guest');
> // Mutating username.value automatically updates localStorage!
> ```
> 
---

### Exercise 3: useDark & useToggle Pattern

**Problem:** Write VueUse snippet using `useDark()` and `useToggle()` to manage dark mode theme toggling.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { useDark, useToggle } from '@vueuse/core'; const isDark = useDark(); const toggleDark = useToggle(isDark);
> ```
> - `useDark()` toggles dark mode CSS classes; `useToggle()` toggles boolean refs.
> 
> ```javascript
> import { useDark, useToggle } from '@vueuse/core';
> 
> const isDark = useDark();
> const toggleDark = useToggle(isDark);
> ```
> 
> 
---

## 7. Related Terms
- [Composables](../level_05/composables.md) — The state encapsulation pattern.
- [`ref`](../level_02/ref.md) — The reactivity wrapper.
- [`watchEffect`](../level_02/watch_effect.md) — Automatic side-effect tracking.

---

## 8. Key Takeaways
- **VueUse** is a large utility library of hundreds of standard Vue Composition API composables.
- It translates browser APIs (resize, storage, geo, intersection observers) into reactive, easily consumable refs.
- All event bindings are lifecycle-aware, automatically cleaning up on component unmount to prevent leaks.
- Speeds up development by providing standard, high-quality, pre-tested utility implementations.
