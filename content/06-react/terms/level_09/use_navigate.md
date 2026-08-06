# `useNavigate` Hook

> **Level 9 — Routing & Ecosystem**
> Built-in React Router Hook for imperatively navigating between routes inside event handlers or side effects.

---

## 1. Prerequisites

- [React Router](react_router.md) — The library exporting the `useNavigate` hook.
- [`<Link>` Component](link_component.md) — The declarative sibling to imperative `useNavigate` navigation.

---

## 2. Term Category

**Core Hook (routing navigation)**: Built-in React Router Hook (`const navigate = useNavigate()`) that returns an imperative navigation function. While `<Link>` handles declarative user click targets, `useNavigate` executes programmatic route transitions inside event handlers, form submit callbacks, timer timeouts, or `useEffect` side effects (e.g. redirecting unauthenticated users to `/login`), unlike declarative JSX anchors.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In React applications, navigation does not always occur when a user clicks a visible hyperlink (`<Link>`). Often, navigation must occur programmatically after an asynchronous event completes:
- After a user submits a checkout form, validate data and redirect to `/receipt`.
- When an API request returns a `401 Unauthorized` status, redirect the user to `/login`.
- When a timer expires, automatically return the user to `/home`.

React Router provides **`useNavigate`** for these programmatic scenarios:
1. **Imperative Navigation Function**: Returns a callable `navigate(to, options)` function.
2. **Path Navigation**: Accepts string paths (`navigate('/dashboard')`) or relative paths (`navigate('../details')`).
3. **History Replacement (`replace: true`)**: Replaces the current URL entry in the browser history stack instead of pushing a new entry. This prevents users from clicking the browser Back button to re-enter a completed checkout form or login page.
4. **Delta Navigation**: Accepts numeric deltas to traverse history history (e.g. `navigate(-1)` goes back 1 page, `navigate(1)` goes forward 1 page).

---

### (2) Reality Metaphor
Imagine riding in an automated taxi.
- **Declarative Navigation (`<Link>`)**: You tell the driver your destination when entering the taxi, pointing directly to a location on the map printed on the window (**clicking a visible link**).
- **Imperative Navigation (`useNavigate`)**: As the taxi travels down the highway, an automated GPS alert notifies the vehicle that an accident has occurred ahead. The GPS system automatically reroutes the vehicle steering wheel to take Exit 42 (**programmatic redirection triggered by an asynchronous event**).

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export function BackButton() {
  const navigate = useNavigate();

  return (
    // Imperatively navigate back 1 page in browser history
    <button onClick={() => navigate(-1)} className="btn">
      ← Go Back
    </button>
  );
}
```

#### Fuller Example
```jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

function LoginForm() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username) return;

    // Simulate login API success, then imperatively redirect to /dashboard
    // replace: true replaces history entry so Back button doesn't re-open login form
    navigate('/dashboard', { replace: true, state: { user: username } });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h3>Account Sign In</h3>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username..."
      />
      <button type="submit">Sign In</button>
    </form>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h3>Welcome to Dashboard</h3>
      <button onClick={() => navigate('/login', { replace: true })}>
        Sign Out
      </button>
    </div>
  );
}

export function AuthNavigationApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<LoginForm />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking `navigate()` Directly Inside Component Render Bodies

**The mistake:** Calling `navigate('/path')` directly in the top-level execution body of a component.

**Why it's wrong:** Invoking `navigate()` during render phase triggers an immediate state update during rendering. React will throw an error or enter an infinite re-render loop. `navigate()` must ONLY be called inside event handlers or `useEffect` hooks.

*Incorrect:*
```jsx
function BadRedirect({ isAuth }) {
  const navigate = useNavigate();
  if (!isAuth) {
    navigate('/login'); // BAD: Direct invocation during render phase!
  }
  return <div>Protected View</div>;
}
```

*Fix:*
```jsx
function GoodRedirect({ isAuth }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuth) {
      navigate('/login'); // GOOD: Isolated inside useEffect side effect
    }
  }, [isAuth, navigate]);
  return <div>Protected View</div>;
}
```

---

### Mistake 2: Calling `useNavigate()` Outside a `<BrowserRouter>` Provider Tree

**The mistake:** Invoking `useNavigate()` inside a component that is rendered outside of `<BrowserRouter>`.

**Why it's wrong:** `useNavigate()` relies on React Router's internal Context. Invoking it outside a Router provider hierarchy throws error `useNavigate() may be used only in the context of a <Router> component`.

*Incorrect:*
```jsx
// BAD: Rendered outside Router provider context
function RootApp() {
  const navigate = useNavigate(); // Throws Error!
  return <BrowserRouter><App /></BrowserRouter>;
}
```

*Fix:*
```jsx
// GOOD: Call useNavigate inside child components wrapped by BrowserRouter
function RootApp() {
  return (
    <BrowserRouter>
      <ChildComponentWithNavigate />
    </BrowserRouter>
  );
}
```

---

### Mistake 3: Omitting `{ replace: true }` on Post-Submit or Auth Redirects

**The mistake:** Navigating to `/dashboard` after login using `navigate('/dashboard')` without passing `{ replace: true }`.

**Why it's wrong:** Default navigation pushes a new history entry onto the browser stack. If the user clicks the browser Back button from `/dashboard`, they are taken straight back to the `/login` form while authenticated.

*Incorrect:*
```jsx
// BAD: Pressing browser Back button re-opens login form
navigate('/dashboard');
```

*Fix:*
```jsx
// GOOD: Replaces login route in history stack
navigate('/dashboard', { replace: true });
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Emergency Redirect Guard

**Scenario:** An industrial IoT monitoring component checks temperature levels. If temperature exceeds 100°C, the component must automatically navigate to `/emergency-shutdown` inside `useEffect`.

**Requirements:**
1. Monitor temperature state.
2. Trigger `navigate('/emergency-shutdown')` inside `useEffect` when temperature > 100.
3. Provide mock assertion verifying component configuration.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
> 
> function TelemetryGuard() {
>   const [temp, setTemp] = useState(85);
>   const navigate = useNavigate();
> 
>   useEffect(() => {
>     if (temp > 100) {
>       navigate('/emergency-shutdown', { replace: true });
>     }
>   }, [temp, navigate]);
> 
>   return (
>     <div className="telemetry-guard">
>       <h3>Sensor Temp: {temp}°C</h3>
>       <button onClick={() => setTemp(105)}>Simulate Heat Spike (105°C)</button>
>     </div>
>   );
> }
> 
> export function IoTEmergencyApp() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/" element={<TelemetryGuard />} />
>         <Route path="/emergency-shutdown" element={<div><h3>EMERGENCY SHUTDOWN ACTIVATED</h3></div>} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof TelemetryGuard === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Programmatic Effect Guard**: `useEffect` evaluates `temp > 100` after render commit.
> 2. **`useNavigate` Invocation**: `navigate('/emergency-shutdown')` changes active route without user click action.
> 3. **`{ replace: true }`**: Replaces normal monitoring view in history, preventing back-navigation during emergency state.
> 4. **Render Loop Protection**: `useEffect` isolates navigation call from primary render phase.
> 
---

### Exercise 2: Crypto Order Execution Redirect

**Scenario:** A trading desk form processes order submissions. After submitting a trade order, the component programmatically navigates to `/receipt` using `useNavigate`.

**Requirements:**
1. Form submit handler triggering `navigate('/receipt', { replace: true })`.
2. Pass order metadata via location state option.
3. Validate component structure.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
> 
> function OrderForm() {
>   const [amount, setAmount] = useState('1.5');
>   const navigate = useNavigate();
> 
>   const handleTrade = (e) => {
>     e.preventDefault();
>     navigate('/receipt', {
>       replace: true,
>       state: { orderId: 'ORD-99', amount }
>     });
>   };
> 
>   return (
>     <form onSubmit={handleTrade} className="order-form">
>       <h3>Submit Crypto Trade</h3>
>       <input value={amount} onChange={(e) => setAmount(e.target.value)} />
>       <button type="submit">Execute Trade</button>
>     </form>
>   );
> }
> 
> export function CryptoOrderApp() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/" element={<OrderForm />} />
>         <Route path="/receipt" element={<div><h3>Trade Execution Receipt</h3></div>} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof OrderForm === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Event Handler Navigation**: Form submission handler triggers `navigate()`.
> 2. **Location State Passing**: `state: { orderId, amount }` attaches order details to navigation state.
> 3. **History Replacement**: `{ replace: true }` prevents traders from accidentally re-submitting orders via browser Back button.
> 4. **Clean Abstraction**: Decouples API handlers from JSX link markup.
> 
---

### Exercise 3: E-Commerce Storefront Authentication Guard

**Scenario:** An online store redirects unauthenticated users to `/login` when trying to access `/checkout`.

**Requirements:**
1. Check authentication status inside `useEffect`.
2. Imperatively redirect to `/login` if unauthenticated.
3. Provide mock assertion.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useEffect } from 'react';
> import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
> 
> function CheckoutView({ isAuthenticated }) {
>   const navigate = useNavigate();
> 
>   useEffect(() => {
>     if (!isAuthenticated) {
>       navigate('/login', { replace: true });
>     }
>   }, [isAuthenticated, navigate]);
> 
>   return <div><h3>Secure Checkout Page</h3></div>;
> }
> 
> export function StoreAuthApp() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/checkout" element={<CheckoutView isAuthenticated={false} />} />
>         <Route path="/login" element={<div><h3>Please Log In</h3></div>} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CheckoutView === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Auth Guard Effect**: `useEffect` inspects `isAuthenticated` flag on mount.
> 2. **Programmatic Redirect**: Unauthenticated user is redirected to `/login` automatically.
> 3. **History Stack Replacement**: Replaces `/checkout` in browser history stack to prevent back-navigation into protected route.
> 4. **Declarative Component Binding**: Wraps route protection logic cleanly.
> 
---

## 6. Related Terms

- [`<Link>` Component](link_component.md) — Declarative navigation link component.
- [React Router](react_router.md) — Framework providing `useNavigate`.
- [Side Effects](../level_03/side_effects.md) — Asynchronous tasks and effects commonly triggering programmatic navigation.

---

## 7. Key Takeaways

- `useNavigate` is a built-in React Router Hook returning an imperative navigation function (`navigate`).
- Use `useNavigate` inside event handlers, form submission callbacks, timers, or `useEffect` side effects.
- Never call `navigate()` directly inside component render bodies; isolate calls in handlers or effects.
- Pass `{ replace: true }` to replace the current URL in history, preventing unwanted Back button navigation after login or order forms.
- Pass numeric deltas (e.g. `navigate(-1)`) to navigate back or forward through browser history.
