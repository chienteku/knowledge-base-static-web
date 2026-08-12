# call / apply / bind

> **Level 7 — Objects & Prototypes**
> Explicitly bind the `this` context for a function.

---

## 1. Prerequisites
- [this Keyword](this_keyword.md) — The dynamic reference pointing to execution context.
- [Function](../level_03/function.md) — Reusable blocks of execution code.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: call / apply / bind is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Method Borrowing across Data Objects via .call()

**Scenario:** A utility package borrows formatting methods from a base object and executes them in the context of different data objects using .call().

**Requirements:**
1. Write formatRecord(label).
2. Use .call() to execute formatRecord with target object context.
3. Return formatted string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatRecord(label) {
>   return `[${label}]: ${this.name} (ID: ${this.id})`;
> }
>
> const userA = { id: 101, name: "Alice" };
> const userB = { id: 102, name: "Bob" };
>
> // Verification tests
> const res1 = formatRecord.call(userA, "USER");
> console.assert(res1 === "[USER]: Alice (ID: 101)", "Test 1 Failed");
>
> const res2 = formatRecord.call(userB, "ADMIN");
> console.assert(res2 === "[ADMIN]: Bob (ID: 102)", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **.call() Method Purpose**: Function.prototype.call(thisArg, arg1, arg2...) invokes a function immediately, explicitly setting its 'this' context.
> 2. **Method Borrowing**: Allows objects to reuse methods from other objects or standalone functions without copying code.
> 3. **Argument Passing Syntax**: Arguments are passed individually as comma-separated values after thisArg.
> 
---

### Exercise 2: Preserving Class Instance 'this' Context with .bind()

**Scenario:** An event listener manager binds class instance methods to the class instance using .bind() to prevent losing 'this' context when passed as callbacks.

**Requirements:**
1. Create EventComponent class with button click handler.
2. Use .bind(this) to bind method.
3. Verify 'this' context remains bound during detached execution.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class EventComponent {
>   constructor(name) {
>     this.name = name;
>     // Bind 'this' explicitly to instance
>     this.handleClick = this.handleClick.bind(this);
>   }
>
>   handleClick() {
>     return `Clicked by ${this.name}`;
>   }
> }
>
> // Verification tests
> const comp = new EventComponent("Toolbar");
> const detachedHandler = comp.handleClick; // Detached function reference
>
> console.assert(detachedHandler() === "Clicked by Toolbar", "Test 1 Failed: 'this' binding lost");
> ```
>
> #### Technical Explanation
>
> 1. **.bind() Method Purpose**: Function.prototype.bind(thisArg) returns a NEW bound function with its 'this' context permanently bound.
> 2. **Detached Callbacks**: Prevents 'this' context loss when passing object methods as event listeners or timers.
> 3. **Immutability of Bound Function**: Once a function is bound via .bind(), its 'this' context cannot be changed by subsequent .call() or .apply() calls.
> 
---

### Exercise 3: Partial Parameter Pre-binding via .bind()

**Scenario:** A log formatting factory uses .bind() to pre-bind fixed prefix parameters, returning partially applied logging functions.

**Requirements:**
1. Write createPrefixedLogger(prefix, baseLogFn).
2. Use baseLogFn.bind(null, prefix).
3. Return partially applied logger function.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createPrefixedLogger(prefix, baseLogFn) {
>   if (typeof baseLogFn !== "function") return () => {};
>   return baseLogFn.bind(null, prefix);
> }
>
> // Verification tests
> let loggedMessage = "";
> const rawLog = (prefix, msg) => { loggedMessage = `[${prefix}]: ${msg}`; };
> const infoLog = createPrefixedLogger("INFO", rawLog);
>
> infoLog("User signed in");
> console.assert(loggedMessage === "[INFO]: User signed in", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Partial Application with .bind()**: Passing arguments after thisArg in .bind(thisArg, arg1, arg2...) prepends fixed initial arguments.
> 2. **Functional Pre-configuration**: Creates specialized single-purpose functions from generalized multi-parameter functions.
> 3. **this Context Detachment**: Passing null/undefined as thisArg ignores object context when binding standalone functions.
> 
---

## 6. Related Terms
- [Default this Binding Rules](default_this_binding.md) — The core precedence rules governing how JavaScript binds the execution context.
- [this Keyword](this_keyword.md) — Related concept: this Keyword.

---

## 7. Key Takeaways
- Use `call`, `apply`, or `bind` to explicitly control the value of `this` inside function scopes.
- `call` and `apply` invoke functions immediately; `call` accepts arguments individually, whereas `apply` accepts arguments as an array.
- `bind` returns a new copy of the function with `this` permanently bound, which is ideal for deferred execution callbacks.
- Calling `call`, `apply`, or `bind` on arrow functions has no effect, as arrow functions rely on lexical scoping for `this`.
