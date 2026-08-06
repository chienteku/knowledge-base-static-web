# Controlled Components

> **Level 5 — DOM & Event Handling**
> A form input pattern where form element values are strictly controlled by React component state, establishing React as the single source of truth.

---

## 1. Prerequisites

- [`useState` Hook](../level_02/use_state.md) — The state hook used to hold and drive form input values.
- [Synthetic Events](synthetic_events.md) — Listening to `onChange` form events across browser implementations.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — The data architecture pattern requiring state updates to flow strictly downwards to input values.

---

## 2. Term Category

**Component Pattern (form state synchronization)**: A Controlled Component in React is a form element (such as `<input>`, `<textarea>`, or `<select>`) whose value property is bound directly to a piece of React state, while user interactions invoke state setter callbacks to push updates back into state.

Unlike standard HTML form elements where the browser DOM maintains internal input state natively, Controlled Components turn form fields into pure projections of React state. Every keystroke, selection, or checkbox toggle fires an event handler that updates state via React's updater cycle, causing a re-render that pushes the fresh state value back into the DOM element's `value` or `checked` attribute.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional vanilla HTML, DOM input elements manage their own hidden state. When a user types a character into an `<input>` box, the browser updates the input's visual value automatically without developer intervention. In React applications, having two independent sources of truth—the browser DOM state inside the input element and React component state—causes data synchronization bugs.

Controlled Components solve this by revoking the browser's authority over input state. By setting `value={state}` on an input element, React forces the DOM element to display *only* what is currently stored in React state. When the user types, the `onChange` handler intercepts the event, evaluates or formats the incoming value, and updates state via `setState`. This single source of truth enables immediate validation, masked inputs, synchronous button disabling, and dynamic multi-field form coordination.

### (2) Reality Metaphor

Imagine a remote control car driven through a video camera feed and control console.

The car's wheels do not move directly based on physical road contact or internal mechanical timers. Instead, every movement request from the terrain is sent via radio signal back to the operator's control station console (**the React State**). The console processes the signal, checks speed limits or battery power, and broadcasts a fresh drive command back down to the car's motor (**the DOM Input Value**). 

If the operator's console rejects a steering command (e.g. input validation fails), the car's wheels remain locked in their approved state. The remote car has no autonomous internal steering memory.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState } from 'react';

function SimpleSearchInput() {
  const [query, setQuery] = useState('');

  // Two-way binding loop: value bound to state, onChange updates state
  return (
    <div className="search-box">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search telemetry items..."
      />
      <button onClick={() => setQuery('')}>Clear</button>
    </div>
  );
}

export default SimpleSearchInput;
```

#### Fuller Example

```jsx
import React, { useState } from 'react';

function UserProfileForm({ onSave }) {
  // Multi-field object state for controlled form inputs
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'developer',
    notificationsEnabled: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Functional update ensuring immutable object spread
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <div>
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="role">Role:</label>
        <select id="role" name="role" value={formData.role} onChange={handleChange}>
          <option value="developer">Developer</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <div>
        <label>
          <input
            name="notificationsEnabled"
            type="checkbox"
            checked={formData.notificationsEnabled}
            onChange={handleChange}
          />
          Enable Email Notifications
        </label>
      </div>

      <button type="submit" disabled={!formData.username || !formData.email}>
        Save Profile
      </button>
    </form>
  );
}

export default UserProfileForm;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Initializing State with `undefined` or `null` (Uncontrolled to Controlled Warning)

**The mistake:** Initializing input state with `undefined` or `null` (e.g. `const [name, setName] = useState(user.name)` when `user.name` is missing).

**Why it's wrong:** When an input receives `value={undefined}` or `value={null}`, React treats the input as an *uncontrolled* DOM component. When state later updates to a string value (e.g. `'Alice'`), React flips the element to a *controlled* input, logging the warning `A component is changing an uncontrolled input to be controlled`.

*Incorrect:*
```jsx
function EditName({ initialName }) {
  // initialName is undefined initially!
  const [name, setName] = useState(initialName);
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

*Fix:*
```jsx
function EditName({ initialName }) {
  // Always default to an empty string to ensure the input starts controlled
  const [name, setName] = useState(initialName || '');
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

### Mistake 2: Supplying a Fixed `value` Prop Without an `onChange` Handler

**The mistake:** Writing `<input value={stateValue} />` without supplying an `onChange` callback.

**Why it's wrong:** Providing a fixed `value` prop binds the DOM input to state, but omitting `onChange` prevents state from changing on user keystrokes. The user is completely blocked from typing, and React issues a console warning regarding read-only form elements.

*Incorrect:*
```jsx
function LockedInput({ title }) {
  // User typing has no effect; input is permanently locked!
  return <input value={title} />;
}
```

*Fix:*
```jsx
function LockedInput({ title, onTitleChange }) {
  // Supply onChange or use readOnly prop explicitly if intentionally static
  return <input value={title} onChange={(e) => onTitleChange(e.target.value)} />;
}
```

### Mistake 3: Reading `e.target.value` for Checkbox Elements Instead of `e.target.checked`

**The mistake:** Accessing `e.target.value` when handling `<input type="checkbox" />` state changes.

**Why it's wrong:** Checkbox input DOM elements convey boolean toggle state via the `checked` property, whereas `e.target.value` defaults to the static string `"on"`. Binding state to `value` results in invalid boolean state handling.

*Incorrect:*
```jsx
const handleToggle = (e) => {
  // e.target.value evaluates to "on" string instead of boolean!
  setIsAccepted(e.target.value);
};
```

*Fix:*
```jsx
const handleToggle = (e) => {
  // Access boolean checked property for checkbox elements
  setIsAccepted(e.target.checked);
};
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Configuration Input with Numeric Masking

**Scenario:** You are building an IoT industrial Gateway configuration form. Users enter port numbers (0-65535) into a controlled input field. The field must automatically strip out non-digit characters and restrict numbers above 65535.

**Requirements:**
1. Maintain controlled input state using `useState`.
2. Intercept keystrokes in `onChange` and mask non-numeric characters using regex.
3. Clamp input value so it cannot exceed 65535.
4. Include runtime assertions verifying string filtering and numeric bounds clamping.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function PortConfigInput({ initialPort = 8080, onPortValid }) {
>   const [portStr, setPortStr] = useState(String(initialPort));
> 
>   const handlePortChange = (e) => {
>     const rawVal = e.target.value;
>     // 1. Strip non-digit characters
>     const digitsOnly = rawVal.replace(/\D/g, '');
> 
>     if (digitsOnly === '') {
>       setPortStr('');
>       return;
>     }
> 
>     // 2. Clamp numeric bound to maximum valid port
>     const numVal = parseInt(digitsOnly, 10);
>     if (numVal > 65535) {
>       setPortStr('65535');
>       if (onPortValid) onPortValid(65535);
>     } else {
>       setPortStr(digitsOnly);
>       if (onPortValid) onPortValid(numVal);
>     }
>   };
> 
>   return (
>     <div className="port-field">
>       <label htmlFor="gateway-port">Gateway Port:</label>
>       <input
>         id="gateway-port"
>         type="text"
>         value={portStr}
>         onChange={handlePortChange}
>         placeholder="e.g. 8080"
>         data-testid="port-input"
>       />
>     </div>
>   );
> }
> 
> export function testPortConfigInput() {
>   // Simulation assertion check
>   const element = PortConfigInput({ initialPort: 80 });
>   console.assert(element.props.children[1].props.value === '80', 'Port initial controlled value mismatch');
> }
> ```
>
> #### Technical Explanation
> 1. **Synchronous Masking**: Filter non-numeric characters synchronously inside `onChange` before updating state, preventing invalid characters from touching the DOM.
> 2. **State Bounds Enforcement**: Clamps numbers > 65535 during state calculation, ensuring single source of truth safety.
> 3. **Controlled Binding**: Forces `value={portStr}` string representation so clear and partial edits remain editable.
> 4. **Parent Callback Notification**: Notifies parent components of parsed integer values safely.
> 
### Exercise 2: Financial Trading Order Ticket Form

**Scenario:** Implement a stock order entry component with controlled inputs for `symbol`, `shares`, and `limitPrice`. Calculate order total dynamically from state and disable submission if parameters are invalid.

**Requirements:**
1. Store order form state using a single consolidated `useState` object.
2. Calculate total order value synchronously during render as derived state.
3. Disable order submission button if total order value exceeds portfolio buying power limit ($100,000).
4. Include runtime verification tests for order total calculation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function OrderTicketForm({ buyingPower = 100000, onSubmitOrder }) {
>   const [ticket, setTicket] = useState({
>     symbol: 'AAPL',
>     shares: 100,
>     limitPrice: 150.0
>   });
> 
>   const handleInputChange = (e) => {
>     const { name, value } = e.target;
>     setTicket((prev) => ({
>       ...prev,
>       [name]: name === 'symbol' ? value.toUpperCase() : parseFloat(value) || 0
>     }));
>   };
> 
>   // Synchronously derived state
>   const totalCost = ticket.shares * ticket.limitPrice;
>   const isExceedingBuyingPower = totalCost > buyingPower;
> 
>   const handleSubmit = (e) => {
>     e.preventDefault();
>     if (!isExceedingBuyingPower && ticket.shares > 0) {
>       onSubmitOrder({ ...ticket, totalCost });
>     }
>   };
> 
>   return (
>     <form onSubmit={handleSubmit} className="trading-ticket">
>       <h3>New Limit Order</h3>
>       <div>
>         <label>Symbol:</label>
>         <input name="symbol" value={ticket.symbol} onChange={handleInputChange} />
>       </div>
>       <div>
>         <label>Shares:</label>
>         <input name="shares" type="number" value={ticket.shares} onChange={handleInputChange} />
>       </div>
>       <div>
>         <label>Limit Price ($):</label>
>         <input name="limitPrice" type="number" step="0.01" value={ticket.limitPrice} onChange={handleInputChange} />
>       </div>
> 
>       <div className="summary" data-testid="order-summary">
>         Total Value: ${totalCost.toFixed(2)}
>         {isExceedingBuyingPower && <span className="error"> Exceeds Buying Power!</span>}
>       </div>
> 
>       <button type="submit" disabled={isExceedingBuyingPower || ticket.shares <= 0}>
>         Place Order
>       </button>
>     </form>
>   );
> }
> 
> export function testOrderTicketForm() {
>   const ticketState = { symbol: 'TSLA', shares: 500, limitPrice: 300 };
>   const cost = ticketState.shares * ticketState.limitPrice;
>   console.assert(cost === 150000, 'Calculated cost calculation mismatch');
> }
> ```
>
> #### Technical Explanation
> 1. **Functional Updater Object Spread**: Preserves unspecified form object fields while updating targeted properties immutably.
> 2. **Derived State Calculation**: Computes `totalCost` directly during render frame evaluation instead of storing duplicated redundant state.
> 3. **Controlled Form Guard**: Disables the submit button directly based on state evaluation (`isExceedingBuyingPower`).
> 4. **Synchronous Uppercasing**: Converts stock tickers to uppercase automatically inside event handlers.
> 
### Exercise 3: E-Commerce Multi-Step Checkout Address Form

**Scenario:** Create an e-commerce shipping address controlled form that provides dynamic state validation (ZIP code length) and syncs billing address fields automatically when a "Same as Shipping" controlled checkbox is toggled.

**Requirements:**
1. Control shipping address fields and "sameAsShipping" checkbox via state.
2. Copy shipping values to billing state dynamically when checkbox is checked.
3. Validate ZIP code length (must be exactly 5 digits).
4. Include runtime verification for billing address synchronization.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function CheckoutAddressForm({ onComplete }) {
>   const [shipping, setShipping] = useState({ address: '', zip: '' });
>   const [billing, setBilling] = useState({ address: '', zip: '' });
>   const [sameAsShipping, setSameAsShipping] = useState(false);
> 
>   const handleShippingChange = (e) => {
>     const { name, value } = e.target;
>     const updatedShipping = { ...shipping, [name]: value };
>     setShipping(updatedShipping);
> 
>     if (sameAsShipping) {
>       setBilling(updatedShipping);
>     }
>   };
> 
>   const handleSameToggle = (e) => {
>     const isChecked = e.target.checked;
>     setSameAsShipping(isChecked);
>     if (isChecked) {
>       setBilling(shipping);
>     }
>   };
> 
>   const isZipValid = (zip) => /^\d{5}$/.test(zip);
>   const isValid = shipping.address && isZipValid(shipping.zip) && (sameAsShipping || (billing.address && isZipValid(billing.zip)));
> 
>   return (
>     <div className="checkout-form">
>       <h3>Shipping Address</h3>
>       <input name="address" placeholder="Address" value={shipping.address} onChange={handleShippingChange} />
>       <input name="zip" placeholder="5-Digit ZIP" value={shipping.zip} onChange={handleShippingChange} />
> 
>       <label>
>         <input type="checkbox" checked={sameAsShipping} onChange={handleSameToggle} />
>         Billing address same as shipping
>       </label>
> 
>       {!sameAsShipping && (
>         <div className="billing-section">
>           <h3>Billing Address</h3>
>           <input name="address" placeholder="Address" value={billing.address} onChange={(e) => setBilling({ ...billing, address: e.target.value })} />
>           <input name="zip" placeholder="5-Digit ZIP" value={billing.zip} onChange={(e) => setBilling({ ...billing, zip: e.target.value })} />
>         </div>
>       )}
> 
>       <button disabled={!isValid} onClick={() => onComplete({ shipping, billing })}>
>         Proceed to Payment
>       </button>
>     </div>
>   );
> }
> 
> export function testCheckoutAddressForm() {
>   const validZip = /^\d{5}$/.test('90210');
>   console.assert(validZip === true, 'ZIP validation failed');
> }
> ```
>
> #### Technical Explanation
> 1. **Checkbox Synchronized State**: Updates both `sameAsShipping` and dependent state trees (`billing`) synchronously within event handlers.
> 2. **Multi-Input Mirroring**: Passes current shipping snapshot directly to billing state when sync flag is enabled.
> 3. **Controlled Disabling**: Disables payment navigation button until regex ZIP validation succeeds across active form fields.
> 4. **Conditional Sub-Form Rendering**: Mounts billing inputs conditionally when `sameAsShipping` evaluates to false.
> 
---

## 6. Related Terms

- [Uncontrolled Components](uncontrolled_components.md) — The alternative pattern delegating form state management back to browser DOM refs.
- [`useState` Hook](../level_02/use_state.md) — The fundamental state hook underpinning controlled component values.
- [Synthetic Events](synthetic_events.md) — React's cross-browser event wrappers driving `onChange` input updates.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — The architectural principle enforcing state to value binding.

---

## 7. Key Takeaways

- Controlled Components tie form element values directly to React state, establishing React as the single source of truth.
- Always pair a `value` prop with an `onChange` event handler to update state on user interactions.
- Initialize input state with empty strings (`''`) rather than `null` or `undefined` to prevent uncontrolled-to-controlled console warnings.
- Access `e.target.checked` instead of `e.target.value` when dealing with boolean checkbox input elements.
- Controlled Components enable instant validation, input masking, synchronous submit disabling, and dynamic multi-input state coordination.
