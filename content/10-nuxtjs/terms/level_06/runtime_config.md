# Runtime Config (`useRuntimeConfig`)

> **Level 6 — SEO & Configuration**
> The secure configuration system used to manage environment variables (`.env`), explicitly separating private backend secrets from public frontend keys.

---

## 1. Prerequisites
- [`nuxt.config.ts`](nuxt_config.md) — Where the Runtime Config schema is defined.
- [Node.js (Runtime Environment)](../../../05-nodejs/terms/level_01/nodejs.md) — The server environment hosting standard process configs.

---

## 2. Term Category
- **Configuration**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a Node.js app, you read environment variables using `process.env.MY_SECRET`. 
In a Vite/Vue app, you read them using `import.meta.env.VITE_MY_SECRET`.

Because Nuxt is a full-stack framework spanning both Node (Nitro) and the Browser (Vite), checking `.env` variables becomes a nightmare. Even worse, if you accidentally expose a backend database password to the browser, your entire system is compromised.

**Runtime Config** creates a single, unified, strictly-typed API (`useRuntimeConfig`) to access environment variables. It enforces a strict separation between what is safely sent to the browser and what is locked on the server.

### (2) Defining the Config
You must explicitly define your runtime config schema inside `nuxt.config.ts`. 

- Any key placed directly inside `runtimeConfig` is **PRIVATE** (Server-only).
- Any key placed inside `runtimeConfig.public` is **PUBLIC** (Server & Client).

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys: NEVER sent to the browser.
    // Nuxt automatically populates this with process.env.STRIPE_SECRET_KEY
    stripeSecretKey: '', 
    databasePassword: '',

    public: {
      // Public keys: Sent to the browser payload.
      // Nuxt automatically populates this with process.env.NUXT_PUBLIC_API_BASE
      apiBaseUrl: '/api'
    }
  }
})
```

### (3) Using the Config
To access the variables in your Vue components or Nitro server routes, you use the auto-imported `useRuntimeConfig()` composable.

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
const config = useRuntimeConfig();

// Works perfectly in the browser!
console.log(config.public.apiBaseUrl);

// If you try to access this in the browser, it will be undefined!
// It is only accessible inside Nitro server routes.
console.log(config.stripeSecretKey); 
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trusting `.env` files blindly without defining them in `nuxt.config.ts`
**The mistake:** Adding `MY_API_KEY=123` to a `.env` file and trying to access it using `process.env.MY_API_KEY` inside a Vue component.

**Why it's wrong:** Nuxt 3 purposely restricts raw `process.env` access in Vue components to prevent accidental security leaks.
**Golden Rule:** Every environment variable you intend to use MUST be explicitly defined in the `runtimeConfig` object in `nuxt.config.ts`, and accessed via `useRuntimeConfig()`.

---

### Mistake 2: Exposing Private Server Keys by Putting Them in `runtimeConfig.public`

**The mistake:** Placing database password inside `runtimeConfig.public.dbPassword` in `nuxt.config.ts`.

**Why it's wrong:** Any property placed under `runtimeConfig.public` is serialized into client JavaScript bundles sent to the browser. Keep server secrets at top-level `runtimeConfig`.

*Incorrect:*
```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      dbSecret: 'password' // ❌ Exposed to browser client bundles!
    }
  }
});
```

*Fix:*
```vue
export default defineNuxtConfig({
  runtimeConfig: {
    dbSecret: 'password', // Private server-only property
    public: {
      apiBase: 'https://api.example.com' // Public client property
    }
  }
});
```

---

### Mistake 3: Attempting to Access Private `runtimeConfig` Keys inside Client Components

**The mistake:** Calling `const config = useRuntimeConfig(); console.log(config.dbSecret)` inside a Client Component.

**Why it's wrong:** Private `runtimeConfig` keys exist ONLY on the server environment. On the client browser, private keys evaluate to `undefined`.

*Incorrect:*
```vue
<script setup>
const config = useRuntimeConfig();
console.log(config.dbSecret); // ❌ Undefined on client browser!
</script>
```

*Fix:*
```vue
<script setup>
const config = useRuntimeConfig();
console.log(config.public.apiBase); // Access public runtimeConfig properties on client
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Public vs Private

**Problem:** You have a Stripe Publishable Key (`STRIPE_PUB_KEY`) that is safe for the browser, and a Stripe Secret Key (`STRIPE_SEC_KEY`) that must never leave the server. Write the `runtimeConfig` block in `nuxt.config.ts` to accommodate both.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   runtimeConfig: {
>     stripeSecKey: process.env.STRIPE_SEC_KEY,
>     public: {
>       stripePubKey: process.env.STRIPE_PUB_KEY
>     }
>   }
> })
> ```
> - Define private variables directly under `runtimeConfig` and public ones under `runtimeConfig.public` using process env references.

---

### Exercise 2: runtimeConfig Server & Client Setup Pattern

**Problem:** Write `nuxt.config.ts` `runtimeConfig` defining private `stripeSecretKey` and public `apiBaseUrl`, and a Server API handler reading `stripeSecretKey`.

**Expected output:**
> [!check]- Answer
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   runtimeConfig: {
>     stripeSecretKey: '',
>     public: { apiBaseUrl: '/api' }
>   }
> });
> // Server handler:
> export default defineEventHandler((event) => {
>   const config = useRuntimeConfig(event);
>   return config.stripeSecretKey;
> });
> ```
> - `useRuntimeConfig()` accesses server and client environment variables.
> 
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   runtimeConfig: {
>     stripeSecret: process.env.STRIPE_SECRET_KEY,
>     public: {
>       apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
>     }
>   }
> });
> ```

---

### Exercise 3: NUXT_ Environment Variable Override Rule

**Problem:** How can environment variable `NUXT_STRIPE_SECRET` override `runtimeConfig.stripeSecret` at runtime without re-building?

**Expected output:**
> [!check]- Answer
> ```text
> Nitro automatically overrides matching runtimeConfig keys using NUXT_ pre-fixed environment variables at application startup.
> ```
> - `NUXT_KEY` environment variables override `runtimeConfig.key` dynamically.
> 
> ```bash
> NUXT_STRIPE_SECRET="sk_test_123" node .output/server/index.mjs
> ```


---

## 7. Related Terms
- [`app.config.ts`](app_config.md) — The alternative config meant for non-secret, UI-related theme variables.
- [`nuxt.config.ts`](nuxt_config.md) — Related concept: `nuxt.config.ts`.
- [Environment Variables (`.env`)](../level_10/env_variables.md) — Related concept: Environment Variables (`.env`).

---

## 8. Key Takeaways
- `useRuntimeConfig()` is the only safe way to access environment variables in Nuxt 3.
- The schema MUST be defined in `nuxt.config.ts`.
- Top-level variables in `runtimeConfig` are strictly private (Server-only).
- Variables inside `runtimeConfig.public` are exposed to the Client.
