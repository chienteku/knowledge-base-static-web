# `useFormState` Hook

> **Level 6 — Server Actions & Mutations**
> A React Hook used to manage the return state of a Server Action, allowing you to display validation errors or success messages from the server on the client.

---

## 1. Prerequisites
- [Form Actions](../level_06/form_actions.md) — The mechanism being enhanced.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use this hook.
- [Zod (Schema Validation)](../level_06/zod_validation.md) — How the error data structure is validated.

---

## 2. Term Category
- **Form State Hook**

---

## 3. Environment Context
- **Client Component ONLY**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you use a basic Form Action `<form action={myAction}>`, the action runs on the server, but what if it fails? What if the user typed an invalid email address? 
The Server Action needs a way to send an error message (like `"Invalid email format"`) back down to the UI so the React component can display it. 
**`useFormState`** is the bridge. It connects the Client Component to the Server Action's return value.

### (2) The Syntax
`useFormState` takes two arguments: the Server Action function, and an `initialState`. It returns the current state and an upgraded `dispatch` version of your action to attach to the form.

```tsx
"use client";
import { useFormState } from 'react-dom'; // Note: Imported from react-dom!
import { createAccountAction } from './actions';

// The initial state object
const initialState = { message: null };

export default function SignupForm() {
  // state will update automatically when the action finishes!
  const [state, formAction] = useFormState(createAccountAction, initialState);

  return (
    <form action={formAction}>
      <input type="email" name="email" />
      <button type="submit">Sign Up</button>
      
      {/* Display the error message returned from the server! */}
      {state?.message && <p className="text-red-500">{state.message}</p>}
    </form>
  );
}
```

### (3) Modifying the Server Action
When you use `useFormState`, the signature of your Server Action changes. It now receives the `prevState` as its FIRST argument, and the `FormData` as its SECOND argument.

```tsx
// actions.ts
"use server";

// Notice the new first argument!
export async function createAccountAction(prevState: any, formData: FormData) {
  const email = formData.get('email');
  
  if (!email.includes('@')) {
    // This return object instantly becomes the new `state` in the UI!
    return { message: "Invalid email format" }; 
  }

  await saveUser(email);
  return { message: "Account created successfully!" };
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `prevState` parameter

**The mistake:** A developer converts a standard Server Action to use `useFormState`, but leaves the function signature as `async function myAction(formData: FormData)`.

**Why it's wrong:** `useFormState` injects the previous state as the first argument. If you don't update your function signature, your `formData` variable is actually holding the `prevState` object! When you try to call `formData.get()`, your app will crash.
**Golden Rule:** Whenever a Server Action is plugged into `useFormState`, its signature MUST be `(prevState, formData)`.

---

### Mistake 2: Mismatching Action Function Signature in `useActionState` (Formerly `useFormState`)

**The mistake:** Defining action `async function action(formData: FormData)` instead of `async function action(prevState: any, formData: FormData)`.

**Why it's wrong:** Actions passed to `useActionState` / `useFormState` MUST receive `(prevState, formData)` as parameters. Reversing or omitting `prevState` corrupts input arguments.

*Incorrect:*
```typescript
// Mismatched action signature for useActionState
async function myAction(formData: FormData) { ... } // ❌ Missing prevState parameter!
```

*Fix:*
```typescript
// Correct signature for useActionState / useFormState:
async function myAction(prevState: any, formData: FormData) {
  return { message: 'Updated' };
}
```

---

### Mistake 3: Omitting `'use client'` from Components Using `useActionState` / `useFormState`

**The mistake:** Calling `useActionState` in a Server Component.

**Why it's wrong:** `useActionState` / `useFormState` is a React client hook. It cannot execute inside Server Components. Add `'use client'` to top of file.

*Incorrect:*
```typescript
// Server Component
import { useActionState } from 'react';
const [state, formAction] = useActionState(action, null); // ❌ Server Component error!
```

*Fix:*
```typescript
'use client';
import { useActionState } from 'react';
const [state, formAction] = useActionState(action, null);
```


---

## 6. Practice Exercises

### Exercise 1: Zod Validation

**Problem:** Why is `useFormState` particularly powerful when combined with a schema validation library like Zod?

**Expected output:**
```text
Because Zod returns structured error objects (e.g., specifying that the 'password' field specifically failed the 'minimum length' test). 
You can return that exact Zod error object from the Server Action, and `useFormState` will instantly make it available on the client, allowing you to easily highlight the exact input field that failed validation in red!
```

> [!check]- Answer
> - Think about returning complex objects instead of just string messages.

---

### Exercise 2: useActionState Form Validation Pattern

**Problem:** Write Client Component form using React 19 `useActionState` displaying error message returned from `formAction`.

**Expected output:**
```tsx
'use client'; import { useActionState } from 'react'; import { signupAction } from './actions'; export function SignupForm() { const [state, formAction, isPending] = useActionState(signupAction, null); return ( <form action={formAction}> <input name="email" /> {state?.error && <p>{state.error}</p>} <button disabled={isPending}>Sign Up</button> </form> ); }
```

> [!check]- Answer
> - `useActionState` binds server action responses to client form state.
> 
> ```tsx
> 'use client';
> import { useActionState } from 'react';
> import { signupAction } from './actions';
> 
> export function SignupForm() {
>   const [state, formAction, isPending] = useActionState(signupAction, null);
>   
>   return (
>     <form action={formAction}>
>       <input name="email" type="email" required />
>       {state?.error && <p className="text-red-500">{state.error}</p>}
>       <button type="submit" disabled={isPending}>
>         {isPending ? 'Signing up...' : 'Sign Up'}
>       </button>
>     </form>
>   );
> }
> ```

---

### Exercise 3: useFormState React Rename Notice

**Problem:** What is the new standard React 19 hook name that replaces `useFormState` from `react-dom`?

**Expected output:**
```text
useActionState (imported from 'react')
```

> [!check]- Answer
> - React 19 renamed `useFormState` to `useActionState` in `react` package.
> 
> ```typescript
> import { useActionState } from 'react';
> ```


---

## 7. Related Terms
- [Server Actions (`"use server"`)](../level_06/server_actions.md) — The function providing the state.
- [`useFormStatus`](../level_06/use_form_status.md) — The sister hook used for loading indicators.

---

## 8. Key Takeaways
- **`useFormState`** is a React DOM hook used to capture the return value of a Server Action and display it in the UI.
- It is essential for handling validation errors and success messages from form submissions.
- It requires you to update your Server Action signature to accept `prevState` as the first argument.
- It must be used inside a Client Component (`"use client"`).
