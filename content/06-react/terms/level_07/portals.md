# Portals

> **Level 7 — Component Patterns**
> A React DOM API (`createPortal`) that allows a component to render its children into a completely different physical DOM node outside the parent component's DOM hierarchy, while maintaining its position in the React Virtual DOM tree.

---

## 1. Prerequisites

- [Virtual DOM](../level_01/virtual_dom.md) — Understanding how React maintains Virtual DOM positions independently of physical browser DOM nodes.
- [Synthetic Events](../level_05/synthetic_events.md) — Understanding event delegation bubbling across portal component trees.
- [`useRef` Hook](../level_04/use_ref.md) — Obtaining DOM node target references for portal rendering.

---

## 2. Term Category

**Rendering Mechanic (DOM subtree redirection)**: React Portals (created via `ReactDOM.createPortal(child, container)`) provide a mechanism to teleport rendered HTML DOM elements to a designated physical DOM container outside the parent component's DOM tree (such as appending directly to `document.body` or a `<div id="modal-root">`).

Although Portals change where elements are physically mounted in the browser HTML DOM structure, the portaled component behaves like a standard React child in every other respect. It maintains access to parent React Contexts, receives props, and participates in React event delegation. Synthetic Events fired inside a Portal bubble up through the **React Virtual DOM Tree**, not the physical HTML DOM tree.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In modern web user interfaces, certain UI elements—such as modal dialog overlays, tooltips, popover menus, and notifications—need to break out visually from their parent containers.

If a modal dialog is rendered deep inside a parent container that has CSS properties like `overflow: hidden`, `z-index: 10`, or `transform: translate3d()`, the modal dialog will be visually clipped or constrained by the parent's CSS stacking context. In traditional JS, developers solved this by manually detaching elements from the DOM and appending them to `document.body`, but this broke React's state binding and context distribution.

React solved this by introducing **Portals**:
- **Visual Isolation:** `createPortal(jsx, document.body)` mounts the physical HTML nodes at the root of `document.body`, bypassing parent `overflow: hidden` and `z-index` stacking context clipping entirely.
- **Context & Event Integrity:** The portaled element remains strictly attached to its parent in the React Virtual DOM tree. It retains access to parent Context Providers and bubbles Synthetic Events up to parent React event handlers cleanly.

### (2) Reality Metaphor

Imagine a wormhole portal connecting two physical rooms in a space station.

Your character stands inside Room A (**the parent component DOM container**). Room A has a low ceiling and small narrow doors (**`overflow: hidden` and `z-index` limits**). If your character attempts to inflate a giant 10-meter emergency rescue balloon (**a modal dialog overlay**) inside Room A, the balloon gets squeezed and crushed by the low ceiling.

Your character steps up to a wormhole generator (**`createPortal`**) and inflates the giant balloon through the wormhole. The physical balloon material expands outside in open space (**mounted at `document.body`**), completely unconstrained by Room A's low ceiling. However, the inflation control wire stays connected to your character's hand in Room A (**React Context and Event Bubbling stay intact**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';
import { createPortal } from 'react-dom';

function SimpleModalPortal({ isOpen, children }) {
  if (!isOpen) return null;

  // Render children into document.body physically while retaining React parent position
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.body
  );
}

export default SimpleModalPortal;
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function AccessibleModalPortal({ isOpen, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);

  // Ensure portal only mounts on the client to avoid SSR hydration mismatches
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Keyboard Escape listener for modal accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Teleport modal markup to document.body
  return createPortal(
    <div className="portal-overlay" onClick={onClose}>
      <div className="portal-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="portal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </header>
        <div className="portal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="constrained-container" style={{ overflow: 'hidden', height: '200px' }}>
      <h3>Main Dashboard Container (overflow: hidden)</h3>
      <button onClick={() => setShowModal(true)}>Open Global Modal</button>

      {/* Modal renders outside this overflow: hidden container in physical DOM! */}
      <AccessibleModalPortal
        isOpen={showModal}
        title="Industrial Gateway Warning"
        onClose={() => setShowModal(false)}
      >
        <p>Critical threshold telemetry alarm detected in Zone 4.</p>
        <button onClick={() => setShowModal(false)}>Acknowledge Alarm</button>
      </AccessibleModalPortal>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming React Event Bubbling Stops at the Portal Physical DOM Target

**The mistake:** Expecting click events inside a Portal modal rendered into `document.body` to skip parent component `onClick` handlers.

**Why it's wrong:** React Synthetic Event delegation follows the **React Component Tree**, NOT the physical HTML DOM tree! Even though a Portal teleports physical HTML nodes to `document.body`, clicking inside the Portal still bubbles synthetic events up through parent React components. Use `e.stopPropagation()` inside the portal container if bubbling is undesired.

*Incorrect:*
```jsx
function Parent() {
  // ❌ Surprise! Clicking inside the Portal modal triggers parentOnClick!
  return (
    <div onClick={parentOnClick}>
      <PortalModal />
    </div>
  );
}
```

*Fix:*
```jsx
function PortalModal() {
  return createPortal(
    // Stop propagation explicitly if parent click interception is unwanted
    <div onClick={(e) => e.stopPropagation()}>Modal Content</div>,
    document.body
  );
}
```

### Mistake 2: Executing `createPortal` During Server-Side Rendering (SSR)

**The mistake:** Calling `createPortal(children, document.getElementById('modal-root'))` directly during SSR execution.

**Why it's wrong:** Node.js server environments do NOT have a browser `document` or `window` object! Calling `document.getElementById` during SSR execution throws `ReferenceError: document is not defined`. Ensure Portals only render on the client after component mounting (`useEffect`).

*Incorrect:*
```jsx
function SSRModal({ children }) {
  // ❌ Crashes during Server-Side Rendering on Node.js server!
  return createPortal(children, document.getElementById('modal-root'));
}
```

*Fix:*
```jsx
function SSRModal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null; // Wait for client hydration
  return createPortal(children, document.getElementById('modal-root'));
}
```

### Mistake 3: Forgetting Accessibility Focus Trapping and Escape Key Handling

**The mistake:** Rendering a Portal modal overlay without capturing keyboard focus or listening for the `Escape` key.

**Why it's wrong:** Modals mounted at `document.body` sit outside the standard keyboard navigation order. Without keyboard listener handlers and focus lock, keyboard and screen-reader users can tab past the modal into hidden background DOM elements, violating accessibility standards (WCAG).

*Incorrect:*
```jsx
// Portal modal rendered without Escape key listener or focus lock
```

*Fix:*
```jsx
// Add global keydown listener for Escape key and use focus trapping
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Gateway Emergency Alarm Modal Portal

**Scenario:** Create an emergency alarm modal component using `createPortal` to render urgent alerts directly into `document.body`, escaping parent dashboard overflow limits.

**Requirements:**
1. Render modal into `document.body` via `createPortal`.
2. Intercept click events inside modal using `e.stopPropagation()`.
3. Support closing modal on Escape key press.
4. Include runtime test assertions for portal target mounting.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> import { createPortal } from 'react-dom';
> 
> export function EmergencyAlarmPortal({ isOpen, onClose, alarmMessage }) {
>   useEffect(() => {
>     if (!isOpen) return;
>     const handleKeyDown = (e) => {
>       if (e.key === 'Escape') onClose();
>     };
>     window.addEventListener('keydown', handleKeyDown);
>     return () => window.removeEventListener('keydown', handleKeyDown);
>   }, [isOpen, onClose]);
> 
>   if (!isOpen || typeof document === 'undefined') return null;
> 
>   return createPortal(
>     <div className="alarm-backdrop" onClick={onClose}>
>       <div className="alarm-dialog" onClick={(e) => e.stopPropagation()}>
>         <h3>🚨 EMERGENCY ALARM</h3>
>         <p>{alarmMessage}</p>
>         <button onClick={onClose}>Dismiss Alarm</button>
>       </div>
>     </div>,
>     document.body
>   );
> }
> 
> export function testEmergencyAlarmPortal() {
>   const res = EmergencyAlarmPortal({ isOpen: false, onClose: () => {}, alarmMessage: 'Test' });
>   console.assert(res === null, 'Closed portal returns null');
> }
> ```
>
> #### Technical Explanation
> 1. **DOM Teleportation**: Teleports emergency alarm UI straight to `document.body` via `createPortal`.
> 2. **Click Propagation Protection**: Calls `e.stopPropagation()` on `.alarm-dialog` to prevent backdrop click triggers.
> 3. **Global Keyboard Listener**: Adds `keydown` listener in `useEffect` to handle `Escape` key dismissal.
> 4. **SSR Safety Guard**: Checks `typeof document === 'undefined'` before executing portal creation.
> 
### Exercise 2: Financial Trading Desk Tooltip Portal

**Scenario:** Implement a financial market trading tooltip component `<TradeTooltip>` that teleports its position node to `document.body` to prevent clipping inside scrollable order tables.

**Requirements:**
1. Teleport tooltip markup to `document.body`.
2. Pass coordinates `(x, y)` to position tooltip absolutely.
3. Add test assertions for tooltip portal structure.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { createPortal } from 'react-dom';
> 
> export function TradeTooltip({ text, x, y, visible }) {
>   if (!visible || typeof document === 'undefined') return null;
> 
>   return createPortal(
>     <div
>       className="trade-tooltip-portal"
>       style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
>     >
>       {text}
>     </div>,
>     document.body
>   );
> }
> 
> export function testTradeTooltip() {
>   const res = TradeTooltip({ text: 'Order Info', x: 100, y: 200, visible: true });
>   console.assert(res !== null, 'Visible tooltip portal check');
> }
> ```
>
> #### Technical Explanation
> 1. **Clipping Prevention**: Teleports tooltips to `document.body` to bypass table overflow clipping.
> 2. **Fixed Coordinate Positioning**: Uses fixed positioning with dynamic coordinate props (`x`, `y`).
> 3. **High Z-Index Stacking**: Sets `zIndex: 9999` on portal container to ensure top-level display.
> 4. **Conditional Mount Guard**: Renders nothing when `visible` evaluates to false.
> 
### Exercise 3: Healthcare EHR Patient Context Menu Portal

**Scenario:** Build a contextual right-click menu portal `<EHRContextMenu>` for hospital patient chart records.

**Requirements:**
1. Render context menu into `document.body` via `createPortal`.
2. Close menu when clicking outside.
3. Add test assertions for context menu portal mounting.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> import { createPortal } from 'react-dom';
> 
> export function EHRContextMenu({ x, y, isOpen, onClose, options }) {
>   useEffect(() => {
>     if (!isOpen) return;
>     const handleClickOutside = () => onClose();
>     window.addEventListener('click', handleClickOutside);
>     return () => window.removeEventListener('click', handleClickOutside);
>   }, [isOpen, onClose]);
> 
>   if (!isOpen || typeof document === 'undefined') return null;
> 
>   return createPortal(
>     <div
>       className="ehr-context-menu"
>       style={{ position: 'fixed', top: y, left: x, zIndex: 10000 }}
>       onClick={(e) => e.stopPropagation()}
>     >
>       <ul>
>         {options.map((opt, i) => (
>           <li key={i} onClick={opt.action}>{opt.label}</li>
>         ))}
>       </ul>
>     </div>,
>     document.body
>   );
> }
> 
> export function testEHRContextMenu() {
>   const res = EHRContextMenu({ x: 50, y: 50, isOpen: false, onClose: () => {}, options: [] });
>   console.assert(res === null, 'Closed EHR menu portal check');
> }
> ```
>
> #### Technical Explanation
> 1. **Root-Level Mounting**: Teleports contextual popup menus straight to `document.body`.
> 2. **Global Click Interception**: Listens for window click events to close context menus when clicking outside.
> 3. **Propagated Action Dispatch**: Triggers target menu item callbacks upon option selection.
> 4. **DOM Stacking Immunity**: Escapes parent stacking context boundaries completely.
> 
---

## 6. Related Terms

- [Virtual DOM](../level_01/virtual_dom.md) — Maintaining virtual tree positions independently of physical DOM nodes.
- [Synthetic Events](../level_05/synthetic_events.md) — Event delegation bubbling across portal boundaries.
- [Controlled Components](../level_05/controlled_components.md) — Managing form controls inside modal portals.
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — Handling browser document guards during SSR.

---

## 7. Key Takeaways

- Portals (`createPortal(children, container)`) render HTML DOM elements into a physical DOM node outside the parent component's DOM tree.
- Portals maintain complete integration with the React Virtual DOM tree, retaining access to parent Contexts and Synthetic Events.
- Synthetic Events bubble up through the **React Component Tree**, NOT the physical HTML DOM tree.
- Use Portals for Modals, Tooltips, Popovers, and Dropdown menus to escape parent `overflow: hidden` and `z-index` limits.
- Always check `useEffect` or `typeof document !== 'undefined'` before creating portals to prevent Server-Side Rendering (SSR) crashes.
