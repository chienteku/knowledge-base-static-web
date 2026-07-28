# State Management

> **Level 7 — State Management (Pinia)**
> The architectural pattern of extracting shared data (State) out of individual components and placing it into a centralized, global location that any component can access and mutate.

---

## 1. Prerequisites
- [Props](../level_04/props.md) — The local way of passing state, which breaks down at scale.
- [Emitting Events](../level_04/emit.md) — The local way of mutating state, which also breaks down at scale.

---

## 2. Term Category
- **Architecture / Programming Concept**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In small Vue apps, [Props](../level_04/props.md) and [Events](../level_04/emit.md) work perfectly. A Parent holds the data, passes it down to the Child, and the Child emits an event to change it.
But imagine a Shopping Cart. The `CartIcon.vue` in the Navbar needs to show the number of items. The `ProductCard.vue` deep in the main page needs to add items to it. The `Checkout.vue` page needs to calculate the total. 
These components are completely unrelated in the component tree. Passing the Cart array up and down 15 levels of components via Props and Emits is called "Prop Drilling". It creates a tangled, unmaintainable mess.

### (2) The Global "Store"
**State Management** solves this by creating a Global "Store". Think of it as a cloud server living inside your browser's memory.
The Store holds the Cart array. 
- The `CartIcon` connects directly to the Store to read the length.
- The `ProductCard` connects directly to the Store to push a new item.
No Props. No Emits. The data is completely decoupled from the component hierarchy.

### (3) The Tools
In React, the dominant State Management tool is Redux.
In Vue 2, the official tool was Vuex.
In modern Vue 3, the official tool is **[Pinia](../level_07/pinia.md)**.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Putting *everything* in Global State

**The mistake:** A developer discovers Pinia and thinks Props are useless now. They put an accordion's `isOpen` boolean into the global store.

**Why it's wrong:** Global state is a massive hammer; not every problem is a nail. If data is *only* used by one component (like the open/close state of a dropdown menu, or the text typed into a search box before hitting enter), it should remain **Local State** inside that component.
**Golden Rule:** Only put data into Global State if it needs to be accessed or mutated by multiple, unrelated components across different areas of the application (e.g., User Authentication status, Shopping Carts, UI Themes).

---

### Mistake 2: Over-Engineering Component Local State into Global Pinia Stores

**The mistake:** Storing temporary UI states like `isModalOpen` or `hoverIndex` inside global Pinia stores.

**Why it's wrong:** Global stores should hold shared domain data (user auth, cart items, notifications). Storing local UI component toggle states in global stores pollutes global namespace and complicates testing. Keep local state in component `ref()`.

*Incorrect:*
```vue
/* Storing single-button dropdown open boolean in global Pinia store */
```

*Fix:*
```vue
/* Use local component ref(false) for component-specific UI toggle state */
```

---

### Mistake 3: Bypassing Store Actions to Mutate State Arbitrarily Across 50 Components

**The mistake:** Directly mutating `store.items.push(item)` from 20 different component files without encapsulation.

**Why it's wrong:** Direct un-encapsulated mutations across dozens of components make tracking state bugs nearly impossible. Encapsulate complex state mutations inside store actions.

*Incorrect:*
```vue
<!-- 20 components mutating store array directly -->
<button @click="store.items.pop()">Pop</button>
```

*Fix:*
```vue
<!-- Encapsulate state updates in store actions -->
<button @click="store.removeItem(id)">Delete</button>
```


---

## 6. Practice Exercises

### Exercise 1: Local vs Global

**Problem:** Categorize the following data as either Local State or Global State:
1. The currently logged-in user's authentication token.
2. The current tab selected in a `<Tabs>` component.
3. The list of notifications shown in the bottom right corner of the screen.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Global State: The whole app needs to know if the user is authenticated to hide/show routes.
> 2. Local State: Only the Tabs component cares which tab is active.
> 3. Global State: Any component (API failure, successful save, new message) needs the ability to trigger a notification.
> ```
> - Who else cares about this data?

---

### Exercise 2: Pinia $patch Grouped State Mutation

**Problem:** Write Pinia `$patch()` call updating `user.name = 'Alice'` and `user.age = 30` in a single atomic update.

**Expected output:**
> [!check]- Answer
> ```javascript
> userStore.$patch({ user: { name: 'Alice', age: 30 } });
> ```
> - `$patch()` batches multiple state mutations into a single update.
> 
> ```javascript
> userStore.$patch({
>   name: 'Alice',
>   age: 30
> });
> ```

---

### Exercise 3: Pinia $reset Method Availability

**Problem:** Does Pinia `$reset()` work out of the box for Options Stores, Setup Stores, or Both?

**Expected output:**
> [!check]- Answer
> ```text
> Options Stores support $reset() natively out of the box; Setup Stores require implementing custom $reset functions.
> ```
> - Options Stores: Built-in `$reset()` resets state to default.
> - Setup Stores: Custom `$reset()` function must be implemented.
> 
> ```javascript
> store.$reset();
> ```


---

## 7. Related Terms
- [Pinia](../level_07/pinia.md) — The specific tool Vue uses to implement State Management.
- [Props](../level_04/props.md) — The tool for Local State Management.

---

## 8. Key Takeaways
- **State Management** is the practice of storing shared data outside the component tree.
- It prevents "Prop Drilling" (passing data through dozens of intermediate components).
- Any component can read from or write to the Global Store directly.
- Only use Global State for data that truly needs to be shared across the app (Auth, Carts, Global UI state). Use Local State for everything else.
