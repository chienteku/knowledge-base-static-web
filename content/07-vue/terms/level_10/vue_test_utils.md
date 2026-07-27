# Vue Test Utils

> **Level 10 — Tooling & Build Step**
> The official testing library for Vue.js. It provides utility functions to mount Vue components in an isolated test environment, allowing developers to simulate user interactions and assert that the component renders the correct HTML.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — The specific units being tested.
- Vitest / Jest — The test runners that actually execute the tests.

---

## 2. Term Category
- **Tooling / Testing**

---

## 3. Environment Context
- **Node.js (Testing Environment)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You build a complex `<LoginForm>` component. How do you know it works? You open the browser, type in a fake email, click submit, and watch what happens. This is manual testing. It is slow and prone to human error.
Automated Unit Testing solves this. But how do you write a test for a `.vue` file? You need a way to artificially "mount" the component inside Node.js, trigger a click event, and read the HTML output. 
**Vue Test Utils** provides this exact toolkit.

### (2) Mounting a Component
The core function of Vue Test Utils is `mount()`. It takes a Vue component and returns a "Wrapper" object containing the artificial DOM nodes.

```javascript
// LoginForm.spec.js
import { mount } from '@vue/test-utils'
import LoginForm from './LoginForm.vue'
import { test, expect } from 'vitest'

test('shows error when email is missing', async () => {
  // 1. Mount the component in isolation
  const wrapper = mount(LoginForm)

  // 2. Simulate User Interaction
  await wrapper.find('button').trigger('click')

  // 3. Assert the result
  expect(wrapper.text()).toContain('Email is required')
})
```

### (3) Testing Props and Emits
You can also use Vue Test Utils to pass fake Props into a component, or verify that the component emitted the correct Event back to the parent.
```javascript
const wrapper = mount(UserProfile, {
  props: { userId: 123 }
})

// Assert the component emitted an event
expect(wrapper.emitted()).toHaveProperty('userUpdated')
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `await` triggers

**The mistake:** A developer writes a test to click a button and check the text:
```javascript
wrapper.find('button').trigger('click')
expect(wrapper.text()).toContain('Success!') // Test fails!
```

**Why it's wrong:** Vue's DOM updates are asynchronous. When you trigger the click, Vue queues the state update. If you check the text immediately on the next line, the Virtual DOM hasn't updated the HTML yet!
**Golden Rule:** Every time you simulate an interaction that changes state (`trigger`, `setValue`), you MUST `await` it. This tells the test runner to pause until Vue has finished patching the DOM.
`await wrapper.find('button').trigger('click')`

---

### Mistake 2: Using `mount()` for Lightweight Component Isolation Unit Tests (Slow Tests)

**The mistake:** Using `mount(ParentComponent)` when testing a single component with 50 complex child components.

**Why it's wrong:** `mount()` renders the target component AND ALL nested child components recursively, slowing down test execution. Use `shallowMount(ParentComponent)` to stub out child components.

*Incorrect:*
```javascript
const wrapper = mount(HugeParentWithManyChildren); // ❌ Slow recursive DOM rendering!
```

*Fix:*
```javascript
const wrapper = shallowMount(HugeParentWithManyChildren); // Stubs out child components for fast unit test
```

---

### Mistake 3: Forgetting `await wrapper.find('button').trigger('click')` When Testing User Interactions

**The mistake:** Calling `wrapper.find('button').trigger('click')` synchronously and immediately asserting DOM changes on the next line.

**Why it's wrong:** `trigger()` returns a Promise that resolves when Vue flushes asynchronous DOM updates. Synchronous assertions execute before DOM updates complete and fail intermittently.

*Incorrect:*
```javascript
wrapper.find('button').trigger('click');
expect(wrapper.text()).toContain('Count: 1'); // ❌ Assertion fails before DOM flushes!
```

*Fix:*
```javascript
await wrapper.find('button').trigger('click'); // Await DOM update flush
expect(wrapper.text()).toContain('Count: 1');
```


---

## 6. Practice Exercises

### Exercise 1: Unit vs E2E Testing

**Problem:** You want to test the entire checkout flow: User logs in, adds item to cart, goes to Stripe, and pays. Should you use Vue Test Utils for this?

**Expected output:**
```text
No!
Vue Test Utils is strictly for Unit Testing (testing a *single* component in complete isolation). 
For testing entire multi-page user flows that interact with real databases or third-party APIs, you should use an End-to-End (E2E) testing framework like Cypress or Playwright.
```

> [!check]- Answer
> - Review the difference between Unit testing and E2E testing.

---

### Exercise 2: Testing Component Props with Vue Test Utils

**Problem:** Write Vue Test Utils test mounting `UserCard.vue` with prop `username: 'Alice'` and asserting `wrapper.text()` contains `'Alice'`. 

**Expected output:**
```javascript
const wrapper = mount(UserCard, { props: { username: 'Alice' } }); expect(wrapper.text()).toContain('Alice');
```

> [!check]- Answer
> - Pass props to `mount(Comp, { props })` options object.
> 
> ```javascript
> import { mount } from '@vue/test-utils';
> import UserCard from './UserCard.vue';
> 
> test('renders prop username', () => {
>   const wrapper = mount(UserCard, {
>     props: { username: 'Alice' }
>   });
>   expect(wrapper.text()).toContain('Alice');
> });
> ```

---

### Exercise 3: Emitted Events Assertion

**Problem:** How do you assert that a component emitted a custom event `'submit'` with payload `{ id: 1 }` using Vue Test Utils?

**Expected output:**
```text
expect(wrapper.emitted('submit')[0]).toEqual([{ id: 1 }]);
```

> [!check]- Answer
> - `wrapper.emitted('eventName')` returns an array of emitted event payloads.
> 
> ```javascript
> expect(wrapper.emitted('submit')[0]).toEqual([{ id: 1 }]);
> ```


---

## 7. Related Terms
- [Components](../level_04/components.md) — What Vue Test Utils is designed to mount.
- [Vite](../level_10/vite.md) — Vite powers **Vitest**, the modern testing framework that runs Vue Test Utils.
- [Vitest (Unit Testing)](../level_10/vitest.md) — The test runner that executes spec scripts containing Vue Test Utils assertions.

---

## 8. Key Takeaways
- **Vue Test Utils** is the official library for writing Automated Unit Tests for Vue components.
- It provides the `mount()` function to render a component in an isolated Node.js environment (JSDOM).
- It allows you to simulate user interactions (`wrapper.find().trigger()`) and pass fake Props.
- Because Vue DOM updates are asynchronous, you must `await` any interaction that changes the component's state before running your assertions.
- It is designed for isolated Unit Testing, not full-browser End-to-End (E2E) testing.
