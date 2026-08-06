# Error Boundaries

> **Level 7 — Component Patterns**
> A specific class-based React component pattern that acts as a declarative `try/catch` block for component rendering, preventing unhandled UI errors from crashing the entire application.

---

## 1. Prerequisites

- [Component Lifecycle](../level_03/component_lifecycle.md) — Error Boundaries rely on specific Class lifecycle methods (`componentDidCatch`, `getDerivedStateFromError`).
- [Components](../level_01/components.md) — Wrapping component trees with safety fallback containers.
- [Declarative Programming](../level_01/declarative_programming.md) — Declaring fallback UI views for component failure states.

---

## 2. Term Category

**Component Pattern (declarative error recovery)**: An Error Boundary is a specialized React component that catches JavaScript errors thrown anywhere within its child component tree during rendering, lifecycle execution, and constructor invocation.

Unlike standard JavaScript `try/catch` blocks which wrap synchronous imperative code blocks, Error Boundaries wrap declarative JSX component subtrees. If a child component throws an unhandled error during rendering (such as attempting to read a property on an `undefined` object), the wrapping Error Boundary intercepts the exception, logs error details, and renders a fallback UI (such as an error message or retry card) instead of unmounting the entire application.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In early versions of React, if a single minor component threw a JavaScript error during rendering (e.g., failing to parse a missing string field inside a user badge), the entire React Virtual DOM tree crashed completely, unmounting the application root and leaving users with a blank white screen.

To prevent isolated component errors from bringing down entire web applications, React introduced **Error Boundaries**:

1. **Failure Isolation:** Wrapping independent feature widgets (such as a sidebar chat widget or stock ticker card) inside Error Boundaries ensures that if the widget crashes, the rest of the application (navigation, main dashboard, user settings) remains fully operational.
2. **Declarative Fallback UI:** Developers specify a graceful fallback component (`<ErrorBoundary fallback={<ErrorCard />}>`) to display in place of broken components.
3. **Class Component Mandate:** In current React (v18+), Error Boundaries MUST be written as Class Components because there are no React Hook equivalents for `static getDerivedStateFromError` or `componentDidCatch`.

### (2) Reality Metaphor

Imagine a modern electrical circuit breaker panel inside an apartment building.

Without circuit breakers (**without Error Boundaries**), if a minor toaster short-circuit occurs in apartment #4, the high voltage overload travels back to the main municipal power station, blowing out main transformers and plunging the entire city into darkness (**crashing the entire React application to a blank white screen**).

With circuit breakers (**with Error Boundaries**), apartment #4 has a dedicated circuit breaker installed on its electrical panel. When the toaster short-circuits, the breaker trips locally (**catching the child component error**). Power to apartment #4 is safely cut off while a small red warning light turns on (**rendering fallback UI**). Power to every other apartment, hallway light, and elevator in the building continues running completely uninterrupted.

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';

// Error Boundaries MUST be Class Components in React
class SimpleErrorBoundary extends React.Component {
  state = { hasError: false };

  // Update state so the next render shows the fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h3>Something went wrong in this section.</h3>;
    }
    return this.props.children;
  }
}

export default SimpleErrorBoundary;
```

#### Fuller Example

```jsx
import React from 'react';

class ComprehensiveErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // 1. Intercept error during render phase and update fallback state
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 2. Catch error details for telemetry logging services
  componentDidCatch(error, errorInfo) {
    if (this.props.onErrorLog) {
      this.props.onErrorLog(error, errorInfo);
    }
  }

  // Helper method to reset error state and attempt recovery
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback prop or default UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-card">
          <h3>Telemetry Component Failure</h3>
          <p className="error-msg">{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button onClick={this.handleReset} className="btn-retry">
            🔄 Retry Loading Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Consuming component demonstrating error boundary wrapping
export default function App() {
  return (
    <div className="app-dashboard">
      <header>
        <h2>Industrial Monitoring Control Room</h2>
      </header>

      {/* Wrapping fragile widget inside Error Boundary isolates crashes! */}
      <ComprehensiveErrorBoundary
        onErrorLog={(err) => console.log('Logged to monitoring service:', err)}
      >
        <FragileTelemetryWidget />
      </ComprehensiveErrorBoundary>
    </div>
  );
}

function FragileTelemetryWidget() {
  // Simulating rendering crash
  const data = null;
  return <div>Data Reading: {data.temperature}</div>; // Throws TypeError!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Error Boundaries to Catch Errors Inside Event Handlers or Async Code

**The mistake:** Assuming an Error Boundary will catch an error thrown inside a button `onClick` handler or an `async/await` fetch call.

**Why it's wrong:** Error Boundaries ONLY catch errors thrown during **Render frame evaluation, Lifecycle methods, and Constructors** of child components. They do NOT catch errors in Event Handlers (`onClick`), Asynchronous callbacks (`setTimeout`, Promises), or Server-Side Rendering (SSR). Use standard `try/catch` blocks inside event handlers.

*Incorrect:*
```jsx
const handleClick = () => {
  // ❌ NOT caught by Error Boundaries!
  throw new Error('Button click failed!');
};
```

*Fix:*
```jsx
const handleClick = () => {
  try {
    performAction();
  } catch (err) {
    // Handle event error in state explicitly
    setError(err.message);
  }
};
```

### Mistake 2: Attempting to Write Error Boundaries as Functional Components

**The mistake:** Trying to build a functional Error Boundary using `useEffect` or custom hooks.

**Why it's wrong:** As of modern React (v18+), functional components cannot implement `componentDidCatch` or `getDerivedStateFromError`. Error Boundaries MUST be Class Components extending `React.Component`.

*Incorrect:*
```jsx
// ❌ Functional Error Boundaries are unsupported in React!
function FunctionalErrorBoundary({ children }) {
  useEffect(() => { ... }, []);
  return children;
}
```

*Fix:*
```jsx
class ClassErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, info) { ... }
  render() { return this.state.hasError ? <Fallback /> : this.props.children; }
}
```

### Mistake 3: Failing to Provide a State Reset Recovery Button

**The mistake:** Rendering a static fallback UI without giving users a way to reset `hasError` state or attempt component recovery.

**Why it's wrong:** Once an Error Boundary catches an error, its `hasError` state remains `true` permanently until explicitly reset or remounted. Displaying permanent error cards without retry options forces users to refresh the entire browser page.

*Incorrect:*
```jsx
// Static fallback card with no retry button
render() {
  if (this.state.hasError) return <div>Component Failed Permanently.</div>;
  return this.props.children;
}
```

*Fix:*
```jsx
render() {
  if (this.state.hasError) {
    return (
      <div>
        <p>Component Failed.</p>
        <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
      </div>
    );
  }
  return this.props.children;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Gateway Telemetry Error Boundary with Recovery Reset

**Scenario:** Create an Error Boundary for an IoT sensor telemetry monitoring dashboard. The boundary logs errors to console and provides a "Reset Gateway View" button that clears error state.

**Requirements:**
1. Implement `IoTErrorBoundary` as a Class Component.
2. Implement `static getDerivedStateFromError` and `componentDidCatch`.
3. Provide a reset handler resetting `hasError: false`.
4. Include runtime test assertions for class error state updates.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export class IoTErrorBoundary extends React.Component {
>   constructor(props) {
>     super(props);
>     this.state = { hasError: false, errorInfo: null };
>   }
> 
>   static getDerivedStateFromError(error) {
>     return { hasError: true };
>   }
> 
>   componentDidCatch(error, info) {
>     this.setState({ errorInfo: error.message });
>   }
> 
>   handleReset = () => {
>     this.setState({ hasError: false, errorInfo: null });
>   };
> 
>   render() {
>     if (this.state.hasError) {
>       return (
>         <div className="iot-error-card">
>           <h4>IoT Sensor Stream Failure</h4>
>           <p>{this.state.errorInfo}</p>
>           <button onClick={this.handleReset}>Reset Gateway Stream</button>
>         </div>
>       );
>     }
>     return this.props.children;
>   }
> }
> 
> export function testIoTErrorBoundaryState() {
>   const res = IoTErrorBoundary.getDerivedStateFromError(new Error('Sensor Fail'));
>   console.assert(res.hasError === true, 'Error boundary static state check');
> }
> ```
>
> #### Technical Explanation
> 1. **Class Component Architecture**: Complies strictly with React's Error Boundary Class requirement.
> 2. **Static State Derivation**: Uses `getDerivedStateFromError` to compute `hasError: true` during render error phases.
> 3. **Telemetry Logging**: Captures error message details in `componentDidCatch`.
> 4. **User-Driven Recovery**: Provides `handleReset` to restore normal component rendering upon user action.
> 
### Exercise 2: Financial Trading Desk Isolated Widget Error Boundary

**Scenario:** Build an Error Boundary wrapping individual stock ticker widgets. If one ticker widget crashes during render, only that ticker displays a fallback error badge.

**Requirements:**
1. Create `TickerErrorBoundary` class.
2. Accept custom `fallback` prop.
3. Include runtime test assertions verifying fallback prop selection.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export class TickerErrorBoundary extends React.Component {
>   state = { hasError: false };
> 
>   static getDerivedStateFromError(error) {
>     return { hasError: true };
>   }
> 
>   componentDidCatch(error, info) {
>     console.error('Ticker Error:', error);
>   }
> 
>   render() {
>     if (this.state.hasError) {
>       return this.props.fallback || <span className="ticker-badge error">Ticker Unavailable</span>;
>     }
>     return this.props.children;
>   }
> }
> 
> export function testTickerErrorBoundary() {
>   const instance = new TickerErrorBoundary({});
>   instance.state = { hasError: true };
>   const output = instance.render();
>   console.assert(output.props.className.includes('error'), 'Ticker fallback rendering test');
> }
> ```
>
> #### Technical Explanation
> 1. **Isolated Widget Protection**: Isolates rendering exceptions to individual ticker badge nodes.
> 2. **Flexible Fallback Prop**: Renders custom `fallback` JSX when provided by parent components.
> 3. **Failure Isolation**: Keeps sibling order book components active when a single ticker badge fails.
> 4. **Class Instance Method Testing**: Tests `render()` output directly against instance state.
> 
### Exercise 3: Healthcare Patient EHR Chart Error Boundary

**Scenario:** Implement an Error Boundary for a hospital EHR patient chart module. If chart data parsing fails, display a patient emergency fallback warning banner.

**Requirements:**
1. Build `EHRErrorBoundary` Class Component.
2. Render emergency alert banner on error.
3. Add test assertions for error boundary fallback rendering.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export class EHRErrorBoundary extends React.Component {
>   state = { hasError: false };
> 
>   static getDerivedStateFromError(error) {
>     return { hasError: true };
>   }
> 
>   componentDidCatch(error, info) {
>     // Log clinical system errors
>   }
> 
>   render() {
>     if (this.state.hasError) {
>       return (
>         <div className="ehr-alert-banner">
>           ⚠️ Clinical Record Render Error: Please reload patient chart manually.
>         </div>
>       );
>     }
>     return this.props.children;
>   }
> }
> 
> export function testEHRErrorBoundary() {
>   const state = EHRErrorBoundary.getDerivedStateFromError(new Error('Chart null'));
>   console.assert(state.hasError === true, 'EHR error boundary derivation check');
> }
> ```
>
> #### Technical Explanation
> 1. **Clinical Failure Shield**: Prevents null EHR chart parsing errors from breaking the entire nursing station dashboard.
> 2. **Declarative Fallback Display**: Displays explicit instructions for medical staff upon chart render failure.
> 3. **Static Method Verification**: Validates `getDerivedStateFromError` output deterministically.
> 4. **Standard Class Lifecycle Conformance**: Adheres to modern React error boundary lifecycle requirements.
> 
---

## 6. Related Terms

- [Component Lifecycle](../level_03/component_lifecycle.md) — The class lifecycle methods (`componentDidCatch`) underlying error boundaries.
- [Components](../level_01/components.md) — Wrapping component subtrees with failure safety nets.
- [Declarative Programming](../level_01/declarative_programming.md) — Declaring fallback UI views for failure states.
- [Error](../level_01/error.md) — Next.js framework error boundary file conventions.

---

## 7. Key Takeaways

- Error Boundaries catch JavaScript rendering errors anywhere in child component subtrees, preventing application-wide white screen crashes.
- In current React (v18+), Error Boundaries MUST be written as Class Components implementing `static getDerivedStateFromError` and/or `componentDidCatch`.
- Error Boundaries ONLY catch errors thrown during rendering, lifecycle methods, and constructors; they do NOT catch errors in event handlers or async calls.
- Wrap independent feature widgets in separate Error Boundaries to isolate component crashes cleanly.
- Always provide a reset option (`handleReset`) in fallback UI components to allow users to recover from transient errors.
