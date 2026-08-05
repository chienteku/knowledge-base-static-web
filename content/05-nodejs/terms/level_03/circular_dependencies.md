# Circular Dependencies

> **Level 3 — Module Systems**
> A critical architecture bug where File A imports File B, but File B also imports File A, creating an infinite loop of dependencies that crashes the application.

---

## 1. Prerequisites
- [CommonJS (require, module.exports)](commonjs.md)

---

## 2. Term Category
- **Architecture Bug / Concept**

---

## 3. Environment Context
- **Universal** (Can happen in Node.js, React, or any modular language).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
We didn't design this; this is a catastrophic architectural failure.
Imagine you are building an E-commerce API.
- You have a `User` class. A user has a method called `.getOrders()` which requires the `Order` class. So, `user.js` imports `order.js`.
- You also have an `Order` class. An order has a method called `.getUserDetails()` which requires the `User` class. So, `order.js` imports `user.js`.

### (2) The Infinite Loop
When Node.js starts up:
1. Node reads `user.js`. It sees `require('./order.js')`. It pauses `user.js` and jumps to `order.js`.
2. Node reads `order.js`. It sees `require('./user.js')`. It pauses `order.js` and jumps back to `user.js`.
3. Node reads `user.js`. It sees `require('./order.js')`...

To prevent the computer from exploding in an infinite loop, Node.js detects this Circular Dependency and forces one of the imports to instantly return an **empty object `{}`** or `undefined`.
Suddenly, your `User` class thinks `Order` is undefined, and your entire application crashes with `TypeError: Order is not a function`.

### (3) How to Fix It
Circular dependencies are almost always a sign of bad architecture. The fix is usually to extract the shared logic into a **third file**.
Instead of A importing B, and B importing A...
Create File C. Have A import C, and B import C. The circle is broken!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Blaming the framework

**The mistake:** A developer gets a weird `undefined` error on an imported class. They spend 5 hours reinstalling NPM packages and blaming Node.js for being broken.

**Why it's wrong:** The code isn't broken; the architecture is. If an imported variable is suddenly `undefined` or an empty object `{}`, 99% of the time, you have accidentally created a Circular Dependency. 
**Golden Rule:** Draw a dependency tree on a piece of paper. If you can draw a circle connecting your files, you must refactor your code.

---



### Mistake 2: Accessing Uninitialized Exports in Circular CommonJS Modules

**The mistake:** Module A requires Module B, and Module B requires Module A, accessing exports immediately at top level.

**Why it's wrong:** When circular dependencies occur, Node.js returns an incomplete/empty copy of Module A's `exports` object to Module B. Accessing properties on Module A at module load time returns `undefined`.

*Incorrect:*
```javascript
// a.js:
const b = require('./b');
exports.name = 'A';
// b.js:
const a = require('./a');
console.log(a.name); // ❌ undefined! Module a exports object is incomplete!
```

*Fix:*
```javascript
// Access exported properties inside function calls instead of top-level module evaluation:
// b.js:
exports.print = () => { const a = require('./a'); console.log(a.name); };
```

### Mistake 3: Triggering Unhandled ReferenceError in Circular ES Modules (`import`)

**The mistake:** Exporting `const` or `let` variables involved in circular `import` statements accessed before initialization.

**Why it's wrong:** ES Modules use live bindings with Temporal Dead Zone (TDZ). Circular ESM imports accessed during initial evaluation throw `ReferenceError: Cannot access variable before initialization`.

*Incorrect:*
```javascript
// a.js:
import { b } from './b.js';
export const a = b + 1; // ❌ ReferenceError!
// b.js:
import { a } from './a.js';
export const b = a + 1;
```

*Fix:*
```javascript
// Refactor to export functions or pass dependencies explicitly to break the cycle
```

## 6. Practice Exercises

### Exercise 1: The Parent and Child

**Problem:** You have a `Parent.js` file and a `Child.js` file. The `Parent` needs to create new `Child` instances. The `Child` needs access to a utility function called `formatName()` that currently lives inside `Parent.js`. 
If `Child` imports `Parent` to get `formatName()`, you will cause a Circular Dependency. How do you fix this architecture?

**Expected output:**
> [!check]- Answer
> ```text
> Extract `formatName()` out of `Parent.js` and put it into a new file named `utils.js`.
> Now, `Parent.js` imports `Child.js`. 
> `Child.js` imports `utils.js`.
> The circle is broken, and data flows strictly in one direction!
> ```
> - Remember the "Third File" trick.

---



### Exercise 2: Breaking Circular Dependency Cycle

**Problem:** What architectural refactoring pattern breaks a circular dependency between Module A and Module B?

**Expected output:**
> [!check]- Answer
> ```text
> Extract the shared logic/state into a third independent module (Module C) imported by both A and B.
> ```
> ```text
> Extract the shared logic/state into a third independent module (Module C) imported by both A and B.
> ```
>
> **Explanation:** Introducing a shared helper module removes direct mutual dependencies between A and B.

---

### Exercise 3: CommonJS vs ESM Circular Handling

**Problem:** Compare how CommonJS vs ES Modules handle circular dependencies.

**Expected output:**
> [!check]- Answer
> ```text
> CommonJS returns an incomplete exports object snapshot; ES Modules use live bindings that throw TDZ ReferenceError if evaluated before initialization.
> ```
> ```text
> CommonJS returns an incomplete exports object snapshot; ES Modules use live bindings that throw TDZ ReferenceError if evaluated before initialization.
> ```
>
> **Explanation:** CommonJS exposes partial export objects; ESM enforces strict static TDZ live bindings.

## 7. Related Terms
- [Module Resolution](module_resolution.md) — The process that gets trapped in the infinite loop.

---

## 8. Key Takeaways
- A **Circular Dependency** occurs when two or more files import each other in a loop (A $\rightarrow$ B $\rightarrow$ A).
- Node.js handles this by forcefully resolving one of the imports as an empty object or `undefined`, crashing your app.
- It is an architectural flaw, not a language bug.
- Fix it by extracting shared logic into a third, independent file to break the loop.
