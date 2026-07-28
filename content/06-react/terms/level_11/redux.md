# Redux

> **Level 11 — Ecosystem Libraries**
> The most historically famous, battle-tested Global State Management library for React. It enforces a strict, predictable architecture for updating complex application data.

---

## 1. Prerequisites
- [State Management](../level_06/state_management.md) — Redux is the implementation of this concept.
- [`useReducer` Hook](../level_06/use_reducer.md) — React's built-in version of the Redux pattern.

---

## 2. Term Category
- **React Ecosystem / State Management Library**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In 2015, complex React apps were a mess of [Prop Drilling](../level_06/prop_drilling.md) and chaotic `setState` calls scattered across 50 different files. If a bug happened, it was impossible to trace *which* component changed the data and *when*.
**Redux** was created to bring extreme discipline to React state. It forces you to put all your global data in one single vault, and makes it physically impossible to change that data without leaving a clear, auditable paper trail.

### (2) The Redux Architecture (The 3 Pillars)
1. **The Store:** The single source of truth. One giant JavaScript object that holds the state for the entire application.
2. **Actions:** You cannot mutate the Store directly. You must "dispatch" an Action—a plain object describing an event (e.g., `{ type: 'ADD_TO_CART', payload: { id: 5 } }`).
3. **Reducers:** Pure functions that take the current Store and the Action, and calculate the brand new state object.

### (3) Redux Toolkit (RTK)
Historically, Redux was infamous for requiring massive amounts of "boilerplate" code just to change a single boolean.
Today, the industry strictly uses **Redux Toolkit (RTK)**. It is the modern, official version of Redux that hides the boilerplate and allows you to write much simpler code using "Slices".

```javascript
import { createSlice } from '@reduxjs/toolkit';

// Redux Toolkit 'Slice'
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    // Looks like we are mutating, but RTK safely translates this into Immutable code under the hood!
    addItem: (state, action) => {
      state.items.push(action.payload);
    }
  }
});

export const { addItem } = cartSlice.actions;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Redux for Local UI State

**The mistake:** A developer uses Redux to track whether a specific dropdown menu on the settings page is currently open or closed.

**Why it's wrong:** Redux is for **Global State** (data needed by multiple, disconnected components, like a Shopping Cart or User Profile). Putting local UI state (like `isDropdownOpen`) into Redux clutters the global store, ruins performance, and forces you to write 5 files of boilerplate for a simple toggle.
**Golden Rule:** Keep local UI state inside the component using `useState`. Only promote data to Redux when it truly needs to be shared across the app.

---



### Mistake 2: Using Legacy Redux Boilerplate (Switch Cases and Action Creators) Instead of Redux Toolkit (RTK)

**The mistake:** Writing manual `const ADD_TODO = 'ADD_TODO';` string constants and manual switch-case reducers in modern projects.

**Why it's wrong:** Modern Redux strictly mandates using **Redux Toolkit (`@reduxjs/toolkit`)** with `createSlice()`. RTK reduces boilerplate by 80% and includes built-in Immer for safe mutable syntax.

*Incorrect:*
```javascript
// Legacy 50-line manual action types and switch case reducers
```

*Fix:*
```javascript
const todoSlice = createSlice({ name: 'todos', initialState, reducers: { add: (state, action) => { state.push(action.payload); } } });
```

### Mistake 3: Selecting Entire Global Redux State Object inside Components (`useSelector(state => state)`)

**The mistake:** Calling `const state = useSelector(state => state);` inside a header component.

**Why it's wrong:** Selecting the ENTIRE global state object causes the component to re-render whenever ANY value in the global Redux store changes! Use granular selectors `useSelector(state => state.user.name)`.

*Incorrect:*
```javascript
const state = useSelector(state => state); // ❌ Re-renders on ANY store state change!
```

*Fix:*
```javascript
const userName = useSelector(state => state.user.name); // Granular selector
```

## 6. Practice Exercises

### Exercise 1: The Paper Trail

**Problem:** Why does Redux force you to dispatch Action objects (`{ type: 'LOGIN' }`) instead of just letting you write `store.user = "Alice"`?

**Expected output:**
> [!check]- Answer
> ```text
> Predictability and Debugging!
> By forcing all changes through Actions, the Redux DevTools extension can record a literal history log of every single event that happened in your app. You can even "Time Travel" backwards through the actions to see exactly how your app reached a broken state!
> ```
> - Think about audit logs in a bank.

---



### Exercise 2: Creating Slice with Redux Toolkit

**Problem:** Create `counterSlice` using Redux Toolkit `createSlice` with `increment` and `decrement` reducers.

**Expected output:**
> [!check]- Answer
> ```text
> import { createSlice } from '@reduxjs/toolkit'; const counterSlice = createSlice({ name: 'counter', initialState: { value: 0 }, reducers: { increment: state => { state.value += 1; }, decrement: state => { state.value -= 1; } } }); export const { increment, decrement } = counterSlice.actions; export default counterSlice.reducer;
> ```
> ```javascript
> import { createSlice } from '@reduxjs/toolkit';
>
> const counterSlice = createSlice({
>   name: 'counter',
>   initialState: { value: 0 },
>   reducers: {
>     increment: state => { state.value += 1; },
>     decrement: state => { state.value -= 1; }
>   }
> });
>
> export const { increment, decrement } = counterSlice.actions;
> export default counterSlice.reducer;
> ```
>
> **Explanation:** Redux Toolkit `createSlice` automatically generates action creators and reducers using Immer.

---

### Exercise 3: Dispatching Actions in React Components

**Problem:** Dispatch `increment()` action inside component using `useDispatch()`.

**Expected output:**
> [!check]- Answer
> ```text
> const dispatch = useDispatch(); return <button onClick={() => dispatch(increment())}>Add</button>;
> ```
> ```javascript
> const dispatch = useDispatch();
> return <button onClick={() => dispatch(increment())}>Add</button>;
> ```
>
> **Explanation:** `useDispatch()` returns store dispatch function to trigger Redux state updates.

## 7. Related Terms
- [`useReducer` Hook](../level_06/use_reducer.md) — The localized React version of this pattern.
- [The Context API](../level_06/context_api.md) — The built-in alternative for simpler global state.

---

## 8. Key Takeaways
- **Redux** is a strict global state manager that uses a Store, Actions, and Reducers.
- It provides extreme predictability and amazing debugging tools ("Time Travel").
- Modern apps should always use **Redux Toolkit (RTK)**, which removes the frustrating boilerplate of older Redux.
- Only use Redux for truly global, shared data. Local UI state belongs in `useState`.
