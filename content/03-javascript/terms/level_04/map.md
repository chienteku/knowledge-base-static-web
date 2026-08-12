# `map()`

> **Level 4 — Iteration & Array Methods**
> Creates a new array populated with the results of calling a provided function on every element.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [`return` Statement](../level_03/return_statement.md) — Outputs a value from a function.

---

## 2. Term Category

**Array Method / Functional Programming (Universal: Works everywhere)**: `map()` is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
One of the most common tasks in programming is taking a list of data, modifying every single item in exactly the same way, and saving the result. For example, taking an array of prices and adding a 5% tax to each one.

Before `map()`, developers had to create an empty array, write a `for` loop or `forEach`, manually calculate the new value, and `.push()` it into the empty array. This was tedious. `map()` was designed as an elegant, declarative solution: it automatically creates a new array behind the scenes, runs your callback function on each item, and places the *returned value* of your callback into the new array. 

### (2) Reality Metaphor
`map()` is like a currency exchange machine at the airport. You feed an array of U.S. Dollar bills into the machine one by one. The machine processes (maps) each bill using the current exchange rate, and spits out an array of Euros on the other side. You still have the same *number* of bills, but the *values* have been transformed. 

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const numbers = [1, 2, 3];

// 'map' automatically collects the returned values into a brand new array!
const doubled = numbers.map((num) => {
  return num * 2;
});

console.log(doubled); // [2, 4, 6]
// The original array is completely untouched
console.log(numbers); // [1, 2, 3]
```

#### Fuller Example
```javascript
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];

// Extracting just the names using an implicit return arrow function
const namesArray = users.map(user => user.name);

console.log(namesArray); // ["Alice", "Bob", "Charlie"]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `return` inside the callback

**The mistake:** Using `map()` but forgetting the `return` keyword inside the callback block.

**Why it's wrong:** `map()` builds the new array strictly using what your callback *returns*. If your callback doesn't have a `return` statement, it returns `undefined`. `map()` will faithfully push that `undefined` into the new array for every single item!

*Incorrect:*
```javascript
const prices = [10, 20, 30];

const taxedPrices = prices.map((price) => {
  const tax = price * 0.10;
  price + tax; // Forgot to return!
});

console.log(taxedPrices); // [undefined, undefined, undefined]
```

*Fix:*
```javascript
const prices = [10, 20, 30];

const taxedPrices = prices.map((price) => {
  const tax = price * 0.10;
  return price + tax; // Must return the final value!
});
```

---

### Mistake 2: Losing Context Binding (`this`) in Map Callbacks

**The mistake:** Passing methods from Map instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "map",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "map",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Map Operations

**The mistake:** Executing asynchronous operations within Map without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/map"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/map");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in map: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: User Profile DTO Payload Transformation

**Scenario:** A REST API serializer maps database model instances to public JSON Data Transfer Objects (DTOs) using map().

**Requirements:**
1. Write transformUserModels(userModels).
2. Transform models using userModels.map(u => ({ id: u.id, email: u.email })).
3. Return mapped array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function transformUserModels(userModels) {
>   if (!Array.isArray(userModels)) return [];
>   return userModels.map(user => ({
>     id: user.id,
>     email: user.email.toLowerCase(),
>     fullName: `${user.firstName} ${user.lastName}`
>   }));
> }
>
> // Verification tests
> const raw = [{ id: 1, email: "ALICE@EXAMPLE.COM", firstName: "Alice", lastName: "Smith" }];
> const dto = transformUserModels(raw);
> console.assert(dto[0].email === "alice@example.com", "Test 1 Failed");
> console.assert(dto[0].fullName === "Alice Smith", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **map() Transformation**: Array.prototype.map(callback) creates a new array populated with results of calling callback on every element.
> 2. **1-to-1 Mapping**: Output array length strictly matches input array length.
> 3. **Pure Function Requirement**: Keep map callbacks pure without mutating original elements.
---

## 6. Related Terms
- [`forEach()`](../level_04/for_each.md) — Iterates through an array but does *not* return a new array.
- [`filter()`](../level_04/filter.md) — Creates a new array, but only keeps items that pass a true/false test.

---

## 7. Key Takeaways
- `map()` is used to **transform** an array of data.
- It always returns a **brand new array** of the exact same length as the original.
- It does **not** mutate (change) the original array.
- You must `return` a value from inside the callback function.
