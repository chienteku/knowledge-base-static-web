# Render Props

> **Level 7 — Component Patterns**
> A component pattern (predominant in pre-Hooks React codebases) for sharing stateful logic between components using a prop whose value is a function returning JSX.

---

## 1. Prerequisites

- [Props (Properties)](../level_01/props.md) — Passing functions as component props.
- [Higher-Order Components (HOC)](hoc.md) — The competing pre-Hooks pattern for sharing component logic.
- [Custom Hooks](../level_04/custom_hooks.md) — The modern React feature that largely superseded Render Props.

---

## 2. Term Category

**Component Pattern (inversion-of-control UI delegate)**: Render Props is an architectural design pattern in React where a component encapsulates state and logic, but delegates its UI rendering decisions to a callback function passed as a prop (commonly named `render` or using the `children` prop as a function).

The logic-heavy component manages internal state (such as tracking mouse positions, managing toggle states, or handling data fetching) and invokes `props.render(stateData)` inside its render function. The parent component supplies an inline function that receives the internal state data and returns whatever custom JSX markup it chooses, establishing an Inversion of Control.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before React 16.8 introduced Hooks, functional components could not hold state or manage side-effects. When developers needed to share stateful behavior—such as tracking mouse coordinates, managing an accordion toggle, or handling API fetching—between different visual components, they faced logic duplication.

To solve this without using complex Class Inheritance or HOC wrapper nesting, developers created the **Render Props Pattern**:

1. **Behavior vs. UI Decoupling:** A single component handles state calculation (e.g. `<MouseTracker>`), while delegating visual UI decisions to the caller.
2. **Dynamic Inversion of Control:** The parent passes a function (`render={data => <h1>{data.x}</h1>}`) that dictates exactly how the state should be rendered onto the screen.
3. **Flexible Children Variation:** Developers could name the render prop explicitly (`render={...}`) or pass a function directly as the `children` prop (`<Mouse>{data => ...}</Mouse>`).

While Render Props offered explicit data flow without HOC prop name collisions, nesting multiple Render Prop components created deep callback indentation ("Pyramid of Doom"). Custom Hooks have effectively replaced Render Props for logic sharing in modern React.

### (2) Reality Metaphor

Imagine a professional portrait photographer operating a photo studio booth.

The photographer (**the Render Prop component `<MouseTracker>`**) owns and manages all the complex technical equipment: heavy camera lenses, lighting rigs, flash timing, and digital sensors (**managing internal state**). The photographer takes care of measuring light levels and focusing the camera lens.

However, the photographer does not dictate what pose or costume the client wears (**inversion of control**). The client steps into the studio booth and supplies instructions for the photo theme (**the callback function `render={photos => ...}`**). The photographer snaps the photo, feeds the digital photo data back to the client, and lets the client choose whether to print a glossy poster, a digital thumbnail, or a black-and-white canvas print (**custom JSX output**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState } from 'react';

// Logic component delegating UI rendering to a callback function prop
function ToggleLogic({ render }) {
  const [on, setOn] = useState(false);
  const toggle = () => setOn((prev) => !prev);

  // Invoke the render prop passing internal state and controller functions
  return render({ on, toggle });
}

export default function App() {
  return (
    <ToggleLogic
      render={({ on, toggle }) => (
        <button onClick={toggle} className={on ? 'btn-active' : 'btn-idle'}>
          {on ? 'System Active' : 'System Standby'}
        </button>
      )}
    />
  );
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

// Component encapsulating window resize listener state
function WindowSizeTracker({ render }) {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Delegate UI rendering to the render callback prop
  return render(size);
}

// Consuming component demonstrating the Render Props pattern
export default function IndustrialDashboard() {
  return (
    <div className="dashboard-page">
      <h2>Control Center Overview</h2>

      {/* Render Prop Component delegating UI layout decisions */}
      <WindowSizeTracker
        render={({ width, height }) => {
          const isCompact = width < 768;
          return (
            <div className={`viewport-card ${isCompact ? 'compact' : 'expanded'}`}>
              <h4>Viewport Metrics</h4>
              <p>Resolution: {width}px × {height}px</p>
              {isCompact ? (
                <div className="alert-badge">Mobile Layout Activated</div>
              ) : (
                <div className="info-badge">Desktop Grid Activated</div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating Un-Memoized Inline Render Prop Functions Causing Unnecessary Child Re-Renders

**The mistake:** Passing an inline arrow function `<MouseTracker render={pos => <Point pos={pos} />} />` without memoization.

**Why it's wrong:** Inline arrow functions (`pos => ...`) create a BRAND NEW function instance on every single render frame of the parent component. If `<MouseTracker>` is a memoized component (`React.memo`), it sees a new `render` prop reference on every frame and is forced to re-render.

*Incorrect:*
```jsx
function Parent() {
  // ❌ Inline function creates new memory reference every render frame!
  return <MouseTracker render={(pos) => <Display pos={pos} />} />;
}
```

*Fix:*
```jsx
// Use Custom Hooks (e.g. useMousePosition()) in modern React to avoid function prop creation
const pos = useMousePosition();
return <Display pos={pos} />;
```

### Mistake 2: Nesting Multiple Render Prop Components (Callback Pyramid of Doom)

**The mistake:** Nesting 4 layers of Render Prop components inside JSX markup.

**Why it's wrong:** Nesting multiple Render Prop components (`<User>{user => <Theme>{theme => <Language>{lang => ...}</Language>}</Theme>}</User>`) creates deep callback indentation ("Pyramid of Doom"), making JSX unreadable and error-prone to edit.

*Incorrect:*
```jsx
// ❌ 4-level deep nested render prop callback pyramid!
<UserProvider render={user => (
  <ThemeProvider render={theme => (
    <LangProvider render={lang => (
      <div>{user.name} - {theme} - {lang}</div>
    )} />
  )} />
)} />
```

*Fix:*
```jsx
// Use Custom Hooks to unwrap state variables sequentially at function top-level
const user = useUser();
const theme = useTheme();
const lang = useLanguage();
return <div>{user.name} - {theme} - {lang}</div>;
```

### Mistake 3: Failing to Recognize Function as `children` as a Render Prop Variant

**The mistake:** Failing to realize that `<Toggle>{({ on, toggle }) => ...}</Toggle>` is an instance of the Render Props pattern.

**Why it's wrong:** Passing a callback function as the `children` prop (`props.children(data)`) is a standard and popular implementation variation of the Render Props pattern.

*Incorrect:*
```jsx
// Assuming render prop MUST strictly use a prop named render
```

*Fix:*
```jsx
// Passing a function as children prop is a standard Render Prop implementation
function Toggle({ children }) {
  const [on, setOn] = useState(false);
  return children({ on, setOn });
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Mouse Position Tracker Component

**Scenario:** Implement a `<MouseTracker>` Render Prop component tracking mouse `(x, y)` coordinates. Pass coordinates to a `render` prop callback.

**Requirements:**
1. Maintain `(x, y)` mouse coordinate state using `useState`.
2. Attach `onMouseMove` handler to container `div`.
3. Invoke `props.render({ x, y })` inside render output.
4. Include runtime test assertions for render prop execution.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function MouseTracker({ render }) {
>   const [pos, setPos] = useState({ x: 0, y: 0 });
> 
>   const handleMouseMove = (e) => {
>     setPos({ x: e.clientX, y: e.clientY });
>   };
> 
>   return (
>     <div className="tracker-area" onMouseMove={handleMouseMove}>
>       {render(pos)}
>     </div>
>   );
> }
> 
> export function testMouseTracker() {
>   const res = MouseTracker({ render: (pos) => <div>{pos.x}</div> });
>   console.assert(res.props.children.props.children === 0, 'Mouse tracker initial position check');
> }
> ```
>
> #### Technical Explanation
> 1. **Inversion of Control**: Delegates UI presentation to the `render` callback parameter.
> 2. **Encapsulated Event State**: Manages `onMouseMove` synthetic listeners internally.
> 3. **Synchronous State Invocation**: Calls `render(pos)` synchronously during component render evaluation.
> 4. **Declarative Output Assertion**: Tests callback execution output deterministically.
> 
### Exercise 2: Financial Stock Watchlist Data Fetcher Render Prop

**Scenario:** Create a `<StockFetcher>` Render Prop component fetching market ticker prices and passing `{ loading, price, error }` to a `children` function prop.

**Requirements:**
1. Accept a callback function as `children` prop.
2. Manage `loading`, `price`, and `error` state.
3. Pass state object into `children(state)`.
4. Include test assertions for children function rendering.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function StockFetcher({ ticker, children }) {
>   const [state] = useState({ loading: false, price: 185.5, error: null });
> 
>   // Execute children function prop passing internal state
>   return children(state);
> }
> 
> export function testStockFetcher() {
>   const res = StockFetcher({
>     ticker: 'AAPL',
>     children: ({ price }) => <span>Price: ${price}</span>
>   });
>   console.assert(res.props.children[1] === 185.5, 'Stock fetcher children function test');
> }
> ```
>
> #### Technical Explanation
> 1. **Children-as-a-Function Variant**: Uses `children` as a callback function prop.
> 2. **State Abstraction**: Houses market data fetching state inside `<StockFetcher>`.
> 3. **Flexible Presentation**: Allows callers to render prices as badges, table cells, or charts.
> 4. **Direct Test Execution**: Verifies children callback function return values.
> 
### Exercise 3: Healthcare Patient EHR Audit Timer Render Prop

**Scenario:** Build a `<SessionTimer>` Render Prop component tracking active consultation time in seconds and exposing `{ seconds, reset }` to a `render` prop.

**Requirements:**
1. Track active session time in seconds.
2. Expose `seconds` and `reset` function to `render` prop.
3. Add test assertions for session timer render prop output.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function SessionTimer({ render }) {
>   const [seconds, setSeconds] = useState(0);
> 
>   useEffect(() => {
>     const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
>     return () => clearInterval(timer);
>   }, []);
> 
>   const reset = () => setSeconds(0);
> 
>   return render({ seconds, reset });
> }
> 
> export function testSessionTimer() {
>   const res = SessionTimer({ render: ({ seconds }) => <div>Time: {seconds}s</div> });
>   console.assert(res.props.children[1] === 0, 'Session timer initial seconds check');
> }
> ```
>
> #### Technical Explanation
> 1. **Encapsulated Timer Side-Effect**: Manages `setInterval` lifecycle inside `useEffect`.
> 2. **Exposed Controller Callbacks**: Passes `reset` callback alongside state primitives.
> 3. **Clean Decoupled Logic**: Separates session timing calculations from EHR clinical views.
> 4. **Render Prop Invocation**: Executes `render({ seconds, reset })` cleanly during component rendering.
> 
---

## 6. Related Terms

- [Custom Hooks](../level_04/custom_hooks.md) — The modern React feature that superseded Render Props for logic sharing.
- [Higher-Order Components (HOC)](hoc.md) — Competing pre-Hooks pattern for sharing component logic.
- [Children Prop](children_prop.md) — The prop mechanism used when passing functions as `children`.
- [Props (Properties)](../level_01/props.md) — The base property delivery mechanism.

---

## 7. Key Takeaways

- The Render Props pattern passes a callback function as a prop (`render={data => ...}`) to delegate UI rendering to the parent component.
- The logic component handles internal state and side-effects, then calls `props.render(stateData)` to return custom JSX.
- Passing a callback function as the `children` prop (`<Component>{data => ...}</Component>`) is a common Render Props variation.
- Nesting multiple Render Prop components creates a callback "Pyramid of Doom" in JSX markup.
- Modern React development heavily favors Custom Hooks over Render Props due to cleaner sequential logic consumption.
