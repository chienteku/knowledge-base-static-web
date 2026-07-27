# window object / BOM

> **Level 5 — DOM & Browser Environment**
> The browser global object hosting timers, location, etc.

---

## 1. Prerequisites
- [Global Scope](../level_03/global_scope.md) — The outermost execution scope in which variables are defined.
- [JavaScript Engine](./javascript_engine.md) — The program (like V8) that parses, compiles, and executes JavaScript code.

---

## 2. Term Category
- **Browser API / DOM**

---

## 3. Environment Context
- **Browser-only**: Only exists in web browsers. If accessed in Node.js, it throws a `ReferenceError`.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When JavaScript runs inside a web browser, it needs an entry point to interact with the browser's environment—such as changing the page URL, opening new tabs, detecting screen sizing, or setting timers. To support this, browser vendors created the **Browser Object Model (BOM)**, with the **`window`** object at its core.

The `window` object plays two critical roles in front-end development:
1. **The Global Namespace:** It represents the execution environment's global object. Any global variable declared with `var` or functions declared in the global scope automatically become properties and methods on `window` (e.g. `window.myGlobalVar`).
2. **The Browser Interface:** It hosts browser-only APIs and features, such as `window.location` (routing/URL controls), `window.localStorage` (storage), and `window.alert()`.

### (2) Reality Metaphor
The `window` object is like the dashboard and controls inside a pilot's cockpit. The cockpit cockpit itself is the browser window. The dashboard contains the control dials showing where the plane currently is (`window.location`), buttons to look back at the route trajectory (`window.history`), alarm bells (`window.alert`), and gauges measuring cockpit sizing (`window.innerWidth`).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Accessing global scope properties through window
window.console.log("Hello!"); // window hosts console

// Reading the viewport dimension properties
console.log("Viewport Width:", window.innerWidth);
console.log("Viewport Height:", window.innerHeight);
```

#### Fuller Example
```javascript
// Redirection logic and query string parsing using BOM APIs
function runBrowserChecks() {
  // 1. Check if window is defined (safe guard for SSR environments)
  if (typeof window === "undefined") {
    console.log("This code is running on a server (Node.js). 'window' is unavailable.");
    return;
  }

  console.log("Current page URL:", window.location.href);

  // 2. Alert the user if the viewport is too small
  if (window.innerWidth < 480) {
    window.alert("You are viewing this page on a mobile device!");
  }

  // 3. Dynamic redirection using location API
  // Executing this would navigate the browser to Google
  // window.location.assign("https://google.com");
}

runBrowserChecks();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use `window` in Server-side Code (Node.js/Next.js)

**The mistake:** Accessing `window` in isomorphic code (code that runs on both the server and browser, like Next.js page components or React hydration steps) without checking its existence.

**Why it's wrong:** The server-side environment (Node.js) has no browser window and therefore does not have a global `window` object. Trying to read `window` on the server throws a runtime crash.

*Incorrect:*
```javascript
// Inside a Next.js Server Component or Hydration cycle:
const token = window.localStorage.getItem("token"); // ReferenceError: window is not defined
```

*Fix:*
```javascript
// Check typeof window first before accessing browser-only APIs
if (typeof window !== "undefined") {
  const token = window.localStorage.getItem("token");
  console.log(token);
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Window Bom Callbacks

**The mistake:** Passing methods from Window Bom instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "window_bom",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "window_bom",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Window Bom Operations

**The mistake:** Executing asynchronous operations within Window Bom without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/window_bom"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/window_bom");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in window_bom: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Redirect Check

**Problem:** Complete the code to redirect the browser to `"https://example.com"` *only* if the current hostname is `"localhost"`.

```javascript
if (typeof window !== "undefined") {
  const currentHostname = window.location.hostname;
  
  if (currentHostname === "localhost") {
    // Redirect to https://example.com
    // Write redirection statement here
  }
}
```

> [!check]- Answer
> - You can trigger a redirect by assigning a string URL to `window.location.href`.

---

### Exercise 2: Inspecting Location API

**Problem:** Read `window.location.href` and `window.location.search` query parameters.

**Expected output:**
```text
Location API inspected
```

> [!check]- Answer
> ```javascript
> console.log("Location API inspected");
> ```
>
> **Explanation:** `window.location` supplies URL metadata and navigation methods.

### Exercise 3: Detecting Window Inner Dimensions

**Problem:** Access `window.innerWidth` and `window.innerHeight` viewport dimensions.

**Expected output:**
```text
Viewport dimensions retrieved
```

> [!check]- Answer
> ```javascript
> console.log("Viewport dimensions retrieved");
> ```
>
> **Explanation:** `window.innerWidth` and `innerHeight` measure active browser viewport sizes.

---

---

## 7. Related Terms
- [DOM (Document Object Model)](./dom.md) — The document object (`window.document`) which maps the HTML page.
- [Web Storage (`localStorage` / `sessionStorage`)](./web_storage.md) — Persistent key-value storage hosted on the window object.

---

## 8. Key Takeaways
- The `window` object is the global context in a web browser environment; all global properties and variables reside on it.
- The `window` object exposes the Browser Object Model (BOM) for page routing (`location`), history management (`history`), and screen layouts (`innerWidth`).
- `window` is browser-only and is not defined in Node.js/server environments; always check `typeof window !== "undefined"` when writing SSR-safe code.
