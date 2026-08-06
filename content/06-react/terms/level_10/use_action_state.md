# `useActionState` Hook

> **Level 10 — Modern React & Architectures**
> A built-in React 19 hook that manages form action state, tracking pending status and return values of asynchronous server actions or form handlers.

---

## 1. Prerequisites

- [`useState` Hook](../level_02/use_state.md) — The core state primitive hook.
- [Server Actions & `"use server"`](server_actions.md) — Asynchronous server functions invoked via form actions.

---

## 2. Term Category

**Core Hook (form action state manager)**: `useActionState` is a built-in React 19 hook introduced to manage state resulting from asynchronous action submissions (such as Server Actions or async form handlers). It accepts an action function and an initial state, returning a tuple containing: `[state, formAction, isPending]`.

Unlike standard `useState`—which requires manual event handler wiring (`e.preventDefault()`), manual try/catch blocks, and separate boolean flags for pending states—`useActionState` integrates directly with React's concurrent form infrastructure. It tracks execution state across network transitions, updates components upon action completion, and supports progressive enhancement for HTML forms.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional React form handling, tracking the return value, error message, and loading spinner state of a server submission required writing repeated boilerplate state variables:
```jsx
// Legacy pattern requiring multiple state hooks
const [data, setData] = useState(null);
const [error, setError] = useState(null);
const [isPending, setIsPending] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsPending(true);
  try {
    const res = await myServerAction(formData);
    setData(res);
  } catch (err) {
    setError(err);
  } finally {
    setIsPending(false);
  }
};
```

React 19 introduced `useActionState` (formerly `useFormState` in earlier experimental builds) to unify form submission state into a single, clean hook call:
- **Unified Tuple:** Returns the current action state, a wrapped form action handler, and a boolean `isPending` indicator.
- **Concurrent-Safe:** Updates state within React transitions, ensuring pending updates do not freeze user interface responsiveness.
- **Progressive Enhancement:** Works seamlessly with native HTML `<form action={formAction}>` submissions before JavaScript fully hydrates.

### (2) Reality Metaphor

Imagine mailing an official document at a postal counter.

- **Manual `useState` Flow (Tracking Package Yourself):** You hand the envelope to the clerk. You write down the tracking number on a notepad (`setData`), check your watch every 30 seconds (`setIsPending`), call the regional sorting facility when delayed (`setError`), and manually update your personal logbook when delivered.
- **`useActionState` (Registered Delivery Service):** You hand the document to the postal clerk via a single registered slip (`useActionState(action, initialState)`). The postal system gives you a single status receipt (`[state, formAction, isPending]`). The system automatically lights up a red indicator while transit is in progress (`isPending`), updates the delivery receipt when the recipient signs (`state`), and records delivery errors automatically without extra paperwork.

### (3) React Code Examples

#### Short Snippet

```jsx
// NewsletterForm.jsx (React 19 useActionState)
'use client';

import { useActionState } from 'react';
import { subscribeEmailAction } from './actions';

export function NewsletterForm() {
  // [state, formAction, isPending]
  const [state, formAction, isPending] = useActionState(subscribeEmailAction, { success: false, message: '' });

  return (
    <form action={formAction}>
      <input type="email" name="email" required placeholder="user@example.com" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Subscribe'}
      </button>
      {state.message && <p className="status">{state.message}</p>}
    </form>
  );
}
```

#### Fuller Example

```jsx
// UserProfileUpdate.jsx
'use client';

import { useActionState } from 'react';
import { updateProfileServerAction } from './actions';

const initialState = {
  success: false,
  errors: {},
  user: { name: 'Alex Rivera', bio: 'Senior Architect' }
};

export function UserProfileUpdate() {
  const [state, formAction, isPending] = useActionState(updateProfileServerAction, initialState);

  return (
    <form action={formAction} className="profile-form">
      <h2>Edit User Profile</h2>

      <div className="form-group">
        <label htmlFor="name">Display Name:</label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          defaultValue={state.user.name} 
          disabled={isPending}
        />
        {state.errors.name && <span className="error">{state.errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio:</label>
        <textarea 
          id="bio" 
          name="bio" 
          defaultValue={state.user.bio} 
          disabled={isPending}
        />
        {state.errors.bio && <span className="error">{state.errors.bio}</span>}
      </div>

      <button type="submit" disabled={isPending} className="btn-save">
        {isPending ? 'Saving Profile...' : 'Save Profile'}
      </button>

      {state.message && (
        <div className={`banner ${state.success ? 'success' : 'failure'}`}>
          {state.message}
        </div>
      )}
    </form>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing the original action directly to `<form action={...}>` instead of the returned `formAction` wrapper

**The mistake:** Passing the raw action function (`subscribeEmailAction`) to the form's `action` attribute instead of the `formAction` wrapper returned by `useActionState`.

**Why it's wrong:** Passing the raw action function bypasses the state tracking closure created by `useActionState`. As a result, `state` and `isPending` will not update when the form is submitted.

*Incorrect:*
```jsx
const [state, formAction, isPending] = useActionState(subscribeAction, initialState);

// ❌ Bypasses useActionState tracking!
return <form action={subscribeAction}>...</form>;
```

*Fix:*
```jsx
const [state, formAction, isPending] = useActionState(subscribeAction, initialState);

// Use the returned formAction wrapper
return <form action={formAction}>...</form>;
```

### Mistake 2: Forgetting that the action function parameter signature receives `(previousState, formData)`

**The mistake:** Defining a Server Action for `useActionState` that accepts only `(formData)`.

**Why it's wrong:** When an action function is managed by `useActionState`, React passes the `previousState` as the first argument, and `formData` (or custom payload) as the second argument: `async function action(previousState, formData)`.

*Incorrect:*
```javascript
// ❌ Signature mismatch when used with useActionState!
export async function updateAction(formData) {
  const name = formData.get('name');
}
```

*Fix:*
```javascript
// Correct parameter signature for useActionState
export async function updateAction(previousState, formData) {
  const name = formData.get('name');
  return { success: true, name };
}
```

### Mistake 3: Returning non-serializable objects from Server Actions managed by `useActionState`

**The mistake:** Returning function callbacks or class instances from a Server Action passed to `useActionState`.

**Why it's wrong:** Server Actions must return serializable JSON data structures. Returning non-serializable objects causes serialization runtime errors across the RSC boundary.

*Incorrect:*
```javascript
export async function myAction(prev, formData) {
  return { callback: () => alert('Done') }; // ❌ Functions cannot be serialized!
}
```

*Fix:*
```javascript
export async function myAction(prev, formData) {
  return { success: true, message: 'Updated successfully' };
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Node Threshold Configuration Form

**Scenario:** Create an IoT threshold configuration component where plant engineers adjust temperature alarm limits. Use `useActionState` to process server validation and display success or field-level validation errors.

**Requirements:**
1. Implement Server Action `updateThresholdAction(prevState, formData)`.
2. Validate threshold number (must be between 0 and 150°C).
3. Use `useActionState` inside Client Component `ThresholdForm`.
4. Disable form submit button while `isPending` is `true`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/actions/thresholdActions.js
> 'use server';
>
> export async function updateThresholdAction(prevState, formData) {
>   const temp = Number(formData.get('maxTemp'));
> 
>   if (isNaN(temp) || temp < 0 || temp > 150) {
>     return {
>       success: false,
>       message: 'Validation Failed: Temperature must be between 0°C and 150°C.',
>       tempVal: temp
>     };
>   }
> 
>   // Simulated DB write
>   await new Promise(res => setTimeout(res, 1000));
>   return {
>     success: true,
>     message: `Successfully updated threshold to ${temp}°C.`,
>     tempVal: temp
>   };
> }
>
> // ThresholdForm.jsx
> 'use client';
>
> import { useActionState } from 'react';
> import { updateThresholdAction } from '@/app/actions/thresholdActions';
>
> const initial = { success: false, message: '', tempVal: 90 };
>
> export function ThresholdForm() {
>   const [state, formAction, isPending] = useActionState(updateThresholdAction, initial);
> 
>   return (
>     <form action={formAction} className="threshold-form">
>       <h3>IoT Alarm Threshold Configuration</h3>
>       
>       <label htmlFor="maxTemp">Max Temp (°C):</label>
>       <input 
>         type="number" 
>         id="maxTemp" 
>         name="maxTemp" 
>         defaultValue={state.tempVal}
>         disabled={isPending} 
>       />
> 
>       <button type="submit" disabled={isPending}>
>         {isPending ? 'Updating Config...' : 'Save Configuration'}
>       </button>
> 
>       {state.message && (
>         <p className={`status ${state.success ? 'text-green' : 'text-red'}`}>
>           {state.message}
>         </p>
>       )}
>     </form>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Signature Alignment**: `updateThresholdAction(prevState, formData)` accepts `prevState` as its first parameter.
> 2. **State Destructuring**: `useActionState` returns `[state, formAction, isPending]` tuple cleanly.
> 3. **UI Lockout**: Inputs and buttons set `disabled={isPending}` during active network transitions.
> 4. **Feedback Rendering**: Component conditionally renders status messages based on `state.success`.
> 
### Exercise 2: Financial Stock Order Execution Ticket

**Scenario:** Develop a Financial Trading order ticket form where traders specify stock ticker quantities. Use `useActionState` to handle server order validation and display order execution confirmation tickets.

**Requirements:**
1. Implement `executeOrderAction(prevState, formData)`.
2. Validate quantity > 0 and calculate total order cost.
3. Bind form submission using `useActionState`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/actions/tradeActions.js
> 'use server';
>
> export async function executeOrderAction(prevState, formData) {
>   const ticker = formData.get('ticker');
>   const qty = Number(formData.get('quantity'));
>   const price = 185.50; // Simulated market price
>
>   if (qty <= 0) {
>     return { success: false, message: 'Order rejected: Quantity must be at least 1 share.' };
>   }
>
>   const total = (qty * price).toFixed(2);
>   await new Promise(res => setTimeout(res, 800)); // Executing trade on server
>
>   return {
>     success: true,
>     message: `FILLED: Bought ${qty} shares of ${ticker} at $${price} (Total: $${total})`
>   };
> }
>
> // OrderTicket.jsx
> 'use client';
>
> import { useActionState } from 'react';
> import { executeOrderAction } from '@/app/actions/tradeActions';
>
> export function OrderTicket() {
>   const [state, formAction, isPending] = useActionState(executeOrderAction, { success: false, message: '' });
> 
>   return (
>     <form action={formAction} className="order-ticket">
>       <h4>Trade Order Execution</h4>
>       <input type="hidden" name="ticker" value="AAPL" />
>       
>       <label htmlFor="quantity">Shares (AAPL):</label>
>       <input type="number" id="quantity" name="quantity" defaultValue="10" disabled={isPending} />
> 
>       <button type="submit" disabled={isPending} className="btn-buy">
>         {isPending ? 'Routing Order...' : 'Execute Buy Order'}
>       </button>
> 
>       {state.message && (
>         <div className={`ticket-result ${state.success ? 'fill' : 'reject'}`}>
>           {state.message}
>         </div>
>       )}
>     </form>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Server Validation**: Order quantity validation runs securely inside server action execution.
> 2. **Pending Feedback**: Button text switches to `'Routing Order...'` while `isPending` is `true`.
> 3. **Execution Result**: Returned order fill confirmation string updates component UI automatically.
> 4. **State Persistence**: `previousState` is maintained across sequential form submission passes.
> 
### Exercise 3: E-Commerce Promo Coupon Applicator

**Scenario:** Implement an e-commerce checkout promo coupon input field using `useActionState` to process discount code validations on the server.

**Requirements:**
1. Implement `applyCouponAction(prevState, formData)`.
2. Check valid coupon codes (`'SAVE20'` grants 20% discount).
3. Update cart discount state upon success.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/actions/couponActions.js
> 'use server';
>
> export async function applyCouponAction(prevState, formData) {
>   const code = formData.get('couponCode')?.toString().trim().toUpperCase();
> 
>   if (code === 'SAVE20') {
>     return { success: true, discount: 20, message: '20% discount applied to your cart!' };
>   }
> 
>   return { success: false, discount: 0, message: 'Invalid or expired promotional code.' };
> }
>
> // CouponWidget.jsx
> 'use client';
>
> import { useActionState } from 'react';
> import { applyCouponAction } from '@/app/actions/couponActions';
>
> export function CouponWidget() {
>   const [state, formAction, isPending] = useActionState(applyCouponAction, {
>     success: false,
>     discount: 0,
>     message: ''
>   });
> 
>   return (
>     <div className="coupon-widget">
>       <form action={formAction}>
>         <input 
>           type="text" 
>           name="couponCode" 
>           placeholder="PROMO CODE (e.g. SAVE20)" 
>           disabled={isPending}
>         />
>         <button type="submit" disabled={isPending}>
>           {isPending ? 'Verifying...' : 'Apply Code'}
>         </button>
>       </form>
> 
>       {state.message && (
>         <p className={`coupon-msg ${state.success ? 'valid' : 'invalid'}`}>
>           {state.message}
>         </p>
>       )}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Action Integration**: `useActionState` wraps `applyCouponAction` to return managed `formAction` callback.
> 2. **Server Discount Check**: Coupon validation logic executes on server without leaking promo codes to client JS.
> 3. **Atomic State Updates**: Discount percentage and message string update in a single component render pass.
> 4. **Disabling Inputs**: Form input is locked while `isPending` network verification is active.
> 
---

## 6. Related Terms

- [`useState` Hook](../level_02/use_state.md) — Primitive state hook replaced by `useActionState` for form flows.
- [Server Actions & `"use server"`](server_actions.md) — Asynchronous server functions managed by `useActionState`.
- [React Server Components (RSC)](rsc.md) — The server component engine executing form actions.

---

## 7. Key Takeaways

- `useActionState` is a built-in React 19 hook for managing form action state and pending submission indicators.
- Returns a `[state, formAction, isPending]` tuple.
- The target action function receives `(previousState, formData)` as parameter arguments.
- Always pass the returned `formAction` wrapper (not the raw action) to HTML `<form action={formAction}>`.
- Automatically integrates with React concurrent transitions, avoiding UI freeze during network submissions.
