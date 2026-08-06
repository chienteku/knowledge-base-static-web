# Runtime Config (`useRuntimeConfig`)

> **Level 6 — SEO & Configuration**
> The secure configuration system used to manage environment variables (`.env`), explicitly separating private backend secrets from public frontend keys.

---

## 1. Prerequisites
- [`nuxt.config.ts`](nuxt_config.md) — Where the Runtime Config schema is defined.
- [Node.js (Runtime Environment)](../../../05-nodejs/terms/level_01/nodejs.md) — The server environment hosting standard process configs.

---

## 2. Term Category

**Security & Middleware** (Environment & Server Secret Configuration): `runtimeConfig` manages environment variables, keeping private API secret keys isolated to the server while exposing public variables to the client.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Configuring Server-Private vs Public Runtime Config

**Scenario:**
Define a server-only private API secret and a public API base URL in `nuxt.config.ts`.

**Requirements:**
1. Define `runtimeConfig` with `apiSecret` and `public.apiBase`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   runtimeConfig: {
>     apiSecret: "default_server_secret_key", // Server-only secret
>     public: {
>       apiBase: "https://api.example.com"    // Exposed to client and server
>     }
>   }
> });
> ```

> #### Technical Explanation
>
> 1. Properties at the top level of `runtimeConfig` (`apiSecret`) are strictly isolated to the server and stripped from client bundles.
> 2. Properties inside `public` (`public.apiBase`) are exposed to both browser client and server runtime environments.
> 3. Critical security isolation mechanism.

---

### Exercise 2: Overriding Runtime Config with Environment Variables

**Scenario:**
Override `apiSecret` and `public.apiBase` in production using system environment variables.

**Requirements:**
1. Set `NUXT_API_SECRET` and `NUXT_PUBLIC_API_BASE` env vars.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Production Environment Variables (.env or Cloud Platform Config)
> NUXT_API_SECRET="prod_sec_999888777666"
> NUXT_PUBLIC_API_BASE="https://prod-api.example.com"
> ```

> #### Technical Explanation
>
> 1. Nuxt 3 automatically maps environment variables prefixed with `NUXT_` to matching `runtimeConfig` keys.
> 2. `NUXT_API_SECRET` overrides `runtimeConfig.apiSecret`.
> 3. `NUXT_PUBLIC_API_BASE` overrides `runtimeConfig.public.apiBase`.

---

### Exercise 3: Consuming Runtime Config via `useRuntimeConfig()`

**Scenario:**
Access public API base URL in a component and private secret in a Nitro server route.

**Requirements:**
1. Call `useRuntimeConfig()` in Vue component and Nitro handler.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- Inside Vue Component: -->
> <script setup lang="ts">
> const config = useRuntimeConfig();
> // Access public config in client or server code:
> console.log("API Base URL:", config.public.apiBase);
> </script>
> ```

> ```typescript
> // server/api/private.ts
> export default defineEventHandler((event) => {
>   const config = useRuntimeConfig(event);
>   // Access server-only secret safely:
>   return { secret: config.apiSecret };
> });
> ```

> #### Technical Explanation
>
> 1. `useRuntimeConfig()` returns the active runtime configuration object.
> 2. Attempting to access `config.apiSecret` on the client returns `undefined`.
> 3. Guarantees environment variable safety across SSR boundaries.

---




---

## 6. Related Terms
- [`app.config.ts`](app_config.md) — The alternative config meant for non-secret, UI-related theme variables.
- [`nuxt.config.ts`](nuxt_config.md) — Related concept: `nuxt.config.ts`.
- [Environment Variables (`.env`)](../level_10/env_variables.md) — Related concept: Environment Variables (`.env`).

---

## 7. Key Takeaways
- `useRuntimeConfig()` is the only safe way to access environment variables in Nuxt 3.
- The schema MUST be defined in `nuxt.config.ts`.
- Top-level variables in `runtimeConfig` are strictly private (Server-only).
- Variables inside `runtimeConfig.public` are exposed to the Client.
