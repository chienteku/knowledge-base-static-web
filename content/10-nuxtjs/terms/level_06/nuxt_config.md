# `nuxt.config.ts`

> **Level 6 — SEO & Configuration**
> The supreme configuration file of a Nuxt project, used to define build-time settings, register Nuxt modules, configure Nitro, and inject global HTML meta tags.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — Nuxt is "zero-config" by default, but this is where you override those defaults.
- [JavaScript Modules (`import`/`export`)](../../../03-javascript/terms/level_08/modules.md) — Understanding the export format of the configuration object.

---

## 2. Term Category
- **Configuration**

---

## 3. Environment Context
- **Build-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Registering Global CSS

**Problem:** You have written a CSS reset file located at `assets/css/reset.css`. How do you configure Nuxt to include this CSS file on every single page of your app?

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   css: [
>     '~/assets/css/reset.css'
>   ]
> })
> ```
> - Place the asset alias path `'~/assets/css/reset.css'` inside the `css` array property of the configuration object.

---

### Exercise 2: nuxt.config.ts Production Configuration Pattern

**Problem:** Write `nuxt.config.ts` configuring TypeScript strict mode, CSS file `'~/assets/css/main.css'`, and modules `'@pinia/nuxt'`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   typescript: { strict: true },
>   css: ['~/assets/css/main.css'],
>   modules: ['@pinia/nuxt']
> });
> ```
> - `defineNuxtConfig` configures global project settings.
> 
> ```typescript
> export default defineNuxtConfig({
>   devtools: { enabled: true },
>   typescript: { strict: true },
>   css: ['~/assets/css/main.css'],
>   modules: ['@pinia/nuxt']
> });
> ```

---

### Exercise 3: routeRules Configuration Option

**Problem:** Which property in `nuxt.config.ts` enables hybrid rendering rules per route path?

**Expected output:**
> [!check]- Answer
> ```text
> routeRules (e.g. routeRules: { '/admin/**': { ssr: false } })
> ```
> - `routeRules` configures per-route hybrid rendering strategies.
> 
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/admin/**': { ssr: false }
>   }
> });
> ```


---

## 7. Related Terms
- [`app.config.ts`](../level_06/app_config.md) — The configuration file meant for reactive, client-side UI state.
- [Runtime Config (`useRuntimeConfig`)](../level_06/runtime_config.md) — How you pass `.env` variables through `nuxt.config.ts`.

---

## 8. Key Takeaways
- `nuxt.config.ts` configures the Nuxt framework and its underlying tools (Vite, Nitro).
- It runs entirely at build time.
- It is where you register third-party Nuxt Modules (like Pinia or Tailwind).
- Use `app.head` to define fallback, global HTML meta tags.
