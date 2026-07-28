# `redirect()` & `permanentRedirect()`

> **Level 4 — Advanced Routing**
> Server-side functions used to forcefully send a user to a different URL, often used after form mutations or when authentication checks fail.

---

## 1. Prerequisites
- [`useRouter` Hook](../level_03/use_router.md) — The client-side equivalent for navigation.
- [Server Actions](../level_06/server_actions.md) — The most common place `redirect` is used.

---

## 2. Term Category
- **Routing / Server Logic**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: External Redirects

**Problem:** You are building a URL shortener app. You have a route `app/[shortCode]/page.tsx`. If the user visits `/g`, you look up the code and find the URL is `https://google.com`. Can you use `redirect()` to send them to an external website?

**Expected output:**
> [!check]- Answer
> ```text
> Yes!
> `redirect()` accepts absolute URLs. 
> You simply call: `redirect('https://google.com')` and Next.js will instantly bounce the user to Google.
> ```
> - Does a redirect require a relative path?

---

### Exercise 2: Server Component Auth Redirect Pattern

**Problem:** Write Server Component `app/dashboard/page.tsx` checking `session` and executing `redirect('/login')` if unauthenticated.

**Expected output:**
> [!check]- Answer
> ```tsx
> import { redirect } from 'next/navigation'; export default async function Page() { const session = await getSession(); if (!session) redirect('/login'); return <h1>Dashboard</h1>; }
> ```
> - `redirect()` executes immediate server-side HTTP 307/308 redirects.
> 
> ```tsx
> import { redirect } from 'next/navigation';
> 
> export default async function Page() {
>   const session = await getSession();
>   if (!session) {
>     redirect('/login');
>   }
>   
>   return <h1>Welcome to Dashboard</h1>;
> }
> ```

---

### Exercise 3: Redirect Type Shorthands

**Problem:** What default HTTP status code is used by Next.js `redirect()` for temporary redirects?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP 307 Temporary Redirect (Use RedirectType.replace for 308 permanent redirects)
> ```
> - `redirect(url)` defaults to HTTP 307 Temporary Redirect.
> 
> ```typescript
> redirect('/login', RedirectType.replace); // Permanent redirect
> ```


---

## 7. Related Terms
- [`useRouter` Hook](../level_03/use_router.md) — Used for redirecting in Client Components.
- [`notFound()`](../level_04/not_found.md) — The sister function used for 404s instead of 307s.

---

## 8. Key Takeaways
- **`redirect('/path')`** is a server-side function that instantly redirects a user to a different URL (HTTP 307).
- **`permanentRedirect('/path')`** tells browsers and search engines the page has moved forever (HTTP 308).
- They work by throwing a special internal error.
- Because they throw an error, you must NEVER place `redirect()` inside a `try/catch` block, or the redirect will be swallowed and fail.
