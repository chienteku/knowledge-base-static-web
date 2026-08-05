# Higher-Order Components (HOC)

> **Level 7 — Component Patterns**
> An advanced pattern (mostly used in older, pre-Hooks React) where a function takes a component and returns a new, enhanced component with additional data or logic.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — The building blocks HOCs wrap.
- higher_order_function — The JavaScript concept this pattern is named after.
---

## 2. Term Category
React Architecture Pattern

---

## 3. Core Definition
A Higher-Order Component (HOC) is not a component itself; it is a **function**. It takes an existing component as an argument, wraps it with some extra logic (like checking if a user is logged in, or injecting data), and returns a new component.

Before Hooks were introduced in 2018, HOCs were the primary way to share logic between multiple components without duplicating code.

---

## 4. Key Characteristics / Rules
- **Naming Convention:** HOC functions usually start with `with` (e.g., `withAuth`, `withRouter`).
- **Pure Functions:** An HOC should not mutate the original component. It should compose it by wrapping it.

---

## 5. Typical Usage / Common Patterns

### The Authentication Wrapper
```jsx
// The HOC Function
function withAuth(WrappedComponent) {
  return function EnhancedComponent(props) {
    const isLoggedIn = checkUserLogin(); // Some auth logic

    if (!isLoggedIn) {
      return <div>Please log in to view this page.</div>;
    }

    // If logged in, render the original component and pass down its props
    return <WrappedComponent {...props} />;
  };
}

// The original component
function Dashboard({ title }) {
  return <h1>{title}</h1>;
}

// The Enhanced Component
const ProtectedDashboard = withAuth(Dashboard);
```

---

## 6. Common Pitfalls
- **Wrapper Hell:** If you use too many HOCs on a single component (e.g., `export default withAuth(withTheme(withRouter(MyComponent)))`), the React DevTools tree becomes a massive, unreadable nest of wrapper components. This is why the industry shifted to Custom Hooks.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Calling Higher-Order Components (HOCs) Directly inside Component Render Bodies

**The mistake:** Writing `const EnhancedComponent = withAuth(MyComponent);` inside component render function.

**Why it's wrong:** Calling HOC factory functions inside render creates a BRAND NEW component definition on EVERY render! React unmounts and re-mounts the child tree every render. Define HOCs at top-level module scope.

*Incorrect:*
```javascript
function App() {
  const EnhancedComp = withAuth(Profile); // ❌ Re-created every render!
  return <EnhancedComp />;
}
```

*Fix:*
```javascript
// Define HOC outside component render function at module scope
const EnhancedComp = withAuth(Profile);
function App() { return <EnhancedComp />; }
```

### Mistake 2: Forgetting to Pass Ref Forwarding in HOC Wrappers

**The mistake:** Writing an HOC wrapping a component without forwarding `ref` props using `React.forwardRef`.

**Why it's wrong:** Refs are not passed through standard props. Accessing `ref` on an HOC-wrapped component attaches the ref to the HOC wrapper instance instead of the underlying wrapped component. Use `React.forwardRef` inside HOCs.

*Incorrect:*
```javascript
// HOC wrapper omitting React.forwardRef logic
```

*Fix:*
```javascript
Wrap HOC inner component in React.forwardRef((props, ref) => <WrappedComponent ref={ref} {...props} />)
```



### Mistake 3: Losing Static Component Methods When Wrapping Components in HOCs

**The mistake:** Calling static method `MyComponent.helper()` after wrapping `MyComponent` in an HOC.

**Why it's wrong:** Wrapping a component in an HOC returns a NEW container component that does NOT automatically inherit static methods from the original wrapped component. Use `hoist-non-react-statics`.

*Incorrect:*
```javascript
// Expecting static method MyComponent.helper() to be copied to HOC wrapper
```

*Fix:*
```javascript
import hoistNonReactStatics from 'hoist-non-react-statics'; hoistNonReactStatics(HOC, WrappedComponent);
```

## 6. Practice Exercises



### Exercise 1: Writing `withAuth` Higher-Order Component

**Problem:** Write `withAuth(WrappedComponent)` HOC checking `isAuthenticated` prop, rendering `<Login />` if unauthenticated.

**Expected output:**
> [!check]- Answer
> ```text
> function withAuth(WrappedComponent) { return function AuthenticatedComponent(props) { if (!props.isAuthenticated) return <Login />; return <WrappedComponent {...props} />; }; }
> ```
> ```javascript
> function withAuth(WrappedComponent) {
>   return function AuthenticatedComponent(props) {
>     if (!props.isAuthenticated) return <Login />;
>     return <WrappedComponent {...props} />;
>   };
> }
> ```
>
> **Explanation:** HOCs take a component and return an enhanced component wrapping cross-cutting concern logic.

---

### Exercise 2: HOCs vs Custom Hooks Choice

**Problem:** Why have Custom Hooks largely replaced HOCs in modern React? (Custom Hooks share stateful logic without adding wrapper component hierarchy bloat).

**Expected output:**
> [!check]- Answer
> ```text
> Custom Hooks share stateful logic without adding wrapper component hierarchy bloat
> ```
> ```text
> Custom Hooks share stateful logic without adding wrapper component hierarchy bloat
> ```
>
> **Explanation:** Custom Hooks decouple logic from component tree nesting structures.

---

### Exercise 3: Display Name Convention for HOCs

**Problem:** Set `displayName` on HOC wrapper component for clean debugging in React DevTools.

**Expected output:**
> [!check]- Answer
> ```text
> Component.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
> ```
> ```javascript
> Component.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
> ```
>
> **Explanation:** Assigning `displayName` identifies HOC wrapper components clearly in React DevTools.

## 7. Related Terms
- [Custom Hooks](../level_04/custom_hooks.md) — The modern React feature that effectively killed the widespread use of HOCs.

---
