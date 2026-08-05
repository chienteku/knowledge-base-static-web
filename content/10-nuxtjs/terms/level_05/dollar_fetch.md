# `$fetch` (ofetch)

> **Level 5 — Data Fetching**
> The globally available HTTP client in Nuxt 3. It is a highly optimized, isomorphic alternative to Axios or the native `fetch` API, designed to parse JSON automatically and handle Server/Client execution flawlessly.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — `$fetch` operates seamlessly across both environments.
- async_await — For asynchronous control flow.
---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Form Submission

**Problem:** You have a login form. When the user clicks "Submit", you want to send a POST request to `/api/login` with their `email` and `password`. Should you use `$fetch` or `useFetch` for this specific action?

**Expected output:**
> [!check]- Answer
> ```text
> $fetch. 
> Because the form submission happens exclusively on the client (triggered by a user click), there is no SSR double-fetching issue.
> ```
> - Actions triggered by user clicks or form submissions in browser memory only happen in client environments and do not require SSR serialization.

---

### Exercise 2: Event Handler $fetch Usage Pattern

**Problem:** Write Vue `<script setup>` method `submitForm(formData)` calling `$fetch('/api/submit', { method: 'POST', body: formData })`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> async function submitForm(payload) {
>   const res = await $fetch('/api/submit', {
>     method: 'POST',
>     body: payload
>   });
> }
> </script>
> ```
> - `$fetch` is the recommended fetch helper inside event handlers and user actions.
> 
> ```vue
> <script setup>
> async function submitForm(formData) {
>   try {
>     const response = await $fetch('/api/submit', {
>       method: 'POST',
>       body: formData
>     });
>     console.log('Submitted successfully:', response);
>   } catch (err) {
>     console.error('Submission failed:', err);
>   }
> }
> </script>
> ```

---

### Exercise 3: $fetch vs useFetch Selection Rule

**Problem:** State the rule for when to use `useFetch` vs `$fetch` in Nuxt 3.

**Expected output:**
> [!check]- Answer
> ```text
> Use useFetch in top-level <script setup> component initialization (SSR safe); Use $fetch inside event handlers, user submit functions, or server routes.
> ```
> - `useFetch` -> Component setup initialization (prevents double fetch).
> - `$fetch` -> Event handlers, user button clicks, server API handlers.
> 
> ```text
> Component Setup = useFetch; Event Handlers / Actions = $fetch
> ```


---

## 7. Related Terms
- [`useFetch`](use_fetch.md) — The SSR-safe wrapper around `$fetch`.
- [`useAsyncData`](use_async_data.md) — The underlying composable that handles SSR serialization.
---

## 8. Key Takeaways
- `$fetch` (powered by ofetch) is Nuxt's global HTTP client.
- It automatically parses JSON and throws on HTTP errors.
- It is perfect for form submissions and Nitro server routes.
- **Never** use `$fetch` directly inside `<script setup>` for initial page data, as it will trigger a double-fetch on SSR.
