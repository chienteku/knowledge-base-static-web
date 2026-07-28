# `app.config.ts`

> **Level 6 — SEO & Configuration**
> A configuration file located at the root of your project used to store public, reactive, design-related variables (like theme colors or UI states) that are bundled directly into your client payload.

---

## 1. Prerequisites
- [Auto-imports](../level_01/auto_imports.md) — How the app config is exposed to components.
- Vue Reactivity ([`ref` / `reactive`](../../../07-vue/terms/level_02/ref.md)) — Understanding dynamic reactive objects.

---

## 2. Term Category
- **Configuration**

---

## 3. Environment Context
- **Build-Time** (Exposed to both Client & Server).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Updating the config at runtime

**Problem:** You have an app config defining `{ ui: { compactMode: false } }`. Write the `<script setup>` logic for a button that toggles `compactMode` between true and false.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup lang="ts">
> const appConfig = useAppConfig();
> 
> function toggleCompact() {
>   appConfig.ui.compactMode = !appConfig.ui.compactMode;
> }
> </script>
> ```
> - Retrieve the reactive config object by executing `useAppConfig()` and modify its values within the function.

---

### Exercise 2: defineAppConfig Setup Pattern

**Problem:** Write `app.config.ts` defining UI theme colors and site title, and a Vue component consuming theme state via `useAppConfig()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> // app.config.ts
> export default defineAppConfig({
>   theme: { primaryColor: '#3b82f6' }
> });
> // Component:
> <script setup>
> const appConfig = useAppConfig();
> </script>
> ```
> - `useAppConfig()` exposes reactive UI configuration defined in `app.config.ts`.
> 
> ```typescript
> // app.config.ts
> export default defineAppConfig({
>   theme: {
>     primaryColor: '#10b981',
>     darkMode: true
>   },
>   siteTitle: 'My Nuxt 3 App'
> });
> ```

---

### Exercise 3: app.config.ts vs runtimeConfig Distinction

**Problem:** Compare `app.config.ts` vs `runtimeConfig` in `nuxt.config.ts`.

**Expected output:**
> [!check]- Answer
> ```text
> app.config.ts: Public build-time UI theme/styling config (bundled in client JS, reactive at runtime);
> runtimeConfig: Server/Client environment configuration populated by .env variables.
> ```
> - `app.config.ts` -> Public UI theme & styling settings.
> - `runtimeConfig` -> Server & Client `.env` environment secrets.
> 
> ```text
> app.config.ts = UI Theme & Styling; runtimeConfig = Environment Secrets & APIs.
> ```


---

## 7. Related Terms
- [Runtime Config (`useRuntimeConfig`)](../level_06/runtime_config.md) — The secure alternative used for private API keys and `.env` variables.
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — The build-time framework configuration file.

---

## 8. Key Takeaways
- `app.config.ts` is for public, reactive, UI-focused application settings.
- It is bundled entirely into the client payload.
- It is accessed using `useAppConfig()`.
- You can mutate its values at runtime to instantly update the UI.
- Never store secret API keys here.
