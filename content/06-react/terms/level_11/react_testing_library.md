# Testing: React Testing Library + Jest

> **Level 11 — Ecosystem Libraries**
> Rendering components in a virtual DOM and asserting behavior to match user interactions.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — The visual units being tested.
- [Synthetic Events](../level_05/synthetic_events.md) — The simulated interactions triggered during tests.

---

## 2. Term Category
- **Ecosystem / Testing Framework**

---

## 3. Environment Context
- **Build-Time / Test-Runner** (Executed in terminal environments using a virtual browser DOM like JSDOM).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Manually testing a web application to ensure updates do not break existing functionality is slow and scales poorly. Automated testing solves this by programmatically verifying that components behave correctly under various conditions.

In the React ecosystem, components are tested using **React Testing Library (RTL)** alongside a test runner like **Jest** (or Vitest):
-   **Jest / Vitest:** The test runner that executes tests, mocks dependencies, and provides assertions (e.g. `expect(a).toBe(b)`).
-   **React Testing Library:** A utility library that mounts React components in a headless virtual DOM environment (JSDOM) and provides helper methods to query and interact with the UI.

#### The Philosophy of RTL
> *"The more your tests resemble the way your software is used, the more confidence they can give you."*

RTL encourages testing **user behavior** rather than component implementation details. Instead of asserting against internal component state variables or private methods, your tests interact with the rendered output just like a user would: finding elements by their accessibility labels or text, triggering button clicks, typing in inputs, and asserting that the correct output appears on screen.

This approach makes your tests **resilient to refactoring**. If you change a component from a class to a function or modify its internal state structure, your tests remain valid as long as the component's visible behavior does not change.

---

### (2) Reality Metaphor
Imagine testing a kitchen toaster.
- **Implementation-based testing (White-box):** You open up the toaster casing, verify that the heating coil has exactly 12 loops, and measure the wire gauge. If you later replace the coils with a newer, more efficient heating strip (**refactoring**), your tests break, even though the toaster still functions correctly.
- **Behavior-based testing (RTL / Black-box):** You leave the toaster casing closed. You drop in a slice of bread, press the lever down (**simulating user interaction**), wait, and verify that toasted bread pops up (**asserting the outcome**). You do not care how the internal coils are wired; you only care that the toaster behaves as expected. If you upgrade the heating elements inside, the test remains green.

---

### (3) Jest + React Testing Library Code Example

#### 1. The Component: `<Counter />`
```jsx
// Counter.js
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Current Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### 2. The Test Suite: `Counter.test.js`
```jsx
// Counter.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Provides custom matcher toBeInTheDocument
import Counter from './Counter';

describe('Counter Component', () => {
  test('renders initial state and increments count on button click', () => {
    // 1. Mount the component in the virtual DOM
    render(<Counter />);

    // 2. Query the DOM for initial text
    const countDisplay = screen.getByText(/Current Count: 0/i);
    expect(countDisplay).toBeInTheDocument();

    // 3. Find the increment button by its accessibility role
    const button = screen.getByRole('button', { name: /increment/i });

    // 4. Simulate a user click event
    fireEvent.click(button);

    // 5. Assert that the count display has updated
    const updatedDisplay = screen.getByText(/Current Count: 1/i);
    expect(updatedDisplay).toBeInTheDocument();
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Querying elements using unstable CSS class names or DOM hierarchies

**The mistake:** Using CSS query selectors to locate elements in your tests:

```javascript
// BAD: If the class is changed during a style update, this test breaks!
const button = container.querySelector('.btn-blue-large');
```

**Why it's wrong:** Class names and DOM layouts are styling details that change frequently during refactoring. Querying by class names makes tests fragile and does not verify accessibility.

*Fix:* Query using accessibility attributes (like `getByRole`, `getByLabelText`, or `getByText`) first. This ensures your components are accessible to screen readers and resilient to visual style updates:

```javascript
// GOOD: Resilient to styling changes, validates accessibility
const button = screen.getByRole('button', { name: /submit/i });
```

---



### Mistake 2: Querying DOM Elements by Implementation Details (`querySelector` or CSS Classes) Instead of Accessibility Roles

**The mistake:** Writing `container.querySelector('.submit-btn')` in React Testing Library tests.

**Why it's wrong:** React Testing Library design philosophy is: **'The more your tests resemble the way your software is used, the more confidence they can give you.'** Querying CSS classes breaks tests during class name refactoring. Query by accessible role (`screen.getByRole('button', { name: /submit/i })`).

*Incorrect:*
```javascript
const btn = container.querySelector('.btn-primary'); // ❌ Implementation detail test!
```

*Fix:*
```javascript
const btn = screen.getByRole('button', { name: /submit/i }); // Accessible query
```

### Mistake 3: Using `getBy*` Instead of `findBy*` for Asynchronous Async DOM Elements

**The mistake:** Writing `screen.getByText('Loaded Data')` immediately after clicking an async fetch button.

**Why it's wrong:** `getBy*` queries evaluate SYNCHRONOUSLY and throw instantly if the element is not yet in the DOM! Use `await screen.findByText('Loaded Data')` to poll until the async element appears.

*Incorrect:*
```javascript
fireEvent.click(button);
const text = screen.getByText('Loaded Data'); // ❌ Throws before fetch resolves!
```

*Fix:*
```javascript
fireEvent.click(button);
const text = await screen.findByText('Loaded Data'); // Waits for async element
```

## 6. Practice Exercises

### Exercise 1: Testing an Alert Banner

**Problem:** Complete the test suite below to verify that clicking the "Dismiss" button removes the warning text from the screen:

```jsx
// AlertBanner.js
import React, { useState } from 'react';

export default function AlertBanner({ message }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div>
      <p>{message}</p>
      <button onClick={() => setVisible(false)}>Dismiss</button>
    </div>
  );
}

// AlertBanner.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertBanner from './AlertBanner';

test('dismisses the warning message', () => {
  render(<AlertBanner message="Warning! System Error." />);
  
  // 1. Verify warning is visible
  expect(screen.getByText(/Warning! System Error./i)).toBeInTheDocument();

  // 2. Find the dismiss button
  const button = screen.getByRole('button', { name: /dismiss/i });

  // 3. Solution: Simulate click and assert removal
  fireEvent.click(button);

  // Assert that the warning text is no longer in the document
  const warningText = screen.queryByText(/Warning! System Error./i);
  expect(warningText).not.toBeInTheDocument();
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Testing User Click Interaction with userEvent

**Problem:** Test button click incrementing counter in `Counter` component using `screen.getByRole` and `userEvent.click`.

**Expected output:**
> [!check]- Answer
> ```text
> test('increments counter', async () => { render(<Counter />); const btn = screen.getByRole('button', { name: /increment/i }); await userEvent.click(btn); expect(screen.getByText('Count: 1')).toBeInTheDocument(); });
> ```
> ```javascript
> test('increments counter', async () => {
>   render(<Counter />);
>   const btn = screen.getByRole('button', { name: /increment/i });
>   await userEvent.click(btn);
>   expect(screen.getByText('Count: 1')).toBeInTheDocument();
> });
> ```
>
> **Explanation:** `@testing-library/user-event` simulates realistic browser user interactions.
> 
---

### Exercise 3: Query Priority Order in RTL

**Problem:** List top 3 recommended query priorities in React Testing Library (1. `getByRole`; 2. `getByLabelText`; 3. `getByText` / `getByTestId`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. getByRole, 2. getByLabelText, 3. getByText / getByTestId
> ```
> ```text
> 1. getByRole, 2. getByLabelText, 3. getByText / getByTestId
> ```
>
> **Explanation:** Querying by accessibility roles tests components as screen readers and real users perceive them.
> 
## 7. Related Terms
- [Components](../level_01/components.md) — The visual units being tested.
- [Synthetic Events](../level_05/synthetic_events.md) — The event framework simulated in testing environments.

---

## 8. Key Takeaways
- Jest handles test execution, assertions, and mock functions.
- React Testing Library mounts components in JSDOM to test user behavior.
- Test user interactions and rendered output, not implementation details.
- Behavior-focused tests make code refactoring safe.
- Query elements using accessibility roles (`getByRole`, `getByLabelText`) rather than CSS classes.
- Use `queryBy...` queries (which return `null` instead of throwing an error) when asserting that an element is not present in the DOM.
