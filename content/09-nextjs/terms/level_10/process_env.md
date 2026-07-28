# Node.js Environment Variables (`process.env`)

> **Level 10 — Advanced Architecture**
> The standard Node.js mechanism used to inject configuration settings and secret keys into your application at runtime, keeping them separate from source code.

---

## 1. Prerequisites
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The environment that exposes the `process` global object.

---

## 2. Term Category
- **Configuration**

---

## 3. Environment Context
- **Server Only** (Operating system environment variables are restricted strictly to server execution; they are invisible to browser runtimes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications require configuration settings that change based on where they run:
-   **Local Development:** Dev database URL (`localhost`), test stripe API key.
-   **Production:** Production database URL, real payment gateway API key.

Hardcoding these secrets inside your source code is a major security vulnerability (exposing keys if code is committed to public Git repositories) and makes configuring environment behavior rigid.

**Environment Variables** solve this by injecting values from the host system environment. Your code refers to placeholders, and the operating system supplies the actual values at runtime.

---

### (2) Core Concept — The `process.env` Object
In Node.js, the global `process` object represents the running application process. It exposes a property called `env`, which contains key-value strings of all environment variables currently set on the machine.

```typescript
// db.ts
import { Client } from 'pg';

// 1. Read secrets from the environment!
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("CRITICAL: DATABASE_URL environment variable is missing!");
}

// 2. Initialize connection using the environment string
export const db = new Client({
  connectionString: dbUrl,
});
```

---

### (3) Security and Boundaries
Because `process.env` reads directly from the server's OS environment, these variables are completely secure. They remain on the server and are never bundled into client-side JavaScript assets.

Next.js builds on top of this system by parsing local `.env` files (like `.env.local`) and managing client-side environment exports via the `NEXT_PUBLIC_` naming convention.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Committing local configuration files containing secrets to version control (Git)

**The mistake:** Committing files containing actual secrets (like `.env` or `.env.local`) to GitHub:

```text
# Inside .gitattributes or .gitignore
# Missing .env.local entry!
```

**Why it's wrong:** Committing secrets exposes them to anyone with read access to the repository. Automated scrapers constantly monitor GitHub for leaked credentials to hijack database clusters or abuse API keys.

**Golden Rule:** Always add `.env`, `.env.local`, and other environment config files containing secrets to your `.gitignore` file. Only commit a placeholder file named `.env.example` containing empty keys.

---

### Mistake 2: Destructuring `process.env` in Client Code (Broken Bundler Replacement)

**The mistake:** Writing `const { NEXT_PUBLIC_API_URL } = process.env;` in Client Components.

**Why it's wrong:** Next.js replaces `process.env.NEXT_PUBLIC_VAR` using static string replacement during build. Destructuring `const { NEXT_PUBLIC_VAR } = process.env` breaks string replacement, evaluating variables as `undefined`.

*Incorrect:*
```typescript
const { NEXT_PUBLIC_API_URL } = process.env; // ❌ Evaluates to undefined in browser!
```

*Fix:*
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Access full path directly
```

---

### Mistake 3: Expecting `process.env` Values to Update Dynamically Without Re-Building Static Pages

**The mistake:** Changing `.env` values in production and expecting static SSG pages to update without re-building.

**Why it's wrong:** `NEXT_PUBLIC_` variables referenced in static pages are inlined into HTML/JS at BUILD TIME. Changing environment variables requires triggering a new build.

*Incorrect:*
```tsx
/* Expecting static SSG pages to reflect updated .env values without re-building */
```

*Fix:*
```tsx
/* Trigger a production build (npm run build) to inline updated environment variables */
```


---

## 6. Practice Exercises

### Exercise 1: Validate Required Environment Keys

**Problem:** Complete the function below to check if the `STRIPE_SECRET_KEY` environment variable is defined. If it is missing, throw an error. If it exists, return it:

```typescript
// lib/payments.ts
// Solution:
export function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment variables!");
  }
  
  return key;
}
```

> [!check]- Answer
> - Access the variable via `process.env.STRIPE_SECRET_KEY` and check if it has a truthy value.

---

### Exercise 2: process.env Client vs Server Matrix

**Problem:** Which environment variables are accessible in:
1. Server Components
2. Client Components

**Expected output:**
> [!check]- Answer
> ```text
> 1. Server Components: ALL process.env variables (private and public)
> 2. Client Components: ONLY variables prefixed with NEXT_PUBLIC_
> ```
> - Server: Accesses all environment variables.
> - Client: Accesses ONLY `NEXT_PUBLIC_` variables.
> 
> ```text
> Server = All vars; Client = NEXT_PUBLIC_ vars only.
> ```

---

### Exercise 3: process.env.NODE_ENV Values

**Problem:** List the 3 standard values `process.env.NODE_ENV` takes in Next.js applications.

**Expected output:**
> [!check]- Answer
> ```text
> 1. 'development' (npm run dev)
> 2. 'production' (npm run start / build)
> 3. 'test' (vitest / jest)
> ```
> - `development`, `production`, `test`.
> 
> ```typescript
> if (process.env.NODE_ENV === 'production') {
>   // Production only logic
> }
> ```


---

## 7. Related Terms
- [Environment Variables (`.env.local`)](../level_10/environment_variables.md) — Next.js's implementation of this concept.
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The backend engine exposing the `process` global.

---

## 8. Key Takeaways
- Environment Variables keep app configurations separate from source code.
- Node.js accesses these variables via the global `process.env` object.
- Secrets remain server-side and are never exposed to the client by default.
- Never commit files containing actual secrets (e.g. `.env.local`) to Git.
- Maintain a `.env.example` file in the repo to document required keys for developers.
