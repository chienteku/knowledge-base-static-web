# JavaScript Fetch API

> **Level 5 — Data Fetching**
> The native web platform API used to perform asynchronous HTTP requests, returning a Promise that resolves to a Response object.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The parent framework that extends this native API.

---

## 2. Term Category
- **Architecture**

---

## 3. Environment Context
- **Universal** (Available natively inside modern browser runtime engines and standard Node.js v18+ server environments).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early JavaScript development, making network requests to APIs was complex. Developers had to use the verbose `XMLHttpRequest` API or load heavy third-party wrapper libraries like jQuery or Axios to handle async transactions. 

The native **`fetch()` API** was designed to solve this by providing a clean, Promise-based interface built directly into the web platform. In Next.js, `fetch` is the primary mechanism for fetching remote data. Next.js extends the global `fetch()` function on the server to add automatic request memoization, caching, and revalidation.

---

### (2) Core Concept — Promise Resolution and Methods
`fetch()` takes a URL string and an optional `options` configuration object. It returns a Promise that resolves to a `Response` object:

```typescript
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export async function getTodoItem(id: number): Promise<Todo> {
  // Execute a standard HTTP GET request
  const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 1. You must check response.ok explicitly!
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // 2. Parse the body stream into a JSON object
  const data: Todo = await response.json();
  return data;
}
```

---

### (3) HTTP Methods and Bodies
For mutations (writing data), you pass a custom HTTP method and stringify your data payload inside the `body` property:

```typescript
export async function createPost(title: string, content: string) {
  const response = await fetch('https://api.example.com/posts', {
    method: 'POST', // Specifying HTTP action method
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }), // Body must be a string!
  });

  return response.json();
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `fetch` throws an error on HTTP status failures (like 404 or 500)

**The mistake:** Expecting a `try/catch` block to handle API status failures automatically:

```typescript
// BAD: A 500 Internal Server Error does NOT trigger the catch block!
try {
  const res = await fetch('https://api.example.com/broken-endpoint');
  const data = await res.json(); // May crash if response body is not JSON!
} catch (error) {
  console.error("Caught error:", error); // Only runs if network fails!
}
```

**Why it's wrong:** The `fetch()` Promise only rejects when a physical **network error** occurs (such as a DNS lookup failure, connection timeout, or loss of internet). If the server responds with a `404 Not Found` or a `500 Server Error`, the promise resolves successfully, and the response's `ok` property is set to `false`.

**Golden Rule:** Always check `if (!response.ok)` immediately after your `fetch()` call to throw an error manually.

---

### Mistake 2: Forgetting `Content-Type: application/json` Header on POST Requests

**The mistake:** Sending `fetch('/api/users', { method: 'POST', body: JSON.stringify(data) })` without headers.

**Why it's wrong:** Without `Content-Type: application/json`, backend servers treat request bodies as plain text or un-parsed raw streams, causing `req.body` to be undefined.

*Incorrect:*
```typescript
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'Alice' })
}); // ❌ Missing Content-Type header!
```

*Fix:*
```typescript
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' })
});
```

---

### Mistake 3: Setting `Content-Type` Headers Manually When Sending `FormData` Payloads

**The mistake:** Writing `headers: { 'Content-Type': 'multipart/form-data' }` when passing a `FormData` object to `body`.

**Why it's wrong:** Browsers automatically generate `multipart/form-data` headers with exact boundary strings when passing `FormData`. Overriding `Content-Type` manually corrupts boundary strings.

*Incorrect:*
```typescript
const formData = new FormData();
fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }, // ❌ Corrupts boundary string!
  body: formData
});
```

*Fix:*
```typescript
// Let browser set Content-Type and boundary automatically for FormData:
fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```


---

## 6. Practice Exercises

### Exercise 1: Fetch and Error Check

**Problem:** Complete the fetch utility below to request user details from `https://api.example.com/users/:id`, checking for HTTP errors before returning the JSON object:

```typescript
// utils/api.ts
// Solution:
export async function fetchUser(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch user metadata: ${res.status}`);
  }
  
  return res.json();
}
```

> [!check]- Answer
> - Check the value of the `res.ok` boolean property and throw a new `Error` containing `res.status` if it is false.

---

### Exercise 2: AbortController Timeout Pattern

**Problem:** Write `fetch()` call using `AbortController` signal to abort requests taking longer than 5000ms.

**Expected output:**
```typescript
const controller = new AbortController(); const id = setTimeout(() => controller.abort(), 5000); const res = await fetch(url, { signal: controller.signal }); clearTimeout(id);
```

> [!check]- Answer
> - `AbortController` cancels pending fetch HTTP requests.
> 
> ```typescript
> const controller = new AbortController();
> const timeoutId = setTimeout(() => controller.abort(), 5000);
> 
> try {
>   const res = await fetch(url, { signal: controller.signal });
>   clearTimeout(timeoutId);
>   return await res.json();
> } catch (err) {
>   if (err.name === 'AbortError') console.error('Fetch timed out');
> }
> ```

---

### Exercise 3: credentials: 'include' Flag

**Problem:** Which `fetch()` option parameter ensures cross-origin HTTP requests send HttpOnly session cookies?

**Expected output:**
```text
credentials: 'include'
```

> [!check]- Answer
> - `credentials: 'include'` forwards cookies on cross-origin requests.
> 
> ```typescript
> fetch('https://api.example.com', { credentials: 'include' });
> ```


---

## 7. Related Terms
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — How Next.js builds on this native API.
- [cookies() and headers() from `next/headers`](../level_05/cookies_headers.md) — Accessing HTTP headers.

---

## 8. Key Takeaways
- The native `fetch()` API performs asynchronous HTTP operations using Promises.
- `fetch()` returns a `Response` object that must be parsed using `.json()` or `.text()`.
- The `fetch` Promise only rejects on true network failures.
- Always check the `response.ok` property to handle HTTP error codes (like 400 or 500).
- Next.js overrides the global `fetch` on the server to cache data requests automatically.
