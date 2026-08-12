# reduce()

> **Level 4 — Iteration & Array Methods**
> Executes a reducer function on each element, resulting in a single cumulative output value.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [Callback Function](../level_03/callback_function.md) — A function passed into another function.

---

## 2. Term Category

**Array Method / Functional Programming (Universal: Works everywhere)**: reduce() is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Often, you need to take an entire array of data and "boil it down" into a single value. For example, summing up the total price of all items in a shopping cart, or finding the highest score in a list of test grades. 

While you could use a `for` loop and an external accumulator variable (`let total = 0`), `reduce()` provides a functional, self-contained way to do this. It carries an "accumulator" variable from one iteration to the next, updating it based on the logic in your callback, and finally returns the fully accumulated value.

### (2) Reality Metaphor
Imagine you are walking through a forest collecting apples. You start with an empty basket (the Initial Value). As you walk past the first tree (the first array element), you add its apples to your basket (the Accumulator). You carry that basket to the second tree, add more apples, and so on. At the end of the forest, the only thing you return is the single basket full of all the apples you collected.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const numbers = [1, 2, 3, 4];

// reduce takes TWO arguments: the callback function, and an initial value (0)
const sum = numbers.reduce((accumulator, currentNumber) => {
  return accumulator + currentNumber;
}, 0);

console.log(sum); // 10
```

#### Fuller Example
```javascript
const cart = [
  { item: "Shirt", price: 20 },
  { item: "Pants", price: 50 },
  { item: "Hat", price: 15 }
];

// Finding the total cost of all items in the cart
const totalCost = cart.reduce((total, currentItem) => {
  return total + currentItem.price;
}, 0); // 0 is the starting 'total'

console.log(`Your total is $${totalCost}`); // Your total is $85
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Initial Value

**The mistake:** Leaving off the second argument to `reduce()` (the initial value) when working with an array of objects.

**Why it's wrong:** If you don't provide an initial value, `reduce()` will automatically use the *first item in the array* as the accumulator, and start looping from the second item. If the first item is an Object (like `{ price: 20 }`), JavaScript will try to do `{ price: 20 } + 50`, resulting in a bizarre string concatenation `"[object Object]50"`.

*Incorrect:*
```javascript
const cart = [{ price: 20 }, { price: 50 }];

// Forgot the ', 0' at the end!
const total = cart.reduce((acc, item) => acc + item.price); 

console.log(total); // "[object Object]50"
```

*Fix:*
```javascript
const cart = [{ price: 20 }, { price: 50 }];

// Provide '0' as the starting number!
const total = cart.reduce((acc, item) => acc + item.price, 0); 

console.log(total); // 70
```

---

### Mistake 2: Losing Context Binding (`this`) in Reduce Callbacks

**The mistake:** Passing methods from Reduce instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "reduce",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "reduce",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Reduce Operations

**The mistake:** Executing asynchronous operations within Reduce without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/reduce"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/reduce");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in reduce: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Order Total Financial Aggregator & Category Grouping

**Scenario:** An inventory reporter uses reduce() to group items by category and compute aggregate financial totals.

**Requirements:**
1. Write groupAndSumByCategory(items).
2. Use reduce() to group items by item.category.
3. Accumulate category total prices.
4. Return dictionary object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function groupAndSumByCategory(items) {
>   if (!Array.isArray(items)) return {};
>
>   return items.reduce((acc, item) => {
>     const cat = item.category || "uncategorized";
>     acc[cat] = (acc[cat] || 0) + item.price;
>     return acc;
>   }, {});
> }
>
> // Verification tests
> const inventory = [
>   { category: "Tech", price: 100 },
>   { category: "Tech", price: 50 },
>   { category: "Books", price: 20 }
> ];
> const res = groupAndSumByCategory(inventory);
> console.assert(res.Tech === 150, "Test 1 Failed");
> console.assert(res.Books === 20, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **reduce() Mechanism**: Array.prototype.reduce(reducer, initialValue) accumulates array elements into a single value (number, object, array).
> 2. **Accumulator Value**: The reducer callback receives (accumulator, currentValue, index, array) and returns updated accumulator.
> 3. **Initial Value Importance**: Always specify initialValue to prevent runtime TypeError exceptions on empty arrays.
---

## 6. Related Terms
- [Map](../level_08/map.md) — Returns an array of the same length, rather than a single accumulated value.
- [filter()](filter.md) — Returns a shorter array, rather than a single accumulated value.
- [flat / flatMap](flat_flatmap.md) — Related concept: flat / flatMap.

---

## 7. Key Takeaways
- `reduce()` is used to boil an array down into a single value (a number, string, or even a new object).
- The callback function receives the `accumulator` (the running total) and the `currentValue`.
- You MUST `return` the new accumulator value inside the callback so it can be passed to the next iteration.
- Always provide an **initial value** as the second argument to `reduce()`, especially when working with arrays of objects.
