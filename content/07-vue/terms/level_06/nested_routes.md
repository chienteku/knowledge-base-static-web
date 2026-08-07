# Nested Routes

> **Level 6 — Routing (Vue Router)**
> A feature in Vue Router where UI components are nested inside other components, matched to nested URL path segments (e.g. `/user/profile` inside `/user`).

---

## 1. Prerequisites

- [Vue Router](vue_router.md) — The base routing system.
- [Router View / Router Link](router_view_link.md) — The HTML tag required to make nesting work.

---

## 2. Term Category

**Vue Ecosystem (Layout Architecture / Hierarchical Routing)**: Nested Routes is a Vue Router structural pattern that maps nested URL path segments to nested UI component hierarchies via the `children` configuration array. It allows parent layout components (e.g. `/settings`) to retain persistent UI frames (sidebars, navigation tabs, top bars) while dynamically swapping child sub-views (`/settings/profile`, `/settings/security`) inside an inner `<RouterView />` viewport.

Unlike top-level route switching—where navigating to a new URL replaces the entire page component—nested routes preserve parent layout state, mounted DOM nodes, and component instances during sub-route navigation. In React Router v6+, nested routing is configured similarly using nested `<Route>` tags and the `<Outlet />` component. Vue Router uses the `children` array and nested `<RouterView />` tags.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex Single-Page Applications (such as cloud admin portals or email clients), user interfaces are composed of multi-level nested visual layouts. For example, navigating between `/settings/profile` and `/settings/security` requires changing only the inner content pane, while keeping the main app header, settings sidebar navigation, and user status footer perfectly intact.

Without nested routes, developers had to duplicate layout wrappers across every single view component or write complex conditional `v-if` tab switching code. Nested Routes solves this by aligning URL path segments directly with component layout hierarchies (`/settings` -> `SettingsLayout.vue`, `/profile` -> `ProfileTab.vue`).

### (2) Reality Metaphor
Think of Nested Routes like a Tabbed Office Ring-Binder. The outer ring-binder cover and section divider tabs (the parent layout component) remain permanently open on your desk. When you flip between sub-tabs—such as "Financial Records" versus "Tax Filings" (the child routes)—you flip only the inner paper pages placed behind that specific divider tab. You do not replace the entire physical ring binder frame; you swap only the inner page content visible through the active section window.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// router.js - Nested route configuration using `children` array
const routes = [
  {
    path: '/user',
    component: UserLayout, // Parent component containing <RouterView />
    children: [
      { path: 'profile', component: UserProfile }, // Matches /user/profile (NO leading slash!)
      { path: 'posts', component: UserPosts }       // Matches /user/posts
    ]
  }
]
```

```vue
<!-- UserLayout.vue - Parent layout with inner <RouterView /> -->
<template>
  <div class="user-layout">
    <aside class="sidebar">
      <RouterLink to="/user/profile">Profile</RouterLink>
      <RouterLink to="/user/posts">Posts</RouterLink>
    </aside>
    <main class="content-pane">
      <!-- Nested child component renders HERE! -->
      <RouterView />
    </main>
  </div>
</template>
```

#### Fuller Example
```javascript
// router.js - Enterprise Settings Layout Configuration
import { createRouter, createWebHistory } from 'vue-router'
import SettingsLayout from './views/SettingsLayout.vue'
import GeneralSettings from './views/GeneralSettings.vue'
import SecuritySettings from './views/SecuritySettings.vue'
import BillingSettings from './views/BillingSettings.vue'

const routes = [
  {
    path: '/settings',
    component: SettingsLayout,
    children: [
      // Empty path child route acts as default view when landing on /settings
      {
        path: '',
        name: 'settings-default',
        component: GeneralSettings
      },
      {
        path: 'security',
        name: 'settings-security',
        component: SecuritySettings
      },
      {
        path: 'billing',
        name: 'settings-billing',
        component: BillingSettings
      }
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
```

```vue
<!-- SettingsLayout.vue (Parent Layout Shell) -->
<script setup>
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="settings-container">
    <header class="settings-header">
      <h2>Account & Workspace Settings</h2>
    </header>

    <div class="settings-body">
      <!-- Persistent Sidebar Navigation -->
      <nav class="settings-nav">
        <RouterLink to="/settings" exact-active-class="active">General</RouterLink>
        <RouterLink to="/settings/security" active-class="active">Security & 2FA</RouterLink>
        <RouterLink to="/settings/billing" active-class="active">Billing & Invoices</RouterLink>
      </nav>

      <!-- Dynamic Child Viewport -->
      <section class="settings-view">
        <RouterView />
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-container { display: flex; flex-direction: column; }
.settings-body { display: flex; gap: 24px; }
.settings-nav { display: flex; flex-direction: column; width: 200px; }
.active { font-weight: bold; color: #42b883; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Adding a Leading Slash (`/`) to Child Route Paths

**The mistake:** Writing `path: '/profile'` inside the `children` array of parent path `/user`.

**Why it's wrong:** In Vue Router, paths starting with a leading slash `/` are treated as root paths. Writing `path: '/profile'` overrides parent path nesting, matching URL `/profile` instead of `/user/profile`.

*Incorrect:*
```javascript
// ❌ Matches /profile instead of /user/profile because of leading slash!
{
  path: '/user',
  component: UserLayout,
  children: [
    { path: '/profile', component: UserProfile }
  ]
}
```

*Fix:* Omit leading slashes for nested child paths:
```javascript
{
  path: '/user',
  component: UserLayout,
  children: [
    { path: 'profile', component: UserProfile } // Correctly matches /user/profile
  ]
}
```

---

### Mistake 2: Forgetting the `<RouterView />` Placeholder inside Parent Layout Components

**The mistake:** Configuring nested child routes in `router.js`, but omitting the `<RouterView />` tag inside the parent `UserLayout.vue` component template.

**Why it's wrong:** Vue Router needs an explicit `<RouterView />` injection tag inside the parent component's template to know where to render the active child component. Without it, the URL updates, but the child view component never renders on screen.

*Incorrect:*
```vue
<!-- UserLayout.vue without <RouterView /> -->
<template>
  <div class="user-layout">
    <h1>User Layout Header</h1>
    <!-- ❌ Missing <RouterView />: child components cannot render! -->
  </div>
</template>
```

*Fix:*
```vue
<template>
  <div class="user-layout">
    <h1>User Layout Header</h1>
    <RouterView /> <!-- Child view renders here -->
  </div>
</template>
```

---

### Mistake 3: Omitting Default Child Route (`path: ''`)

**The mistake:** Defining nested sub-routes (`path: 'profile'`, `path: 'security'`) without providing a default child route for when users navigate directly to top-level `/settings`.

**Why it's wrong:** When a user navigates to `/settings`, Vue Router matches the parent component, but since no child path matches, the inner `<RouterView />` remains completely blank.

*Incorrect:*
```javascript
children: [
  { path: 'profile', component: Profile } // Blank inner view when visiting /settings directly!
]
```

*Fix:* Include an empty string path `path: ''` child route:
```javascript
children: [
  { path: '', component: GeneralSettings }, // Renders by default at /settings
  { path: 'profile', component: Profile }
]
```

---

## 5. Practice Exercises

### Exercise 1: Enterprise HR Portal Department Layout

**Scenario:** An HR portal requires a `/department` route with persistent department header navigation and two nested sub-views: `/department/overview` and `/department/payroll`.

**Requirements:**
1. Configure nested routes with `children` array.
2. Parent `DepartmentLayout.vue` contains persistent header and `<RouterView />`.
3. Provide default child route `path: ''` rendering Overview.
4. Verify link active state classes.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // router.js
> import { createRouter, createWebHistory } from 'vue-router';
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     {
>       path: '/department',
>       component: {
>         template: `
>           <div class="dept-layout">
>             <header>
>               <RouterLink to="/department" exact-active-class="active">Overview</RouterLink>
>               <RouterLink to="/department/payroll" active-class="active">Payroll</RouterLink>
>             </header>
>             <RouterView />
>           </div>
>         `
>       },
>       children: [
>         { path: '', component: { template: '<div>Dept Overview Content</div>' } },
>         { path: 'payroll', component: { template: '<div>Payroll Ledger Content</div>' } }
>       ]
>     }
>   ]
> });
> ```
>
> #### Technical Explanation
> 1. **`children` Configuration**: Defines nested child routes relative to parent `/department` path.
> 2. **Relative Path Syntax**: `path: ''` and `path: 'payroll'` omit leading slashes to inherit parent path.
> 3. **Persistent Shell**: `<div class="dept-layout">` header navigation stays mounted during sub-view transitions.
> 4. **Active Class Matching**: `exact-active-class="active"` ensures clean visual tab highlight handling.
> 
---

### Exercise 2: Financial Analytics Multi-Tab Dashboard

**Scenario:** A financial analytics system routes `/analytics` with nested tabs `/analytics/stocks` and `/analytics/crypto`. The root `/analytics` path must render `StocksView` by default.

**Requirements:**
1. Configure `path: ''` redirecting or aliasing to `stocks`.
2. Include per-route title metadata in child routes.
3. Validate child route matching via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> 
> const AnalyticsLayout = {
>   template: `
>     <div class="analytics-shell">
>       <h2>Financial Analytics Hub</h2>
>       <RouterView />
>     </div>
>   `
> };
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     {
>       path: '/analytics',
>       component: AnalyticsLayout,
>       children: [
>         { path: '', redirect: '/analytics/stocks' },
>         { path: 'stocks', component: { template: '<div>Stock Analytics</div>' }, meta: { title: 'Stocks' } },
>         { path: 'crypto', component: { template: '<div>Crypto Analytics</div>' }, meta: { title: 'Crypto' } }
>       ]
>     }
>   ]
> });
> ```
>
> #### Technical Explanation
> 1. **Default Redirect**: `path: '', redirect: '/analytics/stocks'` automatically forwards users landing on `/analytics` to the primary stocks view.
> 2. **Metadata Nesting**: Child route `meta` dictionaries inherit context cleanly during navigation evaluation.
> 3. **Viewport Mounting**: Parent `AnalyticsLayout` retains outer container DOM elements across tab switches.
> 4. **Sub-Route Match Purity**: Path resolution maintains strict component tree mapping.
> 
---

### Exercise 3: Healthcare EHR Patient Records Nested Parameter Route

**Scenario:** An Electronic Health Record (EHR) application routes patient charts using `/patient/:id`. It requires nested sub-views `/patient/:id/vitals` and `/patient/:id/history`. Demonstrate parameter inheritance in child components.

**Requirements:**
1. Define dynamic parent route `/patient/:id`.
2. Define child routes `vitals` and `history`.
3. Child components access inherited `:id` parameter via `useRoute().params.id`.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> import { useRoute } from 'vue-router';
> 
> const PatientLayout = {
>   template: `
>     <div class="patient-shell">
>       <h1>Patient Record Shell</h1>
>       <RouterView />
>     </div>
>   `
> };
> 
> const VitalsChild = {
>   setup() {
>     const route = useRoute();
>     return { patientId: route.params.id };
>   },
>   template: '<div>Vitals for Patient ID: {{ patientId }}</div>'
> };
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     {
>       path: '/patient/:id',
>       component: PatientLayout,
>       children: [
>         { path: '', redirect: to => `/patient/${to.params.id}/vitals` },
>         { path: 'vitals', component: VitalsChild },
>         { path: 'history', component: { template: '<div>Medical History</div>' } }
>       ]
>     }
>   ]
> });
> ```
>
> #### Technical Explanation
> 1. **Parameter Inheritance**: Child routes automatically inherit dynamic path parameters (`:id`) declared on parent route segments.
> 2. **Dynamic Redirect Handling**: `redirect: to => ...` uses destination route params to construct valid dynamic default child redirects.
> 3. **Sub-View Isolation**: `VitalsChild` reads `route.params.id` directly without requiring explicit prop passing from parent layout.
> 4. **Scalable Layout Architecture**: Allows complex patient management tabs to share a single root parameter context.
> 
---

## 6. Related Terms

- [Router View / Router Link](router_view_link.md) — The `<RouterView>` component must be used in the parent to render the nested children.
- [Vue Router](vue_router.md) — The overarching library.
- [Dynamic Routing](dynamic_routing.md) — Related concept: Dynamic Routing.

---

## 7. Key Takeaways

- **Nested Routes** map hierarchical URL path segments to nested component layout trees using the `children` array.
- Allows parent layout components to maintain **persistent UI shells** (sidebars, nav bars) while swapping sub-views in an inner `<RouterView />`.
- Child route paths in `children` MUST omit leading slashes (`path: 'profile'`, NOT `path: '/profile'`).
- Always place a **`<RouterView />`** inside the parent layout component template to render active child sub-views.
- Include an empty path child route (**`path: ''`**) or redirect to handle default sub-view rendering when users navigate directly to top-level parent URLs.
