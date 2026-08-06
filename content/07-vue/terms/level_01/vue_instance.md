# Vue Instance

> **Level 1 — Core Concepts & Reactivity**
> The root application instance created by `createApp()` that initializes, configures, and mounts a Vue application onto a target DOM container.

---

## 1. Prerequisites

- [DOM (Document Object Model)](../../../01-html/terms/level_09/dom.md) — The browser DOM tree that the Vue Instance attaches to and controls.
- [Single-File Components (SFCs)](../level_04/sfc.md) — The root component loaded by the application instance.

---

## 2. Term Category

**Vue Application Runtime / Core Architecture (Application Context)**: The Vue Instance (created via `createApp(RootComponent)` in Vue 3) is the central ignition object of every Vue application. It establishes an isolated application context responsible for configuring global settings, registering plugins (Pinia, Vue Router), declaring global components/directives, and mounting the root component tree onto a physical HTML element.

Unlike Vue 2's monolithic `new Vue()` constructor which mutated global configurations across all instances on the window object, Vue 3's `createApp()` returns a factory-created application instance. This architecture prevents global state configuration leaks, enabling multiple isolated Vue apps to run safely on the same page or within server-side rendering (SSR) environments.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In legacy web applications (PHP, Ruby on Rails, legacy jQuery), web pages were rendered on the server as giant monolithic HTML documents. When frontend frameworks arrived, developers needed a way to introduce reactive UI components into specific regions of an existing HTML page without forcing a complete rewrite of the whole website.

The **Vue Instance** was designed as the progressive entry point. You initialize a Vue instance, configure its plugins, and "mount" (attach) it to a specific HTML DOM element (e.g. `<div id="app"></div>`). Vue takes ownership of that target element, booting up its reactive Virtual DOM renderer inside that container while leaving surrounding page HTML untouched.

In Vue 3, `createApp()` modernized this pattern. Instead of a shared global constructor, `createApp()` produces distinct application instances. Each instance maintains its own isolated registry for component definitions, directives, and injected dependency providers.

### (2) Reality Metaphor
Think of an Electrical Power Grid Substation powering a modern office building.

The raw web page is the empty building structure. You don't rebuild the entire skyscraper just to light up the 4th floor. Instead, you install a dedicated Power Substation (The Vue Application Instance `createApp()`). You wire in your specific breakers and transformers (Registering Router and Pinia plugins with `.use()`), and then flip the main switch to connect the power grid to the 4th floor electrical panel (`.mount('#fourth-floor')`).

The substation controls electricity specifically for its designated floor. You can even install a second independent substation on the 10th floor (`createApp(App2).mount('#tenth-floor')`) without electrical interference between floors.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'

// 1. Create isolated root application instance
const app = createApp(App)

// 2. Mount application instance to target DOM container
app.mount('#app')
```

#### Fuller Example
```javascript
// main.js - Production Application Bootstrap Configuration
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'

// 1. Initialize root instance
const app = createApp(App)

// 2. Configure global plugins (Router & Pinia)
const pinia = createPinia()
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: () => import('./views/HomeView.vue') }]
})

app.use(pinia)
app.use(router)

// 3. Register global components & directives
app.component('BaseButton', BaseButton)
app.directive('focus', {
  mounted: (el) => el.focus()
})

// 4. Configure global error handling handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global Vue Error Captured:', err, info)
}

// 5. Mount application to target HTML container `#app`
app.mount('#app')
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Mount the Vue Instance directly to `<body>` or `<html>`

**The mistake:** Calling `app.mount('body')` or `app.mount('html')`.

**Why it's wrong:** Vue replaces or completely controls the target DOM element's inner HTML. Mounting to `<body>` causes conflicts with browser extensions, third-party analytics scripts, and native body attributes, throwing fatal DOM mutation exceptions.

*Incorrect:*
```javascript
const app = createApp(App)
app.mount('body') // ❌ Fatal error: Do not mount directly to body or html!
```

*Fix:*
```javascript
const app = createApp(App)
app.mount('#app') // Mount to dedicated container <div id="app"></div>
```

---

### Mistake 2: Registering Plugins or Global Directives AFTER Calling `.mount()`

**The mistake:** Calling `app.use(router)` or `app.component(...)` *after* calling `app.mount('#app')`.

**Why it's wrong:** Calling `app.mount()` synchronously triggers the root component tree creation and lifecycle setup. Plugins registered after mounting are missed during initial rendering, causing missing route or store context errors.

*Incorrect:*
```javascript
const app = createApp(App)
app.mount('#app')
app.use(pinia) // ❌ Registered AFTER initial render mount!
```

*Fix:*
```javascript
const app = createApp(App)
app.use(pinia) // Register plugins BEFORE mounting
app.mount('#app')
```

---

### Mistake 3: Mounting Multiple Vue Instances to the Exact Same DOM Target ID

**The mistake:** Calling `app1.mount('#app')` and `app2.mount('#app')` on the exact same target container element.

**Why it's wrong:** `app.mount()` claims exclusive ownership over the target DOM element's contents. Mounting a second instance to the same element overwrites the DOM markup and destroys the first app's event bindings.

*Incorrect:*
```javascript
app1.mount('#app')
app2.mount('#app') // ❌ Overwrites app1 DOM root container!
```

*Fix:*
```javascript
app1.mount('#app-header')
app2.mount('#app-widget') // Mount to distinct HTML container elements
```

---

## 5. Practice Exercises

### Exercise 1: Multi-Tenant Enterprise Micro-Frontend Mount Configurator

**Scenario:** A enterprise portal runs two isolated micro-frontend Vue apps on a single legacy page (Header Nav App & Live Support App).
**Requirements:**
1. Import `createApp`.
2. Boot `HeaderApp` and mount to `#header-root`.
3. Boot `SupportApp` with Pinia installed and mount to `#support-root`.
4. Verify independent instance creation via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createApp } from 'vue'
> import { createPinia } from 'pinia'
> import HeaderApp from './HeaderApp.vue'
> import SupportApp from './SupportApp.vue'
> 
> // App 1: Header App
> const headerApp = createApp(HeaderApp)
> headerApp.mount('#header-root')
> 
> // App 2: Support App with Pinia
> const supportApp = createApp(SupportApp)
> const pinia = createPinia()
> supportApp.use(pinia)
> supportApp.mount('#support-root')
> 
> // Test assertions verifying distinct instance contexts
> console.assert(headerApp !== supportApp, 'Apps must be distinct instances')
> console.assert(headerApp._context !== supportApp._context, 'Contexts must be isolated')
> ```
>
> #### Technical Explanation
> 1. **Isolated application contexts**: Each `createApp()` invocation generates an independent application context object (`_context`).
> 2. **Multi-instance setup**: Running multiple instances allows micro-frontends to co-exist without global state collisions.
> 3. **Plugin scoping**: `pinia` plugin is registered exclusively on `supportApp` without leaking into `headerApp`.
> 4. **Progressive enhancement**: Vue apps can be embedded surgically into targeted DOM sub-trees.
> 
---

### Exercise 2: Industrial IoT Global Error Handling Bootstrap

**Scenario:** An industrial IoT control app configures a global error boundary handler on its Vue Instance before mounting.
**Requirements:**
1. Create Vue application instance.
2. Register a global `errorHandler` callback on `app.config`.
3. Mount instance to `#iot-dashboard`.
4. Verify error handler assignment via assertion.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createApp } from 'vue'
> import DashboardApp from './DashboardApp.vue'
> 
> const app = createApp(DashboardApp)
> 
> let lastCapturedError = null
> app.config.errorHandler = (err, instance, info) => {
>   lastCapturedError = err
>   console.error(`IoT Error Monitor Captured: ${err.message} [Info: ${info}]`)
> }
> 
> app.mount('#iot-dashboard')
> 
> // Test assertion verifying config binding
> console.assert(typeof app.config.errorHandler === 'function', 'Global error handler must be configured')
> ```
>
> #### Technical Explanation
> 1. **`app.config` object**: Global runtime settings are managed per instance on `app.config`.
> 2. **Centralized error capture**: `errorHandler` intercepts unhandled runtime exceptions across all child components.
> 3. **Pre-mount setup**: Error handlers are configured prior to calling `app.mount()` to ensure startup errors are captured.
> 4. **Instance isolation**: Error settings do not affect other independent Vue apps on the page.
> 
---

### Exercise 3: Financial Analytics Plugin Injection Architecture

**Scenario:** A financial analytics portal registers global utility components on the root instance prior to mounting.
**Requirements:**
1. Initialize instance with root `AnalyticsApp`.
2. Register global component `'MetricCard'`.
3. Mount application to `#analytics-app`.
4. Verify component registration via assertion.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createApp, defineComponent } from 'vue'
> import AnalyticsApp from './AnalyticsApp.vue'
> 
> const MetricCard = defineComponent({
>   template: '<div class="metric-card"><slot></slot></div>'
> })
> 
> const app = createApp(AnalyticsApp)
> app.component('MetricCard', MetricCard)
> app.mount('#analytics-app')
> 
> // Test assertion
> console.assert(app.component('MetricCard') !== undefined, 'MetricCard must be registered globally')
> ```
>
> #### Technical Explanation
> 1. **`app.component()` registry**: Registers components globally across the entire root instance component tree.
> 2. **Fluent instance API**: `createApp()` methods (`.component()`, `.use()`, `.directive()`) can be chained fluently.
> 3. **DOM container target**: `#analytics-app` specifies the exact DOM mount element.
> 4. **Clean SSR isolation**: Global components registered on `app` do not contaminate Node.js server instance request scopes.
> 
---

## 6. Related Terms

- [Single-File Components (SFCs)](../level_04/sfc.md) — The root component loaded by `createApp(RootComponent)`.
- [Pinia](../level_07/pinia.md) — State management plugin installed on the instance via `app.use(pinia)`.
- [Vue Router](../level_06/vue_router.md) — Routing plugin installed on the instance via `app.use(router)`.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — The rendering engine booted up by the application instance.

---

## 7. Key Takeaways

- The **Vue Instance** created via `createApp()` is the starting context of every Vue 3 application.
- Call `.use()`, `.component()`, and `.directive()` **before** invoking `.mount()`.
- Always mount your application to a dedicated container (like `<div id="app"></div>`), **never** to `<body>` or `<html>`.
- Vue 3's `createApp()` architecture isolates instance configurations, enabling safe multi-instance setups and SSR execution.
- Unhandled component exceptions can be captured globally using `app.config.errorHandler`.
