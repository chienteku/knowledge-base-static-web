# `useRouter` Hook

> **Level 3 — Navigation & Routing Fundamentals**
> A Next.js Client Hook that allows you to programmatically navigate between routes (e.g., redirecting after a form submission or a button click).

---

## 1. Prerequisites
- [`<Link>` Component](link.md) — The declarative alternative for navigation.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use any React Hook.

---

## 2. Term Category

**Routing & Layouts** (Client Navigation Router Hook): `useRouter()` provides programmatic client-side navigation methods (`push`, `replace`, `prefetch`, `back`) inside Client Components.



---

## 3. Explanation

### Environment Context
- **Client Component ONLY**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Programmatic Navigation with `useRouter()`

**Scenario:**
Perform programmatic navigation to `/dashboard` upon form submission using `useRouter().push()`.

**Requirements:**
1. Import `useRouter` from `next/navigation` inside `"use client"` component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Perform login API request...
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleLogin} className="p-4">
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Log In
      </button>
    </form>
  );
}
```

> #### Technical Explanation
>
> 1. `useRouter()` MUST be imported from `next/navigation` in App Router (NOT `next/router`).
> 2. `router.push('/dashboard')` performs client-side SPA navigation to the target route.
> 3. Must be used inside Client Components marked with `"use client"`.

---

### Exercise 2: Refreshing Server Component Data with `router.refresh()`

**Scenario:**
Trigger a server data re-fetch after mutating data on the client using `router.refresh()`.

**Requirements:**
1. Execute `router.refresh()` in event handler.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  function handleRefresh() {
    // Re-executes Server Component data fetches on the server
    router.refresh();
  }

  return (
    <button onClick={handleRefresh} className="px-3 py-1 bg-gray-200 rounded">
      Refresh Live Data
    </button>
  );
}
```

> #### Technical Explanation
>
> 1. `router.refresh()` requests updated Server Component flight data from the server without losing client React state.
> 2. Re-renders Server Components on the server and merges results into the active view.
> 3. Standard method for invalidating server-rendered UI from Client Components.

---

### Exercise 3: Pre-Fetching Routes Programmatically

**Scenario:**
Pre-fetch the heavy `/admin` route on button hover using `router.prefetch()`.

**Requirements:**
1. Call `router.prefetch("/admin")` inside `onMouseEnter` handler.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useRouter } from "next/navigation";

export default function HoverLink() {
  const router = useRouter();

  return (
    <button
      onMouseEnter={() => router.prefetch("/admin")}
      onClick={() => router.push("/admin")}
      className="px-4 py-2 bg-purple-600 text-white rounded"
    >
      Go to Admin Panel
    </button>
  );
}
```

> #### Technical Explanation
>
> 1. `router.prefetch(path)` pre-loads target route JavaScript and Server Component chunks in the background.
> 2. Speeds up subsequent `router.push()` navigation execution.
> 3. Programmatic optimization pattern for custom button navigation.

---




---

## 6. Related Terms
- [`<Link>` Component](link.md) — The preferred way to navigate when no programmatic logic is required.
- [`redirect()` & `permanentRedirect()`](../level_04/redirect.md) — The Server Component equivalent of `useRouter`.
- [`usePathname` & `useSearchParams`](../level_04/use_pathname.md) — Related concept: `usePathname` & `useSearchParams`.

---

## 7. Key Takeaways
- **`useRouter()`** allows you to navigate programmatically inside Client Components using `router.push()` or `router.replace()`.
- It MUST be imported from `next/navigation` when working in the App Router.
- It requires the `"use client"` directive.
- If you can use a `<Link>`, use a `<Link>`. Only use `useRouter` when navigation relies on an event or logic (like form submissions or timers).
