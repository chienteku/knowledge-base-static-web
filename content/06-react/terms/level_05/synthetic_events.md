# Synthetic Events

> **Level 5 — DOM & Event Handling**
> React's cross-browser wrapper object around native browser events that normalizes event behaviors and drives high-performance event delegation.

---

## 1. Prerequisites

- [Declarative Programming](../level_01/declarative_programming.md) — Declaring inline event handlers rather than imperatively calling `addEventListener`.
- [JSX (JavaScript XML)](../level_01/jsx.md) — Using camelCase event listener attributes (`onClick`, `onChange`, `onSubmit`).
- [Render Purity](../level_01/render_purity.md) — Keeping side effects inside event handler functions, off the main render path.

---

## 2. Term Category

**Rendering Mechanic (event delegation layer)**: Synthetic Events in React are lightweight, cross-browser wrapper objects (`SyntheticEvent`) that encapsulate native browser DOM events (such as `MouseEvent`, `KeyboardEvent`, or `TouchEvent`). 

React does not attach event handlers directly to individual DOM nodes in the Virtual DOM tree. Instead, React attaches a centralized event delegation listener to the root container node (e.g. `<div id="root">`). When a browser event fires, it bubbles up to the root container, where React catches it, normalizes browser-specific implementation quirks across Chrome, Safari, and Firefox, constructs a `SyntheticEvent` instance, and dispatches it to the targeted component's event handler function.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional web development, handling browser events presented two major pain points:

1. **Browser Inconsistencies:** Native event properties, propagation methods, and keyboard codes differed significantly across browser engines (e.g. `e.target` vs `e.srcElement`, `e.preventDefault()` vs `e.returnValue = false`).
2. **Memory Overhead:** Attaching individual event listeners to thousands of DOM elements (such as rows in a large table or dynamic list items) consumed massive amounts of browser RAM and created potential memory leaks when elements were destroyed without calling `removeEventListener`.

React solves both problems with Synthetic Events and Event Delegation. By wrapping native events in a standardized interface, developers gain a identical event API across all platform browsers. By delegating all event processing to a single listener at the application root container, React minimizes memory consumption and eliminates manual listener teardown code.

### (2) Reality Metaphor

Imagine a large multi-story corporate headquarters with hundreds of office desks.

Rather than placing individual security guards at every single employee desk (**attaching listeners to every DOM node**), the company places a central security reception team at the main front entrance turnstiles of the building (**the root container `#root`**). 

When a visitor arrives to deliver a package to a specific desk, the visitor travels through the building until reaching the front reception turnstile. The reception team intercepts the delivery, fills out a standardized corporate visitor badge with normalized details (**creating a `SyntheticEvent`**), and dispatches an internal security messenger directly to escort the delivery to the targeted desk. This central system requires far fewer security guards while maintaining consistent check-in rules across the entire facility.

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';

function SimpleButton() {
  // Synthetic event 'e' passed automatically to handler
  const handleClick = (e) => {
    e.preventDefault(); // Standardized across all browsers
    console.log('Button clicked! Event type:', e.type);
    console.log('Target element:', e.target.tagName);
  };

  // camelCase event prop pointing to handler function reference
  return (
    <button onClick={handleClick} className="action-btn">
      Click Me
    </button>
  );
}

export default SimpleButton;
```

#### Fuller Example

```jsx
import React, { useState } from 'react';

function EventHandlingForm() {
  const [lastEvent, setLastEvent] = useState('None');
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  // Form submission handler inspecting synthetic event
  const handleSubmit = (e) => {
    // Prevent native full-page browser navigation reload
    e.preventDefault();
    setLastEvent(`Form submitted via ${e.nativeEvent.type}`);
  };

  // Mouse move handler reading synthetic event mouse coordinates
  const handleMouseMove = (e) => {
    // e.clientX and e.clientY are normalized cross-browser properties
    setCoordinates({ x: e.clientX, y: e.clientY });
  };

  // Keyboard handler listening for specific key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setLastEvent(`Enter key pressed down on input`);
    }
  };

  return (
    <form onSubmit={handleSubmit} onMouseMove={handleMouseMove} className="event-box">
      <h3>Event Delegation & Synthetic Events Demo</h3>
      <p>Mouse Position: ({coordinates.x}, {coordinates.y})</p>
      <p>Last Intercepted Event: <strong>{lastEvent}</strong></p>

      <input
        type="text"
        placeholder="Type and press Enter..."
        onKeyDown={handleKeyDown}
        className="demo-input"
      />

      <button type="submit" className="submit-btn">
        Submit Form
      </button>
    </form>
  );
}

export default EventHandlingForm;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking Handler Functions Immediately Inside Event Props (`onClick={handleClick()}`)

**The mistake:** Writing `<button onClick={handleClick()}>Click</button>` with trailing execution parentheses.

**Why it's wrong:** Adding `()` invokes the function *immediately* during component rendering, rather than passing a reference to be called when the event occurs. If `handleClick` updates component state, this triggers an immediate infinite re-render loop that crashes the browser frame.

*Incorrect:*
```jsx
function BadButton() {
  const handleClick = () => console.log('Clicked');
  // ❌ Invokes function immediately on render!
  return <button onClick={handleClick()}>Click</button>;
}
```

*Fix:*
```jsx
function GoodButton() {
  const handleClick = () => console.log('Clicked');
  // Pass function reference without parentheses
  return <button onClick={handleClick}>Click</button>;
}
```

### Mistake 2: Accessing `e.target` Asynchronously After `await` Promises

**The mistake:** Accessing `e.target.value` asynchronously after an `await` asynchronous operation without caching the value beforehand.

**Why it's wrong:** In asynchronous functions, execution pauses at `await`. By the time execution resumes, the synthetic event dispatch cycle has completed. Caching the target property into a local variable before the `await` statement guarantees access.

*Incorrect:*
```jsx
const handleAsyncSubmit = async (e) => {
  e.preventDefault();
  await apiCall();
  // ❌ Reading e.target after async pause can yield nullified references!
  console.log(e.target.elements.username.value);
};
```

*Fix:*
```jsx
const handleAsyncSubmit = async (e) => {
  e.preventDefault();
  // Store target property synchronously before await pause
  const username = e.target.elements.username.value;
  await apiCall();
  console.log(username);
};
```

### Mistake 3: Confusing `e.target` with `e.currentTarget`

**The mistake:** Expecting `e.target` to always reference the element holding the `onClick` prop when nested child elements are clicked.

**Why it's wrong:** `e.target` identifies the specific deep DOM element that *triggered* the event (e.g. an `<i>` icon inside a button), whereas `e.currentTarget` identifies the element that *attached* the React event listener (the `<button>`).

*Incorrect:*
```jsx
const handleButtonClick = (e) => {
  // If user clicks <i> icon inside button, e.target is <i>, NOT <button>!
  e.target.classList.add('active');
};
```

*Fix:*
```jsx
const handleButtonClick = (e) => {
  // e.currentTarget ALWAYS references the element holding the listener
  e.currentTarget.classList.add('active');
};
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Sensor Command Center with Event Delegation

**Scenario:** You are building an industrial IoT control panel with a grid of 100 actuator buttons. Implement event handling on the container grid to intercept button clicks, inspect `data-sensor-id` attributes, and issue commands efficiently.

**Requirements:**
1. Attach a single `onClick` listener to the parent container element.
2. Extract `data-sensor-id` from `e.target` using `e.target.closest()`.
3. Stop synthetic propagation using `e.stopPropagation()` when necessary.
4. Include runtime test assertions for handler delegation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function IoTSensorGrid({ onActuate }) {
>   const [lastActuated, setLastActuated] = useState(null);
> 
>   const handleGridClick = (e) => {
>     // Use closest to resolve target button even if icon inside is clicked
>     const button = e.target.closest('button[data-sensor-id]');
>     if (!button) return;
> 
>     const sensorId = button.getAttribute('data-sensor-id');
>     setLastActuated(sensorId);
>     if (onActuate) onActuate(sensorId);
>   };
> 
>   return (
>     <div className="sensor-control-panel" onClick={handleGridClick}>
>       <h3>Actuator Control Grid</h3>
>       <p>Last Triggered Sensor: <strong>{lastActuated || 'None'}</strong></p>
> 
>       <div className="grid">
>         <button data-sensor-id="sensor-101" className="actuator-btn">
>           <span>Actuator #101</span>
>         </button>
>         <button data-sensor-id="sensor-102" className="actuator-btn">
>           <span>Actuator #102</span>
>         </button>
>         <button data-sensor-id="sensor-103" className="actuator-btn">
>           <span>Actuator #103</span>
>         </button>
>       </div>
>     </div>
>   );
> }
> 
> export function testIoTSensorGrid() {
>   const res = IoTSensorGrid({ onActuate: null });
>   console.assert(res.props.onClick !== undefined, 'Parent container missing delegated onClick handler');
> }
> ```
>
> #### Technical Explanation
> 1. **Delegated Parent Handler**: Attaches a single `onClick` listener to `div.sensor-control-panel` rather than multiple button listeners.
> 2. **Target Element Resolution**: Resolves target buttons using `e.target.closest('button[data-sensor-id]')` to handle nested child element clicks safely.
> 3. **Synthetic Event Extraction**: Reads DOM attributes (`getAttribute`) directly from normalized target elements.
> 4. **Memory Efficiency**: Minimizes memory allocation by processing events at the parent container boundary.
> 
### Exercise 2: Financial Trading Order Ticket Keyboard Shortcuts

**Scenario:** Implement global hotkey event listeners on a financial trading order component. Users press `Alt+B` to trigger Buy and `Alt+S` to trigger Sell, while calling `e.preventDefault()` to prevent default browser bookmark operations.

**Requirements:**
1. Handle `onKeyDown` synthetic events on form fields.
2. Check for `e.altKey` modifier and `e.key` combinations (`'b'` / `'s'`).
3. Call `e.preventDefault()` to suppress browser default actions.
4. Add runtime assertions for shortcut evaluation logic.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function TradingHotkeyPanel({ onTrade }) {
>   const [lastAction, setLastAction] = useState('Idle');
> 
>   const handleKeyDown = (e) => {
>     // Check for Alt modifier shortcuts
>     if (e.altKey && e.key.toLowerCase() === 'b') {
>       e.preventDefault();
>       setLastAction('BUY Order Triggered via Alt+B');
>       if (onTrade) onTrade('BUY');
>     } else if (e.altKey && e.key.toLowerCase() === 's') {
>       e.preventDefault();
>       setLastAction('SELL Order Triggered via Alt+S');
>       if (onTrade) onTrade('SELL');
>     }
>   };
> 
>   return (
>     <div className="hotkey-panel" onKeyDown={handleKeyDown} tabIndex={0}>
>       <h3>Trading Execution (Focus Panel for Shortcuts)</h3>
>       <p>Shortcuts: [Alt + B] = Buy | [Alt + S] = Sell</p>
>       <div className="status" data-testid="hotkey-status">
>         Status: {lastAction}
>       </div>
>       <button onClick={() => setLastAction('Manual Buy')}>Manual Buy</button>
>       <button onClick={() => setLastAction('Manual Sell')}>Manual Sell</button>
>     </div>
>   );
> }
> 
> export function testTradingHotkeyPanel() {
>   const res = TradingHotkeyPanel({ onTrade: null });
>   console.assert(res.props.tabIndex === 0, 'Panel missing tabIndex for keyboard focus handling');
> }
> ```
>
> #### Technical Explanation
> 1. **Keyboard Event Inspection**: Reads normalized `e.altKey` and `e.key` properties from `SyntheticEvent`.
> 2. **Browser Default Prevention**: Calls `e.preventDefault()` to intercept browser hotkey conflicts.
> 3. **Focus Container Binding**: Sets `tabIndex={0}` on container `div` to enable keyboard event capture.
> 4. **Cross-Browser Key Normalization**: Evaluates `e.key.toLowerCase()` for consistent character matching across OS keyboard layouts.
> 
### Exercise 3: Healthcare Patient EHR Drag-and-Drop Bed Assignment

**Scenario:** Implement a drag-and-drop patient bed assignment module. Nurses drag patient cards into bed slot drop targets using synthetic drag events (`onDragStart`, `onDragOver`, `onDrop`).

**Requirements:**
1. Handle `onDragStart` by attaching patient data to `e.dataTransfer`.
2. Call `e.preventDefault()` in `onDragOver` to permit drop operations.
3. Extract transferred data in `onDrop` and update bed assignment state.
4. Include runtime test assertions for drag handlers.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function PatientBedAssigner({ patients }) {
>   const [assignments, setAssignments] = useState({ 'Bed-101': null, 'Bed-102': null });
> 
>   const handleDragStart = (e, patientId) => {
>     e.dataTransfer.setData('text/plain', patientId);
>   };
> 
>   const handleDragOver = (e) => {
>     // Required by HTML drag-and-drop API to allow drop
>     e.preventDefault();
>   };
> 
>   const handleDrop = (e, bedId) => {
>     e.preventDefault();
>     const patientId = e.dataTransfer.getData('text/plain');
>     setAssignments((prev) => ({ ...prev, [bedId]: patientId }));
>   };
> 
>   return (
>     <div className="ehr-bed-assigner">
>       <h3>Patient Bed Allocation</h3>
>       <div className="patients-list">
>         <h4>Unassigned Patients</h4>
>         {patients.map((p) => (
>           <div
>             key={p.id}
>             draggable
>             onDragStart={(e) => handleDragStart(e, p.id)}
>             className="patient-card"
>           >
>             {p.name} ({p.condition})
>           </div>
>         ))}
>       </div>
> 
>       <div className="beds-grid">
>         {Object.keys(assignments).map((bedId) => (
>           <div
>             key={bedId}
>             onDragOver={handleDragOver}
>             onDrop={(e) => handleDrop(e, bedId)}
>             className="bed-slot"
>           >
>             <strong>{bedId}</strong>
>             <p>{assignments[bedId] ? `Assigned: ${assignments[bedId]}` : 'Vacant'}</p>
>           </div>
>         ))}
>       </div>
>     </div>
>   );
> }
> 
> export function testPatientBedAssigner() {
>   const list = [{ id: 'p-1', name: 'John Doe', condition: 'Stable' }];
>   const res = PatientBedAssigner({ patients: list });
>   console.assert(res.props.className === 'ehr-bed-assigner', 'EHR Assigner root element validation');
> }
> ```
>
> #### Technical Explanation
> 1. **Synthetic Drag Transfer**: Uses `e.dataTransfer.setData()` inside synthetic `onDragStart` handlers to attach payload data.
> 2. **Drop Overrides**: Calls `e.preventDefault()` in `onDragOver` to allow DOM drop drop target activation.
> 3. **Immutable State Assignment**: Updates target bed slots dynamically using computed property keys.
> 4. **Event Normalization**: Wraps native HTML5 drag and drop events in standard `SyntheticEvent` containers.
> 
---

## 6. Related Terms

- [Declarative Programming](../level_01/declarative_programming.md) — Declaring inline event handlers rather than imperative manual DOM listener attachment.
- [JSX (JavaScript XML)](../level_01/jsx.md) — Attaching synthetic event handlers via camelCase props.
- [Controlled Components](controlled_components.md) — Synthetic `onChange` events driving form state updates.
- [Render Purity](../level_01/render_purity.md) — Housing side effects safely inside event handler functions.

---

## 7. Key Takeaways

- Synthetic Events are cross-browser wrapper objects around native DOM events, normalizing properties across browsers.
- Event names in JSX are written in camelCase (`onClick`, `onChange`, `onSubmit`, `onKeyDown`).
- Always pass function references (`onClick={handleClick}`) rather than function invocations (`onClick={handleClick()}`).
- React delegates all events to a single centralized listener at the application root container (`#root`), maximizing memory efficiency.
- Distinguish between `e.target` (the element that triggered the event) and `e.currentTarget` (the element holding the React event listener).
