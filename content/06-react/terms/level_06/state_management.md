# State Management (Redux / Zustand)

> **Level 6 — Context & Global State**
> Third-party libraries designed specifically to handle massive amounts of complex, rapidly changing global data across an entire application without suffering from extreme performance loss.

---

## 1. Prerequisites
- [The Context API](context_api.md) — State managers are the heavy-duty alternative to the built-in Context API.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — State managers use tricks to bypass this safely.

---

## 2. Term Category
- **React Ecosystem / Architecture**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While the built-in Context API is great for simple things (like Dark Mode), it has a fatal flaw: **It lacks fine-grained reactivity.**
If you put a giant `{ user, cart, theme, notifications }` object into Context, and *only* the `theme` changes, every component listening to that Context will re-render, even if they only cared about the `cart`!
To build complex apps (like an E-commerce store), we need **Global State Managers**. They allow a component to subscribe to a *tiny specific piece* of the global state (just the `cart`), and they will ONLY re-render if that specific piece changes.

### (2) The Redux Pattern (The Industry Standard)
Redux is the oldest and most famous state manager. It uses a strict pattern:
1. **The Store:** One giant, immutable object holding all data.
2. **Actions:** If you want to change data, you cannot mutate it. You must "dispatch" an Action object describing what happened (e.g., `{ type: 'ADD_ITEM', payload: 'Apple' }`).
3. **Reducers:** A pure function that takes the current State and the Action, and returns a brand new copy of the State.
*Redux is incredibly robust, but requires massive amounts of boilerplate code.*

### (3) Zustand (The Modern Alternative)
Zustand (German for "State") is the modern favorite. It throws away the complex Redux boilerplate. You just create a hook, define your state and your updater functions inside it, and use it directly in your components.
```javascript
// Zustand Example
import { create } from 'zustand';

// Create a global store
const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

function BearCounter() {
  // We explicitly subscribe ONLY to the 'bears' number!
  const bears = useStore((state) => state.bears);
  return <h1>{bears} around here ...</h1>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Subscribing to the entire Store

**The mistake:** A developer using Zustand or Redux grabs the entire global state object: `const state = useStore()`.

**Why it's wrong:** You just ruined the performance optimization! By grabbing the entire object, your component is now subscribed to *everything*. If *anything* in the global state changes, your component will re-render.
**Golden Rule:** Always use "Selector Functions" to grab the exact, specific primitive value you need: `const bears = useStore(state => state.bears)`.

---



### Mistake 2: Storing All Application State in a Single Monolithic Global Redux/Context Store

**The mistake:** Putting text input values, modal toggles, and API data into a single global state object.

**Why it's wrong:** Global state bloat causes unnecessary re-render cascades and complicates state cleanup. Keep UI state (form inputs, dropdown toggles) local to component views.

*Incorrect:*
```javascript
// Storing local modal open/close boolean in global Redux store
```

*Fix:*
```javascript
Colocate local UI state in useState; reserve global stores for app-wide user/theme data
```

### Mistake 3: Confusing Client UI State with Server Cache Data

**The mistake:** Managing API cache invalidation and refetching logic manually inside Redux reducers.

**Why it's wrong:** Server data (API responses) has different requirements (caching, refetching, deduplication) than Client UI state. Use React Query / SWR for server cache management.

*Incorrect:*
```javascript
// Writing custom Redux actions for API refetch and cache expiry logic
```

*Fix:*
```javascript
Use React Query for server cache state and Zustand / Redux for client UI state
```

## 6. Practice Exercises

### Exercise 1: Context vs Redux/Zustand

**Problem:** You are building an app. You have two pieces of data: 
1. The user's preferred language (English/Spanish). 
2. Real-time GPS coordinates of a delivery driver updating 10 times a second.
Which global tool should you use for each?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Language: Use the built-in Context API. It rarely changes, and when it does, you want the whole app to re-render to update the text anyway.
> 2. GPS Coordinates: Use Zustand/Redux. It updates rapidly, and you only want the map component to re-render, not the entire application.
> ```
> - Which one is high-frequency? High-frequency breaks the Context API.

---



### Exercise 2: Categorizing State Types

**Problem:** Categorize as Local, Shared, or Server State: 1. Input field text (Local); 2. Authenticated user object (Shared); 3. API product catalog (Server).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Local State, 2. Shared State, 3. Server State
> ```
> ```text
> 1. Local State, 2. Shared State, 3. Server State
> ```
>
> **Explanation:** Distinguishing state categories determines optimal state management tools.

---

### Exercise 3: State Architecture Decision Matrix

**Problem:** Which state tool to use: 1. Component UI toggle (`useState`); 2. Complex local state machine (`useReducer`); 3. App-wide theme/user (`Context`); 4. Server API cache (`React Query`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. useState, 2. useReducer, 3. Context, 4. React Query
> ```
> ```text
> 1. useState, 2. useReducer, 3. Context, 4. React Query
> ```
>
> **Explanation:** Right-sizing state management tools prevents architectural bloat.

## 7. Related Terms
- [`useReducer` Hook](use_reducer.md) — React's built-in hook that mimics the Action/Reducer pattern of Redux on a local component level.
- [The Context API](context_api.md) — The built-in alternative.
- [Prop Drilling](prop_drilling.md) — Related concept: Prop Drilling.
- [React Query (TanStack Query) / SWR](../level_11/react_query.md) — Related concept: React Query (TanStack Query) / SWR.
- [`useSyncExternalStore` Hook](../level_11/use_sync_external_store.md) — Related concept: `useSyncExternalStore` Hook.
- [Zustand](../level_11/zustand.md) — Related concept: Zustand.
- [Lifting State Up](../level_02/lifting_state_up.md) — Related concept: Lifting State Up.

---

## 8. Key Takeaways
- **Global State Managers** (Redux, Zustand) are used for complex data that needs to be shared across the entire app.
- Unlike Context, they provide "fine-grained reactivity", allowing components to subscribe to specific slices of data to prevent unnecessary re-renders.
- **Redux** uses strict Actions and Reducers to guarantee predictable state changes.
- **Zustand** is a modern, lightweight alternative that uses custom hooks without the heavy boilerplate.
- Always use Selector functions to pull out only the exact data your component needs.
