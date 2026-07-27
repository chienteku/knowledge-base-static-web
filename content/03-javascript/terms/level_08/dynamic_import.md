# Dynamic import()

> **Level 8 — Modern JavaScript (ES6+)**
> Load modules on demand, returning a Promise.

---

## 1. Prerequisites
- [Modules (`import`/`export`)](./modules.md) — The static ES module sharing syntax.
- [Promise](../level_06/promise.md) — Asynchronous result container objects.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Standardized in ES2020. Supported in Node.js (v13.2+) and modern browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard static `import` statements (e.g. `import { add } from "./math.js"`) are read and parsed by the engine **before the script begins executing**. While static importing makes dependency trees predictable and allows bundlers to optimize code, it imposes rigid constraints:
- You cannot import files conditionally (e.g., inside an `if` branch or a `try/catch` block).
- You cannot generate import paths dynamically (e.g. string concatenations like `import "./locales/" + userLanguage + ".js"` trigger syntax errors).
- All dependencies must be loaded upfront, increasing initial load times (a major performance issue on mobile networks).

To solve this, ES2020 introduced **Dynamic `import()`**:
- It is a function-like operator that accepts a module path string and **returns a Promise**.
- It compiles and loads the target module asynchronously, execution starting only when the call site runs.
- When resolved, the Promise returns a **Module Namespace Object** containing all the exported features of the module.
- It can be placed anywhere—inside event handlers, loops, conditional branches, or `async` function scopes. This enables **code-splitting** (loading pages or features only when users click them).

### (2) Reality Metaphor
- **Static Import** is like packing all your clothes, winter coats, boots, and tools into a massive trailer and towing it behind your car *before* starting a road trip. It slows down your acceleration (initial load time) and consumes excessive fuel, even if you never run into cold weather or need the tools.
- **Dynamic Import** is like traveling light with a small backpack. When you arrive at a mountain and decide to go skiing (the trigger event), you tap an app on your phone and a drone delivers ski boots and a heavy jacket (the module) directly to your location on demand.

### (3) JavaScript Code Examples

#### Loading a Module inside a Button Click Handler
```javascript
const loadButton = document.querySelector("#load-chart-btn");

loadButton.addEventListener("click", async () => {
  try {
    console.log("Button clicked! Loading chart module dynamically...");
    
    // 1. Dynamic import loads chart.js asynchronously
    const chartModule = await import("./utils/chart.js");
    
    // 2. Access the exported functions directly on the namespace object
    chartModule.renderChart();
    
  } catch (error) {
    console.error("Failed to load chart module:", error);
  }
});
```

#### Dynamic Path Concatenation (Localization)
```javascript
async function loadLanguagePack(langCode) {
  // Paths can be generated dynamically using variables
  const pack = await import(`./locales/${langCode}.js`);
  
  console.log("Greeting:", pack.welcomeMessage);
  
  // PITFALL: Default exports reside under the 'default' key!
  // Destructure and rename it to access:
  const { default: runPackInit } = pack;
  runPackInit();
}

loadLanguagePack("es"); // Spanish locales loaded on-demand
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating dynamic `import()` as a Synchronous Operation

**The mistake:** Assigning the dynamic import call directly to a variable and immediately querying its exports.

**Why it's wrong:** Dynamic `import()` returns a Promise. The module exports are not available until the Promise resolves.

*Incorrect:*
```javascript
const utils = import("./utils.js");
utils.formatText("hello"); // TypeError: utils.formatText is not a function
```

*Fix:*
```javascript
// Option A: async/await
const utils = await import("./utils.js");
utils.formatText("hello"); 

// Option B: Promise chaining
import("./utils.js").then((utils) => {
  utils.formatText("hello");
});
```

### Mistake 2: Missing the `default` key during destructuring

**The mistake:** Destructuring a default export variable directly from the dynamic import namespace.

**Why it's wrong:** The resolved namespace object maps named exports directly (e.g. `exports.foo`), but stores default exports under the literal key named `default`. You must rename the key during destructuring.

*Incorrect:*
```javascript
const MyService = await import("./MyService.js"); // If MyService has 'export default'
const serviceInstance = new MyService(); // TypeError: MyService is not a constructor
```

*Fix:*
```javascript
// Destructure and rename 'default'
const { default: MyService } = await import("./MyService.js");
const serviceInstance = new MyService(); // Correct!
```

---

### Mistake 3: Unhandled Asynchronous Failures in Dynamic Import Operations

**The mistake:** Executing asynchronous operations within Dynamic Import without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/dynamic_import"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/dynamic_import");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in dynamic_import: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: On-demand Calculator

**Problem:** Complete the function `calculate` to dynamically import `./math.js` inside the code block and invoke the exported `add` function with parameters `a` and `b`.

```javascript
async function calculate(a, b) {
  // 1. Dynamic import "./math.js"
  // 2. Call and return add(a, b)
}

calculate(10, 20).then(result => console.log("Result:", result));
```

> [!check]- Answer
> - Inside the async function, write `const math = await import("./math.js");` and return `math.add(a, b);`.

---

### Exercise 2: Dynamic Module Loading with Async/Await

**Problem:** Simulate awaiting dynamic module import `const mod = await import('./math.js')`.

**Expected output:**
```text
Dynamic import returned Promise
```

> [!check]- Answer
> ```javascript
> console.log("Dynamic import returned Promise");
> ```
>
> **Explanation:** `import(path)` returns a Promise resolving to the target module namespace object.

### Exercise 3: Destructuring Default Exports from Dynamic Imports

**Problem:** Extract `default` export using `const { default: myFunc } = await import(path)`.

**Expected output:**
```text
Default export destructured
```

> [!check]- Answer
> ```javascript
> console.log("Default export destructured");
> ```
>
> **Explanation:** Dynamic import module namespace objects store default exports under key `default`.

---

## 7. Related Terms
- [Named vs Default Exports](./named_vs_default_exports.md) — The export structures resolved by dynamic imports.
- [Vite / Bundler](../level_10/bundler.md) — Tooling that automates code splitting via dynamic imports.

---

## 8. Key Takeaways
- Dynamic `import(path)` returns a Promise that resolves to a module's namespace object on demand.
- Paths can be computed dynamically at runtime using template variables.
- Dynamic imports enable code splitting, reducing initial load times by fetching modules only when needed.
- Destructure default exports by explicitly renaming the `default` property key: `const { default: myModule } = await import(...)`.
- Unlike static imports, dynamic imports can be nested inside conditional blocks, event loops, or functions.
