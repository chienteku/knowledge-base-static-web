# Environment Variables (`.env`)

> **Level 10 — Error Handling & Production**
> The standard file used to securely inject secret API keys, database passwords, and environment-specific configuration into your Nuxt application without hardcoding them into your source code.

---

## 1. Prerequisites
- [Runtime Config (`useRuntimeConfig`)](../level_06/runtime_config.md) — The only secure way to access the variables defined in this `.env` file.
- [Standalone Build (Node server)](../level_10/standalone_build.md) — Understanding how environment variables inject configurations at runtime.

---

## 2. Term Category
- **Security**

---

## 3. Environment Context
- **Server / Build-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Mapping deeply nested configs

**Problem:** You have a `runtimeConfig` object that looks like this:
```typescript
runtimeConfig: {
  redis: {
    password: ''
  }
}
```
What is the exact name of the environment variable you must place in your `.env` file to auto-populate this value?

**Expected output:**
> [!check]- Answer
> ```text
> NUXT_REDIS_PASSWORD="my_password"
> ```
> - Uppercase snake_case prefix with double underscores `NUXT_REDIS_PASSWORD` maps to `runtimeConfig.redis.password` using uppercase-to-camelcase conversion.

---

### Exercise 2: runtimeConfig NUXT_ Env Prefix Pattern

**Problem:** Write `runtimeConfig` in `nuxt.config.ts` matching `.env` variable `NUXT_API_SECRET=123`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   runtimeConfig: {
>     apiSecret: ''
>   }
> });
> ```
> - `NUXT_API_SECRET` automatically overrides `runtimeConfig.apiSecret`.
> 
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   runtimeConfig: {
>     apiSecret: '' // Overridden by NUXT_API_SECRET in .env
>   }
> });
> ```

---

### Exercise 3: useRuntimeConfig Access Rule

**Problem:** Which property scope on `useRuntimeConfig()` can be safely accessed inside client Vue components?

**Expected output:**
> [!check]- Answer
> ```text
> useRuntimeConfig().public
> ```
> - `useRuntimeConfig().public` is accessible on both server and client.
> 
> ```typescript
> const config = useRuntimeConfig();
> console.log(config.public.apiBase);
> ```


---

## 7. Related Terms
- [Runtime Config (`useRuntimeConfig`)](../level_06/runtime_config.md) — The feature that consumes the `.env` file.

---

## 8. Key Takeaways
- `.env` is a git-ignored file used to store private keys and environment-specific URLs.
- Never prefix secret keys with `VITE_`.
- Nuxt automatically maps `.env` variables starting with `NUXT_` to the `runtimeConfig` object.
- Variables starting with `NUXT_PUBLIC_` are safely mapped to `runtimeConfig.public`.
