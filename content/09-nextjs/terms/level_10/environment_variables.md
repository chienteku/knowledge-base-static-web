# Environment Variables (`.env.local`)

> **Level 10 — Advanced Architecture**
> The secure system Next.js uses to manage secret API keys and configuration settings across different deployment environments (Development, Preview, Production).

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — Essential for understanding the security boundaries of environment variables.
- [Node.js Environment Variables (`process.env`)](process_env.md) — The foundational concept.

---

## 2. Term Category

**Security & Middleware** (Environment Variable Management): Environment Variables configure server secrets (`.env`) and client-exposed parameters (`NEXT_PUBLIC_`).



---

## 3. Explanation

### Environment Context
- **Server (Default) / Client (Opt-in)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Separating Server Secrets vs Client Environment Variables

**Scenario:**
Define server-only secrets and client-exposed variables in `.env.local` and access them in code.

**Requirements:**
1. Define `DATABASE_URL` and `NEXT_PUBLIC_STRIPE_KEY` in `.env.local`.

> [!check]- Answer
>
> #### Implementation
>
> ```ini
> # .env.local
> DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
> NEXT_PUBLIC_STRIPE_KEY="pk_test_123456789"
> ```

> ```tsx
> // Server Component (app/page.tsx)
> export default async function Page() {
>   // Safe: DATABASE_URL is accessible on server ONLY
>   console.log("Server DB URL:", process.env.DATABASE_URL);
>   return <div>Public Key: {process.env.NEXT_PUBLIC_STRIPE_KEY}</div>;
> }
> ```

> #### Technical Explanation
>
> 1. Environment variables without `NEXT_PUBLIC_` prefix are available ONLY in Node.js server execution contexts.
> 2. Variables prefixed with `NEXT_PUBLIC_` are inlined into client JavaScript bundles at build time.
> 3. Critical security boundary for API secret keys.

---

### Exercise 2: Overriding Environment Variables across Environments

**Scenario:**
Explain the precedence hierarchy of `.env` files in Next.js (`.env.production.local`, `.env.production`, `.env.local`, `.env`).

**Requirements:**
1. Detail `.env` file evaluation order.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Environment File Precedence Hierarchy (Highest to Lowest):
> - Step: process.env (System Environment Variables)
> - Step: .env.${NODE_ENV}.local (e.g. .env.production.local)
> - Step: .env.local (Not checked when NODE_ENV === 'test')
> - Step: .env.${NODE_ENV} (e.g. .env.production)
> - Step: .env (Global Fallback)
> ```

> #### Technical Explanation
>
> 1. System environment variables explicitly set on deployment platforms override `.env` files.
> 2. `.env.local` is ignored in git to store local development secrets securely.
> 3. Standard environment variable resolution order.

---

### Exercise 3: Validating Environment Variables with Zod at Build Time

**Scenario:**
Validate required environment variables at application startup using a Zod schema `env.mjs`.

**Requirements:**
1. Throw build error if required `DATABASE_URL` is missing.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // env.mjs
> import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
});
```

> #### Technical Explanation
>
> 1. Validating environment variables at startup prevents silent runtime 500 crashes during production deployments.
> 2. `envSchema.parse()` throws an immediate build error if required environment variables are missing or malformed.
> 3. Production deployment sanity check.

---




---

## 6. Related Terms
- [Deployment (Vercel)](vercel_deployment.md) — Where you configure production variables.
- [Client Components (`"use client"`)](../level_01/client_components.md) — The environment that requires the `NEXT_PUBLIC_` prefix.
- [Node.js Environment Variables (`process.env`)](process_env.md) — Related concept: Node.js Environment Variables (`process.env`).

---

## 7. Key Takeaways
- **`.env.local`** is the standard file used in Next.js to store sensitive API keys and config settings. It should never be committed to Git.
- By default, variables are only accessible on the Server.
- To expose a variable to the browser (Client Components), you must prefix the name with **`NEXT_PUBLIC_`**.
- You must access variables explicitly (`process.env.KEY`), not dynamically (`process.env[key]`).
