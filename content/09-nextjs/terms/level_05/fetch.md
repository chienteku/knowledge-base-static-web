# Server-side Fetching (Extended `fetch`)

> **Level 5 — Data Fetching**
> The primary way to get data in Next.js. It extends the native Web `fetch()` API to include advanced caching and revalidation features directly within Server Components.

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — Where you execute the fetch.
- [JavaScript Fetch API](../level_05/js_fetch.md) — The foundation of this extended API.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server Only (for the extended Next.js features)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard React (CSR), you use `useEffect` and `fetch()` to grab data from an API *after* the component loads on the screen. This is slow and causes loading spinners.
In the legacy Next.js Pages router, you had to use a special, proprietary function called `getServerSideProps` to fetch data on the server.
In the App Router, Next.js decided to stick to web standards. They took the native Web `fetch()` API and "patched" it on the server. Now, you can just call `fetch()` directly inside your React component, and Next.js will intercept it to provide powerful caching mechanisms.

### (2) The Syntax
You make your Server Component `async`, and simply `await fetch()`.

```tsx
// app/users/page.tsx
export default async function UsersList() {
  // 1. Fetch the data directly in the component!
  // This runs on the server.
  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  
  if (!res.ok) {
    throw new Error('Failed to fetch data'); // This will trigger error.tsx!
  }

  const users = await res.json();

  // 2. Render the HTML
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### (3) Request Memoization
What if you need the `user` data in the `layout.tsx`, the `page.tsx`, and a deeply nested `header.tsx` Server Component? You might think you have to fetch it once in the layout and pass it down via props.
**You don't.** Next.js extends `fetch` with **Request Memoization**. If you call `fetch('https://api.com/user/1')` three times in three different components during the same render pass, Next.js only makes the network request *once*. The second and third calls instantly return the memoized result from memory.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `fetch` with relative URLs on the Server

**The mistake:** A developer writes `fetch('/api/users')` inside a Server Component.

**Why it's wrong:** The server doesn't have a "browser domain". It doesn't know what `http://localhost:3000` or `https://mywebsite.com` is unless you tell it. If you use a relative URL (`/api/users`), the Node.js server crashes because it doesn't know the base URL.
**Golden Rule:** Inside Server Components, `fetch()` requires an **absolute URL** (e.g., `fetch('https://api.github.com/users')`). 
*(Note: If you are trying to fetch from your own database, don't use fetch! Just import your database client and query it directly!)*

---

### Mistake 2: Assuming `fetch()` Throws Exceptions on HTTP 404 or 500 Responses

**The mistake:** Writing `try { const res = await fetch(url); const data = await res.json(); } catch (err)` expecting 404/500 errors to jump to catch block.

**Why it's wrong:** Native `fetch()` rejects promises ONLY on network failures. HTTP 404 or 500 responses resolve normally with `res.ok = false`. Check `if (!res.ok) throw new Error()` explicitly.

*Incorrect:*
```typescript
try {
  const res = await fetch('/api/user');
  const data = await res.json(); // ❌ Does NOT throw error on 404/500!
} catch (e) { ... }
```

*Fix:*
```typescript
const res = await fetch('/api/user');
if (!res.ok) throw new Error(`HTTP Error: ${res.status}`); // Check res.ok explicitly
const data = await res.json();
```

---

### Mistake 3: Reading `res.json()` or `res.text()` Multiple Times on the Same Response Object

**The mistake:** Calling `await res.json()` twice on the same `Response` instance.

**Why it's wrong:** Response body streams can be read ONLY ONCE. Calling `.json()` a second time throws a `TypeError: body stream already read`.

*Incorrect:*
```typescript
const data1 = await res.json();
const data2 = await res.json(); // ❌ TypeError: body stream already read!
```

*Fix:*
```typescript
const data = await res.json(); // Store parsed JSON in variable once
```


---

## 6. Practice Exercises

### Exercise 1: Prop Drilling vs Fetching

**Problem:** You have a `RootLayout` and a deeply nested `UserProfile` Server Component. Both need to check `fetch('https://api.com/auth/status')`. Should the Layout fetch it and pass it down as a prop through 5 layers?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> Because of Next.js Request Memoization, you should just write `await fetch('https://api.com/auth/status')` in BOTH the Layout and the UserProfile. Next.js will automatically deduplicate the request so it only hits the external API once.
> ```
> - Think about what Next.js does to multiple identical `fetch` requests.

---

### Exercise 2: Next.js Patched fetch Helper

**Problem:** Write async function `fetchData(url)` with proper error handling (`!res.ok`), returning parsed JSON with `{ next: { revalidate: 300 } }`.

**Expected output:**
> [!check]- Answer
> ```typescript
> async function fetchData(url: string) { const res = await fetch(url, { next: { revalidate: 300 } }); if (!res.ok) throw new Error('Fetch failed'); return await res.json(); }
> ```
> - Always check `res.ok` before parsing response bodies.
> 
> ```typescript
> export async function fetchData<T>(url: string): Promise<T> {
>   const res = await fetch(url, { next: { revalidate: 300 } });
>   if (!res.ok) {
>     throw new Error(`Failed to fetch data: ${res.statusText}`);
>   }
>   return res.json();
> }
> ```

---

### Exercise 3: Next.js Request Deduplication

**Problem:** If 3 separate Server Components call `fetch('https://api.example.com/user')` during a single server render, how many network HTTP requests are sent?

**Expected output:**
> [!check]- Answer
> ```text
> 1 HTTP request (Next.js request memoization automatically deduplicates identical fetch GET requests within a render pass).
> ```
> - Next.js automatically deduplicates identical `fetch` calls during render.
> 
> ```text
> 3 Components calling fetch() -> 1 Network HTTP Request
> ```


---

## 7. Related Terms
- [Data Caching](../level_05/data_caching.md) — How to control how long the `fetch` result is stored.
- [React Server Components (RSC)](../level_01/rsc.md) — The components that allow top-level `async/await`.

---

## 8. Key Takeaways
- In the App Router, you fetch data by making your Server Component `async` and calling the standard `await fetch()` API.
- Next.js extends the native `fetch` API to provide advanced caching on the server.
- **Request Memoization** automatically deduplicates identical `fetch` calls across your component tree during a single render pass, eliminating the need for prop drilling data.
- Server-side `fetch` requires absolute URLs.
