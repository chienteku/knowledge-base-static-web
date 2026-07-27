# Network Boundary

> **Level 1 — Core Concepts & Architecture**
> The serialization barrier dividing server-executed React Server Components (RSC) from browser-hydrated Client Components.

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — The server-only environment.
- [Client Components](../level_01/client_components.md) — The client-side interactive environment.

---

## 2. Term Category
- **Architecture**

---

## 3. Environment Context
- **Universal** (Defines the transition boundary between Server and Client rendering).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard Single Page Applications (SPAs), the entire application is bundled into a single file and runs in the user's browser. With the introduction of React Server Components (RSC), Next.js splits execution: some components execute only on the server, while others run in the browser. 

To manage this split, Next.js needs to know exactly which files and modules should remain on the server and which should be sent to the browser. The **Network Boundary** (also called the **Serialization Boundary**) is designed to solve this by defining a strict separation point in the import graph using the `"use client"` directive.

---

### (2) Core Concept — The Boundary Cascade
When Next.js encounters `"use client"` at the top of a file, it draws a Network Boundary. 
-   Everything **above** the boundary runs strictly on the server (RSC).
-   The file containing `"use client"`, and **all modules imported into it**, are marked for compilation into client bundles.

```
Server Component (Runs on Server)
       │
       ▼ (Imports)
Client Component ("use client" - Network Boundary)
       │
       ├─► Client Component (Runs on Client)
       └─► Third-party slider (Runs on Client)
```

Because of this cascading behavior, you do not need to add `"use client"` to every file—only at the entry points of your client-interactive trees.

---

### (3) Props Serialization
Because the server and the browser run on separate machines, data passed across the Network Boundary from a Server Component to a Client Component must be converted into a streamable format (a process called **Serialization**).

-   **Serializable (Allowed):** Strings, numbers, booleans, null, arrays, plain objects, and promises.
-   **Non-Serializable (Blocked):** Functions (event handlers), class instances (e.g. database model instances), and complex browser symbols.

```typescript
// app/users/page.tsx (Server Component)
import React from 'react';
import UserProfileCard from '@/components/UserProfileCard';

export default async function UsersPage() {
  const rawUser = await db.user.findFirst(); // Returns a class instance

  // Clean data into a plain JSON-serializable object
  const serializableUser = {
    id: rawUser.id,
    name: rawUser.name,
    email: rawUser.email
  };

  return (
    <main>
      {/* PASSING DATA ACROSS THE BOUNDARY */}
      <UserProfileCard user={serializableUser} />
    </main>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Passing non-serializable objects across the boundary

**The mistake:** Passing a database connection, a function, or a class instance directly to a Client Component prop:

```typescript
// app/posts/page.tsx (Server Component)
import PostCard from './PostCard'; // Client Component ('use client')

export default async function Posts() {
  const posts = await db.post.findMany(); // Returns database class instances
  
  // BAD: Database class instances cannot be serialized and sent to the browser!
  return <PostCard posts={posts} onDelete={() => deletePost()} />;
}
```

**Why it's wrong:** The `onDelete` function and the raw database class models cannot be serialized into JSON to be sent across the network to the browser, throwing a compilation or runtime warning.

**Golden Rule:** Only pass plain, JSON-serializable data structures (primitives, arrays, plain objects) across the Network Boundary.

---

### Mistake 2: Passing Non-Serializable Values (Functions, Classes) Across the Server-Client Boundary

**The mistake:** Passing a server function callback or class instance as a prop from a Server Component to a Client Component.

**Why it's wrong:** Props passed across the Server-Client network boundary are serialized to JSON/RSC payload streams. Functions and class instances cannot be JSON-serialized, throwing a build/runtime error.

*Incorrect:*
```typescript
// Server Component
<ClientButton onClick={() => db.update()} /> // ❌ Passing un-serializable function prop across boundary!
```

*Fix:*
```typescript
// Pass primitive/serializable props, or use Server Actions ('use server') for server calls
```

---

### Mistake 3: Forgetting the `server-only` Package Safeguard for Sensitive Modules

**The mistake:** Creating a database utility file without importing the `server-only` safeguard package.

**Why it's wrong:** If a Client Component accidentally imports a server utility file containing API secret keys, Webpack/Turbopack will bundle the file, leaking secrets to the browser. Use `import 'server-only'`.

*Incorrect:*
```typescript
// lib/db.ts without server-only protection
export const dbSecret = process.env.DATABASE_SECRET; // ❌ Might accidentally leak to client!
```

*Fix:*
```typescript
// lib/db.ts
import 'server-only'; // Throws build error if client component imports this file
export const dbSecret = process.env.DATABASE_SECRET;
```


---

## 6. Practice Exercises

### Exercise 1: Fix Serialization Error

**Problem:** Fix the Server Component below to pass a serializable object to the Client Component `DateDisplay`:

```typescript
// app/event/page.tsx (Server Component)
import DateDisplay from './DateDisplay'; // Client Component ('use client')

// Before:
// export default function EventPage() {
//   const eventInfo = {
//     title: "Next.js Conference",
//     date: new Date() // Non-serializable Date object
//   };
//   return <DateDisplay event={eventInfo} />;
// }

// Solution:
import React from 'react';

export default function EventPage() {
  const eventInfo = {
    title: "Next.js Conference",
    date: new Date().toISOString() // Convert to serializable string
  };
  return <DateDisplay event={eventInfo} />;
}
```

> [!check]- Answer
> - A JavaScript `Date` object is a class instance. Convert it into an ISO string before passing it as a prop.

---

### Exercise 2: Network Boundary Prop Validation

**Problem:** Which of the following props CAN be safely passed from a Server Component to a Client Component?
1. `user: { id: 5, name: 'Alice' }`
2. `onSave: () => void`
3. `createdDate: Date`

**Expected output:**
```text
Prop 1 (Plain JSON-serializable object). Dates (3) should be converted to ISO strings; Functions (2) must be Server Actions.
```

> [!check]- Answer
> - Serializable: Strings, Numbers, Booleans, Plain Objects, Arrays, Server Actions.
> - Non-serializable: Functions, Classes, Symbols, DOM elements.
> 
> ```tsx
> <ClientUserCard user={{ id: 5, name: 'Alice' }} />
> ```

---

### Exercise 3: client-only Package Safeguard

**Problem:** Which npm package enforces that a utility module can ONLY be imported by Client Components?

**Expected output:**
```text
import 'client-only';
```

> [!check]- Answer
> - `client-only` prevents server components from importing browser-dependent utilities.
> 
> ```typescript
> import 'client-only';
> ```


---

## 7. Related Terms
- [React Server Components (RSC)](../level_01/rsc.md) — The server side of the boundary.
- [Client Components](../level_01/client_components.md) — The client side of the boundary.

---

## 8. Key Takeaways
- The Network Boundary separates server-exclusive code from client-interactive code.
- Mark the entry point of your client component tree with the `"use client"` directive.
- All files imported by a `"use client"` component are bundled for the browser.
- Data passed across the boundary from server to client must be JSON-serializable.
- Do not pass functions, class instances, or complex browser objects across the boundary.
