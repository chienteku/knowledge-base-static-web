# Local / Function Scope

> **Level 3 — Functions & Scope**
> Variables declared within a function, accessible only inside that function.

---

## 1. Prerequisites
- [Scope](scope.md) — The current context of execution.
- [Function](function.md) — A reusable block of code.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Local / Function Scope is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If all variables lived in the Global Scope, functions wouldn't be able to safely do their jobs without accidentally overwriting data from other parts of the application. 

Local Scope (specifically Function Scope in older JavaScript) was designed as a "sandbox" for a function. When a function starts executing, it creates a temporary bubble of memory. Any variables declared inside that bubble belong *only* to that function. When the function finishes its job and returns, the bubble bursts, and all those local variables are destroyed to free up memory (Garbage Collection).

### (2) Reality Metaphor
If a function is a private meeting room in an office building, Local Scope represents the notes written on the whiteboard inside that room. Only the people actively sitting inside the room can read or modify those notes. Once the meeting ends and everyone leaves, the janitor wipes the whiteboard clean, completely destroying the information.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function greet() {
  // 'message' is trapped inside this function's Local Scope
  const message = "Hello from the inside!";
  console.log(message);
}

greet();

// Trying to access it from the outside will crash the program
// console.log(message); // ReferenceError: message is not defined
```

#### Fuller Example
```javascript
const globalCount = 100;

function performCalculation() {
  // Local variables can share names with global variables (Shadowing)
  // Or they can be completely unique.
  const localCount = 5;
  const tempMultiplier = 2;
  
  // Functions can look OUT into the global scope
  const result = (globalCount + localCount) * tempMultiplier;
  
  return result;
}

const finalAnswer = performCalculation();
console.log(finalAnswer); // 210

// None of the temporary variables exist out here!
// console.log(localCount); // ReferenceError
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Local Scope Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Local Scope blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "local_scope";
```

*Fix:*
```javascript
let value = "local_scope";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Local Scope Callbacks

**The mistake:** Passing methods from Local Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "local_scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "local_scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Local Scope Operations

**The mistake:** Executing asynchronous operations within Local Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/local_scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/local_scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in local_scope: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Function Local Variable Isolation & Garbage Collection

**Scenario:** A high-performance memory allocator processes temporary data within a function local scope, ensuring local variables are garbage-collected upon function return.

**Requirements:**
1. Write processLocalBuffer(data).
2. Declare local const buffer variables.
3. Verify local variables are not accessible outside function scope.
4. Return calculation summary.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processLocalBuffer(data) {
>   const localBuffer = [...data];
>   const localSum = localBuffer.reduce((acc, v) => acc + v, 0);
>   return localSum;
> }
>
> // Verification tests
> const sum = processLocalBuffer([10, 20, 30]);
> console.assert(sum === 60, "Test 1 Failed");
> // @ts-ignore
> console.assert(typeof localBuffer === "undefined", "Test 2 Failed: Local scope leaked");
> ```
>
> #### Technical Explanation
>
> 1. **Local Scope Definition**: Local scope refers to variables declared inside a specific function or block context.
> 2. **Lifetime & Memory Cleanup**: Local variables are instantiated on call stack frames and reclaimed by garbage collection when execution exits.
> 3. **Encapsulation**: Prevents local variables from interfering with or polluting outer application scopes.
> 
---

### Exercise 2: Parameter Local Scope Protection against Global Leakage

**Scenario:** A security validation module verifies that function parameters act as local scope variables, preventing parameter names from modifying global scope variables.

**Requirements:**
1. Declare global variable let targetUser = "GLOBAL_USER".
2. Write function validateUser(targetUser) that modifies local targetUser parameter.
3. Verify global targetUser remains unchanged.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> let globalUser = "GLOBAL_USER";
>
> function updateLocalUser(globalUser) {
>   globalUser = "LOCAL_MODIFIED";
>   return globalUser;
> }
>
> // Verification tests
> const localRes = updateLocalUser("INPUT_USER");
> console.assert(localRes === "LOCAL_MODIFIED", "Test 1 Failed");
> console.assert(globalUser === "GLOBAL_USER", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Parameter Local Binding**: Function parameters automatically instantiate local scope variable bindings upon function entry.
> 2. **Shadowing Protection**: Local parameters shadow outer variables of the same name, protecting global variables from accidental mutation.
> 3. **Call Stack Frame Storage**: Local parameters exist strictly within the invocation's execution stack frame.
> 
---

### Exercise 3: Nested Function Local Scope Boundary Inspection

**Scenario:** A utility package demonstrates that nested functions establish distinct, isolated local scopes for their internal helper variables.

**Requirements:**
1. Write parentFunction().
2. Include childFunction() with local variables.
3. Verify child local variables are inaccessible to parentFunction.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parentFunction() {
>   const parentLocal = "PARENT";
>
>   function childFunction() {
>     const childLocal = "CHILD";
>     return parentLocal + ":" + childLocal;
>   }
>
>   const childResult = childFunction();
>
>   let isChildLeaked = false;
>   try {
>     // @ts-ignore
>     console.log(childLocal);
>   } catch (err) {
>     isChildLeaked = false;
>   }
>
>   return { childResult, isChildLeaked };
> }
>
> // Verification tests
> const res = parentFunction();
> console.assert(res.childResult === "PARENT:CHILD", "Test 1 Failed");
> console.assert(res.isChildLeaked === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Nested Local Scopes**: Every function invocation instantiates a distinct local scope environment.
> 2. **One-Way Visibility**: Inner scopes can access outer local scope variables, but outer scopes CANNOT access inner local variables.
> 3. **Stack Isolation**: Prevents inner helper variable collisions with outer calling logic.
---

## 6. Related Terms
- [Scope](scope.md) — The general concept of variable visibility.
- [Global Scope](global_scope.md) — The outermost scope.
- [Block Scope](block_scope.md) — Related concept: Block Scope.

---

## 7. Key Takeaways
- Variables declared inside a function are in the Local Scope.
- Local variables cannot be accessed from outside the function.
- Local variables are created when the function starts and destroyed when the function finishes.
- Function parameters are automatically treated as local variables.
