# The Context API

> **Level 6 — Context & Global State**
> A built-in React feature that enables components to share and distribute state across entire component subtrees without manually passing props through intermediate layers.

---

## 1. Prerequisites

- [Prop Drilling](prop_drilling.md) — The specific structural architectural issue Context was created to solve.
- [Components](../level_01/components.md) — Passing data through component hierarchies.
- [`useState` Hook](../level_02/use_state.md) — Managing the reactive state held inside Context Providers.

---

## 2. Term Category

**Component Pattern (tree-wide state distribution)**: The Context API is a built-in React mechanism designed for broad, tree-wide state broadcasting. It consists of three core elements: `createContext()`, `<Context.Provider value={...}>`, and a consumption subscriber (`useContext` or `<Context.Consumer>`).

Unlike local component state which is confined to a single component or explicitly passed to immediate children via props, Context creates a broadcast channel. Any descendant component anywhere within the `<Context.Provider>` subtree can consume the provided context value directly, completely bypassing intermediate container components. When the `value` prop supplied to `<Context.Provider>` changes, React automatically re-renders all subscriber components tuned into that context.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In React's unidirectional data flow, state must live in a common ancestor component and pass down through `props`. When an application grows to include global data—such as the authenticated user profile, active UI color theme, or localized language dictionary—that data is needed by components scattered deep across the entire component tree.

Without Context, developers were forced to pass these global values through dozens of intermediate layout containers (`<App>` -> `<Layout>` -> `<Page>` -> `<Sidebar>` -> `<UserAvatar>`), even though `Layout`, `Page`, and `Sidebar` had no use for the data themselves. This "Prop Drilling" polluted component APIs and made refactoring brittle. The Context API was designed as an official React alternative, allowing top-most components to broadcast data straight to deeply nested consumers without intermediate prop pollution.

### (2) Reality Metaphor

Imagine a radio broadcasting tower in a metropolitan city.

Without a radio tower (**without Context**), if the station owner wants to deliver a weather announcement to a citizen in a skyscraper basement, the station owner must hand a physical letter to the building landlord, who hands it to the floor manager, who hands it to the office supervisor, who finally hands it to the citizen (**Prop Drilling**). Every middleman must handle the letter.

With a radio tower (**with the Context API**), the station owner broadcasts the radio signal into the air (**`<Context.Provider value={...}>`**). Any citizen holding a radio receiver tuned to that exact frequency (**`useContext(RadioContext)`**) receives the weather announcement instantly, regardless of how deep inside the building they sit. The landlord and supervisors do not need to know the announcement exists.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { createContext, useState } from 'react';

// 1. Create the Context object
export const ThemeContext = createContext('light');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  // 2. Provide the broadcast value to all children
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### Fuller Example

```jsx
import React, { createContext, useContext, useState, useMemo } from 'react';

// 1. Create Context
const AuthContext = createContext(null);

// 2. Custom Provider Component encapsulating state
export function AuthProvider({ children }) {
  const [user, setUser] = useState({ name: 'Alex', role: 'admin' });

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  // Memoize value to prevent unnecessary re-render cascades!
  const contextValue = useMemo(() => ({
    user,
    login,
    logout
  }), [user]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom consumption hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}

// 3. Deeply nested Consumer Component
function UserBadge() {
  const { user, logout } = useAuth();

  return (
    <div className="user-badge">
      <span>Welcome, {user ? user.name : 'Guest'} ({user?.role})</span>
      {user && <button onClick={logout}>Log Out</button>}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <header className="app-header">
        <nav>
          <h2>Dashboard</h2>
          {/* UserBadge accesses AuthContext directly without prop drilling! */}
          <UserBadge />
        </nav>
      </header>
    </AuthProvider>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing Un-Memoized Value Objects to Context Providers (Re-Render Cascade)

**The mistake:** Writing `<AuthContext.Provider value={{ user, setUser }}>` with an inline object.

**Why it's wrong:** Writing `value={{ user, setUser }}` creates a BRAND NEW object memory reference on every single parent render! Because React compares context values using `Object.is()`, EVERY component subscribing to `AuthContext` is forced to re-render on every parent render frame, even if `user` state did not change.

*Incorrect:*
```jsx
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ❌ Inline object creates new reference every render frame!
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}
```

*Fix:*
```jsx
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Memoize context object reference
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Mistake 2: Storing High-Frequency Changing State in Context

**The mistake:** Storing 60fps mouse coordinates or fast text input states inside a top-level Context.

**Why it's wrong:** Context does NOT support fine-grained selector subscriptions natively. When a Context value changes, EVERY component that consumes `useContext(MyContext)` MUST re-render. Updating Context 60 times a second forces entire subscriber trees to re-render 60 times a second, causing severe UI lag. Use Zustand or Redux for high-frequency state.

*Incorrect:*
```jsx
// Storing 60fps mouse position state in global React Context
const MouseContext = createContext({ x: 0, y: 0 });
```

*Fix:*
```jsx
// Use local component state or external store libraries for high-frequency data
```

### Mistake 3: Consuming Context Outside its `<Context.Provider>` Subtree

**The mistake:** Calling `useContext(AuthContext)` in a component rendered outside the `<AuthContext.Provider>` tag hierarchy.

**Why it's wrong:** If a component calls `useContext` outside its provider wrapper, React returns the default value passed during `createContext(defaultValue)`. If no default value was supplied (`createContext(null)`), accessing properties like `user.name` causes a runtime `TypeError: Cannot read properties of null`.

*Incorrect:*
```jsx
function Header() {
  // ❌ Crashes if Header is rendered outside AuthProvider!
  const { user } = useContext(AuthContext);
  return <div>{user.name}</div>;
}
```

*Fix:*
```jsx
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry System Unit Context Provider

**Scenario:** Create an IoT Gateway unit context system. The context broadcasts temperature units (`'celsius'` | `'fahrenheit'`) and a toggle function across an industrial dashboard.

**Requirements:**
1. Create `UnitContext` using `createContext()`.
2. Implement `UnitProvider` with `useMemo` context value caching.
3. Provide a unit conversion helper (`celsiusToFahrenheit`).
4. Include runtime test assertions for context default values.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState, useMemo } from 'react';
> 
> const UnitContext = createContext(null);
> 
> export function UnitProvider({ children }) {
>   const [unit, setUnit] = useState('celsius');
> 
>   const toggleUnit = () => {
>     setUnit((prev) => (prev === 'celsius' ? 'fahrenheit' : 'celsius'));
>   };
> 
>   const value = useMemo(() => ({ unit, toggleUnit }), [unit]);
> 
>   return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
> }
> 
> export function useUnit() {
>   const context = useContext(UnitContext);
>   if (!context) throw new Error('useUnit must be used inside UnitProvider');
>   return context;
> }
> 
> export function testUnitContext() {
>   const defaultValue = createContext('celsius');
>   console.assert(defaultValue !== null, 'Context creation check');
> }
> ```
>
> #### Technical Explanation
> 1. **Memoized Provider Value**: Uses `useMemo` to stabilize context payload object references across re-renders.
> 2. **State Toggle Logic**: Provides safe functional updaters for switching unit types.
> 3. **Custom Guard Hook**: Throws explicit error messages if components consume context outside `UnitProvider`.
> 4. **Tree Distribution**: Teleports telemetry unit preferences straight to child widgets without prop passing.
> 
### Exercise 2: Financial Multi-Currency Portfolio Context

**Scenario:** Implement an institutional portfolio currency Context Provider (`CurrencyContext`). The context manages active base currency (`'USD'`, `'EUR'`, `'GBP'`) and exchange rates.

**Requirements:**
1. Manage selected currency state inside `CurrencyProvider`.
2. Expose a currency formatter helper function in context value.
3. Wrap context value in `useMemo`.
4. Add runtime assertions verifying currency formatting.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState, useMemo } from 'react';
> 
> const CurrencyContext = createContext(null);
> 
> const RATES = { USD: 1.0, EUR: 0.92, GBP: 0.79 };
> 
> export function CurrencyProvider({ children }) {
>   const [currency, setCurrency] = useState('USD');
> 
>   const formatAmount = (amountInUSD) => {
>     const rate = RATES[currency] || 1.0;
>     const converted = amountInUSD * rate;
>     return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(converted);
>   };
> 
>   const value = useMemo(() => ({ currency, setCurrency, formatAmount }), [currency]);
> 
>   return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
> }
> 
> export function useCurrency() {
>   const ctx = useContext(CurrencyContext);
>   if (!ctx) throw new Error('useCurrency must be used in CurrencyProvider');
>   return ctx;
> }
> 
> export function testCurrencyProvider() {
>   const ratesCheck = RATES['EUR'] === 0.92;
>   console.assert(ratesCheck, 'Exchange rate check');
> }
> ```
>
> #### Technical Explanation
> 1. **Encapsulated Utility Calculation**: Bundles formatting logic (`formatAmount`) directly into the context payload.
> 2. **Reference Stabilization**: Recalculates memoized value strictly when `currency` state changes.
> 3. **App-Wide Currency Projection**: Allows deep financial widget nodes to format USD inputs into selected local currencies.
> 4. **Type-Safe Context Boundary**: Protects context subscribers with custom hook verification checks.
> 
### Exercise 3: Healthcare EHR Patient Context Provider

**Scenario:** Create a medical EHR active patient context (`PatientContext`). Subscribing components display patient info or update clinical notes without prop drilling.

**Requirements:**
1. Store active patient object state in `PatientProvider`.
2. Provide `updateVitals` callback updater function.
3. Ensure context value is memoized with `useMemo`.
4. Include runtime test assertions for patient state initialization.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState, useMemo } from 'react';
> 
> const PatientContext = createContext(null);
> 
> export function PatientProvider({ children, initialPatient }) {
>   const [patient, setPatient] = useState(initialPatient);
> 
>   const updateVitals = (newVitals) => {
>     setPatient((prev) => ({
>       ...prev,
>       vitals: { ...prev.vitals, ...newVitals }
>     }));
>   };
> 
>   const value = useMemo(() => ({ patient, updateVitals }), [patient]);
> 
>   return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
> }
> 
> export function usePatient() {
>   const context = useContext(PatientContext);
>   if (!context) throw new Error('usePatient must be used inside PatientProvider');
>   return context;
> }
> 
> export function testPatientContext() {
>   const initial = { name: 'Jane Doe', vitals: { hr: 72 } };
>   console.assert(initial.vitals.hr === 72, 'Initial vitals check');
> }
> ```
>
> #### Technical Explanation
> 1. **Nested Immutable Updaters**: Merges updated vital signs safely using object spread syntax inside `setPatient`.
> 2. **Subtree State Teleporting**: Enables nurse stations, alert banners, and vital charts to read patient details without prop drilling.
> 3. **Memoized Provider Output**: Prevents tree-wide re-renders when parent layout components re-render.
> 4. **Custom Hook Access**: Enforces clean, error-guarded consumption via `usePatient()`.
> 
---

## 6. Related Terms

- [`useContext` Hook](use_context.md) — The hook used by child components to subscribe to Context broadcasts.
- [Prop Drilling](prop_drilling.md) — The exact anti-pattern solved by the Context API.
- [State Management (Redux / Zustand)](state_management.md) — External state store alternatives optimized for high-frequency updates.
- [Compound Components](../level_07/compound_components.md) — Advanced design pattern using Context to share implicit state between parent and child components.

---

## 7. Key Takeaways

- The Context API allows data to be broadcast straight to deeply nested components without passing props through intermediate layers.
- Create context with `createContext()`, wrap parent subtrees with `<Context.Provider value={...}>`, and consume with `useContext()`.
- Always wrap context `value` objects in `useMemo()` to prevent unnecessary re-render cascades across subscribers.
- Context is ideal for low-frequency global data (Themes, Auth, Localization); avoid using it for 60fps high-frequency state.
- Create custom context hooks (e.g. `useAuth()`) to throw explicit developer errors when components consume context outside its Provider.
