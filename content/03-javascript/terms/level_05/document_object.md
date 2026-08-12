# document object

> **Level 5 — DOM & Browser Environment**
> Entry point to the DOM tree for a page.

---

## 1. Prerequisites
- [DOM (Document Object Model)](dom.md) — An interface representing the HTML document as a tree of nodes.
- [Node](node.md) — A single point in the DOM tree (element, text, comment, etc.).
- [window object / BOM](window_bom.md) — The browser global object container.

---

## 2. Term Category

**Browser API / DOM (Browser-only: Only exists in web browsers. If accessed in Node.js, it throws a `ReferenceError`.)**: document object is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While the Document Object Model (DOM) defines the theoretical tree structure of a webpage, JavaScript needs a concrete object reference to interact with that tree. To provide this, browser vendors created the global **`document`** object (specifically, `window.document`).

The `document` object acts as the official **gateway or entry point** to the webpage's DOM. Without the `document` object, JavaScript would have no way to reach elements, query tags, or modify what is rendered on screen. Through `document`, you can read page metadata (e.g. `document.title`), find specific elements (e.g. `document.querySelector()`), and create new elements programmatically (e.g. `document.createElement()`).

### (2) Reality Metaphor
The DOM tree is like a physical office building, and the elements (buttons, paragraphs) are the rooms. 
The `document` object is like the **receptionist's desk** in the lobby. If a manager (JavaScript) wants to find a specific room, send a cleaning crew to room 302, or build a new annex on the side of the building, they must walk up to the receptionist's desk (`document`) first to request the building blueprint, key access, or work order forms.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Reading and writing page metadata directly
console.log("Current Title:", document.title); // e.g. "My Homepage"

// Modify the page title in the browser tab tab
document.title = "Updated Webpage Title";

// Accessing the main body tag element directly
const bodyElement = document.body;
console.log("Body node:", bodyElement);
```

#### Fuller Example
```javascript
// A safe browser check and node creation logic using the document object
function renderWelcomeBanner(username) {
  // 1. Safe guard for isomorphic (SSR) environments
  if (typeof document === "undefined") {
    console.log("Running on server; document is not available.");
    return;
  }

  // 2. Querying elements via document entry point
  const mainContainer = document.querySelector("#main-layout");

  if (mainContainer) {
    // 3. Creating a new HTML element node using document
    const welcomeHeading = document.createElement("h1");
    welcomeHeading.textContent = `Welcome back, ${username}!`;

    // 4. Appending the element to the container
    mainContainer.appendChild(welcomeHeading);
  } else {
    console.log("Main container element was not found in the DOM.");
  }
}

renderWelcomeBanner("Brendan");
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `document.write()` in Modern Web Apps

**The mistake:** Calling `document.write("text")` to add content to the page after it has finished loading.

**Why it's wrong:** While `document.write()` works during the initial parsing phase of the webpage, calling it after the page has finished loading (e.g. inside an event listener or timeout) completely clears and overwrites the entire existing document, deleting all existing HTML elements and scripts. Modern applications should instead use DOM manipulation methods like `.appendChild()`.

*Incorrect:*
```javascript
// User clicks a button after the page is loaded:
button.addEventListener("click", () => {
  document.write("<p>Thanks for clicking!</p>"); // Overwrites and clears the whole page!
});
```

*Fix:*
```javascript
button.addEventListener("click", () => {
  const paragraph = document.createElement("p");
  paragraph.textContent = "Thanks for clicking!";
  document.body.appendChild(paragraph); // Appends safely
});
```

---

### Mistake 2: Losing Context Binding (`this`) in Document Object Callbacks

**The mistake:** Passing methods from Document Object instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "document_object",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "document_object",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Document Object Operations

**The mistake:** Executing asynchronous operations within Document Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/document_object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/document_object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in document_object: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Document Ready State & Meta Tag Injector

**Scenario:** A web analytics loader inspects document.readyState and injects custom meta elements into document.head.

**Requirements:**
1. Write injectMetaTag(name, content).
2. Check document.head.
3. Create meta element and set attributes.
4. Append meta to document.head.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function injectMetaTag(name, content) {
>   if (!globalThis.document || !document.head) return false;
>
>   const meta = document.createElement("meta");
>   meta.setAttribute("name", name);
>   meta.setAttribute("content", content);
>   document.head.appendChild(meta);
>   return true;
> }
>
> // Verification tests
> const mockHead = {
>   children: [],
>   appendChild(child) { this.children.push(child); }
> };
> globalThis.document = {
>   head: mockHead,
>   createElement(tag) { return { tag, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }; }
> };
>
> console.assert(injectMetaTag("author", "Acme Corp") === true, "Test 1 Failed");
> console.assert(mockHead.children[0].attrs.name === "author", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **document Object Purpose**: The document object represents the web page loaded in the browser window, serving as entry point for DOM interaction.
> 2. **document.head & document.body**: Built-in properties pointing directly to the <head> and <body> DOM elements.
> 3. **DOM Node Creation**: Methods like document.createElement() instantiate new DOM elements attached to the document owner.
> 
---

### Exercise 2: Document Cookie Inspection Guard

**Scenario:** An authentication middleware reads document.cookie strings and extracts target cookie values safely.

**Requirements:**
1. Write getCookieValue(cookieName).
2. Inspect document.cookie string.
3. Parse key-value pairs.
4. Return target cookie value or null.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getCookieValue(cookieName) {
>   if (!globalThis.document || typeof document.cookie !== "string") return null;
>   const cookies = document.cookie.split(";");
>   for (const item of cookies) {
>     const [key, val] = item.trim().split("=");
>     if (key === cookieName) return val;
>   }
>   return null;
> }
>
> // Verification tests
> globalThis.document = { cookie: "theme=dark; session=abc123xyz" };
> console.assert(getCookieValue("theme") === "dark", "Test 1 Failed");
> console.assert(getCookieValue("session") === "abc123xyz", "Test 2 Failed");
> console.assert(getCookieValue("missing") === null, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **document.cookie Access**: document.cookie exposes a semicolon-separated string of key=value pairs for the current domain.
> 2. **String Parsing Necessity**: Accessing document.cookie requires string parsing to locate specific cookie keys.
> 3. **Security Restrictions**: HttpOnly cookies cannot be read via document.cookie in client-side scripts.
> 
---

### Exercise 3: Dynamic Page Title & Favicon Manipulator

**Scenario:** A notification badge manager updates document.title dynamically to display unread notification counts.

**Requirements:**
1. Write updateNotificationTitle(baseTitle, unreadCount).
2. If unreadCount > 0, set document.title to `(${unreadCount}) ${baseTitle}`.
3. Else reset to baseTitle.
4. Return current title.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function updateNotificationTitle(baseTitle, unreadCount) {
>   if (!globalThis.document) return baseTitle;
>
>   if (unreadCount > 0) {
>     document.title = `(${unreadCount}) ${baseTitle}`;
>   } else {
>     document.title = baseTitle;
>   }
>   return document.title;
> }
>
> // Verification tests
> globalThis.document = { title: "Dashboard" };
> updateNotificationTitle("Dashboard", 5);
> console.assert(globalThis.document.title === "(5) Dashboard", "Test 1 Failed");
> updateNotificationTitle("Dashboard", 0);
> console.assert(globalThis.document.title === "Dashboard", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **document.title Property**: document.title gets or sets the text title displayed in browser tab headers.
> 2. **Real-Time Tab Feedback**: Updating document.title informs users of unread messages or status changes when tabs are inactive.
> 3. **DOM Document Binding**: Property changes on document reflect instantly in host browser tab chrome.
---

## 6. Related Terms
- [DOM (Document Object Model)](dom.md) — The structured tree API of HTML nodes.
- [document.querySelector()](document_queryselector.md) — The primary document selection method.
- [DOMContentLoaded / load events](domcontentloaded_load.md) — Related concept: DOMContentLoaded / load events.

---

## 7. Key Takeaways
- The global `document` object is the root entry point for traversing and manipulating the page's HTML structure.
- It is a property of the global `window` object (`window.document`).
- Key properties include `document.title`, `document.body`, and `document.head`.
- Key methods include `document.createElement()`, `document.querySelector()`, and `document.getElementById()`.
- Avoid using legacy `document.write()` calls because they overwrite the entire page structure when called after initial page load.
