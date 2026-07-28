# Vue Instance

> **Level 1 — Core Concepts & Reactivity**
> The root object that boots up and controls a Vue.js application, linking the framework's logic to a specific HTML element on the page.

---

## 1. Prerequisites
- [DOM Manipulation](../../../01-html/terms/level_09/dom.md) — What the Vue Instance is ultimately controlling.

---

## 2. Term Category
- **Vue Core Concept / Architecture**

---

## 3. Environment Context
- **Client-Side (Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you load the Vue.js framework into a browser, nothing happens automatically. Vue needs to be told exactly *where* it is allowed to operate. You might have a traditional PHP or Ruby on Rails website, and you only want Vue to control a tiny `<div id="shopping-cart"></div>` in the corner.
The **Vue Instance** is the ignition key. It creates the application, configures global settings, and "mounts" (attaches) the Vue engine to a specific piece of the real HTML DOM.

### (2) How it works (Vue 3)
In modern Vue (Vue 3), you create an instance using `createApp()`. You pass it your root component (usually called `App`), and then call `.mount('#app')` to attach it to an HTML element with the id of `app`.

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'

// 1. Create the application instance
const app = createApp(App)

// 2. You can register global tools here (like Vue Router or Pinia)
// app.use(router)

// 3. Mount it to the physical DOM
app.mount('#app')
```

### (3) The App Context
The instance returned by `createApp()` provides an "application context". Any global configurations you apply to `app` (like global components, plugins, or error handlers) will be shared by every single component inside that specific Vue application.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to mount to the `<body>` or `<html>` tag

**The mistake:** A developer writes `app.mount('body')`.

**Why it's wrong:** Vue completely takes over the element it is mounted to, replacing its contents. Browsers and third-party scripts (like analytics tools) often inject elements directly into the `<body>`. If Vue mounts to the body, it will destroy or conflict with those elements, causing fatal errors.
**Golden Rule:** Always mount your Vue instance to a dedicated, empty container element, typically `<div id="app"></div>`.

---

### Mistake 2: Mounting the Root Vue Application Instance Before Registering Global Plugins

**The mistake:** Calling `app.mount('#app')` before calling `app.use(router)` or `app.use(pinia)`.

**Why it's wrong:** Calling `app.mount()` initializes the root component tree. Registering plugins after mounting means components fail to access router or store injections.

*Incorrect:*
```javascript
const app = createApp(App);
app.mount('#app');
app.use(router); // ❌ Registered AFTER mount!
```

*Fix:*
```javascript
const app = createApp(App);
app.use(router); // Register plugins before mounting
app.use(pinia);
app.mount('#app');
```

---

### Mistake 3: Attempting to Mount Multiple Vue Apps to the Same Target DOM Element ID

**The mistake:** Calling `app1.mount('#app')` and `app2.mount('#app')` on the same HTML container.

**Why it's wrong:** Mounting replaces or claims control over target DOM container inner HTML. Mounting multiple apps to one element overwrites the DOM root.

*Incorrect:*
```javascript
app1.mount('#app');
app2.mount('#app'); // ❌ Overwrites app1 DOM container!
```

*Fix:*
```javascript
app1.mount('#app-one');
app2.mount('#app-two'); // Mount to distinct DOM containers
```


---

## 6. Practice Exercises

### Exercise 1: Multiple Instances

**Problem:** You are migrating a legacy jQuery application to Vue. You want Vue to manage the Navigation Bar at the top of the page, and the Chat Box at the bottom, but the middle of the page must remain legacy PHP HTML. Can you do this?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! You can create MULTIPLE Vue instances on the same page.
> `createApp(Navbar).mount('#nav')`
> `createApp(Chatbox).mount('#chat')`
> They will operate completely independently of each other.
> ```
> - Vue is a "Progressive Framework", meaning it can control as much or as little of the page as you want.

---

### Exercise 2: Vue 3 Root Application Creation Pattern

**Problem:** Write JavaScript code creating a Vue 3 application instance from `App.vue`, adding Pinia plugin, and mounting to `#app`.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { createApp } from 'vue'; import { createPinia } from 'pinia'; import App from './App.vue'; const app = createApp(App); app.use(createPinia()); app.mount('#app');
> ```
> - `createApp(RootComponent)` creates application context.
> - Install plugins with `.use()`.
> - Mount instance with `.mount('#app')`.
> 
> ```javascript
> import { createApp } from 'vue';
> import { createPinia } from 'pinia';
> import App from './App.vue';
> 
> const app = createApp(App);
> app.use(createPinia());
> app.mount('#app');
> ```

---

### Exercise 3: Global Component Registration

**Problem:** Which method on the Vue application instance registers a component globally across the app?

**Expected output:**
> [!check]- Answer
> ```text
> app.component('MyComponent', MyComponent)
> ```
> - `app.component(name, Component)` registers global components.
> 
> ```javascript
> app.component('BaseButton', BaseButton);
> ```


---

## 7. Related Terms
- [Components](../level_04/components.md) — What the Vue Instance actually renders.
- [Virtual DOM](../level_08/virtual_dom.md) — The engine that the Vue instance boots up.

---

## 8. Key Takeaways
- The **Vue Instance** (`createApp`) is the starting point of every Vue application.
- It must be explicitly "mounted" to a real HTML element using `.mount('#id')`.
- It acts as the global context for registering plugins, routers, and global state.
- Never mount the app directly to the `<body>` tag.
- You can have multiple, isolated Vue instances running on a single HTML page.
