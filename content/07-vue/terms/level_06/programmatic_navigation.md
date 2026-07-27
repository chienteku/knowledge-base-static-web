# Programmatic Navigation (`useRouter` / `useRoute`)

> **Level 6 — Routing (Vue Router)**
> The ability to navigate, redirect, and inspect route data inside JavaScript logic using Vue Router's Composition API composables instead of standard HTML anchor links.

---

## 1. Prerequisites
- [Vue Router](../level_06/vue_router.md) — The core routing library.
- [Composition API](../level_01/composition_api.md) — The custom hook paradigm.
- [Navigation Guards](../level_06/navigation_guards.md) — Routing middleware.

---

## 2. Term Category
- **Ecosystem Tool**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a typical web application, most navigation is user-driven. Users click links, and the application changes pages. In Vue Router, this is handled declaratively in templates using `<router-link to="/about">`.

However, many navigations must be triggered **programmatically** in response to JavaScript logic. For example:
- Redirecting a user to the dashboard after a successful login form submission.
- Redirecting to a `/404` error page when an API fetch fails to locate a resource.
- Directing a user back to their previous page when they click a "Cancel" button.
- Changing search filters in the URL when a user checks a checkbox.

To handle these scenarios, we need low-level access to the router engine inside our script block. In Vue 3's Composition API, this is achieved using the **`useRouter`** and **`useRoute`** composables.

### (2) How it works under the hood
When you register Vue Router in your application (`app.use(router)`), it injects a router instance globally. 

In `<script setup>`, you access this instance via two hooks:

#### `useRouter()`
Returns the global **router instance**. It provides methods to trigger navigation:
- `router.push(path)`: Navigates to a new page. It pushes a new entry onto the browser's history stack, so the user can click the browser's "Back" button to return to the original page.
- `router.replace(path)`: Navigates to a new page, but replaces the current page in the history stack. The browser's "Back" button will skip the replaced page.
- `router.go(n)` / `router.back()` / `router.forward()`: Moves backward or forward in history by `n` steps.

#### `useRoute()`
Returns the **current route location object**. It is a reactive object representing the active state of the URL. It contains properties such as:
- `route.params`: Route parameters (e.g. `/users/:id`).
- `route.query`: Query string parameters (e.g. `?search=vue`).
- `route.path`: The active path string.
- `route.meta`: User-defined custom metadata attached to the route configuration.

### (3) Code Examples

#### Short Snippet
```vue
<script setup>
import { useRouter } from 'vue-router'

// 1. Get the router instance
const router = useRouter()

function goToSettings() {
  // 2. Navigate programmatically to '/settings'
  router.push('/settings')
}
</script>

<template>
  <button @click="goToSettings">Settings Panel</button>
</template>
```

#### Fuller Example
Below is a login component that handles form submission, shows a loading state, and redirects the user to their original destination (stored in the query string) upon success using `router.replace()`.

```vue
<!-- Login.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const isLoading = ref(false)

async function login() {
  isLoading.value = true
  
  try {
    // Simulate authentication API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if the user was redirected here from a private route
    // e.g. /login?redirect=/admin
    const destination = route.query.redirect || '/dashboard'
    
    // Redirect using replace so they can't press back to log out
    router.replace(destination)
  } catch (err) {
    console.error('Authentication failed', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="login">
    <input v-model="username" type="text" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />
    
    <button :disabled="isLoading">
      {{ isLoading ? 'Logging in...' : 'Login' }}
    </button>
  </form>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `useRouter` with `useRoute`

**The mistake:** Calling navigation methods (like `.push`) on `useRoute()`, or reading URL params off `useRouter()`.

**Why it's wrong:** They are separate tools. `useRouter` represents the active router engine, while `useRoute` represents the static data details of the page you are currently viewing.

*Incorrect:*
```javascript
import { useRoute } from 'vue-router'
const route = useRoute()

function goHome() {
  route.push('/') // Error: route.push is not a function!
}
```

*Fix:*
```javascript
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

function goHome() {
  router.push('/') // Correct!
}
```

**Golden Rule:** Use `useRouter()` to *go* somewhere; use `useRoute()` to read *where* you are.

---

### Mistake 2: Mixing `path` with `params` in `router.push()` (Params Ignored Trap)

**The mistake:** Writing `router.push({ path: '/user', params: { id: '5' } })`.

**Why it's wrong:** If `path` is specified in `router.push()`, `params` are completely IGNORED by Vue Router. Use named routes (`name` + `params`) or construct the path string directly.

*Incorrect:*
```javascript
router.push({ path: '/user', params: { id: 5 } }); // ❌ params are IGNORED when path is provided!
```

*Fix:*
```javascript
// Use named route with params:
router.push({ name: 'user-details', params: { id: 5 } });
// Or string template:
router.push(`/user/${id}`);
```

---

### Mistake 3: Accessing `this.$router` inside `<script setup>` (Composition API)

**The mistake:** Attempting to call `this.$router.push('/dashboard')` inside `<script setup>`.

**Why it's wrong:** `this` is undefined inside `<script setup>`. Import and call the `useRouter()` composable instead.

*Incorrect:*
```vue
<script setup>
function navigate() {
  this.$router.push('/dashboard'); // ❌ TypeError: Cannot read properties of undefined!
}
</script>
```

*Fix:*
```vue
<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function navigate() {
  router.push('/dashboard');
}
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Build a Back Button

**Problem:** You are building a checkout page. Add a button that returns the user to the previous step in their browser history when clicked. Fill in the handler using `useRouter`.

```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  // Implement back navigation
}
</script>

<template>
  <button @click="goBack">Go Back</button>
</template>
```

**Expected output:**
```text
Clicking the button triggers `router.back()` or `router.go(-1)` to navigate back.
```

> [!check]- Answer
> - The router instance has a dedicated `.back()` method.
> - Alternatively, you can use `.go(-1)`.

---

### Exercise 2: router.push Navigation Variants

**Problem:** Write `router.push()` calls for:
1. Path string navigation to `/dashboard` 
2. Named route `'user-profile'` with params `{ id: 10 }` 
3. Route navigation with query parameter `{ search: 'vue' }` 

**Expected output:**
```javascript
1. router.push('/dashboard');
2. router.push({ name: 'user-profile', params: { id: 10 } });
3. router.push({ path: '/search', query: { search: 'vue' } });
```

> [!check]- Answer
> - String path: `router.push('/path')`
> - Named route with params: `router.push({ name, params })`
> - Query parameters: `router.push({ path, query })`
> 
> ```javascript
> router.push('/dashboard');
> router.push({ name: 'user-profile', params: { id: 10 } });
> router.push({ path: '/search', query: { search: 'vue' } });
> ```

---

### Exercise 3: router.replace vs router.push

**Problem:** Contrast `router.push('/login')` vs `router.replace('/login')` regarding browser history stack.

**Expected output:**
```text
router.push() adds a new entry to the browser history stack; router.replace() replaces the current entry without adding a new history step.
```

> [!check]- Answer
> - `push()` -> Adds new entry to history (Back button returns to previous page).
> - `replace()` -> Overwrites current history entry (Back button skips replaced page).
> 
> ```javascript
> router.replace('/login');
> ```


---

## 7. Related Terms
- [Vue Router](../level_06/vue_router.md) — The routing ecosystem package.
- [Navigation Guards](../level_06/navigation_guards.md) — Global, per-route, or in-component middleware.
- [Router View / Router Link](../level_06/router_view_link.md) — Template elements for displaying and declaring route links.

---

## 8. Key Takeaways
- **Programmatic Navigation** enables routing changes from within script blocks rather than template links.
- **`useRouter()`** fetches the router engine instance, giving you access to `push`, `replace`, and `go` methods.
- **`useRoute()`** fetches the current active route descriptor, containing parameters, queries, and metadata.
- Use `router.push()` when you want the user to be able to navigate back. Use `router.replace()` to replace the current history record (e.g. after login or logout).
- Never mix up their scopes: Router is the action runner, Route is the data snapshot.
