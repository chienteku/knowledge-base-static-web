# `$fetch` (ofetch)

> **Level 5 — Data Fetching**
> The globally available HTTP client in Nuxt 3. It is a highly optimized, isomorphic alternative to Axios or the native `fetch` API, designed to parse JSON automatically and handle Server/Client execution flawlessly.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — `$fetch` operates seamlessly across both environments.
- [async / await](../../../03-javascript/terms/level_06/async_await.md) — For asynchronous control flow.

---

## 2. Term Category

**Data Fetching** (Direct HTTP Fetch Utility): `$fetch` is Nuxt 3's built-in HTTP client (powered by ofetch) for imperative client-side or server-side API requests.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
In modern web development, the native `fetch()` API has largely replaced older libraries like XMLHttpRequest or Axios. However, native `fetch()` has annoyances: you always have to manually call `.json()` on the response, and error handling requires manually checking `res.ok`.

Nuxt 3 solves this by replacing the native `fetch` with a library called **ofetch** (exposed globally as `$fetch`). It automatically parses JSON responses, automatically throws errors on 4xx/5xx status codes, and provides smart retries out of the box.

### (2) Core Concept
You can use `$fetch` anywhere in your Nuxt application—inside components, composables, or Nitro server routes. 

```typescript
// No import needed, $fetch is globally available
try {
  // $fetch automatically parses the JSON! No need for `await res.json()`
  const users = await $fetch('/api/users', {
    method: 'GET',
    query: { limit: 10 } // automatically appends ?limit=10 to the URL
  });
  console.log(users);
} catch (error) {
  // $fetch automatically throws if the server returns a 404 or 500
  console.error("Failed to fetch users", error);
}
```

### (3) The SSR Double-Fetch Problem
While `$fetch` is fantastic, you should almost **never** use it directly inside a Vue component's `<script setup>` during SSR.

Because the component runs twice (once on the Server, once on the Client), calling `$fetch` directly will cause the server to make the API request, and then the client to make the *exact same API request* a second later when it hydrates. This wastes bandwidth and causes UI flickering.

To fetch data inside a Vue component safely, you must wrap `$fetch` in `useAsyncData`, or use the shorthand `useFetch`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `$fetch` for initial component data
**The mistake:** Calling `$fetch` directly in `<script setup>` to load the data required to render the page.

**Why it's wrong:** Nuxt does not magically serialize the result of `$fetch` to the client. The server fetches the data and renders the HTML. The client boots up, sees an empty variable, and fires a second network request to get the data again. 
**Golden Rule:** Inside Vue components, always use `useFetch`. Reserve `$fetch` for user interactions (like a button click submitting a form) or inside Nitro server routes.

*Incorrect:*
```vue
<script setup>
// This runs on the server, AND AGAIN on the client!
const data = await $fetch('https://api.example.com/data');
</script>
```

*Fix:*
```vue
<script setup>
// This runs on the server, serializes the data, and skips the client fetch!
const { data } = await useFetch('https://api.example.com/data');
</script>
```

---

### Mistake 2: Calling `$fetch` Direct Helper in Component Setup (Double Fetch Hydration Bug)

**The mistake:** Writing `const data = await $fetch('/api/user')` at top level of `<script setup>`.

**Why it's wrong:** `$fetch` executes on the server during SSR render, but does NOT serialize data into the Nuxt payload. When the client hydratest, it executes `$fetch` a second time (double fetch). Use `useFetch` or `useAsyncData` in component setup.

*Incorrect:*
```vue
<script setup>
const data = await $fetch('/api/users'); // ❌ Double fetch bug: executes on server AND client hydration!
</script>
```

*Fix:*
```vue
<script setup>
// Use useFetch in component setup to prevent double fetching:
const { data } = await useFetch('/api/users');
</script>
```

---

### Mistake 3: Forgetting `Content-Type: application/json` Headers in `$fetch` POST Requests

**The mistake:** Passing raw JS object to `$fetch` without understanding of ofetch body auto-serialization.

**Why it's wrong:** `$fetch` (powered by `ofetch`) automatically sets `Content-Type: application/json` and serializes objects passed to `body`. Do NOT manually run `JSON.stringify(body)`.

*Incorrect:*
```typescript
await $fetch('/api/save', {
  method: 'POST',
  body: JSON.stringify({ name: 'Alice' }) // ❌ Double JSON serialization!
});
```

*Fix:*
```vue
await $fetch('/api/save', {
  method: 'POST',
  body: { name: 'Alice' } // Object auto-serialized by ofetch
});
```


---

## 5. Practice Exercises

### Exercise 1: Executing Direct HTTP Requests with `$fetch`

**Scenario:**
Execute an imperative POST request using `$fetch()` inside an event handler method.

**Requirements:**
1. Call `$fetch("/api/orders", { method: "POST", body: ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const isSubmitting = ref(false);

async function submitOrder() {
  isSubmitting.value = true;
  try {
    const response = await $fetch("/api/orders", {
      method: "POST",
      body: { productId: 42, quantity: 2 }
    });
    alert(`Order created! ID: ${response.id}`);
  } catch (err: any) {
    alert(`Order failed: ${err.message}`);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <button @click="submitOrder" :disabled="isSubmitting">Submit Order</button>
</template>
```

> #### Technical Explanation
>
> 1. `$fetch` is a low-level HTTP client designed for user-driven event handlers (button clicks, form submits).
> 2. Automatically parses JSON response bodies and handles HTTP status codes.
> 3. Does NOT generate SSR payload cache entries like `useFetch()`.

---

### Exercise 2: Understanding SSR Internal Direct Calls with `$fetch`

**Scenario:**
Explain why calling `$fetch("/api/status")` during SSR on the server executes a direct H3 event call without initiating a loopback TCP HTTP network request.

**Requirements:**
1. Detail Nitro's direct event execution behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> // Executed on server: Nitro invokes /api/status handler directly in Node.js memory!
> const status = await $fetch("/api/status");
> </script>

<template>
  <div>
    <p>Internal Server Status: {{ status }}</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. On the server during SSR, `$fetch` intercepts calls to local `/api/` endpoints and invokes Nitro H3 event handlers directly in RAM.
> 2. Eliminates loopback TCP network latency and socket overhead.
> 3. Fast internal server execution architecture.

---

### Exercise 3: Handling Custom HTTP Headers and Interceptors

**Scenario:**
Add a Bearer token Authorization header to a `$fetch` request using `onRequest` interceptor hooks.

**Requirements:**
1. Pass `headers` or `onRequest` hook to `$fetch`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const token = useCookie("auth_token");

const response = await $fetch("/api/user/profile", {
  headers: {
    Authorization: `Bearer ${token.value}`
  },
  onRequestError({ error }) {
    console.error("Network request failed:", error);
  }
});
```

> #### Technical Explanation
>
> 1. `$fetch` accepts standard Fetch API options (`headers`, `query`, `method`, `body`).
> 2. `onRequestError` and `onResponseError` lifecycle interceptors handle custom network error processing.
> 3. Extensible HTTP request client.

---




---

## 6. Related Terms
- [`useFetch`](use_fetch.md) — The SSR-safe wrapper around `$fetch`.
- [`useAsyncData`](use_async_data.md) — The underlying composable that handles SSR serialization.

---

## 7. Key Takeaways
- `$fetch` (powered by ofetch) is Nuxt's global HTTP client.
- It automatically parses JSON and throws on HTTP errors.
- It is perfect for form submissions and Nitro server routes.
- **Never** use `$fetch` directly inside `<script setup>` for initial page data, as it will trigger a double-fetch on SSR.
