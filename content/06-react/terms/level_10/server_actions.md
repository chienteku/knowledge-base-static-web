# Server Actions & `"use server"`

> **Level 10 — Modern React & Architectures**
> Asynchronous functions defined on the server that can be invoked directly from client components or HTML forms.

---

## 1. Prerequisites

- [React Server Components (RSC)](rsc.md) — The server-only component architecture where actions execute.
- [Client vs Server Components & `"use client"`](client_server_components.md) — The boundary separating client UI triggers from server execution.

---

## 2. Term Category

**Rendering Mechanic (server mutation protocol)**: Server Actions are RPC-style (Remote Procedure Call) asynchronous server functions declared via the `"use server"` directive. They allow client components to perform server-side data mutations, database writes, and side effects without manually constructing REST or GraphQL API endpoints, configuring router controllers, or writing boilerplate client `fetch()` code.

When a function is designated with `"use server"`, the bundler automatically generates a secure, randomized HTTP POST endpoint for that function. When called from a Client Component or passed to an HTML `<form action={...}>` element, React intercepts the invocation, packages input arguments or `FormData` into an HTTP POST request stream, executes the function on the server, and returns the serializable return value or UI update payload back to the client.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Client-Side Rendered (CSR) or standard full-stack React applications, submitting form data or triggering server mutations required substantial boilerplate code across multiple layers:
1. Create a dedicated backend API route handler (e.g. `/api/users/update`).
2. Add an event handler (`onSubmit`) inside the client component.
3. Call `e.preventDefault()`, extract form values into JavaScript objects, and write a manual `fetch('/api/users/update', { method: 'POST', body: JSON.stringify(data) })` handler.
4. Manually manage loading spinners, network errors, and cache invalidation.

Server Actions streamline this paradigm. By integrating directly with React's component model and HTML `<form>` primitives, Server Actions allow developers to write server mutation logic directly alongside UI components.

The `"use server"` directive can be applied at the file level (marking all exported functions as Server Actions) or at the function level inside a Server Component. Furthermore, Server Actions integrate seamlessly with server cache invalidation utilities (like `revalidatePath` and `revalidateTag` in Next.js), allowing a single form submission to mutate database records and immediately refresh server-rendered UI paths in a single network round-trip.

### (2) Reality Metaphor

Imagine ordering a meal at a drive-thru restaurant.

- **Traditional API Routes (Courier Delivery):** You are at home (**the client browser**). To get a burger, you write an order slip, put it in a stamped envelope, hire a courier service (**fetch API**), and wait for the courier to drive to the restaurant (**backend API route**), deliver the slip, wait for the chef, and drive back with your food. You manage courier tracking, envelope writing, and delivery status manually.
- **Server Actions (Drive-Thru Intercom Button):** You pull up to the drive-thru intercom (**the `"use server"` action trigger**). You press the button and speak your order directly to the chef in the kitchen (**calling the server function**). The restaurant's internal speaker wire handles transmission automatically. You do not write envelopes or hire couriers; the infrastructure processes your request and hands you the meal directly at the window.

### (3) React Code Examples

#### Short Snippet

```javascript
// app/actions.js
'use server';

import db from '@/lib/db';

export async function updateUserEmail(formData) {
  const email = formData.get('email');
  
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  await db.user.update({ where: { id: 1 }, data: { email } });
  return { success: true };
}
```

#### Fuller Example

```jsx
// NewsletterSubscription.jsx
'use client';

import { useState, useTransition } from 'react';
import { subscribeEmailAction } from './actions';

export function NewsletterSubscription() {
  const [statusMessage, setStatusMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData) => {
    setStatusMessage('');
    
    // Execute Server Action inside useTransition to track pending state
    startTransition(async () => {
      const result = await subscribeEmailAction(formData);
      if (result.success) {
        setStatusMessage('Success! You are subscribed.');
      } else {
        setStatusMessage(`Error: ${result.error}`);
      }
    });
  };

  return (
    <form action={handleSubmit} className="newsletter-form">
      <h3>Subscribe to Market Insights</h3>
      
      <div className="input-group">
        <input 
          type="email" 
          name="email" 
          required 
          placeholder="colleague@firm.com" 
          disabled={isPending}
        />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Subscribe'}
        </button>
      </div>

      {statusMessage && <p className="status-text">{statusMessage}</p>}
    </form>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the `"use server"` directive from Server Action functions

**The mistake:** Exporting an async database mutation function intended for form actions without specifying `"use server"` at the top of the file or function body.

**Why it's wrong:** Without `"use server"`, the bundler does not create an RPC HTTP endpoint for the function. When passed to a `<form action={...}>` in a Client Component, React will fail to invoke the function or attempt to bundle server code into the client.

*Incorrect:*
```javascript
// actions.js
// ❌ Missing 'use server' directive at top of file!
export async function deletePost(postId) {
  await db.posts.delete({ where: { id: postId } });
}
```

*Fix:*
```javascript
// actions.js
'use server'; // Marks all exported functions as Server Actions

export async function deletePost(postId) {
  await db.posts.delete({ where: { id: postId } });
}
```

### Mistake 2: Failing to validate and sanitize input arguments inside Server Actions

**The mistake:** Trusting raw `formData.get('email')` values directly in database queries without validation schema checks.

**Why it's wrong:** Server Actions expose public HTTP POST endpoints! Malicious actors can send forged payloads directly to Server Action endpoints bypassing client-side form controls. You MUST validate input parameters on the server using libraries like Zod.

*Incorrect:*
```javascript
'use server';

export async function updateBio(formData) {
  // ❌ Dangerous: Unvalidated raw user input passed directly to DB!
  await db.user.update({ data: { bio: formData.get('bio') } });
}
```

*Fix:*
```javascript
'use server';
import { z } from 'zod';

const BioSchema = z.string().max(500);

export async function updateBio(formData) {
  const rawBio = formData.get('bio');
  const bio = BioSchema.parse(rawBio); // Validate schema securely on server
  await db.user.update({ data: { bio } });
}
```

### Mistake 3: Defining confidential environment variables in the module outer scope of Server Action files

**The mistake:** Declaring top-level secret API keys in the outer module scope of a file containing `"use server"`.

**Why it's wrong:** If non-action helper utilities are imported from that file into Client Components, outer module variables can accidentally leak into client JavaScript bundles.

*Incorrect:*
```javascript
'use server';

const DB_SECRET_PASSWORD = 'super-secret-password'; // ❌ Risk of module leak!

export async function submitData(data) { ... }
```

*Fix:*
```javascript
'use server';

import 'server-only'; // Enforce server-only execution
import { getDbPassword } from '@/lib/secrets';

export async function submitData(data) {
  const dbPass = getDbPassword();
  // Execute mutation securely
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Alarm Silence Mutation

**Scenario:** Build an IoT Telemetry alarm panel where an operator clicks a button to silence an active turbine alarm. The silence request triggers a Server Action that updates the alarm status in PostgreSQL and revalidates the dashboard UI.

**Requirements:**
1. Create Server Action `silenceAlarmAction(alarmId)`.
2. Perform DB update setting `silenced: true`.
3. Call `revalidatePath('/telemetry')`.
4. Call `silenceAlarmAction` from a client button using `useTransition`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/actions/telemetryActions.js
> 'use server';
>
> import db from '@/lib/db';
> import { revalidatePath } from 'next/cache';
>
> export async function silenceAlarmAction(alarmId) {
>   if (!alarmId) return { success: false, error: 'Alarm ID required' };
>   
>   await db.alarms.update({
>     where: { id: alarmId },
>     data: { silenced: true }
>   });
>
>   revalidatePath('/telemetry');
>   return { success: true };
> }
>
> // SilenceButton.jsx
> 'use client';
>
> import { useTransition } from 'react';
> import { silenceAlarmAction } from '@/app/actions/telemetryActions';
>
> export function SilenceButton({ alarmId }) {
>   const [isPending, startTransition] = useTransition();
> 
>   const handleSilence = () => {
>     startTransition(async () => {
>       await silenceAlarmAction(alarmId);
>     });
>   };
>
>   return (
>     <button 
>       onClick={handleSilence} 
>       disabled={isPending}
>       className="btn-silence"
>     >
>       {isPending ? 'Silencing...' : 'Silence Alarm'}
>     </button>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Server Execution**: `silenceAlarmAction` executes strictly on Node.js server runtime, interacting safely with database ORM.
> 2. **Path Revalidation**: `revalidatePath('/telemetry')` purges stale server caches, triggering automatic UI refetching.
> 3. **Non-Blocking UI**: `useTransition` tracks pending execution state without blocking user UI interactions.
> 4. **Serializable IDs**: Alarm ID is passed as a primitive string parameter across the RPC boundary.
> 
### Exercise 2: Financial Stock Watchlist Addition

**Scenario:** Develop a Financial Trading watchlist widget allowing users to add stock tickers to their portfolio. Validate ticker inputs on the server using Zod before inserting into the database.

**Requirements:**
1. Implement Server Action `addTickerAction(formData)`.
2. Validate ticker string using Zod schema (uppercase, 1-5 chars).
3. Return detailed success or error status objects.
4. Bind action to `<form action={...}>` in `WatchlistForm`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/actions/watchlistActions.js
> 'use server';
>
> import { z } from 'zod';
> import db from '@/lib/db';
>
> const TickerSchema = z.string().min(1).max(5).transform(val => val.toUpperCase());
>
> export async function addTickerAction(formData) {
>   try {
>     const rawTicker = formData.get('ticker');
>     const symbol = TickerSchema.parse(rawTicker);
>
>     await db.watchlist.create({ data: { symbol } });
>     return { success: true, symbol };
>   } catch (err) {
>     return { success: false, error: 'Invalid stock ticker symbol (1-5 letters).' };
>   }
> }
>
> // WatchlistForm.jsx
> 'use client';
>
> import { useState } from 'react';
> import { addTickerAction } from '@/app/actions/watchlistActions';
>
> export function WatchlistForm() {
>   const [feedback, setFeedback] = useState(null);
>
>   const handleSubmit = async (formData) => {
>     const res = await addTickerAction(formData);
>     if (res.success) {
>       setFeedback(`Added ${res.symbol} to watchlist!`);
>     } else {
>       setFeedback(res.error);
>     }
>   };
>
>   return (
>     <form action={handleSubmit} className="watchlist-form">
>       <label htmlFor="ticker">Add Symbol:</label>
>       <input type="text" id="ticker" name="ticker" required placeholder="AAPL" />
>       <button type="submit">Add Ticker</button>
>       {feedback && <p className="feedback">{feedback}</p>}
>     </form>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Input Sanitization**: Server Action uses Zod `.parse()` and `.transform()` to validate and uppercase input strings securely.
> 2. **Native Form Binding**: `<form action={handleSubmit}>` leverages React 19 native form action handlers.
> 3. **Error Isolation**: Validation errors are caught server-side and returned as serializable error status messages.
> 4. **State Feedback**: Local component state displays instant user feedback upon action resolution.
> 
### Exercise 3: E-Commerce Quantity Update Action with Optimistic UI

**Scenario:** Implement an e-commerce shopping cart item quantity updater using Server Actions and React's `useOptimistic` hook for immediate UI feedback.

**Requirements:**
1. Implement Server Action `updateCartQuantityAction(itemId, newQty)`.
2. Implement `CartItemRow` with `useOptimistic` hook.
3. Instantly display updated quantity before server network response resolves.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/actions/cartActions.js
> 'use server';
>
> import db from '@/lib/db';
> import { revalidatePath } from 'next/cache';
>
> export async function updateCartQuantityAction(itemId, newQty) {
>   await db.cartItems.update({
>     where: { id: itemId },
>     data: { quantity: newQty }
>   });
>   revalidatePath('/cart');
> }
>
> // CartItemRow.jsx
> 'use client';
>
> import { useOptimistic, startTransition } from 'react';
> import { updateCartQuantityAction } from '@/app/actions/cartActions';
>
> export function CartItemRow({ item }) {
>   const [optimisticQty, setOptimisticQty] = useOptimistic(
>     item.quantity,
>     (current, updated) => updated
>   );
>
>   const handleQuantityChange = (delta) => {
>     const nextQty = Math.max(1, optimisticQty + delta);
>     
>     startTransition(async () => {
>       setOptimisticQty(nextQty); // Instant local optimistic update
>       await updateCartQuantityAction(item.id, nextQty); // Server action execution
>     });
>   };
> 
>   return (
>     <div className="cart-row">
>       <span>{item.name}</span>
>       <div className="qty-controls">
>         <button onClick={() => handleQuantityChange(-1)}>-</button>
>         <span>{optimisticQty}</span>
>         <button onClick={() => handleQuantityChange(1)}>+</button>
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Optimistic Rendering**: `useOptimistic` updates local UI count instantly, eliminating latency perception during server round-trips.
> 2. **Automatic Rollback**: If `updateCartQuantityAction` fails or throws on the server, React automatically reverts `optimisticQty` to actual server state.
> 3. **Transition Encapsulation**: `startTransition` marks the state update and server action execution as non-blocking transition tasks.
> 4. **Revalidation Sync**: `revalidatePath('/cart')` ensures server state and client UI stay perfectly synchronized after mutation.
> 
---

## 6. Related Terms

- [React Server Components (RSC)](rsc.md) — The server environment where actions execute.
- [Client vs Server Components & `"use client"`](client_server_components.md) — The boundary separating client components from server actions.
- [`useActionState` Hook](use_action_state.md) — The React 19 hook for managing form action pending states and return results.
- [Next.js](nextjs.md) — The meta-framework providing server revalidation utilities for Server Actions.

---

## 7. Key Takeaways

- Server Actions are asynchronous server-side functions designated with the `"use server"` directive.
- They allow client components and forms to trigger server database mutations without manual API routes.
- The bundler generates secure RPC HTTP POST endpoints for Server Actions automatically.
- Always validate and sanitize Server Action input arguments on the server using Zod or similar validation schemas.
- Combine Server Actions with `useTransition` or `useOptimistic` for responsive user interfaces.
- Protect server modules containing secrets by importing the `server-only` package.
