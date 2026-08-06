# Conditional Rendering

> **Level 5 — DOM & Event Handling**
> The practice of dynamically rendering distinct UI trees or components based on evaluation of runtime state and props.

---

## 1. Prerequisites

- [JSX (JavaScript XML)](../level_01/jsx.md) — Embedding JavaScript expressions within markup.
- [State](../level_02/state.md) — Reactive data changes driving UI branches.
- [Render Purity](../level_01/render_purity.md) — Ensuring conditional render evaluations remain side-effect free.

---

## 2. Term Category

**Component Pattern (conditional UI abstraction)**: Conditional Rendering in React seamlessly integrates JavaScript's natural control flow constructs—such as ternary operators (`? :`), logical short-circuiting (`&&`), `if` statements, and `switch` blocks—directly into component render functions. 

Unlike traditional DOM manipulation where developers imperatively modify element styles (`display: none`) or inject nodes using `appendChild`/`removeChild`, React conditionally constructs or omits Virtual DOM nodes before reconciliation. When a branch evaluates to `false`, `null`, or `undefined`, React does not create DOM elements for that node, completely unmounting inactive components and releasing their associated state and DOM nodes.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional web applications built with imperative JavaScript, toggling UI views required manually querying DOM elements and toggling CSS classes or inline display properties. This approach led to synchronization bugs where hidden elements remained present in the DOM accessibility tree, preserved stale event listeners, or consumed memory unnecessarily.

React solves this by treating user interfaces as pure projections of application state. Conditional Rendering allows developers to declare *what* UI should exist for any given state combination. If a user is unauthenticated, the application renders a login dialog; once authenticated, the Virtual DOM reconciliation engine completely unmounts the login UI and mounts the user dashboard. This declarative paradigm ensures the DOM strictly reflects active state branches without manual node tracking.

### (2) Reality Metaphor

Imagine an electronic flight information board at an international airport terminal.

The display board does not paint over existing flight rows with black tape when a flight departs. Instead, the central information controller evaluates the current status of each flight in the database. If a flight is active, the board renders its gate, destination, and boarding status. If a flight has taken off, its row is omitted entirely from the display schedule, freeing up physical space for incoming flights.

React's Conditional Rendering operates like this digital display system: component trees are calculated dynamically from data on every render cycle, presenting only the active UI structures while hiding inactive ones.

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';

function UserGreeting({ isLoggedIn, userName }) {
  // Ternary and short-circuit conditional rendering
  return (
    <div className="user-status">
      {isLoggedIn ? <h2>Welcome back, {userName}!</h2> : <h2>Please log in.</h2>}
      {isLoggedIn && <button className="logout-btn">Log Out</button>}
    </div>
  );
}

export default UserGreeting;
```

#### Fuller Example

```jsx
import React, { useState } from 'react';

function ServerStatusPanel({ serverId }) {
  const [status, setStatus] = useState('online'); // 'online' | 'warning' | 'offline'
  const [maintenance, setMaintenance] = useState(false);

  // Early return pattern for maintenance mode
  if (maintenance) {
    return (
      <div className="panel maintenance">
        <h3>Server #{serverId}</h3>
        <p>System undergoing scheduled maintenance.</p>
        <button onClick={() => setMaintenance(false)}>Exit Maintenance Mode</button>
      </div>
    );
  }

  return (
    <div className={`panel ${status}`}>
      <h3>Server #{serverId}</h3>
      <p>Current Status: <strong>{status.toUpperCase()}</strong></p>

      {/* Switch state display using inline conditional branches */}
      {(() => {
        switch (status) {
          case 'online':
            return <div className="indicator green">All Systems Operational</div>;
          case 'warning':
            return <div className="indicator yellow">High CPU Utilization</div>;
          case 'offline':
            return <div className="indicator red">Connection Lost</div>;
          default:
            return null;
        }
      })()}

      <div className="actions">
        <button onClick={() => setStatus('online')}>Set Online</button>
        <button onClick={() => setStatus('warning')}>Set Warning</button>
        <button onClick={() => setStatus('offline')}>Set Offline</button>
        <button onClick={() => setMaintenance(true)}>Enable Maintenance</button>
      </div>
    </div>
  );
}

export default ServerStatusPanel;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The Number Zero Rendering Trap in `&&` Short-Circuiting

**The mistake:** Writing `{items.length && <List items={items} />}` when `items.length` is `0`.

**Why it's wrong:** In JavaScript, `0 && <Component />` evaluates to the numeric value `0`. In JSX, boolean `false`, `null`, and `undefined` render nothing, but numeric `0` is a valid primitive that React will render directly to the DOM, displaying an unwanted "0" text node on the screen.

*Incorrect:*
```jsx
function ShoppingCart({ items }) {
  // Renders "0" on screen when items array is empty!
  return <div className="cart">{items.length && <ItemList items={items} />}</div>;
}
```

*Fix:*
```jsx
function ShoppingCart({ items }) {
  // Explicitly evaluate to a boolean expression
  return <div className="cart">{items.length > 0 && <ItemList items={items} />}</div>;
}
```

### Mistake 2: Returning `undefined` or Omitting Return Statements in Conditional Branches

**The mistake:** Writing early conditional checks like `if (isLoading) return;` without returning `null` or fallback JSX.

**Why it's wrong:** In React, returning `undefined` from a component render function throws a runtime error (`Nothing was returned from render`). Every render branch must return valid JSX, `null`, or a React Fragment.

*Incorrect:*
```jsx
function UserProfile({ loading, user }) {
  if (loading) return; // ❌ Returns undefined, breaking React rendering!
  return <div>{user.name}</div>;
}
```

*Fix:*
```jsx
function UserProfile({ loading, user }) {
  if (loading) return <div className="spinner">Loading...</div>; // Return fallback JSX or null
  return <div>{user.name}</div>;
}
```

### Mistake 3: Deeply Nested Ternary Chains Inside JSX Markup

**The mistake:** Nesting multiple ternary operators directly within JSX (`{isAuth ? (isAdmin ? <Admin /> : <User />) : <Guest />}`).

**Why it's wrong:** Deeply nested ternaries inside JSX severely degrade code readability and make debugging component rendering logic error-prone. Extract complex conditional branches into helper components, early return statements, or explicit lookup objects.

*Incorrect:*
```jsx
function Dashboard({ role, status }) {
  return (
    <div>
      {status === 'active' ? (role === 'admin' ? <AdminView /> : role === 'editor' ? <EditorView /> : <Viewer />) : <InactiveView />}
    </div>
  );
}
```

*Fix:*
```jsx
function Dashboard({ role, status }) {
  if (status !== 'active') return <InactiveView />;

  const viewMap = {
    admin: <AdminView />,
    editor: <EditorView />,
    viewer: <Viewer />
  };

  return <div>{viewMap[role] || <Viewer />}</div>;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Alert Banner

**Scenario:** You are building an industrial IoT sensor monitoring module. If telemetry data experiences critical sensor failure, display an urgent red alert. If telemetry reports warnings, show a warning badge. If operating within normal thresholds, render an operational confirmation badge.

**Requirements:**
1. Use early return statements for critical sensor failure states.
2. Use explicit boolean logical AND (`&&`) for threshold warning banners.
3. Handle missing telemetry data safely without rendering `undefined` or `0`.
4. Include assertions verifying UI rendering state based on sensor status inputs.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> function TelemetryBanner({ telemetry }) {
>   // 1. Guard check for missing telemetry object
>   if (!telemetry) {
>     return <div className="status-offline">No Telemetry Signal</div>;
>   }
> 
>   const { temperature, isSensorCritical, warningCount } = telemetry;
> 
>   // 2. Early return for critical failure
>   if (isSensorCritical) {
>     return (
>       <div className="status-critical" data-testid="critical-alert">
>         CRITICAL: Sensor hardware failure detected! Emergency shutdown required.
>       </div>
>     );
>   }
> 
>   return (
>     <div className="status-normal" data-testid="normal-panel">
>       <h3>Telemetry Metrics</h3>
>       <p>Current Temperature: {temperature}°C</p>
> 
>       {/* 3. Explicit boolean check for warning count */}
>       {warningCount > 0 && (
>         <div className="warning-badge" data-testid="warning-badge">
>           Warning Count: {warningCount} threshold alerts log entries present.
>         </div>
>       )}
>     </div>
>   );
> }
> 
> // Verification Test Assertions
> export function testTelemetryBanner() {
>   const nullTest = TelemetryBanner({ telemetry: null });
>   console.assert(nullTest.props.children === 'No Telemetry Signal', 'Failed null check');
> 
>   const criticalTest = TelemetryBanner({ telemetry: { isSensorCritical: true } });
>   console.assert(criticalTest.props['data-testid'] === 'critical-alert', 'Failed critical test');
> 
>   const warningTest = TelemetryBanner({ telemetry: { temperature: 45, isSensorCritical: false, warningCount: 2 } });
>   console.assert(warningTest.props.children[2] !== false, 'Failed warning check');
> }
> ```
>
> #### Technical Explanation
> 1. **Early Return Guard**: Halts evaluation of component JSX tree immediately when `telemetry` is null, preventing property read crashes.
> 2. **Explicit Boolean Check**: Evaluates `warningCount > 0` to produce a true boolean, preventing the zero-rendering pitfall.
> 3. **Unmount Isolation**: Critical alerts omit normal telemetry metric UI entirely, ensuring high priority alarm visibility.
> 4. **Render Branching**: Decouples UI display logic into clear, deterministic execution paths based on props.
> 
### Exercise 2: Financial Trading Order Execution Panel

**Scenario:** You are implementing an institutional trading dashboard component. The component must display different order action controls depending on order state: Draft, Pending Approval, Executed, or Rejected.

**Requirements:**
1. Use an object mapping pattern or `switch` block for multi-state rendering.
2. Render order details conditionally using ternary operators.
3. Ensure no numeric falsy values leak into the rendered output when total orders count is zero.
4. Include mock test cases verifying view output per state.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> function OrderExecutionPanel({ order }) {
>   const { id, symbol, quantity, price, status, pendingApprovalsCount } = order;
> 
>   // Object lookup map for state-specific controls
>   const renderStatusControls = () => {
>     switch (status) {
>       case 'DRAFT':
>         return <button className="btn-primary">Submit for Execution</button>;
>       case 'PENDING':
>         return (
>           <div className="pending-group">
>             <button className="btn-warning">Approve Trade</button>
>             <button className="btn-danger">Cancel Trade</button>
>           </div>
>         );
>       case 'EXECUTED':
>         return <span className="text-success">Trade Executed Settlement Complete</span>;
>       case 'REJECTED':
>         return <span className="text-danger">Trade Order Rejected by Compliance</span>;
>       default:
>         return null;
>     }
>   };
> 
>   return (
>     <div className="order-panel" data-testid={`order-${id}`}>
>       <h4>Order #{id} — {symbol}</h4>
>       <p>Quantity: {quantity} @ ${price}</p>
> 
>       {/* Safe conditional display of pending approvals count */}
>       {pendingApprovalsCount > 0 ? (
>         <div className="approval-tag">{pendingApprovalsCount} Approvals Required</div>
>       ) : null}
> 
>       <div className="control-slot">
>         {renderStatusControls()}
>       </div>
>     </div>
>   );
> }
> 
> export function testOrderExecutionPanel() {
>   const draftOrder = { id: 101, symbol: 'AAPL', quantity: 500, price: 185.5, status: 'DRAFT', pendingApprovalsCount: 0 };
>   const res = OrderExecutionPanel({ order: draftOrder });
>   console.assert(res.props.children[2] === null, 'Falsy count rendered unexpected element');
> }
> ```
>
> #### Technical Explanation
> 1. **Switch Helper Extraction**: Keeps JSX clean by offloading multi-branch state rendering logic into a scoped function.
> 2. **Ternary Fallback to Null**: Uses `: null` explicitly when `pendingApprovalsCount` is zero to guarantee clean DOM output.
> 3. **Declarative State Mapping**: Maps exact domain status strings to specific operational button sets.
> 4. **Reconciliation Stability**: Maintains top-level DOM node stability (`div.order-panel`) across status updates.
> 
### Exercise 3: Healthcare Patient EHR Vital Signs Monitor

**Scenario:** Create a medical telemetry EHR monitor displaying real-time patient heart rate and oxygen saturation. If vitals exceed emergency thresholds, render a high-visibility alert modal overlay.

**Requirements:**
1. Implement emergency modal overlay conditional rendering using logical `&&`.
2. Display vital sign status badges using ternary checks for out-of-bounds readings.
3. Handle missing patient vitals data gracefully without crashing.
4. Include runtime assertions for vitals bounds verification.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> function PatientVitalsMonitor({ patient }) {
>   if (!patient || !patient.vitals) {
>     return <div className="patient-error">Error: Patient vitals data unavailable.</div>;
>   }
> 
>   const { name, vitals } = patient;
>   const { heartRate, spo2 } = vitals;
> 
>   const isHeartRateAbnormal = heartRate < 60 || heartRate > 100;
>   const isSpo2Low = spo2 < 95;
>   const isEmergency = heartRate > 130 || spo2 < 90;
> 
>   return (
>     <div className="vitals-card">
>       <h2>Patient: {name}</h2>
>       <div className="vitals-grid">
>         <div className={`metric ${isHeartRateAbnormal ? 'alert' : 'normal'}`}>
>           Heart Rate: {heartRate} BPM {isHeartRateAbnormal ? '(Abnormal)' : '(Normal)'}
>         </div>
>         <div className={`metric ${isSpo2Low ? 'alert' : 'normal'}`}>
>           SpO2: {spo2}% {isSpo2Low ? '(Hypoxia Risk)' : '(Normal)'}
>         </div>
>       </div>
> 
>       {/* Emergency Alert Overlay */}
>       {isEmergency && (
>         <div className="emergency-overlay" data-testid="emergency-alert">
>           <h3>EMERGENCY ALERT: IMMEDIATE MEDICAL ATTENTION REQUIRED</h3>
>           <p>Critical threshold exceeded for patient {name}.</p>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> export function testPatientVitalsMonitor() {
>   const normalPatient = { name: 'Jane Doe', vitals: { heartRate: 72, spo2: 98 } };
>   const emergencyPatient = { name: 'John Doe', vitals: { heartRate: 140, spo2: 88 } };
> 
>   const normalRes = PatientVitalsMonitor({ patient: normalPatient });
>   const emergencyRes = PatientVitalsMonitor({ patient: emergencyPatient });
> 
>   console.assert(normalRes.props.children[2] === false, 'Normal patient should not trigger emergency alert');
>   console.assert(emergencyRes.props.children[2].props['data-testid'] === 'emergency-alert', 'Emergency alert failed to render');
> }
> ```
>
> #### Technical Explanation
> 1. **Guard Clause Defense**: Guards against nested undefined access (`patient.vitals`) to avoid runtime JavaScript crashes.
> 2. **Derived Boolean Flags**: Encapsulates vital threshold comparisons into descriptive boolean flags prior to JSX inline evaluation.
> 3. **Dynamic CSS Class Branching**: Uses inline ternary expressions to apply diagnostic styling classes conditionally.
> 4. **Selective Node Mount**: Mounts the heavy `emergency-overlay` container into the Virtual DOM tree strictly when `isEmergency` evaluates to true.
> 
---

## 6. Related Terms

- [JSX (JavaScript XML)](../level_01/jsx.md) — The syntax foundation allowing embedded JS conditional expressions.
- [Virtual DOM](../level_01/virtual_dom.md) — The engine mechanism that reconciles conditionally mounted and unmounted DOM nodes.
- [Declarative Programming](../level_01/declarative_programming.md) — The architectural philosophy behind declaring state-driven UI views.
- [State](../level_02/state.md) — The reactive data source that powers conditional evaluation rules.

---

## 7. Key Takeaways

- Conditional Rendering in React projects specific UI trees based on JavaScript expressions evaluated against current state and props.
- Use ternary operators (`condition ? A : B`) for dual-branch renders and logical AND (`condition && A`) for single-branch toggles.
- Always compare numbers explicitly (`items.length > 0 && ...`) to avoid rendering unwanted numeric `0` text nodes.
- Ensure every conditional render path returns valid JSX, `null`, or a fragment, never returning `undefined`.
- Use early returns and guard checks at the top of components to simplify JSX structure and prevent null property access errors.
