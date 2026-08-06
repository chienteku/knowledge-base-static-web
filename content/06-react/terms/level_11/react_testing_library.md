# Testing: React Testing Library + Jest

> **Level 11 — Ecosystem Libraries**
> A component testing framework and runner setup that mounts React components into a virtual DOM to test visual behavior matching user interactions.

---

## 1. Prerequisites

- [Components](../level_01/components.md) — The visual units of user interface being tested.
- [Synthetic Events](../level_05/synthetic_events.md) — The simulated DOM user interactions dispatched during test execution.

---

## 2. Term Category

**Ecosystem (component testing framework)**: React Testing Library (RTL) paired with Jest (or Vitest) forms the standard component testing framework ecosystem for React applications. Jest acts as the test runner, mock provider, and assertion suite, while React Testing Library provides utilities to mount React component trees into a virtual browser DOM (JSDOM), query rendered DOM elements, and dispatch realistic user interaction events.

Unlike legacy testing utilities (like Enzyme) that inspected internal implementation details—such as private component state variables, internal method signatures, or subcomponent class instances—React Testing Library enforces **behavior-driven black-box testing**. Tests query elements by accessibility roles, labels, and text content, interacting with components strictly as a real user or screen reader would.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In the early days of React testing, developer suites relied heavily on implementation-detail testing. Tests asserted against internal component state structures (`wrapper.state('count')`), verified exact internal CSS class names (`.btn-primary-large`), or mocked internal component methods directly.

This approach created fragile, brittle test suites:
- **False Negatives:** When developers refactored a component from a class component to a functional component with hooks, or renamed an internal state variable, every unit test failed—even though the component's visible UI behavior remained 100% correct.
- **Accessibility Blind Spots:** Tests passed despite broken markup because they queried CSS class names directly without validating accessible HTML roles.

React Testing Library was built around a single core philosophy:
> *"The more your tests resemble the way your software is used, the more confidence they can give you."*

RTL forces tests to locate elements via accessible query APIs (`getByRole`, `getByLabelText`, `getByText`). If a button is renamed or converted to a custom hook internally, tests pass as long as a screen reader or user can locate and click the visible button interface.

### (2) Reality Metaphor

Imagine testing a toaster appliance.

- **Implementation Testing (White-Box / Enzyme):** You open up the toaster casing, verify that the heating coil has 14 wire loops, and check the internal serial number stamped on the circuit board (**testing state & class variables**). When the manufacturer upgrades the heating coil to a ceramic heating plate (**refactoring**), your test fails, even though the toaster still toasts bread perfectly.
- **Behavior Testing (Black-Box / RTL):** You leave the casing closed. You insert a slice of bread into the top slot, push the side lever down (**user interaction via `fireEvent` / `userEvent`**), and verify that toasted bread pops up (**asserting DOM outcome**). You do not care how the internal wires are routed; you only care that pushing the lever yields toasted bread. Refactoring internal heating plates keeps your tests passing green.

### (3) React Code Examples

#### Short Snippet

```jsx
// Counter.test.jsx (React Testing Library + Jest)
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Counter } from './Counter';

test('increments counter display on button click', () => {
  // 1. Mount component into JSDOM
  render(<Counter />);

  // 2. Query element by accessible text
  expect(screen.getByText(/Count: 0/i)).toBeInTheDocument();

  // 3. Locate button by accessible role and simulate click
  const button = screen.getByRole('button', { name: /increment/i });
  fireEvent.click(button);

  // 4. Assert updated DOM text
  expect(screen.getByText(/Count: 1/i)).toBeInTheDocument();
});
```

#### Fuller Example

```jsx
// PatientVitalsForm.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PatientVitalsForm } from './PatientVitalsForm';

describe('PatientVitalsForm Component', () => {
  test('submits valid heart rate telemetry and displays success confirmation', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();

    render(<PatientVitalsForm onSubmit={mockOnSubmit} />);

    // 1. Query inputs by accessible label text
    const hrInput = screen.getByLabelText(/Heart Rate \(BPM\):/i);
    const submitBtn = screen.getByRole('button', { name: /Record Vitals/i });

    // 2. Simulate typing into form input using userEvent
    await user.clear(hrInput);
    await user.type(hrInput, '84');

    // 3. Click submit button
    await user.click(submitBtn);

    // 4. Assert mock callback execution
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({ heartRate: 84 });

    // 5. Assert async confirmation banner arrival using findByRole
    const alertBanner = await screen.findByRole('alert');
    expect(alertBanner).toHaveTextContent(/Vitals Recorded: 84 BPM/i);
  });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying DOM elements by CSS class names or internal selectors instead of accessible roles

**The mistake:** Locating elements using `container.querySelector('.btn-submit')` or `#submit-id`.

**Why it's wrong:** CSS classes and IDs are styling implementation details that change frequently during UI redesigns. Querying class names makes tests fragile and fails to verify accessibility.

*Incorrect:*
```javascript
// ❌ Fragile: Breaks if class name '.btn-primary' is renamed during restyling!
const button = container.querySelector('.btn-primary');
```

*Fix:*
```javascript
// Query using accessible roles and accessible name options
const button = screen.getByRole('button', { name: /submit/i });
```

### Mistake 2: Using synchronous `getBy*` queries for asynchronous elements instead of `findBy*`

**The mistake:** Calling `screen.getByText('Data Loaded')` immediately after triggering an async fetch button click.

**Why it's wrong:** `getBy*` queries evaluate synchronously and throw an error immediately if the element is not currently in the DOM. Async elements fetched from APIs require `findBy*` queries, which poll until the element appears or times out.

*Incorrect:*
```javascript
await user.click(fetchBtn);
// ❌ Throws immediately because fetch has not resolved yet!
const result = screen.getByText('Data Loaded');
```

*Fix:*
```javascript
await user.click(fetchBtn);
// Polls until element appears in DOM (returns a promise)
const result = await screen.findByText('Data Loaded');
```

### Mistake 3: Testing component internal state variables directly instead of rendered output

**The mistake:** Attempting to read internal component state (e.g. `expect(wrapper.state.count).toBe(1)`).

**Why it's wrong:** Users cannot see internal state variables; they only see rendered DOM text and UI elements. Testing state variables binds your test suite to internal code structures, breaking tests during refactoring.

*Incorrect:*
```javascript
// ❌ Testing implementation detail state variable
expect(componentState.isLoading).toBe(true);
```

*Fix:*
```javascript
// Assert visible loading indicator rendered on screen
expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
```

---

## 5. Practice Exercises

### Exercise 1: IoT Alarm Silence Control Button Test

**Scenario:** Write a Jest + React Testing Library unit test for an IoT AlarmSilenceWidget component. Verify that clicking "Silence Alarm" hides the active warning alert text.

**Requirements:**
1. Render `AlarmSilenceWidget` with active alarm message prop.
2. Assert alarm text is visible initially.
3. Simulate user click on "Silence Alarm" button.
4. Assert alarm text is no longer present in DOM using `queryByText`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // AlarmSilenceWidget.test.jsx
> import { render, screen } from '@testing-library/react';
> import userEvent from '@testing-library/user-event';
> import '@testing-library/jest-dom';
> import { AlarmSilenceWidget } from './AlarmSilenceWidget';
> 
> test('silences alarm and removes alert message from DOM on click', async () => {
>   const user = userEvent.setup();
>   const alarmMsg = 'CRITICAL: Turbine Temperature Overheat';
> 
>   render(<AlarmSilenceWidget message={alarmMsg} />);
> 
>   // 1. Assert initial alert message exists
>   expect(screen.getByText(alarmMsg)).toBeInTheDocument();
> 
>   // 2. Locate silence button by role
>   const silenceBtn = screen.getByRole('button', { name: /Silence Alarm/i });
> 
>   // 3. User clicks button
>   await user.click(silenceBtn);
> 
>   // 4. Assert message is null using queryByText (does not throw when missing)
>   expect(screen.queryByText(alarmMsg)).not.toBeInTheDocument();
> });
> ```
>
> #### Technical Explanation
> 1. **Accessible Role Queries**: `getByRole('button', { name: /Silence Alarm/i })` queries elements via accessible name.
> 2. **User Event Realism**: `@testing-library/user-event` dispatches realistic hover, focus, and click event sequences.
> 3. **Non-Throwing Absence Assertions**: `queryByText` returns `null` when an element is absent, allowing `.not.toBeInTheDocument()` assertions.
> 4. **Black-Box Validation**: Test verifies visible DOM disappearance without reading internal component state variables.
> 
### Exercise 2: Financial Trading Order Ticket Input Validation Test

**Scenario:** Write a test suite for a Financial Trading order ticket form. Verify that submitting a negative share quantity displays an accessible error message.

**Requirements:**
1. Render `OrderTicketForm`.
2. Clear and type `"-5"` into quantity input.
3. Submit form.
4. Assert error alert text appears using `findByRole('alert')`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // OrderTicketForm.test.jsx
> import { render, screen } from '@testing-library/react';
> import userEvent from '@testing-library/user-event';
> import '@testing-library/jest-dom';
> import { OrderTicketForm } from './OrderTicketForm';
> 
> test('displays error alert when submitting negative share quantity', async () => {
>   const user = userEvent.setup();
> 
>   render(<OrderTicketForm symbol="AAPL" />);
> 
>   const qtyInput = screen.getByLabelText(/Share Quantity/i);
>   const submitBtn = screen.getByRole('button', { name: /Submit Order/i });
> 
>   // Type invalid negative quantity
>   await user.clear(qtyInput);
>   await user.type(qtyInput, '-5');
>   await user.click(submitBtn);
> 
>   // Assert accessible alert role displays error message
>   const errorAlert = await screen.findByRole('alert');
>   expect(errorAlert).toHaveTextContent(/Quantity must be greater than zero/i);
> });
> ```
>
> #### Technical Explanation
> 1. **Label Association**: `getByLabelText` verifies input elements are correctly associated with HTML `<label>` tags for accessibility.
> 2. **Realistic User Input**: `user.clear()` and `user.type()` simulate realistic keypress event streams.
> 3. **Accessible Role Assertions**: `findByRole('alert')` verifies error messaging uses accessible ARIA alert roles.
> 4. **Refactor-Proof Integrity**: Test passes regardless of whether form validation is written with Zod, Formik, or custom state hooks.
> 
### Exercise 3: E-Commerce Dynamic Cart Item Counter Test

**Scenario:** Write a test verifying that clicking the `+` button in an e-commerce cart row increments the displayed quantity text.

**Requirements:**
1. Render `CartItemRow` with initial quantity `1`.
2. Locate `+` increment button by accessible role/name.
3. Click increment button.
4. Assert quantity text updates to `2`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // CartItemRow.test.jsx
> import { render, screen } from '@testing-library/react';
> import userEvent from '@testing-library/user-event';
> import '@testing-library/jest-dom';
> import { CartItemRow } from './CartItemRow';
> 
> test('increments item quantity upon clicking increment button', async () => {
>   const user = userEvent.setup();
> 
>   render(<CartItemRow name="Wireless Mouse" price={49.99} initialQty={1} />);
> 
>   // Verify initial quantity text
>   expect(screen.getByText(/Quantity: 1/i)).toBeInTheDocument();
> 
>   // Locate increment button
>   const incrementBtn = screen.getByRole('button', { name: /Increase Quantity/i });
> 
>   // Click button
>   await user.click(incrementBtn);
> 
>   // Assert updated quantity text
>   expect(screen.getByText(/Quantity: 2/i)).toBeInTheDocument();
> });
> ```
>
> #### Technical Explanation
> 1. **Behavior Verification**: Tests user-visible counter text changes rather than inspecting `useState` numbers.
> 2. **Accessible Names**: Buttons are assigned accessible `aria-label="Increase Quantity"` names for screen reader compatibility.
> 3. **User Event Integration**: Uses `await user.click()` to handle modern async event batching.
> 4. **Resilient Matchers**: Uses regex `/Quantity: 2/i` for case-insensitive flexible text matching.
> 
---

## 6. Related Terms

- [Components](../level_01/components.md) — The UI components under test.
- [Synthetic Events](../level_05/synthetic_events.md) — The DOM event layer simulated during testing.
- [Controlled Components](../level_05/controlled_components.md) — Form components tested via input typing and change handlers.

---

## 7. Key Takeaways

- Jest provides test execution, assertions, and mocks; React Testing Library mounts components into JSDOM.
- Enforces behavior-driven testing: test how components behave for users, not internal code implementation details.
- Query elements using accessibility roles (`getByRole`, `getByLabelText`, `getByText`) rather than CSS class names.
- Use `userEvent` (from `@testing-library/user-event`) over `fireEvent` to simulate realistic browser interactions.
- Use `findBy*` queries for asynchronous elements loaded after network responses or timers.
- Use `queryBy*` queries (which return `null` instead of throwing) when asserting that an element is absent from the DOM.
