# Block Scope

> **Level 3 — Functions & Scope**
> Variables declared inside a `{ }` block (`let` and `const`), accessible only within that block.

---

## 1. Prerequisites
- [Scope](../level_03/scope.md) — The current context of execution.
- [`let`](../level_01/let.md) and [`const`](../level_01/const.md) — Block-scoped variable declarations.

---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Scope Leak

**Problem:** Look at this code. Will the final `console.log` throw an error or print a value? Why?
```javascript
{
  const a = 10;
  var b = 20;
}
console.log(b);
```

**Expected output:**
```text
It will print 20. 
`var` ignores the `{}` block and leaks into the global scope. `const a` is safely destroyed.
```

> [!check]- Answer
> - `var` is function-scoped, not block-scoped.
> - Standalone `{}` still create a block scope for `let` and `const`.

---

### Exercise 2: Block Scoped Loop Iteration

**Problem:** Demonstrate that `let i` inside a `for` loop is inaccessible after the loop finishes.

**Expected output:**
```text
ReferenceError caught
```

> [!check]- Answer
> ```javascript
> for (let i = 0; i < 3; i++) {}
> try {
>   console.log(i);
> } catch (err) {
>   console.log("ReferenceError caught");
> }
> ```
>
> **Explanation:** `let` variables bound to loop blocks are destroyed upon loop exit.

### Exercise 3: Standalone Block Scoping (`{ ... }`)

**Problem:** Use a standalone `{ const secret = 123; }` block to isolate temporary variables.

**Expected output:**
```text
Block isolation verified
```

> [!check]- Answer
> ```javascript
> {
>   const secret = 123;
> }
> console.log("Block isolation verified");
> ```
>
> **Explanation:** Standalone curly braces `{}` create isolated block scopes for variable encapsulation.

---

---

## 7. Related Terms
- [`var`](../level_01/var.md) — The legacy variable declaration that ignores Block Scope.
- [Local / Function Scope](../level_03/local_scope.md) — Scope restricted to a full function.

---

## 8. Key Takeaways
- Any set of curly braces `{}` creates a Block Scope.
- `let` and `const` respect Block Scope. They die when the block ends.
- `if` statements, `for` loops, and `while` loops all create Block Scopes.
- `var` ignores Block Scope entirely.
