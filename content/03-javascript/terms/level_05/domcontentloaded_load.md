# DOMContentLoaded / load events

> **Level 5 — DOM & Browser Environment**
> Lifecycle events for when the page/DOM is ready.

---

## 1. Prerequisites
- [Event](event.md) — An action or occurrence recognized by browser software.
- [Event Listener](event_listener.md) — A procedure that waits for events to occur on an element.
- [document object](document_object.md) — The entry point gateway to the DOM tree.

---

## 2. Term Category

**Browser API / DOM (Browser-only: Only exists in web browsers.)**: DOMContentLoaded / load events is a fundamental concept in this technology stack. **Level 5 — DOM & Browser Environment**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A web browser parses an HTML document line-by-line from top to bottom, building the DOM tree dynamically. If a browser encounters a `<script>` tag in the HTML `<head>` and executes it immediately, the script will attempt to query elements (like `#submit-btn`) that the browser's HTML parser hasn't even reached yet, resulting in `null` references and crashes.

To execute JavaScript code safely after elements exist, the browser fires page lifecycle events:
- **`DOMContentLoaded` (fired on `document`):** Fired when the HTML document has been completely parsed and the DOM tree is built. External resources like images, stylesheets, and iframe sub-elements might still be loading, but elements are ready to query and manipulate.
- **`load` (fired on `window`):** Fired later, when the entire webpage has fully loaded, including all dependent resources (stylesheets, images, scripts, subframes). This is useful when you need to measure actual image dimensions or wait for styles to settle.

### (2) Reality Metaphor
Imagine moving into a brand-new house.
- **`DOMContentLoaded`** is the moment the builder hands you the keys. The walls, roof, doors, and plumbing are finished (the DOM structure is complete). You can walk in and start setting up devices. However, the furniture truck hasn't arrived, and the walls are unpainted (images and styles are still loading).
- **`load`** is the moment the decorators leave, all the furniture is installed, the pictures are hung on the walls, and the landscape is complete. The house is 100% finished.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Safe entry point for DOM manipulation
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM tree is fully parsed. Safe to select elements!");
  const mainBtn = document.querySelector("#main-btn");
});

// Entry point for styling measurements or asset dependencies
window.addEventListener("load", function() {
  console.log("Entire page fully loaded, including images and stylesheets.");
});
```

#### Fuller Example
```javascript
// Initializing a web application safely
function initializeApp() {
  console.log("Setting up event listeners, routing, and data feeds...");
  // document.querySelector("#app").innerHTML = "App Ready!";
}

function measureLoadedImages() {
  const bannerImg = document.querySelector("#hero-banner");
  if (bannerImg) {
    // Reading dimensions requires waiting for load, so the image binary is loaded
    console.log(`Banner Image Size: ${bannerImg.offsetWidth}x${bannerImg.offsetHeight}`);
  }
}

// 1. DOMContentLoaded is the standard place to bootstrap scripts
document.addEventListener("DOMContentLoaded", function(event) {
  console.log("1. DOMContentLoaded fired.");
  initializeApp();
});

// 2. Load is the standard place to check assets/performance analytics
window.addEventListener("load", function(event) {
  console.log("2. Window load fired.");
  measureLoadedImages();
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying DOM Elements in Head Scripts Without Waiting

**The mistake:** Placing JavaScript in the `<head>` of an HTML document that queries DOM elements directly without waiting for lifecycle events.

**Why it's wrong:** When the engine runs the script, the HTML body hasn't been parsed yet. Query selectors return `null`, throwing immediate errors.

*Incorrect:*
```html
<!-- HTML Structure: -->
<head>
  <script>
    const btn = document.querySelector("#submit");
    btn.addEventListener("click", () => {}); // TypeError: Cannot read properties of null (reading 'addEventListener')
  </script>
</head>
<body>
  <button id="submit">Submit</button>
</body>
```

*Fix:*
```html
<head>
  <script>
    // Wrap code in DOMContentLoaded
    document.addEventListener("DOMContentLoaded", () => {
      const btn = document.querySelector("#submit");
      btn.addEventListener("click", () => { console.log("Clicked!"); });
    });
  </script>
</head>
```
*(Alternatively, in modern HTML, you can add the `defer` attribute to the script tag `<script defer src="app.js"></script>`, which automatically waits for DOM parsing to finish).*

---

### Mistake 2: Losing Context Binding (`this`) in Domcontentloaded Load Callbacks

**The mistake:** Passing methods from Domcontentloaded Load instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "domcontentloaded_load",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "domcontentloaded_load",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Domcontentloaded Load Operations

**The mistake:** Executing asynchronous operations within Domcontentloaded Load without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/domcontentloaded_load"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/domcontentloaded_load");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in domcontentloaded_load: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Fast Interactive Script Initialization Listener

**Scenario:** A web application registers startup initializers on DOMContentLoaded to execute code as soon as HTML DOM parsing completes.

**Requirements:**
1. Write registerFastInit(initFn).
2. Check if document.readyState is "interactive" or "complete".
3. If already ready, call initFn instantly; else add DOMContentLoaded listener.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function registerFastInit(initFn) {
>   if (!globalThis.document || typeof initFn !== "function") return false;
>
>   if (document.readyState === "interactive" || document.readyState === "complete") {
>     initFn();
>     return true;
>   }
>
>   document.addEventListener("DOMContentLoaded", initFn);
>   return true;
> }
>
> // Verification tests
> let initCalled = false;
> globalThis.document = {
>   readyState: "interactive",
>   addEventListener(event, fn) {}
> };
> registerFastInit(() => { initCalled = true; });
> console.assert(initCalled === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **DOMContentLoaded Event**: Fires when HTML document has been completely parsed and DOM tree built, without waiting for stylesheets/images.
> 2. **load Event Difference**: The window load event waits for all external resources (images, subframes, stylesheets) to finish loading.
> 3. **readyState Check Pattern**: Checking document.readyState handles scripts loaded asynchronously after DOMContentLoaded fired.
> 
---

### Exercise 2: Image & Media Asset Preloader Listener

**Scenario:** A image gallery preloader listens to the window load event to verify all external image assets have completed downloading.

**Requirements:**
1. Write registerMediaPreloader(onAllLoaded).
2. Attach window.addEventListener("load", onAllLoaded).
3. Verify execution upon page asset completion.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function registerMediaPreloader(onAllLoaded) {
>   if (!globalThis.window || typeof window.addEventListener !== "function") return false;
>   window.addEventListener("load", onAllLoaded);
>   return true;
> }
>
> // Verification tests
> let loadedEventFired = false;
> globalThis.window = {
>   addEventListener(evt, fn) {
>     if (evt === "load") { fn(); loadedEventFired = true; }
>   }
> };
> registerMediaPreloader(() => {});
> console.assert(loadedEventFired === true, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **window load Event**: The load event fires after DOM structure AND all dependent resources (images, sub-frames, async scripts) finish loading.
> 2. **Asset Loading Guarantee**: Essential for image processing or canvas rendering that requires fully loaded media assets.
> 3. **Execution Ordering**: Fires strictly after DOMContentLoaded has completed.
> 
---

### Exercise 3: Document readyState Transition Monitor

**Scenario:** A diagnostic tool tracks transitions across document.readyState states ('loading' -> 'interactive' -> 'complete').

**Requirements:**
1. Write monitorReadyState(stateCallback).
2. Listen to readystatechange event on document.
3. Pass current document.readyState to stateCallback.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function monitorReadyState(stateCallback) {
>   if (!globalThis.document || typeof document.addEventListener !== "function") return false;
>
>   document.addEventListener("readystatechange", () => {
>     stateCallback(document.readyState);
>   });
>   return true;
> }
>
> // Verification tests
> let recordedState = null;
> globalThis.document = {
>   readyState: "complete",
>   addEventListener(evt, fn) { if (evt === "readystatechange") fn(); }
> };
> monitorReadyState(s => { recordedState = s; });
> console.assert(recordedState === "complete", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **readystatechange Event**: Fires on document whenever document.readyState changes.
> 2. **Three States**: 'loading' (parsing HTML), 'interactive' (DOM built, images loading), 'complete' (all assets loaded).
> 3. **Asynchronous Initialization**: Allows tracking document loading lifecycle in modular applications.
---

## 6. Related Terms
- [window object / BOM](window_bom.md) — The global object hosting the `load` event.
- [document object](document_object.md) — The webpage gateway hosting the `DOMContentLoaded` event.

---

## 7. Key Takeaways
- Use `DOMContentLoaded` (attached to `document`) to query and manipulate elements as soon as the HTML structure is parsed (recommended for script initializations).
- Use `load` (attached to `window`) when you must wait for all images, subframes, and external assets to finish loading (recommended for layout calculations).
- Placing script tags at the bottom of the `<body>` or using the `defer` attribute on script tags achieves a similar execution timing to `DOMContentLoaded`.
