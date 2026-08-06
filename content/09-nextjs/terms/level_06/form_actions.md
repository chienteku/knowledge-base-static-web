# Form Actions

> **Level 6 — Server Actions & Mutations**
> The native HTML `<form action="...">` pattern supercharged by React 19 and Next.js, allowing forms to seamlessly invoke Server Actions without manual event handlers.

---

## 1. Prerequisites
- [Server Actions Overview (`"use server"`)](server_actions.md) — The functions that form actions execute.
- [`<form>`](../../../01-html/terms/level_05/form.md) — The standard Web API this builds upon.

---

## 2. Term Category

**Data Mutation & Actions** (HTML Form Action Handler): Form Actions integrate native HTML `<form action>` attributes directly with async Server Actions for progressive form enhancement.



---

## 3. Explanation

### Environment Context
- **Server Component or Client Component**

### (1) Design Motivation — "Why did we design this?"
In traditional React, form submission requires capturing the `onSubmit` event, calling `e.preventDefault()`, tracking the state of every input using `useState` or `useRef`, and manually building a JSON object to send to the server.
React 19 and Next.js embraced the native HTML Web Standard. Forms natively know how to gather their input data and send it. By passing a Server Action to the `action` prop, React intercepts the native submission and securely routes it to your server function.

### (2) The Syntax
Your Server Action will automatically receive a native Web `FormData` object containing the values of all inputs that have a `name` attribute.

```tsx
export default function CheckoutForm() {
  
  // The Server Action
  async function processOrder(formData: FormData) {
    "use server";
    
    // Extract data using native Web APIs
    const itemId = formData.get('itemId');
    const quantity = formData.get('quantity');
    
    await database.createOrder(itemId, Number(quantity));
  }

  return (
    // We pass the function to the `action` prop!
    <form action={processOrder}>
      {/* Inputs MUST have a name attribute! */}
      <input type="hidden" name="itemId" value="abc-123" />
      <input type="number" name="quantity" required />
      
      <button type="submit">Buy Now</button>
    </form>
  );
}
```

### (3) Progressive Enhancement
Because Form Actions are built on top of native HTML forms, they feature **Progressive Enhancement**. If the user's internet is slow and the React JavaScript bundle hasn't finished downloading yet, the form *still works*! The browser will fall back to a standard HTML form submission, and Next.js will intercept it on the server and process the Server Action anyway.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `name` attribute

**The mistake:** A developer writes `<input type="text" id="username" />` and wonders why `formData.get('username')` is returning null in their Server Action.

**Why it's wrong:** The native HTML `FormData` API explicitly relies on the `name` attribute of inputs to construct the key-value pairs. IDs and classes are completely ignored during form submission.
**Golden Rule:** Every input, select, and textarea inside a form MUST have a `name` attribute if you want to read its value in a Server Action.

---

### Mistake 2: Executing `event.preventDefault()` When Submitting Native Form Actions

**The mistake:** Adding `@submit.prevent` or `e.preventDefault()` to `<form action={serverAction}>`.

**Why it's wrong:** Next.js native form actions manage event submission automatically. Calling `preventDefault()` stops native progressive enhancement and breaks automatic form submission.

*Incorrect:*
```tsx
<form action={createPost} onSubmit={(e) => e.preventDefault()}> <!-- ❌ Prevents form action execution! -->
```

*Fix:*
```tsx
<form action={createPost}> <!-- Let native form action handle submission -->
```

---

### Mistake 3: Accessing Un-Parsed FormData Keys Without Type Casting

**The mistake:** Writing `const age = formData.get('age'); age + 5`.

**Why it's wrong:** `formData.get('key')` returns `FormDataEntryValue | null` (a string or File). Performing numeric arithmetic directly results in string concatenation (`'255'`). Cast types explicitly.

*Incorrect:*
```typescript
const age = formData.get('age');
console.log(age + 5); // ❌ Produces string concatenation '255'!
```

*Fix:*
```typescript
const age = Number(formData.get('age')); // Explicitly cast to number
console.log(age + 5); // 30
```


---

## 5. Practice Exercises

### Exercise 1: Native Form Enhancement with Server Actions

**Scenario:**
Create an HTML `<form action={handleSubmit}>` invoking an inline Server Action for progressive enhancement.

**Requirements:**
1. Pass Server Action directly to `<form action>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/subscribe/page.tsx
> export default function SubscribePage() {
>   async function handleSubmit(formData: FormData) {
>     "use server";
>     const email = formData.get("email");
>     console.log(`Subscribed: ${email}`);
>   }

  return (
    <form action={handleSubmit} className="p-4 space-y-4">
      <input name="email" type="email" placeholder="Enter email" required />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Subscribe
      </button>
    </form>
  );
}
```

> #### Technical Explanation
>
> 1. `<form action={handleSubmit}>` binds form submissions directly to server-side execution.
> 2. Works natively without client JavaScript enabled (progressive enhancement).
> 3. Automatically serializes form input data into a `FormData` object.

---

### Exercise 2: Programmatically Resetting Form Inputs Post-Submission

**Scenario:**
Reset form input fields after successful Server Action execution using `useRef()`.

**Requirements:**
1. Call `formRef.current?.reset()` in Client Component handler.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useRef } from "react";

export default function ClientForm({
  action
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset(); // Resets form fields after action resolves
  }

  return (
    <form ref={formRef} action={handleAction}>
      <input name="title" required />
      <button type="submit">Add Item</button>
    </form>
  );
}
```

> #### Technical Explanation
>
> 1. `formRef.current.reset()` clears input values after the async action completes.
> 2. Wrapping the action call in a client handler allows orchestrating client-side UI resets.
> 3. Standard interactive form submission pattern.

---

### Exercise 3: Binding Extra Arguments to Form Actions with `.bind()`

**Scenario:**
Pass additional static parameters (e.g. `itemId`) to a Server Action using `action.bind(null, itemId)`.

**Requirements:**
1. Bind extra argument to Server Action in `<form action>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/items/page.tsx
> import { updateItemAction } from "@/app/actions/items";

export default function ItemCard({ itemId }: { itemId: string }) {
  const updateWithId = updateItemAction.bind(null, itemId);

  return (
    <form action={updateWithId}>
      <input name="name" defaultValue="Updated Item" />
      <button type="submit">Update #{itemId}</button>
    </form>
  );
}
```

> #### Technical Explanation
>
> 1. `Function.prototype.bind()` prepends arguments to Server Actions without using hidden form input fields.
> 2. The server receives `itemId` as the first function argument and `formData` as the second.
> 3. Secure method for passing contextual IDs to form mutations.

---




---

## 6. Related Terms
- [Server Actions Overview (`"use server"`)](server_actions.md) — The target of the Form Action.
- [`useFormStatus` Hook](use_form_status.md) — How to show a loading spinner while the action is running.
- [Zod (Schema Validation)](zod_validation.md) — Zod schema validation.

---

## 7. Key Takeaways
- **Form Actions** allow you to pass a Server Action directly into the `<form action={...}>` prop.
- The Server Action automatically receives a native **`FormData`** object containing the form's data.
- Inputs must have a `name` attribute to be included in the `FormData`.
- Because it utilizes native HTML, the form works even before JavaScript has loaded (Progressive Enhancement).
