# `nuxt.config.ts`

> **Level 6 — SEO & Configuration**
> The supreme configuration file of a Nuxt project, used to define build-time settings, register Nuxt modules, configure Nitro, and inject global HTML meta tags.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — Nuxt is "zero-config" by default, but this is where you override those defaults.
- [Modules (import/export)](../../../03-javascript/terms/level_08/modules.md) — Understanding the export format of the configuration object.

---

## 2. Term Category

**Framework Architecture** (Master Platform Configuration): `nuxt.config.ts` is the central configuration file for Nuxt 3 applications, controlling modules, Nitro settings, build targets, and TypeScript configuration.



---

## 3. Explanation

### Environment Context
- **Build-Time**

### (1) Design Motivation — "Why did we design this?"
Nuxt is heavily opinionated and relies on "Convention over Configuration." Most of the time, you don't need to configure Vite, Nitro, or the Vue router—they just work.

However, when you need to deviate from the defaults—like adding a Google Fonts module, defining a global CSS file, setting up a proxy for the server, or changing the directory structure—you need a single source of truth. `nuxt.config.ts` is that source.

### (2) Core Structure
The file exports a `defineNuxtConfig` block. This is evaluated purely by Node.js at build time. It is never sent to the browser.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Global CSS/SCSS files
  css: ['~/assets/scss/main.scss'],

  // Nuxt Modules (like Pinia, Tailwind, Nuxt Image)
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  // Global default <head> configuration
  app: {
    head: {
      title: 'Default Site Title',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  // Developer Tools
  devtools: { enabled: true }
})
```

### (3) The `app.head` configuration
While `useHead` allows you to set the `<head>` dynamically on a per-page basis, `nuxt.config.ts` allows you to set the **global defaults**. 

If a page does not call `useHead`, it falls back to whatever is defined in `app.head` inside `nuxt.config.ts`. This is the perfect place to set the `lang` attribute, global viewports, and favicons.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to import Vue code into `nuxt.config.ts`
**The mistake:** Importing a Vue component, a Pinia store, or a Composable directly into `nuxt.config.ts` to use its logic.

**Why it's wrong:** `nuxt.config.ts` runs in a Node.js build environment *before* the Vue application even exists. Trying to run client-side Vue logic here will crash the build process.
**Golden Rule:** Keep `nuxt.config.ts` strictly for static JSON-like configurations and build-time settings.

---

### Mistake 2: Exporting Plain Untyped Config Objects Without `defineNuxtConfig`

**The mistake:** Writing `export default { modules: [...] }` in `nuxt.config.ts`.

**Why it's wrong:** Without `defineNuxtConfig()`, TypeScript cannot provide auto-completion, schema validation, or type checking for configuration options.

*Incorrect:*
```typescript
// nuxt.config.ts
export default {
  modules: ['@pinia/nuxt'] // ❌ Untyped plain config object!
};
```

*Fix:*
```vue
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'] // Strongly typed Nuxt 3 config helper
});
```

---

### Mistake 3: Adding Non-Existent Module Strings to `modules` Array (Build Failures)

**The mistake:** Adding `@nuxtjs/axios` to Nuxt 3 `modules` array.

**Why it's wrong:** Nuxt 2 modules like `@nuxtjs/axios` are incompatible with Nuxt 3. Nuxt 3 uses `$fetch` and `useFetch` out-of-the-box, eliminating Axios requirements.

*Incorrect:*
```vue
export default defineNuxtConfig({
  modules: ['@nuxtjs/axios'] // ❌ Incompatible Nuxt 2 module!
});
```

*Fix:*
```vue
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'] // Nuxt 3 compatible modules
});
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Environment Modules and Extensions

**Scenario:**
Configure `@pinia/nuxt` and `@nuxtjs/tailwindcss` modules inside `nuxt.config.ts`.

**Requirements:**
1. Add modules to `modules` array in `defineNuxtConfig`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   modules: [
>     "@pinia/nuxt",
>     "@nuxtjs/tailwindcss"
>   ],
>   devtools: { enabled: true }
> });
> ```

> #### Technical Explanation
>
> 1. `modules` array registers official and third-party Nuxt modules.
> 2. Modules extend Nuxt's build process, auto-import composables, and register plugins automatically.
> 3. Central extension point in Nuxt 3.

---

### Exercise 2: Setting Route-Level Rendering Rules with `routeRules`

**Scenario:**
Configure SWR (Stale-While-Revalidate) caching for `/blog/**` and static prerendering for `/about`.

**Requirements:**
1. Configure `routeRules` in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/about": { prerender: true },           // Prerendered static HTML at build time
>     "/blog/**": { swr: 3600 },               // Cached for 1 hour with background revalidation
>     "/api/uncached/**": { cache: false }     // Never cached
>   }
> });
> ```

> #### Technical Explanation
>
> 1. `routeRules` powers Nuxt 3's Hybrid Rendering architecture.
> 2. `prerender: true` generates static HTML files during `nuxt build`.
> 3. `swr: 3600` caches Nitro responses at the edge/server for 3600 seconds.

---

### Exercise 3: Configuring Custom Vite and Server Options

**Scenario:**
Pass custom Vite plugin configurations and server port options inside `nuxt.config.ts`.

**Requirements:**
1. Configure `vite` and `devServer` sections.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   devServer: {
>     port: 3000,
>     host: "0.0.0.0"
>   },
>   vite: {
>     optimizeDeps: {
>       include: ["lodash-es"]
>     }
>   }
> });
> ```

> #### Technical Explanation
>
> 1. `vite` property exposes underlying Vite bundler configuration options.
> 2. `devServer` configures local development HTTP host and port settings.
> 3. Low-level bundler and server customization interface.

---




---

## 6. Related Terms
- [`app.config.ts`](app_config.md) — The configuration file meant for reactive, client-side UI state.
- [Runtime Config (`useRuntimeConfig`)](runtime_config.md) — How you pass `.env` variables through `nuxt.config.ts`.
- [`assets/` vs `public/`](../level_03/assets_vs_public.md) — Related concept: `assets/` vs `public/`.
- [Nuxt Modules System](../level_09/nuxt_modules.md) — Related concept: Nuxt Modules System.
- [Nuxt DevTools](../level_10/nuxt_devtools.md) — Related concept: Nuxt DevTools.
- [Route Rules Configuration](../level_08/route_rules.md) — Route rules.

---

## 7. Key Takeaways
- `nuxt.config.ts` configures the Nuxt framework and its underlying tools (Vite, Nitro).
- It runs entirely at build time.
- It is where you register third-party Nuxt Modules (like Pinia or Tailwind).
- Use `app.head` to define fallback, global HTML meta tags.
