# Recursion

> **Level 3 — Functions & Scope**
> A function that calls itself until a base case.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — A reusable block of code designed to perform a particular task.
- [`return` Statement](../level_03/return_statement.md) — Ends function execution and specifies a value to be returned to the caller.
- [Call Stack](../level_06/call_stack.md) — A LIFO (Last In, First Out) stack that keeps track of function calls.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, we often need to repeat a task. While standard loops (like `for` and `while`) work well for flat, linear structures (like a flat list of numbers), they become incredibly complex and messy when dealing with nested, branching structures. Examples of nested structures include directory filesystems (folders containing folders), HTML DOM trees (elements containing elements), or comment threads (replies to replies).

To solve this elegantly, JavaScript supports **Recursion**—the ability of a function to invoke itself. By breaking down a complex problem into a smaller sub-problem of the same type, a function can call itself repeatedly until it reaches a pre-defined stopping point, making code clean, logical, and easy to maintain.

### (2) Reality Metaphor
Recursion is like opening a set of Russian Nesting Dolls (Matryoshka dolls). 
- If you want to find a hidden gold coin placed in the center, you must open the outer doll.
- Inside, you find another, smaller doll. The act of opening the doll is the **recursive step**.
- You repeat this action (calling the same function) until you open the smallest possible doll which contains the coin and cannot be split open further. This final stopping doll is the **base case**.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// A simple countdown function using recursion
function countdown(number) {
  // 1. The Base Case (tells the function when to stop)
  if (number <= 0) {
    console.log("Blast off!");
    return;
  }
  
  console.log(number);
  
  // 2. The Recursive Step: calls itself with a progress-step (number - 1)
  countdown(number - 1);
}

countdown(3);
// Logs:
// 3
// 2
// 1
// Blast off!
```

#### Fuller Example
```javascript
// Traversing a nested comment replies tree (common in web applications)
const commentSection = {
  text: "Great post!",
  replies: [
    {
      text: "I agree with you.",
      replies: [
        {
          text: "Me too!",
          replies: [] // Empty replies -> Base case
        }
      ]
    },
    {
      text: "Thanks for reading!",
      replies: []
    }
  ]
};

// Recursive function to print comments and their nested replies
function printCommentTree(comment, indent = 0) {
  const spaces = " ".repeat(indent);
  console.log(`${spaces}- ${comment.text}`);
  
  // Base case check: if replies array is empty, the loop won't execute
  // and the function will return implicitly.
  for (let i = 0; i < comment.replies.length; i++) {
    // Recursive step: call printCommentTree on each reply, incrementing the indent level
    printCommentTree(comment.replies[i], indent + 2);
  }
}

printCommentTree(commentSection);
// Logs:
// - Great post!
//   - I agree with you.
//     - Me too!
//   - Thanks for reading!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Base Case (Stack Overflow)

**The mistake:** Creating a recursive function without a clear exit condition.

**Why it's wrong:** Without a base case, the function will call itself infinitely. Each call adds a new entry to the engine's Call Stack. Eventually, the browser or Node.js runtime runs out of memory, crashes, and throws a `Maximum call stack size exceeded` error (known as a "Stack Overflow").

*Incorrect:*
```javascript
function recurseForever() {
  console.log("Running...");
  recurseForever(); // No base case! Throws RangeError: Maximum call stack size exceeded
}

recurseForever();
```

*Fix:*
```javascript
let count = 0;

function recurseLimit() {
  // Clear base case
  if (count >= 5) {
    return;
  }
  console.log("Running...");
  count++;
  recurseLimit();
}

recurseLimit();
```

---

### Mistake 2: Losing Context Binding (`this`) in Recursion Callbacks

**The mistake:** Passing methods from Recursion instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "recursion",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "recursion",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Recursion Operations

**The mistake:** Executing asynchronous operations within Recursion without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/recursion"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/recursion");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in recursion: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Calculate Factorial

**Problem:** Complete the recursive function `factorial` to calculate the mathematical factorial of a number `N` (the product of all positive integers less than or equal to `N`).
Formula: `N! = N * (N - 1)!` where `1! = 1`.

```javascript
function factorial(n) {
  // Base case: if n is 1, return 1
  // Recursive step: return n multiplied by factorial of (n - 1)
}

console.log(factorial(5));
```

**Expected output:**
> [!check]- Answer
> ```text
> 120
> ```
> - The base case check is `if (n === 1) { return 1; }`.
> - The recursive step returns `n * factorial(n - 1)`.

---

### Exercise 2: Recursive Countdown with Base Case

**Problem:** Write a recursive function `countDown(n)` printing `n` down to `1`.

**Expected output:**
> [!check]- Answer
> ```text
> 3
> 2
> 1
> ```
> ```javascript
> function countDown(n) {
>   if (n <= 0) return;
>   console.log(n);
>   countDown(n - 1);
> }
> countDown(3);
> ```
>
> **Explanation:** Base cases (`n <= 0`) terminate call stack unwinding.

---

### Exercise 3: Recursive Tree Traversal

**Problem:** Recursively calculate sum of numbers in nested array `[1, [2, [3, 4]], 5]`.

**Expected output:**
> [!check]- Answer
> ```text
> 15
> ```
> ```javascript
> function sumNested(arr) {
>   return arr.reduce((acc, val) => {
>     return acc + (Array.isArray(val) ? sumNested(val) : val);
>   }, 0);
> }
> console.log(sumNested([1, [2, [3, 4]], 5]));
> ```
>
> **Explanation:** Recursion traverses nested tree/array hierarchies naturally.


---

## 7. Related Terms
- [Call Stack](../level_06/call_stack.md) — The engine's internal tracker for active function calls.
- [Higher-Order Function](../level_03/higher_order_function.md) — Functions operating on other functions.
- [`return` Statement](../level_03/return_statement.md) — The keyword used to terminate recursive execution and pass values back.

---

## 8. Key Takeaways
- Recursion is a programming technique where a function calls itself to solve nested or branching problems.
- Every recursive function must contain a **Base Case** (stopping condition) and a **Recursive Step** (call with progress towards the base case).
- If a recursive function lacks a base case or fails to reach it, it will cause a **Stack Overflow** crash (`RangeError: Maximum call stack size exceeded`).
