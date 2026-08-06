# Immutability

> **Level 2 — State & Reactivity**
> The strict architectural rule that React state values must never be modified in-place; updates must produce new object and array references.

---

## 1. Prerequisites

- [State](state.md) — The memory storage mechanism governed by immutability rules.
- [Virtual DOM](../level_01/virtual_dom.md) — Virtual DOM diffing relies on shallow referential equality checks enabled by immutability.

---

## 2. Term Category

**Rendering Mechanic (state reference change engine)**: Immutability is a fundamental architectural rule in React state management. An immutable object is an object whose state cannot be modified after it is created.

In React, rather than mutating existing state objects or arrays in-place (`user.age = 21` or `items.push(newItem)`), developers must treat state as read-only snapshots and create brand new object or array memory references containing the desired changes. This allows React to detect state changes in $O(1)$ constant time via shallow referential equality comparison (`Object.is(prevState, nextState)`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
React is designed around fast, efficient rendering. When a component calls a state setter function, React must determine whether the state actually changed to decide whether to queue a re-render.

If state objects contained 10,000 nested properties, checking whether a deep property changed via recursive deep-equality checking would require comparing thousands of properties on every update. Deep equality checks are extremely slow and degrade performance.

By enforcing **Immutability**, React can check whether data changed using $O(1)$ shallow referential equality check:

```javascript
// React internally checks:
if (!Object.is(prevState, nextState)) {
  // Memory address is different -> State changed! Trigger Re-render!
}
```

- **If you mutate in-place (`user.age = 25; setUser(user)`):** The memory reference (`user`) remains identical. React compares `prevState === nextState` (True), assumes data did not change, and SKIPS re-rendering entirely. The UI stays frozen.
- **If you update immutably (`setUser({ ...user, age: 25 })`):** The spread operator creates a brand new object in a new memory address. React compares references (False), detects the change instantly, and triggers a surgical re-render.

### (2) Reality Metaphor
Imagine managing a signed paper contract.

- **Mutation (Forbidden - White-Out on Original):** You take the original physical paper contract and use white-out liquid to scribble over a paragraph and write new text on the original sheet. Anyone looking at the contract's unique serial number (**memory reference**) cannot tell at a glance whether the document was altered without re-reading every word line-by-line (**expensive deep comparison**).
- **Immutability (React Way - Photocopy & Revision):** You leave the original paper contract untouched. You print a brand new contract sheet with a new document number (**new memory reference**), copy over unchanged clauses, and write the updated terms. Anyone checking the document serial number instantly recognizes a new version was issued in 0.001 seconds (**$O(1)$ reference check**).

### (3) React Code Examples

#### Short Snippet
```jsx
// Updating state immutably using object spread syntax
const [user, setUser] = useState({ name: 'Alice', role: 'Dev' });

const updateRole = (newRole) => {
  // GOOD: Creates a new object reference with updated role property
  setUser(prev => ({ ...prev, role: newRole }));
};
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

export default function ImmutableTodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React Core', completed: true },
    { id: 2, text: 'Master Immutability', completed: false }
  ]);

  // 1. Immutable Item Addition (Spread Array)
  const addTodo = (text) => {
    const newTodo = { id: Date.now(), text, completed: false };
    setTodos(prev => [...prev, newTodo]); // New array reference
  };

  // 2. Immutable Item Toggle (Array Map)
  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        // Return a brand new object reference for modified item
        return { ...todo, completed: !todo.completed };
      }
      // Return unchanged item references intact
      return todo;
    }));
  };

  // 3. Immutable Item Deletion (Array Filter)
  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id)); // New array reference
  };

  return (
    <div className="todo-panel">
      <h3>Immutable Task Manager</h3>
      <button onClick={() => addTodo('Write Tests')}>Add Task</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            <span>{todo.text}</span>
            <button onClick={() => toggleTodo(todo.id)}>Toggle</button>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating State Objects or Arrays In-Place Before Setter Invocations

**The mistake:** Writing `user.name = 'Bob'; setUser(user)` or `items.push(newItem); setItems(items)`.

**Why it's wrong:** Methods like `.push()`, `.pop()`, `.sort()`, and direct property assignments mutate existing memory references in-place. React performs a shallow referential equality check (`Object.is`). Because the memory reference remains identical, React assumes state did not change and skips re-rendering.

*Incorrect:*
```jsx
const [items, setItems] = useState(['Apple', 'Banana']);

const handleAdd = () => {
  // ❌ Mutates array in-place! Memory reference remains identical; UI ignores update!
  items.push('Cherry');
  setItems(items);
};
```

*Fix:*
```jsx
const [items, setItems] = useState(['Apple', 'Banana']);

const handleAdd = () => {
  // ✅ Spread operator creates a brand new array memory reference
  setItems(prev => [...prev, 'Cherry']);
};
```

### Mistake 2: Shallow Copying Deeply Nested Objects Leaving Nested References Mutated

**The mistake:** Writing `const updated = { ...user }; updated.profile.avatar = 'new.png'; setUser(updated)`.

**Why it's wrong:** Object spread syntax (`{ ...user }`) creates a SHALLOW copy. Nested inner objects (like `user.profile`) continue pointing to the OLD memory addresses. Direct property mutations on nested objects mutate shared nested state, causing subtle bugs and breaking memoized subtrees.

*Incorrect:*
```jsx
const [user, setUser] = useState({ id: 1, profile: { avatar: 'old.png', age: 25 } });

const updateAvatar = () => {
  const copy = { ...user };
  // ❌ Mutates shared nested profile object in-place!
  copy.profile.avatar = 'new.png'; 
  setUser(copy);
};
```

*Fix:*
```jsx
const [user, setUser] = useState({ id: 1, profile: { avatar: 'old.png', age: 25 } });

const updateAvatar = () => {
  // ✅ Spread every nested object level in the update path
  setUser(prev => ({
    ...prev,
    profile: {
      ...prev.profile,
      avatar: 'new.png'
    }
  }));
};
```

### Mistake 3: Using Mutating Array Methods (`.sort()`, `.splice()`, `.reverse()`) Directly in Handlers

**The mistake:** Sorting array state using `todos.sort((a, b) => a.id - b.id)`.

**Why it's wrong:** Array methods `.sort()`, `.splice()`, and `.reverse()` mutate original array instances directly. Always shallow-copy the array before invoking mutating methods.

*Incorrect:*
```jsx
// ❌ Mutates original state array in-place!
const handleSort = () => {
  const sorted = todos.sort((a, b) => a.title.localeCompare(b.title));
  setTodos(sorted);
};
```

*Fix:*
```jsx
// ✅ Copy array first before calling mutating sort
const handleSort = () => {
  const sorted = [...todos].sort((a, b) => a.title.localeCompare(b.title));
  setTodos(sorted);
};
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Array Immutable Updates (IoT Telemetry)

**Scenario:** An industrial IoT monitoring app updates a list of sensor reading objects upon receiving telemetry packets. Implement immutable row updates when a specific sensor sends a new reading.

**Requirements:**
1. Create `TelemetryManager` managing `sensors` state array (`id`, `temp`, `status`).
2. Implement `updateSensorTemp(id, newTemp)` immutably using `.map()`.
3. Ensure unchanged sensor objects retain their exact referential memory addresses.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function TelemetryManager() {
>   const [sensors, setSensors] = useState([
>     { id: 'S1', temp: 22.5, status: 'OK' },
>     { id: 'S2', temp: 45.1, status: 'WARN' }
>   ]);
> 
>   const updateSensorTemp = (sensorId, newTemp) => {
>     setSensors(prevSensors => 
>       prevSensors.map(sensor => {
>         if (sensor.id === sensorId) {
>           // Immutable update: Return brand new object reference for target sensor
>           return { ...sensor, temp: newTemp, status: newTemp > 50 ? 'CRITICAL' : 'OK' };
>         }
>         // Preserve unchanged sensor object memory references intact
>         return sensor;
>       })
>     );
>   };
> 
>   return (
>     <div className="telemetry-panel">
>       <h4>Sensor Matrix</h4>
>       <button onClick={() => updateSensorTemp('S1', 52.3)}>Simulate S1 Overheat</button>
>       <ul>
>         {sensors.map(s => (
>           <li key={s.id}>{s.id}: {s.temp}°C — Status: {s.status}</li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Array Mapping**: `.map()` produces a brand new array reference for top-level state comparisons.
> 2. **Targeted Object Spread**: `{ ...sensor, temp: newTemp }` creates a new object memory reference only for the modified sensor.
> 3. **Referential Preservation**: Returning `sensor` unchanged for un-targeted items preserves memory references, allowing `React.memo` children to skip renders.
> 4. **$O(1)$ Change Detection**: React detects state changes instantly via reference equality.
> 
---

### Exercise 2: Financial Order Book Depth Update (Financial Trading)

**Scenario:** A trading engine receives depth updates for nested order book levels. Update a nested price level immutably inside a complex state object.

**Requirements:**
1. Create `OrderBookDepth` managing state `{ symbol: 'BTC', depth: { bids: [...], asks: [...] } }`.
2. Implement `updateTopBid(newPrice, newQty)` immutably.
3. Spread all nested object levels (`depth`, `bids`).
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function OrderBookDepth() {
>   const [book, setBook] = useState({
>     symbol: 'BTC-USD',
>     depth: {
>       bids: [{ price: 60000, qty: 1.5 }, { price: 59900, qty: 2.0 }],
>       asks: [{ price: 60100, qty: 0.8 }]
>     }
>   });
> 
>   const updateTopBid = (newPrice, newQty) => {
>     setBook(prevBook => ({
>       ...prevBook,
>       depth: {
>         ...prevBook.depth,
>         bids: [
>           { price: newPrice, qty: newQty },
>           ...prevBook.depth.bids.slice(1) // Keep remaining bids immutably
>         ]
>       }
>     }));
>   };
> 
>   return (
>     <div className="book-card">
>       <h4>{book.symbol} Top Bid: ${book.depth.bids[0].price} (Qty: {book.depth.bids[0].qty})</h4>
>       <button onClick={() => updateTopBid(60050, 2.5)}>Update Top Bid</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Multi-Level Object Spreading**: Spreading `...prevBook` and `...prevBook.depth` creates new object references down the active path.
> 2. **Immutable Array Replacement**: Constructing `[{ price, qty }, ...slice(1)]` replaces the top bid without mutating array indices in-place.
> 3. **Reference Isolation**: The `asks` array reference is preserved unchanged.
> 4. **Render Triggering**: Guaranteed new top-level object reference forces React to re-render UI views.
> 
---

### Exercise 3: E-Commerce Nested User Address Update (E-Commerce)

**Scenario:** An e-commerce checkout profile component updates user shipping address details immutably.

**Requirements:**
1. Create `UserProfile` managing `{ user: { name: 'Alice', address: { city: 'NYC', zip: '10001' } } }`.
2. Implement `updateCity(newCity)` using nested updater spread functions.
3. Provide input field binding.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function UserProfile() {
>   const [userData, setUserData] = useState({
>     user: {
>       name: 'Alice',
>       address: { city: 'New York', zip: '10001' }
>     }
>   });
> 
>   const handleCityChange = (newCity) => {
>     setUserData(prev => ({
>       ...prev,
>       user: {
>         ...prev.user,
>         address: {
>           ...prev.user.address,
>           city: newCity
>         }
>       }
>     }));
>   };
> 
>   return (
>     <div className="profile-form">
>       <h4>User: {userData.user.name}</h4>
>       <p>City: {userData.user.address.city} (Zip: {userData.user.address.zip})</p>
>       <input 
>         value={userData.user.address.city} 
>         onChange={e => handleCityChange(e.target.value)} 
>         placeholder="Enter new city..." 
>       />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Deep Immutable Copying**: Every nested object along the mutation path (`userData` -> `user` -> `address`) is copied using object spread.
> 2. **Controlled Form Inputs**: Target input reads nested properties cleanly and dispatches immutable updaters.
> 3. **Un-targeted Property Retention**: Unchanged sibling properties (`zip`, `name`) copy over seamlessly.
> 4. **State Predictability**: Eliminates reference mutation side effects across shared UI modules.
> 
---

## 6. Related Terms

- [`useState` Hook](use_state.md) — The hook requiring immutable update calls to trigger re-renders.
- [Re-rendering](re_rendering.md) — What fails to execute if immutability rules are violated.
- [State](state.md) — Component memory variables governed by immutability principles.
- [Dependency Array](../level_03/dependency_array.md) — Hook dependency comparison arrays relying on referential equality.

---

## 7. Key Takeaways

- **Immutability** requires treating React state objects and arrays as read-only snapshots.
- Never modify state in-place (`user.age = 25` or `items.push()`); always return new memory references.
- React relies on immutability to perform fast $O(1)$ referential equality checks (`Object.is`).
- Mutating state in-place breaks change detection, causing React to skip re-renders and freeze the UI.
- Use non-mutating JavaScript methods (`...spread`, `.map()`, `.filter()`, `.concat()`, `.slice()`).
- When updating nested objects, spread every nested object level along the updated property path.
