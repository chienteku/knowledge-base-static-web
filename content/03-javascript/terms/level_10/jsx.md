# JSX

> **Level 10 — Ecosystem & Tooling**
> A syntax extension popularized by React that allows writing HTML-like markup inside JavaScript.

---

## 1. Prerequisites
- [Expression](../level_01/expression.md) — JSX evaluates to JavaScript expressions.
- [Babel](babel.md) — The tool required to translate JSX into real JavaScript.

---

## 2. Term Category
- **Syntax Extension**

---

## 3. Environment Context
- **Development Environment** (React / SolidJS / Preact)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before React, developers strictly separated their concerns by file type: HTML for structure, CSS for styling, and JavaScript for logic. However, as web apps became more interactive, developers found themselves writing massive, ugly strings of HTML inside their JavaScript files using `innerHTML`, or using extremely verbose methods like `document.createElement('div')`.

The creators of React realized that UI logic and UI markup are inherently tied together. They created **JSX** (JavaScript XML). JSX allows developers to write literal HTML tags directly inside their JavaScript files. It is not a string, and it is not real HTML. It is a brilliant syntax extension that makes writing complex UI components feel completely natural.

### (2) Reality Metaphor
Writing UI with pure JavaScript is like trying to build a Lego house while wearing a blindfold, by shouting instructions to a robot: "Robot, create a red block. Robot, place it at coordinates 10, 5."
Writing UI with JSX is like taking off the blindfold and just snapping the Lego blocks together with your own hands. You can literally *see* the structure you are building right inside your code.

### (3) JavaScript Code Examples

#### Short Snippet: The syntax
```jsx
// This looks like HTML, but it's assigned to a JavaScript variable!
// This is JSX.
const header = <h1 className="title">Hello World</h1>;

// You can embed JavaScript expressions directly inside the markup using {}
const name = "Alice";
const personalizedHeader = <h1>Hello, {name}!</h1>;
```

#### What it actually does (The Babel Translation)
```javascript
// Web browsers CANNOT read JSX. It is illegal syntax.
// You must run it through Babel during your build step.

// YOU WRITE THIS (JSX):
const myDiv = <div id="container"><span>Hi</span></div>;

// BABEL COMPILES IT INTO THIS (Real JavaScript):
const myDiv = React.createElement(
  "div", 
  { id: "container" }, 
  React.createElement("span", null, "Hi")
);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using HTML attributes instead of DOM properties

**The mistake:** Writing `<div class="box"></div>` in JSX.

**Why it's wrong:** JSX is closer to JavaScript than it is to HTML. Because `class` is a reserved keyword in JavaScript (used for defining classes), you cannot use it as a property name. You must use the camelCase DOM property name instead, which is `className`. Similarly, `onclick` becomes `onClick`, and `for` (on labels) becomes `htmlFor`.

*Incorrect:* `<label for="name" class="bold" onclick={doMath}>`
*Correct:* `<label htmlFor="name" className="bold" onClick={doMath}>`

---

### Mistake 2: Losing Context Binding (`this`) in Jsx Callbacks

**The mistake:** Passing methods from Jsx instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "jsx",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "jsx",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Jsx Operations

**The mistake:** Executing asynchronous operations within Jsx without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/jsx"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/jsx");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in jsx: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Returning multiple elements

**Problem:** If you try to write a component that returns two sibling elements, JSX will throw a Syntax Error: `return <h1>Title</h1><p>Description</p>;`. Why does this happen and how do you fix it?

**Expected output:**
> [!check]- Answer
> ```text
> A function can only return ONE thing. Because JSX compiles down to `React.createElement()` function calls, you cannot return two separate function calls at the same time!
> You must wrap them in a single parent element, like a `<div>`, or use a special React Fragment `<>`:
> ```
> - Think about how many values a normal JavaScript function can `return`.
> 
---

### Exercise 2: Desugaring JSX to `React.createElement`

**Problem:** Desugar `<h1 id="title">Hello</h1>` to raw JS function call.

**Expected output:**
> [!check]- Answer
> ```text
> React.createElement("h1", { id: "title" }, "Hello")
> ```
> ```javascript
> console.log('React.createElement("h1", { id: "title" }, "Hello")');
> ```
>
> **Explanation:** Transpilers convert JSX tags into `React.createElement` or `jsx()` factory function calls.
> 
---

### Exercise 3: JSX Expression Interpolation Rules

**Problem:** Explain why booleans, null, and undefined render nothing in JSX `{false}`.

**Expected output:**
> [!check]- Answer
> ```text
> Booleans, null, and undefined render empty nodes
> ```
> ```javascript
> console.log("Booleans, null, and undefined render empty nodes");
> ```
>
> **Explanation:** JSX ignores nullish and boolean values to facilitate conditional rendering (`cond && <Tag />`).
> 
> 
---

## 7. Related Terms
- [Babel](babel.md) — The transpiler that converts JSX into `React.createElement()`.
- [Template Literals](../level_08/template_literals.md) — A native JS feature that allows embedding expressions in strings, often compared to JSX.
- [SPA](spa.md) — Related concept: SPA.

---

## 8. Key Takeaways
- JSX allows you to write HTML-like markup directly inside JavaScript files.
- It is heavily used in React and similar UI libraries.
- It is NOT valid JavaScript. It must be compiled by Babel into nested function calls.
- You can embed live JavaScript expressions inside JSX using curly braces `{}`.
- You must use camelCase DOM properties (like `className`) instead of standard HTML attributes (like `class`).
```
