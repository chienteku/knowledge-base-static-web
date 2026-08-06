# `useContext` Hook

> **Level 6 — Context & Global State**
> A built-in React Hook that allows functional components to subscribe to a React Context and consume its broadcasted value directly.

---

## 1. Prerequisites

- [The Context API](context_api.md) — Creating and providing Context via `createContext()` and `<Context.Provider>`.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — Mandatory execution constraints governing where Hooks can be called.
- [Custom Hooks](../level_04/custom_hooks.md) — Wrapping `useContext` calls inside reusable custom hooks.

---

## 2. Term Category

**Core Hook (context consumption primitive)**: `useContext` is a fundamental built-in React Hook that grants functional components direct read-access to values broadcasted by a parent `<Context.Provider>`.

Rather than wrapping JSX markup inside legacy render prop components (`<Context.Consumer>{value => ...}</Context.Consumer>`), calling `useContext(MyContext)` accepts the Context object returned from `createContext()` and returns its current value synchronously during component render frame execution. Whenever the `value` prop supplied to the matching `<Context.Provider>` changes, React automatically triggers a re-render of every component executing `useContext(MyContext)`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before the introduction of React Hooks in v16.8, consuming context inside functional components required using the `<Context.Consumer>` render props pattern:

```jsx
// Legacy pre-hooks consumer pattern: verbose and deeply nested!
function OldConsumer() {
  return (
    <ThemeContext.Consumer>
      {theme => (
        <UserContext.Consumer>
          {user => <button className={theme}>{user.name}</button>}
        </UserContext.Consumer>
      )}
    </ThemeContext.Consumer>
  );
}
```

Consuming multiple contexts using this legacy pattern resulted in a "Pyramid of Doom" callback structure, making JSX unreadable and difficult to maintain. The `useContext` hook was created to flatten component trees. By replacing render prop wrapper tags with simple top-level hook assignments (`const theme = useContext(ThemeContext)`), components become clean, readable, and easy to inspect.

### (2) Reality Metaphor

Imagine an employee in an office tuning a desk radio to a specific broadcast station.

Before `useContext` (**legacy `<Context.Consumer>`**), to hear the company announcements radio station, the employee had to climb inside a soundproof wooden radio box constructed in the middle of their office cubicle (**nesting wrapper tags**). If they wanted to listen to two stations, they built a second wooden box inside the first box.

With `useContext`, the employee simply places a small wireless earbud into their ear (**calling `const value = useContext(RadioContext)` at the top of the function**). The earbud receives the broadcast frequency instantly. The employee stays at their desk without building physical wooden box wrappers in their office space.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

function DarkModeButton() {
  // Synchronously consume context value
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme} className={`btn-${theme}`}>
      Current Theme: {theme}
    </button>
  );
}

export default DarkModeButton;
```

#### Fuller Example

```jsx
import React, { createContext, useContext, useState, useMemo } from 'react';

// 1. Create Context
const TelemetrySettingsContext = createContext(null);

// 2. Provider Component
export function TelemetrySettingsProvider({ children }) {
  const [refreshInterval, setRefreshInterval] = useState(5000); // ms
  const [unitSystem, setUnitSystem] = useState('metric');

  const value = useMemo(() => ({
    refreshInterval,
    setRefreshInterval,
    unitSystem,
    setUnitSystem
  }), [refreshInterval, unitSystem]);

  return (
    <TelemetrySettingsContext.Provider value={value}>
      {children}
    </TelemetrySettingsContext.Provider>
  );
}

// 3. Custom Hook with Safety Guard Check
export function useTelemetrySettings() {
  const context = useContext(TelemetrySettingsContext);
  if (!context) {
    throw new Error('useTelemetrySettings must be used within a TelemetrySettingsProvider');
  }
  return context;
}

// 4. Subscribing Child Component using custom useContext hook
function SettingsControlPanel() {
  const { refreshInterval, setRefreshInterval, unitSystem, setUnitSystem } = useTelemetrySettings();

  return (
    <div className="settings-panel">
      <h3>Telemetry Preferences</h3>
      <div>
        <label>Refresh Rate:</label>
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
        >
          <option value={1000}>1 Second</option>
          <option value={5000}>5 Seconds</option>
          <option value={10000}>10 Seconds</option>
        </select>
      </div>

      <div>
        <label>Unit System:</label>
        <button onClick={() => setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')}>
          System: {unitSystem.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TelemetrySettingsProvider>
      <div className="app-container">
        <SettingsControlPanel />
      </div>
    </TelemetrySettingsProvider>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing the Provider Component Instead of the Base Context Object to `useContext`

**The mistake:** Writing `useContext(MyContext.Provider)` instead of `useContext(MyContext)`.

**Why it's wrong:** The `useContext` hook expects the original Context object returned by `createContext()`. Passing `MyContext.Provider` is an invalid parameter that causes React to return `undefined` or crash.

*Incorrect:*
```jsx
// ❌ Passing Provider component to useContext!
const theme = useContext(ThemeContext.Provider);
```

*Fix:*
```jsx
// Pass the base Context object
const theme = useContext(ThemeContext);
```

### Mistake 2: Missing Safety Guard Checks in Custom Context Hooks

**The mistake:** Calling `useContext(AuthContext)` in a component rendered outside `<AuthContext.Provider>` without a guard check.

**Why it's wrong:** If a component consumes context outside its Provider wrapper, `useContext` returns `undefined` (or the default value). Destructuring properties directly (e.g., `const { user } = useContext(AuthContext)`) throws a cryptic runtime error (`TypeError: Cannot destructure property 'user' of 'undefined'`). Wrap `useContext` inside a custom hook that throws an explicit error message.

*Incorrect:*
```jsx
function Header() {
  // ❌ Crashes with confusing TypeError if rendered outside AuthProvider!
  const { user } = useContext(AuthContext);
  return <div>{user.name}</div>;
}
```

*Fix:*
```jsx
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
```

### Mistake 3: Nesting 10+ Granular Separate `useContext` Providers (Provider Hell)

**The mistake:** Wrapping the application in 15 separate nested `<Context1.Provider><Context2.Provider>...` layers for tiny state variables.

**Why it's wrong:** Deep provider nesting ("Provider Hell") complicates component tree inspection, degrades initial mounting performance, and makes state tracking difficult. Group related global states into unified providers or use Zustand/Redux.

*Incorrect:*
```jsx
// 15 nested Context Providers wrapping root App component
```

*Fix:*
```jsx
// Group related context values or use modular Zustand stores
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Unit Preferences Hook

**Scenario:** Implement a custom `useTelemetryUnit()` hook consuming `UnitContext`. The hook must provide unit toggle controls and throw an error if used outside `UnitProvider`.

**Requirements:**
1. Call `useContext(UnitContext)` inside `useTelemetryUnit`.
2. Include safety guard throwing descriptive error.
3. Return `unit` string and `toggleUnit` function.
4. Include runtime test assertions for custom hook guard logic.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState } from 'react';
> 
> export const UnitContext = createContext(null);
> 
> export function UnitProvider({ children }) {
>   const [unit, setUnit] = useState('celsius');
>   const toggleUnit = () => setUnit((u) => (u === 'celsius' ? 'fahrenheit' : 'celsius'));
>   return <UnitContext.Provider value={{ unit, toggleUnit }}>{children}</UnitContext.Provider>;
> }
> 
> export function useTelemetryUnit() {
>   const context = useContext(UnitContext);
>   if (!context) {
>     throw new Error('useTelemetryUnit must be used within a UnitProvider');
>   }
>   return context;
> }
> 
> export function testUseTelemetryUnitGuard() {
>   try {
>     useTelemetryUnit(); // Calling outside provider should throw
>     console.assert(false, 'Guard check failed');
>   } catch (err) {
>     console.assert(err.message.includes('must be used within a UnitProvider'), 'Guard check passed');
>   }
> }
> ```
>
> #### Technical Explanation
> 1. **Context Parameter Verification**: Passes base `UnitContext` object into `useContext`.
> 2. **Explicit Guard Assertion**: Verifies context presence and throws an informative developer error message if missing.
> 3. **Clean Hook Signature**: Exposes clean `unit` and `toggleUnit` properties to subscriber components.
> 4. **Isolated Test Execution**: Tests error guard handling without mounting complete UI trees.
> 
### Exercise 2: Financial Trading Desk Theme Hook

**Scenario:** Create a trading platform theme hook `useTradingTheme()` using `useContext`. Components read high-contrast active theme styles.

**Requirements:**
1. Create `ThemeContext` and custom consumption hook.
2. Provide high-contrast color values.
3. Guard against un-wrapped execution.
4. Add runtime assertions verifying theme output.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState } from 'react';
> 
> const ThemeContext = createContext(null);
> 
> export function TradingThemeProvider({ children }) {
>   const [theme, setTheme] = useState('dark');
>   const colors = theme === 'dark' ? { bg: '#121212', text: '#ffffff' } : { bg: '#ffffff', text: '#000000' };
>   return <ThemeContext.Provider value={{ theme, setTheme, colors }}>{children}</ThemeContext.Provider>;
> }
> 
> export function useTradingTheme() {
>   const ctx = useContext(ThemeContext);
>   if (!ctx) throw new Error('useTradingTheme must be used within TradingThemeProvider');
>   return ctx;
> }
> 
> export function testTradingTheme() {
>   const providerRes = TradingThemeProvider({ children: null });
>   console.assert(providerRes.props.value.colors.bg === '#121212', 'Trading theme initial color check');
> }
> ```
>
> #### Technical Explanation
> 1. **Synchronous Context Consumption**: Reads theme state and derived color tokens synchronously.
> 2. **Guarded Hook Pattern**: Protects against null context access errors.
> 3. **Declarative Styling Tokens**: Shares high-contrast color maps straight to deep trading widgets.
> 4. **Simple API Surface**: Simplifies component integration via custom hook execution.
> 
### Exercise 3: Healthcare Patient EHR Station Context Hook

**Scenario:** Build an EHR nursing station context hook `useEHRStation()` providing `stationId` and `nurseOnDuty` details.

**Requirements:**
1. Implement `StationContext` and custom hook wrapper.
2. Provide default station metadata.
3. Validate context subscriber guard.
4. Add test assertions for context reading.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState } from 'react';
> 
> const StationContext = createContext(null);
> 
> export function EHRStationProvider({ children, stationId }) {
>   const [nurse] = useState('Nurse Sarah, RN');
>   return <StationContext.Provider value={{ stationId, nurse }}>{children}</StationContext.Provider>;
> }
> 
> export function useEHRStation() {
>   const context = useContext(StationContext);
>   if (!context) throw new Error('useEHRStation must be used inside EHRStationProvider');
>   return context;
> }
> 
> export function testEHRStation() {
>   const initial = { stationId: 'ICU-WEST-3', nurse: 'Nurse Sarah, RN' };
>   console.assert(initial.stationId === 'ICU-WEST-3', 'EHR station initial check');
> }
> ```
>
> #### Technical Explanation
> 1. **Decoupled Data Distribution**: Delivers nursing station metadata straight to patient chart widgets.
> 2. **Strict Guard Validation**: Guarantees meaningful developer errors if provider wrappers are omitted.
> 3. **Clean Hook Signature**: Replaces legacy `<Consumer>` render prop nesting entirely.
> 4. **Framework Standard Conformance**: Complies with modern React Hook patterns.
> 
---

## 6. Related Terms

- [The Context API](context_api.md) — The core context broadcasting mechanism consumed by `useContext`.
- [Custom Hooks](../level_04/custom_hooks.md) — The recommended pattern for wrapping `useContext` calls.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — Execution rules governing `useContext` invocations.
- [Prop Drilling](prop_drilling.md) — The structural anti-pattern eliminated by Context consumption.

---

## 7. Key Takeaways

- `useContext` is the built-in React Hook used to read values broadcasted by a parent `<Context.Provider>`.
- Pass the base Context object (e.g. `ThemeContext`), NOT the `<ThemeContext.Provider>` component, into `useContext`.
- `useContext` replaces the legacy, deeply-nested `<Context.Consumer>` render prop pattern with clean, top-level hook assignments.
- Always wrap `useContext` inside a custom hook (e.g. `useAuth()`) that throws a descriptive error if consumed outside its Provider.
- Components re-render automatically whenever the `value` prop passed to the matching `<Context.Provider>` changes.
