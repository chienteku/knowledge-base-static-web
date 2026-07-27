# Client Components (`"use client"`)

> **Level 1 — Core Concepts & Architecture**
> Traditional React components that run in the browser, allowing for interactivity, state, and DOM manipulation. They are opted into using the `"use client"` directive.

---

## 1. Prerequisites
- [React Server Components (RSC)](../level_01/rsc.md) — The default component type you are opting out of.
- [React Hooks](../level_01/react_hooks.md) — Functions like `useState` and `useEffect` that are only available in Client Components.

---

## 2. Term Category
- **React Client Component**

---

## 3. Environment Context
- **Server (Pre-render) & Client (Hydration)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If Server Components are so great for performance, why do we need Client Components?
Because websites need to be interactive! You need buttons that click, forms that type, and modals that toggle. Since Server Components execute on the server and send zero JavaScript to the browser, they cannot be interactive.
**Client Components** are the standard React components you are used to. Their JavaScript *is* bundled and sent to the browser, allowing them to handle state and events.

### (2) The `"use client"` Directive
To tell Next.js that a component needs to be interactive, you place the `"use client"` directive at the absolute top of the file.

```tsx
"use client"; // Must be line 1!

import { useState } from 'react';

export default function Counter() {
  // ✅ Valid: We can use state because we are a Client Component!
  const [count, setCount] = useState(0);

  // ✅ Valid: We can use onClick because the JS runs in the browser!
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

### (3) The "Network Boundary"
`"use client"` does not just mean "this component is a client component". It actually defines a **Network Boundary**.
When you declare `"use client"` in a file, you are telling the Next.js bundler: *"Take this file, and every single file it imports, bundle them all into a JavaScript file, and send them to the browser."*

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Putting `"use client"` at the top of the App

**The mistake:** A developer moves to the App Router, gets annoyed that `useState` doesn't work, and just throws `"use client"` at the top of their root `layout.tsx` or `page.tsx` file.

**Why it's wrong:** Because `"use client"` cascades down to all imported children, putting it at the root of your application turns your *entire app* into Client Components! You instantly destroy all the performance benefits of the App Router and are back to building a massive, slow SPA.
**Golden Rule:** Push `"use client"` down the tree as far as possible. Instead of making the whole page a Client Component, extract *just the interactive button* into its own `LikeButton.tsx` file, mark *that* as `"use client"`, and import it into your Server Component page.

---

### Mistake 2: Adding `'use client'` Directive to Every Single Component File (Loss of RSC Benefits)

**The mistake:** Placing `'use client'` at the top of every file in the `app/` directory by default.

**Why it's wrong:** Marking all components as Client Components opts out of React Server Components, increasing client JS bundle size and losing server data fetching speed. Keep `'use client'` at the leaves of your component tree.

*Incorrect:*
```typescript
// Top of layout.tsx or main page
'use client'; // ❌ Forces entire page tree into client JS bundle!
```

*Fix:*
```typescript
// Leave Page and Layout as Server Components; move interactive buttons to isolated Client Components
```

---

### Mistake 3: Attempting to Import Server-Only Libraries inside a Client Component

**The mistake:** Importing Node.js `fs` or database clients (Prisma) inside a component with `'use client'`.

**Why it's wrong:** Client Components are bundled for the browser. Importing Node.js server modules inside Client Components causes bundle compilation failures.

*Incorrect:*
```typescript
'use client';
import { prisma } from '@/lib/db'; // ❌ Browser compilation error!
```

*Fix:*
```typescript
// Keep Prisma queries in Server Components or Server Actions; pass data as props to Client Components
```


---

## 6. Practice Exercises

### Exercise 1: Server Components inside Client Components

**Problem:** Can you import a Server Component directly into a Client Component?
```tsx
"use client"
import ServerComponent from './ServerComponent'; // Will this work?
```

**Expected output:**
```text
No!
Because `"use client"` forces all imported dependencies to become part of the client bundle, the `ServerComponent` will silently be converted into a Client Component! If it had database code inside it, it would crash.
(Note: You CAN pass a Server Component as a `children` prop to a Client Component, but you cannot import it directly).
```

> [!check]- Answer
> - Think about the "Network Boundary" cascading effect.

---

### Exercise 2: Client Component Boundary Selection

**Problem:** Which of the following components MUST be marked with `'use client'`?
1. Static blog post text block
2. Interactive Like button with `useState` and `onClick`
3. Database user query page

**Expected output:**
```text
Component 2 (Interactive Like button using useState and onClick requires 'use client').
```

> [!check]- Answer
> - React state (`useState`), effects (`useEffect`), and event listeners (`onClick`) require `'use client'`.
> 
> ```tsx
> 'use client';
> import { useState } from 'react';
> 
> export function LikeButton() {
>   const [likes, setLikes] = useState(0);
>   return <button onClick={() => setLikes(likes + 1)}>Likes: {likes}</button>;
> }
> ```

---

### Exercise 3: Passing Server Components as Children to Client Components

**Problem:** How can a Client Component wrap a Server Component without converting the Server Component into a Client Component?

**Expected output:**
```text
By passing the Server Component as the `children` prop to the Client Component.
```

> [!check]- Answer
> - Passing Server Components as `children` preserves server-side execution for the children.
> 
> ```tsx
> // ClientWrapper.tsx
> 'use client';
> export function ClientWrapper({ children }: { children: React.ReactNode }) {
>   return <div className="modal">{children}</div>;
> }
> ```


---

## 7. Related Terms
- [React Server Components (RSC)](../level_01/rsc.md) — The default component type.
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The architecture where this distinction matters.

---

## 8. Key Takeaways
- **Client Components** are required for interactivity (`onClick`), state (`useState`), lifecycle hooks (`useEffect`), and browser APIs (`window`).
- You opt-in by placing `"use client"` at the top of the file.
- The directive creates a boundary; the file and all its imported dependencies are bundled and sent to the browser.
- You should push Client Components as far down the component tree as possible (to the "leaves") to maximize the amount of code that remains on the server.
