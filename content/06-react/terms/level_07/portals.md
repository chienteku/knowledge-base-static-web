# Portals

> **Level 7 — Component Patterns**
> A React API that allows a component to render its children into a completely different part of the actual browser DOM, outside of the normal React tree hierarchy.

---

## 1. Prerequisites
- [Virtual DOM](../level_01/virtual_dom.md) — Portals allow you to escape the root node of the React tree.

---

## 2. Term Category
React Core API / UI Escape Hatch

---

## 3. Core Definition
Normally, when a React component renders, its HTML is strictly nested inside its parent's HTML in the actual browser DOM. 

However, if you are building a UI element that needs to visually "break out" of its container—like a global Modal, a Tooltip, or a Dropdown—being nested deep inside a parent with `overflow: hidden` or `z-index` restrictions can break the styling.

**Portals** (`createPortal`) let you teleport the JSX of a component so it actually renders at the very bottom of the `<body>` tag, while still acting exactly like a normal child in the React Virtual DOM (it still receives props and context normally).

---

## 4. Key Characteristics / Rules
- **Event Bubbling Works Normally:** Even though the Portal teleported the HTML to the `<body>`, React still remembers where the component originally was. An `onClick` inside a Portal modal will still bubble up to its React parent component!
- **Requires a Target Element:** You must have a target DOM node (like `<div id="modal-root"></div>`) existing in your `index.html` to teleport into.

---

## 5. Typical Usage / Common Patterns

### Creating a Modal
```jsx
import { createPortal } from 'react-dom';

function Modal({ children, isOpen }) {
  if (!isOpen) return null;

  // The first argument is the JSX you want to render.
  // The second argument is the physical DOM node to teleport it into.
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') // Found in index.html
  );
}
```

---

## 6. Common Pitfalls
- **Server-Side Rendering (SSR) Errors:** Because `document.getElementById` relies on the browser, attempting to render a Portal during SSR (like in Next.js) will crash. You must ensure Portals only render on the client (often using `useEffect` to check if the window exists).

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Assuming React Event Bubbling Stops at Portal DOM Mount Nodes

**The mistake:** Expecting click events inside a Portal modal rendered into `document.body` to skip parent component `onClick` handlers.

**Why it's wrong:** Even though a Portal renders its DOM node into a different physical DOM container, **React event propagation follows the React Component Tree, NOT the physical HTML DOM tree!** Click events in Portals still bubble up parent React components.

*Incorrect:*
```javascript
// Assuming modal click inside Portal won't trigger parent React component onClick
```

*Fix:*
```javascript
Call e.stopPropagation() inside portal click handler if bubbling is undesired
```

### Mistake 2: Creating Portals Before Target DOM Mount Elements Exist in SSR

**The mistake:** Executing `createPortal(children, document.getElementById('modal-root'))` during Server-Side Rendering (SSR).

**Why it's wrong:** `document` does not exist on Node.js servers! Executing `document.getElementById` during SSR throws `ReferenceError: document is not defined`. Render portals inside `useEffect` or after client hydration.

*Incorrect:*
```javascript
createPortal(<Modal />, document.getElementById('root')) // ❌ Fails during SSR on server!
```

*Fix:*
```javascript
useEffect(() => { setMounted(true); }, []); if (!mounted) return null;
```



### Mistake 3: Forgetting Keyboard `Escape` and Focus Trapping in Portal Modals

**The mistake:** Rendering a portal modal without handling `Escape` key presses or restricting tab key focus within the modal.

**Why it's wrong:** Accessible portal modals MUST trap focus and close on `Escape` key press to ensure keyboard and screen-reader accessibility compliance.

*Incorrect:*
```javascript
// Portal modal rendered without keyboard focus trapping or Escape listener
```

*Fix:*
```javascript
Add Escape key listener and use react-focus-lock for modal accessibility
```

## 6. Practice Exercises



### Exercise 1: Modal Portal Implementation

**Problem:** Create `Modal` portal component rendering `children` into `document.body` using `createPortal`.

**Expected output:**
```text
import { createPortal } from 'react-dom'; function Modal({ children }) { return createPortal(<div className="modal-overlay">{children}</div>, document.body); }
```

> [!check]- Answer
> ```javascript
> import { createPortal } from 'react-dom';
>
> function Modal({ children }) {
>   return createPortal(
>     <div className="modal-overlay">{children}</div>,
>     document.body
>   );
> }
> ```
>
> **Explanation:** `createPortal(children, domNode)` mounts React elements into arbitrary DOM containers outside the parent DOM hierarchy.

### Exercise 2: Common Use Cases for Portals

**Problem:** List 3 common UI component use cases for React Portals (Modals/Dialogs, Tooltips, Dropdown/Popover Menus).

**Expected output:**
```text
Modals/Dialogs, Tooltips, Dropdown/Popover Menus
```

> [!check]- Answer
> ```text
> Modals/Dialogs, Tooltips, Dropdown/Popover Menus
> ```
>
> **Explanation:** Portals prevent parent `overflow: hidden` or `z-index` stacking context clipping issues.



### Exercise 3: Closing Portal Modal on Escape Key

**Problem:** Add `keydown` event listener in `useEffect` closing portal modal when `Escape` is pressed.

**Expected output:**
```text
useEffect(() => { const handleKeyDown = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [onClose]);
```

> [!check]- Answer
> ```javascript
> useEffect(() => {
>   const handleKeyDown = e => {
>     if (e.key === 'Escape') onClose();
>   };
>   window.addEventListener('keydown', handleKeyDown);
>   return () => window.removeEventListener('keydown', handleKeyDown);
> }, [onClose]);
> ```
>
> **Explanation:** Global keyboard listeners close portal modals on `Escape` key events.

## 7. Related Terms
- [Client-Side Rendering (CSR)](../level_10/ssr.md) — Portals are strictly a client-side feature since they require direct DOM manipulation.

---
