# Framework vs Library (React / Vue / Angular)

> **Level 10 — Ecosystem & Tooling**
> Inversion-of-control distinction; where JSX fits.

---

## 1. Prerequisites
- [SPA](spa.md) — Single Page Application architecture.
- [JSX](jsx.md) — The XML-like syntax extension representing templates.

---

## 2. Term Category
- **Ecosystem / Tooling**

---

## 3. Environment Context
- **Browser**: Frontend architectural structures.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In web development, we construct interfaces using tools like React, Vue, or Angular. We often hear React described as a "UI library," while Angular is described as a "full framework." The distinction between them is not simply size or features; it is a fundamental architectural concept called **Inversion of Control (IoC)**:

#### Library (You are in control)
A collection of pre-written helper functions, components, or classes that you import and call when **you** choose.
- **Control Flow:** You write the main application logic and call the library's methods to perform specific tasks (like rendering a button or parsing a date).
- **Flexibility:** You have complete freedom to choose your folder structure, build tools, routing packages, and state management strategies.
- **Example:** **React** is technically a library because it only handles rendering the UI view layer. You must choose and import separate packages (like React Router or Zustand) to build a complete app.

#### Framework (The Framework is in control)
A complete, pre-built structural skeleton containing designated slots.
- **Control Flow:** **The framework calls your code.** It dictates the application lifecycle, routing, folder layout, and configuration rules. You simply write code modules and plug them into the framework's slots.
- **Examples:** **Angular** or **Next.js** are frameworks. They provide built-in routers, HTTP clients, form modules, and build processes. You write classes, and the framework instantiates and executes them.

#### Where JSX Fits
JSX is an XML-like syntax extension. Because React is a lightweight UI library, it relies on JSX to let you declare UI hierarchies cleanly. Before reaching the browser, transpilers (like Babel) compile JSX tags into standard JavaScript function calls (`React.createElement()`), which React's core engine reads to update the DOM.

### (2) Reality Metaphor
- A **Library** is like visiting a **hardware store**. You buy a hammer, nails, and a handsaw (the tools). You carry them home. You have complete control: you decide what to build, when to hammer, and where to place the wood.
- A **Framework** is like renting a **pre-built smart home**. The house has pre-molded slots for a microwave, a refrigerator, and a television. You cannot knock down the walls or change the room layout. You simply plug your TV (your custom code module) into the designated wall outlet. The house's electrical network (the framework) controls when the power flows and how it is routed.

### (3) JavaScript Code Examples

#### Control Flow Contrast

##### 1. React (Library: You call it)
You import React components and render them inside your custom, self-controlled application script:
```javascript
import React from "react";
import ReactDOM from "react-dom/client";

// You define the component
function AlertButton() {
  return <button onClick={() => alert("Clicked!")}>Click Me</button>;
}

// You choose exactly where and when to mount it into the DOM
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AlertButton />);
```

##### 2. Angular (Framework: It calls you)
You write a component class and decorate it. You do not instantiate or mount the class yourself; the Angular framework compiles the decorator metadata and controls the class instantiation behind the scenes:
```typescript
import { Component } from "@angular/core";

// You plug your logic into the framework's decorator template
@Component({
  selector: "app-alert-button",
  template: `<button (click)="showAlert()">Click Me</button>`
})
export class AlertButtonComponent {
  showAlert() {
    alert("Clicked!");
  }
}
// You never call: new AlertButtonComponent().render()!
// The framework detects the selector tag in HTML and runs the component automatically.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Framework Vs Library Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Framework Vs Library blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "framework_vs_library";
```

*Fix:*
```javascript
let value = "framework_vs_library";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Framework Vs Library Callbacks

**The mistake:** Passing methods from Framework Vs Library instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "framework_vs_library",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "framework_vs_library",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Framework Vs Library Operations

**The mistake:** Executing asynchronous operations within Framework Vs Library without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/framework_vs_library"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/framework_vs_library");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in framework_vs_library: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Framework or Library?

**Problem:** Classify the following scenarios as utilizing a **Library** or a **Framework**:

1. You import `lodash` and call `_.cloneDeep(obj)` inside your custom script.
2. You create files inside a `/pages` folder, and the tool automatically creates website URLs matching your filenames without you writing any routing code.
3. You import `Chart.js` to draw a bar chart on a canvas element that you created.
4. You write class methods prefixed with `@Get('/users')` and start the server, which automatically maps network requests to your methods.

> [!check]- Answer
> - 1. **Library** (You control when to call the utility helper).
> - 2. **Framework** (The framework dictates the folder structure and handles routing automatically).
> - 3. **Library** (You control where the chart is drawn and handle container creation).
> - 4. **Framework** (The framework intercepts the network event and invokes your class method).


---

### Exercise 2: Inversion of Control Classification

**Problem:** Classify React/Vue/Angular (Frameworks) vs Lodash/Date-fns (Libraries).

**Expected output:**
> [!check]- Answer
> ```text
> Frameworks: IoC architecture, Libraries: Utility toolkits
> ```
> ```javascript
> console.log("Frameworks: IoC architecture, Libraries: Utility toolkits");
> ```
>
> **Explanation:** Inversion of Control determines whether your code calls the utility or the framework calls your code.

---

### Exercise 3: Routing Architecture Differences

**Problem:** Explain how file-system routing in frameworks dictates project layout boundaries.

**Expected output:**
> [!check]- Answer
> ```text
> File-system routing enforces framework directory conventions
> ```
> ```javascript
> console.log("File-system routing enforces framework directory conventions");
> ```
>
> **Explanation:** Frameworks enforce opinionated directory structures and application lifecycles.


---

## 7. Related Terms
- [Bundler](bundler.md) — The builder tools that package components for deployment.
- [CommonJS vs ES Modules (require vs import)](commonjs_vs_esm.md) — The module standards used to import libraries and framework components.

---

## 8. Key Takeaways
- The key difference between libraries and frameworks is Inversion of Control (IoC).
- In a library, you import and call its functions; you control the flow.
- In a framework, you write code that the framework imports and executes; it controls the flow.
- React is a UI library focused strictly on the view layer; Angular and Next.js are full frameworks.
- JSX is a template syntax compiles into nested function calls by transpilers before running.
- Choose libraries for modular flexibility; choose frameworks for opinionated, ready-to-scale structures.
