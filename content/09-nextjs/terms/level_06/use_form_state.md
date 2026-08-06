# `useFormState` Hook

> **Level 6 — Server Actions & Mutations**
> A React Hook used to manage the return state of a Server Action, allowing you to display validation errors or success messages from the server on the client.

---

## 1. Prerequisites
- [Form Actions](form_actions.md) — The mechanism being enhanced.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use this hook.
- [Zod (Schema Validation)](zod_validation.md) — How the error data structure is validated.

---

## 2. Term Category

**Data Mutation & Actions** (Form Action State Hook): `useActionState` (formerly `useFormState`) manages form action return state, validation errors, and pending flags in React Client Components.



---

## 3. Explanation

### Environment Context
- **Client Component ONLY**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Managing Form Action State with `useActionState`

**Scenario:**
Use React `useActionState` to track form return messages and validation errors in a Client Component.

**Requirements:**
1. Import `useActionState` from `react`.
2. Pass action function and initial state.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { useActionState } from "react";
> import { submitFormAction } from "@/app/actions/form";
> 
> const initialState = { success: false, message: "" };
> 
> export default function StateForm() {
>   const [state, formAction, isPending] = useActionState(submitFormAction, initialState);
> 
>   return (
>     <form action={formAction} className="p-4 space-y-4">
>       <input name="username" required />
>       <button type="submit" disabled={isPending}>
>         {isPending ? "Submitting..." : "Register"}
>       </button>
> 
>       {state.message && (
>         <p className={state.success ? "text-green-600" : "text-red-600"}>
>           {state.message}
>         </p>
>       )}
>     </form>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `useActionState(action, initialState)` manages state returned by Server Actions across form submissions.
> 2. `formAction` is passed directly to `<form action={formAction}>`.
> 3. `isPending` indicates whether the async Server Action is currently executing on the server.
> 
---

### Exercise 2: Signature Requirements for Server Actions used in `useActionState`

**Scenario:**
Format a Server Action function signature to match `useActionState` expectations `(prevState, formData) => newState`.

**Requirements:**
1. Accept `prevState` as the first argument in Server Action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/actions/form.ts
> "use server";
> 
> export async function submitFormAction(
>   prevState: { success: boolean; message: string },
>   formData: FormData
> ) {
>   const username = formData.get("username") as string;
>   if (username.length < 3) {
>     return { success: false, message: "Username must be at least 3 characters." };
>   }
> 
>   return { success: true, message: `User ${username} registered successfully!` };
> }
> ```
> 
> #### Technical Explanation
>
> 1. Server Actions consumed via `useActionState` MUST accept `prevState` as their first parameter.
> 2. `formData` is passed as the second parameter.
> 3. Mandatory function signature alignment.
> 
---

### Exercise 3: Preserving Previous Form Input Values on Validation Failure

**Scenario:**
Return entered form field values in `state` to repopulate input fields when validation fails.

**Requirements:**
1. Include `inputs` object in action return state.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";
> 
> export async function validateForm(prevState: any, formData: FormData) {
>   const email = formData.get("email") as string;
>   const bio = formData.get("bio") as string;
> 
>   if (!email.includes("@")) {
>     return {
>       error: "Invalid email address",
>       fields: { email, bio }
>     };
>   }
> 
>   return { success: true };
> }
> ```
> 
> #### Technical Explanation
>
> 1. Returning submitted field values (`fields: { email, bio }`) inside error states prevents clearing user input.
> 2. Client Component populates `defaultValue={state.fields?.email}` from returned state.
> 3. Essential user experience pattern for form validation.
> 
---


## 6. Related Terms
- [Server Actions Overview (`"use server"`)](server_actions.md) — The function providing the state.
- [`useFormStatus` Hook](use_form_status.md) — The sister hook used for loading indicators.
- [Zod (Schema Validation)](zod_validation.md) — Related concept: Zod (Schema Validation).

---

## 7. Key Takeaways
- **`useFormState`** is a React DOM hook used to capture the return value of a Server Action and display it in the UI.
- It is essential for handling validation errors and success messages from form submissions.
- It requires you to update your Server Action signature to accept `prevState` as the first argument.
- It must be used inside a Client Component (`"use client"`).
