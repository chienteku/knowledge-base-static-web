# `createError`, `showError` & `clearError`

> **Level 10 — Error Handling & Production**
> The primary utility functions used to generate standard H3 errors, intentionally trigger the global `error.vue` page, and safely purge error states to resume normal application flows.

---

## 1. Prerequisites
- [`error.vue` Layout](../level_10/error_vue.md) — The visual UI that is rendered when `showError` is called.
- [H3 Request Handlers (`defineEventHandler`)](../level_07/h3_handlers.md) — The underlying server engine that formats these errors.

---

## 2. Term Category
- **Error Handling**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Middleware Auth Guard

**Problem:** Write a Route Middleware (`middleware/admin.ts`). If the user is not an admin, you want to immediately trigger the `error.vue` page with a 401 status code and the message "Unauthorized Access".

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtRouteMiddleware((to, from) => {
>   const isAdmin = false; // Logic here
>   
>   if (!isAdmin) {
>     // In middleware, abortNavigation paired with createError triggers the error page!
>     return abortNavigation(createError({ 
>       statusCode: 401, 
>       message: 'Unauthorized Access' 
>     }));
>   }
> });
> ```
> - Inside the middleware transition guard, return `abortNavigation(createError({ ... }))` to halt and trigger the error UI.

---

### Exercise 2: createError Helper Setup Pattern

**Problem:** Write Nitro API handler throwing 403 Forbidden error using `createError()` when `event.context.user` is null.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineEventHandler((event) => {
>   if (!event.context.user) {
>     throw createError({ statusCode: 403, statusMessage: 'Forbidden Access' });
>   }
> });
> ```
> - `createError()` creates structured H3 and Nuxt error instances.
> 
> ```typescript
> export default defineEventHandler((event) => {
>   if (!event.context.user) {
>     throw createError({
>       statusCode: 403,
>       statusMessage: 'Forbidden Access Required'
>     });
>   }
> });
> ```

---

### Exercise 3: createError Data Property

**Problem:** Which property on `createError({ data: { ... } })` allows passing custom JSON payload details to error boundary templates?

**Expected output:**
> [!check]- Answer
> ```text
> data (accessible via error.data in error.vue)
> ```
> - `data` property passes custom context to `error.vue`.
> 
> ```typescript
> throw createError({
>   statusCode: 400,
>   data: { field: 'email', reason: 'Invalid format' }
> });
> ```


---

## 7. Related Terms
- [`error.vue`](../level_10/error_vue.md) — What the user sees when these functions are executed.

---

## 8. Key Takeaways
- `createError` generates an SSR-safe `H3Error` with HTTP status codes.
- Throw `createError` inside API routes to return correct HTTP failures.
- Call `showError` on the frontend to instantly trigger the `error.vue` page.
- Stop using `throw new Error()` in Nuxt applications.
