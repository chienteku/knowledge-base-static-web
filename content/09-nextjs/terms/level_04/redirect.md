# `redirect()` & `permanentRedirect()`

> **Level 4 — Advanced Routing**
> Server-side functions used to forcefully send a user to a different URL, often used after form mutations or when authentication checks fail.

---

## 1. Prerequisites
- [`useRouter` Hook](../level_03/use_router.md) — The client-side equivalent for navigation.
- [Server Actions Overview (`"use server"`)](../level_06/server_actions.md) — The most common place `redirect` is used.

---

## 2. Term Category

**Routing & Layouts** (Server-Side Route Redirection): `redirect()` issues immediate HTTP 307/308 redirects from Server Components, Server Actions, or Route Handlers.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
In a Server Component, you don't have access to the browser's `window.location` or the `useRouter()` hook. If a user tries to access `/dashboard` but your database says they aren't logged in, how do you kick them back to `/login`?
Next.js provides the **`redirect()`** function. It allows you to programmatically trigger an HTTP Redirect response directly from the Server.

### (2) The `redirect()` Function
It is imported from `next/navigation`. When you call it, it throws a special error under the hood that halts component execution and tells the Next.js server to issue an HTTP 307 (Temporary Redirect).

```tsx
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    // Execution stops here. The browser is instantly told to go to /login.
    redirect('/login'); 
  }

  return <h1>Secure Dashboard</h1>;
}
```

### (3) The `permanentRedirect()` Function
Next.js also provides `permanentRedirect()`. Instead of an HTTP 307, this issues an HTTP 308 (Permanent Redirect).
You use this when a URL has permanently moved (e.g., you renamed a user's profile URL). Search engines like Google will see the 308 and update their search indexes to point to the new URL.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `redirect()` inside a `try/catch` block

**The mistake:** A developer writes a Server Action like this:
```tsx
try {
  await db.user.create(...);
  redirect('/success'); // ❌ BAD!
} catch (error) {
  return { error: "Failed" };
}
```

**Why it's wrong:** Under the hood, the `redirect()` function works by physically throwing a JavaScript Error (named `NEXT_REDIRECT`). If you put it inside a `try` block, your own `catch` block will catch the redirect error and swallow it! The redirect will fail, and the user will stay on the page.
**Golden Rule:** Always place `redirect()` **outside** of your `try/catch` blocks.

```tsx
// ✅ Correct
try {
  await db.user.create(...);
} catch (error) {
  return { error: "Failed" };
}
redirect('/success'); // Executes after the try/catch successfully completes!
```

---

### Mistake 2: Wrapping `redirect()` inside a `try / catch` Block Without Re-Throwing

**The mistake:** Writing `try { redirect('/login'); } catch (e) { console.log(e); }`.

**Why it's wrong:** `redirect()` works by throwing a special internal Next.js `NEXT_REDIRECT` exception. Catching and swallowing this exception stops the redirect from executing.

*Incorrect:*
```typescript
try {
  redirect('/login'); // ❌ Exception swallowed by catch block!
} catch (err) {
  console.log(err);
}
```

*Fix:*
```typescript
try {
  await doSomething();
} catch (err) {
  // Handle error
}
redirect('/login'); // Call redirect OUTSIDE try/catch block
```

---

### Mistake 3: Importing `redirect` from `next/router` Instead of `next/navigation`

**The mistake:** Importing `import { redirect } from 'next/router'`.

**Why it's wrong:** In App Router (`app/`), `redirect` MUST be imported from `next/navigation`. Importing from `next/router` throws a module export error.

*Incorrect:*
```typescript
import { redirect } from 'next/router'; // ❌ Deprecated Pages Router import!
```

*Fix:*
```typescript
import { redirect } from 'next/navigation'; // Correct App Router import
```


---

## 5. Practice Exercises

### Exercise 1: Redirecting Unauthorized Users from Server Components

**Scenario:**
Redirect unauthenticated users to `/login` from a protected Server Component using `redirect()`.

**Requirements:**
1. Import `redirect` from `next/navigation`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/page.tsx
> import { redirect } from "next/navigation";
> import { getSession } from "@/lib/auth";
> 
> export default async function DashboardPage() {
>   const session = await getSession();
> 
>   if (!session) {
>     redirect("/login?reason=unauthorized");
>   }
> 
>   return <h1>Welcome to Dashboard</h1>;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `redirect()` throws a specialized internal Next.js exception that immediately halts component rendering.
> 2. Issues an HTTP 307 temporary redirect response header to the browser.
> 3. Works seamlessly inside async Server Components, Server Actions, and Route Handlers.
> 
---

### Exercise 2: Server Action Redirects After Mutation

**Scenario:**
Redirect users to `/posts` after creating a new post inside a Server Action.

**Requirements:**
1. Call `redirect('/posts')` after database mutation in Server Action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/actions/post.ts
> "use server";
> 
> import { redirect } from "next/navigation";
> import { revalidatePath } from "next/cache";
> 
> export async function createPost(formData: FormData) {
>   const title = formData.get("title");
>   // Save post to database...
> 
>   revalidatePath("/posts");
>   redirect("/posts");
> }
> ```
> 
> #### Technical Explanation
>
> 1. In Server Actions, `redirect()` MUST be called OUTSIDE `try/catch` blocks (or re-thrown if caught).
> 2. Tells the client router to navigate to the new path after revalidating cache data.
> 3. Standard post-mutation workflow.
> 
---

### Exercise 3: Permanent vs Temporary Redirects in `next.config.js`

**Scenario:**
Configure permanent 301 redirects for legacy URLs in `next.config.js`.

**Requirements:**
1. Set `permanent: true` in `redirects()` array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // next.config.js
> module.exports = {
>   async redirects() {
>     return [
>       {
>         source: "/old-pricing",
>         destination: "/pricing",
>         permanent: true // HTTP 301 Permanent Redirect
>       }
>     ];
>   }
> };
> ```
> 
> #### Technical Explanation
>
> 1. `permanent: true` emits HTTP 301 status headers, instructing search crawlers and browsers to cache the redirect permanently.
> 2. `permanent: false` emits HTTP 307 status headers for temporary redirects.
> 3. Preserves SEO page rank equity for migrated page URLs.
> 
---


## 6. Related Terms
- [`useRouter` Hook](../level_03/use_router.md) — Used for redirecting in Client Components.
- [`not-found.tsx` & `notFound()`](not_found.md) — The sister function used for 404s instead of 307s.
- [On-Demand Revalidation (`revalidatePath`, `revalidateTag`)](../level_06/on_demand_revalidation.md) — Related concept: On-Demand Revalidation (`revalidatePath`, `revalidateTag`).

---

## 7. Key Takeaways
- **`redirect('/path')`** is a server-side function that instantly redirects a user to a different URL (HTTP 307).
- **`permanentRedirect('/path')`** tells browsers and search engines the page has moved forever (HTTP 308).
- They work by throwing a special internal error.
- Because they throw an error, you must NEVER place `redirect()` inside a `try/catch` block, or the redirect will be swallowed and fail.
