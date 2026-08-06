# Vue Test Utils

> **Level 10 — Tooling & Ecosystem**
> The official component testing utility library for Vue.js, providing functions to mount components in isolated test environments, simulate user interactions, pass props, and assert DOM output.

---

## 1. Prerequisites

- [Components](../level_04/components.md) — The specific Vue component units mounted and tested in spec files.

---

## 2. Term Category

**Testing Utility (Component Driver)**: Vue Test Utils (`@vue/test-utils`) is the official testing library for Vue 3. It provides mounting APIs (`mount`, `shallowMount`) that instantiate components in simulated DOM environments (JSDOM, Happy DOM), returning a `VueWrapper` utility object. This wrapper exposes helper methods to query elements (`find`, `findAll`), simulate DOM events (`trigger`, `setValue`), pass props, and inspect emitted component events.

Unlike End-to-End (E2E) testing tools (Cypress, Playwright) that run full browser instances, Vue Test Utils runs in fast Node.js worker threads, allowing developers to execute hundreds of isolated component unit tests in seconds.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Manual component testing is slow, repetitive, and error-prone. Opening a browser, logging in, clicking buttons, and visually verifying layout elements after every code change wastes hours of developer time.

Automated unit testing solves this, but testing `.vue` Single-File Components directly inside Node.js requires special tooling. Node.js cannot mount Vue template markup or attach DOM event listeners natively. **Vue Test Utils** was designed as the official component driver: it provides `mount()` to compile components in memory, simulate user actions (`await button.trigger('click')`), and assert expected HTML text outputs programmatic without needing a full browser.

### (2) Reality Metaphor
Imagine a vehicle safety crash-test facility. 

Instead of building a full multi-million-dollar highway system with live human drivers to test seatbelt safety, engineers place an isolated test vehicle chassis onto a hydraulic test rig inside a controlled laboratory. Automated mechanical actuators impact the vehicle, while sensors measure airbag deployment timing and force impact.

Vue Test Utils acts as that laboratory test rig. It mounts a single Vue component in complete isolation, simulates user keypresses and button clicks via automated triggers, and measures emitted events and DOM outputs programmatically.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// LoginForm.spec.js (Vue Test Utils with Vitest)
import { mount } from '@vue/test-utils'
import { test, expect } from 'vitest'
import LoginForm from './LoginForm.vue'

test('renders error message when email is empty on submit', async () => {
  // 1. Mount component in isolation
  const wrapper = mount(LoginForm)

  // 2. Simulate user button click
  await wrapper.find('button.submit-btn').trigger('click')

  // 3. Assert DOM text updates
  expect(wrapper.text()).toContain('Email is required')
})
```

#### Fuller Example
```javascript
// UserProfileCard.spec.js (Comprehensive Vue Test Utils Spec)
import { describe, test, expect } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import UserProfileCard from './UserProfileCard.vue'

describe('UserProfileCard.vue', () => {
  test('renders user name and role passed via props', () => {
    // 1. Mount with custom props
    const wrapper = mount(UserProfileCard, {
      props: {
        username: 'Alex Developer',
        role: 'Administrator'
      }
    })

    // 2. Query elements and assert text
    expect(wrapper.find('h3.user-name').text()).toBe('Alex Developer')
    expect(wrapper.find('.user-role').text()).toContain('Administrator')
  })

  test('emits roleChanged event when promote button is clicked', async () => {
    const wrapper = mount(UserProfileCard, {
      props: { username: 'Alex Developer', role: 'Operator' }
    })

    // 3. Set input values and trigger button click
    const button = wrapper.find('button.promote-btn')
    await button.trigger('click')

    // 4. Assert emitted custom component events
    const emittedEvents = wrapper.emitted()
    expect(emittedEvents).toHaveProperty('roleChanged')
    expect(wrapper.emitted('roleChanged')[0]).toEqual([{ newRole: 'Administrator' }])
  })

  test('uses shallowMount to stub child components', () => {
    // 5. shallowMount stubs out heavy child components for fast unit testing
    const wrapper = shallowMount(UserProfileCard, {
      props: { username: 'Alex Developer', role: 'Operator' }
    })

    // Heavy child components rendered as <anonymous-stub> tags
    expect(wrapper.findComponent({ name: 'HeavyAnalyticsWidget' }).exists()).toBe(true)
  })
})
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `await` Event Triggers and Input Setters

**The mistake:** Calling `wrapper.find('button').trigger('click')` synchronously and immediately asserting DOM text on the next line without `await`.

**Why it's wrong:** Vue's reactivity system flushes DOM updates asynchronously on `nextTick()`. `trigger()` and `setValue()` return Promises. Omitting `await` causes assertions to execute before Vue finishes patching the DOM, resulting in flaky test failures.

*Incorrect:*
```javascript
// ❌ Assertion fails because DOM hasn't patched yet!
wrapper.find('button').trigger('click')
expect(wrapper.text()).toContain('Success!')
```

*Fix:*
```javascript
// ✅ Await trigger Promise to allow DOM update flush
await wrapper.find('button').trigger('click')
expect(wrapper.text()).toContain('Success!')
```

---

### Mistake 2: Using `mount()` Unconditionally for Heavy Parent Components (Slow Tests)

**The mistake:** Using `mount(HugeParentComponent)` when unit testing a single parent component that contains 50 complex child components.

**Why it's wrong:** `mount()` renders the target component AND ALL nested child components recursively, leading to slow test suite execution. Use `shallowMount(ParentComponent)` to stub out child components when unit testing parent logic in isolation.

*Incorrect:*
```javascript
// ❌ Slow recursive DOM rendering of all child trees!
const wrapper = mount(HugeParentWith50Children)
```

*Fix:*
```javascript
// ✅ Stubs child components into lightweight <child-stub> elements
const wrapper = shallowMount(HugeParentWith50Children)
```

---

### Mistake 3: Attempting to Use Vue Test Utils for End-to-End Multi-Page Flow Testing

**The mistake:** Writing Vue Test Utils spec scripts to test full checkout flows across 5 different pages interacting with real backend databases and third-party APIs.

**Why it's wrong:** Vue Test Utils is strictly designed for isolated Unit and Component Testing in Node.js. Testing full browser navigation flows, real network backends, and multi-page routing belongs in End-to-End (E2E) frameworks like Playwright or Cypress.

*Incorrect:*
```text
Writing Vue Test Utils tests to navigate real websites and hit production databases.
```

*Fix:*
```text
Use Vue Test Utils for component unit tests; use Playwright or Cypress for E2E user flow testing.
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Control Panel Vue Test Utils Spec

**Scenario:** An industrial IoT engineering team writes a component test using Vue Test Utils to verify that an `IoTSensorPanel` component renders a `sensorId` prop and emits a `reset` event upon button click.

**Requirements:**
1. Mount `IoTSensorPanel` with `props: { sensorId: 'SENSOR-99' }`.
2. Assert heading text contains `'SENSOR-99'`.
3. Trigger click on `button.reset-btn`.
4. Assert `reset` custom event emitted with payload `{ sensorId: 'SENSOR-99' }`.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // IoTSensorPanel.spec.js
> import { describe, test, expect } from 'vitest'
> import { mount } from '@vue/test-utils'
> import IoTSensorPanel from './IoTSensorPanel.vue'
> 
> describe('IoTSensorPanel.vue', () => {
>   test('renders sensorId prop and emits reset event on click', async () => {
>     const wrapper = mount(IoTSensorPanel, {
>       props: { sensorId: 'SENSOR-99' }
>     })
> 
>     expect(wrapper.text()).toContain('SENSOR-99')
> 
>     const resetButton = wrapper.find('button.reset-btn')
>     await resetButton.trigger('click')
> 
>     expect(wrapper.emitted()).toHaveProperty('reset')
>     expect(wrapper.emitted('reset')[0]).toEqual([{ sensorId: 'SENSOR-99' }])
>   })
> })
> ```
>
> #### Technical Explanation
> 1. **Concept**: `mount(Comp, { props })` passes fake props into component setups.
> 2. **Concept**: `wrapper.find('button.reset-btn')` queries elements using standard CSS selectors.
> 3. **Concept**: `await resetButton.trigger('click')` simulates DOM click events asynchronously.
> 4. **Concept**: `wrapper.emitted('reset')` retrieves array history of emitted events and payloads.
> 
---

### Exercise 2: Financial Order Form Input Test with `setValue()`

**Scenario:** A financial trading application tests a buy order form. Vue Test Utils `setValue()` updates input field text, and `await` ensures computed order totals update before assertion checks.

**Requirements:**
1. Mount `OrderForm.vue` component.
2. Update share count input using `await wrapper.find('input.shares-input').setValue('25')`.
3. Assert calculated total text contains expected amount.
4. Verify form submission trigger.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // OrderForm.spec.js
> import { describe, test, expect } from 'vitest'
> import { mount } from '@vue/test-utils'
> import OrderForm from './OrderForm.vue'
> 
> describe('OrderForm.vue', () => {
>   test('updates order total dynamically when share input changes', async () => {
>     const wrapper = mount(OrderForm, {
>       props: { pricePerShare: 100 }
>     })
> 
>     const input = wrapper.find('input.shares-input')
>     await input.setValue('25')
> 
>     expect(wrapper.find('.total-amount').text()).toContain('$2,500.00')
>   })
> })
> ```
>
> #### Technical Explanation
> 1. **Concept**: `await input.setValue('25')` updates input values and dispatches `input` events automatically.
> 2. **Concept**: Awaiting `setValue()` allows Vue to recalculate computed properties before assertions run.
> 3. **Concept**: `wrapper.find('.total-amount')` inspects reactive DOM text nodes.
> 4. **Concept**: Verifies financial calculation UI binding correctness.
> 
---

### Exercise 3: E-Commerce Shopping Cart `shallowMount` Component Spec

**Scenario:** An e-commerce developer unit tests `CartDrawer.vue`, which contains heavy child components (`CheckoutForm`, `RecommendationSlider`). The test uses `shallowMount` to stub out children and test cart total calculations in isolation.

**Requirements:**
1. Mount parent using `shallowMount(CartDrawer, { props })`.
2. Verify child components rendered as stubs.
3. Assert item count text renders correctly.
4. Include test assertions for stub existence.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // CartDrawer.spec.js
> import { describe, test, expect } from 'vitest'
> import { shallowMount } from '@vue/test-utils'
> import CartDrawer from './CartDrawer.vue'
> 
> describe('CartDrawer.vue', () => {
>   test('renders cart items count and stubs heavy child components', () => {
>     const wrapper = shallowMount(CartDrawer, {
>       props: {
>         items: [
>           { id: 1, name: 'Shoes', price: 90 },
>           { id: 2, name: 'Socks', price: 10 }
>         ]
>       }
>     })
> 
>     expect(wrapper.find('.cart-count').text()).toContain('2 Items')
>     // Child component stubbed cleanly
>     expect(wrapper.find('checkout-form-stub').exists()).toBe(true)
>   })
> })
> ```
>
> #### Technical Explanation
> 1. **Concept**: `shallowMount` renders target components while stubbing child components into `<child-name-stub>` elements.
> 2. **Concept**: Speeds up unit test execution by avoiding rendering heavy child component trees.
> 3. **Concept**: Isolates parent component state logic from child component bugs.
> 4. **Concept**: Unit assertions confirm stubbing and parent state rendering.
> 
---

## 6. Related Terms

- [Components](../level_04/components.md) — The template building blocks mounted and tested by Vue Test Utils.
- [Vitest (Unit Testing)](vitest.md) — The test runner executing spec files containing Vue Test Utils calls.
- [Vite](vite.md) — The build engine powering Vitest and Vue Test Utils module compilation.

---

## 7. Key Takeaways

- **Vue Test Utils (`@vue/test-utils`)** is the official library for writing unit and component tests for Vue.
- Use `mount()` to render a component and its full child component tree; use `shallowMount()` to stub out child components for fast unit tests.
- Always `await` asynchronous triggers (`await input.setValue('text')`, `await button.trigger('click')`) to allow Vue to flush DOM updates before assertions.
- Use `wrapper.find()` to query CSS selectors and `wrapper.emitted()` to inspect emitted component events.
- Vue Test Utils is designed for fast, isolated Unit/Component Testing in Node.js, not full-browser E2E testing.
