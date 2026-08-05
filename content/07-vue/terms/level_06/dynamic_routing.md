# Dynamic Routing

> **Level 6 — Routing (Vue Router)**
> A technique in Vue Router where parts of the URL are treated as variables (parameters), allowing a single Route configuration to handle thousands of different URLs.

---

## 1. Prerequisites
- [Vue Router](vue_router.md) — The system that parses the URLs.

---

## 2. Term Category
- **Vue Ecosystem / Routing**

---

## 3. Environment Context
- **Vue Router Configuration**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building Twitter. Users have profile pages: `twitter.com/alice` and `twitter.com/bob`.
If you hardcoded your routes, your configuration file would be infinite:
`{ path: '/alice', component: Profile }`
`{ path: '/bob', component: Profile }`
Instead, you need a way to tell the router: "If the URL matches `/ANYTHING`, load the Profile component, and pass the 'ANYTHING' string into the component so it knows whose data to fetch." This is **Dynamic Routing**.

### (2) Route Parameters (`:`)
In your route configuration, you define a dynamic segment by prefixing a word with a colon `:`.

```javascript
// router.js
const routes = [
  // The `:username` is a dynamic parameter!
  { path: '/user/:username', component: UserProfile }
]
```
If the user navigates to `/user/alice`, Vue Router will load the `UserProfile` component.

### (3) Accessing the Parameter
Inside the `UserProfile.vue` component, you use the `useRoute()` composable to extract the variable from the URL.

```vue
<!-- UserProfile.vue -->
<script setup>
import { useRoute } from 'vue-router'

// 1. Get the current route object
const route = useRoute()

// 2. Access the dynamic parameter we named `:username`
const currentUsername = route.params.username

// Now we can use `currentUsername` to fetch data from our API!
console.log(`Fetching data for ${currentUsername}...`)
</script>

<template>
  <h1>Profile: {{ route.params.username }}</h1>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Component Re-use Data Stagnation

**The mistake:** A user is on `/user/alice`. They click a link to go to `/user/bob`. The URL changes, but the page still shows Alice's data!

**Why it's wrong:** Vue is incredibly efficient. Because the component `<UserProfile>` is already mounted on the screen, Vue *re-uses* it. It does not destroy it and recreate it. Therefore, the `onMounted` lifecycle hook does NOT run again, so your API fetch for "bob" never happens!
**Golden Rule:** If a component is reacting to URL parameter changes, you must `watch` the parameter, OR you must add a `:key` to the `<RouterView>` to force Vue to destroy and rebuild the component.
`watch(() => route.params.username, (newUsername) => fetchProfile(newUsername))`

---

### Mistake 2: Assuming Component Lifecycle Hooks Re-Run When Navigating Between Same Dynamic Routes

**The mistake:** Navigating from `/user/1` to `/user/2` and expecting `onMounted()` to re-fire.

**Why it's wrong:** Vue Router reuses the same component instance when navigating between routes matching the same dynamic path pattern (`/user/:id`). `onMounted()` does NOT re-fire. Watch `route.params.id` or use `onBeforeRouteUpdate()`.

*Incorrect:*
```javascript
onMounted(() => {
  fetchUserData(route.params.id); // ❌ Does NOT re-run when navigating /user/1 -> /user/2!
});
```

*Fix:*
```javascript
watch(
  () => route.params.id,
  (newId) => { fetchUserData(newId); },
  { immediate: true }
);
```

---

### Mistake 3: Forgetting Catch-All Wildcard Route Syntax for 404 Pages in Vue Router 4

**The mistake:** Using Vue Router 3 syntax `{ path: '*' }` for 404 Page Not Found routes in Vue Router 4.

**Why it's wrong:** Vue Router 4 dropped regex wildcards. Custom catch-all routes require explicit parameter regex syntax: `{ path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }`.

*Incorrect:*
```javascript
const routes = [
  { path: '*', component: NotFound } // ❌ Deprecated syntax in Vue Router 4!
];
```

*Fix:*
```javascript
const routes = [
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];
```


---

## 6. Practice Exercises

### Exercise 1: Multiple Parameters

**Problem:** You are building an e-commerce site. You want a route that looks like this: `/category/shoes/item/nike-air`. How do you define this in the `router.js`?

**Expected output:**
> [!check]- Answer
> ```javascript
> const routes = [
>   { path: '/category/:categoryId/item/:itemId', component: ItemView }
> ]
> // Inside the component, you access them via:
> // route.params.categoryId (evaluates to 'shoes')
> // route.params.itemId (evaluates to 'nike-air')
> ```
> - You can have as many colons as you want in a single path.

---

### Exercise 2: Dynamic Route Parameter Definition

**Problem:** Write Vue Router route definition object matching path `/users/:id` to component `UserProfile` with named route `'user-profile'`.

**Expected output:**
> [!check]- Answer
> ```javascript
> { path: '/users/:id', name: 'user-profile', component: UserProfile }
> ```
> - `:id` defines dynamic route parameter segments.
> 
> ```javascript
> const routes = [
>   { path: '/users/:id', name: 'user-profile', component: UserProfile }
> ];
> ```

---

### Exercise 3: Optional Route Parameters

**Problem:** How do you define an optional dynamic route parameter segment in Vue Router 4?

**Expected output:**
> [!check]- Answer
> ```text
> By appending a question mark `?` to the parameter name (e.g. `/users/:id?`).
> ```
> - `:param?` specifies optional route parameters.
> 
> ```javascript
> { path: '/users/:id?', component: UserList }
> ```


---

## 7. Related Terms
- [Vue Router](vue_router.md) — The parent library.
- [Watchers](../level_02/watchers.md) — The tool needed to detect when dynamic parameters change.
- [Route Params, Query & Meta](route_params_query_meta.md) — Related concept: Route Params, Query & Meta.

---

## 8. Key Takeaways
- **Dynamic Routing** uses a colon (`:paramName`) to treat a segment of the URL as a variable.
- It allows a single component to handle an infinite number of URLs.
- You extract the variable inside the component using `useRoute().params.paramName`.
- Because Vue reuses components when only the parameter changes, lifecycle hooks (`onMounted`) will not re-fire. You must watch the route parameters for changes to trigger new data fetches.
