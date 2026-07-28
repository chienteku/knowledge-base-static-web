# `abortNavigation` Utility

> **Level 8 — Middleware & Plugins**
> A Nuxt-specific navigation guard utility used inside Route Middleware to cancel a page transition immediately and rollback browser history safely.

---

## 1. Prerequisites
- [Route Middleware](../level_08/route_middleware.md) — The routing context where this utility is exclusively invoked.
- [`pages/` Directory](../level_02/pages_directory.md) — The routing layouts guarded by this check.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client** (Halt execution on the server during compile rendering, or inside the browser during active SPA navigation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a user clicks a link to a protected route (like `/admin`), Nuxt triggers a page transition. If the user doesn't have permission to access that page, you must stop them.

If you simply do nothing, the routing transition continues and renders the page anyway. If you throw a standard JavaScript error (`throw new Error()`), the application crashes with a white screen.

`abortNavigation` solves this: it instructs the Nuxt router to immediately halt the navigation transition. If executed in the browser, it rolls back the browser URL address bar to the previous route cleanly without reloading the page or tearing down active state.

---

### (2) Practical Behaviors
You can call `abortNavigation` in three ways depending on the desired user feedback:

```typescript
// 1. Silent Abort: Navigation stops, URL reverts, no visual error is shown
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/forbidden-page') {
    return abortNavigation(); 
  }
});

// 2. Abort with Message: Stops transition and logs custom message
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/locked') {
    return abortNavigation('This section is temporarily locked.');
  }
});

// 3. Abort with Full Error: Halts routing and triggers Nuxt's error layout
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/admin' && !useUser().isAdmin) {
    return abortNavigation(
      createError({ 
        statusCode: 403, 
        statusMessage: 'Forbidden Access' 
      })
    );
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to return the function call

**The mistake:** Invoking `abortNavigation()` inside the middleware wrapper block without writing the `return` statement:

```typescript
// BAD: Route transition will NOT actually abort!
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/secret') {
    // ❌ Called but not returned, so Nuxt router continues navigation!
    abortNavigation();
  }
});
```

**Why it's wrong:** Nuxt expects the middleware function to return the promise or error signal returned by `abortNavigation()` or `navigateTo()`. If you omit `return`, the function resolves to `undefined` synchronously, which tells Nuxt "this middleware passed successfully."

**Golden Rule:** Always prefix navigation helpers with `return` inside route middleware functions (e.g., `return abortNavigation()` or `return navigateTo()`).

---

### Mistake 2: Throwing Native Un-Handled Exceptions Instead of Returning `abortNavigation()` in Middleware

**The mistake:** Writing `throw new Error('Access denied')` inside inline route middleware.

**Why it's wrong:** Throwing raw JS exceptions inside route middleware breaks navigation abruptly without proper Nuxt router error recovery. Use `abortNavigation()` or `navigateTo()`.

*Incorrect:*
```typescript
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth) throw new Error('Blocked'); // ❌ Raw exception breaks router!
});
```

*Fix:*
```vue
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth) return abortNavigation('Access Denied'); // Clean router navigation abort
});
```

---

### Mistake 3: Forgetting `return` Before `abortNavigation()` in Route Middleware

**The mistake:** Writing `abortNavigation('Blocked');` without the `return` statement.

**Why it's wrong:** Route middleware functions must RETURN the result of `abortNavigation()` or `navigateTo()` to signal the router guard to stop navigation.

*Incorrect:*
```typescript
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth) abortNavigation(); // ❌ Missing return statement!
  console.log('Continues execution unexpectedly!');
});
```

*Fix:*
```vue
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth) return abortNavigation(); // Correct return
});
```


---

## 6. Practice Exercises

### Exercise 1: Custom Error Abort

**Problem:** Complete the route middleware block below to block access to the `/billing` page if the user's subscription status is `'inactive'`, returning a `402 Payment Required` error object.

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const subscription = useSubscription();

  if (to.path === '/billing' && subscription.value === 'inactive') {
    // Solution:
    return abortNavigation(
      createError({ 
        statusCode: 402, 
        statusMessage: 'Payment Required' 
      })
    );
  }
});
```

> [!check]- Answer
> - Pass a `createError` call as the first parameter inside the `abortNavigation` invocation.

---

### Exercise 2: abortNavigation Custom Error Pattern

**Problem:** Write route middleware `middleware/admin.ts` aborting navigation with HTTP 403 error status if `user.value.role !== 'admin'`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtRouteMiddleware((to, from) => {
>   const user = useUser();
>   if (user.value?.role !== 'admin') {
>     return abortNavigation(createError({ statusCode: 403, statusMessage: 'Forbidden' }));
>   }
> });
> ```
> - `abortNavigation(error)` passes structured error objects to router error boundary.
> 
> ```typescript
> // middleware/admin.ts
> export default defineNuxtRouteMiddleware((to) => {
>   const user = useUser();
>   if (user.value?.role !== 'admin') {
>     return abortNavigation(
>       createError({ statusCode: 403, statusMessage: 'Admin Access Required' })
>     );
>   }
> });
> ```

---

### Exercise 3: abortNavigation vs navigateTo

**Problem:** When should you use `abortNavigation()` vs `navigateTo('/login')`?

**Expected output:**
> [!check]- Answer
> ```text
> abortNavigation(): Stops current route transition completely, keeping user on current page;
> navigateTo(): Redirects user to a different target URL route.
> ```
> - `abortNavigation()` -> Cancels route transition, remains on current page.
> - `navigateTo('/url')` -> Redirects user to new route URL.
> 
> ```text
> abortNavigation() = Cancel transition; navigateTo() = Redirect to URL.
> ```


---

## 7. Related Terms
- [Route Middleware](../level_08/route_middleware.md) — The routing context where this utility is used.
- [`error.vue`](../level_10/error_vue.md) — The global page layout that renders aborted error objects.

---

## 8. Key Takeaways
- `abortNavigation` halts page transition routing instantly.
- It resets the browser URL bar to the previous path during SPA client routing.
- You must always `return` the utility call inside the middleware function block.
- Pass a `createError` object to redirect the browser application to the default error page.
- Do not call this utility outside of Nuxt Route Middleware functions.
