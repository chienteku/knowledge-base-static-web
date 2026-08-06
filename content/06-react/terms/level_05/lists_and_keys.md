# Lists & Keys

> **Level 5 — DOM & Event Handling**
> The technique of transforming arrays of data into collections of JSX elements using `.map()`, and assigning stable unique `key` props to enable efficient Virtual DOM reconciliation.

---

## 1. Prerequisites

- [JSX (JavaScript XML)](../level_01/jsx.md) — Rendering arrays of JSX elements inside templates.
- [Virtual DOM](../level_01/virtual_dom.md) — Understanding element diffing and DOM node reuse.
- [Reconciliation](../level_01/reconciliation.md) — The engine algorithm relying on keys to track element movements.

---

## 2. Term Category

**Rendering Mechanic (reconciliation tracking)**: Lists & Keys in React represent the primary pattern for rendering collections of similar UI components from data arrays. Developers use standard JavaScript array iteration methods—primarily `Array.prototype.map()`—to convert raw data objects into arrays of React elements.

To optimize DOM updates during re-renders, React strictly requires each rendered list item to have a special string or numeric `key` prop. The `key` attribute acts as an internal unique identity tag for the Virtual DOM reconciliation engine. Rather than mutating DOM nodes indiscriminately by array position, React uses keys to match previous Virtual DOM nodes with new ones, preserving component state, DOM focus, and CSS transitions when items are inserted, deleted, or re-ordered.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In imperative DOM manipulation, rendering a list of items required writing `for` loops, creating element nodes manually via `document.createElement()`, and appending them into parent containers. Updating or re-ordering a list meant manually finding the target row and updating text nodes or clearing and repopulating the entire container, which destroyed input cursor focus and performance.

React automates list rendering by mapping data arrays straight to JSX. However, when list order changes (e.g. sorting a table or inserting an item at the top), React needs to know which specific items moved, were added, or were removed. Without unique keys, React falls back to comparing elements strictly by array index position. This "naive" matching leads to severe state bugs—such as text input contents staying on row index 0 when the data item moves to row index 1. Stable, unique keys solve this by giving every list element a persistent identity across render cycles.

### (2) Reality Metaphor

Imagine a coat check room at a theatre where patrons store their coats.

If the coat check attendant tags coats using simple sequential seat numbers (1, 2, 3), and patron #1 leaves early, shifting patron #2's coat to hanger #1 causes absolute chaos when retrieving coats later. The coat check attendant has lost track of *which coat belongs to whom* because the identifier was tied to the hanger's physical position.

If the attendant instead attaches a unique brass claim ticket (**the React `key`**) directly to each coat itself, coats can be moved to different hangers, re-sorted, or reorganized freely. The attendant inspects the claim ticket brass tag to identify each exact coat instantly, regardless of which hanger position it occupies.

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';

function SimpleUserList({ users }) {
  // Rendering an array of objects to JSX using .map with persistent ID keys
  return (
    <ul className="user-list">
      {users.map((user) => (
        <li key={user.id} className="user-item">
          <span className="user-name">{user.name}</span> — <span>{user.role}</span>
        </li>
      ))}
    </ul>
  );
}

export default SimpleUserList;
```

#### Fuller Example

```jsx
import React, { useState } from 'react';

function DynamicTaskBoard() {
  const [tasks, setTasks] = useState([
    { id: 'task-1', text: 'Calibrate IoT Gateway', priority: 'High' },
    { id: 'task-2', text: 'Verify Financial Audit Log', priority: 'Medium' },
    { id: 'task-3', text: 'Update Patient EHR Database', priority: 'Low' }
  ]);

  const addTaskAtTop = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      text: `Emergency Maintenance #${tasks.length + 1}`,
      priority: 'High'
    };
    // Prepend task to array to test reconciliation stability
    setTasks((prev) => [newTask, ...prev]);
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="task-board">
      <button onClick={addTaskAtTop} className="btn-add">
        + Prepend Emergency Task
      </button>

      <ul className="task-list">
        {tasks.map((task) => (
          // key prop MUST be on the outermost element returned inside map
          <li key={task.id} className={`task-card ${task.priority.toLowerCase()}`}>
            <span className="task-text">{task.text}</span>
            <input type="text" placeholder="Add notes..." className="task-notes" />
            <button onClick={() => removeTask(task.id)} className="btn-delete">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DynamicTaskBoard;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Array Index as the `key` Prop for Dynamic or Sortable Lists

**The mistake:** Writing `items.map((item, index) => <li key={index}>{item.name}</li>)`.

**Why it's wrong:** Array indices change when items are prepended, removed, or re-ordered. If an item is prepended at index 0, the item previously at index 0 becomes index 1. React matches keys from the previous render frame and assumes index 0's component identity did not change, transferring internal state (like input focus, checkbox selections, or CSS animations) to the wrong data item!

*Incorrect:*
```jsx
function ItemList({ items }) {
  // ❌ Index key causes state corruption on re-ordering or prepending!
  return (
    <ul>
      {items.map((item, index) => (
        <TodoItem key={index} todo={item} />
      ))}
    </ul>
  );
}
```

*Fix:*
```jsx
function ItemList({ items }) {
  // Use stable persistent unique data IDs
  return (
    <ul>
      {items.map((item) => (
        <TodoItem key={item.id} todo={item} />
      ))}
    </ul>
  );
}
```

### Mistake 2: Generating Dynamic Keys During Render via `Math.random()` or `uuid()`

**The mistake:** Writing `items.map(item => <li key={Math.random()}>{item.name}</li>)`.

**Why it's wrong:** Generating a new key on every render cycle causes React's reconciliation engine to treat *every single list item* as a completely new component. React will completely unmount, destroy, and recreate all DOM nodes on every render frame, destroying input focus, scroll position, and causing massive UI lag.

*Incorrect:*
```jsx
function ProductList({ products }) {
  // ❌ Re-creates all DOM nodes on EVERY re-render!
  return (
    <div>
      {products.map((p) => (
        <ProductCard key={Math.random()} product={p} />
      ))}
    </div>
  );
}
```

*Fix:*
```jsx
function ProductList({ products }) {
  // Use existing persistent database ID
  return (
    <div>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

### Mistake 3: Placing the `key` Prop on Child Elements Inside Extracted Components Instead of the Root Component

**The mistake:** Placing `key` on the internal `<div>` inside `<CustomCard>` instead of on `<CustomCard>` itself in `.map()`.

**Why it's wrong:** React expects the `key` prop to be specified directly on the element returned in the top-level callback of `.map()`. If you extract list items into a custom sub-component, the `key` MUST be attached to the custom component tag itself, not inside the child component's internal markup.

*Incorrect:*
```jsx
function List({ items }) {
  return items.map((item) => <CustomCard item={item} />); // ❌ Missing key on wrapper tag!
}

function CustomCard({ item }) {
  return <div key={item.id}>{item.name}</div>; // Key placed inside component
}
```

*Fix:*
```jsx
function List({ items }) {
  // Attach key directly to outermost component returned in map
  return items.map((item) => <CustomCard key={item.id} item={item} />);
}

function CustomCard({ item }) {
  return <div>{item.name}</div>;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Device Status Telemetry Grid

**Scenario:** You are building an industrial IoT dashboard that renders a list of connected sensors. Sensors can be sorted by temperature or filtered by status. Ensure component state (like accordion collapse toggles) stays attached to the correct sensor during re-sorting.

**Requirements:**
1. Render list of sensors using `.map()` with stable unique `id` keys.
2. Provide interactive sorting by temperature.
3. Include an inline collapsible detail view to verify state preservation during sorting.
4. Add verification assertions checking key assignment and sorting stability.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function SensorGrid({ initialSensors }) {
>   const [sensors, setSensors] = useState(initialSensors);
>   const [expandedId, setExpandedId] = useState(null);
> 
>   const sortByTempDesc = () => {
>     setSensors((prev) => [...prev].sort((a, b) => b.temp - a.temp));
>   };
> 
>   const toggleExpand = (id) => {
>     setExpandedId((prev) => (prev === id ? null : id));
>   };
> 
>   return (
>     <div className="sensor-grid">
>       <button onClick={sortByTempDesc} className="btn-sort">
>         Sort by Temperature (High → Low)
>       </button>
> 
>       <div className="grid-container">
>         {sensors.map((sensor) => (
>           <div key={sensor.id} className="sensor-card" data-testid={`sensor-${sensor.id}`}>
>             <h4>{sensor.name}</h4>
>             <p>Temp: {sensor.temp}°C</p>
>             <button onClick={() => toggleExpand(sensor.id)}>
>               {expandedId === sensor.id ? 'Hide Details' : 'Show Details'}
>             </button>
>             {expandedId === sensor.id && (
>               <div className="details-pane">
>                 Firmware: v{sensor.firmware} | Location: Zone-{sensor.zone}
>               </div>
>             )}
>           </div>
>         ))}
>       </div>
>     </div>
>   );
> }
> 
> export function testSensorGrid() {
>   const data = [
>     { id: 's-1', name: 'Pressure Sensor', temp: 30, firmware: '1.2', zone: 'A' },
>     { id: 's-2', name: 'Thermal Sensor', temp: 85, firmware: '2.0', zone: 'B' }
>   ];
>   const element = SensorGrid({ initialSensors: data });
>   const keys = element.props.children[1].props.children.map((child) => child.key);
>   console.assert(keys[0] === 's-1' && keys[1] === 's-2', 'Sensor key assignment mismatch');
> }
> ```
>
> #### Technical Explanation
> 1. **Persistent Key Binding**: Uses unique string identifiers (`s-1`, `s-2`) as keys, ensuring component state persists through re-sorting.
> 2. **Immutability Array Sorting**: Copies array (`[...prev]`) before calling `.sort()` to prevent direct mutation of state arrays.
> 3. **Stable Reconciliation**: Allows React to re-order physical DOM nodes efficiently without unmounting child elements.
> 4. **Selective Expansion**: Controls active detail panels using explicit sensor ID matches.
> 
### Exercise 2: Financial Stock Watchlist Order Book

**Scenario:** Implement a financial market trading watchlist. Users can add new ticker watch items, delete items, or move items up and down in rank.

**Requirements:**
1. Render watchlist items using `.map()` with ticker symbol or database ID keys.
2. Implement move up/down array swapping functions.
3. Render user notes input fields inside list rows to prove state identity stability.
4. Include runtime test assertions for key ordering.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function StockWatchlist() {
>   const [list, setList] = useState([
>     { id: 'sec-aapl', symbol: 'AAPL', price: 185.2 },
>     { id: 'sec-nvda', symbol: 'NVDA', price: 720.5 },
>     { id: 'sec-msft', symbol: 'MSFT', price: 405.1 }
>   ]);
> 
>   const moveUp = (index) => {
>     if (index === 0) return;
>     setList((prev) => {
>       const next = [...prev];
>       const temp = next[index - 1];
>       next[index - 1] = next[index];
>       next[index] = temp;
>       return next;
>     });
>   };
> 
>   return (
>     <div className="watchlist">
>       <h3>Trading Watchlist</h3>
>       <ul>
>         {list.map((item, idx) => (
>           <li key={item.id} className="row-item">
>             <strong>{item.symbol}</strong> — ${item.price}
>             <input type="text" placeholder="Trader note..." className="note-input" />
>             <button onClick={() => moveUp(idx)} disabled={idx === 0}>
>               ↑ Move Up
>             </button>
>           </li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> 
> export function testStockWatchlist() {
>   const list = [{ id: '1', symbol: 'A' }, { id: '2', symbol: 'B' }];
>   console.assert(list[0].id === '1', 'Initial watchlist ID validation');
> }
> ```
>
> #### Technical Explanation
> 1. **State Preservation Across Swap**: Stable `item.id` keys allow input field note values to move seamlessly with the swapped row.
> 2. **Immutable Array Swapping**: Uses array copying and index swapping to update row positions cleanly.
> 3. **DOM Element Reuse**: Prevents input unmounting when list rows swap screen locations.
> 4. **Key Location**: Places `key={item.id}` directly on the root `<li>` element returned inside the `.map()` loop.
> 
### Exercise 3: Healthcare Patient EHR Treatment Schedule List

**Scenario:** Build a hospital patient medication schedule component. Nurses can add new dosage entries or check off completed doses.

**Requirements:**
1. Render dosage schedule items using `.map()` with unique ID keys.
2. Include checkbox controls for marking medication as administered.
3. Allow filtering between All and Completed doses without losing checked state.
4. Include runtime assertions for schedule rendering.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function MedicationSchedule({ initialDoses }) {
>   const [doses, setDoses] = useState(initialDoses);
>   const [filterCompleted, setFilterCompleted] = useState(false);
> 
>   const toggleAdministered = (id) => {
>     setDoses((prev) =>
>       prev.map((d) => (d.id === id ? { ...d, administered: !d.administered } : d))
>     );
>   };
> 
>   const visibleDoses = filterCompleted
>     ? doses.filter((d) => d.administered)
>     : doses;
> 
>   return (
>     <div className="med-schedule">
>       <h3>Patient Dosage Schedule</h3>
>       <label>
>         <input
>           type="checkbox"
>           checked={filterCompleted}
>           onChange={(e) => setFilterCompleted(e.target.checked)}
>         />
>         Show Administered Only
>       </label>
> 
>       <ul>
>         {visibleDoses.map((dose) => (
>           <li key={dose.id} className={dose.administered ? 'done' : 'pending'}>
>             <input
>               type="checkbox"
>               checked={dose.administered}
>               onChange={() => toggleAdministered(dose.id)}
>             />
>             <span>
>               {dose.medication} — {dose.time} ({dose.dosage})
>             </span>
>           </li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> 
> export function testMedicationSchedule() {
>   const data = [
>     { id: 'm-1', medication: 'Insulin', time: '08:00', dosage: '10U', administered: false }
>   ];
>   const res = MedicationSchedule({ initialDoses: data });
>   console.assert(res.props.children[2].props.children[0].key === 'm-1', 'Medication schedule key verification');
> }
> ```
>
> #### Technical Explanation
> 1. **Filtered View Key Consistency**: Maintains key identity (`m-1`) when switching between filtered and unfiltered list views.
> 2. **State Updates via Map**: Uses immutable `prev.map()` to target specific medication records by ID.
> 3. **Controlled Checkbox Integration**: Pairs controlled checked states with persistent unique list keys.
> 4. **Declarative List Projection**: Derives `visibleDoses` during render without duplicating list state.
> 
---

## 6. Related Terms

- [Virtual DOM](../level_01/virtual_dom.md) — The virtual representation of UI diffed using keys.
- [Reconciliation](../level_01/reconciliation.md) — The core engine algorithm relying on keys for item matching.
- [JSX (JavaScript XML)](../level_01/jsx.md) — The template syntax used for `.map()` list expressions.
- [Fragments](../level_01/fragments.md) — Using `<React.Fragment key={id}>` when mapping sibling lists.

---

## 7. Key Takeaways

- Use `.map()` to convert data arrays into collections of JSX elements.
- Always provide a unique, persistent `key` prop on the outermost element returned inside `.map()`.
- Never use array indices as keys for dynamic, sortable, or filterable lists.
- Do not generate dynamic keys during render via `Math.random()` or timestamp generators.
- Stable keys preserve DOM state, text cursor focus, CSS transitions, and unmounting efficiency during reconciliation.
