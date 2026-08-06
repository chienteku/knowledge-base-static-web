# `useId` Hook

> **Level 4 — Advanced Hooks**
> A core hook for generating unique, stable identifier strings that remain consistent across server-side rendering and client hydration.

---

## 1. Prerequisites

- [Rules of Hooks](rules_of_hooks.md) — The structural laws governing hook invocations.
- [Components](../level_01/components.md) — Generating accessible identifiers inside component subtrees.

---

## 2. Term Category

**Core Hook (SSR-safe unique identifier generator)**: `useId` is React's built-in hook for generating unique, stable ID strings for HTML form controls and accessibility ARIA attributes. In traditional client-side apps, developers generated unique IDs using random number generators (`Math.random()`) or global counters.

However, in **Server-Side Rendered (SSR)** applications (such as Next.js), random ID generation causes severe **hydration mismatch errors**: the server generates one ID (e.g., `id="0.482"`), while the client browser generates a different ID during page load (e.g., `id="0.912"`). `useId` derives IDs deterministically from a component's position in the Fiber tree, guaranteeing 100% server-client ID alignment.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Building accessible web applications requires linking form `<label>` tags and ARIA descriptors to `<input>` elements using matching HTML `id` and `htmlFor` attributes:
```html
<label htmlFor="email-field">Email</label>
<input id="email-field" type="email" />
```

If a reusable `<TextField />` component hardcodes `id="email-field"`, placing two `<TextField />` components on the same page creates duplicate HTML IDs, breaking screen readers and DOM accessibility tools.

If the component generates IDs via `Math.random()` or global counters, server-rendered HTML mismatches client hydration HTML, forcing React to discard server markup and slow page loads.

React 18 introduced **`useId`** to solve this:
- **Tree-Position Determinism:** React generates IDs based on the component's exact structural position within the Fiber application tree.
- **Hydration Matching:** Because Fiber tree structures match on both Node.js server and client browser, generated ID strings align perfectly without hydration errors.

#### Multi-ID Prefix Pattern

Rather than invoking `useId()` multiple times in a single component, invoke `useId()` once and append suffix prefixes for related form elements:
```jsx
const id = useId();
// <label htmlFor={`${id}-first`}> First Name </label>
// <input id={`${id}-first`} />
// <label htmlFor={`${id}-last`}> Last Name </label>
// <input id={`${id}-last`} />
```

### (2) Reality Metaphor

Imagine seat coordinate tickets at an international stadium.

- **Random Generation (Raffle Tickets):** When entering the stadium, spectators receive a random raffle ticket number. The ticket office assigns ticket #42 to Seat A. When walking to the seat, a ticket collector hands the spectator a new random ticket #87. The numbers mismatch, causing ticket validation errors (**hydration mismatch**).
- **`useId` (Structural Coordinates):** Seats are assigned based on structural coordinates: `Section-3-Row-B-Seat-12`. Because coordinates derive from physical seat positions, the coordinate matches whether printed on the ticket blueprint (**the server**) or read at the physical seat (**the client**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useId } from 'react';

function AccessibleInput({ label }) {
  // ✅ Generates stable ID matching across SSR and Client hydration
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  );
}
```

#### Fuller Example

```jsx
import React, { useId } from 'react';

function UserRegistrationForm() {
  // Single useId call generates base string for related ARIA controls
  const baseId = useId();

  const emailId = `${baseId}-email`;
  const emailHintId = `${baseId}-email-hint`;
  const termsId = `${baseId}-terms`;

  return (
    <form className="registration-form">
      <h3>Account Setup</h3>
      
      <div className="form-group">
        <label htmlFor={emailId}>Email Address</label>
        <input
          id={emailId}
          type="email"
          aria-describedby={emailHintId}
          placeholder="user@example.com"
        />
        <small id={emailHintId} className="hint-text">
          We will send your order confirmation to this address.
        </small>
      </div>

      <div className="form-group">
        <input id={termsId} type="checkbox" />
        <label htmlFor={termsId}>I accept terms and conditions</label>
      </div>
    </form>
  );
}

export default UserRegistrationForm;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling `useId()` to Generate Key Props in Mapped Lists

**The mistake:** Calling `useId()` inside a `.map()` callback loop to generate `key` props for list items.

**Why it's wrong:** Calling hooks inside loops violates the [Rules of Hooks](rules_of_hooks.md). Furthermore, `useId` is designed for static component tree positions, not dynamic list items that re-order or filter.

*Incorrect:*
```jsx
{items.map(item => {
  const id = useId(); // ❌ Fatal: Calling hook inside loop!
  return <li key={id}>{item.name}</li>;
})}
```

*Fix:*
```jsx
// Use database item IDs for list keys
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

### Mistake 2: Using `Math.random()` for Accessibility Attributes

**The mistake:** Generating `<label htmlFor={id}>` IDs with `const id = Math.random()`.

**Why it's wrong:** `Math.random()` generates different ID strings on server vs client during SSR, causing React hydration mismatch errors.

*Incorrect:*
```jsx
const id = Math.random(); // ❌ Hydration mismatch error in SSR!
```

*Fix:*
```jsx
const id = useId(); // ✅ Deterministic SSR-safe identifier
```

### Mistake 3: Invoking `useId` Multiple Times in the Same Component for Sub-elements

**The mistake:** Calling `const id1 = useId(); const id2 = useId(); const id3 = useId();` inside a single form component.

**Why it's wrong:** While technically valid, invoking `useId` multiple times bloats hook memory allocations. Call `useId()` once and use string suffix formatting.

*Incorrect:*
```jsx
const firstNameId = useId();
const lastNameId = useId();
const emailId = useId();
```

*Fix:*
```jsx
const baseId = useId();
const firstNameId = `${baseId}-first`;
const lastNameId = `${baseId}-last`;
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Calibration Accessible Form

**Scenario:** An industrial IoT console calibrates pressure sensors. Link `<label>`, `<input>`, and ARIA hint descriptions accessibly using `useId`.

**Requirements:**
1. Generate base ID string with `useId`.
2. Link `<label>` and `<input>` using `htmlFor` and `id`.
3. Link ARIA description using `aria-describedby`.
4. Ensure 100% hydration matching.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useId } from 'react';
> 
> export function SensorCalibrationField({ label, hintText }) {
>   const id = useId();
>   const hintId = `${id}-hint`;
> 
>   return (
>     <div className="field-block">
>       <label htmlFor={id}>{label}</label>
>       <input id={id} type="number" aria-describedby={hintId} />
>       <span id={hintId} className="hint">{hintText}</span>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Deterministic Binding**: `useId()` generates tree-position aligned strings.
> 2. **Accessibility Compliance**: `htmlFor` and `aria-describedby` link seamlessly.
> 3. **Suffix Formatting**: Derived `${id}-hint` prevents multiple hook calls.
> 4. **SSR Resilience**: Eliminates hydration warning console errors.
> 
### Exercise 2: Financial Order Pad Accessible Form Controls

**Scenario:** A stock order entry pad renders symbol and quantity inputs. Connect labels accessibly using a single `useId` call.

**Requirements:**
1. Invoke `useId()` once in parent container.
2. Format symbol and quantity IDs.
3. Link labels accessibly.
4. Render trading desk controls.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useId } from 'react';
> 
> export function AccessibleOrderFields() {
>   const baseId = useId();
>   const symbolId = `${baseId}-symbol`;
>   const qtyId = `${baseId}-qty`;
> 
>   return (
>     <div>
>       <div>
>         <label htmlFor={symbolId}>Ticker Symbol</label>
>         <input id={symbolId} type="text" placeholder="e.g. AAPL" />
>       </div>
>       <div>
>         <label htmlFor={qtyId}>Order Quantity</label>
>         <input id={qtyId} type="number" min="1" />
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Single Hook Allocation**: Single `useId` call services multiple form inputs.
> 2. **Unique DOM Attributes**: Suffix strings prevent duplicate HTML element IDs.
> 3. **Screen Reader Ready**: Screen readers associate input controls with labels.
> 4. **Universal Compatibility**: Operates seamlessly in SSR or SPA setups.
> 
### Exercise 3: E-Commerce Checkout Address Form Access

**Scenario:** An e-commerce checkout step displays street address and zip code fields. Use `useId` to generate hydration-safe HTML input IDs.

**Requirements:**
1. Generate base ID using `useId`.
2. Format street and zip code input IDs.
3. Link labels via `htmlFor`.
4. Render checkout fields.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useId } from 'react';
> 
> export function CheckoutAddressFields() {
>   const baseId = useId();
>   const streetId = `${baseId}-street`;
>   const zipId = `${baseId}-zip`;
> 
>   return (
>     <div className="address-fields">
>       <div>
>         <label htmlFor={streetId}>Street Address</label>
>         <input id={streetId} type="text" />
>       </div>
>       <div>
>         <label htmlFor={zipId}>Postal / ZIP Code</label>
>         <input id={zipId} type="text" />
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Hydration Alignment**: Tree-derived IDs prevent server-client mismatches.
> 2. **Clean Component Instances**: Multiple `<CheckoutAddressFields />` on one page generate distinct IDs.
> 3. **Accessible Form Tree**: Ensures DOM accessibility compliance.
> 4. **Memory Optimization**: Avoids random string generation loops.
> 
---

## 6. Related Terms

- [Rules of Hooks](rules_of_hooks.md) — Architectural guidelines governing hook invocations.
- [Components](../level_01/components.md) — UI components containing form controls.
- [Hydration](../level_10/hydration.md) — SSR client startup process requiring matching server-client IDs.

---

## 7. Key Takeaways

- `useId` generates unique, stable ID strings for HTML form controls and ARIA attributes.
- It prevents SSR hydration mismatch errors by deriving IDs deterministically from Fiber tree positions.
- Call `useId()` once per component and append suffix prefixes (`${id}-input`) for related sub-elements.
- Never call `useId()` inside loops or array `.map()` callbacks to generate list keys.
- Avoid using `Math.random()` or global counters for form element HTML IDs.
```

---

## File 8: `knowledge-base/06-react/terms/level_04/use_memo.md`

```markdown
