# Immutability

> **Level 9 — Advanced Concepts & Patterns**
> Never mutating data; producing new copies instead.

---

## 1. Prerequisites
- [Reference vs Value (copy semantics)](../level_07/reference_vs_value.md) — How references link memory objects.
- [Object.freeze / Object.seal](../level_07/object_freeze_seal.md) — Standard methods to lock object mutations.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, arrays and objects are mutable by default. While editing properties directly (`user.age = 30`) is easy, it introduces significant risks in large applications:
- **Shared State Side-effects:** If multiple parts of your application share a single object, and one function mutates a property, other functions can break silently because the shared state changed without their knowledge.
- **Difficult Change Detection:** Checking if a mutable object has changed requires recursively walking through every nested property, which is computationally expensive.

To solve this, developers use **Immutability**—a programming concept where once a data structure (object, array) is created, it can **never be changed**.

Instead of mutating an existing object, you create a **brand-new copy** containing the updated values. 

#### Benefits:
1. **Side-Effect Elimination:** Functions receive read-only data and return new results, ensuring they never corrupt outside state.
2. **Instant Change Detection:** To check if an immutable state changed, you can perform a fast reference equality check: `prevObj !== nextObj`. This is the fundamental basis of state tracking in frameworks like React.
3. **Time-Travel Debugging:** Because old state objects are never deleted or mutated, you can store a list of previous states and "step backward" through history to debug state changes.

### (2) Reality Metaphor
- **Mutability** is like a **whiteboard**. If you need to update a number, you take an eraser, rub out the old digit, and write the new one. The whiteboard has no history; if the final calculation is incorrect, you cannot trace who changed it or what the previous value was.
- **Immutability** is like an **official accounting ledger book**. You are strictly forbidden from erasing anything. If a transaction changes, you write a brand-new line item (a copy of state with changes) at the bottom. The ledger preserves a perfect history trail, and past entries remain permanently frozen in time.

### (3) JavaScript Code Examples

#### Updating Objects (Mutable vs Immutable)
```javascript
const user = { name: "Alice", age: 25 };

// --- 1. Mutable Approach (Bad) ---
const user1 = user;
user1.age = 26; // Mutates original user object!
console.log(user.age); // 26

// --- 2. Immutable Approach (Good) ---
const user2 = { 
  ...user, 
  age: 26 // Copy all fields, but override age
};

console.log(user.age);  // 25 (Original preserved!)
console.log(user2.age); // 26 (New object holds change)
console.log(user === user2); // false (Instant reference check tells us state changed!)
```

#### Updating Arrays Immutably
```javascript
const list = ["taskA", "taskB"];

// --- A. Adding an item ---
const extendedList = [...list, "taskC"]; // Creates new array

// --- B. Removing an item ---
const filteredList = list.filter(item => item !== "taskA"); // filter returns a new array

// --- C. Modifying an item ---
// map returns a new array with updated items
const updatedList = list.map(item => item === "taskB" ? "taskB-updated" : item);

console.log("Original List:", list); // [ 'taskA', 'taskB' ] (Untouched!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `const` with Immutability

**The mistake:** Assuming that declaring an object with `const` protects its properties from mutation.

**Why it's wrong:** `const` only locks the variable *binding* (meaning you cannot reassign the variable: `myVar = {}`). The object properties itself remain fully mutable. You must still treat properties as read-only.

*Incorrect:*
```javascript
const user = { name: "Bob" };
user.name = "Charlie"; // Fully allowed! const does not make objects immutable.
```

*Fix:*
```javascript
const user = { name: "Bob" };
const updatedUser = { ...user, name: "Charlie" }; // Create new copy
```

---

### Mistake 2: Losing Context Binding (`this`) in Immutability Callbacks

**The mistake:** Passing methods from Immutability instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "immutability",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "immutability",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Immutability Operations

**The mistake:** Executing asynchronous operations within Immutability without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/immutability"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/immutability");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in immutability: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Immutable Array Operations

**Problem:** Complete the functions `addScore` and `removeScore` to update the array immutably, returning a new array without modifying the original.

```javascript
function addScore(scoresArray, newScore) {
  // Return new array with newScore added at the end
}

function removeScore(scoresArray, scoreToRemove) {
  // Return new array with scoreToRemove removed
}

const originalScores = [80, 90, 95];
const scoresWithNew = addScore(originalScores, 100);
const scoresMinusOne = removeScore(originalScores, 90);

console.log("Original remains same:", originalScores);
console.log("Added scores:", scoresWithNew);
console.log("Removed scores:", scoresMinusOne);
```

**Expected output:**
> [!check]- Answer
> ```text
> Original remains same: [ 80, 90, 95 ]
> Added scores: [ 80, 90, 95, 100 ]
> Removed scores: [ 80, 95 ]
> ```
> - Inside `addScore`, return `[...scoresArray, newScore]`.
> - Inside `removeScore`, return `scoresArray.filter(s => s !== scoreToRemove)`.
> 
---

### Exercise 2: Updating Objects Immutably with Spread

**Problem:** Update property `role: "admin"` on `user` without mutating original `user` object.

**Expected output:**
> [!check]- Answer
> ```text
> Original role: user, Updated role: admin
> ```
> ```javascript
> const user = { name: "Alice", role: "user" };
> const updatedUser = { ...user, role: "admin" };
> console.log(`Original role: ${user.role}, Updated role: ${updatedUser.role}`);
> ```
>
> **Explanation:** Object spread `{ ...obj }` constructs updated object copies immutably.
> 
---

### Exercise 3: Updating Arrays Immutably

**Problem:** Insert item `2` at index 1 of `[1, 3]` immutably using `.slice()` or spread.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 3 ]
> ```
> ```javascript
> const arr = [1, 3];
> const inserted = [...arr.slice(0, 1), 2, ...arr.slice(1)];
> console.log(inserted);
> ```
>
> **Explanation:** Immutable array operations return new array instances without mutating original collections.
> 
> 
---

## 7. Related Terms
- [Shallow Copy vs Deep Copy](../level_07/shallow_vs_deep_copy.md) — The copying mechanics that prevent reference leakage.
- [Pure Function & Side Effects](../level_03/pure_function.md) — The function design pattern requiring immutable arguments.
- [Mutating vs Non-mutating Methods](../level_04/mutating_vs_non_mutating.md) — Related concept: Mutating vs Non-mutating Methods.
- [Object.freeze / Object.seal](../level_07/object_freeze_seal.md) — Related concept: Object.freeze / Object.seal.

---

## 8. Key Takeaways
- Immutability means data structures can never be modified after creation.
- To update data, you must copy the data structure and apply the change to the new instance.
- Immutability avoids side-effects in shared state and enables fast reference-equality checks (`prev !== next`).
- `const` only prevents variable binding reassignment; it does not freeze object properties.
- Use the spread operator `...`, `.filter()`, and `.map()` to perform immutable array and object updates.
