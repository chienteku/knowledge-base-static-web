# Recursion

> **Level 3 — Functions & Scope**
> A function that calls itself until a base case.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code designed to perform a particular task.
- [return Statement](return_statement.md) — Ends function execution and specifies a value to be returned to the caller.
- [Call Stack](../level_06/call_stack.md) — A LIFO (Last In, First Out) stack that keeps track of function calls.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Recursion is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: File System Directory Tree Hierarchy Traverser

**Scenario:** A file system walker recursively traverses nested directory tree objects, accumulating all file path strings into a flat array.

**Requirements:**
1. Write collectFilePaths(node).
2. If node.type === "file", return [node.path].
3. If node.type === "directory", recursively traverse node.children.
4. Return flat array of file paths.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function collectFilePaths(node) {
>   if (!node) return [];
>   if (node.type === "file") {
>     return [node.path];
>   }
>
>   let paths = [];
>   if (node.type === "directory" && Array.isArray(node.children)) {
>     for (const child of node.children) {
>       paths = paths.concat(collectFilePaths(child));
>     }
>   }
>   return paths;
> }
>
> // Verification tests
> const tree = {
>   type: "directory",
>   path: "/root",
>   children: [
>     { type: "file", path: "/root/file1.txt" },
>     {
>       type: "directory",
>       path: "/root/sub",
>       children: [
>         { type: "file", path: "/root/sub/file2.txt" }
>       ]
>     }
>   ]
> };
> const files = collectFilePaths(tree);
> console.assert(files.length === 2, "Test 1 Failed");
> console.assert(files.includes("/root/sub/file2.txt"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Recursion Definition**: Recursion is a programming technique where a function calls itself to solve smaller sub-problems.
> 2. **Base Case**: The base case (e.g. node.type === 'file') halts recursive execution, preventing infinite call stack overflow.
> 3. **Recursive Step**: The recursive step decomposes complex nested structures into simpler sub-tree invocations.
> 
---

### Exercise 2: Recursive Deep Clone Engine

**Scenario:** A utility package implements a recursive deep cloning function that creates deep copies of objects and arrays without mutating source objects.

**Requirements:**
1. Write deepClone(val).
2. Handle primitive base cases.
3. Recursively clone object properties and array elements.
4. Return deep copy.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function deepClone(val) {
>   if (val === null || typeof val !== "object") {
>     return val;
>   }
>
>   if (Array.isArray(val)) {
>     return val.map(item => deepClone(item));
>   }
>
>   const copy = {};
>   for (const key of Object.keys(val)) {
>     copy[key] = deepClone(val[key]);
>   }
>   return copy;
> }
>
> // Verification tests
> const originalObj = { a: 1, nested: { b: 2 } };
> const clonedObj = deepClone(originalObj);
> clonedObj.nested.b = 99;
>
> console.assert(originalObj.nested.b === 2, "Test 1 Failed");
> console.assert(clonedObj.nested.b === 99, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Deep Tree Traversal**: Recursion traverses arbitrarily deep nested object hierarchies.
> 2. **Call Stack Execution**: Each recursive call pushes a new execution stack frame onto the call stack.
> 3. **Stack Overflow Guarding**: Deeply nested recursive calls must manage call stack limits.
> 
---

### Exercise 3: Algorithmic Binary Search Recursive Implementation

**Scenario:** An algorithmic sorting package performs recursive binary search on a sorted array of numbers.

**Requirements:**
1. Write recursiveBinarySearch(arr, target, low, high).
2. Check base case low > high (return -1).
3. Calculate mid index.
4. Recursively search left or right half.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function recursiveBinarySearch(arr, target, low = 0, high = arr.length - 1) {
>   if (low > high) return -1;
>
>   const mid = Math.floor((low + high) / 2);
>   if (arr[mid] === target) return mid;
>
>   if (arr[mid] > target) {
>     return recursiveBinarySearch(arr, target, low, mid - 1);
>   } else {
>     return recursiveBinarySearch(arr, target, mid + 1, high);
>   }
> }
>
> // Verification tests
> const sortedNums = [10, 20, 30, 40, 50];
> console.assert(recursiveBinarySearch(sortedNums, 30) === 2, "Test 1 Failed");
> console.assert(recursiveBinarySearch(sortedNums, 99) === -1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Divide-and-Conquer**: Binary search recursively divides the search space in half (O(log n) complexity).
> 2. **Terminal Base Cases**: Check low > high and arr[mid] === target to guarantee loop termination.
> 3. **Tail Recursion Note**: Engine tail call optimization (TCO) allows certain tail-recursive calls to reuse stack frames.
---

## 6. Related Terms
- [Call Stack](../level_06/call_stack.md) — The engine's internal tracker for active function calls.
- [Higher-Order Function](higher_order_function.md) — Functions operating on other functions.
- [return Statement](return_statement.md) — The keyword used to terminate recursive execution and pass values back.

---

## 7. Key Takeaways
- Recursion is a programming technique where a function calls itself to solve nested or branching problems.
- Every recursive function must contain a **Base Case** (stopping condition) and a **Recursive Step** (call with progress towards the base case).
- If a recursive function lacks a base case or fails to reach it, it will cause a **Stack Overflow** crash (`RangeError: Maximum call stack size exceeded`).
