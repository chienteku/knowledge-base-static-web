# Generator (function*)

> **Level 9 — Advanced Concepts & Patterns**
> Functions that can be paused and later resumed, yielding multiple values one by one (`yield`).

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The base concept.
- [Object](../level_02/object.md) — What a generator returns.

---

## 2. Term Category

**Language Core *(Introduced in ES6)* (Universal)**: Generator (function*) is a fundamental concept in this technology stack. **Level 9 — Advanced Concepts & Patterns**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Infinite Unique ID Generator Sequence

**Scenario:** A database entity mapper uses an ES6 Generator function (`function*`) to generate an infinite sequence of incrementing unique IDs.

**Requirements:**
1. Write generator function createIdGenerator(prefix, start = 1).
2. Yield formatted string `${prefix}_${id}`.
3. Increment id infinitely.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function* createIdGenerator(prefix = "ID", start = 1) {
>   let count = start;
>   while (true) {
>     yield `${prefix}_${count++}`;
>   }
> }
>
> // Verification tests
> const gen = createIdGenerator("USER", 100);
>
> console.assert(gen.next().value === "USER_100", "Test 1 Failed");
> console.assert(gen.next().value === "USER_101", "Test 2 Failed");
> console.assert(gen.next().value === "USER_102", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Generator Function Syntax**: Declared using function* syntax; calling it returns a Generator iterator object.
> 2. **yield Keyword**: Pauses generator execution and returns specified value to caller via { value, done } object.
> 3. **Infinite Iterables**: Generators lazily compute values on demand, making infinite sequence generation safe without memory overflow.
> 
---

### Exercise 2: Paginated API Cursor Consumer Generator

**Scenario:** A data ingestion service uses a generator function to fetch and yield paginated records page by page.

**Requirements:**
1. Write generator paginatePages(fetchPageFn, totalPages).
2. Loop from page 1 to totalPages.
3. Yield page items.
4. Return total items count.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function* paginatePages(fetchPageFn, totalPages) {
>   let totalProcessed = 0;
>   for (let page = 1; page <= totalPages; page++) {
>     const items = fetchPageFn(page);
>     totalProcessed += items.length;
>     yield items;
>   }
>   return totalProcessed;
> }
>
> // Verification tests
> const mockFetch = (p) => [`p${p}_item1`, `p${p}_item2`];
> const pagedGen = paginatePages(mockFetch, 2);
>
> const step1 = pagedGen.next();
> console.assert(step1.value.join(",") === "p1_item1,p1_item2", "Test 1 Failed");
> console.assert(step1.done === false, "Test 2 Failed");
>
> const step2 = pagedGen.next();
> console.assert(step2.value.join(",") === "p2_item1,p2_item2", "Test 3 Failed");
>
> const step3 = pagedGen.next();
> console.assert(step3.value === 4 && step3.done === true, "Test 4 Failed: Return value yielded when done is true");
> ```
>
> #### Technical Explanation
>
> 1. **Lazy Execution**: Generator body executes code only up to the next yield statement per .next() invocation.
> 2. **Iterator Protocol Integration**: Generators implement both Iterable and Iterator protocols, supporting for...of loops.
> 3. **Generator Return Values**: Returning a value from a generator sets done: true and value: returnVal on final step.
> 
---

### Exercise 3: Bidirectional Generator Data Processing

**Scenario:** An interactive workflow engine uses generator `.next(val)` passing to inject dynamic external state into running generator steps.

**Requirements:**
1. Write generator workflowEngine().
2. Yield step questions.
3. Receive external user input passed into next(val).
4. Calculate final result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function* workflowEngine() {
>   const name = yield "Enter name:";
>   const age = yield "Enter age:";
>   return `${name} is ${age} years old.`;
> }
>
> // Verification tests
> const flow = workflowEngine();
>
> const q1 = flow.next(); // Start generator up to first yield
> console.assert(q1.value === "Enter name:", "Test 1 Failed");
>
> const q2 = flow.next("Alice"); // Pass "Alice" into name variable
> console.assert(q2.value === "Enter age:", "Test 2 Failed");
>
> const finalStep = flow.next(30); // Pass 30 into age variable
> console.assert(finalStep.value === "Alice is 30 years old." && finalStep.done === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Bidirectional Generator Communication**: Passing arguments to generator.next(val) injects values into the generator at the paused yield expression.
> 2. **First .next() Argument Ignored**: The first call to .next() starts the generator; arguments passed to first .next() are ignored.
> 3. **Co-routine Architecture**: Allows building cooperative async workflows and state machines natively in JS.
---

## 6. Related Terms
- [Function](../level_03/function.md) — The standard run-to-completion equivalent.
- [for await...of / Async Iterators](../level_06/for_await_of.md) — Related concept: for await...of / Async Iterators.
- [Iterators & Iterables (protocol)](../level_08/iterators_iterables.md) — Related concept: Iterators & Iterables (protocol).

---

## 7. Key Takeaways
- Generators (`function*`) are functions that can be paused and resumed.
- Use the `yield` keyword to spit out a value and pause execution.
- Calling a generator returns an Iterator object. You must call `.next()` on that object to execute the code.
- They are perfect for managing infinite sequences, heavy memory streams, or custom iteration logic.
```
