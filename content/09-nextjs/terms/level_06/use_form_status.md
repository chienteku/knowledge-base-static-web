# `useFormStatus` Hook

> **Level 6 — Server Actions & Mutations**
> A React Hook that provides status information (like `pending`) about the parent `<form>` element, making it effortless to build loading spinners and disable submit buttons.

---

## 1. Prerequisites
- [Form Actions](form_actions.md) — The action whose status we are tracking.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use this hook.

---

## 2. Term Category

**Data Mutation & Actions** (Form Pending Status Hook): `useFormStatus()` exposes parent `<form>` submission pending status to child input or button components without prop drilling.



---

## 3. Explanation

### Environment Context
- **Client Component ONLY**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Accessing Form Pending Status in Child Submit Buttons

**Scenario:**
Create a reusable `<SubmitButton />` component that disables itself and renders a loading spinner when parent form is pending.

**Requirements:**
1. Import `useFormStatus` from `react-dom` inside a child component of `<form>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { useFormStatus } from "react-dom";
> 
> export default function SubmitButton() {
>   const { pending } = useFormStatus();
> 
>   return (
>     <button
>       type="submit"
>       disabled={pending}
>       className={`px-4 py-2 text-white rounded ${
>         pending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
>       }`}
    >
>       {pending ? "Saving Changes..." : "Save Changes"}
>     </button>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `useFormStatus()` hook reads the pending submission status of the parent `<form>`.
> 2. Must be called inside a component rendered AS A CHILD of the `<form>` element.
> 3. Eliminates passing `isPending` state down via props.
> 
---

### Exercise 2: Accessing Form Submission Data via `useFormStatus()`

**Scenario:**
Read `data` (FormData instance) from `useFormStatus()` to display optimism previews during submission.

**Requirements:**
1. Extract `data` from `useFormStatus()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { useFormStatus } from "react-dom";
> 
> export default function FormStatusIndicator() {
>   const { pending, data } = useFormStatus();
> 
>   if (!pending) return null;
> 
>   const title = data?.get("title") as string;
> 
>   return (
>     <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
>       Submitting post: "{title}"...
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `useFormStatus().data` contains the `FormData` object currently being transmitted to the server.
> 2. Allows child components to inspect field values during submission.
> 3. Enables clean submission progress feedback UI.
> 
---

### Exercise 3: Auditing `useFormStatus()` Context Bounds

**Scenario:**
Explain why calling `useFormStatus()` in the SAME component that renders the `<form>` tag returns `pending: false`.

**Requirements:**
1. Detail React Context parent-child boundary requirement.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // ❌ INCORRECT (Hook is in the SAME component as <form>):
> // export default function Form() {
> //   const { pending } = useFormStatus(); // Returns false always!
> //   return <form><button disabled={pending}>Submit</button></form>;
> // }
> 
> // ✅ CORRECT (Hook is inside a CHILD component):
> // export default function Form() {
> //   return <form><SubmitButton /></form>;
> // }
> ```
> 
> #### Technical Explanation
>
> 1. `useFormStatus()` acts as a React Context consumer expecting `<form>` to act as its Context Provider.
> 2. A component cannot consume Context provided by an element rendered in its own return statement.
> 3. Must extract submit buttons or indicators into separate child components.
> 
---


## 6. Related Terms
- [`useFormState` Hook](use_form_state.md) — The hook for tracking the *result* of the form, while this tracks the *status* of the form.
- [Form Actions](form_actions.md) — The trigger for the pending state.
- [Server Actions Overview (`"use server"`)](server_actions.md) — Related concept: Server Actions Overview (`"use server"`).

---

## 7. Key Takeaways
- **`useFormStatus`** is a React DOM hook that tells you if the parent form is currently `pending` (submitting).
- It is primarily used to disable submit buttons and show loading spinners.
- It completely eliminates the need for `isLoading` state variables.
- It MUST be called inside a child component that is rendered *inside* the `<form>` tags.
