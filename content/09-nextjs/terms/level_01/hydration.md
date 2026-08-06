# Hydration

> **Level 1 — Core Concepts & Architecture**
> The process where React executes in the browser to adopt static server-rendered HTML, attaching event listeners to make the page interactive.

---

## 1. Prerequisites
- [React Components](react_components.md) — The building blocks that are hydrated.
- [Client-Side Rendering (CSR) / SPA](csr_spa.md) — The client-side execution framework.

---

## 2. Term Category

**Rendering Strategy** (Client DOM Activation): Hydration is the process where client-side React attaches event listeners and state to server-rendered static HTML DOM nodes.



---

## 3. Explanation

### Environment Context
- **Universal** (Triggered by server HTML delivery, executed inside the client's web browser).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Fixing Hydration Errors Caused by Dynamic Timestamps

**Scenario:**
Fix a hydration error caused by rendering `new Date().toLocaleTimeString()` directly during server rendering.

**Requirements:**
1. Defer client-only date rendering to `useEffect()` or state.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <div>
      <p>Current Time: {time ?? "Loading..."}</p>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Hydration errors occur when server-rendered initial HTML DOM differs from client initial render output.
> 2. `new Date()` outputs different values between server build/render and client hydration execution.
> 3. Deferring client-specific state updates to `useEffect()` ensures identical initial server and client DOM trees.

---

### Exercise 2: Suppressing Hydration Warnings for Intentionally Divergent Content

**Scenario:**
Suppress hydration warnings on a element rendering localized timestamps using `suppressHydrationWarning`.

**Requirements:**
1. Add `suppressHydrationWarning` prop to element.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default function Timestamp() {
>   return (
>     <span suppressHydrationWarning className="text-sm text-gray-500">
>       {new Date().toISOString()}
>     </span>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. `suppressHydrationWarning` suppresses React hydration mismatch warnings for 1-level deep text content.
> 2. Useful for timestamps or client-only attributes that intentionally differ from server HTML.
> 3. Use sparingly to avoid masking real structural layout bugs.

---

### Exercise 3: Debugging Invalid HTML Structure Hydration Failures

**Scenario:**
Fix a hydration crash caused by invalid HTML tag nesting (`<p><div>...</div></p>`).

**Requirements:**
1. Fix tag nesting hierarchy.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // ❌ INCORRECT (Triggers browser auto-repair hydration error):
> // <p><div>Block Text</div></p>

// ✅ CORRECT:
export default function ValidLayout() {
  return (
    <div>
      <div>Block Text</div>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Browsers auto-correct invalid W3C HTML nesting (e.g. closing `<p>` tags before block `<div>` elements) before React hydrates.
> 2. This browser auto-correction mutates the physical DOM tree, causing React's hydrator to throw hydration errors.
> 3. Always maintain valid HTML element hierarchy.

---




---

## 6. Related Terms
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The process that generates the static HTML to hydrate.
- [Client Components (`"use client"`)](client_components.md) — Components that undergo hydration.

---

## 7. Key Takeaways
- Hydration is the process of attaching event listeners to static server-rendered HTML.
- It is the bridge that turns static HTML pages into fully interactive React apps.
- The server HTML structure must match the client's initial rendering layout exactly.
- If there is a structural discrepancy, React throws a Hydration Mismatch error.
- Use `useEffect` to safely run client-only layout calculations or date formatting.
