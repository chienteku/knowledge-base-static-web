# Circular Dependencies

> **Level 3 — Module Systems**
> A critical architecture bug where File A imports File B, but File B also imports File A, creating an infinite loop of dependencies that crashes the application.

---

## 1. Prerequisites
- [CommonJS (require, module.exports)](commonjs.md)

---

## 2. Term Category

**Architecture Bug / Concept (Universal .)**: Circular Dependencies is a fundamental concept in this technology stack. **Level 3 — Module Systems**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Circular Dependency Graph Detector

**Scenario:** A build static analysis tool inspects CommonJS module dependency graphs to detect circular dependencies before deployment.

**Requirements:**
1. Write detectCircularDependency(moduleGraphMap).
2. Perform Depth-First Search (DFS) traversal.
3. Detect back-edges in call graph.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function detectCircularDependency(moduleGraphMap = {}) {
>   const visited = new Set();
>   const recursionStack = new Set();
>   const cycles = [];
>
>   function dfs(node, path = []) {
>     visited.add(node);
>     recursionStack.add(node);
>     path.push(node);
>
>     const neighbors = moduleGraphMap[node] || [];
>     for (const neighbor of neighbors) {
>       if (!visited.has(neighbor)) {
>         dfs(neighbor, [...path]);
>       } else if (recursionStack.has(neighbor)) {
>         const cyclePath = path.slice(path.indexOf(neighbor));
>         cyclePath.push(neighbor);
>         cycles.push(cyclePath.join(" -> "));
>       }
>     }
>
>     recursionStack.delete(node);
>   }
>
>   for (const node of Object.keys(moduleGraphMap)) {
>     if (!visited.has(node)) {
>       dfs(node, []);
>     }
>   }
>
>   return {
>     hasCircularDependency: cycles.length > 0,
>     cycles
>   };
> }
>
> // Verification tests
> const graph = {
>   "user.js": ["order.js"],
>   "order.js": ["payment.js"],
>   "payment.js": ["user.js"] // Cycle!
> };
>
> const result = detectCircularDependency(graph);
> console.assert(result.hasCircularDependency === true, "Test 1 Failed");
> console.assert(result.cycles[0] === "user.js -> order.js -> payment.js -> user.js", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Circular Dependency Definition**: Occurs when Module A requires Module B, and Module B requires Module A directly or indirectly.
> 2. **CommonJS Partial Exports**: In CommonJS, circular dependencies return incomplete/empty `{}` module.exports objects during evaluation.
> 3. **DFS Cycle Detection**: Uses Depth-First Search with a recursion stack to identify back-edges indicating circular references.
> 
---

### Exercise 2: Dependency Injection Refactoring for Circular Modules

**Scenario:** Refactors two tightly coupled modules (`UserService` and `OrderService`) by injecting dependencies at instantiation time to eliminate circular `require()` calls.

**Requirements:**
1. Write createUserService(getOrderServiceFn).
2. Write createOrderService(getUserServiceFn).
3. Resolve dependencies lazily without top-level circular requires.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createUserService(getOrderServiceFn) {
>   return {
>     getUser(id) {
>       return { id, name: "Alice" };
>     },
>     getUserOrders(userId) {
>       const orderService = getOrderServiceFn();
>       return orderService.getOrdersByUserId(userId);
>     }
>   };
> }
>
> function createOrderService(getUserServiceFn) {
>   return {
>     getOrdersByUserId(userId) {
>       const userService = getUserServiceFn();
>       const user = userService.getUser(userId);
>       return [{ orderId: 101, user: user.name }];
>     }
>   };
> }
>
> // Verification tests
> let userService, orderService;
>
> userService = createUserService(() => orderService);
> orderService = createOrderService(() => userService);
>
> const orders = userService.getUserOrders("u1");
> console.assert(orders.length === 1 && orders[0].user === "Alice", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Dependency Injection (DI)**: Passes service instances or factory getters rather than importing dependent modules at file top-level.
> 2. **Lazy Evaluation**: Defers accessing dependent module until method execution time when both modules are fully evaluated.
> 3. **Architectural Decoupled Design**: Eliminates circular dependency bugs by decoupling component instantiation from usage.
> 
---

### Exercise 3: Lazy-Loading Function Getter Pattern

**Scenario:** Implements a lazy module getter helper function that defers `require()` invocation until runtime to bypass top-level circular dependencies.

**Requirements:**
1. Write createLazyModuleGetter(modulePath, requireMock).
2. Cache required module instance upon first invocation.
3. Return cached export.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createLazyModuleGetter(modulePath, requireMock) {
>   const req = requireMock || require;
>   let cachedModule = null;
>
>   return function getModule() {
>     if (!cachedModule) {
>       cachedModule = req(modulePath);
>     }
>     return cachedModule;
>   };
> }
>
> // Verification tests
> let requireCount = 0;
> const mockRequire = (path) => {
>   requireCount++;
>   return { name: `Module_${path}` };
> };
>
> const getUserModule = createLazyModuleGetter("./user.js", mockRequire);
> console.assert(requireCount === 0, "Test 1 Failed: Must not require at creation time");
>
> const mod1 = getUserModule();
> const mod2 = getUserModule();
> console.assert(requireCount === 1, "Test 2 Failed: Require executed exactly once");
> console.assert(mod1 === mod2, "Test 3 Failed: Returns cached instance");
> ```
>
> #### Technical Explanation
>
> 1. **Lazy Loading Strategy**: Defers module loading until runtime execution, avoiding top-level import evaluation deadlocks.
> 2. **Module Caching**: Caches module reference after first invocation to eliminate repeated `require()` overhead.
> 3. **ESM Live Bindings Contrast**: ESM supports live bindings but top-level circular imports can evaluate variables as `undefined` before initialization.
## 6. Related Terms
- [Module Resolution](module_resolution.md) — The process that gets trapped in the infinite loop.

---

## 7. Key Takeaways
- A **Circular Dependency** occurs when two or more files import each other in a loop (A $\rightarrow$ B $\rightarrow$ A).
- Node.js handles this by forcefully resolving one of the imports as an empty object or `undefined`, crashing your app.
- It is an architectural flaw, not a language bug.
- Fix it by extracting shared logic into a third, independent file to break the loop.
