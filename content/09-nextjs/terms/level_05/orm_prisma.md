# ORM (Object-Relational Mapping) & Prisma

> **Level 5 — Data Fetching**
> A backend database querying technique and type-safe tool library that lets Server Components read and write data directly from databases without writing raw SQL.

---

## 1. Prerequisites
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The server runtime where database drivers execute.
- [React Server Components (RSC)](../level_01/rsc.md) — The component type that can securely run database queries.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server Only** (Database connections and queries must execute strictly on the server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To access database tables (such as a users table) in traditional web programs, developers had to write raw, imperative SQL query strings (e.g. `SELECT * FROM users WHERE id = $1`). This is tedious and vulnerable to SQL injection attacks.

**Object-Relational Mapping (ORM)** solves this by mapping database tables to standard JavaScript/TypeScript objects. **Prisma** is a type-safe TypeScript ORM that generates auto-completion types based on your schema.

Because React Server Components (RSC) execute on the server, Next.js allows you to completely skip creating intermediate REST/GraphQL API endpoints. You can query your database directly using an ORM inside your page component!

---

### (2) Core Concept — Direct Querying in Server Components
With Prisma, you define a schema, generate the client, and run queries using type-safe methods:

```typescript
// app/users/page.tsx (Server Component)
import React from 'react';
import { prisma } from '@/lib/db'; // Import Prisma client singleton

export default async function UsersPage() {
  // Query database directly from the component body!
  // No fetch(), no API routes, no useEffect needed!
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1>Registered Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

### (3) The Serverless Connection Pool Problem
In serverless environments (like Vercel or AWS Lambda), your backend code runs in temporary container functions. If you initialize the Prisma client inside a file that runs frequently, every request might open a new database connection, quickly exhausting your database connection pool. 

To prevent this, you must store the Prisma client instance on the Node.js global object in development, ensuring a single client singleton is reused across hot-reloads.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Importing the database client inside Client Components

**The mistake:** Importing `prisma` or trying to query the database inside a Client Component:

```typescript
// app/components/UserWidget.tsx
'use client'; // Client Component boundary!

import { prisma } from '@/lib/db'; // ❌ ERROR: Database drivers cannot run in browser!

export default function UserWidget() {
  const users = prisma.user.findMany(); // Will crash during build
  return <div>...</div>;
}
```

**Why it's wrong:** Client Components compile to JavaScript sent to the browser. Browsers cannot connect directly to databases (which live behind secure private networks), and bundling database drivers will leak secret database credentials and throw compiling errors.

**Golden Rule:** Only import database clients inside Server Components, Route Handlers, or Server Actions.

---

### Mistake 2: Instantiating Multiple `PrismaClient` Instances in Development (Connection Pool Exhaustion)

**The mistake:** Writing `const prisma = new PrismaClient()` in every database file without a singleton wrapper.

**Why it's wrong:** Next.js hot module reloading (HMR) re-evaluates module files during dev, spawning new `PrismaClient` instances until database connection pools are exhausted. Use a global singleton.

*Incorrect:*
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient(); // ❌ Connection pool exhaustion in dev HMR!
```

*Fix:*
```typescript
// lib/db.ts singleton pattern:
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### Mistake 3: Executing Un-Indexed Full Table Scans in Server Components

**The mistake:** Executing `prisma.user.findMany()` on millions of records inside a page component without pagination or indexing.

**Why it's wrong:** Loading millions of database records into Node.js server memory causes high query latency and server out-of-memory crashes. Use `take` and `skip` pagination.

*Incorrect:*
```typescript
const allUsers = await prisma.user.findMany(); // ❌ Memory overload on large tables!
```

*Fix:*
```typescript
const users = await prisma.user.findMany({ take: 20, skip: 0 }); // Paginated query
```


---

## 6. Practice Exercises

### Exercise 1: Prisma Client Singleton

**Problem:** Complete the database setup utility below to prevent creating duplicate connection client instances during local development hot-reloads:

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

// Solution:
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

> [!check]- Answer
> - Attach the initialized `PrismaClient` to `globalThis` when not in a production environment to reuse the instance.

---

### Exercise 2: Prisma Singleton File Pattern

**Problem:** Write `lib/db.ts` Prisma singleton exporting a single reusable `prisma` instance across Next.js HMR reloads.

**Expected output:**
```typescript
import { PrismaClient } from '@prisma/client'; const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }; export const prisma = globalForPrisma.prisma || new PrismaClient(); if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

> [!check]- Answer
> - Global singleton pattern prevents connection leaks during dev HMR.
> 
> ```typescript
> import { PrismaClient } from '@prisma/client';
> 
> const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
> 
> export const prisma = globalForPrisma.prisma ?? new PrismaClient();
> 
> if (process.env.NODE_ENV !== 'production') {
>   globalForPrisma.prisma = prisma;
> }
> ```

---

### Exercise 3: Prisma Select Optimization

**Problem:** How does specifying `select: { id: true, name: true }` in Prisma queries improve Next.js performance?

**Expected output:**
```text
It fetches ONLY required fields from SQL database, reducing network payload size and database memory footprint.
```

> [!check]- Answer
> - `select` reduces SQL database query payload sizes.
> 
> ```typescript
> const users = await prisma.user.findMany({
>   select: { id: true, name: true }
> });
> ```


---

## 7. Related Terms
- [React Server Components (RSC)](../level_01/rsc.md) — The secure server execution context.
- [`React.cache()` Function](../level_05/react_cache.md) — How you deduplicate ORM requests.

---

## 8. Key Takeaways
- ORMs translate database tables into type-safe JavaScript objects.
- Next.js Server Components query databases directly, removing API route requirements.
- Never import database clients or run queries inside Client Components.
- Use a global singleton client instantiation check to prevent database connection leaks during development.
