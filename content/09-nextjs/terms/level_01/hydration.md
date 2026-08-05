# Hydration

> **Level 1 — Core Concepts & Architecture**
> The process where React executes in the browser to adopt static server-rendered HTML, attaching event listeners to make the page interactive.

---

## 1. Prerequisites
- [React Components](react_components.md) — The building blocks that are hydrated.
- [Client-Side Rendering (CSR) / SPA](csr_spa.md) — The client-side execution framework.
---

## 2. Term Category
- **Optimization**

---

## 3. Environment Context
- **Universal** (Triggered by server HTML delivery, executed inside the client's web browser).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When Next.js renders a page using Server-Side Rendering (SSR) or Static Site Generation (SSG), it generates a static HTML file on the server. The server sends this HTML to the browser, allowing the user to see the page outline instantly (fast First Contentful Paint). 

However, this server-rendered HTML is just static text and images. If the user clicks a dropdown menu, toggles a theme button, or types in a search box, nothing happens because there is no JavaScript running to handle these events.

To solve this, React downloads the client-side JavaScript bundle. Once downloaded, React scans the existing HTML, hooks into the DOM structure, and attaches events (like `onClick` or `onChange`). This process of bringing static HTML to life is called **Hydration**.

---

### (2) Core Concept — The Hydration Cycle
1.  **Server Pre-renders:** Next.js compiles components and generates static HTML.
    ```html
    <!-- Delivered to browser -->
    <button id="alert-btn">Click Me</button>
    ```
2.  **Browser Displays UI:** The user sees the button instantly but clicking does nothing.
3.  **JavaScript Loads:** The browser downloads React client scripts.
4.  **Hydration Phase:** React traverses the DOM tree, matches it with its virtual component nodes, and adds listeners:
    ```javascript
    // React attaches the listener behind the scenes
    document.getElementById('alert-btn').addEventListener('click', () => alert('Hi!'));
    ```
5.  **Interactive State:** The page is fully functional.

---

### (3) Hydration Mismatches
React expects the HTML returned by the server to match the structure generated on the client's first render pass. If they do not match, React throws a **Hydration Mismatch** error:
`Error: Hydration failed because the initial UI does not match what was rendered on the server.`

This occurs when code relies on environment-specific data:
```typescript
// BAD: Server renders UTC date, Client renders user local time zone
export default function LocalTime() {
  const currentTime = new Date().toLocaleTimeString();
  return <div>Loaded at: {currentTime}</div>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accessing dynamic/browser variables in render blocks

**The mistake:** Rendering elements conditional on browser APIs during the initial render:

```typescript
// BAD: window is undefined on server, but defined on client, causing a mismatch!
export default function WindowWidth() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 800;
  return <div>Window Width: {width}px</div>;
}
```

**Why it's wrong:** The server compiles this component and outputs `<div>Window Width: 800px</div>`. When the browser hydrates the component, it executes the code, reads `window.innerWidth` (e.g. `1440px`), and renders `<div>Window Width: 1440px</div>`. React detects the differences in the DOM structure and throws a hydration error.

**Golden Rule:** Guard browser-only and dynamic data calls inside a `useEffect` hook to run them strictly *after* hydration has completed.

---

### Mistake 2: Rendering Browser-Only Values Directly in JSX (`window`, `localStorage`, `Date.now()`)

**The mistake:** Writing `<div>{typeof window !== 'undefined' ? window.innerWidth : 0}</div>` in a Client Component template.

**Why it's wrong:** Server pre-rendering evaluates `window.innerWidth` as 0, while the browser evaluates it as 1920. Mismatched server vs client HTML output triggers a **Hydration Error**.

*Incorrect:*
```typescript
export default function Component() {
  return <div>{window.innerWidth}</div>; // ❌ Hydration Error: Text content does not match!
}
```

*Fix:*
```typescript
export default function Component() {
  const [width, setWidth] = useState(0);
  useEffect(() => { setWidth(window.innerWidth); }, []); // Set state after client mount
  return <div>{width}</div>;
}
```

---

### Mistake 3: Nesting Invalid HTML Tags (`<p>` containing `<div>` or `<a>` inside `<a>`)

**The mistake:** Writing `<p><div>Block Text</div></p>` or `<Link href="/a"><a href="/b">Link</a></Link>`.

**Why it's wrong:** Browsers automatically repair invalid HTML structures (e.g. closing `<p>` tags before `<div>`). This DOM auto-repair causes the client DOM structure to differ from server HTML, breaking hydration.

*Incorrect:*
```tsx
<p><div>Invalid HTML block inside paragraph</div></p> <!-- ❌ Triggers browser DOM auto-repair hydration error! -->
```

*Fix:*
```tsx
<div><div>Valid HTML block structure</div></div>
```


---

## 6. Practice Exercises

### Exercise 1: Fix Hydration Mismatch

**Problem:** Fix the component below so it formats and displays the current timestamp safely without throwing a hydration mismatch error:

```typescript
// Before:
// export default function SafeTimestamp() {
//   return <div>Loaded at: {new Date().toLocaleTimeString()}</div>;
// }

// Solution:
'use client';

import React, { useState, useEffect } from 'react';

export default function SafeTimestamp() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Executes strictly on client after hydration
    setTime(new Date().toLocaleTimeString());
  }, []);

  return <div>Loaded at: {time || 'Loading...'}</div>;
}
```

> [!check]- Answer
> - Initialize state with an empty string or loading placeholder that matches the server, and populate the time string using `useEffect`.

---

### Exercise 2: Hydration Suppress Warning Attribute

**Problem:** Which React attribute suppresses hydration mismatch warnings on elements rendering dynamic timestamps like `new Date()`?

**Expected output:**
> [!check]- Answer
> ```text
> suppressHydrationWarning (e.g. <span suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>)
> ```
> - `suppressHydrationWarning` ignores text mismatch warnings 1 level deep.
> 
> ```tsx
> <span suppressHydrationWarning>
>   {new Date().toLocaleTimeString()}
> </span>
> ```

---

### Exercise 3: Hydration Process Definition

**Problem:** Explain what happens during the React Hydration step in the browser.

**Expected output:**
> [!check]- Answer
> ```text
> React matches the client-side Virtual DOM against pre-rendered server HTML nodes, attaching event listeners and initializing client state without re-creating DOM nodes.
> ```
> - Hydration attaches JS event listeners to pre-rendered HTML.
> 
> ```text
> Server HTML + Client JS Bundle -> Interactive Hydrated UI
> ```


---

## 7. Related Terms
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The process that generates the static HTML to hydrate.
- [Client Components (`"use client"`)](client_components.md) — Components that undergo hydration.
---

## 8. Key Takeaways
- Hydration is the process of attaching event listeners to static server-rendered HTML.
- It is the bridge that turns static HTML pages into fully interactive React apps.
- The server HTML structure must match the client's initial rendering layout exactly.
- If there is a structural discrepancy, React throws a Hydration Mismatch error.
- Use `useEffect` to safely run client-only layout calculations or date formatting.
