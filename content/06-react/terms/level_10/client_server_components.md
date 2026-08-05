# Client vs Server Components & `"use client"`

> **Level 10 — Modern React & Architectures**
> The directive boundary that splits components into server-only and browser-interactive bundles.

---

## 1. Prerequisites
- [React Server Components (RSC)](rsc.md) — The server-only architecture that serves as the default.
- [Hydration](hydration.md) — The process that client components undergo to become interactive.
---

## 2. Term Category
- **Rendering Mechanic / Component Pattern**

---

## 3. Environment Context
- **Universal** (Runs on the server for initial HTML rendering, and in the browser for hydration and interaction).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern React frameworks (like Next.js), components are divided into two categories based on where they render and execute:

#### 1. Server Components (The Default)
These components run **only on the server**. They can directly query databases, read file systems, and execute backend tasks. Because their code never leaves the server, they do not add to the JavaScript bundle size sent to the browser.
-   **Limitations:** Since they do not run in the browser, they **cannot** use browser APIs, add event listeners (like `onClick`), or use hooks that track lifecycle or state (such as `useState` or `useEffect`).

#### 2. Client Components
These are standard React components. They render initial HTML on the server (for SEO and fast loading) and then download their JavaScript files to the browser to execute and enable interactivity (**hydration**).
-   **Capabilities:** They can use all React hooks (`useState`, `useEffect`, `useContext`), add event listeners, and access browser APIs (like `window` or `localStorage`).

#### The `"use client"` Directive
To separate these two rendering environments, React uses the `"use client"` directive.

When you add `"use client"` as a string at the very top of a file (above any imports), you define a **Client Boundary**. This tells the bundler (e.g. Webpack, turbopack) to include this file and all of its imported child modules in the JavaScript bundle sent to the browser.

---

### (2) Component Relationship Rules
-   **Rule 1: Server Components can import Client Components.**
-   **Rule 2: Client Components CANNOT import Server Components.** Because Client Components execute in the browser, importing a Server Component directly would pull server-only code (like database queries) into the browser bundle, causing errors.
-   **Rule 3: Client Components can accept Server Components as children.** If a Client Component needs to wrap a Server Component, pass the Server Component down as a prop (usually `{children}`) from a parent Server Component.

---

### (3) Reality Metaphor
Imagine a restaurant operation.
- **Server Components (The Kitchen - Back Office):** The chefs cook the food, read recipes, and access the pantry (**querying databases**). They operate in a secure area. They do not talk directly to customers (**no event listeners**).
- **Client Components (The Waiter - Front Desk):** The waiters talk to customers (**event listeners**), write orders on pads (**state updates**), and coordinate the dining room. They need food from the kitchen (**props from Server Components**) to serve customers, but customers are not allowed into the kitchen directly (**cannot import server-side code into browser bundles**).

---

### (4) React Code Example: Combining Server and Client

#### 1. The Client Component (State & Interactivity)
```jsx
// CounterButton.js
'use client'; // Marks this file and its dependencies as Client Components

import React, { useState } from 'react';

export default function CounterButton() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

#### 2. The Server Component (Database Access, Imports Client Component)
```jsx
// UserProfile.js (No directive = default Server Component)
import React from 'react';
import CounterButton from './CounterButton'; // Allowed: Server imports Client

export default async function UserProfile() {
  // Directly access database server-side
  const user = await db.users.find({ id: 1 });

  return (
    <div className="profile-card">
      <h1>User: {user.name}</h1>
      <p>Log your interactions below:</p>
      
      {/* Compose the interactive client component */}
      <CounterButton />
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing `"use client"` at the top of every single file

**The mistake:** Adding the `"use client"` directive to every component file out of precaution:

**Why it's wrong:** Adding `"use client"` everywhere forces React to include all components in the browser bundle, bypassing the benefits of Server Components. This results in larger bundle sizes and slower page load times.

*Fix:* Keep components as Server Components by default. Only add `"use client"` when you need browser-specific features:
1.  Using interactive hooks (e.g. `useState`, `useEffect`).
2.  Adding DOM event listeners (e.g. `onClick`, `onSubmit`).
3.  Accessing browser-only APIs (e.g. `window`, `document`, `localStorage`).

---



### Mistake 2: Attempting to Pass Non-Serializable Props (e.g. Callback Functions) from Server to Client Components

**The mistake:** Passing `<ClientChild onClick={() => console.log('hi')} />` from a React Server Component (RSC).

**Why it's wrong:** Server Component props MUST be serializable over the wire (JSON-serializable primitives, objects, arrays). Callback functions cannot be serialized across the server-client boundary! Move interactive event handlers into Client Components.

*Incorrect:*
```javascript
// Inside Server Component:
<ClientButton onClick={() => alert('click')} /> // ❌ Functions cannot be serialized!
```

*Fix:*
```javascript
// Define event handler inside Client Component
'use client';
function ClientButton() { return <button onClick={() => alert('click')}>Click</button>; }
```

### Mistake 3: Adding `'use client'` Directives to Top-Level Layout Components Un-Necessarily

**The mistake:** Adding `'use client'` at line 1 of root `layout.tsx` component.

**Why it's wrong:** Adding `'use client'` to a top-level parent component converts THAT component AND ALL OF ITS CHILDREN into Client Components, opting out of Server Component benefits across the whole app. Add `'use client'` only to small leaf components requiring interactivity.

*Incorrect:*
```javascript
// 'use client' at top of root layout.tsx
```

*Fix:*
```javascript
Keep layout.tsx as Server Component; add 'use client' only to interactive leaf widgets
```

## 6. Practice Exercises

### Exercise 1: Structural Composition

**Problem:** You are building a landing page. You have a `<ClientCarousel />` (needs state for slides) and a `<ServerProductCard />` (reads from database). Compose the components so that the server-rendered cards are displayed inside the client carousel:

```jsx
// CarouselWrapper.js ('use client' container)
'use client';
import React, { useState } from 'react';

export default function ClientCarousel({ children }) {
  const [activeSlide, setActiveIndex] = useState(0);
  return (
    <div className="carousel">
      {/* Render the server-rendered items passed as children */}
      <div className="track">{children}</div>
    </div>
  );
}

// Page.js (Server Component)
import React from 'react';
import ClientCarousel from './CarouselWrapper';
import ServerProductCard from './ServerProductCard';

export default async function Page() {
  const products = await getProductsFromDB();

  return (
    <div>
      <h1>Featured Catalog</h1>
      
      {/* Solution: Pass server components as children to the client wrapper */}
      <ClientCarousel>
        {products.map(p => (
          <ServerProductCard key={p.id} product={p} />
        ))}
      </ClientCarousel>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Server vs Client Component Placement Rule

**Problem:** Categorize component type: 1. Database query component (`Server Component`); 2. Interactive modal toggle button (`Client Component`); 3. Static footer layout (`Server Component`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Server Component, 2. Client Component, 3. Server Component
> ```
> ```text
> 1. Server Component, 2. Client Component, 3. Server Component
> ```
>
> **Explanation:** Default to Server Components; use Client Components (`'use client'`) for interactive state/hooks.

---

### Exercise 3: Passing Server Component as Children to Client Component

**Problem:** Can a Client Component render a Server Component passed as `children` prop? (Yes, children slots allow rendering Server Components inside Client Component layouts).

**Expected output:**
> [!check]- Answer
> ```text
> Yes, children slots allow rendering Server Components inside Client Component layouts
> ```
> ```javascript
> // ClientWrapper.tsx ('use client')
> function ClientWrapper({ children }) {
>   const [open, setOpen] = useState(true);
>   return <div>{open && children}</div>;
> }
> ```
>
> **Explanation:** Children composition props allow nesting Server Components inside Client Component boundaries.

## 7. Related Terms
- [React Server Components (RSC)](rsc.md) — The default server-side rendering architecture.
- [Server Actions & `"use server"`](server_actions.md) — Calling server-side database handlers from client-side buttons.
---

## 8. Key Takeaways
- Server Components execute only on the server, sending zero JavaScript to the browser.
- Client Components execute on the server for SSR and hydrate in the browser.
- Use `"use client"` at the top of a file to declare a Client Component boundary.
- Server Components can import Client Components.
- Client Components cannot import Server Components directly.
- Pass Server Components as `{children}` props to render them inside Client Components.
- Use `"use client"` only when interactive hooks, event listeners, or browser APIs are required.
