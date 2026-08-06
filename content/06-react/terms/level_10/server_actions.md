# Server Actions & `"use server"`

> **Level 10 — Modern React & Architectures**
> Calling server functions directly from components without a manual API route.

---

## 1. Prerequisites
- [React Server Components (RSC)](rsc.md) — The environment where actions execute.
- [Client vs Server Components & `"use client"`](client_server_components.md) — The boundary separating client triggers from server code.

---

## 2. Term Category
- **Component Pattern / Data Mutation**

---

## 3. Environment Context
- **Universal** (Triggered by client interactions, executed strictly on the server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional React development, sending data from a client-side form to a server database required writing significant boilerplate:
1.  Create a separate backend API route (e.g. `/api/newsletter`) on the server.
2.  Add an `onSubmit` listener to the form in the client-side component.
3.  Write a client-side fetch handler: `fetch('/api/newsletter', { method: 'POST', body: JSON.stringify(data) })`.
4.  Manage request loading, error states, and response parsing.

This approach splits form handling across different files and contexts, making code maintenance and validation complex.

React 19 and modern meta-frameworks (like Next.js) introduced **Server Actions**:
-   **Direct Calls:** Server Actions are asynchronous functions that run on the server but can be invoked directly from Client Components, bypassing the need to write manual API endpoints.
-   **Under-the-Hood Routing:** When you mark a function with the `"use server"` directive, the bundler generates a secure HTTP endpoint for it and replaces client-side imports with a fetch request automatically.
-   **Form Integration:** Server Actions integrate directly with the HTML `<form>` tag's `action` attribute. When the form is submitted, React intercepts the event, posts the form data directly to the server, runs the action, updates the database, and refreshes the page UI.

---

### (2) The `"use server"` Directive
The `"use server"` directive declares server actions. It can be used in two ways:
1.  **File Level:** Placed at the top of a file (e.g., `actions.js`), marking all exported functions in that file as Server Actions.
2.  **Function Level:** Placed at the top of an inline function body inside a Server Component.

---

### (3) Reality Metaphor
Imagine ordering food.
- **Traditional API Routes (Courier Delivery):** You are at home (**the client**). You want a burger. You write your order on a card, place it in an envelope, hire a courier (**fetch**), and wait for them to drive to the restaurant (**the API endpoint**), deliver the note, wait for the chef to cook, and drive back. You must manage the courier and envelope details yourself.
- **Server Actions (Drive-Thru Speaker):** You pull up to the restaurant drive-thru speaker (**the action trigger**). You press the button and state your order directly to the chef listening inside the kitchen. The speaker wire connects you directly to the kitchen (**"use server" link**). You do not manage couriers or write envelopes; the restaurant infrastructure handles the transport.

---

### (4) React Code Example: Newsletter Subscription Form

#### 1. Defining Server Actions (actions.js)
```javascript
// actions.js
'use server'; // Marks all functions exported from this file as Server Actions

// This function runs strictly on the server
export async function subscribeEmail(formData) {
  const email = formData.get('email');

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address.' };
  }

  // Directly access database (safe from client leak)
  await db.subscriptions.create({ email });

  return { success: true };
}
```

#### 2. The Form Component (Client Component)
```jsx
// NewsletterForm.js
'use client';

import React, { useState } from 'react';
import { subscribeEmail } from './actions'; // Import the server action

export default function NewsletterForm() {
  const [status, setStatus] = useState(null);

  const handleAction = async (formData) => {
    const result = await subscribeEmail(formData); // Call server action directly
    if (result.success) {
      setStatus('Subscribed successfully!');
    } else {
      setStatus(`Error: ${result.error}`);
    }
  };

  return (
    <form action={handleAction}>
      <input type="email" name="email" required placeholder="Enter email" />
      <button type="submit">Subscribe</button>
      {status && <p>{status}</p>}
    </form>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Declaring secret variables outside the action function in the same file

**The mistake:** Placing API keys or secret database configurations in the outer scope of a file containing Server Actions, assuming they are hidden because of `"use server"`:

```javascript
// BAD: Secret key can be exposed if the file imports non-action functions!
'use server';

const DB_SECRET_KEY = 'super-secret-key'; 

export async function saveUser(data) { ... }
```

**Why it's wrong:** While the bundler extracts Server Actions into separate endpoints, any code or variables defined in their outer scope can sometimes leak into client-side bundles if the file imports other standard functions.

*Fix:* Keep files containing `"use server"` focused strictly on exporting Server Action functions. Import server-only secrets from separate modules, and use the `import 'server-only'` package to ensure those modules are never bundled for the client.

---



### Mistake 2: Omitting `'use server'` Directives from Async Server Action Functions

**The mistake:** Defining an async form action function without specifying `'use server'` at top of function or module.

**Why it's wrong:** Next.js / React Server Actions require `'use server'` to expose the function as an HTTP POST RPC endpoint. Omitting `'use server'` throws error when passed to `<form action={...}>`.

*Incorrect:*
```javascript
async function updateUser(formData) {
  await db.user.update(...); // ❌ Missing 'use server' directive!
}
```

*Fix:*
```javascript
async function updateUser(formData) {
  'use server';
  await db.user.update(...);
}
```

### Mistake 3: Failing to Validate and Sanitize `formData` Inputs in Server Actions (Security Vulnerability)

**The mistake:** Trusting `formData.get('email')` directly inside database queries without input validation.

**Why it's wrong:** Server Actions create public HTTP POST endpoints! Anyone can send malicious payloads to Server Action endpoints. ALWAYS validate input schema using Zod or Yup before database mutation.

*Incorrect:*
```javascript
async function action(formData) {
  'use server';
  await db.query(formData.get('rawSql')); // 💥 Critical security vulnerability!
}
```

*Fix:*
```javascript
async function action(formData) {
  'use server';
  const email = z.string().email().parse(formData.get('email'));
  await db.user.update({ email });
}
```

## 6. Practice Exercises

### Exercise 1: Form Deletion Action

**Problem:** Complete the product deletion item button below, passing the product ID to a server-side deletion action:

```jsx
// actions.js
'use server';
export async function deleteProduct(productId) {
  await db.products.delete({ id: productId });
}

// ProductItem.js (Client Component)
'use client';
import React from 'react';
import { deleteProduct } from './actions';

// Solution:
export default function ProductItem({ product }) {
  return (
    <div className="product-item">
      <span>{product.name}</span>
      <button 
        onClick={async () => {
          if (confirm('Delete this product?')) {
            await deleteProduct(product.id); // Call Server Action with argument
            alert('Deleted!');
          }
        }}
      >
        Delete
      </button>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Form Handling with Server Action and revalidatePath

**Problem:** Write Server Action `createPost` reading `formData`, inserting to DB, and calling `revalidatePath('/posts')`.

**Expected output:**
> [!check]- Answer
> ```text
> async function createPost(formData) { 'use server'; const title = formData.get('title'); await db.posts.create({ title }); revalidatePath('/posts'); }
> ```
> ```javascript
> async function createPost(formData) {
>   'use server';
>   const title = formData.get('title');
>   await db.posts.create({ title });
>   revalidatePath('/posts');
> }
> ```
>
> **Explanation:** Server Actions execute server mutations directly from forms, calling `revalidatePath` to purge stale caches.
> 
---

### Exercise 3: Client Hook for Server Action Pending State

**Problem:** What React hook manages pending state and form status for Server Actions in Client Components? (`useFormStatus` / `useActionState`).

**Expected output:**
> [!check]- Answer
> ```text
> useFormStatus / useActionState hook
> ```
> ```javascript
> const { pending } = useFormStatus();
> ```
>
> **Explanation:** `useFormStatus` tracks parent form Server Action submission pending states.
> 
## 7. Related Terms
- [Client vs Server Components & `"use client"`](client_server_components.md) — The environment boundaries separating code.
- [`useActionState` Hook](use_action_state.md) — The hook used to read the return status of a Server Action.
- [React Server Components (RSC)](rsc.md) — Related concept: React Server Components (RSC).

---

## 8. Key Takeaways
- Server Actions call server-side functions directly from client events or form actions.
- They eliminate the boilerplate of writing API routes and manual fetch requests.
- Mark a file or function with `"use server"` to declare a Server Action.
- React wraps Server Actions in HTTP POST requests under the hood automatically.
- Server Actions integrate with the HTML `<form action={action}>` attribute.
- Keep Server Actions in separate, dedicated files, and import secrets securely.
