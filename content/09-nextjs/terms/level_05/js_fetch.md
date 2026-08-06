# JavaScript Fetch API

> **Level 5 — Data Fetching**
> The native web platform API used to perform asynchronous HTTP requests, returning a Promise that resolves to a Response object.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The parent framework that extends this native API.
- [React Server Components (RSC)](../level_01/rsc.md) — Server-side data fetching inside React Server Components.

---

## 2. Term Category

**Data Fetching & Caching** (Native Web Fetch API): The native Web Fetch API provides promise-based HTTP network request functionality in modern JavaScript environments.



---

## 3. Explanation

### Environment Context
- **Universal** (Available natively inside modern browser runtime engines and standard Node.js v18+ server environments).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Executing Web Fetch Requests with Async/Await

**Scenario:**
Execute an imperative POST request using native Web `fetch()` inside a Client Component event handler.

**Requirements:**
1. Execute `await fetch(url, { method: "POST", body: ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { useState } from "react";
> 
> export default function PostForm() {
>   const [loading, setLoading] = useState(false);
> 
>   async function handleSubmit(e: React.FormEvent) {
>     e.preventDefault();
>     setLoading(true);
> 
>     try {
>       const res = await fetch("/api/contact", {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify({ message: "Hello World" })
>       });
>       const json = await res.json();
>       alert(`Response: ${json.status}`);
>     } finally {
>       setLoading(false);
>     }
>   }
> 
>   return (
>     <form onSubmit={handleSubmit}>
>       <button disabled={loading} type="submit">
>         {loading ? "Sending..." : "Submit Message"}
>       </button>
>     </form>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Native Web `fetch()` provides standard HTTP client capabilities inside browser Client Components.
> 2. Requires setting `Content-Type: application/json` headers when sending JSON body payloads.
> 3. Does NOT hook into Next.js server Data Cache when executed in the browser.
> 
---

### Exercise 2: Parsing Response Types (JSON vs Blob vs Text)

**Scenario:**
Handle non-JSON responses (e.g. image Blob or CSV text) using native `fetch()` response methods.

**Requirements:**
1. Call `res.blob()` or `res.text()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> async function downloadReport() {
>   const res = await fetch("/api/export-csv");
>   const csvText = await res.text(); // Parses raw text string instead of JSON
>   console.log("CSV Content:", csvText);
> }
> ```
> 
> #### Technical Explanation
>
> 1. Web `fetch()` body streaming methods (`json()`, `text()`, `blob()`, `arrayBuffer()`) consume response stream buffers.
> 2. A response stream can ONLY be consumed once; calling `json()` then `text()` throws a TypeError.
> 3. Flexible data parsing interface for diverse HTTP payload formats.
> 
---

### Exercise 3: Canceling In-Flight Fetch Requests with `AbortController`

**Scenario:**
Cancel an ongoing `fetch()` request if the user navigates away before completion.

**Requirements:**
1. Pass `signal` to `fetch()` options.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const controller = new AbortController();
> 
> fetch("/api/long-running", { signal: controller.signal })
>   .then((res) => res.json())
>   .catch((err) => {
>     if (err.name === "AbortError") {
>       console.log("Request successfully cancelled!");
>     }
>   });
> 
> // Cancel request when needed:
> controller.abort();
> ```
> 
> #### Technical Explanation
>
> 1. `AbortController` provides a standard Web API mechanism to cancel HTTP network requests in-flight.
> 2. Prevents memory leaks and unnecessary network socket usage on unmounted components.
> 3. Standard Web network control pattern.
> 
---


## 6. Related Terms
- [Server-side Fetching (Extended `fetch`)](fetch.md) — How Next.js builds on this native API.
- [`cookies()` and `headers()` from `next/headers`](cookies_headers.md) — Accessing HTTP headers.

---

## 7. Key Takeaways
- The native `fetch()` API performs asynchronous HTTP operations using Promises.
- `fetch()` returns a `Response` object that must be parsed using `.json()` or `.text()`.
- The `fetch` Promise only rejects on true network failures.
- Always check the `response.ok` property to handle HTTP error codes (like 400 or 500).
- Next.js overrides the global `fetch` on the server to cache data requests automatically.
