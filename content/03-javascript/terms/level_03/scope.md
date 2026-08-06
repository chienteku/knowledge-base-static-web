# Scope

> **Level 3 — Functions & Scope**
> The current context of execution in which values and expressions are visible or can be referenced.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Function](function.md) — A reusable block of code.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If every variable you ever created in a massive application was visible to every single line of code, the system would collapse in chaos. Two developers might accidentally use the same variable name (`let count = 0`), and their code would overwrite each other, causing impossible-to-track bugs.

"Scope" is the set of rules the JavaScript engine uses to determine where a specific variable lives, and who is allowed to look at it. By restricting visibility, Scope protects variables from being accidentally modified by unrelated parts of the program, a concept known as "Encapsulation" or "Principle of Least Privilege".

### (2) Reality Metaphor
Think of Scope like security clearances in an office building.
- **Global Scope** is the public lobby. Anyone in the building can see what's happening in the lobby.
- **Function/Local Scope** is a private meeting room. If you are inside the room, you can see what's on the whiteboard. If you are out in the hallway, the door is locked, and you cannot see the whiteboard. However, people inside the room can still look out the window into the public lobby.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const globalVar = "I am in the lobby";

function myRoom() {
  const localVar = "I am inside the locked room";
  
  // Functions can look OUTWARDS into the global scope
  console.log(globalVar); // Works!
}

myRoom();

// The global scope cannot look INWARDS to the function scope
// console.log(localVar); // ReferenceError: localVar is not defined
```

#### Fuller Example
```javascript
// Lexical Scope (Scope Chain)
const outer = "Outer";

function levelOne() {
  const innerOne = "Inner 1";
  
  function levelTwo() {
    const innerTwo = "Inner 2";
    
    // levelTwo can see its own variables, levelOne's variables, and global variables!
    console.log(`${outer} -> ${innerOne} -> ${innerTwo}`);
  }
  
  levelTwo();
  // levelOne CANNOT see innerTwo
}

levelOne();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Scope Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Scope blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "scope";
```

*Fix:*
```javascript
let value = "scope";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Scope Callbacks

**The mistake:** Passing methods from Scope instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "scope",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "scope",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Scope Operations

**The mistake:** Executing asynchronous operations within Scope without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/scope"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/scope");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in scope: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Scope Prediction

**Problem:** Read the following code. What will the final `console.log` print?
```javascript
let score = 10;
function play() {
  let score = 50;
}
play();
console.log(score);
```

**Expected output:**
> [!check]- Answer
> ```text
> 10
> (Because the function declared its own local 'score' and didn't touch the global one)
> ```
> - `let` inside the function creates a brand new variable that dies when the function finishes.
> 
---

### Exercise 2: Scope Chain Lookup Order

**Problem:** Explain how JS engine searches local scope, outer enclosing scopes, and global scope in order.

**Expected output:**
> [!check]- Answer
> ```text
> Local -> Outer -> Global
> ```
> ```javascript
> console.log("Local -> Outer -> Global");
> ```
>
> **Explanation:** Identifiers resolve by searching from inner scopes upward through parent lexical scope frames.
> 
---

### Exercise 3: Scope Isolation Verification

**Problem:** Verify that variables inside `function A()` are inaccessible from sibling `function B()`.

**Expected output:**
> [!check]- Answer
> ```text
> Sibling scope isolated
> ```
> function A() { const a = 1; }
> function B() {
>   try { console.log(a); } catch (err) { console.log("Sibling scope isolated"); }
> }
> B();
> ```
>
> **Explanation:** Sibling function scopes do not share identifier environments.
> 
> 
---

## 7. Related Terms
- [Global Scope](global_scope.md) — The outermost scope.
- [Local / Function Scope](local_scope.md) — Scope restricted to a function.
- [Block Scope](block_scope.md) — Scope restricted to `{ }` brackets (for `let` and `const`).
- [Closure](closure.md) — Related concept: Closure.
- [Modules (import/export)](../level_08/modules.md) — Related concept: Modules (import/export).
- [IIFE](../level_09/iife.md) — Related concept: IIFE.

---

## 8. Key Takeaways
- Scope dictates where variables are accessible.
- Scope works from the inside out: inner scopes can access variables in outer scopes, but outer scopes cannot look into inner scopes.
- Declaring a variable inside a function with the same name as a global variable "shadows" the global variable.
