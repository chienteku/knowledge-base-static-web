# Generator (function*)

> **Level 9 — Advanced Concepts & Patterns**
> Functions that can be paused and later resumed, yielding multiple values one by one (`yield`).

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The base concept.
- [Object](../level_02/object.md) — What a generator returns.

---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normal JavaScript functions have "Run-to-Completion" semantics. Once you call a function, it runs all its code top-to-bottom and returns a single value. You cannot pause it halfway through.
But what if you wanted a function to generate an infinite sequence of IDs, or read a massive 10GB file one line at a time? If a normal function tried to return 10 billion IDs, it would crash the computer's memory.

ES6 introduced **Generators**. By adding an asterisk to the function keyword (`function*`), you create a function that can be paused! Inside the generator, you use the `yield` keyword instead of `return`. When the function hits `yield`, it spits out a value and literally freezes in time. The program can do other things. Whenever you are ready, you ask the generator to resume, and it continues from exactly where it left off!

### (2) Reality Metaphor
A normal function is like a vending machine where you press a button and a single soda falls out. The transaction is over.
A Generator is like an assembly line worker. You walk up and say "Give me a part." They hand you one part (`yield`), and then they pause, waiting for you. You go build a car, come back three days later, and say "Next." They instantly hand you the very next part in the sequence. 

### (3) JavaScript Code Examples

#### Short Snippet: Pausing and Resuming
```javascript
// 1. Define the generator using the asterisk
function* numberGenerator() {
  yield 1; // Pause and spit out 1
  yield 2; // Pause and spit out 2
  yield 3; // Pause and spit out 3
}

// 2. Calling it doesn't run the code! It returns a "Generator Object"
const gen = numberGenerator();

// 3. You must call .next() to unpause it!
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3
console.log(gen.next().value); // undefined (The generator is finished)
```

#### Fuller Example: Infinite Sequences
```javascript
// A generator that creates unique IDs infinitely without crashing memory!
function* idMaker() {
  let id = 0;
  // A true infinite loop!
  while (true) {
    // It increments the ID, yields it, and PAUSES. 
    // The infinite loop is frozen until we ask for the next one.
    yield id++; 
  }
}

const myIDs = idMaker();

console.log(myIDs.next().value); // 0
console.log(myIDs.next().value); // 1

// We can go do other things...
console.log("Doing other work...");

// Come back later, and it picks right back up!
console.log(myIDs.next().value); // 2
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Generator Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Generator blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "generator";
```

*Fix:*
```javascript
let value = "generator";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Generator Callbacks

**The mistake:** Passing methods from Generator instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "generator",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "generator",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Generator Operations

**The mistake:** Executing asynchronous operations within Generator without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/generator"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/generator");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in generator: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The `.next()` object

**Problem:** When you call `gen.next()`, it doesn't just return the number. It returns an object. What two properties does that object contain?

**Expected output:**
```javascript
{ value: "the yielded data", done: false }
// 'done' becomes true when the generator has finished running.
```

> [!check]- Answer
> - We accessed `.value` in the examples above!

---

### Exercise 2: Infinite ID Generator

**Problem:** Create a generator `function* idGen()` producing auto-incrementing IDs `1, 2, 3...`.

**Expected output:**
```text
1
2
```

> [!check]- Answer
> ```javascript
> function* idGen() {
>   let id = 1;
>   while (true) yield id++;
> }
> const gen = idGen();
> console.log(gen.next().value);
> console.log(gen.next().value);
> ```
>
> **Explanation:** Generators pause execution at `yield` statements, resuming upon `.next()` calls.

### Exercise 3: Delegating Generators with `yield*`

**Problem:** Delegate iteration to another generator using `yield* innerGen()`.

**Expected output:**
```text
a
b
```

> [!check]- Answer
> function* inner() { yield "a"; yield "b"; }
> function* outer() { yield* inner(); }
> for (const val of outer()) console.log(val);
> ```
>
> **Explanation:** `yield*` delegates generator iteration to another iterable or generator function.

---

---

## 7. Related Terms
- [Function](../level_03/function.md) — The standard run-to-completion equivalent.

---

## 8. Key Takeaways
- Generators (`function*`) are functions that can be paused and resumed.
- Use the `yield` keyword to spit out a value and pause execution.
- Calling a generator returns an Iterator object. You must call `.next()` on that object to execute the code.
- They are perfect for managing infinite sequences, heavy memory streams, or custom iteration logic.
```
