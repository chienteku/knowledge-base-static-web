# Vitest (Unit Testing)

> **Level 10 — Tooling & Ecosystem**
> A modern, Vite-native unit testing runner that shares Vite's build pipeline, plugins, and module resolution, delivering fast test execution and full Jest API compatibility out of the box.

---

## 1. Prerequisites

- [Vue Test Utils](vue_test_utils.md) — The official utility library for mounting Vue components inside Vitest specs.
- [Vite](vite.md) — The underlying build engine powering Vitest's module transformation pipeline.
- [Build Step (Compilation)](build_step.md) — Asset compilation pipelines shared between dev servers and test runners.

---

## 2. Term Category

**Testing Framework (Vite-Native Test Runner)**: Vitest is a modern unit and component testing framework built natively on top of Vite. It provides Jest-compatible assertion APIs (`describe`, `test`, `expect`, `vi`), fast worker thread isolation, native TypeScript and JSX execution, and instant watch mode re-runs leveraging Vite's Hot Module Replacement (HMR) module graph cache.

Compared to Jest (which requires maintaining separate Babel/TypeScript preprocessors and duplicate `jest.config.js` path alias rules), Vitest uses your application's existing `vite.config.js` file directly. If a file compiles in your Vite browser dev server, it runs in Vitest without configuration drift.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, frontend teams using Jest with modern build tools encountered frustrating "configuration drift." Developers had to maintain two completely separate compilation pipelines:
1. `vite.config.js` for running the application in dev servers and building for production.
2. `jest.config.js` for compiling TypeScript, path aliases (`@/`), and `.vue` SFC templates inside Jest's Babel runner.

When developers added new path aliases or Vite plugins, tests broke in Jest because the configurations diverged. Furthermore, Jest's cold startup and file transformation overhead made watch modes sluggish. **Vitest** was created to unify tooling: it hooks directly into Vite's dev server engine, eliminating duplicate configs and executing tests at native ESM speed.

### (2) Reality Metaphor
Imagine a motor sports pit crew maintaining two identical race cars. 

Under the old Jest setup, the team maintained Car A with a V8 gasoline engine (Vite) for Sunday races, and Car B with a completely separate diesel engine (Jest) for qualifying tests. Every time engineers upgraded a part on Car A, they had to design a custom adapter to fit Car B. If they forgot, Car B broke during qualification.

Vitest acts as a single, unified modular chassis. The pit crew runs the exact same engine and parts for both Sunday races (production build) and qualifying tests (Vitest). Upgrading a part once applies to both automatically.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// math.test.js (Basic Vitest Unit Test)
import { describe, test, expect } from 'vitest'
import { calculateTax } from './tax.js'

describe('Tax Calculator', () => {
  test('calculates 10% tax rate correctly', () => {
    const result = calculateTax(100, 0.10)
    expect(result).toBe(110)
  })
})
```

#### Fuller Example
```javascript
// Counter.spec.js (Vitest Component Test with Vue Test Utils)
// @vitest-environment jsdom

import { describe, test, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CounterComponent from './CounterComponent.vue'

describe('CounterComponent.vue', () => {
  test('increments counter display upon button click', async () => {
    // 1. Mount component in simulated JSDOM environment
    const wrapper = mount(CounterComponent, {
      props: { initialCount: 5 }
    })

    // 2. Assert initial rendered text
    expect(wrapper.text()).toContain('Current Count: 5')

    // 3. Trigger button click event
    const button = wrapper.find('button.inc-btn')
    await button.trigger('click')

    // 4. Assert reactive DOM patch
    expect(wrapper.text()).toContain('Current Count: 6')
  })

  test('emits limitReached event when count reaches 10', async () => {
    const wrapper = mount(CounterComponent, {
      props: { initialCount: 9 }
    })

    await wrapper.find('button.inc-btn').trigger('click')

    // 5. Assert emitted custom component events
    expect(wrapper.emitted()).toHaveProperty('limitReached')
    expect(wrapper.emitted('limitReached')[0]).toEqual([10])
  })
})
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Testing Vue Components Without Configuring a DOM Environment

**The mistake:** Running component tests that access HTML nodes (`wrapper.find('button')`) without specifying a simulated DOM environment (`jsdom` or `happy-dom`).

**Why it's wrong:** By default, Vitest executes inside Node.js, which has no `window` or `document` DOM representation. Mounting components without a DOM environment throws runtime crashes (`ReferenceError: document is not defined`).

*Incorrect:*
```javascript
// my-comp.spec.js
// ❌ Runs in raw Node.js without DOM environment -> Fails on mount()!
import { mount } from '@vue/test-utils'
import MyComp from './MyComp.vue'

test('renders component', () => {
  const wrapper = mount(MyComp)
})
```

*Fix:*
```javascript
// my-comp.spec.js
// @vitest-environment jsdom
// ✅ Registers JSDOM environment for this test file

import { mount } from '@vue/test-utils'
import MyComp from './MyComp.vue'

test('renders component', () => {
  const wrapper = mount(MyComp)
})
```

---

### Mistake 2: Maintaining Duplicate `jest.config.js` Files in Vite Projects

**The mistake:** Adding separate `jest.config.js` configuration files to Vite applications.

**Why it's wrong:** Vitest integrates directly into your existing `vite.config.js` file, sharing aliases, plugins, and transformation rules automatically. Adding Jest re-introduces duplicate configuration maintenance.

*Incorrect:*
```javascript
// Creating separate jest.config.js in a Vite project
```

*Fix:*
```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

---

### Mistake 3: Forgetting to `await` Event Triggers in Component Assertions

**The mistake:** Triggering events (`wrapper.find('button').trigger('click')`) synchronously and asserting DOM text on the very next line without `await`.

**Why it's wrong:** Vue flushes DOM updates asynchronously on `nextTick()`. `trigger()` returns a Promise. Omitting `await` causes assertions to execute before Vue finishes patching the DOM, resulting in flaky test failures.

*Incorrect:*
```javascript
// ❌ Assertion fails because DOM hasn't patched yet!
wrapper.find('button').trigger('click')
expect(wrapper.text()).toContain('Updated')
```

*Fix:*
```javascript
// ✅ Await trigger Promise to allow DOM flush
await wrapper.find('button').trigger('click')
expect(wrapper.text()).toContain('Updated')
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Alert Composable Vitest Spec

**Scenario:** An industrial IoT engineering team tests a `useTemperatureAlert(threshold)` composable using Vitest. The test verifies alert state triggering when sensor readings exceed threshold values.

**Requirements:**
1. Test initial `isAlert` boolean state ($false$).
2. Mutate temperature ref above threshold ($> 50\,^\circ\text{C}$).
3. Assert that `isAlert` updates reactively to $true$.
4. Use Vitest `describe`, `test`, `expect` functions.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // sensorAlert.spec.js
> import { describe, test, expect } from 'vitest'
> import { ref, computed } from 'vue'
> 
> function useTemperatureAlert(threshold = 50) {
>   const temp = ref(22)
>   const isAlert = computed(() => temp.value > threshold)
>   return { temp, isAlert }
> }
> 
> describe('useTemperatureAlert Composable', () => {
>   test('triggers alert state when temperature exceeds threshold', () => {
>     const { temp, isAlert } = useTemperatureAlert(50)
> 
>     expect(isAlert.value).toBe(false)
> 
>     temp.value = 55.4
>     expect(isAlert.value).toBe(true)
>   })
> })
> ```
>
> #### Technical Explanation
> 1. **Concept**: Vitest tests Vue Composition API reactivity functions natively without requiring full DOM mounting.
> 2. **Concept**: Mutating `temp.value` causes `computed` states to update synchronously during test execution.
> 3. **Concept**: `expect(isAlert.value).toBe(true)` asserts boolean reactivity contracts.
> 4. **Concept**: Instant test execution via Vitest ESM runner.
> 
---

### Exercise 2: Financial Order Validation Vitest Suite with Mock Functions

**Scenario:** A financial trading firm tests an order execution function. Vitest `vi.fn()` mocks API submission functions to verify call counts and parameter payloads.

**Requirements:**
1. Mock backend API submission function using `vi.fn()`.
2. Execute order processing function with valid trade payloads.
3. Assert that mock function was called exactly once (`toHaveBeenCalledTimes(1)`).
4. Assert parameter payloads match expected order objects (`toHaveBeenCalledWith(...)`).

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // orderExecution.spec.js
> import { describe, test, expect, vi } from 'vitest'
> 
> function processFinancialOrder(order, submitApi) {
>   if (order.shares <= 0) throw new Error('Invalid share count')
>   submitApi({ ticker: order.ticker, total: order.shares * order.price })
> }
> 
> describe('Financial Order Processing', () => {
>   test('submits calculated order payload to API mock', () => {
>     const apiMock = vi.fn()
>     const order = { ticker: 'NVDA', shares: 10, price: 450.00 }
> 
>     processFinancialOrder(order, apiMock)
> 
>     expect(apiMock).toHaveBeenCalledTimes(1)
>     expect(apiMock).toHaveBeenCalledWith({ ticker: 'NVDA', total: 4500.00 })
>   })
> })
> ```
>
> #### Technical Explanation
> 1. **Concept**: `vi.fn()` creates spy mocks to record function invocations and arguments.
> 2. **Concept**: `toHaveBeenCalledWith` verifies mathematical payload accuracy.
> 3. **Concept**: Vitest mocks replace real backend network calls during unit testing.
> 4. **Concept**: Isolates business logic from external infrastructure.
> 
---

### Exercise 3: E-Commerce Discount Code Vitest Spec Suite

**Scenario:** An online store tests coupon discount calculations across different shopping cart totals using Vitest table-driven test patterns (`test.each`).

**Requirements:**
1. Use `test.each` to execute table-driven test parameters.
2. Calculate discounted totals for 10%, 20%, and 50% promo codes.
3. Assert expected final prices match calculations.
4. Verify invalid promo codes return un-discounted prices.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // discount.spec.js
> import { describe, test, expect } from 'vitest'
> 
> function applyDiscount(total, code) {
>   const discounts = { 'SAVE10': 0.10, 'SAVE20': 0.20, 'HALF': 0.50 }
>   const rate = discounts[code] || 0
>   return total * (1 - rate)
> }
> 
> describe('E-Commerce Discount Calculator', () => {
>   test.each([
>     [100, 'SAVE10', 90],
>     [100, 'SAVE20', 80],
>     [200, 'HALF', 100],
>     [100, 'INVALID', 100]
>   ])('given total $%i and code %s, returns $%i', (total, code, expected) => {
>     expect(applyDiscount(total, code)).toBe(expected)
>   })
> })
> ```
>
> #### Technical Explanation
> 1. **Concept**: `test.each` executes repetitive test suites cleanly across parameterized inputs.
> 2. **Concept**: Asserts pricing boundary conditions (valid vs invalid promo codes).
> 3. **Concept**: Vitest formats parameter descriptions automatically in test terminal output.
> 4. **Concept**: Fast execution ensures regression safety during refactoring.
> 
---

## 6. Related Terms

- [Vue Test Utils](vue_test_utils.md) — Component mounting utility library executed inside Vitest.
- [Vite](vite.md) — The underlying build tool sharing configuration and transformation rules with Vitest.
- [Build Step (Compilation)](build_step.md) — Compilation pipeline shared between application builds and test execution.

---

## 7. Key Takeaways

- **Vitest** is a modern, Vite-native unit testing runner that eliminates dual-configuration drift.
- Shares the exact same `vite.config.js` plugins, path aliases (`@/`), and transformation rules as your dev server.
- Implements full API compatibility with Jest assertion frameworks (`describe`, `test`, `expect`, `vi`).
- Set `environment: 'jsdom'` or `'happy-dom'` when testing Vue components that access DOM elements or trigger events.
- Always `await` asynchronous triggers (`await wrapper.find('button').trigger('click')`) before asserting reactive DOM updates.
