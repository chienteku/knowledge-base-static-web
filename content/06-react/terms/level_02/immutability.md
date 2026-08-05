# Immutability

> **Level 2 — State & Reactivity**
> The strict architectural rule that you must never modify an existing piece of data directly (mutating). Instead, you must create a brand new copy of the data with the changes applied.

---

## 1. Prerequisites
- [State](state.md) — This rule strictly applies to how you update React State.
---

## 2. Term Category
- **Programming Concept / React Core Rule**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React is obsessed with performance. When State changes, React has to compare the Old State to the New State to decide if it needs to re-render.
If you have an array of 10,000 users, and you change the name of the 5th user, how does React know the array changed?
If React had to check every single item in the array, it would be incredibly slow. 
By enforcing **Immutability**, React can just check the *Memory Address* (Reference) of the array! If the memory address is different, React instantly knows the array changed. If it's the same, it knows nothing changed. This takes 0.0001 milliseconds!

### (2) Mutating vs Immutability
**Mutating (Forbidden in React State):** Directly changing the existing object in memory.
```javascript
const [user, setUser] = useState({ name: 'Bob', age: 20 });

// BAD: We are modifying the original object!
user.age = 21; 
setUser(user); 
```

**Immutability (The React Way):** Creating a brand new object. We use the ES6 Spread Operator (`...`) to copy the old properties into a new object in a new memory address.
```javascript
// GOOD: We create a brand new object, copy Bob over, and overwrite the age!
setUser(prevUser => {
  return { ...prevUser, age: 21 };
});
```

### (3) The Array Methods
Because of Immutability, you must avoid JavaScript array methods that mutate the original array:
- ❌ **Do NOT use:** `.push()`, `.pop()`, `.splice()`, `.sort()`, `.reverse()`.
- ✅ **DO use:** `.map()`, `.filter()`, `.reduce()`, `.slice()`, and the spread operator `[...oldArray, newItem]`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The UI won't update!

**The mistake:** A developer has an array of tasks in state. They use `.push()` to add a new task, and call the setter.
```javascript
const [tasks, setTasks] = useState(['Eat', 'Sleep']);

function addTask() {
  tasks.push('Code'); // Mutating!
  setTasks(tasks);    // React ignores this!
}
```

**Why it's wrong:** React compares the memory address of the old `tasks` to the new `tasks`. Because `.push()` modifies the existing array, the memory address didn't change! React says, "The address is the same, so the data must be the same. I will NOT re-render!" The UI stays frozen.
**Golden Rule:** Always create a new array. `setTasks([...tasks, 'Code'])`.

---



### Mistake 2: Mutating State Objects or Arrays In-Place Before Calling `setState`

**The mistake:** Writing `user.name = 'Alice'; setUser(user);` or `items.push(newItem); setItems(items);`.

**Why it's wrong:** React uses shallow referential equality checks (`Object.is(prev, next)`). If you mutate the existing object in-place, the memory reference remains identical! React assumes state didn't change and skips re-rendering.

*Incorrect:*
```javascript
const addItem = () => {
  items.push('new');
  setItems(items); // ❌ Same array reference! React skips re-render!
};
```

*Fix:*
```javascript
const addItem = () => {
  setItems([...items, 'new']); // New array reference triggers re-render
};
```

### Mistake 3: Shallow Copying Deeply Nested Objects Leaving Inner Objects Mutated

**The mistake:** Writing `const updated = { ...user }; updated.profile.age = 30; setUser(updated);`.

**Why it's wrong:** Spread syntax `{ ...user }` performs a SHALLOW copy! Nested object `profile` still points to the old memory reference. Deeply nested mutations break React state change tracking.

*Incorrect:*
```javascript
const updated = { ...user };
updated.profile.age = 30; // ❌ Mutates inner nested object in-place!
```

*Fix:*
```javascript
setUser({
  ...user,
  profile: { ...user.profile, age: 30 } // Copy nested object explicitly
});
```

## 6. Practice Exercises

### Exercise 1: The Spread Operator

**Problem:** You have `const [person, setPerson] = useState({ name: 'Alice', city: 'NY' })`. 
Write the `setPerson` code to change her city to 'LA' without mutating the original object.

**Expected output:**
> [!check]- Answer
> ```javascript
> setPerson({ ...person, city: 'LA' });
> ```
> - Create a new object `{}`. 
> - Spread the old properties `...person`.
> - Overwrite the specific property.

---



### Exercise 2: Immutable Nested Object State Update

**Problem:** Immutably update `user.address.city` to `'Tokyo'` using spread syntax.

**Expected output:**
> [!check]- Answer
> ```text
> setUser(prev => ({ ...prev, address: { ...prev.address, city: 'Tokyo' } }));
> ```
> ```javascript
> setUser(prev => ({
>   ...prev,
>   address: {
>     ...prev.address,
>     city: 'Tokyo'
>   }
> }));
> ```
>
> **Explanation:** Immutably updating nested objects requires spreading every object level in the path.

---

### Exercise 3: Immutable Array Item Removal

**Problem:** Remove item with `id = targetId` from `items` array immutably using `.filter()`.

**Expected output:**
> [!check]- Answer
> ```text
> setItems(prev => prev.filter(item => item.id !== targetId));
> ```
> ```javascript
> setItems(prev => prev.filter(item => item.id !== targetId));
> ```
>
> **Explanation:** Array methods like `.filter()`, `.map()`, and `slice()` return new array instances immutably.

## 7. Related Terms
- [`useState` Hook](use_state.md) — The function that requires you to follow this rule.
- [Re-rendering](re_rendering.md) — What fails to happen if you break the rule of Immutability.
- [Dependency Array](../level_03/dependency_array.md) — Related concept: Dependency Array.
---

## 8. Key Takeaways
- **Immutability** means you can never directly modify State objects or arrays.
- You must always create a brand new copy of the object/array with the changes applied.
- React relies on Immutability for lightning-fast performance. It checks memory addresses to see if data changed.
- If you mutate state directly, React will not detect the change, and the UI will not re-render.
- Rely heavily on the ES6 Spread Operator (`...`), `.map()`, and `.filter()`.
