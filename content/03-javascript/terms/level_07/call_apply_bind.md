# call / apply / bind

> **Level 7 — Objects & Prototypes**
> Explicitly bind the `this` context for a function.

---

## 1. Prerequisites
- [this Keyword](this_keyword.md) — The dynamic reference pointing to execution context.
- [Function](../level_03/function.md) — Reusable blocks of execution code.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, the value of the **`this`** keyword inside a function is bound dynamically when the function is invoked (e.g. calling `user.greet()` binds `this` to `user`, but extract the method to a variable: `const f = user.greet; f()` binds `this` to the global object or `undefined` in strict mode). This dynamic behavior can trigger bugs—especially when passing methods as callback arguments to timers or event listeners.

To override dynamic binding, JavaScript functions inherit three methods from their prototype (`Function.prototype`) that let you explicitly tell a function exactly what object it must use as its `this` context:
- **`call(thisArg, arg1, arg2, ...)`** invokes the function immediately, setting its `this` context to `thisArg`, and accepts arguments as a comma-separated list.
- **`apply(thisArg, [argsArray])`** invokes the function immediately, setting its `this` context to `thisArg`, and accepts arguments grouped inside a single array. (Mnemonic: **A**pply takes an **A**rray; **C**all takes **C**omma-separated arguments).
- **`bind(thisArg, arg1, arg2, ...)`** does **not** invoke the function immediately. Instead, it returns a **new copy of the function** with its `this` context permanently locked to `thisArg`. Any future invocation of this bound function is guaranteed to use that context.

### (2) Reality Metaphor
Imagine a drone (the function) carrying a package.
- **Dynamic `this`** is like a drone configured to land on the nearest colored pad. If you launch it from the blue floor, it lands on the blue floor. If you launch it from the red floor, it lands on the red floor.
- **`call` / `apply`** is like a manual override command sent via remote control: `"Fly to Red Pad and land immediately."` You specify the destination (the target object) and force immediate execution.
- **`bind`** is like **hard-soldering** the GPS coordinates of the Red Pad directly into the drone's memory chip before it takes off. No matter where the drone is carried, who launches it, or when it flies, it is permanently locked to only land on the Red Pad.

### (3) JavaScript Code Examples

#### Context Overrides with Call, Apply, and Bind
```javascript
const userA = { name: "Alice" };
const userB = { name: "Bob" };

function introduce(greeting, punctuation) {
  console.log(`${greeting}, my name is ${this.name}${punctuation}`);
}

// 1. call: passes arguments individually
introduce.call(userA, "Hello", "!"); // "Hello, my name is Alice!"

// 2. apply: passes arguments in an array
introduce.apply(userB, ["Hi", "."]); // "Hi, my name is Bob."

// 3. bind: returns a new, bound function copy
const introduceAlice = introduce.bind(userA);
introduceAlice("Hey", "?"); // "Hey, my name is Alice?"

// Context remains locked even if we try to call it on userB later!
introduceAlice.call(userB, "Hey", "?"); // "Hey, my name is Alice?" (Still Alice!)
```

#### Fixing Callback Context Loss with Bind
```javascript
const counter = {
  count: 0,
  increment() {
    this.count++;
    console.log("Count:", this.count);
  },
  startTimer() {
    // PITFALL: setTimeout runs the callback in the global context, 
    // so 'this' becomes undefined or window, causing this.count++ to fail!
    // setTimeout(this.increment, 1000); 

    // FIX: bind the method to 'this' (the counter object) permanently
    const boundIncrement = this.increment.bind(this);
    setTimeout(boundIncrement, 1000);
  }
};

counter.startTimer(); // Logs "Count: 1" after 1 second
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `bind` to invoke the function immediately

**The mistake:** Calling `myFunc.bind(obj)` expecting it to execute the function and return the output.

**Why it's wrong:** `bind` does not run the function. It returns a new function wrapper. To execute it, you must invoke the returned function by adding parentheses `()`.

*Incorrect:*
```javascript
function greet() { return `Hi ${this.name}`; }
const user = { name: "Alice" };

const result = greet.bind(user); // Returns the bound function definition, does not run!
console.log(result); // [Function: bound greet]
```

*Fix:*
```javascript
const resultFn = greet.bind(user);
console.log(resultFn()); // "Hi Alice" (Invoked!)
```

### Mistake 2: Losing Context Binding (`this`) in Call Apply Bind Callbacks

**The mistake:** Passing methods from Call Apply Bind instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "call_apply_bind",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "call_apply_bind",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Call Apply Bind Operations

**The mistake:** Executing asynchronous operations within Call Apply Bind without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/call_apply_bind"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/call_apply_bind");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in call_apply_bind: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Context Binder

**Problem:** Complete the code to bind the function `printTitle` to the `book` object, and execute the bound function.

```javascript
const book = { title: "JavaScript Guide" };

function printTitle() {
  return this.title;
}

// Bind function to book
const getTitle = // Write bind code

console.log("Book Title:", getTitle());
```

**Expected output:**
> [!check]- Answer
> ```text
> Book Title: JavaScript Guide
> ```
> - Assign `printTitle.bind(book)` to `getTitle`.
> 
---

### Exercise 2: Explicit `this` Binding with `.call()`

**Problem:** Invoke `greet.call({ name: "Alice" })` for `function greet() { return this.name; }`.

**Expected output:**
> [!check]- Answer
> ```text
> Alice
> ```
> ```javascript
> function greet() { return this.name; }
> console.log(greet.call({ name: "Alice" }));
> ```
>
> **Explanation:** `.call(ctx, ...args)` invokes target functions with explicitly assigned `this` contexts.
> 
---

### Exercise 3: Partial Function Application with `.bind()`

**Problem:** Use `.bind(null, 2)` to create a `double` function from `function mult(a, b) { return a * b; }`.

**Expected output:**
> [!check]- Answer
> ```text
> 20
> ```
> ```javascript
> function mult(a, b) { return a * b; }
> const double = mult.bind(null, 2);
> console.log(double(10));
> ```
>
> **Explanation:** `.bind()` pre-binds leading argument parameters for partial application.
> 
---

## 7. Related Terms
- [Default this Binding Rules](default_this_binding.md) — The core precedence rules governing how JavaScript binds the execution context.
- [this Keyword](this_keyword.md) — Related concept: this Keyword.

---

## 8. Key Takeaways
- Use `call`, `apply`, or `bind` to explicitly control the value of `this` inside function scopes.
- `call` and `apply` invoke functions immediately; `call` accepts arguments individually, whereas `apply` accepts arguments as an array.
- `bind` returns a new copy of the function with `this` permanently bound, which is ideal for deferred execution callbacks.
- Calling `call`, `apply`, or `bind` on arrow functions has no effect, as arrow functions rely on lexical scoping for `this`.
