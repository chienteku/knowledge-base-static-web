# Vitest (Unit Testing)

> **Level 10 — Ecosystem & Tooling**
> A modern, Vite-native testing runner that shares Vite's build pipeline, plugins, and module resolution, providing extremely fast unit and component test execution with full Jest-compatible APIs.

---

## 1. Prerequisites
- [Vue Test Utils](vue_test_utils.md) — The library for mounting and interacting with Vue components.
- [Vite](vite.md) — The development server and bundler.
- [Build Step (Compilation)](build_step.md) — How code compilation pipelines operate.

---

## 2. Term Category
- **Ecosystem Tool**

---

## 3. Environment Context
- **Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For years, Jest was the undisputed leader in JavaScript unit testing. However, as Vite emerged as the standard frontend compiler, a frustrating developer experience (DX) gap appeared:
- Vite ran development servers using ultra-fast native ES modules.
- Jest ran tests by compiling files separately using Babel or custom TypeScript preprocessors.

This meant teams had to maintain **two separate compilation setups**: one in `vite.config.js` for running the app, and one in `jest.config.js` for compiling files for tests. If you registered a path alias (like `@/` pointing to `src/`) or a Vue plugin in Vite, you had to duplicate that exact configuration in Jest. If you forgot, your tests would fail.

**Vitest** was designed to solve this configuration drift. It is built directly on top of Vite. It uses the exact same dev server pipeline to transform and resolve your files during tests. If a file works in your browser under Vite, it will work in your tests under Vitest, with zero double-configurations.

### (2) How it works under the hood
When you execute `vitest` in your terminal:
1. It boots up Vite's internal transformer pipeline.
2. It crawls your test files (e.g. `*.test.js` or `*.spec.ts`).
3. As the test runner imports components or utility files, Vite compiles them on-the-fly, resolving path aliases, TypeScript files, and `.vue` templates using the exact plugins configured in `vite.config.js`.
4. It executes the tests inside worker threads using a simulated DOM environment (like `jsdom` or `happy-dom`) if needed.
5. It watches for changes. Because it leverages Vite's Hot Module Replacement (HMR) graphs, it knows exactly which tests are affected by a file modification and only re-runs those, making watch mode near-instant.

Vitest uses the exact same syntax as Jest (providing `describe`, `test`, `it`, `expect`, and `vi` mocking utilities), making it a drop-in replacement.

### (3) Code Examples

#### Short Snippet
Testing a simple helper function in isolation:
```javascript
// math.test.js
import { describe, test, expect } from 'vitest'
import { sum } from './math.js'

describe('Math Utilities', () => {
  test('adds two numbers correctly', () => {
    expect(sum(2, 3)).toBe(5)
  })
})
```

#### Fuller Example
Testing a Vue Counter component using Vitest and Vue Test Utils. Notice how we declare the virtual browser DOM environment at the top of the file.

```vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <div>
    <p>Clicks: {{ count }}</p>
    <button @click="count++">Increment</button>
  </div>
</template>
```

```javascript
// Counter.spec.js
// @vitest-environment jsdom

import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter Component', () => {
  test('increments score when button is clicked', async () => {
    // 1. Mount the SFC component
    const wrapper = mount(Counter)
    
    // 2. Verify initial UI state
    expect(wrapper.text()).toContain('Clicks: 0')
    
    // 3. Trigger button click event
    const button = wrapper.find('button')
    await button.trigger('click')
    
    // 4. Assert updated UI state
    expect(wrapper.text()).toContain('Clicks: 1')
  })
})
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to test Vue components without a DOM environment

**The mistake:** Running tests for Vue components that rely on DOM elements without configuring Vitest's environment.

**Why it's wrong:** By default, Vitest runs in Node.js, which has no DOM (no `document`, `window`, or `HTMLElement` representations). Running `mount()` in Node will throw a fatal error: `document is not defined`.

*Incorrect:*
```javascript
// my-component.spec.js
import { mount } from '@vue/test-utils'
import MyComp from './MyComp.vue'

// Runs in Node by default - fails!
const wrapper = mount(MyComp) 
```

*Fix:* Declare a JSDOM header comment at the top of the test file, or configure it globally in `vite.config.ts`.
```javascript
// my-component.spec.js
// @vitest-environment jsdom  <-- Correct! Registers simulated browser DOM.

import { mount } from '@vue/test-utils'
import MyComp from './MyComp.vue'

const wrapper = mount(MyComp) // Works perfectly!
```

**Golden Rule:** Always set the environment to `jsdom` or `happy-dom` when writing component tests that access HTML nodes or trigger events.

---

### Mistake 2: Confusing Jest with Vitest Configuration Files (`jest.config.js` vs `vite.config.js`)

**The mistake:** Adding separate `jest.config.js` files to a Vite project.

**Why it's wrong:** Vitest integrates directly into `vite.config.js` sharing the exact same transformation pipeline and aliases. Adding Jest introduces duplicate configuration maintenance.

*Incorrect:*
```vue
/* Creating separate jest.config.js in Vite project */
```

*Fix:*
```vue
// Configure Vitest directly inside vite.config.js:
export default defineConfig({
  test: { environment: 'jsdom' }
});
```

---

### Mistake 3: Forgetting to Specify `environment: 'jsdom'` or `'happy-dom'` for Vue Component Tests

**The mistake:** Running Vitest component unit tests in default Node.js environment without DOM APIs.

**Why it's wrong:** Testing Vue components requires DOM APIs (`document`, `window`). Running component tests in raw Node.js environment throws errors when mounting components.

*Incorrect:*
```vue
/* Vitest running component test in raw Node environment -> document is undefined error! */
```

*Fix:*
```javascript
// Configure test environment in vite.config.js:
test: {
  environment: 'jsdom' // Or 'happy-dom'
}
```


---

## 6. Practice Exercises

### Exercise 1: Asserting Prop Rendering

**Problem:** Complete the Vitest spec below to assert that the component renders a title passed down as a prop.

```vue
<!-- TitleCard.vue -->
<script setup>
defineProps({ title: String })
</script>
<template>
  <h1>{{ title }}</h1>
</template>
```

```javascript
// TitleCard.spec.js
// @vitest-environment jsdom

import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TitleCard from './TitleCard.vue'

describe('TitleCard', () => {
  test('renders title prop correctly', () => {
    // 1. Mount with props
    const wrapper = mount(TitleCard, {
      props: { title: 'Welcome Developer' }
    })
    
    // 2. Complete the assertion to verify h1 text
    expect(wrapper.find('h1').text()).toBe('Welcome Developer')
  })
})
```

**Expected output:**
> [!check]- Answer
> ```text
> The test mounts the component with the target prop value and asserts the inner HTML of the h1 element matches it.
> ```
> - The component mount options object accepts a `props` object: `{ props: { key: value } }`.
> - Use `.find('h1')` to query the heading tag, and `.text()` to read its content.

---

### Exercise 2: Vitest Basic Component Test Pattern

**Problem:** Write Vitest test block using `@vue/test-utils` `mount()` verifying component renders text `'Welcome'`. 

**Expected output:**
> [!check]- Answer
> ```javascript
> import { test, expect } from 'vitest'; import { mount } from '@vue/test-utils'; import Welcome from './Welcome.vue'; test('renders welcome text', () => { const wrapper = mount(Welcome); expect(wrapper.text()).toContain('Welcome'); });
> ```
> - Vitest provides Jest-compatible `test` and `expect` APIs.
> 
> ```javascript
> import { test, expect } from 'vitest';
> import { mount } from '@vue/test-utils';
> import Welcome from './Welcome.vue';
> 
> test('renders welcome text', () => {
>   const wrapper = mount(Welcome);
>   expect(wrapper.text()).toContain('Welcome');
> });
> ```

---

### Exercise 3: Vitest Watch Mode Efficiency

**Problem:** Why is Vitest significantly faster than Jest when running tests in Watch mode on Vite projects?

**Expected output:**
> [!check]- Answer
> ```text
> Vitest re-uses Vite's fast module graph dependency cache to re-execute ONLY tests affected by modified files.
> ```
> - Leverages Vite module graph for smart test re-execution.
> 
> ```text
> Re-executes only tests affected by changed files.
> ```


---

## 7. Related Terms
- [Vue Test Utils](vue_test_utils.md) — The utility suite for mounting and checking Vue components.
- [Vite](vite.md) — The underlying transformer engine and bundler.
- [Build Step (Compilation)](build_step.md) — The compilation pipeline.

---

## 8. Key Takeaways
- **Vitest** is a modern unit testing runner built on top of the Vite compilation server.
- Shares the exact same config files, plugins, and module resolution rules as Vite.
- Implements full api compatibility with Jest's assertion frameworks (`describe`, `expect`, `vi`).
- Leverages Vite's hot module graph HMR to run tests near-instantly when files change in watch mode.
- Set the environment hook to `jsdom` or `happy-dom` when testing component layout or interaction logic.
