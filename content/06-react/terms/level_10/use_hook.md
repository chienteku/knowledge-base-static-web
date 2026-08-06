# Suspense for Data Fetching & the `use()` Hook

> **Level 10 — Modern React & Architectures**
> React's API to resolve promises and contexts dynamically and conditionally during render.

---

## 1. Prerequisites
- [The Context API](../level_06/context_api.md) — The global data provider that `use()` can consume.
- [Suspense](../level_08/suspense.md) — The boundary system that catches pending promises.

---

## 2. Term Category
- **Core Hook**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In React, built-in hooks have strict layout rules: they can only be called at the top level of a component function. You cannot call them inside conditional blocks (`if` statements), loops (`for` loops), or nested functions.

This design makes conditional logic difficult. If a component only needs to read a Context theme value when a specific flag is active, or resolve an asynchronous Promise query on demand, developers had to split code into nested subcomponents to isolate hook calls.

React 19 introduced the **`use()` hook** (also referred to as the **`use` API**):
-   **Rule Exception:** Unlike all other hooks, **`use()` can be called conditionally and inside loops**.
-   **Promise Resolution (Suspense Integration):** If you pass a Promise to `use(promise)`, React will suspend rendering the component until the promise resolves. It yields control to the nearest parent `<Suspense>` loading fallback boundary.
-   **Conditional Context:** If you pass a Context object to `use(MyContext)`, it reads the context value. However, unlike `useContext(MyContext)`, you can call it inside an `if` block, allowing you to read context values conditionally.

---

### (2) Reality Metaphor
Imagine a postal service package collection point.
- **`useContext` (Home Mailbox Subscription):** You must install a physical mailbox at your front gate (**top-level hook declaration**). Even if you do not receive mail, you must check it on every render pass. You cannot conditionally choose to have a mailbox only when it rains.
- **The `use()` Hook (P.O. Box Counter):** You walk up to the clerk's counter. If you have a package pickup notification card (**conditional state**), you hand it to the clerk, who goes to the back room to retrieve your package (**resolving the promise**). If you do not have the card, you skip the counter entirely (**conditional check**). The retrieval only occurs on demand.

---

### (3) React Code Examples

#### 1. Reading Context Conditionally
We can read the active theme context only if the component is configured as "themed":
```jsx
import React, { use } from 'react';
import { ThemeContext } from './ThemeContext';

function Header({ isThemed }) {
  // Option: call the hook inside an conditional block!
  if (isThemed) {
    const theme = use(ThemeContext); // Resolves context value
    return <header style={{ background: theme.bg, color: theme.fg }}>Header</header>;
  }

  return <header>Default Plain Header</header>;
}
```

#### 2. Resolving a Data Promise inside a Suspense Boundary
```jsx
// ProductList.js
import React, { use } from 'react';

// Receive a promise query passed down from a Server Component
export default function ProductList({ dataPromise }) {
  // use() suspends the component until the promise resolves!
  const products = use(dataPromise); 

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

// Parent.js
import React, { Suspense } from 'react';
import ProductList from './ProductList';

// Simulating database request promise
const productsPromise = fetchProductsFromDatabase();

function App() {
  return (
    <div>
      <h1>Store Catalog</h1>
      
      {/* Suspense fallback renders while use(productsPromise) is loading */}
      <Suspense fallback={<p>Fetching items...</p>}>
        <ProductList dataPromise={productsPromise} />
      </Suspense>
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating a new Promise directly inside the render scope and passing it to `use()`

**The mistake:** Declaring a fetch query or promise creator inside the body of a component that calls `use()`:

```javascript
// BAD: Triggers infinite loop and crashes the network!
function Users() {
  const users = use(fetch('/api/users').then(res => res.json()));
  return <div>Count: {users.length}</div>;
}
```

**Why it's wrong:** Every time this component renders, JavaScript executes the function body, creating a new `fetch` promise. The `use()` hook detects a new promise reference, suspends the component, and triggers a re-render. When the component tries to render again, it creates *another* new promise, causing an infinite loop.

*Fix:* Create the promise outside the component function scope, or use a caching data-fetching framework (like Next.js or React Query) that caches promise instances between renders:

```javascript
// GOOD: Promise is declared outside and stays stable between renders
const usersPromise = fetch('/api/users').then(res => res.json());

function Users() {
  const users = use(usersPromise);
  return <div>Count: {users.length}</div>;
}
```

---



### Mistake 2: Confusing React 19 `use()` Hook with Standard Rules of Hooks Limitations

**The mistake:** Thinking `use(promise)` cannot be called inside `if` statements.

**Why it's wrong:** Unlike traditional React Hooks (`useState`, `useEffect`), the React 19 `use()` hook CAN be called conditionally inside `if` statements and loops!

*Incorrect:*
```javascript
// Assuming use(promise) violates Rules of Hooks when placed inside if statement
```

*Fix:*
```javascript
use(promise) is uniquely allowed inside conditional statements and loops
```

### Mistake 3: Passing Re-Created Un-Cached Promises to `use(promise)` (Infinite Loop Trap)

**The mistake:** Calling `use(fetchData())` where `fetchData()` creates a NEW Promise on every component render.

**Why it's wrong:** If a new Promise is created during render, `use(promise)` suspends on every single render pass, causing an infinite loading loop! Cache promises using `React.cache()` or pass promises created outside render.

*Incorrect:*
```javascript
function Page() {
  const data = use(fetch('/api').then(res => res.json())); // ❌ New promise every render!
}
```

*Fix:*
```javascript
const dataPromise = fetch('/api').then(res => res.json()); // Promise created outside render
function Page() { const data = use(dataPromise); }
```

## 6. Practice Exercises

### Exercise 1: Conditional Profile Rendering

**Problem:** Complete the component below to conditionally load user details from a promise prop, rendering a fallback when data loading is disabled:

```jsx
import React, { use, Suspense } from 'react';

function ProfileCard({ dataPromise, isExpanded }) {
  // Solution:
  if (!isExpanded) {
    return <p>Details minimized.</p>;
  }

  // Resolve promise conditionally
  const profile = use(dataPromise);

  return (
    <div className="profile">
      <h3>{profile.name}</h3>
      <p>{profile.bio}</p>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Consuming Promise with React 19 use() Hook

**Problem:** Unwrap `userPromise` inside React 19 component using `use(userPromise)` inside `<Suspense>`.

**Expected output:**
> [!check]- Answer
> ```text
> import { use } from 'react'; function UserCard({ userPromise }) { const user = use(userPromise); return <h2>{user.name}</h2>; }
> ```
> ```javascript
> import { use } from 'react';
>
> function UserCard({ userPromise }) {
>   const user = use(userPromise);
>   return <h2>{user.name}</h2>;
> }
> ```
>
> **Explanation:** React 19 `use(promise)` unwraps promises directly inside component render, integrating with `<Suspense>`.
> 
---

### Exercise 3: Consuming Context with React 19 use() Hook

**Problem:** Consume `ThemeContext` conditionally using `use(ThemeContext)` inside an `if` block.

**Expected output:**
> [!check]- Answer
> ```text
> if (showTheme) { const theme = use(ThemeContext); }
> ```
> ```javascript
> if (showTheme) {
>   const { theme } = use(ThemeContext);
> }
> ```
>
> **Explanation:** Unlike `useContext`, React 19 `use(Context)` can be called conditionally inside `if` statements.
> 
## 7. Related Terms
- [The Context API](../level_06/context_api.md) — The data sharing mechanism read by `use()`.
- [Suspense](../level_08/suspense.md) — The UI fallback catcher for pending promises.
- [React Server Components (RSC)](rsc.md) — React Server Components.

---

## 8. Key Takeaways
- The `use()` hook resolves promises and reads contexts.
- Unlike other hooks, `use()` can be called conditionally and inside loops.
- Passing a promise to `use()` suspends rendering until the promise resolves.
- Wrap components calling `use(promise)` in a `<Suspense>` boundary.
- Do not create new promises inside the render scope; define them externally or cache them.
- Use `use()` to dynamically read context values inside `if` statements.
