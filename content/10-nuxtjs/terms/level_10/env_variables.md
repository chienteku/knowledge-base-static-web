# Environment Variables (`.env`)

> **Level 10 — Error Handling & Production**
> The standard file used to securely inject secret API keys, database passwords, and environment-specific configuration into your Nuxt application without hardcoding them into your source code.

---

## 1. Prerequisites
- [Runtime Config (`useRuntimeConfig`)](../level_06/runtime_config.md) — The only secure way to access the variables defined in this `.env` file.
- [Standalone Build (Node server)](standalone_build.md) — Understanding how environment variables inject configurations at runtime.

---

## 2. Term Category

**Security & Middleware** (Environment Variable Management): Environment Variables configure server secrets and runtime parameters using `.env` files and `runtimeConfig` mappings.



---

## 3. Explanation

### Environment Context
- **Server / Build-Time**

### (1) Design Motivation — "Why did we design this?"
When you deploy an application to production, you must connect to a production database (e.g., MongoDB). When you run the app locally, you want to connect to a local development database. 

If you hardcode the database URL in your code, you have to manually change it every time you deploy. Even worse, if you commit a file containing a Stripe Secret Key to GitHub, hackers can steal it and steal your money.

The `.env` (Environment) file solves this. It is a plain text file that is specifically ignored by Git (`.gitignore`). It allows you to define variables that change depending on where the app is running.

### (2) Core Concept
You create a file literally named `.env` at the absolute root of your project.

```text
# .env
DATABASE_URL="postgres://user:pass@localhost:5432/mydb"
STRIPE_SECRET_KEY="sk_test_123456789"
NUXT_PUBLIC_API_BASE="https://api.mysite.com"
```

### (3) Auto-mapping to Runtime Config
Nuxt 3 has a magical feature regarding `.env` files. If you name an environment variable carefully, Nuxt will automatically map it to your `nuxt.config.ts` Runtime Config without you writing any code.

If your config looks like this:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecret: '', // Expected to be private
    public: {
      apiBase: ''     // Expected to be public
    }
  }
})
```

You can automatically populate those values by prefixing your `.env` variables with `NUXT_`:

```text
# Populates runtimeConfig.stripeSecret
NUXT_STRIPE_SECRET="sk_test_123"

# Populates runtimeConfig.public.apiBase
NUXT_PUBLIC_API_BASE="https://api.mysite.com"
```
Nuxt automatically converts the uppercase snake_case to camelCase!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Prefixing secrets with `VITE_`
**The mistake:** Writing `VITE_DATABASE_PASSWORD=123` in the `.env` file and expecting it to be secure.

**Why it's wrong:** Nuxt uses Vite under the hood. In Vite, any environment variable prefixed with `VITE_` is **automatically exposed to the browser payload**. If you do this with a database password, any user can open DevTools and read your password.
**Golden Rule:** Never use the `VITE_` prefix in Nuxt. Always use the `runtimeConfig` system paired with the `NUXT_` prefix to guarantee strict separation of public and private keys.

---

### Mistake 2: Exposing Private Database Secrets by Prefixing with `NUXT_PUBLIC_`

**The mistake:** Naming database password variable `NUXT_PUBLIC_DB_PASSWORD=secret` in `.env`.

**Why it's wrong:** Environment variables prefixed with `NUXT_PUBLIC_` are exposed to public browser client bundles. Keep secret keys without the `PUBLIC_` prefix.

*Incorrect:*
```text
# .env file
NUXT_PUBLIC_DB_PASS=secret // ❌ Bundled into public client JavaScript!
```

*Fix:*
```text
# .env file
NUXT_DB_PASS=secret // Private server-only environment variable
```

---

### Mistake 3: Committing `.env` or `.env.local` Files to Version Control Repositories

**The mistake:** Pushing `.env` files containing live production API keys to GitHub.

**Why it's wrong:** Committing secrets to Git repositories exposes API keys to security breaches. Always list `.env*` in your `.gitignore` file.

*Incorrect:*
```vue
/* Committing .env file to public GitHub repository */
```

*Fix:*
```vue
/* Add .env to .gitignore; Use .env.example for template structure */
```


---

## 5. Practice Exercises

### Exercise 1: Loading `.env` Variables into `runtimeConfig`

**Scenario:**
Define environment variables in `.env` and map them into `nuxt.config.ts`.

**Requirements:**
1. Set `DATABASE_URL` and `NUXT_PUBLIC_SITE_URL` in `.env`.

> [!check]- Answer
>
> #### Implementation
>
> ```ini
> # .env
> DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
> NUXT_PUBLIC_SITE_URL="https://example.com"
> ```
> 
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   runtimeConfig: {
>     databaseUrl: "", // Overridden by DATABASE_URL or NUXT_DATABASE_URL
>     public: {
>       siteUrl: "" // Overridden by NUXT_PUBLIC_SITE_URL
>     }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Nuxt 3 automatically loads `.env` key-value pairs during development and build runtime.
> 2. `NUXT_PUBLIC_SITE_URL` automatically populates `runtimeConfig.public.siteUrl`.
> 3. Standard environment variable loading workflow.
> 
---

### Exercise 2: Accessing Environment Variables Safely on Server vs Client

**Scenario:**
Demonstrate accessing public variables on client and private variables on server.

**Requirements:**
1. Use `useRuntimeConfig()` in client and server code.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- Client Component -->
> <script setup lang="ts">
> const config = useRuntimeConfig();
> // Safe: Public site URL is accessible in client browser
> const siteUrl = config.public.siteUrl;
> </script>
> ```
> 
> ```typescript
> // Server Endpoint (server/api/db.ts)
> export default defineEventHandler((event) => {
>   const config = useRuntimeConfig(event);
>   // Safe: Database URL is accessible on Node.js server ONLY
>   return { dbUrl: config.databaseUrl };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `config.public` properties are embedded into client JavaScript bundles.
> 2. Top-level `runtimeConfig` properties are stripped from client bundles, preventing credential leaks.
> 3. Secure environment variable access model.
> 
---

### Exercise 3: Validating Required Environment Variables at Startup

**Scenario:**
Throw an immediate build error if critical environment variables are missing during startup.

**Requirements:**
1. Check `process.env` in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
>   throw new Error("FATAL: DATABASE_URL environment variable is missing!");
> }
> 
> export default defineNuxtConfig({
>   runtimeConfig: {
>     databaseUrl: process.env.DATABASE_URL
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Validating environment variables at application startup prevents runtime 500 errors later.
> 2. Halts deployment pipelines immediately if required secrets are absent.
> 3. Production deployment sanity check.
> 
---


## 6. Related Terms
- [Runtime Config (`useRuntimeConfig`)](../level_06/runtime_config.md) — The feature that consumes the `.env` file.
- [Standalone Build (Node server)](standalone_build.md) — Related concept: Standalone Build (Node server).

---

## 7. Key Takeaways
- `.env` is a git-ignored file used to store private keys and environment-specific URLs.
- Never prefix secret keys with `VITE_`.
- Nuxt automatically maps `.env` variables starting with `NUXT_` to the `runtimeConfig` object.
- Variables starting with `NUXT_PUBLIC_` are safely mapped to `runtimeConfig.public`.
