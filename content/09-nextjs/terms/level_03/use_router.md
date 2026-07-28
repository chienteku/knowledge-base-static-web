# `useRouter` Hook

> **Level 3 — Navigation & Routing Fundamentals**
> A Next.js Client Hook that allows you to programmatically navigate between routes (e.g., redirecting after a form submission or a button click).

---

## 1. Prerequisites
- [`<Link>` Component](../level_03/link.md) — The declarative alternative for navigation.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use any React Hook.

---

## 2. Term Category
- **Routing / Navigation Hook**

---

## 3. Environment Context
- **Client Component ONLY**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The `<Link>` component is perfect when you have a piece of text or a button that the user *clicks* to go somewhere. 
But what if the navigation needs to happen automatically after some logic? For example, a user submits a Login form. If the login is successful, you want to redirect them to the `/dashboard`. You can't ask the user to click a `<Link>` after they submit the form. You need to trigger the navigation *programmatically* via code. 
**`useRouter`** provides the `.push()` method to do exactly this.

### (2) The Syntax
**Important:** In the App Router, you must import `useRouter` from `next/navigation`, NOT `next/router` (which is the legacy Pages router version!).

```tsx
"use client"; // Must be a Client Component!

import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await loginUser();
    
    if (success) {
      // Programmatically navigate the user to the dashboard
      router.push('/dashboard');
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### (3) `router.push()` vs `router.replace()`
- `router.push('/about')`: Adds a new entry to the browser's history stack. If the user clicks the browser's "Back" button, they go back to the previous page.
- `router.replace('/about')`: Replaces the current history entry. If the user clicks "Back", they bypass the previous page entirely. (Useful for redirecting away from a "You must log in" error screen so they don't get stuck in a loop).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Importing from `next/router`

**The mistake:** A developer migrating from Next.js 12 writes:
```tsx
import { useRouter } from 'next/router'; // ❌ ERROR in App Router!
```

**Why it's wrong:** The `next/router` module belongs to the legacy Pages Router. It expects the old routing architecture and will throw a "NextRouter was not mounted" error if used inside the `app/` directory.
**Golden Rule:** In Next.js 13+, always import routing hooks from **`next/navigation`**.

---

### Mistake 2: Importing `useRouter` from `next/router` in App Router Client Components

**The mistake:** Writing `import { useRouter } from 'next/router'` inside an `app/` directory Client Component.

**Why it's wrong:** In App Router (`app/`), `next/router` is deprecated and throws a runtime error: `NextRouter was not mounted`. Import `useRouter` from `next/navigation`.

*Incorrect:*
```typescript
import { useRouter } from 'next/router'; // ❌ Throws runtime error in App Router!
```

*Fix:*
```typescript
import { useRouter } from 'next/navigation'; // Correct App Router import
```

---

### Mistake 3: Calling `useRouter()` inside a React Server Component (RSC)

**The mistake:** Calling `const router = useRouter()` in a component without `'use client'`.

**Why it's wrong:** `useRouter()` is a client-side navigation hook. Server Components execute on the server and do not support client hooks. Use `'use client'` or `redirect()`.

*Incorrect:*
```typescript
// Server Component (default)
import { useRouter } from 'next/navigation';
export default function Page() {
  const router = useRouter(); // ❌ Hooks only work in Client Components!
}
```

*Fix:*
```typescript
// Use redirect() in Server Components:
import { redirect } from 'next/navigation';
export default async function Page() {
  if (!isAuth) redirect('/login');
}
```


---

## 6. Practice Exercises

### Exercise 1: Server-Side Redirection

**Problem:** You are inside a Server Component (`page.tsx`), not a Client Component. You check the database, realize the user is not logged in, and want to redirect them. You cannot use `useRouter()` because hooks don't work on the server. What do you do?

**Expected output:**
> [!check]- Answer
> ```tsx
> // You use the `redirect()` function provided by Next.js!
> import { redirect } from 'next/navigation';
> 
> export default async function Dashboard() {
>   const user = await getUser();
>   if (!user) {
>     redirect('/login'); // This throws a special error that Next.js catches and turns into a 307 redirect HTTP response!
>   }
>   return <div>Welcome!</div>;
> }
> ```
> - There is a specific server-side function for this, covered in Level 4!

---

### Exercise 2: useRouter Navigation Methods Matrix

**Problem:** Match `useRouter()` method to action:
1. `router.push('/dashboard')` 
2. `router.replace('/login')` 
3. `router.refresh()` 
4. `router.back()` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Navigates to target route adding new entry to browser history
> 2. Navigates to target route replacing current entry in browser history
> 3. Refreshes current route data by re-fetching Server Components from server
> 4. Navigates back 1 step in browser history stack
> ```
> - `push()` -> Add history entry
> - `replace()` -> Overwrite history entry
> - `refresh()` -> Re-fetch server component data
> - `back()` -> Step back in history
> 
> ```typescript
> const router = useRouter();
> router.push('/dashboard');
> ```

---

### Exercise 3: router.refresh Data Preserving Feature

**Problem:** What advantage does `router.refresh()` offer over `window.location.reload()`?

**Expected output:**
> [!check]- Answer
> ```text
> router.refresh() re-fetches Server Component data from the server while preserving client React state (e.g. form inputs, scroll position).
> ```
> - `router.refresh()` updates server data without wiping client React state.
> 
> ```typescript
> router.refresh(); // Soft server data re-fetch
> ```


---

## 7. Related Terms
- [`<Link>` Component](../level_03/link.md) — The preferred way to navigate when no programmatic logic is required.
- [`redirect()`](../level_04/redirect.md) — The Server Component equivalent of `useRouter`.

---

## 8. Key Takeaways
- **`useRouter()`** allows you to navigate programmatically inside Client Components using `router.push()` or `router.replace()`.
- It MUST be imported from `next/navigation` when working in the App Router.
- It requires the `"use client"` directive.
- If you can use a `<Link>`, use a `<Link>`. Only use `useRouter` when navigation relies on an event or logic (like form submissions or timers).
