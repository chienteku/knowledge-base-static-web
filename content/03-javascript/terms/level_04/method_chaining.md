# Method Chaining

> **Level 4 — Iteration & Array Methods**
> Calling array methods in sequence (`.filter().map()…`).

---

## 1. Prerequisites
- [Map](../level_08/map.md) — Transforms each element in an array.
- [filter()](filter.md) — Filters elements based on a condition callback.
- [reduce()](reduce.md) — Accumulates array values into a single output.
- [Pure Function & Side Effects](../level_03/pure_function.md) — A function that returns a new value without modifying its inputs.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Method Chaining is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In data processing, we rarely perform a single operation on a dataset. For example, to print user labels, you might need to:
1. Filter out users who haven't confirmed their email address.
2. Extract the name property from each remaining user.
3. Sort the names alphabetically.

Creating a temporary variable for each step (e.g. `const activeUsers = users.filter(...)`, `const names = activeUsers.map(...)`, etc.) litters your code with variables that you only use once. 

Because non-mutating array methods (like `filter`, `map`, and `slice`) always return a **new Array instance**, that new array instantly has access to all array methods. This allows developers to link calls together in a single statement—a design pattern known as **Method Chaining**. It mimics functional pipeline data flows, keeping code highly expressive and readable.

### (2) Reality Metaphor
Method chaining is like an industrial assembly conveyor belt.
- A raw block of wood (raw array) is loaded at the beginning.
- **Station 1 (Filter):** Trims away cracked blocks.
- **Station 2 (Map):** Carves the wood into toy trains.
- **Station 3 (Reduce):** Packages all the trains into a shipping crate.

The wood moves directly from one station to the next without a worker taking it off the line and storing it in a closet (creating temporary variables) between each station.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const numbers = [1, 2, 3, 4, 5];

// Filter odd numbers, then square the remaining numbers
const squaredEvens = numbers
  .filter(num => num % 2 === 0) // returns [2, 4]
  .map(num => num ** 2);         // returns [4, 16]

console.log(squaredEvens); // [4, 16]
```

#### Fuller Example
```javascript
// Processing an e-commerce transaction dataset
const products = [
  { id: 1, name: "Premium Laptop", category: "electronics", price: 1200, rating: 4.8 },
  { id: 2, name: "Coffee Mug", category: "kitchen", price: 15, rating: 4.2 },
  { id: 3, name: "Smart Phone", category: "electronics", price: 800, rating: 4.6 },
  { id: 4, name: "Wireless Headphones", category: "electronics", price: 150, rating: 3.9 }
];

// Goal: Calculate the total cost of highly-rated electronics products (rating >= 4.0)
const totalCostOfTopElectronics = products
  // Step 1: Filter to keep only electronics with a rating of 4.0 or higher
  .filter(function(product) {
    return product.category === "electronics" && product.rating >= 4.0;
  })
  // Step 2: Extract just their prices
  .map(function(product) {
    return product.price;
  })
  // Step 3: Sum the prices together
  .reduce(function(total, price) {
    return total + price;
  }, 0);

console.log("Total Cost:", totalCostOfTopElectronics); // Total Cost: 2000 (1200 + 800)
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Chaining After a Method that Does Not Return an Array

**The mistake:** Attempting to call `.map()` or `.filter()` immediately after calling `.forEach()` or `.reduce()`.

**Why it's wrong:** Chaining only works if the previous method returns an object that exposes the next method. 
- `.forEach()` returns `undefined`.
- `.reduce()` typically returns a single number, string, or object.
- Mutating methods like `.push()` return a `Number` (the array length).
Trying to chain an array method after these calls throws a TypeError.

*Incorrect:*
```javascript
const numbers = [1, 2, 3];

const result = numbers
  .forEach(x => console.log(x)) // returns undefined
  .map(x => x * 2); // TypeError: Cannot read properties of undefined (reading 'map')
```

*Fix:*
```javascript
const numbers = [1, 2, 3];

// If you need to map first, map first, then use forEach at the END of the chain
numbers
  .map(x => x * 2) // returns [2, 4, 6]
  .forEach(x => console.log(x)); // Logs 2, 4, 6
```

### Mistake 2: Poor Formatting and Readability

**The mistake:** Squashing a long method chain into a single, horizontal line of code.

**Why it's wrong:** Long horizontal chains are very difficult to read, debug, and spot syntax errors (like missing parentheses).

*Incorrect:*
```javascript
const activeEmails = users.filter(u => u.active).map(u => u.email).filter(e => e.endsWith(".com"));
```

*Fix:*
```javascript
// Format each chained method on its own indented line
const activeEmails = users
  .filter(u => u.active)
  .map(u => u.email)
  .filter(e => e.endsWith(".com"));
```

---

### Mistake 3: Unhandled Asynchronous Failures in Method Chaining Operations

**The mistake:** Executing asynchronous operations within Method Chaining without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/method_chaining"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/method_chaining");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in method_chaining: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Functional Data Pipeline Chaining

**Scenario:** An analytics engine chains filter(), map(), and reduce() into a single fluent data transformation pipeline.

**Requirements:**
1. Write processSalesData(transactions).
2. Filter completed transactions.
3. Map to amount with tax.
4. Reduce to total revenue.
5. Return total.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processSalesData(transactions) {
>   if (!Array.isArray(transactions)) return 0;
>
>   return transactions
>     .filter(tx => tx.status === "COMPLETED")
>     .map(tx => tx.amount * 1.10)
>     .reduce((sum, amount) => sum + amount, 0);
> }
>
> // Verification tests
> const sales = [
>   { amount: 100, status: "COMPLETED" },
>   { amount: 50, status: "CANCELLED" },
>   { amount: 200, status: "COMPLETED" }
> ];
> const total = processSalesData(sales);
> console.assert(total === 330, "Test 1 Failed: (100+200)*1.10 = 330");
> ```
>
> #### Technical Explanation
>
> 1. **Fluent Method Chaining**: Method chaining links sequential array methods where each method returns a new array instance.
> 2. **Declarative Readability**: Expresses complex data pipelines in clean readable steps.
> 3. **Intermediate Array Allocation**: Chaining array methods creates temporary intermediate arrays in memory at each step.
---

## 6. Related Terms
- [Pure Function & Side Effects](../level_03/pure_function.md) — The building blocks of functional pipeline flows.
- [Anonymous Function](../level_03/anonymous_function.md) — Frequently written inside chains for compactness.

---

## 7. Key Takeaways
- Method chaining is the technique of invoking multiple methods sequentially in a single statement.
- Chaining is enabled because non-mutating array methods (like `.map()`, `.filter()`, `.slice()`) return new Array instances.
- Never try to chain array methods after call terminators like `.forEach()`, `.reduce()`, or mutating boundary methods like `.push()`.
- Always format chained methods on separate lines with leading dots (`.`) to maintain readability.
