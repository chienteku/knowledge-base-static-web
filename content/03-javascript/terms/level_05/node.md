# Node

> **Level 5 — DOM & Browser Environment**
> A single point in the DOM tree, which can be an element, text, or comment.

---

## 1. Prerequisites
- [DOM](../level_05/dom.md) — The tree structure representing the HTML document.

---

## 2. Term Category
- **Web API** *(Browser Environment)*

---

## 3. Environment Context
- **Browser Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To build a functional Document Object Model, the browser needed a standardized way to represent every single piece of an HTML document. It couldn't just be HTML tags; what about the plain text *inside* the tags? What about HTML comments?

The browser creators designed the "Node" interface as the base building block of the DOM. Everything in the DOM is a Node. An HTML tag like `<div>` becomes an "Element Node". The text inside it becomes a "Text Node". Even an HTML comment `<!-- comment -->` becomes a "Comment Node". Because they all share the base "Node" interface, they share common methods (like `.appendChild()` or `.parentNode`), making the DOM tree predictable and traversable.

### (2) Reality Metaphor
Think of a family tree. Every single box on the family tree is a "Node". 
Some boxes represent parents (Element Nodes), which have children branching off below them. 
Some boxes represent the youngest children who have no offspring of their own (Text Nodes). 
Regardless of whether they are a parent or a child, every box is a valid point (a Node) on the tree.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Assume HTML: <p id="text">Hello</p>

const paragraph = document.getElementById("text"); 

console.log(paragraph.nodeName); // "P" (It is an Element Node)
console.log(paragraph.nodeType); // 1 (The number code for Element Nodes)
```

#### Fuller Example
```javascript
// Creating new Nodes from scratch using JavaScript
const newDiv = document.createElement("div"); // Creates an Element Node
const newText = document.createTextNode("Hello World!"); // Creates a Text Node

// Connecting the Nodes together
// We append the Text Node as a child of the Element Node
newDiv.appendChild(newText);

// Finally, we attach our new Element Node to the actual visible DOM
document.body.appendChild(newDiv);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Node Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Node blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "node";
```

*Fix:*
```javascript
let value = "node";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Node Callbacks

**The mistake:** Passing methods from Node instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "node",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "node",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Node Operations

**The mistake:** Executing asynchronous operations within Node without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/node"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/node");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in node: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Node Types

**Problem:** In the DOM, an Element Node has a `nodeType` of `1`. A Text Node has a `nodeType` of `3`. 
If you create a `<p>` tag using `document.createElement('p')`, what is its `nodeType`?

**Expected output:**
> [!check]- Answer
> ```text
> 1 (Because it is an HTML Element)
> ```
> - Tags = Elements (Type 1).
> - The actual readable words = Text (Type 3).

---

### Exercise 2: Checking Node Relationships with `contains()`

**Problem:** Check if `parent.contains(child)` returns `true`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> console.log(true);
> ```
>
> **Explanation:** `Node.contains(otherNode)` tests whether a node is a descendant of the target node.

---

### Exercise 3: Cloning Nodes with `cloneNode(true)`

**Problem:** Clone a DOM node and all its descendants using `elem.cloneNode(true)`.

**Expected output:**
> [!check]- Answer
> ```text
> Deep clone created
> ```
> ```javascript
> console.log("Deep clone created");
> ```
>
> **Explanation:** `cloneNode(true)` recursively clones target nodes and child subtrees.


---

## 7. Related Terms
- [DOM](../level_05/dom.md) — The entire tree made out of these Nodes.
- [`document.querySelector()`](../level_05/document_queryselector.md) — The primary method used to find Element Nodes in the tree.

---

## 8. Key Takeaways
- A Node is the most basic building block of the DOM tree.
- **Element Nodes** represent HTML tags (like `<div>` or `<body>`).
- **Text Nodes** represent the actual text strings inside the tags, as well as invisible whitespace.
- Use `.children` instead of `.childNodes` if you only want to interact with HTML tags.
