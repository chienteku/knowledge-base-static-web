# Environment Variables (`.env.local`)

> **Level 10 — Advanced Architecture**
> The secure system Next.js uses to manage secret API keys and configuration settings across different deployment environments (Development, Preview, Production).

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — Essential for understanding the security boundaries of environment variables.
- [Node.js Environment Variables (`process.env`)](../level_10/process_env.md) — The foundational concept.

---

## 2. Term Category
- **Configuration / Security**

---

## 3. Environment Context
- **Server (Default) / Client (Opt-in)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You have a Stripe Secret Key used to process payments. You absolutely cannot commit this key to GitHub, or hackers will steal your money.
Furthermore, your database URL in development (`localhost:5432`) is different than your database URL in production (`aws.rds.com:5432`). 
Next.js provides built-in support for loading `.env` files to keep secrets out of source control and manage different configurations seamlessly.

### (2) The `.env.local` File
In local development, Next.js automatically looks for a file named `.env.local`. You add this file to your `.gitignore`.

```env
# .env.local
DATABASE_URL="postgres://user:pass@localhost:5432/db"
STRIPE_SECRET_KEY="sk_test_12345"
```

Inside your Server Components, Server Actions, or Route Handlers, you access them using `process.env`.

```tsx
// app/actions.ts (Server Action)
export async function processPayment() {
  const stripeKey = process.env.STRIPE_SECRET_KEY; // "sk_test_12345"
  // ...
}
```

### (3) The `NEXT_PUBLIC_` Prefix
By default, **ALL environment variables are strictly hidden from the browser**. If you try to use `process.env.STRIPE_SECRET_KEY` inside a Client Component (`"use client"`), Next.js will replace it with `undefined` to protect you from accidentally leaking secrets in your JavaScript bundle.
If you *want* a variable to be exposed to the browser (like an analytics tracking ID), you MUST prefix it with `NEXT_PUBLIC_`.

```env
# .env.local
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-123456"
```

```tsx
// app/components/Tracker.tsx
"use client";

export default function Tracker() {
  // This works in the browser because of the NEXT_PUBLIC_ prefix!
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  return <div>Tracking: {id}</div>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring `process.env` dynamically

**The mistake:** A developer tries to write a clever utility function to grab variables:
```ts
const getVar = (key: string) => process.env[key]; 
const myKey = getVar('NEXT_PUBLIC_API_KEY'); // ❌ Will return undefined in the browser!
```

**Why it's wrong:** Next.js replaces `NEXT_PUBLIC_` variables in your Client Components at *Build Time* using a webpack text-replacement plugin. It literally looks for the exact string `process.env.NEXT_PUBLIC_API_KEY` and replaces it with `"123"`. If you access the object dynamically, the text-replacer cannot find it, and it will fail.
**Golden Rule:** Always access environment variables explicitly and directly (e.g., `process.env.NEXT_PUBLIC_VAR_NAME`).

---

### Mistake 2: Exposing Private Database Passwords by Adding `NEXT_PUBLIC_` Prefix

**The mistake:** Naming database password variable `NEXT_PUBLIC_DATABASE_PASSWORD=secret` in `.env`.

**Why it's wrong:** Any environment variable prefixed with `NEXT_PUBLIC_` is bundled into client JavaScript sent to all web browsers. Never prefix secret keys with `NEXT_PUBLIC_`.

*Incorrect:*
```text
# .env file
NEXT_PUBLIC_DB_PASS=supersecret // ❌ Bundled into browser client JS!
```

*Fix:*
```text
# .env file
DB_PASS=supersecret // Private server-only variable
```

---

### Mistake 3: Committing `.env.local` Files to Version Control Repositories

**The mistake:** Committing `.env.local` containing live production database credentials to Git.

**Why it's wrong:** Committing secret credentials to Git creates severe security vulnerabilities. Always add `.env*.local` to your `.gitignore` file.

*Incorrect:*
```tsx
/* Committing .env.local file to public GitHub repository */
```

*Fix:*
```tsx
/* Add .env.local to .gitignore; Use .env.example for repository template */
```


---

## 6. Practice Exercises

### Exercise 1: Vercel Deployments

**Problem:** You deployed your app to Vercel, but the app crashed because `process.env.DATABASE_URL` is undefined. You double-checked, and it's definitely in your `.env.local` file! What went wrong?

**Expected output:**
> [!check]- Answer
> ```text
> The `.env.local` file is explicitly ignored by Git (`.gitignore`). It only exists on your laptop!
> When Vercel pulls your code from GitHub to build it, the `.env.local` file is missing. 
> You must log into the Vercel dashboard, go to the Project Settings -> Environment Variables, and manually paste your keys there!
> ```
> - Think about what files are actually pushed to GitHub.

---

### Exercise 2: Environment Variable Priority Resolution

**Problem:** Order Next.js environment file resolution priority (highest to lowest):
`.env`, `.env.local`, `.env.production`

**Expected output:**
> [!check]- Answer
> ```text
> 1. .env.production.local
> 2. .env.local
> 3. .env.production
> 4. .env
> ```
> - `.local` files take precedence over default environment files.
> 
> ```text
> 1. process.env -> 2. .env.production.local -> 3. .env.local -> 4. .env
> ```

---

### Exercise 3: Zod Environment Variable Validation

**Problem:** Write Zod schema validating `process.env` containing `DATABASE_URL` (url) and `NEXT_PUBLIC_API_URL` (url).

**Expected output:**
> [!check]- Answer
> ```typescript
> import { z } from 'zod'; const envSchema = z.object({ DATABASE_URL: z.string().url(), NEXT_PUBLIC_API_URL: z.string().url() }); export const env = envSchema.parse(process.env);
> ```
> - Validating `process.env` with Zod prevents runtime configuration crashes.
> 
> ```typescript
> import { z } from 'zod';
> 
> const envSchema = z.object({
>   DATABASE_URL: z.string().url(),
>   NEXT_PUBLIC_API_URL: z.string().url()
> });
> 
> export const env = envSchema.parse(process.env);
> ```


---

## 7. Related Terms
- [Deployment (Vercel)](../level_10/vercel_deployment.md) — Where you configure production variables.
- [Client Components](../level_01/client_components.md) — The environment that requires the `NEXT_PUBLIC_` prefix.

---

## 8. Key Takeaways
- **`.env.local`** is the standard file used in Next.js to store sensitive API keys and config settings. It should never be committed to Git.
- By default, variables are only accessible on the Server.
- To expose a variable to the browser (Client Components), you must prefix the name with **`NEXT_PUBLIC_`**.
- You must access variables explicitly (`process.env.KEY`), not dynamically (`process.env[key]`).
