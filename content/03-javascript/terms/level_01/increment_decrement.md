# Increment / Decrement (++ / --)

> **Level 1 — Foundations**
> Add/subtract one; prefix vs postfix.

---

## 1. Prerequisites
- [Number](number.md) — Represents both integer and floating-point numbers.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Increment / Decrement (++ / --) is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, loops and iteration are fundamental. We frequently need to increment or decrement a counter by exactly `1` (e.g., `count = count + 1` or `count += 1`). To make this extremely common operation concise, JavaScript inherited the increment (`++`) and decrement (`--`) operators from languages like C and Java. 

These operators can be placed *before* the variable (**prefix**) or *after* the variable (**postfix**). While they both change the value of the variable by 1, they return different values during expression evaluation, providing fine-grained control when managing loops.

### (2) Reality Metaphor
The increment operator is like a manual tally clicker (like the ones bouncers use to count people entering a club). Every click increments the total by 1. 

- **Postfix (`x++`)** is like reading the counter screen first, and then pressing the clicker.
- **Prefix (`++x`)** is like pressing the clicker first, and then reading the new count on the screen.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let count = 5;

// Postfix increment
console.log(count++); // Logs 5 (evaluates first, then adds 1)
console.log(count);   // Logs 6

// Prefix increment
console.log(++count); // Logs 7 (adds 1 first, then evaluates)
console.log(count);   // Logs 7
```

#### Fuller Example
```javascript
// Managing a loop count and list indexing demonstrating postfix increment
const shoppingList = ["Apples", "Bananas", "Cherries"];
let index = 0;

// The postfix pattern is commonly used in access-then-increment logic
console.log("Item:", shoppingList[index++]); // Item: Apples (reads index 0, index becomes 1)
console.log("Item:", shoppingList[index++]); // Item: Bananas (reads index 1, index becomes 2)
console.log("Item:", shoppingList[index++]); // Item: Cherries (reads index 2, index becomes 3)

// Managing inventory stock count with prefix decrement
let widgetsInStock = 3;

function purchaseWidget() {
  if (widgetsInStock > 0) {
    // Decrement stock and inform the user of remaining items
    console.log(`Purchase successful! Items left: ${--widgetsInStock}`);
  } else {
    console.log("Out of stock!");
  }
}

purchaseWidget(); // Purchase successful! Items left: 2
purchaseWidget(); // Purchase successful! Items left: 1
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Increment Values directly (Literals)

**The mistake:** Placing the `++` or `--` operator directly on a numeric literal instead of a variable.

**Why it's wrong:** The increment and decrement operators perform a reassignment under the hood. For example, `x++` means `x = x + 1`. A number literal (like `5`) is not a container and cannot have its value reassigned. This results in a SyntaxError.

*Incorrect:*
```javascript
console.log(5++); // SyntaxError: Invalid left-hand side expression in postfix operation
```

*Fix:*
```javascript
let num = 5;
num++; // Correctly modifies the variable 'num'
console.log(num); // 6
```

### Mistake 2: Mixing Prefix and Postfix in Complex Statements

**The mistake:** Using `++` inside a math formula or comparison where the execution order affects the final result, making it difficult to read and debug.

**Why it's wrong:** Relying on the evaluation side-effects of prefix/postfix makes code hard to understand for others. It is better to write the increment on a separate line.

*Incorrect:*
```javascript
let total = 10;
let multiplier = 2;
let result = total++ * ++multiplier; // Confusing and error-prone!
```

*Fix:*
```javascript
let total = 10;
let multiplier = 2;

// Keep calculations clean and readable on separate lines
multiplier += 1;
let result = total * multiplier;
total += 1;
```

---

### Mistake 3: Unhandled Asynchronous Failures in Increment Decrement Operations

**The mistake:** Executing asynchronous operations within Increment Decrement without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/increment_decrement"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/increment_decrement");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in increment_decrement: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: API Rate Limiter Counter

**Scenario:** An API gateway tracks request volume using increment (++) and decrement (--) operators to maintain active request counts and remaining quota limits.

**Requirements:**
1. Write a RateLimiter object with requestCount and remainingQuota.
2. Use prefix increment ++requestCount when logging new requests.
3. Use postfix decrement remainingQuota-- when consuming quota.
4. Verify difference between prefix and postfix return values.

> [!check]- Answer
> #### Implementation
> ```javascript
> function createRateLimiter(initialQuota) {
>   let requestCount = 0;
>   let remainingQuota = initialQuota;
> return {
>     processRequest() {
>       const currentCount = ++requestCount;
>       const quotaBeforeUse = remainingQuota--;
>       return { currentCount, quotaBeforeUse, remainingQuota };
>     }
>   };
> }
> // Verification tests
> const limiter = createRateLimiter(10);
> const step1 = limiter.processRequest();
> console.assert(step1.currentCount === 1, "Test 1 Failed: Prefix ++ should return 1");
> console.assert(step1.quotaBeforeUse === 10, "Test 2 Failed: Postfix -- should return 10");
> console.assert(step1.remainingQuota === 9, "Test 3 Failed: Remaining quota should be 9");
> ```
> #### Technical Explanation
> 1. **Prefix Operator (++x / --x)**: Increments or decrements the operand variable first, then evaluates to the new updated value.
> 2. **Postfix Operator (x++ / x--)**: Evaluates to the original value first, then increments or decrements the operand variable as a side effect.
> 3. **Variable Mutation**: Increment and decrement operators modify the underlying variable binding in place.
> 
---

### Exercise 2: UI Pagination Cursor Navigator

**Scenario:** A UI data table controller manages page navigation. It increments or decrements the current page index pointer while enforcing upper and lower page bounds.

**Requirements:**
1. Write navigatePage(currentPage, direction, totalPages).
2. If direction is "next", increment page index if below totalPages.
3. If direction is "prev", decrement page index if above 1.
4. Return updated page number.

> [!check]- Answer
> #### Implementation
> ```javascript
> function navigatePage(currentPage, direction, totalPages) {
>   let page = currentPage;
> if (direction === "next" && page < totalPages) {
>     page++;
>   } else if (direction === "prev" && page > 1) {
>     page--;
>   }
> return page;
> }
> // Verification tests
> console.assert(navigatePage(1, "next", 5) === 2, "Test 1 Failed");
> console.assert(navigatePage(2, "prev", 5) === 1, "Test 2 Failed");
> console.assert(navigatePage(1, "prev", 5) === 1, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Step Mutation**: page++ and page-- provide clean shorthand for page = page + 1 and page = page - 1.
> 2. **Boundary Guards**: Enclosing increment/decrement inside boundary checks prevents state corruption.
> 3. **Operand Coercion**: Increment/decrement operators implicitly convert non-numeric operands to numbers before operating.
> 
---

### Exercise 3: Circular Ring Buffer Pointer

**Scenario:** An audio stream processor updates write head pointers in a fixed-capacity ring buffer using postfix increment and modulo arithmetic.

**Requirements:**
1. Write a function advanceWritePointer(currentPointer, bufferCapacity).
2. Increment the pointer.
3. Wrap the pointer around to 0 when reaching bufferCapacity.
4. Return updated pointer index.

> [!check]- Answer
> #### Implementation
> ```javascript
> function advanceWritePointer(currentPointer, bufferCapacity) {
>   let ptr = currentPointer;
>   ptr++;
>   ptr %= bufferCapacity;
>   return ptr;
> }
> // Verification tests
> console.assert(advanceWritePointer(0, 4) === 1, "Test 1 Failed");
> console.assert(advanceWritePointer(3, 4) === 0, "Test 2 Failed: Wrap around failed");
> ```
> #### Technical Explanation
> 1. **Sequential Mutation**: Increments mutate the variable state before subsequent modulo expressions evaluate.
> 2. **Side-Effect Awareness**: Avoid embedding ++ inside complex mathematical expressions to maintain code clarity.
> 3. **Statement Simplicity**: Isolating increment operations on dedicated lines avoids prefix/postfix confusion.
---

## 6. Related Terms
- [Arithmetic Operators](arithmetic_operators.md) — General mathematical operators.
- [Assignment Operators](assignment_operators.md) — Shorthand operators to update variable values.
- [for Loop](../level_02/for_loop.md) — Repetitive execution blocks that typically rely on increment counters.

---

## 7. Key Takeaways
- The increment (`++`) and decrement (`--`) operators increase or decrease a variable's value by 1.
- Postfix (`x++`) returns the value *before* changing it.
- Prefix (`++x`) returns the value *after* changing it.
- These operators can only be used on references (variables/object properties), not directly on raw numbers.
