# Lifting State Up

> **Level 2 — State & Reactivity**
> Moving shared state to the closest common ancestor so sibling components can stay synchronized.

---

## 1. Prerequisites
- [State](state.md) — The dynamic data being shared.
- [Props (Properties)](../level_01/props.md) — The vehicle used to pass state and setters down.
- [Unidirectional Data Flow](unidirectional_flow.md) — The top-down data flow rules.
---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React enforces a strict **Unidirectional Data Flow**—data only flows downward, from parent to child via props. Sibling components cannot communicate directly with each other.

This creates a challenge when two sibling components need to share the same dynamic data. For example, if you have a `<SearchInput>` component where a user types, and a `<ResultsList>` component that filters database records based on that input:
-   If you define the search state inside `<SearchInput>`, `<ResultsList>` cannot read it.
-   If you define the state inside `<ResultsList>`, `<SearchInput>` cannot update it.

To solve this, developers use the **Lifting State Up** pattern:
1.  Locate the **closest common ancestor (parent component)** of the components that need to share the data.
2.  Declare the `useState` hook inside that parent component.
3.  Pass the state value down to the reading components (e.g. `<ResultsList>`) as a prop.
4.  Pass the state setter function (or an event handler wrapper) down to the writing components (e.g. `<SearchInput>`) as a prop.
5.  When the writer updates the state, the parent re-renders, passing the updated props down to both children simultaneously.

```text
               ┌──────────────────┐
               │  Common Parent   │  <── State lives here
               └──────────────────┘
                 /              \
         (passes setter)    (passes state)
               /                  \
              ▼                    ▼
     ┌───────────────┐      ┌─────────────┐
     │  SearchInput  │      │ ResultsList │
     └───────────────┘      └─────────────┘
```

---

### (2) Reality Metaphor
Imagine two roommates sharing a television.
- **Independent State (Broken System):** Roommate A keeps a personal schedule notepad on their bedroom desk, and Roommate B keeps their own notepad. Since they cannot see each other's notepads, they both schedule their favorite shows at 8:00 PM, resulting in a conflict.
- **Lifting State Up (Fridge Notepad):** They move the schedule notepad to the kitchen refrigerator (**the common parent**). When Roommate A wants to watch a movie, they go to the fridge and write it down (**the state setter**). Both roommates instantly see the updated schedule on the fridge door (**synchronized props**), preventing conflicts.

---

### (3) React Code Example

```jsx
import React, { useState } from 'react';

// 1. Writer Component (receives callback setter prop)
function TemperatureInput({ scale, temperature, onTemperatureChange }) {
  return (
    <fieldset>
      <legend>Enter temperature in {scale}:</legend>
      <input 
        value={temperature} 
        onChange={e => onTemperatureChange(e.target.value)} 
      />
    </fieldset>
  );
}

// 2. Reader Component (receives state read-only prop)
function BoilingVerdict({ celsius }) {
  if (celsius >= 100) {
    return <p>The water would boil.</p>;
  }
  return <p>The water would not boil.</p>;
}

// 3. Common Parent (holds the state)
export default function Calculator() {
  const [temperature, setTemperature] = useState('');

  return (
    <div>
      <TemperatureInput 
        scale="Celsius" 
        temperature={temperature}
        onTemperatureChange={setTemperature} // Pass setter down
      />
      <BoilingVerdict 
        celsius={parseFloat(temperature) || 0} // Pass parsed value down
      />
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Lifting state too high, causing Prop Drilling

**The mistake:** Lifting state up to a top-level root component (like `App.js`) when only two nested components in a deep subtree need to share it.

**Why it's wrong:** Lifting state too high forces you to pass the state and setter functions down through multiple intermediate components that do not care about the data. This anti-pattern, known as **Prop Drilling**, makes your component APIs verbose and hard to refactor.

*Fix:* Only lift state to the **closest** common ancestor. If the components are far apart in the tree, use React's **Context API** or a global state manager (like Zustand) to bypass intermediate components.

---



### Mistake 2: Lifting State Higher Than Necessary in the Component Tree (Over-Lifting State)

**The mistake:** Lifting a search input query state to the root `<App />` component when only a small `<SearchWidget />` child uses it.

**Why it's wrong:** Lifting state to the root causes the ENTIRE application tree to re-render whenever the search query state changes. Keep state as close as possible to where it is used.

*Incorrect:*
```javascript
// Storing search input query in root App component state
```

*Fix:*
```javascript
Keep local input state inside SearchWidget unless sibling components require access
```

### Mistake 3: Passing Down Numerous Separate State Setters Instead of Callback Handlers

**The mistake:** Passing 10 individual `setField1`, `setField2` state setter functions through multiple component levels.

**Why it's wrong:** Passing raw state setters tightly couples children to parent implementation details. Pass domain callback handler functions (e.g. `onFormSubmit`).

*Incorrect:*
```javascript
<Child setField1={setField1} setField2={setField2} />
```

*Fix:*
```javascript
<Child onChange={handleFormChange} />
```

## 6. Practice Exercises

### Exercise 1: Sibling Input Sync

**Problem:** Refactor the components below so that typing inside `InputA` automatically updates the text displayed inside `SiblingDisplay`:

```jsx
// Before (Independent state, not synchronized):
function InputA() {
  const [text, setText] = useState('');
  return <input value={text} onChange={e => setText(e.target.value)} />;
}

function SiblingDisplay() {
  return <p>Current text: (empty)</p>;
}

// After (Refactored Solution):
import React, { useState } from 'react';

function InputA({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

function SiblingDisplay({ value }) {
  return <p>Current text: {value}</p>;
}

function SyncParent() {
  const [text, setText] = useState('');
  return (
    <div>
      <InputA value={text} onChange={setText} />
      <SiblingDisplay value={text} />
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Lifting Shared Accordion State Up

**Problem:** Lift `activeIndex` state up from child `Panel` components to parent `Accordion` component.

**Expected output:**
> [!check]- Answer
> ```text
> function Accordion() { const [activeIndex, setActiveIndex] = useState(0); return <> <Panel isActive={activeIndex === 0} onShow={() => setActiveIndex(0)} /> <Panel isActive={activeIndex === 1} onShow={() => setActiveIndex(1)} /> </>; }
> ```
> ```javascript
> function Accordion() {
>   const [activeIndex, setActiveIndex] = useState(0);
>   return (
>     <>
>       <Panel isActive={activeIndex === 0} onShow={() => setActiveIndex(0)} />
>       <Panel isActive={activeIndex === 1} onShow={() => setActiveIndex(1)} />
>     </>
>   );
> }
> ```
>
> **Explanation:** Lifting state up to the closest common parent coordinates state synchronization between sibling components.

---

### Exercise 3: State Colocation Golden Rule

**Problem:** State golden rule of React state placement (Store state in the lowest common parent component that needs it).

**Expected output:**
> [!check]- Answer
> ```text
> Store state in the lowest common parent component that needs it
> ```
> ```text
> Store state in the lowest common parent component that needs it
> ```
>
> **Explanation:** Colocating state minimizes un-necessary parent and sibling re-renders.

## 7. Related Terms
- [Prop Drilling](../level_06/prop_drilling.md) — The code maintainability cost of lifting state too high.
- [The Context API](../level_06/context_api.md) — The alternative state sharing mechanism for deeply nested trees.
- [Props (Properties)](../level_01/props.md) — Passing state down via props.
- [State Management (Redux / Zustand)](../level_06/state_management.md) — State management patterns.
---

## 8. Key Takeaways
- Lifting State Up synchronizes sibling components by placing state in their common parent.
- Props pass the state value down to readers and the setter down to writers.
- Updates to the parent state trigger re-renders down both sibling branches.
- Sibling components cannot communicate directly in React due to top-down data flow.
- Only lift state to the closest common parent to minimize prop drilling.
- For deep state sharing across many levels, use the Context API instead.
