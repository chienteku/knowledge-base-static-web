# Error Boundaries

> **Level 7 — Component Patterns**
> A specific type of React component that acts like a `catch {}` block for the UI, preventing the entire React application from crashing when a single child component throws a JavaScript error.

---

## 1. Prerequisites
- [Component Lifecycle](../level_03/component_lifecycle.md) — Error Boundaries rely on specific, class-based lifecycle methods.
- [Components](../level_01/components.md) — Catching JavaScript errors anywhere in component trees.

---

## 2. Term Category
React Error Handling

---

## 3. Core Definition
Normally, if a JavaScript error happens inside a React component during rendering (e.g., trying to access `user.name` when `user` is undefined), the entire React component tree will crash, leaving the user with a completely blank white screen.

An **Error Boundary** is a "safety net" component that wraps around your application. If any component inside the net throws an error, the Error Boundary catches it, prevents the crash from bubbling up to the root, and displays a "Fallback UI" (like a polite "Something went wrong" message) instead of the broken component.

---

## 4. Key Characteristics / Rules
- **Must be a Class Component:** As of modern React, there is no Hook equivalent for Error Boundaries. You are forced to write a Class Component to use the `componentDidCatch` lifecycle method.
- **Where they catch:** They catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them.
- **Where they DO NOT catch:** They do *not* catch errors in event handlers (like an `onClick` function) or asynchronous code (like a `setTimeout` or `fetch`). You must use standard `try/catch` for those.

---

## 5. Typical Usage / Common Patterns

### Creating the Boundary
```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // If an error occurs, update state to show the fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Log the error to a service
  componentDidCatch(error, errorInfo) {
    logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children; 
  }
}
```

### Using the Boundary
You wrap it around components that might fail:
```jsx
function App() {
  return (
    <div>
      <Header />
      <ErrorBoundary>
        <FragileDashboard />
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
```
If `FragileDashboard` crashes, the Header and Footer remain perfectly intact.

---

## 6. Common Pitfalls
- **Missing Event Handler Coverage:** A developer assumes their Error Boundary will catch a failing API call triggered by a button click. It won't. Error Boundaries are only for *rendering* errors.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Expecting Error Boundaries to Catch Errors inside Event Handlers or Async Code

**The mistake:** Expecting an Error Boundary to catch errors thrown inside a button `onClick` or `setTimeout`.

**Why it's wrong:** Error Boundaries catch errors thrown during **Render, Lifecycle methods, and Constructors** of child trees! They DO NOT catch errors in Event Handlers, Async code (`fetch`), or Server-Side Rendering. Use standard `try/catch` in event handlers.

*Incorrect:*
```javascript
const handleClick = () => {
  throw new Error('Click failed!'); // ❌ NOT caught by Error Boundaries!
};
```

*Fix:*
```javascript
const handleClick = () => {
  try { ... } catch (err) { setError(err); } // Use try/catch in event handlers
};
```

### Mistake 2: Attempting to Write Error Boundaries as Function Components (Without Class Components)

**The mistake:** Trying to create a functional Error Boundary component using `useEffect`.

**Why it's wrong:** In React, Error Boundaries MUST be Class Components implementing `componentDidCatch` or `getDerivedStateFromError`. Function components cannot act as Error Boundaries currently.

*Incorrect:*
```javascript
function ErrorBoundary() { useEffect(() => { ... }); } // ❌ Function Error Boundaries unsupported!
```

*Fix:*
```javascript
class ErrorBoundary extends React.Component { componentDidCatch(error) { ... } }
```



### Mistake 3: Failing to Reset Error Boundary State when Navigation or User Action Occurs

**The mistake:** Displaying error boundary fallback UI permanently without giving users a Reset button or resetting on route change.

**Why it's wrong:** Once an Error Boundary catches an error, `hasError` state remains `true` forever until state is explicitly reset or the boundary is remounted.

*Incorrect:*
```javascript
// Displaying permanent static error screen with no retry button
```

*Fix:*
```javascript
<button onClick={() => this.setState({ hasError: false })}>Try Again</button>
```

## 6. Practice Exercises



### Exercise 1: Class Error Boundary Implementation

**Problem:** Write basic class `ErrorBoundary` implementing `getDerivedStateFromError` and `componentDidCatch`.

**Expected output:**
> [!check]- Answer
> ```text
> class ErrorBoundary extends React.Component { state = { hasError: false }; static getDerivedStateFromError(error) { return { hasError: true }; } componentDidCatch(error, info) { console.error(error, info); } render() { return this.state.hasError ? <h1>Something went wrong.</h1> : this.props.children; } }
> ```
> ```javascript
> class ErrorBoundary extends React.Component {
>   state = { hasError: false };
>   static getDerivedStateFromError(error) {
>     return { hasError: true };
>   }
>   componentDidCatch(error, info) {
>     console.error(error, info);
>   }
>   render() {
>     if (this.state.hasError) {
>       return <h1>Something went wrong.</h1>;
>     }
>     return this.props.children;
>   }
> }
> ```
>
> **Explanation:** `static getDerivedStateFromError` updates fallback UI state when child render errors occur.
> 
---

### Exercise 2: Where Error Boundaries Should Be Placed

**Problem:** Where should Error Boundaries be placed in app trees? (Wrap top-level app roots or individual heavy widget features to isolate UI crashes).

**Expected output:**
> [!check]- Answer
> ```text
> Wrap top-level app roots or individual heavy feature widgets to isolate crashes
> ```
> ```text
> Wrap top-level app roots or individual heavy feature widgets to isolate crashes
> ```
>
> **Explanation:** Isolating feature widgets inside Error Boundaries prevents single component crashes from unmounting the whole app UI.
> 
---

### Exercise 3: Error Boundary Reset Functionality

**Problem:** Add `resetError` method to `ErrorBoundary` class resetting `hasError` state to false.

**Expected output:**
> [!check]- Answer
> ```text
> resetError = () => { this.setState({ hasError: false }); };
> ```
> ```javascript
> resetError = () => {
>   this.setState({ hasError: false });
> };
> ```
>
> **Explanation:** Resetting Error Boundary state allows users to recover from transient component errors.
> 
## 7. Related Terms
- [`error.tsx` & `global-error.tsx`](../../../09-nextjs/terms/level_02/error.md) — The Next.js framework has built-in Error Boundaries disguised as simple files.

---

