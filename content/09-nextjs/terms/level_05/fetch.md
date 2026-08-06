# Server-side Fetching (Extended `fetch`)

> **Level 5 — Data Fetching**
> The primary way to get data in Next.js. It extends the native Web `fetch()` API to include advanced caching and revalidation features directly within Server Components.

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — Where you execute the fetch.
- [JavaScript Fetch API](js_fetch.md) — The foundation of this extended API.

---

## 2. Term Category

**Data Fetching & Caching** (Extended Server Fetch API): Next.js extends the native Web `fetch()` API with automatic caching (`cache`), tag invalidation (`next: { tags }`), and revalidation controls.



---

## 3. Explanation

### Environment Context
- **Server Only (for the extended Next.js features)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Extended `fetch()` API Usage in Server Components

**Scenario:**
Fetch data using Next.js's extended `fetch()` API with custom headers and caching options.

**Requirements:**
1. Execute `await fetch(url, options)` in Server Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default async function FetchDemo() {
>   const res = await fetch("https://api.example.com/data", {
>     headers: {
>       Authorization: `Bearer ${process.env.API_SECRET_KEY}`
>     },
>     next: { revalidate: 3600 }
>   });
>   const data = await res.json();

  return <div>Data: {data.value}</div>;
}
```

> #### Technical Explanation
>
> 1. Next.js patches the native Web `fetch()` API on the server to automatically integrate with the Next.js Data Cache.
> 2. Supports `next.revalidate` and `next.tags` extension options.
> 3. Performs automatic request memoization when multiple identical `fetch()` calls occur in a single render pass.

---

### Exercise 2: Bypassing Request Memoization for Unique Fetch Options

**Scenario:**
Explain why passing different headers or `AbortController` signals to identical URLs bypasses React request memoization.

**Requirements:**
1. Detail memoization key generation rules.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Request Memoization Key Matching:
> - Fetch 1: fetch('/api/data', { headers: { 'X-ID': '1' } })
> - Fetch 2: fetch('/api/data', { headers: { 'X-ID': '2' } })
> Result: Next.js treats these as TWO DISTINCT requests because headers differ! Duplicate network calls WILL execute.
> ```

> #### Technical Explanation
>
> 1. Next.js memoizes `fetch()` calls by hashing the URL string AND options object (headers, method, credentials).
> 2. Divergent option objects generate different cache keys.
> 3. Keep fetch options identical across components to benefit from request memoization.

---

### Exercise 3: Handling HTTP Errors in Extended `fetch()`

**Scenario:**
Check `res.ok` status when using `fetch()` and throw custom errors if requests fail.

**Requirements:**
1. Check `if (!res.ok) throw new Error(...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> async function getSecureData() {
>   const res = await fetch("https://api.example.com/protected");
>   if (!res.ok) {
>     throw new Error(`HTTP Fetch Error: Status ${res.status}`);
>   }
>   return res.json();
> }

export default async function Page() {
  const data = await getSecureData();
  return <div>Data Loaded: {data.id}</div>;
}
```

> #### Technical Explanation
>
> 1. `fetch()` Promises do NOT reject on HTTP 404 or 500 status codes (only on network failures).
> 2. Checking `res.ok` ensures invalid HTTP responses trigger error boundary handlers.
> 3. Standard API error checking requirement.

---




---

## 6. Related Terms
- [Data Caching (`force-cache`, `no-store`)](data_caching.md) — How to control how long the `fetch` result is stored.
- [React Server Components (RSC)](../level_01/rsc.md) — The components that allow top-level `async/await`.
- [Client-side Fetching (SWR / React Query)](client_fetching.md) — Related concept: Client-side Fetching (SWR / React Query).
- [JavaScript Fetch API](js_fetch.md) — Related concept: JavaScript Fetch API.
- [`React.cache()` Function](react_cache.md) — Related concept: `React.cache()` Function.
- [Open Graph & Twitter Cards (`generateMetadata`)](../level_09/generate_metadata.md) — Related concept: Open Graph & Twitter Cards (`generateMetadata`).

---

## 7. Key Takeaways
- In the App Router, you fetch data by making your Server Component `async` and calling the standard `await fetch()` API.
- Next.js extends the native `fetch` API to provide advanced caching on the server.
- **Request Memoization** automatically deduplicates identical `fetch` calls across your component tree during a single render pass, eliminating the need for prop drilling data.
- Server-side `fetch` requires absolute URLs.
