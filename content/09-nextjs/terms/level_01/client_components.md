# Client Components (`"use client"`)

> **Level 1 — Core Concepts & Architecture**
> Traditional React components that run in the browser, allowing for interactivity, state, and DOM manipulation. They are opted into using the `"use client"` directive.

---

## 1. Prerequisites
- [React Server Components (RSC)](rsc.md) — The default component type you are opting out of.
- [React Hooks](react_hooks.md) — Functions like `useState` and `useEffect` that are only available in Client Components.

---

## 2. Term Category

**React Server Component** (Interactive Client Component Boundaries): Client Components (`"use client"`) render on the server initially and hydrate on the client, enabling state, effects, and browser event listeners.



---

## 3. Explanation

### Environment Context
- **Server (Pre-render) & Client (Hydration)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Adding Interactivity with Client Components

**Scenario:**
Create an interactive counter component using `"use client"` directive and `useState()`.

**Requirements:**
1. Add `"use client"` directive at the top of the file.
2. Implement reactive increment button.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => setCount(count + 1)}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Count: {count}
    </button>
  );
}
```

> #### Technical Explanation
>
> 1. `"use client"` marks the boundary where server execution transitions to client JavaScript hydration.
> 2. Client Components can consume React hooks (`useState`, `useEffect`, `useContext`) and DOM event handlers (`onClick`).
> 3. Still pre-renders initial static HTML on the server during initial page request.

---

### Exercise 2: Passing Server Components as Children into Client Components

**Scenario:**
Pass a Server Component containing direct database access as a `children` prop into an interactive Client Component drawer.

**Requirements:**
1. Accept `children: React.ReactNode` in Client Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/components/Drawer.tsx
> "use client";

import { useState } from "react";

export default function Drawer({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Drawer</button>
      {isOpen && <aside className="drawer-content">{children}</aside>}
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Client Components cannot directly `import` Server Components into their files.
> 2. Passing Server Components via the `children` prop allows Server Components to execute on the server while living inside Client Component UI wrappers.
> 3. Preserves server-side execution for data fetching components.

---

### Exercise 3: Minimizing Client Component Boundaries

**Scenario:**
Refactor a large product detail page so that ONLY the "Add to Cart" button is marked as a Client Component, keeping header and details as Server Components.

**Requirements:**
1. Isolate `"use client"` to atomic button component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/components/AddToCartButton.tsx
> "use client";

export default function AddToCartButton({ productId }: { productId: string }) {
  return (
    <button onClick={() => alert(`Added ${productId} to cart!`)}>
      Add to Cart
    </button>
  );
}
```

> #### Technical Explanation
>
> 1. Moving `"use client"` down to atomic leaves minimizes client JavaScript bundle sizes.
> 2. Main product details page remains a zero-bundle-size Server Component.
> 3. Core Next.js performance optimization pattern.

---




---

## 6. Related Terms
- [React Server Components (RSC)](rsc.md) — The default component type.
- [App Router vs Pages Router](app_router_vs_pages.md) — The architecture where this distinction matters.
- [Hydration](hydration.md) — Related concept: Hydration.
- [Network Boundary](network_boundary.md) — Related concept: Network Boundary.
- [React Components](react_components.md) — Related concept: React Components.
- [React Hooks](react_hooks.md) — Related concept: React Hooks.
- [Environment Variables (`.env.local`)](../level_10/environment_variables.md) — Related concept: Environment Variables (`.env.local`).

---

## 7. Key Takeaways
- **Client Components** are required for interactivity (`onClick`), state (`useState`), lifecycle hooks (`useEffect`), and browser APIs (`window`).
- You opt-in by placing `"use client"` at the top of the file.
- The directive creates a boundary; the file and all its imported dependencies are bundled and sent to the browser.
- You should push Client Components as far down the component tree as possible (to the "leaves") to maximize the amount of code that remains on the server.
