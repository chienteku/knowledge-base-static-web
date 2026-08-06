# `app.config.ts`

> **Level 6 — SEO & Configuration**
> A configuration file located at the root of your project used to store public, reactive, design-related variables (like theme colors or UI states) that are bundled directly into your client payload.

---

## 1. Prerequisites
- [Auto-imports](../level_01/auto_imports.md) — How the app config is exposed to components.
- [`nuxt.config.ts`](nuxt_config.md) — Configuring application-level reactive constants.

---

## 2. Term Category

**Framework Architecture** (Build-Time UI App Configuration): `app.config.ts` defines build-time reactive configuration options (theme tokens, UI colors) accessible on both server and client.



---

## 3. Explanation

### Environment Context
- **Build-Time** (Exposed to both Client & Server).

### (1) Design Motivation — "Why did we design this?"
In a large application, you often have public configuration values that dictate how the UI looks or behaves. For example, a primary brand color, a toggle to enable/disable a specific UI feature, or the URL of your CDN.

You *could* hardcode these in every component, but that's unmaintainable. You *could* put them in environment variables (`.env`), but environment variables are rigid and typically meant for secret backend keys, not public UI state. 

`app.config.ts` was created to hold public, reactive application settings that are needed during the Vue rendering lifecycle.

### (2) Defining App Config
You create the `app.config.ts` file at the absolute root of your project (alongside `app.vue`).

```typescript
// app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#ff0000',
    darkModeEnabled: true
  },
  socials: {
    twitter: 'https://twitter.com/nuxt_js'
  }
})
```

### (3) Using App Config
To access these values anywhere in your application, you use the auto-imported `useAppConfig()` composable. Because it is highly integrated with Nuxt, it has perfect TypeScript support.

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
const appConfig = useAppConfig();
</script>

<template>
  <div :style="{ color: appConfig.theme.primaryColor }">
    <h1>Welcome!</h1>
    <a :href="appConfig.socials.twitter">Follow us</a>
  </div>
</template>
```

### (4) Reactivity
A unique feature of `app.config.ts` is that the values returned by `useAppConfig()` are **reactive**. If you mutate `appConfig.theme.primaryColor = '#00ff00'` during runtime, your entire UI will update instantly!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing secrets in `app.config.ts`
**The mistake:** Putting API keys, database passwords, or private tokens inside `app.config.ts`.

**Why it's wrong:** Everything in `app.config.ts` is bundled directly into the JavaScript sent to the browser. Any user can open DevTools and see these values.
**Golden Rule:** NEVER put private secrets in `app.config.ts`. If it is a secret, it MUST go into `.env` and be managed by `useRuntimeConfig()`.

---

### Mistake 2: Storing Secret API Keys inside `app.config.ts` (Browser Bundle Exposure)

**The mistake:** Placing secret database passwords or private API tokens in `app.config.ts`.

**Why it's wrong:** `app.config.ts` values are bundled into the public client JavaScript build sent to all browsers. Use `runtimeConfig.secretKey` for server-only environment secrets.

*Incorrect:*
```typescript
// app.config.ts
export default defineAppConfig({
  apiSecret: '12345' // ❌ Bundled into public client JS!
});
```

*Fix:*
```vue
// Use runtimeConfig in nuxt.config.ts for server secrets;
// Use app.config.ts ONLY for public theme/UI configuration
```

---

### Mistake 3: Expecting `app.config.ts` Values to Be Overridden by `.env` Environment Variables

**The mistake:** Adding `NUXT_THEME_COLOR=blue` in `.env` expecting `app.config.ts` to update.

**Why it's wrong:** `app.config.ts` is a static build-time UI configuration file that does NOT automatically read `.env` environment variables. Use `runtimeConfig` for `.env` integration.

*Incorrect:*
```vue
/* Trying to override app.config.ts values with NUXT_ env vars in .env */
```

*Fix:*
```vue
/* Use useRuntimeConfig() for .env overrides; Use useAppConfig() for build UI themes */
```


---

## 5. Practice Exercises

### Exercise 1: Defining Application UI Tokens in `app.config.ts`

**Scenario:**
Define UI theme colors and navigation links in `app.config.ts`.

**Requirements:**
1. Export `defineAppConfig({ theme: { ... } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app.config.ts
> export default defineAppConfig({
>   theme: {
>     primaryColor: "#3b82f6",
>     darkMode: true,
>     brandName: "Enterprise Cloud"
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `app.config.ts` manages non-sensitive, public UI theme tokens and component configurations.
> 2. Values are bundled directly into the application JavaScript build.
> 3. Accessible reactively via `useAppConfig()`.
> 
---

### Exercise 2: Mutating App Config Reactively via `updateAppConfig()`

**Scenario:**
Dynamically update primary theme color at runtime using `updateAppConfig()`.

**Requirements:**
1. Call `updateAppConfig({ theme: { primaryColor: "#ef4444" } })`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const appConfig = useAppConfig();
> 
> function setRedTheme() {
>   updateAppConfig({
>     theme: {
>       primaryColor: "#ef4444"
>     }
>   });
> }
> </script>
> 
> <template>
>   <div>
>     <p>Current Color: {{ appConfig.theme.primaryColor }}</p>
>     <button @click="setRedTheme">Apply Red Theme</button>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `useAppConfig()` exposes a reactive object populated from `app.config.ts`.
> 2. `updateAppConfig()` mutates properties reactively at runtime across components.
> 3. Ideal for runtime design system theme toggling.
> 
---

### Exercise 3: Architectural Trade-Off: `appConfig` vs `runtimeConfig`

**Scenario:**
Formulate an architectural selection matrix explaining when to use `appConfig` vs `runtimeConfig`.

**Requirements:**
1. Contrast build-time bundling vs environment variable overrides.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Configuration Matrix:
> - appConfig: Public build-time UI tokens (theme colors, icons). HMR enabled, NOT overridable by environment variables.
> - runtimeConfig: Server API secrets, database credentials, public API base URLs. Overridable via process.env!
> ```
> 
> #### Technical Explanation
>
> 1. `appConfig` is bundled at compile time and cannot be overridden by environment variables after building.
> 2. `runtimeConfig` is evaluated dynamically at runtime, allowing environment variables (`NUXT_API_SECRET`) to override values.
> 3. Standard configuration separation rule.
> 
---


## 6. Related Terms
- [Runtime Config (`useRuntimeConfig`)](runtime_config.md) — The secure alternative used for private API keys and `.env` variables.
- [`nuxt.config.ts`](nuxt_config.md) — The build-time framework configuration file.

---

## 7. Key Takeaways
- `app.config.ts` is for public, reactive, UI-focused application settings.
- It is bundled entirely into the client payload.
- It is accessed using `useAppConfig()`.
- You can mutate its values at runtime to instantly update the UI.
- Never store secret API keys here.
