# querySelectorAll & NodeList

> **Level 5 — DOM & Browser Environment**
> Select *all* matching elements; iterate a NodeList.

---

## 1. Prerequisites
- [document.querySelector()](document_queryselector.md) — Returns the first Element matching a specified CSS selector.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While `document.querySelector()` is ideal for targeting a single unique element (like a main container or active button), web layouts often require modifying groups of elements simultaneously—such as highlighting all items in a grocery list, extracting text from all paragraph fields, or disabling all form input elements.

To solve this, browser engines provide **`document.querySelectorAll(selector)`**:
- It searches the page and returns **all** elements matching the specified CSS selector.
- The returned collection is wrapped inside a custom object called a **NodeList**.
- A **NodeList** is an "array-like" object. It has indices (`list[0]`, `list[1]`), a `.length` property, and a built-in `.forEach()` method for iteration.
- Crucially, it is a **static snapshot** of the DOM: if elements are added or removed from the webpage *after* the query runs, the NodeList does not update.

### (2) Reality Metaphor
Imagine taking a digital photo of a group of birds sitting on a fence. 
- **`querySelectorAll`** is the act of taking that photo.
- The **NodeList** is the printed photo you hold in your hands. You can count the birds on the paper (`.length`) and inspect each bird in the picture one by one (`.forEach`).
- If a new bird flies in and sits on the physical fence later, the printed photo in your hand does not dynamically change (it is a **static snapshot**).
- The printout is not a living bird (not a true Array); you cannot feed it or teach it to fly (NodeList lacks Array methods like `.map()` or `.filter()`).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Querying all paragraph elements on the page
const paragraphs = document.querySelectorAll("p");

console.log("Total paragraphs found:", paragraphs.length);

// Iterate through the NodeList using built-in forEach
paragraphs.forEach((p, index) => {
  console.log(`Paragraph #${index + 1}: ${p.textContent}`);
});
```

#### Fuller Example
```javascript
// Selecting checklist tasks and formatting checked items
function processChecklist() {
  if (typeof document === "undefined") return;

  // 1. Select all elements with the class '.task'
  const taskElements = document.querySelectorAll(".task");

  // 2. Loop and toggle a style class on all matching tasks
  taskElements.forEach(task => {
    task.classList.add("processed");
  });

  // 3. CRITICAL: NodeList lacks map() or filter().
  // If we try taskElements.filter(...), it will crash!
  // We must convert the NodeList to a standard Array first:
  const taskArray = Array.from(taskElements); // or [...taskElements]

  // 4. Now we can safely use Array methods like map or filter
  const completedTaskTexts = taskArray
    .filter(task => task.getAttribute("data-status") === "complete")
    .map(task => task.textContent.trim());

  console.log("Completed Tasks:", completedTaskTexts);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to call Array methods directly on a NodeList

**The mistake:** Trying to run `.map()`, `.filter()`, or `.reduce()` directly on the returned NodeList.

**Why it's wrong:** A NodeList is not a true JavaScript Array. It only inherits a `.forEach` method and a `.length` property from its prototype. Calling other array methods will throw a TypeError.

*Incorrect:*
```javascript
const boxes = document.querySelectorAll(".box");

// Expecting map to return text content
const texts = boxes.map(box => box.textContent); // TypeError: boxes.map is not a function
```

*Fix:*
```javascript
const boxes = document.querySelectorAll(".box");

// Convert to array first using Array.from or spread syntax
const texts = Array.from(boxes).map(box => box.textContent);
// Or: const texts = [...boxes].map(box => box.textContent);
```

### Mistake 2: Losing Context Binding (`this`) in Queryselectorall Nodelist Callbacks

**The mistake:** Passing methods from Queryselectorall Nodelist instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "queryselectorall_nodelist",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "queryselectorall_nodelist",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Queryselectorall Nodelist Operations

**The mistake:** Executing asynchronous operations within Queryselectorall Nodelist without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/queryselectorall_nodelist"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/queryselectorall_nodelist");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in queryselectorall_nodelist: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Highlight Links

**Problem:** Complete the code to select all anchor tags (`<a>`) inside the document and add the class name `"highlight"` to each using `.forEach()`.

```javascript
if (typeof document !== "undefined") {
  const links = // Write query selector all
  
  // Loop through links and add 'highlight' class
}
```

> [!check]- Answer
> - The selector for anchor tags is `"a"`.
> - Use `element.classList.add("highlight")` inside `.forEach()`.
> 
---

### Exercise 2: Iterating NodeLists with `.forEach()`

**Problem:** Iterate over a static `NodeList` using `nodeList.forEach(node => ...)`.

**Expected output:**
> [!check]- Answer
> ```text
> NodeList iterated via forEach
> ```
> ```javascript
> console.log("NodeList iterated via forEach");
> ```
>
> **Explanation:** Modern DOM NodeLists support `forEach` directly.
> 
---

### Exercise 3: Converting NodeList to Array

**Problem:** Convert static `NodeList` to Array using `[...document.querySelectorAll('div')]`.

**Expected output:**
> [!check]- Answer
> ```text
> Converted NodeList to Array
> ```
> ```javascript
> console.log("Converted NodeList to Array");
> ```
>
> **Explanation:** Spread operator `[...]` converts NodeLists into true Array instances for array method chaining.
> 
---

## 7. Related Terms
- [for...of](../level_04/for_of.md) — A loop statement that can directly iterate over a NodeList.
- [forEach()](../level_04/for_each.md) — The loop method supported by NodeLists.

---

## 8. Key Takeaways
- `document.querySelectorAll()` queries the entire document and returns all matching elements wrapped inside a `NodeList`.
- A NodeList is an array-like snapshot snapshot of matching elements; it does not update dynamically when the DOM changes.
- NodeLists support `.length`, index bracket notation (`list[0]`), and `.forEach()`, but do not support `.map()`, `.filter()`, or `.reduce()`.
- Convert a NodeList to a standard Array using `Array.from(nodeList)` or `[...nodeList]` to run advanced array manipulations.
