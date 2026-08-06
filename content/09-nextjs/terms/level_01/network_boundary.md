# Network Boundary

> **Level 1 — Core Concepts & Architecture**
> The serialization barrier dividing server-executed React Server Components (RSC) from browser-hydrated Client Components.

---

## 1. Prerequisites
- [React Server Components (RSC)](rsc.md) — The server-only environment.
- [Client Components (`"use client"`)](client_components.md) — The client-side interactive environment.

---

## 2. Term Category

**React Server Component** (Server-to-Client Serialization Boundary): The Network Boundary defines the serializable split point between Server Component execution and Client Component hydration.



---

## 3. Explanation

### Environment Context
- **Universal** (Defines the transition boundary between Server and Client rendering).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Auditing the Server-to-Client Serialization Boundary

**Scenario:**
Pass a serializable data object from a Server Component across the network boundary to a Client Component.

**Requirements:**
1. Define props interface for Client Component accepting JSON primitives.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/components/ClientUserProfile.tsx
> "use client";
> 
> interface UserProps {
>   id: string;
>   name: string;
>   roles: string[];
> }
> 
> export default function ClientUserProfile({ user }: { user: UserProps }) {
>   return (
>     <div className="p-4 border rounded">
>       <h2>{user.name}</h2>
>       <p>Roles: {user.roles.join(", ")}</p>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. The Network Boundary separates components executing on the server from components executing in the browser.
> 2. Props passed across the boundary are serialized into React Server Component flight data.
> 3. Passing plain JavaScript objects, strings, numbers, and arrays ensures valid boundary serialization.
> 
---

### Exercise 2: Resolving Non-Serializable Function Prop Errors

**Scenario:**
Fix a serialization build error caused by passing a server callback function as a prop to a Client Component.

**Requirements:**
1. Convert callback function into a Server Action (`"use server"`).

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/actions/user.ts
> "use server";
> 
> export async function handleUserUpdate(userId: string) {
>   console.log(`Updated user ${userId} on server`);
> }
> ```
> 
> ```tsx
> // app/components/ClientButton.tsx
> "use client";
> 
> import { handleUserUpdate } from "@/app/actions/user";
> 
> export default function ClientButton({ userId }: { userId: string }) {
>   return (
>     <button onClick={() => handleUserUpdate(userId)}>
>       Update User
>     </button>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Plain JavaScript functions cannot be serialized over the flight stream across the Network Boundary.
> 2. Server Actions marked with `"use server"` create RPC references that CAN be passed to Client Components.
> 3. Standard method for handling server callbacks from client UI boundaries.
> 
---

### Exercise 3: Passing Server Component Slots Across the Network Boundary

**Scenario:**
Pass a Server Component through a Client Component layout wrapper using `children`.

**Requirements:**
1. Render `children` inside Client Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/components/ClientModal.tsx
> "use client";
> 
> import { useState } from "react";
> 
> export default function ClientModal({ children }: { children: React.ReactNode }) {
>   const [open, setOpen] = useState(false);
> 
>   return (
>     <div>
>       <button onClick={() => setOpen(true)}>Open Modal</button>
>       {open && <div className="modal">{children}</div>}
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Server Components passed as `children` to Client Components execute ON THE SERVER.
> 2. The server serializes the Server Component's output into the flight stream payload.
> 3. Client Component renders the pre-computed Server Component slot without taking on client JS bundle weight.
> 
---


## 6. Related Terms
- [React Server Components (RSC)](rsc.md) — The server side of the boundary.
- [Client Components (`"use client"`)](client_components.md) — The client side of the boundary.
- [React Server Component Payload (RSC Payload)](../level_08/rsc_payload.md) — Related concept: React Server Component Payload (RSC Payload).

---

## 7. Key Takeaways
- The Network Boundary separates server-exclusive code from client-interactive code.
- Mark the entry point of your client component tree with the `"use client"` directive.
- All files imported by a `"use client"` component are bundled for the browser.
- Data passed across the boundary from server to client must be JSON-serializable.
- Do not pass functions, class instances, or complex browser objects across the boundary.
