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
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Format Premium Products

**Problem:** Complete the code to filter the list of numbers, keep only values greater than `50`, multiply them by `1.1` (adding 10% tax), and format them to strings prefixing `$` (e.g. `"$55.00"`).

```javascript
const prices = [20, 60, 45, 80];

const formattedPrices = prices
  // Filter > 50
  // Map multiply by 1.1 and format with toFixed(2) and prefix "$"
  
console.log(formattedPrices);
```

**Expected output:**
> [!check]- Answer
> ```text
> [ '$66.00', '$88.00' ]
> ```
> - In step 1: `.filter(p => p > 50)`
> - In step 2: `.map(p => "$" + (p * 1.1).toFixed(2))`

---

### Exercise 2: Fluent Processing Pipeline

**Problem:** Filter `[1, 2, 3, 4, 5, 6]` for even numbers, double them with `.map()`, and sum with `.reduce()`.

**Expected output:**
> [!check]- Answer
> ```text
> 24
> ```
> ```javascript
> const result = [1, 2, 3, 4, 5, 6]
>   .filter(x => x % 2 === 0)
>   .map(x => x * 2)
>   .reduce((sum, x) => sum + x, 0);
> console.log(result);
> ```
>
> **Explanation:** Method chaining passes intermediate transformed collections down functional pipelines.

---

### Exercise 3: Chaining Custom Object Builders

**Problem:** Create a fluent builder object `Calc` supporting `.add(5).sub(2).val()`.

**Expected output:**
> [!check]- Answer
> ```text
> 3
> ```
> ```javascript
> const Calc = {
>   num: 0,
>   add(n) { this.num += n; return this; },
>   sub(n) { this.num -= n; return this; },
>   val() { return this.num; }
> };
> console.log(Calc.add(5).sub(2).val());
> ```
>
> **Explanation:** Returning `this` from object methods enables fluent chaining.

---

## 7. Related Terms
- [Pure Function & Side Effects](../level_03/pure_function.md) — The building blocks of functional pipeline flows.
- [Anonymous Function](../level_03/anonymous_function.md) — Frequently written inside chains for compactness.
---

## 8. Key Takeaways
- Method chaining is the technique of invoking multiple methods sequentially in a single statement.
- Chaining is enabled because non-mutating array methods (like `.map()`, `.filter()`, `.slice()`) return new Array instances.
- Never try to chain array methods after call terminators like `.forEach()`, `.reduce()`, or mutating boundary methods like `.push()`.
- Always format chained methods on separate lines with leading dots (`.`) to maintain readability.
