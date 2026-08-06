# React Error Boundaries

> **Level 2 — App Router UI Elements**
> A React class component pattern that intercepts rendering errors in its child component tree, rendering a fallback UI instead of crashing the entire application.

---

## 1. Prerequisites
- [React Components](../level_01/react_components.md) — The visual units wrapped inside the boundary.

---

## 2. Term Category

**Framework Architecture** (React Error Boundary Interception): React Error Boundaries intercept JavaScript errors in child component trees, preventing full application crashes.



---

## 3. Explanation

### Environment Context
- **Client Only** (Runtime error interception and recovery must occur inside the client's browser DOM).

### (1) Design Motivation — "Why did we design this?"
In raw HTML, if a script error occurs, the rest of the page remains visible. In standard React, if a JavaScript error (like `Cannot read properties of undefined`) is thrown during the rendering phase, React's default behavior is to completely unmount the entire component tree. This leaves the user staring at a blank screen without any context on what went wrong or how to recover.

**React Error Boundaries** were designed to solve this. They act like a `try/catch` block for UI elements. If a component inside the boundary crashes, the boundary catches the error, prevents it from bubbling up to the root, logs it, and renders a friendly "Something went wrong" fallback UI.

---

### (2) Core Concept — The Class Component Syntax
Unlike other modern React APIs, Error Boundaries must be written as class components because they rely on class-exclusive lifecycle methods (`getDerivedStateFromError` and `componentDidCatch`):

```typescript
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  // 1. Catches the error and updates state to trigger fallback rendering
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  // 2. Logs error details to telemetry databases
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

You use this boundary to isolate fragile layout widgets:

```typescript
import ErrorBoundary from './ErrorBoundary';
import FeedList from './FeedList'; // Fragile component reading external APIs

export default function Dashboard() {
  return (
    <div>
      <h1>My Feed</h1>
      {/* If FeedList crashes, the main Dashboard remains visible */}
      <ErrorBoundary fallback={<p>Could not load feed. Try refreshing.</p>}>
        <FeedList />
      </ErrorBoundary>
    </div>
  );
}
```

---

### (3) Limitations: What they CANNOT catch
Error Boundaries only catch errors that occur during the **render phase**, in lifecycle methods, and in constructor allocations of the children tree. They do not catch:
1.  **Event Handlers:** Errors inside `onClick` or `onSubmit` blocks (use standard `try/catch` inside the function instead).
2.  **Asynchronous Code:** Errors inside `setTimeout`, `requestAnimationFrame`, or client-side `fetch` promises.
3.  **Server-Side Rendering:** Errors thrown during server execution (Next.js handles these using special files).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to catch event handler errors using an Error Boundary

**The mistake:** Expecting an Error Boundary to catch a crash inside a button handler:

```typescript
// BAD: The error is ignored by the boundary, crashing the console!
export default function BuggyButton() {
  const handleClick = () => {
    throw new Error('Database write failed'); 
  };
  return <button onClick={handleClick}>Submit</button>;
}
```

**Why it's wrong:** Event handlers do not run during the rendering phase. Because React does not execute event handlers when rendering components, errors thrown inside them do not bubble through the Error Boundary system.

**Golden Rule:** Use standard JavaScript `try/catch` blocks inside your event handlers to catch and handle event errors.

---

### Mistake 2: Swallowing Exceptions in Async Functions Without Bubbling to Error Boundaries

**The mistake:** Writing `try { await fetch() } catch (err) { console.log(err); }` without re-throwing or returning error state.

**Why it's wrong:** Swallowing exceptions silently prevents React error boundaries (`error.tsx`) from catching runtime failures, leaving components in broken frozen states.

*Incorrect:*
```typescript
try {
  await db.query();
} catch (e) {
  console.log(e); // ❌ Error swallowed! UI hangs silently!
}
```

*Fix:*
```typescript
try {
  await db.query();
} catch (e) {
  throw new Error('Database connection failed'); // Bubbles up to error.tsx boundary
}
```

---

### Mistake 3: Expecting Error Boundaries to Catch Asynchronous Event Handler Errors Automatically

**The mistake:** Expecting an `error.tsx` boundary to catch errors inside a Client Component button `@click` handler.

**Why it's wrong:** React Error Boundaries catch errors thrown during RENDERING and lifecycle execution. Event handler errors do NOT trigger error boundaries automatically. Use `try/catch` in event handlers.

*Incorrect:*
```tsx
/* Expecting error.tsx to catch onClick event handler exceptions */
```

*Fix:*
```tsx
// Handle event handler errors explicitly in state:
const [error, setError] = useState(null);
async function handleClick() {
  try { await api(); } catch (e) { setError(e.message); }
}
```


---

## 5. Practice Exercises

### Exercise 1: Authoring Fallback UI in Error Boundaries

**Scenario:**
Implement a custom React Error Boundary component capturing child rendering crashes.

**Requirements:**
1. Implement `componentDidCatch()` or `getDerivedStateFromError()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import React from "react";

export class CustomErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          <h2>Component Error Captured!</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

> #### Technical Explanation
>
> 1. React Error Boundaries intercept uncaught exceptions in child component render methods and lifecycle hooks.
> 2. Renders fallback UI instead of unmounting the entire application view tree.
> 3. Must be written as class components or generated via Next.js `error.tsx`.

---

### Exercise 2: Recovering from Errors with Reset Handlers

**Scenario:**
Provide a reset button inside an error boundary allowing users to retry component execution.

**Requirements:**
1. Call reset callback function to clear error state.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

export default function ErrorFallback({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 border border-red-200 bg-red-50 rounded">
      <h3 className="text-lg font-semibold text-red-800">Something went wrong!</h3>
      <p className="text-sm text-red-600 mt-1">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Next.js passes a `reset()` callback function to error fallback components.
> 2. Executing `reset()` re-attempts to render the failed route segment component tree.
> 3. Standard user error recovery workflow.

---

### Exercise 3: Auditing Error Digest Hashing for Production Security

**Scenario:**
Inspect `error.digest` hash in production error logs to prevent exposing database details to users.

**Requirements:**
1. Log `error.digest` while displaying friendly message.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

export default function SecureErrorPage({
  error
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div>
      <h2>Application Error</h2>
      <p>Reference Code: {error.digest ?? "N/A"}</p>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. In production builds, Next.js strips sensitive exception stack traces before sending errors to the client.
> 2. Attaches a unique `error.digest` hash value for server log tracking.
> 3. Protects internal database connection strings and secrets from leaking.

---




---

## 6. Related Terms
- [`error.tsx` & `global-error.tsx`](error.md) — Next.js's wrapper that creates Error Boundaries automatically.
- [React Components](../level_01/react_components.md) — The components wrapped by boundaries.

---

## 7. Key Takeaways
- Error Boundaries act as UI `try/catch` blocks to prevent full application crashes.
- They must be written as class components utilizing `getDerivedStateFromError`.
- They only catch errors that occur during the React render phase, constructor execution, and lifecycle updates.
- They cannot catch errors inside event handlers or asynchronous callbacks.
- Next.js automatically generates Error Boundaries around pages using the `error.tsx` file.
