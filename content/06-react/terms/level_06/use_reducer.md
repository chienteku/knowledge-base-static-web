# `useReducer` Hook

> **Level 6 — Context & Global State**
> An advanced alternative to `useState` that allows you to manage complex, multi-variable component state using the predictable "Action & Reducer" pattern from Redux.

---

## 1. Prerequisites
- [`useState` Hook](../level_02/use_state.md) — `useReducer` is just a more powerful version of `useState`.
- [State Management (Redux)](../level_06/state_management.md) — `useReducer` perfectly implements the Redux pattern, just locally.

---

## 2. Term Category
- **Core React Hook**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a component has a very complex state (e.g., a form with `name`, `email`, `age`, `isSubmitting`, `errorMsg`), you might find yourself calling 5 different `setSomething` functions inside a single button click. The logic gets tangled and messy.
**`useReducer`** organizes complex state logic. Instead of the component modifying the state directly, the component "Dispatches" an action. A centralized function (the Reducer) receives the action and decides exactly how all 5 state variables should update simultaneously.

### (2) The Three Pieces
1. **The State:** The complex object holding the data.
2. **The Action:** An object describing *what* happened. It usually has a `type` string, and sometimes a `payload` of data. (e.g., `{ type: 'INCREMENT', payload: 5 }`).
3. **The Reducer:** A Pure Function sitting outside the component. It takes the `(currentState, action)` and returns the brand new State.

### (3) How to use it
```javascript
import { useReducer } from 'react';

// 1. The Reducer Function (Usually defined OUTSIDE the component)
function counterReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  // 2. The Hook (Takes the reducer function, and the initial state object)
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      {/* 3. Dispatching an Action! */}
      <button onClick={() => dispatch({ type: 'INCREMENT', payload: 1 })}>
        Add 1
      </button>
      <button onClick={() => dispatch({ type: 'RESET' })}>
        Reset
      </button>
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating state inside the Reducer

**The mistake:** Inside the switch statement, a developer writes `state.count = state.count + 1; return state;`.

**Why it's wrong:** The [Rule of Immutability](../level_02/immutability.md) strictly applies to Reducers! If you return the exact same object memory address, React will assume nothing changed and will NOT re-render the UI.
**Golden Rule:** A Reducer MUST be a Pure Function that returns a brand new copy of the object: `return { ...state, count: state.count + 1 }`.

---



### Mistake 2: Mutating State Objects Directly inside Reducer Functions

**The mistake:** Writing `state.count = state.count + 1; return state;` inside a `useReducer` function.

**Why it's wrong:** Reducer functions MUST be pure calculations returning NEW immutable state objects! Mutating existing `state` in-place causes React to skip re-rendering because object memory references match.

*Incorrect:*
```javascript
function reducer(state, action) {
  if (action.type === 'inc') {
    state.count += 1; // ❌ Direct state mutation!
    return state;
  }
}
```

*Fix:*
```javascript
function reducer(state, action) {
  if (action.type === 'inc') {
    return { ...state, count: state.count + 1 }; // Immutably return new object
  }
}
```

### Mistake 3: Performing Async Side-Effects (e.g. `fetch` calls) inside Reducer Functions

**The mistake:** Executing `fetch('/api/user').then(...)` inside a `useReducer` reducer function.

**Why it's wrong:** Reducers MUST be pure synchronous functions ($State_{new} = reducer(State_{old}, Action)$). Performing async side-effects inside reducers causes duplicate executions and race conditions. Perform async logic in event handlers and dispatch pure actions.

*Incorrect:*
```javascript
function reducer(state, action) {
  if (action.type === 'fetch') {
    fetch('/data').then(res => ...); // ❌ Side-effect inside reducer!
  }
}
```

*Fix:*
```javascript
const handleFetch = async () => {
  const data = await fetch('/data');
  dispatch({ type: 'SET_DATA', payload: data }); // Dispatch pure action
};
```

## 6. Practice Exercises

### Exercise 1: State vs Reducer

**Problem:** You have a boolean state: `const [isOpen, setIsOpen] = useState(false)`. Should you refactor this to use `useReducer`?

**Expected output:**
```text
Absolutely not. 
`useReducer` requires a lot of boilerplate code (Switch statements, Action objects). It is extreme overkill for a simple boolean or string. 
Only use `useReducer` when you have complex state objects where changing one value depends on or affects other values.
```

> [!check]- Answer
> - Simple state = `useState`. Complex state objects = `useReducer`.

---



### Exercise 2: Counter Reducer Implementation

**Problem:** Write pure reducer function supporting `'INCREMENT'`, `'DECREMENT'`, and `'RESET'` action types.

**Expected output:**
```text
function counterReducer(state, action) { switch (action.type) { case 'INCREMENT': return { count: state.count + 1 }; case 'DECREMENT': return { count: state.count - 1 }; case 'RESET': return { count: 0 }; default: return state; } }
```

> [!check]- Answer
> ```javascript
> function counterReducer(state, action) {
>   switch (action.type) {
>     case 'INCREMENT':
>       return { count: state.count + 1 };
>     case 'DECREMENT':
>       return { count: state.count - 1 };
>     case 'RESET':
>       return { count: 0 };
>     default:
>       return state;
>   }
> }
> ```
>
> **Explanation:** Reducer functions compute next state based on current state and dispatched action object.

### Exercise 3: useReducer Signature

**Problem:** What array tuple does `const [state, dispatch] = useReducer(reducer, initialState)` return? (Current state snapshot and dispatch function).

**Expected output:**
```text
Current state snapshot and dispatch function
```

> [!check]- Answer
> ```text
> Current state snapshot and dispatch function
> ```
>
> **Explanation:** `useReducer` returns current state and `dispatch(action)` function to trigger state updates.

## 7. Related Terms
- [State Management (Redux)](../level_06/state_management.md) — Redux uses this exact same pattern, but on a global scale.
- [`useState` Hook](../level_02/use_state.md) — Under the hood, React actually uses `useReducer` to build `useState`!

---

## 8. Key Takeaways
- **`useReducer`** is an advanced hook for managing complex state objects in a component.
- The component **Dispatches** an **Action** object (e.g., `{ type: 'LOGIN' }`).
- A **Reducer** function receives the action and safely returns the new state based on a `switch` statement.
- Reducers must be Pure Functions and strictly follow Immutability.
- Use it when `useState` becomes too messy with multiple interdependent state variables.
