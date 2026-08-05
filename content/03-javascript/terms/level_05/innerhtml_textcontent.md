# innerHTML / textContent / innerText

> **Level 5 — DOM & Browser Environment**
> Read/write element content (HTML vs text).

---

## 1. Prerequisites
- [Node](node.md) — A single point in the DOM tree.
- [DOM Manipulation (createElement, appendChild, remove)](dom_manipulation.md) — The processes of creating, inserting, and deleting nodes.
---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once you have selected an element from the DOM, you almost always want to read or update its contents—changing a button's label from "Submit" to "Saving...", or rendering a snippet of styled text. Browser engines provide three properties for this:

1. **`textContent`:** Reads or writes the raw text content inside an element and all of its descendants. It treats any input strictly as a string literal (meaning HTML tags like `<strong>` are displayed as plain characters rather than compiled). It is highly performant and secure.
2. **`innerText`:** Similar to `textContent`, but it is aware of CSS styling. It only returns text that is actually visible to the user (e.g. skipping text hidden with `display: none`). It is slower because reading it forces the browser to recalculate the page layout (layout reflow).
3. **`innerHTML`:** Reads or writes the actual HTML markup inside an element. Setting `innerHTML` tells the browser to parse the string as HTML code and compile it into fresh DOM nodes dynamically.

### (2) Critical Security Warning: Cross-Site Scripting (XSS)
While `innerHTML` is convenient for rendering rich text, it is highly dangerous. If you insert unsanitized text submitted by a user (like a message input field) using `innerHTML`, an attacker can input malicious HTML containing scripts (e.g. `<img src="invalid" onerror="stealCookies()">`). When other users load the page, the browser parses the malicious tag and executes the attacker's script. 

**Rule of thumb:** If you are inserting text, **always** use `textContent`. Only use `innerHTML` if you are rendering static, trusted, or sanitized HTML templates.

### (3) Reality Metaphor
- **`textContent`** is like a typewriter. If you feed it the text `"<b>Hello</b>"`, it literally types out the characters `"`<`"`, `"`b`"`, `"`>`"`, `"H"`, etc. The text is visible, but the bold command is ignored.
- **`innerHTML`** is like a builder reading a blueprint. If you hand it `"<b>Hello</b>"`, the builder reads the tags, builds a bold metal frame, and prints `"Hello"` inside it. If the blueprint has instructions to build a trapdoor (malicious script), the builder builds the trapdoor too.

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
const heading = document.querySelector("#title");

// textContent writes raw string safely
heading.textContent = "Welcome & Hello!"; 

// innerHTML compiles HTML elements
heading.innerHTML = "<span>Welcome & <strong>Hello!</strong></span>";
```

#### Fuller Example
```javascript
// A message board rendering scenario demonstrating XSS safety
function displayMessage(userText, containerId) {
  if (typeof document === "undefined") return;

  const chatContainer = document.getElementById(containerId);
  const messageNode = document.createElement("div");
  messageNode.className = "chat-bubble";

  // Vulnerable User Input:
  // An attacker submits: "<img src='x' onerror='alert(\"Stealing your data!\")'>"
  
  // 1. DANGEROUS/VULNERABLE APPROACH:
  // This will parse the img tag, execute the error script, and trigger an alert!
  // messageNode.innerHTML = userText; 

  // 2. SAFE APPROACH:
  // Using textContent converts any tag characters into harmless, inert text.
  // The screen will simply display: "<img src='x' onerror='...'>" without executing it.
  messageNode.textContent = userText;

  chatContainer.appendChild(messageNode);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `innerHTML` to set plain text

**The mistake:** Writing `element.innerHTML = "My Text"` when no HTML tags are present.

**Why it's wrong:** Using `innerHTML` forces the browser's HTML parser to spin up, tokenize the string, and search for tags, which wastes CPU cycles. More importantly, it leaves the code open to bugs if the text happens to contain characters like `<` or `&`.

*Incorrect:*
```javascript
const label = document.getElementById("label");
label.innerHTML = "Click here < Go Back"; // The '< Go Back' part may be parsed as an unclosed HTML tag!
```

*Fix:*
```javascript
const label = document.getElementById("label");
label.textContent = "Click here < Go Back"; // Safely renders exactly as written
```

---

### Mistake 2: Losing Context Binding (`this`) in Innerhtml Textcontent Callbacks

**The mistake:** Passing methods from Innerhtml Textcontent instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "innerhtml_textcontent",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "innerhtml_textcontent",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Innerhtml Textcontent Operations

**The mistake:** Executing asynchronous operations within Innerhtml Textcontent without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/innerhtml_textcontent"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/innerhtml_textcontent");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in innerhtml_textcontent: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Format Banner Safely

**Problem:** Complete the code to safely display the username inside `userBanner` by wrapping the text in a bold (`<strong>`) tag using safe creation methods, avoiding XSS vulnerabilities.

```javascript
const usernameInput = "<script>stealData()</script>"; // Malicious input

if (typeof document !== "undefined") {
  const banner = document.getElementById("user-banner");
  
  // Create 'strong' element
  // Set textContent to usernameInput
  // Append strong element to banner
}
```

> [!check]- Answer
> - Create a `strong` node with `document.createElement("strong")`.
> - Set its `textContent` to `usernameInput` (renders as plain text).
> - Append the node to `banner` using `.appendChild()`.

---

### Exercise 2: Safely Rendering Text with `textContent`

**Problem:** Safely escape `<script>alert(1)</script>` by setting `elem.textContent`.

**Expected output:**
> [!check]- Answer
> ```text
> Renders literal text tags without script execution
> ```
> ```javascript
> console.log("Renders literal text tags without script execution");
> ```
>
> **Explanation:** `textContent` escapes HTML entities, treating inputs purely as text strings.

---

### Exercise 3: Parsing Performance: `textContent` vs `innerText`

**Problem:** Explain why `textContent` is faster than `innerText` (innerText triggers layout reflow to check element visibility).

**Expected output:**
> [!check]- Answer
> ```text
> textContent avoids reflow layout checks
> ```
> ```javascript
> console.log("textContent avoids reflow layout checks");
> ```
>
> **Explanation:** `innerText` is aware of CSS styling and layout visibility, triggering reflow overhead.


---

## 7. Related Terms
- [DOM Manipulation (createElement, appendChild, remove)](dom_manipulation.md) — Structural node actions.
---

## 8. Key Takeaways
- Use `textContent` to read or write raw, safe text content inside nodes (highly performant).
- Use `innerHTML` to read or render compiled HTML markup templates.
- **Never** assign user-provided or untrusted inputs to `innerHTML` due to severe **Cross-Site Scripting (XSS)** security vulnerabilities.
- `innerText` works like `textContent` but respects CSS visibility; reading it is slower because it triggers page layout reflows.
