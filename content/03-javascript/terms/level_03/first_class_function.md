# First-Class Function

> **Level 3 — Functions & Scope**
> The concept that functions in JS are treated as values that can be assigned, passed, and returned.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The basic block of code we are treating as a value.
- [Variable](../level_01/variable.md) — The container we assign the function to.

---

## 2. Term Category
Language Core, Paradigm

---

## 3. Core Definition
A programming language is said to have **First-Class Functions** when functions in that language are treated like any other variable or data type.

Because JavaScript treats functions as "first-class citizens," you can:
1. Assign a function to a variable.
2. Pass a function as an argument to another function.
3. Return a function from another function.
4. Store a function in an array or object.

---

## 4. Key Characteristics / Rules
- **No Special Treatment:** In JS, a function is just an Object under the hood. It takes up memory like a string or number, and can be moved around exactly like one.
- **The Foundation of Functional Programming:** This feature is what allows JavaScript to utilize powerful functional programming patterns, like mapping over arrays or creating closures.

---

## 5. Typical Usage / Common Patterns

```javascript
// 1. Assigned to a variable (Function Expression)
const sayHello = function() {
  console.log("Hello!");
};

// 2. Passed as an argument (Callback)
function executeIt(fn) {
  fn(); // We execute the function that was passed in!
}
executeIt(sayHello);

// 3. Returned from another function
function createGreeter() {
  return function() {
    console.log("I am a returned function!");
  };
}
const myNewFunc = createGreeter();
myNewFunc();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding First Class Function Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within First Class Function blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "first_class_function";
```

*Fix:*
```javascript
let value = "first_class_function";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in First Class Function Callbacks

**The mistake:** Passing methods from First Class Function instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "first_class_function",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "first_class_function",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in First Class Function Operations

**The mistake:** Executing asynchronous operations within First Class Function without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/first_class_function"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/first_class_function");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in first_class_function: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

---

### Exercise 1: Passing Functions as Arguments

**Problem:** Pass a custom `double(x)` function into `Array.prototype.map`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 2, 4, 6 ]
> ```
> ```javascript
> function double(x) { return x * 2; }
> const nums = [1, 2, 3];
> console.log(nums.map(double));
> ```
>
> **Explanation:** First-class functions can be passed as values into function arguments.

---

### Exercise 2: Storing Functions in Data Structures

**Problem:** Store functions in an object dictionary `const ops = { add: (a,b) => a+b }` and call `ops.add(2, 3)`.

**Expected output:**
> [!check]- Answer
> ```text
> 5
> ```
> ```javascript
> const ops = {
>   add: (a, b) => a + b,
>   sub: (a, b) => a - b
> };
> console.log(ops.add(2, 3));
> ```
>
> **Explanation:** First-class functions can be stored inside objects and arrays like any primitive value.

---

---

### Exercise 3: Returning Functions from Functions

**Problem:** Demonstrate returning a function from another function call.

**Expected output:**
> [!check]- Answer
> ```text
> Hello World
> ```
> ```javascript
> function createGreeter(salutation) {
>   return function(name) { return `${salutation} ${name}`; };
> }
> const greeter = createGreeter("Hello");
> console.log(greeter("World"));
> ```
>
> **Explanation:** First-class functions can be returned as output values from function calls.


---

## 7. Related Terms
- [Higher-Order Function](../level_03/higher_order_function.md) — The specific term for a function that *accepts* or *returns* a first-class function.
- [Callback Function](../level_03/callback_function.md) — A function that is passed as an argument, made possible by first-class functions.

---
