# `createError`, `showError` & `clearError`

> **Level 10 — Error Handling & Production**
> The primary utility functions used to generate standard H3 errors, intentionally trigger the global `error.vue` page, and safely purge error states to resume normal application flows.

---

## 1. Prerequisites
- [H3 Request Handlers (`defineEventHandler`)](../level_07/h3_handlers.md) — The underlying server engine that formats these errors.

---

## 2. Term Category

**Security & Middleware** (Structured HTTP Exception Creation): `createError()` creates structured HTTP error objects containing status codes and messages, triggerable in server routes, composables, or pages.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
If you are writing a standard JavaScript function and something goes wrong, you write `throw new Error("Bad data")`. 

However, in a web framework, a standard JavaScript error lacks critical context. A web server needs to know the HTTP Status Code (Is it a 400 Bad Request? A 404 Not Found? A 403 Forbidden?). 

`createError` and `showError` replace standard `new Error()` by creating rich, SSR-safe error objects that Nuxt perfectly understands across both the Client and Server.

### (2) `createError`
`createError` creates an `H3Error` object. It does **not** trigger the global error page immediately. You must explicitly `throw` it. It is mostly used inside API endpoints, Composables, or Route Middleware.

```typescript
// server/api/post/[id].ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');
  const post = database.find(id);

  if (!post) {
    // Creating and throwing the error stops the request 
    // and sends a 404 to the browser.
    throw createError({
      statusCode: 404,
      statusMessage: 'Post Not Found',
      data: { customDetails: 'User requested ID ' + id }
    });
  }

  return post;
});
```

### (3) `showError`
`showError` is used on the frontend. When you call it, it immediately halts the Vue rendering process, unmounts the application, and forces the `error.vue` page to appear.

```vue
<!-- pages/profile.vue -->
<script setup lang="ts">
const { data, error } = await useFetch('/api/profile');

if (error.value) {
  // We tried to fetch the profile, but the API returned a 404.
  // Instead of showing a broken profile page, let's trigger the 
  // global error page!
  showError({
    statusCode: 404,
    message: 'This profile does not exist.'
  });
}
</script>
```

### (4) `clearError`
Once a fatal error is triggered, the application is unmounted. To recover and resume regular Vue routing, you must invoke the frontend helper `clearError()`. This utility purges Nuxt's internal fatal error state and redirects the browser back to a clean route.

```typescript
// Clear the current fatal error and send the user back to the home page
clearError({ redirect: '/' });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Throwing standard JavaScript errors in API routes
**The mistake:** Writing `throw new Error("Missing ID")` inside a `server/api/` route.

**Why it's wrong:** Nuxt does not know what HTTP status code to assign to a standard JavaScript error, so it defaults to a generic `500 Internal Server Error`. The user gets no helpful information, and your frontend receives a poorly formatted error object.
**Golden Rule:** Always use `throw createError({ statusCode: 400, message: '...' })` in Nuxt logic.

---

### Mistake 2: Throwing Raw JavaScript Exceptions Instead of Calling `createError()`

**The mistake:** Writing `throw new Error('User not found')` inside a Nitro server handler or route middleware.

**Why it's wrong:** Throwing raw JS exceptions returns un-formatted 500 error responses without custom status codes or messages. `createError({ statusCode: 404 })` creates structured Nuxt error objects.

*Incorrect:*
```typescript
export default defineEventHandler((event) => {
  if (!user) throw new Error('User not found'); // ❌ Un-formatted 500 exception!
});
```

*Fix:*
```vue
export default defineEventHandler((event) => {
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User Not Found' });
});
```

---

### Mistake 3: Omitting `fatal: true` on Client `createError()` Calls (Missing Error Boundary Trigger)

**The mistake:** Calling `throw createError({ statusCode: 404 })` on the client without `fatal: true`.

**Why it's wrong:** On the client browser, calling `createError()` without `fatal: true` logs an error to console without triggering the `error.vue` full-page error boundary. Add `fatal: true` for full-page error views.

*Incorrect:*
```vue
<script setup>
if (!data.value) throw createError({ statusCode: 404 }); // ❌ Does NOT render error.vue on client!
</script>
```

*Fix:*
```vue
<script setup>
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true });
</script>
```


---

## 5. Practice Exercises

### Exercise 1: Throwing HTTP 404 Errors in Dynamic Route Loaders

**Scenario:**
Throw a 404 Not Found error when dynamic article ID parameters do not exist in the database.

**Requirements:**
1. Execute `throw createError({ statusCode: 404, statusMessage: "Article Not Found" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const route = useRoute();
> const { data: article, error } = await useFetch(`/api/articles/${route.params.id}`);
> 
> if (error.value || !article.value) {
>   throw createError({
>     statusCode: 404,
>     statusMessage: `Article ${route.params.id} does not exist.`,
>     fatal: true
>   });
> }
> </script>
> 
> <template>
>   <article v-if="article">
>     <h1>{{ article.title }}</h1>
>   </article>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `createError()` constructs a standardized Nuxt HTTP error object.
> 2. `fatal: true` forces Nuxt to clear the current component tree and render the root `error.vue` error page.
> 3. Guarantees consistent 404 error rendering across server SSR and client navigation.
> 
---

### Exercise 2: Returning Formatted API Error Responses in Nitro Handlers

**Scenario:**
Validate authorization tokens in a Nitro endpoint and return HTTP 401 Unauthorized using `createError()`.

**Requirements:**
1. Throw `createError({ statusCode: 401, message: "Unauthorized" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/protected.ts
> export default defineEventHandler((event) => {
>   const authHeader = getHeader(event, "authorization");
>   
>   if (!authHeader || !authHeader.startsWith("Bearer ")) {
>     throw createError({
>       statusCode: 401,
>       statusMessage: "Unauthorized: Missing or invalid authentication token."
>     });
>   }
>   
>   return { data: "Protected sensitive server response" };
> });
> ```
> 
> #### Technical Explanation
>
> 1. In Nitro server handlers, throwing `createError()` halts request processing and returns a formatted JSON error payload.
> 2. `statusCode` sets the HTTP response status code header.
> 3. Standard REST API server error pattern.
> 
---

### Exercise 3: Clearing Errors with `clearError()`

**Scenario:**
Clear an active error state and navigate back to the home page using `clearError()`.

**Requirements:**
1. Execute `clearError({ redirect: "/" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- error.vue -->
> <script setup lang="ts">
> const props = defineProps({
>   error: Object
> });
> 
> function handleReset() {
>   clearError({ redirect: "/" });
> }
> </script>
> 
> <template>
>   <div>
>     <h1>Error: {{ props.error?.statusCode }}</h1>
>     <p>{{ props.error?.message }}</p>
>     <button @click="handleReset">Return to Homepage</button>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `clearError()` resets Nuxt's internal global error state ref.
> 2. `{ redirect: '/' }` option redirects the user to the target path after clearing error state.
> 3. Standard error recovery mechanism.
> 
---


## 6. Related Terms
- [`error.vue` & `useError`](error_vue.md) — What the user sees when these functions are executed.

---

## 7. Key Takeaways
- `createError` generates an SSR-safe `H3Error` with HTTP status codes.
- Throw `createError` inside API routes to return correct HTTP failures.
- Call `showError` on the frontend to instantly trigger the `error.vue` page.
- Stop using `throw new Error()` in Nuxt applications.
