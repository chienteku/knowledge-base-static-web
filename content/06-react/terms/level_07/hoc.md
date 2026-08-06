# Higher-Order Components (HOC)

> **Level 7 — Component Patterns**
> An advanced component pattern (predominant in pre-Hooks React codebases) where a function accepts a component as an argument and returns an enhanced component with added props or cross-cutting logic.

---

## 1. Prerequisites

- [Components](../level_01/components.md) — The target building blocks wrapped and enhanced by HOCs.
- [Higher Order Function](../level_01/higher_order_function.md) — The foundational JavaScript functional programming concept HOCs are named after.
- [Custom Hooks](../level_04/custom_hooks.md) — The modern React mechanism that replaced HOCs for sharing stateful logic.

---

## 2. Term Category

**Component Pattern (higher-order component abstraction)**: A Higher-Order Component (HOC) is not a component itself; it is a **pure function** that accepts a component as an argument and returns a new, enhanced component wrapper.

Formally defined as $EnhancedComponent = HOC(WrappedComponent)$, HOCs enable sharing cross-cutting concerns (such as authentication checking, global theme injection, data fetching, or event logging) across multiple components without duplicating code. Rather than mutating the original component, an HOC wraps the target component inside a container component that computes extra props or conditional rendering, passing the combined props down to the original component.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before React 16.8 introduced Hooks, functional components could not hold state or execute side-effects. Sharing stateful logic or cross-cutting features (like checking if a user is an administrator before rendering a dashboard) across multiple components required using Class Components. Duplicate authentication or data-fetching logic had to be copy-pasted into `componentDidMount` across dozens of files.

To solve this code duplication, React developers adopted Higher-Order Components:

1. **Cross-Cutting Logic Reuse:** Logic (such as checking auth tokens) is written once inside an HOC function (`withAuth`).
2. **Component Enhancement:** Any component requiring auth protection is wrapped at module export scope (`export default withAuth(Dashboard)`).
3. **Prop Injection:** The HOC container handles side-effects and injects computed data (like `user` object) as props into the inner component.

While HOCs solved logic duplication, they suffered from major drawbacks: "Wrapper Hell" (deeply nested component trees in React DevTools), prop name collisions, and complex ref forwarding. Custom Hooks have largely superseded HOCs in modern React codebases.

### (2) Reality Metaphor

Imagine a commercial airline pilot putting on a specialized flight pressure suit.

The pilot (**the original `WrappedComponent`**) possesses all core flying skills and training. However, to fly at extreme high altitudes, the pilot needs specialized life-support telemetry, oxygen feeds, and pressure management (**cross-cutting logic**).

Rather than performing surgery to build oxygen tanks directly inside the pilot's body (**mutating component definitions**), the pilot steps inside a full flight pressure suit wrapper (**the HOC function `withHighAltitudeSuit`**). The suit wraps around the pilot, manages life support telemetry outside, and feeds oxygen directly to the pilot (**injecting props**). The pilot inside remains unchanged and can fly both low-altitude planes (unwrapped) and high-altitude planes (wrapped in the suit).

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';

// HOC function accepting a component and returning an enhanced component
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const isAuthenticated = Boolean(localStorage.getItem('token'));

    if (!isAuthenticated) {
      return <div className="auth-error">Please log in to access this page.</div>;
    }

    // Pass original props down to wrapped component
    return <WrappedComponent {...props} />;
  };
}

export default withAuth;
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

// HOC function providing telemetry window window size data to wrapped components
function withWindowDimensions(WrappedComponent) {
  // Set display name for clean debugging in React DevTools
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithWindowDimensions(props) {
    const [dimensions, setDimensions] = useState({
      width: window.innerWidth,
      height: window.innerHeight
    });

    useEffect(() => {
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Inject 'windowDimensions' prop into the wrapped component
    return <WrappedComponent windowDimensions={dimensions} {...props} />;
  }

  WithWindowDimensions.displayName = `WithWindowDimensions(${displayName})`;
  return WithWindowDimensions;
}

// Target component consuming injected windowDimensions prop
function IndustrialControlRoom({ windowDimensions, roomName }) {
  const isCompact = windowDimensions.width < 768;

  return (
    <div className={`control-room ${isCompact ? 'compact' : 'full'}`}>
      <h3>Control Room: {roomName}</h3>
      <p>Screen Dimensions: {windowDimensions.width}px × {windowDimensions.height}px</p>
      {isCompact ? <p>Compact Layout Active</p> : <p>Multi-Monitor Grid Active</p>}
    </div>
  );
}

// Enhance component at top-level module scope
const ResponsiveControlRoom = withWindowDimensions(IndustrialControlRoom);

export default function App() {
  return <ResponsiveControlRoom roomName="Sector-7 Operations" />;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Executing HOC Factory Functions Inside Component Render Functions

**The mistake:** Writing `const EnhancedComponent = withAuth(MyComponent);` inside a component render body.

**Why it's wrong:** Calling an HOC factory function inside a render function creates a BRAND NEW component function reference on EVERY render frame! React sees a completely new component type, forcing it to unmount, destroy, and remount the entire child DOM tree on every render frame, destroying internal state and focus. Define HOCs at top-level module scope.

*Incorrect:*
```jsx
function App() {
  // ❌ Re-creates component definition on EVERY render frame!
  const EnhancedComp = withAuth(Profile);
  return <EnhancedComp />;
}
```

*Fix:*
```jsx
// Define HOC wrapper ONCE at top-level module scope
const EnhancedComp = withAuth(Profile);

function App() {
  return <EnhancedComp />;
}
```

### Mistake 2: Forgetting to Forward Refs Through HOC Wrappers (`React.forwardRef`)

**The mistake:** Attaching a `ref` prop to an HOC-wrapped component without using `React.forwardRef` inside the HOC definition.

**Why it's wrong:** `ref` is NOT a standard prop in React; like `key`, it is handled specially by the React engine. Passing a `ref` to an HOC-wrapped component attaches the ref to the outer HOC wrapper container instead of the inner target DOM node. Use `React.forwardRef`.

*Incorrect:*
```jsx
// ❌ Ref attaches to outer wrapper function, NOT WrappedComponent!
function withLogger(WrappedComponent) {
  return (props) => <WrappedComponent {...props} />;
}
```

*Fix:*
```jsx
function withLogger(WrappedComponent) {
  return React.forwardRef((props, ref) => (
    <WrappedComponent ref={ref} {...props} />
  ));
}
```

### Mistake 3: Losing Static Component Methods When Wrapping in HOCs

**The mistake:** Attempting to call `MyComponent.staticHelper()` after wrapping `MyComponent` in an HOC.

**Why it's wrong:** Wrapping a component in an HOC returns a brand new container function. Static methods attached to the original component function are lost and do not automatically copy over to the new container function. Use `hoist-non-react-statics`.

*Incorrect:*
```jsx
// ❌ Static methods are lost on the returned wrapper function!
const EnhancedComp = withAuth(MyComponent);
EnhancedComp.staticHelper(); // TypeError: EnhancedComp.staticHelper is not a function
```

*Fix:*
```jsx
import hoistNonReactStatics from 'hoist-non-react-statics';

function withAuth(WrappedComponent) {
  function Enhanced(props) { return <WrappedComponent {...props} />; }
  // Copy static methods automatically
  hoistNonReactStatics(Enhanced, WrappedComponent);
  return Enhanced;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Gateway Telemetry Logger HOC (`withTelemetryLogger`)

**Scenario:** Create an HOC `withTelemetryLogger(WrappedComponent)` that logs component mount and unmount events to console with timestamp details.

**Requirements:**
1. Return a functional wrapper executing `useEffect`.
2. Log mount and unmount messages including component `displayName`.
3. Pass all props transparently to `WrappedComponent`.
4. Include runtime test assertions for HOC creation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> 
> export function withTelemetryLogger(WrappedComponent) {
>   const name = WrappedComponent.displayName || WrappedComponent.name || 'Component';
> 
>   function WithTelemetryLogger(props) {
>     useEffect(() => {
>       console.log(`[MOUNT] ${name} at ${new Date().toISOString()}`);
>       return () => {
>         console.log(`[UNMOUNT] ${name} at ${new Date().toISOString()}`);
>       };
>     }, []);
> 
>     return <WrappedComponent {...props} />;
>   }
> 
>   WithTelemetryLogger.displayName = `WithTelemetryLogger(${name})`;
>   return WithTelemetryLogger;
> }
> 
> export function testWithTelemetryLogger() {
>   const Dummy = () => <div>Dummy</div>;
>   const Enhanced = withTelemetryLogger(Dummy);
>   console.assert(Enhanced.displayName === 'WithTelemetryLogger(Dummy)', 'HOC displayName check');
> }
> ```
>
> #### Technical Explanation
> 1. **Cross-Cutting Lifecycle Injection**: Houses mount/unmount logging inside container `useEffect`.
> 2. **Transparent Prop Passing**: Passes `props` through to `WrappedComponent` using spread syntax.
> 3. **DevTools Display Name Setting**: Sets `displayName` to facilitate debugging in React DevTools.
> 4. **Pure HOC Transformation**: Returns a clean wrapper component without mutating the input component.
> 
### Exercise 2: Financial Trading Desk Authentication HOC (`withTradingAuth`)

**Scenario:** Build an HOC `withTradingAuth(WrappedComponent)` verifying user `role === 'TRADER'`. If unauthorized, render an access denied message.

**Requirements:**
1. Inspect `props.user` inside returned wrapper.
2. Render access denied fallback if `user.role !== 'TRADER'`.
3. Pass props to `WrappedComponent` if authorized.
4. Add runtime assertions for auth evaluation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function withTradingAuth(WrappedComponent) {
>   return function AuthenticatedTrader(props) {
>     const { user } = props;
>     if (!user || user.role !== 'TRADER') {
>       return <div className="access-denied">Access Denied: Trader Credentials Required</div>;
>     }
>     return <WrappedComponent {...props} />;
>   };
> }
> 
> export function testWithTradingAuth() {
>   const Dummy = () => <div>Trade Desk</div>;
>   const Protected = withTradingAuth(Dummy);
>   const deniedRes = Protected({ user: { role: 'GUEST' } });
>   console.assert(deniedRes.props.className === 'access-denied', 'HOC access denied test');
> }
> ```
>
> #### Technical Explanation
> 1. **Conditional Render Branching**: Evaluates authorization rules before executing child component rendering.
> 2. **Reusable Security Guard**: Enforces trading role permissions across multiple trading widgets.
> 3. **Passthrough Architecture**: Passes props down when user passes verification checks.
> 4. **Synchronous Function Testing**: Tests HOC rendering output directly against mock props.
> 
### Exercise 3: Healthcare Patient EHR Audit Log HOC (`withEHRAuditLog`)

**Scenario:** Create an HOC `withEHRAuditLog(WrappedComponent)` injecting an `auditLog(action)` callback prop into wrapped clinical chart components.

**Requirements:**
1. Define wrapper injecting `auditLog` function prop.
2. Preserve original component props.
3. Include runtime test assertions for HOC prop injection.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function withEHRAuditLog(WrappedComponent) {
>   return function AuditLogWrapper(props) {
>     const auditLog = (action) => {
>       console.log(`[EHR AUDIT] Action: ${action} at ${Date.now()}`);
>     };
> 
>     return <WrappedComponent auditLog={auditLog} {...props} />;
>   };
> }
> 
> export function testWithEHRAuditLog() {
>   const Dummy = ({ auditLog }) => <div>{typeof auditLog}</div>;
>   const Enhanced = withEHRAuditLog(Dummy);
>   const res = Enhanced({});
>   console.assert(typeof res.props.auditLog === 'function', 'HOC injected prop check');
> }
> ```
>
> #### Technical Explanation
> 1. **Prop Injection Pattern**: Supplies helper functions (`auditLog`) into component prop signatures.
> 2. **Cross-Cutting Compliance**: Standardizes medical audit logging across clinical EHR charts.
> 3. **Non-Mutating Enhancement**: Wraps components without altering underlying code files.
> 4. **Functional Signature Verification**: Tests injected prop types deterministically.
> 
---

## 6. Related Terms

- [Custom Hooks](../level_04/custom_hooks.md) — The modern React feature that largely superseded HOCs.
- [Higher Order Function](../level_01/higher_order_function.md) — The JS functional programming foundation of HOCs.
- [Render Props](render_props.md) — Competing pre-Hooks pattern for sharing component logic.
- [Composition over Inheritance](composition_inheritance.md) — The underlying design paradigm favoring wrappers over class inheritance.

---

## 7. Key Takeaways

- A Higher-Order Component (HOC) is a pure function that takes a component as an argument and returns an enhanced component.
- HOCs were the primary pre-Hooks pattern for sharing cross-cutting logic (auth, logging, data fetching) across components.
- Always define HOCs at top-level module scope (`const Enhanced = withAuth(Comp)`); NEVER call HOC functions inside render bodies.
- Use `React.forwardRef` inside HOC definitions to ensure `ref` props pass through to the inner wrapped DOM node.
- Modern React development heavily favors Custom Hooks over HOCs due to cleaner composition and zero wrapper tree bloat.
