# DOM Manipulation (createElement, appendChild, remove)

> **Level 5 — DOM & Browser Environment**
> Create/insert/delete nodes dynamically.

---

## 1. Prerequisites
- [DOM (Document Object Model)](dom.md) — The structured tree API of HTML nodes.
- [Node](node.md) — A single point in the DOM tree.
- [document object](document_object.md) — The entry point gateway to the DOM tree.

---

## 2. Term Category

**Browser API / DOM (Browser-only: Only exists in web browsers.)**: DOM Manipulation (createElement, appendChild, remove) is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Static HTML files are immutable on the user's screen once loaded. To build interactive web applications—like displaying new chat messages, rendering items in a shopping cart, or hiding alerts—JavaScript needs to dynamically modify the document tree structure at runtime. This process is called **DOM Manipulation**.

The browser DOM API provides three core stages of node lifecycle controls:
1. **Creation (`document.createElement`):** Allocates a fresh element node in system memory. Initially, this element is "orphaned"—it exists in memory but is not yet attached to the webpage.
2. **Insertion (`appendChild` / `insertBefore`):** Snaps the orphaned element into the active DOM tree under a parent element.
3. **Deletion (`remove` / `removeChild`):** Detaches the element from the DOM tree, removing it from the user's screen.

### (2) Reality Metaphor
Imagine a plastic Lego pegboard representing your webpage. 
- **`document.createElement("div")`** is like opening a Lego storage box and pulling out a new blue brick. The brick is sitting in your hands (memory); you can color it or draw on it, but it isn't visible on the display layout yet.
- **`appendChild`** is the act of physically snapping the new brick onto a peg under a larger structure (the parent element) on the pegboard.
- **`remove()`** is like grabbing that brick and pulling it off the pegboard, making it disappear from the model.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// 1. Create a new div element in memory
const alertBox = document.createElement("div");
alertBox.textContent = "Operation successful!";

// 2. Append the div to the document body to make it visible
document.body.appendChild(alertBox);

// 3. Remove the alert box from the screen
alertBox.remove();
```

#### Fuller Example
```javascript
// Dynamically building a shopping item list with a functional delete button
function addShoppingItem(itemName) {
  if (typeof document === "undefined") return;

  const shoppingList = document.querySelector("#grocery-list");

  // 1. Create the container list item element (<li>)
  const listItem = document.createElement("li");
  listItem.className = "list-item";

  // 2. Create a span for the text content
  const textSpan = document.createElement("span");
  textSpan.textContent = itemName;
  listItem.appendChild(textSpan);

  // 3. Create a delete button (<button>)
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-btn";
  
  // Attach an event listener directly to the new button before appending
  deleteBtn.addEventListener("click", function() {
    // 4. remove() removes the list item from the DOM completely
    listItem.remove(); 
    console.log(`${itemName} removed from list.`);
  });

  listItem.appendChild(deleteBtn);

  // 5. Append the fully assembled list item to the <ul> container
  shoppingList.appendChild(listItem);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Append Created Elements

**The mistake:** Calling `document.createElement()` and editing its properties, but wondering why it doesn't appear on the page.

**Why it's wrong:** Creating an element only instantiates it in memory. It remains completely invisible until you explicitly link it to the page structure using a method like `.appendChild()`.

*Incorrect:*
```javascript
const newHeading = document.createElement("h2");
newHeading.textContent = "Welcome to the site!";
// Invisible in memory! Never appended.
```

*Fix:*
```javascript
const newHeading = document.createElement("h2");
newHeading.textContent = "Welcome to the site!";

// Append to body or a container:
document.body.appendChild(newHeading); 
```

### Mistake 2: Losing Context Binding (`this`) in Dom Manipulation Callbacks

**The mistake:** Passing methods from Dom Manipulation instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "dom_manipulation",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "dom_manipulation",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Dom Manipulation Operations

**The mistake:** Executing asynchronous operations within Dom Manipulation without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/dom_manipulation"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/dom_manipulation");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in dom_manipulation: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Dynamic Product Card Builder with append()

**Scenario:** An e-commerce UI renderer dynamically creates product card containers using createElement() and appends child elements.

**Requirements:**
1. Write createProductCard(title, price).
2. Create div container, heading, and price paragraph.
3. Append elements using append().
4. Return container element.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createProductCard(title, price) {
>   if (!globalThis.document) return null;
>
>   const card = document.createElement("div");
>   card.className = "product-card";
>
>   const titleEl = document.createElement("h3");
>   titleEl.textContent = title;
>
>   const priceEl = document.createElement("p");
>   priceEl.textContent = `$${Number(price).toFixed(2)}`;
>
>   card.append(titleEl, priceEl);
>   return card;
> }
>
> // Verification tests
> globalThis.document = {
>   createElement(tag) {
>     return {
>       tag,
>       children: [],
>       append(...nodes) { this.children.push(...nodes); }
>     };
>   }
> };
> const card = createProductCard("Laptop", 999.99);
> console.assert(card.children.length === 2, "Test 1 Failed");
> console.assert(card.children[0].textContent === "Laptop", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **createElement() Method**: document.createElement(tagName) instantiates a new Element node of specified tag name.
> 2. **append() vs appendChild()**: Element.append() allows appending multiple Node objects and string primitives at once.
> 3. **In-Memory DOM Creation**: Creating nodes in memory before attaching to document minimizes live layout reflows.
> 
---

### Exercise 2: Safe Element Removal & Replacement

**Scenario:** A UI task list manager removes completed task items using Element.remove() and replaces old elements using replaceWith().

**Requirements:**
1. Write replaceTaskItem(oldEl, newText).
2. Create new li element with newText.
3. Invoke oldEl.replaceWith(newEl).
4. Return new element.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function replaceTaskItem(oldEl, newText) {
>   if (!oldEl || typeof oldEl.replaceWith !== "function" || !globalThis.document) return null;
>
>   const newEl = document.createElement("li");
>   newEl.textContent = newText;
>   oldEl.replaceWith(newEl);
>   return newEl;
> }
>
> // Verification tests
> let replacedWithNode = null;
> const mockOld = {
>   replaceWith(node) { replacedWithNode = node; }
> };
> const newLi = replaceTaskItem(mockOld, "Updated Task");
> console.assert(replacedWithNode === newLi, "Test 1 Failed");
> console.assert(newLi.textContent === "Updated Task", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Element.remove() Method**: Element.prototype.remove() removes the target element directly from its parent DOM tree.
> 2. **Element.replaceWith() Method**: Element.prototype.replaceWith(...nodes) replaces the target element with specified new node objects.
> 3. **Clean Parent Detachment**: Modern manipulation methods eliminate legacy parentNode.removeChild(child) boilerplate.
> 
---

### Exercise 3: Adjacent HTML Insertion Engine via insertAdjacentHTML()

**Scenario:** A notification banner inserts alert elements at specific positions relative to a container using insertAdjacentHTML().

**Requirements:**
1. Write insertAlert(containerEl, position, alertHtml).
2. Use containerEl.insertAdjacentHTML(position, alertHtml).
3. Validate position string ("beforebegin", "afterbegin", "beforeend", "afterend").
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function insertAlert(containerEl, position, alertHtml) {
>   const validPositions = ["beforebegin", "afterbegin", "beforeend", "afterend"];
>   if (!containerEl || !validPositions.includes(position) || typeof containerEl.insertAdjacentHTML !== "function") {
>     return false;
>   }
>   containerEl.insertAdjacentHTML(position, alertHtml);
>   return true;
> }
>
> // Verification tests
> let insertedPos = null;
> let insertedText = null;
> const mockContainer = {
>   insertAdjacentHTML(pos, html) { insertedPos = pos; insertedText = html; }
> };
>
> const ok = insertAlert(mockContainer, "afterbegin", "<div class='alert'>Success</div>");
> console.assert(ok === true, "Test 1 Failed");
> console.assert(insertedPos === "afterbegin", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **insertAdjacentHTML() API**: Parses specified HTML string and inserts resulting nodes at specified position relative to target element.
> 2. **Four Standard Positions**: 'beforebegin' (before target), 'afterbegin' (inside target before first child), 'beforeend' (inside target after last child), 'afterend' (after target).
> 3. **Performance Efficiency**: Avoids re-parsing existing innerHTML children when adding new HTML markup.
---

## 6. Related Terms
- [innerHTML / textContent / innerText](innerhtml_textcontent.md) — Properties used to read or update text/HTML inside nodes.
- [classList & setAttribute/getAttribute](classlist_attributes.md) — Modifying node styling classes and attributes.
- [DOM (Document Object Model)](dom.md) — Related concept: DOM (Document Object Model).

---

## 7. Key Takeaways
- DOM Manipulation is the runtime addition, removal, or modification of webpage nodes using JavaScript.
- `document.createElement("tag")` initializes a new element in memory (orphaned state).
- An element only appears on-screen when appended to the active DOM tree via `parentElement.appendChild(childNode)`.
- Use the modern `node.remove()` method to directly delete an element from the page.
- Appending the same node instance to a new location moves it; use `node.cloneNode(true)` if you need to duplicate elements.
