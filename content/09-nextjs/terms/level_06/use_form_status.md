# `useFormStatus` Hook

> **Level 6 — Server Actions & Mutations**
> A React Hook that provides status information (like `pending`) about the parent `<form>` element, making it effortless to build loading spinners and disable submit buttons.

---

## 1. Prerequisites
- [Form Actions](../level_06/form_actions.md) — The action whose status we are tracking.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use this hook.

---

## 2. Term Category
- **Form State Hook**

---

## 3. Environment Context
- **Client Component ONLY**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a user clicks "Submit", the Server Action might take 2 seconds to run. You absolutely must disable the Submit button so they don't click it 5 times, and you should show a loading spinner.
Historically, you had to manage a `const [isLoading, setIsLoading] = useState(false)` state manually.
**`useFormStatus`** automatically taps into the native `<form>` context and tells you exactly when the form is pending submission, completely eliminating the need for manual `useState` loading trackers.

### (2) The Syntax
`useFormStatus` returns an object containing a `pending` boolean. 
**CRITICAL REQUIREMENT:** The hook MUST be called inside a component that is rendered *inside* the `<form>` tag. It cannot be called in the same component that renders the `<form>`.

```tsx
"use client";
import { useFormStatus } from 'react-dom';

// 1. We create a dedicated Submit Button component
function SubmitButton() {
  // 2. We use the hook. It reads the status of the parent <form>!
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  );
}

// 3. The Main Form Component
export default function SettingsForm() {
  return (
    <form action={myServerAction}>
      <input name="username" />
      {/* 4. We render the button INSIDE the form */}
      <SubmitButton /> 
    </form>
  );
}
```

### (3) What else does it return?
Besides `pending`, it also returns:
- `data`: The `FormData` currently being submitted.
- `method`: The HTTP method (usually 'post').
- `action`: A reference to the action function itself.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Calling it in the same component as the form

**The mistake:** 
```tsx
export default function Form() {
  const { pending } = useFormStatus(); // ❌ Will always be false!
  return <form action={myAction}><button disabled={pending}>Submit</button></form>
}
```

**Why it's wrong:** `useFormStatus` works by reading the React Context provided by the `<form>` element. If you call the hook in the component that *renders* the form, you are calling it *above* the Context Provider. It cannot see the form!
**Golden Rule:** You MUST extract your button into its own separate Component, and call `useFormStatus` inside that child component.

---

### Mistake 2: Calling `useFormStatus()` in the Same Component That Contains the `<form>` Tag

**The mistake:** Calling `const { pending } = useFormStatus()` inside the parent component rendering `<form><button>Submit</button></form>`.

**Why it's wrong:** `useFormStatus()` reads form status ONLY for a parent `<form>` ancestor. Calling it in the component that DECLARES the `<form>` tag returns `pending = false` always. Move the button to a child component.

*Incorrect:*
```typescript
export function Form() {
  const { pending } = useFormStatus(); // ❌ Returns pending=false because hook is NOT inside form children!
  return <form action={act}><button disabled={pending}>Submit</button></form>;
}
```

*Fix:*
```typescript
// Move SubmitButton to a child component inside the <form>:
function SubmitButton() {
  const { pending } = useFormStatus(); // Correctly reads parent form status
  return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}
```

---

### Mistake 3: Importing `useFormStatus` from `react` Instead of `react-dom`

**The mistake:** Writing `import { useFormStatus } from 'react'` in React 18 / Next.js 14.

**Why it's wrong:** In React 18 / Next.js 14, `useFormStatus` is exported from `react-dom`, NOT `react`.

*Incorrect:*
```typescript
import { useFormStatus } from 'react'; // ❌ Incorrect module import in React 18!
```

*Fix:*
```typescript
import { useFormStatus } from 'react-dom'; // Correct import module
```


---

## 6. Practice Exercises

### Exercise 1: Disabling Inputs

**Problem:** You disable the Submit button while `pending` is true. Should you also disable the text `<input>` fields?

**Expected output:**
```text
Yes, absolutely!
If a user submits a form, and the Server Action takes 3 seconds, the user could rapidly type new text into the input field during those 3 seconds. The data sent to the server would be the old data, but the UI would show the new data.
Always pass `disabled={pending}` to your `<input>` and `<select>` elements using `useFormStatus` as well.
```

> [!check]- Answer
> - Think about what happens if a user keeps typing during a slow network request.

---

### Exercise 2: SubmitButton Component Pattern

**Problem:** Write child `SubmitButton` Client Component using `useFormStatus()` disabling button and displaying `'Loading...'` while pending.

**Expected output:**
```tsx
'use client'; import { useFormStatus } from 'react-dom'; export function SubmitButton() { const { pending } = useFormStatus(); return <button type="submit" disabled={pending}>{pending ? 'Loading...' : 'Submit'}</button>; }
```

> [!check]- Answer
> - `useFormStatus()` exposes `pending`, `data`, `method`, and `action` of parent form.
> 
> ```tsx
> 'use client';
> import { useFormStatus } from 'react-dom';
> 
> export function SubmitButton() {
>   const { pending } = useFormStatus();
>   
>   return (
>     <button type="submit" disabled={pending} className="btn">
>       {pending ? 'Submitting...' : 'Submit'}
>     </button>
>   );
> }
> ```

---

### Exercise 3: useFormStatus Return Properties

**Problem:** List 3 properties returned by the `useFormStatus()` hook object.

**Expected output:**
```text
1. pending (boolean)
2. data (FormData submitted)
3. method (HTTP method string)
```

> [!check]- Answer
> - `pending` -> Form submission active boolean
> - `data` -> Submitted FormData object
> - `method` -> HTTP verb ('get' or 'post')
> 
> ```typescript
> const { pending, data, method, action } = useFormStatus();
> ```


---

## 7. Related Terms
- [`useFormState`](../level_06/use_form_state.md) — The hook for tracking the *result* of the form, while this tracks the *status* of the form.
- [Form Actions](../level_06/form_actions.md) — The trigger for the pending state.

---

## 8. Key Takeaways
- **`useFormStatus`** is a React DOM hook that tells you if the parent form is currently `pending` (submitting).
- It is primarily used to disable submit buttons and show loading spinners.
- It completely eliminates the need for `isLoading` state variables.
- It MUST be called inside a child component that is rendered *inside* the `<form>` tags.
