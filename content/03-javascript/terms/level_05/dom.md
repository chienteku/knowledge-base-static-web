# DOM (Document Object Model)

> **Level 5 — DOM & Browser Environment**
> An object-oriented programming interface representing the HTML document as a tree of nodes.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of key-value pairs.
- HTML Basics — Understanding of tags (like `<div>`, `<p>`).

---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**: The DOM does not exist in backend environments like Node.js.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
HTML is just a plain text file. A browser reads that text file and paints the visual website on your screen. But JavaScript cannot read or interact with a screen of pixels. To allow JavaScript to dynamically change the webpage (like hiding a menu or updating a shopping cart number), there needed to be a bridge between the HTML and JavaScript.

The browser developers created the DOM. When the browser reads your HTML file, it translates every single HTML tag into a JavaScript Object. It links these objects together into a massive "tree" structure. This tree is the Document Object Model. JavaScript can then easily modify these objects, and the browser will instantly update the screen to reflect the changes.

### (2) Reality Metaphor
If a website is a house, the HTML file is the architect's paper blueprint. 
JavaScript is the contractor who wants to remodel the house. 
The DOM is a massive 3D computer model of the house. The contractor can't easily change the paper blueprint, but they can click on the 3D model, change the color of a door from red to blue, and the actual house updates instantly.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// 'document' is the massive global Object representing the entire HTML tree
console.log(document.title); // Reads the <title> tag of the page

// JavaScript updating the DOM object. The screen will change instantly!
document.body.style.backgroundColor = "black";
```

#### Fuller Example
```javascript
/* 
Imagine this HTML exists:
<html>
  <body>
    <h1 id="title">Hello World</h1>
  </body>
</html>
*/

// JavaScript interacting with the DOM
const titleElement = document.getElementById("title");

// Modifying properties of the DOM Object
titleElement.innerText = "Hello JavaScript!";
titleElement.style.color = "blue";
titleElement.style.fontSize = "40px";
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dom Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Dom blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "dom";
```

*Fix:*
```javascript
let value = "dom";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Dom Callbacks

**The mistake:** Passing methods from Dom instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "dom",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "dom",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Dom Operations

**The mistake:** Executing asynchronous operations within Dom without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/dom"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/dom");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in dom: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Console DOM exploration

**Problem:** Open a new tab in your browser, go to any website (like google.com), and open the Developer Tools Console. Type `document.body.innerHTML = "<h1>Hacked!</h1>"`. What happens to the webpage?

**Expected output:**
> [!check]- Answer
> ```text
> The entire webpage disappears and is replaced by the word "Hacked!".
> (Don't worry, refreshing the page fixes it because the DOM is temporary!)
> ```
> - Right click -> Inspect -> Console tab.
> - This is a fun way to realize how much power JavaScript has over the browser!

---

### Exercise 2: DOM Node Hierarchy Traversal

**Problem:** State difference between `Node.ELEMENT_NODE` (type 1) and `Node.TEXT_NODE` (type 3).

**Expected output:**
> [!check]- Answer
> ```text
> Element: 1, Text: 3
> ```
> ```javascript
> console.log("Element: 1, Text: 3");
> ```
>
> **Explanation:** `nodeType` integer constants identify DOM element nodes (1) vs text content nodes (3).

---

### Exercise 3: Document Fragment Batching

**Problem:** Explain why `document.createDocumentFragment()` reduces DOM reflow performance overhead.

**Expected output:**
> [!check]- Answer
> ```text
> DocumentFragment avoids layout thrashing
> ```
> ```javascript
> console.log("DocumentFragment avoids layout thrashing");
> ```
>
> **Explanation:** Appending child nodes into off-screen `DocumentFragment` instances batches DOM inserts into 1 reflow.


---

## 7. Related Terms
- [Node](../level_05/node.md) — The individual pieces (like elements or text) that make up the DOM tree.
- [Event](../level_05/event.md) — Actions (like clicks) that happen to DOM elements.

---

## 8. Key Takeaways
- The DOM is the browser's way of turning HTML text into JavaScript Objects.
- The massive global object `document` gives you access to the entire tree.
- Changing the DOM using JavaScript automatically and instantly updates the visual webpage.
- The DOM only exists in the browser; Node.js cannot interact with the DOM.
