# Nested Routes

> **Level 6 — Routing (Vue Router)**
> A Vue Router architecture where a parent Route has its own child Routes, allowing you to nest components inside other components, matching nested URL structures.

---

## 1. Prerequisites
- [Vue Router](vue_router.md) — The base routing system.
- [Router View / Router Link](router_view_link.md) — The HTML tag required to make nesting work.
---

## 2. Term Category
- **Vue Ecosystem / Routing Architecture**

---

## 3. Environment Context
- **Vue Router Configuration**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a complex User Settings page. 
- `/settings` (Shows the main Settings layout with a sidebar)
- `/settings/profile` (Shows the Profile form inside the layout)
- `/settings/billing` (Shows the Billing form inside the layout)

You don't want to redefine the Sidebar in both the `Profile.vue` and `Billing.vue` components. You want the `Settings.vue` component to serve as a wrapper, and dynamically inject the correct child component into its center based on the URL. This is exactly what **Nested Routes** do.

### (2) The Configuration (`children` array)
In your `router.js`, you add a `children` array to a parent route.
```javascript
// router.js
const routes = [
  {
    path: '/settings',
    component: SettingsLayout,
    children: [
      // When URL is /settings/profile, load ProfileForm
      { path: 'profile', component: ProfileForm },
      // When URL is /settings/billing, load BillingForm
      { path: 'billing', component: BillingForm }
    ]
  }
]
```
*Note: Child paths do NOT start with a `/`. Vue Router automatically appends them to the parent path.*

### (3) The Component Structure
For this to work, the parent component (`SettingsLayout.vue`) MUST contain its own `<RouterView />` tag. This acts as the "hole" where the children will be injected.

```vue
<!-- SettingsLayout.vue (Parent) -->
<template>
  <div class="layout">
    <aside>Settings Sidebar Here</aside>
    
    <main>
      <!-- The nested child component will render right here! -->
      <RouterView />
    </main>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the default child route

**The mistake:** A user navigates exactly to `/settings`. The sidebar loads, but the main content area is completely blank.

**Why it's wrong:** The URL `/settings` doesn't match any of the children (`profile` or `billing`). Therefore, the nested `<RouterView>` renders nothing.
**Golden Rule:** Always provide a default child route with an empty path (`path: ''`), or redirect the parent path to a specific child!
```javascript
children: [
  // If they go to exactly /settings, render the Profile by default!
  { path: '', component: ProfileForm } 
]
```

---

### Mistake 2: Forgetting the `<RouterView />` Tag in Parent Layout Components

**The mistake:** Defining child routes inside `children: [...]` without adding a `<RouterView />` component in the parent component layout template.

**Why it's wrong:** Child route components render INSIDE the parent component's template where `<RouterView />` is placed. Omitting `<RouterView />` in the parent layout prevents child route components from rendering.

*Incorrect:*
```vue
<!-- ParentLayout.vue missing <RouterView /> -->
<template>
  <div><h1>Parent Layout</h1></div> <!-- ❌ Child routes fail to render! -->
</template>
```

*Fix:*
```vue
<!-- ParentLayout.vue -->
<template>
  <div>
    <h1>Parent Layout</h1>
    <RouterView /> <!-- Renders child route components -->
  </div>
</template>
```

---

### Mistake 3: Adding Leading Slashes `/` to Child Route Path Strings

**The mistake:** Writing `children: [{ path: '/profile', component: Profile }]`.

**Why it's wrong:** A leading slash `/` treats the child path as a ROOT PATH (`/profile`), ignoring the parent route path prefix. For nested paths, omit leading slashes (`path: 'profile'`).

*Incorrect:*
```javascript
{
  path: '/user/:id',
  component: UserLayout,
  children: [{ path: '/profile', component: Profile }] // ❌ Resolves as /profile instead of /user/:id/profile!
}
```

*Fix:*
```javascript
{
  path: '/user/:id',
  component: UserLayout,
  children: [{ path: 'profile', component: Profile }] // Omit leading slash for relative nesting
}
```


---

## 6. Practice Exercises

### Exercise 1: The Slash Problem

**Problem:** You configure a child route like this:
`{ path: '/settings', children: [{ path: '/billing' }] }`. 
What URL actually triggers the billing component?

**Expected output:**
> [!check]- Answer
> ```text
> The URL is exactly `/billing`, NOT `/settings/billing`!
> If a nested path starts with a `/`, Vue Router treats it as an absolute root path. 
> To nest it correctly under the parent, it must not have a leading slash: `{ path: 'billing' }`.
> ```
> - A slash `/` means "Start at the very beginning of the domain".

---

### Exercise 2: Nested Route Structure Setup

**Problem:** Write routes definition array for parent `/settings` containing 2 nested child routes: `profile` (`SettingsProfile`) and `security` (`SettingsSecurity`).

**Expected output:**
> [!check]- Answer
> ```javascript
> [{ path: '/settings', component: SettingsLayout, children: [{ path: 'profile', component: SettingsProfile }, { path: 'security', component: SettingsSecurity }] }]
> ```
> - `children` array defines nested child route routes.
> - Omit leading slashes for nested child paths.
> 
> ```javascript
> const routes = [
>   {
>     path: '/settings',
>     component: SettingsLayout,
>     children: [
>       { path: 'profile', component: SettingsProfile },
>       { path: 'security', component: SettingsSecurity }
>     ]
>   }
> ];
> ```

---

### Exercise 3: Default Nested Child Route

**Problem:** How do you specify a default nested child route that renders when the user visits the parent path `/settings` directly?

**Expected output:**
> [!check]- Answer
> ```text
> By adding a child route with an empty path: { path: '', component: DefaultChild }.
> ```
> - Empty string `path: ''` defines default child route.
> 
> ```javascript
> children: [{ path: '', component: SettingsOverview }]
> ```


---

## 7. Related Terms
- [Router View / Router Link](router_view_link.md) — The `<RouterView>` component must be used in the parent to render the nested children.
- [Vue Router](vue_router.md) — The overarching library.
---

## 8. Key Takeaways
- **Nested Routes** allow you to build complex UI layouts where a parent component wraps varying child components based on the URL.
- Configured using the `children` array inside a route definition.
- Child paths should **not** begin with a slash (`/`), or they will be treated as absolute root paths.
- The parent component MUST include its own `<RouterView />` to act as the rendering placeholder for the child.
- Always configure an empty path (`path: ''`) as a default child so the view isn't blank when the user navigates exactly to the parent URL.
