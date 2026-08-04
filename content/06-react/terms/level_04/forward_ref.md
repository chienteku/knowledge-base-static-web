# `forwardRef` & `useImperativeHandle`

> **Level 4 — Advanced Hooks**
> Exposing DOM node refs or custom imperative interfaces across parent-child component borders.

---

## 1. Prerequisites
- [`useRef` Hook](../level_04/use_ref.md) — The reference container mechanism.
- [Components](../level_01/components.md) — The visual boundaries crossed by refs.

---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In React, `ref` is a reserved property name, similar to `key`. By default, you cannot pass a `ref` prop into a custom component because React does not attach it to the component's props object.

If a parent component needs to access a raw HTML DOM element inside a child component (for example, to focus a text input, select text, scroll a container, or trigger media playback), writing `<CustomInput ref={myRef} />` will fail, and React will throw a warning in the console.

To allow components to expose their internal DOM nodes to parents, React provides **`forwardRef`**:
-   **`forwardRef`:** A wrapper function that intercepts the `ref` attribute on a custom component and forwards it to a child DOM element or component.

However, exposing raw DOM nodes directly to parent components can violate encapsulation rules. A parent component could modify styling, delete elements, or change properties directly on the DOM, bypassing React's state tracking.

To control what a parent component can access, React provides the **`useImperativeHandle`** hook:
-   **`useImperativeHandle`:** Used alongside `forwardRef`, it allows you to customize the ref object that is exposed to the parent. Instead of returning the raw DOM node, you expose a limited, custom object containing only the specific methods you want the parent to trigger (e.g. only exposing a `.focus()` or `.clear()` method).

---

### (2) Reality Metaphor
Imagine a hotel guest interacting with the front desk.
- **Ignored Ref (Default):** A guest tries to look at the hotel guest register behind the desk. The receptionist tells them they are not allowed behind the counter (**custom component boundaries block ref access**).
- **`forwardRef` (Raw Access):** The receptionist opens the staff security gate and lets the guest walk behind the counter to use the computer directly. The guest has full access to view, edit, or delete database files (**exposing the raw DOM node ref**).
- **`useImperativeHandle` (Limited Intercom Panel):** The receptionist remains behind the counter and installs an intercom panel on the wall containing three buttons: *"Call Valet"*, *"Request Towel"*, and *"Checkout."* The guest can press these buttons to trigger actions, but they never go behind the counter or touch the computers directly. The hotel's internal systems remain secure (**exposing a custom, safe imperative interface**).

---

### (3) React Code Example

```jsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

// 1. Child Component wrapped in forwardRef
const CustomInput = forwardRef((props, ref) => {
  const localInputRef = useRef(null);

  // 2. Customize the ref object exposed to the parent
  useImperativeHandle(ref, () => ({
    // Only expose this specific focus method to the parent
    focusInput: () => {
      localInputRef.current.focus();
    },
    // Expose a method to clear the input
    clearInput: () => {
      localInputRef.current.value = '';
    }
  }));

  // Render the actual HTML input element
  return <input ref={localInputRef} type="text" placeholder="Type here..." />;
});

// 3. Parent Component consuming the child
export default function ParentForm() {
  const inputRef = useRef(null);

  const handleActions = () => {
    // Call the custom methods exposed by useImperativeHandle
    inputRef.current.focusInput();
    inputRef.current.clearInput();
  };

  return (
    <div>
      <CustomInput ref={inputRef} />
      <button onClick={handleActions}>Focus and Clear</button>
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using refs and imperative handles to bypass declarative state updates

**The mistake:** Exposing state update functions or UI state modifications inside `useImperativeHandle` instead of managing data flow through standard React props:

```javascript
// BAD: Parent triggers child state updates imperatively using refs!
inputRef.current.updateChildText("New Text");
```

**Why it's wrong:** React is fundamentally a declarative framework. Directly invoking methods to alter child state breaks unidirectional data flow, makes components difficult to test, and bypasses standard lifecycle optimization queues.

*Fix:* Use refs and `useImperativeHandle` only for non-declarative DOM operations (focus, text selection, scroll offsets, media play/pause, animations). For all data updates, lift the state up or pass updates down via standard props.

---



### Mistake 2: Attempting to Pass `ref` to Custom Components Without `forwardRef` (or React 19 `props.ref`)

**The mistake:** Passing `<MyInput ref={inputRef} />` to a standard component function `function MyInput(props) { ... }`.

**Why it's wrong:** In React 18 and earlier, `ref` is NOT a standard prop! Passing `ref` to custom components without `forwardRef` throws warning `Function components cannot be given refs`. Use `React.forwardRef` (or direct `props.ref` in React 19).

*Incorrect:*
```javascript
function MyInput(props) {
  return <input ref={props.ref} />; // ❌ Ref is undefined!
}
```

*Fix:*
```javascript
const MyInput = React.forwardRef((props, ref) => {
  return <input ref={ref} />;
});
```

### Mistake 3: Forgetting Argument Order in `forwardRef` Render Function `(props, ref)`

**The mistake:** Defining `React.forwardRef((ref, props) => ...)` with reversed arguments.

**Why it's wrong:** `forwardRef` passes arguments in strict order: `(props, ref)`. Swapping arguments breaks prop destructuring.

*Incorrect:*
```javascript
React.forwardRef((ref, props) => ...); // ❌ Reversed arguments!
```

*Fix:*
```javascript
React.forwardRef((props, ref) => ...);
```

## 6. Practice Exercises

### Exercise 1: Custom Video Player Imperative Ref

**Problem:** Complete the custom video player component below using `forwardRef` to expose custom `playVideo` and `pauseVideo` methods to the parent:

```jsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

// Solution:
const VideoPlayer = forwardRef((props, ref) => {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    playVideo: () => {
      videoRef.current.play();
    },
    pauseVideo: () => {
      videoRef.current.pause();
    }
  }));

  return <video ref={videoRef} src={props.src} width="300" />;
});

function App() {
  const playerRef = useRef(null);

  return (
    <div>
      <VideoPlayer ref={playerRef} src="video.mp4" />
      <button onClick={() => playerRef.current.playVideo()}>Play</button>
      <button onClick={() => playerRef.current.pauseVideo()}>Pause</button>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Forwarding Ref to Input Component

**Problem:** Wrap `CustomInput` component in `forwardRef` forwarding `ref` to underlying `<input>` element.

**Expected output:**
> [!check]- Answer
> ```text
> const CustomInput = React.forwardRef((props, ref) => <input ref={ref} {...props} />);
> ```
> ```javascript
> const CustomInput = React.forwardRef((props, ref) => (
>   <input ref={ref} {...props} />
> ));
> ```
>
> **Explanation:** `forwardRef` exposes internal DOM nodes of child components to parent components.

---

### Exercise 3: React 19 Ref Prop Simplification

**Problem:** How does React 19 simplify passing refs to function components? (In React 19, `ref` is available as a standard prop `props.ref` without requiring `forwardRef`).

**Expected output:**
> [!check]- Answer
> ```text
> ref is available as a standard prop (props.ref) without requiring forwardRef wrapper
> ```
> ```text
> ref is available as a standard prop (props.ref) without requiring forwardRef wrapper
> ```
>
> **Explanation:** React 19 unifies `ref` as a standard component prop.

## 7. Related Terms
- [`useRef` Hook](../level_04/use_ref.md) — The reference object engine used to create refs.
- [Portals](../level_07/portals.md) — Porting component nodes outside parent DOM trees.

---

## 8. Key Takeaways
- Custom components do not accept the `ref` prop by default.
- Wrap components in `forwardRef` to expose internal DOM nodes to parent components.
- Use `useImperativeHandle` to control what parent components can access on a child ref.
- Expose only specific methods (like `.focus()` or `.clear()`) instead of the raw DOM node.
- Use imperative handles only for non-declarative DOM actions (focus, scroll, media controls).
- Avoid using refs to update state or manage data; rely on declarative props.
