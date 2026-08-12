# Block Scope

> **Level 3 — Functions & Scope**
> Variables declared inside a `{ }` block (`let` and `const`), accessible only within that block.

---

## 1. Prerequisites
- [Scope](scope.md) — The current context of execution.
- [let](../level_01/let.md) — 

---

## 2. Term Category

**Language Core *(Introduced in ES6)* (Universal: Works everywhere)**: Block Scope is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
For the first 20 years of JavaScript's existence, the only way to create a local scope was to create a Function. `if` statements and `for` loops did NOT create their own scopes. If you used the `var` keyword inside an `if` block, that variable "leaked" out into the rest of the function. This caused a massive amount of confusing bugs, especially with loops where the iterator variable (`var i`) kept surviving after the loop finished.

In ES6 (2015), JavaScript introduced `let` and `const`. Unlike `var`, these new keywords respect "Block Scope". A block is simply any code surrounded by curly braces `{}`. If you declare a `let` or `const` inside `{...}`, it is trapped inside those braces and dies as soon as the closing brace `}` is reached.

### (2) Reality Metaphor
If Function Scope is a private meeting room, Block Scope is a whispered conversation inside a small phone booth located *within* that meeting room. As soon as you step out of the phone booth, the conversation is over and nobody else in the room heard it.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
if (true) {
  // The {} create a block scope
  const secret = "I am hidden";
  let count = 5;
}

// Neither of these exist out here!
// console.log(secret); // ReferenceError
// console.log(count);  // ReferenceError
```

#### Fuller Example
```javascript
function evaluateGame(score) {
  // 'status' is function-scoped. Available everywhere in this function.
  let status = "Playing";
  
  if (score > 100) {
    // This 'bonus' variable is BLOCK-scoped. 
    // It only exists inside this `if` block!
    const bonus = 50; 
    status = "Winner";
    console.log(`You won with a bonus of ${bonus}!`);
  }
  
  // This will crash if uncommented, because 'bonus' died at the end of the `if` block.
  // console.log(`Final bonus: ${bonus}`); 
  
  return status;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `var` and expecting block scope

**The mistake:** Assuming that `var` behaves like `let` and `const` inside blocks.

**Why it's wrong:** `var` completely ignores Block Scope. It only cares about Function Scope. If you use `var` inside an `if` block or a `for` loop, it will leak out into the surrounding function or global scope.

*Incorrect:*
```javascript
for (var i = 0; i < 3; i++) {
  // looping...
}
// 'i' leaked out of the block!
console.log(i); // Outputs: 3
```

*Fix:*
```javascript
// Always use let/const in modern JS
for (let i = 0; i < 3; i++) {
  // looping...
}
// 'i' properly dies at the end of the block
// console.log(i); // ReferenceError (Good!)
```

---

### Mistake 2: Losing Context Binding (`this`) in Block Scope Callbacks

**The mistake:** Passing methods from Block Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "block_scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "block_scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Block Scope Operations

**The mistake:** Executing asynchronous operations within Block Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/block_scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/block_scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in block_scope: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Temporary Processing Buffer Scope Isolation

**Scenario:** A high-throughput parser isolates temporary calculation buffers within a block scope {} using let and const to prevent memory leakage to outer scopes.

**Requirements:**
1. Write processLargeData(rawData).
2. Create block scope {} containing temporary let buffer variables.
3. Ensure temporary variables are inaccessible outside block scope.
4. Return processed result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processLargeData(rawData) {
>   let finalResult = 0;
>
>   {
>     // Block-scoped isolation
>     const tempBuffer = rawData.map(x => x * 2);
>     const tempSum = tempBuffer.reduce((acc, v) => acc + v, 0);
>     finalResult = tempSum;
>   }
>
>   let isLeaked = false;
>   try {
>     // @ts-ignore
>     console.log(tempBuffer);
>   } catch (err) {
>     isLeaked = false;
>   }
>
>   return { finalResult, isLeaked };
> }
>
> // Verification tests
> const res = processLargeData([10, 20]);
> console.assert(res.finalResult === 60, "Test 1 Failed");
> console.assert(res.isLeaked === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Block Scope Definition**: A block scope is established by any pair of curly braces {} containing let or const declarations.
> 2. **Variable Lifetime**: Variables declared with let and const inside a block are created upon block entry and garbage-collected upon exit.
> 3. **Contrast with var**: Variables declared with var ignore block boundaries {} and leak into enclosing function or global scopes.
> 
---

### Exercise 2: Loop Iteration Lexical Binding Isolation

**Scenario:** A batch scheduler creates asynchronous timer callbacks inside a for loop. Block-scoped let creates a fresh binding for each loop iteration.

**Requirements:**
1. Write scheduleBatchTasks(count).
2. Iterate using for (let i = 0; i < count; i++).
3. Push callbacks returning i.
4. Verify each callback receives unique iteration index.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function scheduleBatchTasks(count) {
>   const callbacks = [];
>
>   for (let i = 0; i < count; i++) {
>     callbacks.push(() => i);
>   }
>
>   return callbacks.map(fn => fn());
> }
>
> // Verification tests
> const indices = scheduleBatchTasks(3);
> console.assert(indices.join(",") === "0,1,2", "Test 1 Failed: Block scoped let failed");
> ```
>
> #### Technical Explanation
>
> 1. **Per-Iteration Scope**: In for (let i = 0; ...) loops, a fresh block-scoped variable binding is instantiated per iteration.
> 2. **Closure Isolation**: Callbacks created inside the loop close over the per-iteration let binding rather than a single shared reference.
> 3. **Temporal Dead Zone**: Block-scoped variables remain inaccessible prior to their declaration line within the block.
> 
---

### Exercise 3: Switch Case Statement Block Scoping

**Scenario:** A state reducer wraps switch cases in explicit block scopes {} to declare local const variables without naming collision syntax errors across cases.

**Requirements:**
1. Write dispatchAction(state, action).
2. Wrap case blocks in {} braces.
3. Declare const payload inside each case block.
4. Return updated state.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function dispatchAction(state, action) {
>   switch (action.type) {
>     case "SET_NAME": {
>       const payload = action.payload.trim();
>       return { ...state, name: payload };
>     }
>     case "SET_AGE": {
>       const payload = Number(action.payload);
>       return { ...state, age: payload };
>     }
>     default:
>       return state;
>   }
> }
>
> // Verification tests
> const s1 = dispatchAction({}, { type: "SET_NAME", payload: " Alice " });
> console.assert(s1.name === "Alice", "Test 1 Failed");
> const s2 = dispatchAction(s1, { type: "SET_AGE", payload: "30" });
> console.assert(s2.age === 30, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Switch Case Scoping**: By default, a switch statement shares one single block scope across all cases; adding {} creates distinct per-case scopes.
> 2. **Preventing Naming Collisions**: Enclosing cases in {} allows re-using variable names like const payload across cases.
> 3. **Lexical Enclosure**: Guarantees case variables do not leak to other switch cases.
---

## 6. Related Terms
- [var](../level_01/var.md) — The legacy variable declaration that ignores Block Scope.
- [Local / Function Scope](local_scope.md) — Scope restricted to a full function.
- [Scope](scope.md) — Related concept: Scope.
- [let](../level_01/let.md) — Related concept: let.

---

## 7. Key Takeaways
- Any set of curly braces `{}` creates a Block Scope.
- `let` and `const` respect Block Scope. They die when the block ends.
- `if` statements, `for` loops, and `while` loops all create Block Scopes.
- `var` ignores Block Scope entirely.
