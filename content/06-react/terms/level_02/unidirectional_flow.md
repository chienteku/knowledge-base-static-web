# Unidirectional Data Flow

> **Level 2 — State & Reactivity**
> The strict architectural rule that data in a React application only ever flows in one direction: Top-Down (from Parent to Child). 

---

## 1. Prerequisites
- [Props (Properties)](../level_01/props.md) — The vehicle that carries the data down.
- [State](state.md) — The source of the data.
---

## 2. Term Category
- **React Architecture**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In older frameworks like AngularJS, "Two-Way Data Binding" was popular. A parent could change a child's data, and a child could magically change the parent's data from the inside out. 
As apps grew massive, Two-Way Data Binding created a chaotic web of updates. If a variable changed, it was impossible to figure out which component changed it, causing impossible-to-trace bugs.
React introduced **Unidirectional (One-Way) Data Flow** to restore sanity. Data is a waterfall. It only flows down. It is predictable, traceable, and easy to debug.

### (2) The Rule of State Location
Because data only flows down, State must live in the highest parent component that needs it. 
If `<Sidebar />` and `<Header />` both need to know the `currentUser`, the State cannot live in `<Sidebar />`, because Sidebar cannot pass data "sideways" to Header. 
The state must be "LIFTED" up to their shared parent (`<App />`), and then passed *down* to both of them via Props.

### (3) "Inverse Data Flow" (The Trick)
Wait, if data only flows down, how does a Child button click update the Parent's state?
We use a trick called "Inverse Data Flow." The Parent passes a *Callback Function* down to the Child as a prop.
```javascript
function Parent() {
  const [count, setCount] = useState(0);
  
  // The Parent passes the SETTER function down as a prop!
  return <Child onIncrement={() => setCount(count + 1)} />;
}

function Child({ onIncrement }) {
  // The Child simply executes the function it was handed.
  return <button onClick={onIncrement}>Add</button>;
}
```
The data isn't flowing up. The Child is just triggering a function that belongs to the Parent.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Syncing State from Props (Anti-Pattern)

**The mistake:** A developer receives a prop, but immediately copies it into local state.
```javascript
function Child({ initialCount }) {
  // Anti-pattern! Copying prop to state.
  const [count, setCount] = useState(initialCount); 
}
```

**Why it's wrong:** You just created two separate sources of truth! If the Parent updates `initialCount` later, the Child's `useState` will completely ignore it (because `useState` only looks at the initial value on the *very first* render). The UI will desync.
**Golden Rule:** If a value can be derived from Props, do not put it in State. Just use the Prop directly!

---



### Mistake 2: Attempting Two-Way Data Binding by Mutating Child Props Directly

**The mistake:** Attempting to change a parent prop directly from child code `props.value = 'new'`.

**Why it's wrong:** React enforces strict Unidirectional Data Flow (one-way data binding from Parent to Child). Mutating props directly breaks state isolation and causes silent bugs.

*Incorrect:*
```javascript
function Child(props) {
  return <input value={props.val} onChange={e => props.val = e.target.value} />; // ❌ Direct prop mutation!
}
```

*Fix:*
```javascript
function Child({ val, onChange }) {
  return <input value={val} onChange={e => onChange(e.target.value)} />;
}
```

### Mistake 3: Creating Circular State Update Chains Across Sibling Components

**The mistake:** Child A updating Parent state, which triggers Parent to update Child B state via `useEffect`, updating Child A.

**Why it's wrong:** Circular state dependencies trigger infinite re-render loops (`Maximum update depth exceeded`). Consolidate state management into a single parent component or reducer.

*Incorrect:*
```javascript
// Infinite re-render loop across sibling component useEffect chains
```

*Fix:*
```javascript
Consolidate state update logic into a single parent handler or reducer
```

## 6. Practice Exercises

### Exercise 1: Lifting State Up

**Problem:** You have an `<AudioPlayer />` component and a `<VolumeControl />` component. They are siblings. `VolumeControl` has a slider that changes the volume. How do you get the volume level from the slider into the audio player?

**Expected output:**
> [!check]- Answer
> ```text
> State cannot be passed between siblings. You must "Lift the State Up".
> You create the `volume` state inside their shared Parent component. 
> You pass `volume` down to `<AudioPlayer />` as a prop.
> You pass `setVolume` down to `<VolumeControl />` as a prop.
> ```
> - Waterfalls only go down. Where is the top of the waterfall for these two siblings?

---



### Exercise 2: One-Way Data Flow Direction

**Problem:** Describe how data and events flow in React (Data flows DOWN via props; Events flow UP via callback functions).

**Expected output:**
> [!check]- Answer
> ```text
> Data flows DOWN via props; Events flow UP via callback functions
> ```
> ```text
> Data flows DOWN via props; Events flow UP via callback functions
> ```
>
> **Explanation:** Unidirectional flow guarantees deterministic, traceable state debugging.

---

### Exercise 3: Controlled Input One-Way Flow

**Problem:** Build controlled text input demonstrating unidirectional data flow.

**Expected output:**
> [!check]- Answer
> ```text
> function Input({ value, onChange }) { return <input value={value} onChange={e => onChange(e.target.value)} />; }
> ```
> ```javascript
> function Input({ value, onChange }) {
>   return <input value={value} onChange={e => onChange(e.target.value)} />;
> }
> ```
>
> **Explanation:** Parent passes data down (`value`), child sends events up (`onChange`).

## 7. Related Terms
- [Props (Properties)](../level_01/props.md) — The water flowing down the waterfall.
- [Prop Drilling](../level_06/prop_drilling.md) — The dark side of Unidirectional flow (when the waterfall is 20 components deep).
- [Controlled Components](../level_05/controlled_components.md) — Related concept: Controlled Components.
- [State](state.md) — Related concept: State.
---

## 8. Key Takeaways
- **Unidirectional Data Flow** means data only ever moves from Parent to Child via Props.
- Siblings cannot share data directly. If they both need data, the State must be **Lifted Up** to their closest shared Parent.
- To allow a Child to update a Parent's state, the Parent must pass a callback function down to the Child.
- Never copy Props into local State. It creates multiple sources of truth and causes bugs.
