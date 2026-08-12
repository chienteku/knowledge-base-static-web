# `defer` & `async` (Script Loading Strategies)

> **Level 8 — Metadata, SEO & Head**
> Attributes placed on external `<script>` tags that control when scripts are downloaded and executed relative to the parsing of the HTML document, optimizing page loading performance.

---

## 1. Prerequisites
- [`<script>`](script.md) — The parent tag hosting these attributes.
- [`<head>`](../level_01/head.md) — The location where script loading strategies are configured.

---

## 2. Term Category

**Concept / Architecture (Modern Browsers  .)**: `defer` & `async` (Script Loading Strategies) is a fundamental concept in this technology stack. **Level 8 — Metadata, SEO & Head**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A web browser reads and compiles an HTML document top-to-bottom. If a browser encounters a standard external script tag:
```html
<script src="large-app.js"></script>
```
The browser pauses parsing the HTML, sends a request to download the script file, waits for the download, executes the script, and only then continues parsing the rest of the HTML. 

This behavior is called **render-blocking**. 

If the JavaScript file is large or the network is slow, the user is left staring at a partially rendered, frozen white screen.

Historically, developers worked around this by putting all their `<script>` tags at the very bottom of the `<body>`, right before the closing tag. While this allowed the HTML to load first, the browser couldn't start downloading the script until the very end, delaying total page interactivity.

HTML5 introduced **`defer`** and **`async`** to allow scripts to be downloaded in the background while the HTML continues to compile.

---

### (2) Compare Loading Strategies

Here is how the browser handles each strategy:

#### 1. Default (No attribute)
-   **Download:** HTML parser pauses. Script downloads.
-   **Execution:** Script runs immediately. HTML parser resumes only after execution completes.
-   *Impact:* Blocks page rendering.

#### 2. `async` (Asynchronous)
-   **Download:** Downloads in the background while HTML parser continues.
-   **Execution:** Runs the **instant** it finishes downloading. The HTML parser pauses during execution and resumes afterwards.
-   *Impact:* Fast loading, but execution order is unpredictable. Whichever script is smallest downloads and runs first.
-   *Best Use:* Independent third-party scripts (like Google Analytics, tracking pixels, or ads) that do not depend on other scripts and do not modify the DOM.

#### 3. `defer` (Deferred)
-   **Download:** Downloads in the background while HTML parser continues.
-   **Execution:** Waits and runs **only after** the HTML document is fully parsed (when the DOM is ready).
-   *Impact:* Excellent performance, page rendering is never blocked, and script execution order is strictly preserved.
-   *Best Use:* Main application scripts that modify the DOM or depend on other scripts (e.g. utility libraries).

---

### (3) Visual Timeline Comparison
```text
HTML parsing:   [============================================>]
Default:        [====] (Pause: Download & Execute) [=========>]
async:          [====(Download in background)=====>] (Execute instantly, pauses HTML)
defer:          [====(Download in background)================>] (Execute only after HTML is done)
```

---

### (4) Code Examples

#### Short Snippet
Comparing script tags in `<head>`:

```html
<!-- Blocks HTML parsing -->
<script src="script.js"></script>

<!-- Independent script: executes as soon as downloaded -->
<script src="analytics.js" async></script>

<!-- App script: executes sequentially after DOM is ready -->
<script src="app.js" defer></script>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Script Loading Demo</title>

  <!-- 1. Third-party Analytics: load asynchronously. It does not matter when it runs -->
  <script src="https://example.com/analytics.js" async></script>

  <!-- 2. Application Logic: load deferred. It will wait for the button below to load -->
  <script src="app.js" defer></script>
  
  <!-- 3. Helper Library: also deferred. It will run BEFORE app.js because it is declared first -->
  <script src="library.js" defer></script>
</head>
<body>

  <h1>Main App Page</h1>
  <button id="action-btn">Click Me</button>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `defer` or `async` on inline scripts

**The mistake:** Adding the attributes to scripts written directly inside the HTML file:

```html
<!-- BAD: Attributes are ignored! -->
<script defer>
  console.log("This will run immediately and block HTML parsing!");
</script>
```

**Why it's wrong:** The browser already has the inline code in memory. There is no file to download in the background. The `defer` and `async` attributes only work on external scripts that have a `src` attribute.

---



### Mistake 2: Using `async` Scripts That Depend on DOM Nodes or Other Script Libraries

**The mistake:** Loading dependent scripts like `<script src="app.js" async>` when `app.js` relies on `jquery.js`.

**Why it's wrong:** `async` scripts execute IMMEDIATELY as soon as they finish downloading, regardless of document order or DOM load state. Execution order is unpredictable, causing `ReferenceError` crashes.

*Incorrect:*
```html
<script src="jquery.js" async></script>
<script src="app.js" async></script> <!-- ❌ app.js might execute BEFORE jquery.js! -->
```

*Fix:*
```html
<script src="jquery.js" defer></script>
<script src="app.js" defer></script> <!-- defer preserves document script order -->
```

### Mistake 3: Adding `defer` or `async` Attributes to Inline `<script>` Tags

**The mistake:** Writing `<script defer>console.log('hi');</script>` on inline scripts.

**Why it's wrong:** `defer` and `async` attributes are valid ONLY for external scripts with a `src` attribute. Browsers ignore them on inline script tags.

*Incorrect:*
```html
<script defer>
  // ❌ defer is ignored on inline scripts!
  initApp();
</script>
```

*Fix:*
```html
<script src="app.js" defer></script>
```

## 5. Practice Exercises

### Exercise 1: Asynchronous Independent Analytics Script Loading

**Scenario:** An author loads an independent third-party analytics script asynchronously using the `async` attribute.

**Requirements:**
1. Load analytics script via `<script src="..." async>`.
2. Verify non-render-blocking execution.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Analytics Enabled Site</title>
>   <!-- Asynchronous non-blocking analytics script -->
>   <script src="https://analytics.example.com/tracker.js" async></script>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **The `async` Attribute**: Downloads script in background without blocking HTML parsing; executes IMMEDIATELY once downloaded.
> 2. **Independent Script Use Case**: Ideal for independent third-party scripts (analytics, ads) that do NOT depend on other scripts or DOM readiness.
> 3. **Unordered Execution Caution**: Multiple `async` scripts execute in order of download speed, NOT DOM appearance order.
> 
---

### Exercise 2: Deferred DOM-Dependent Application Bundle Loading

**Scenario:** Loads primary application JavaScript using `defer` to ensure execution occurs after DOM parsing finishes in exact document order.

**Requirements:**
1. Load app bundle via `<script src="..." defer>`.
2. Ensure script executes after DOM is ready.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Single Page Application</title>
>   <!-- Deferred application scripts execute in document order after DOM parsing -->
>   <script src="js/vendor.js" defer></script>
>   <script src="js/app.js" defer></script>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **The `defer` Attribute**: Downloads script in background while HTML parses; executes ONLY after HTML parsing is 100% complete.
> 2. **Document Order Preservation**: Multiple `defer` scripts execute in the exact order they appear in the HTML document (`vendor.js` then `app.js`).
> 3. **DOMContentLoaded Timing**: `defer` scripts execute immediately before the `DOMContentLoaded` event fires.
> 
---

### Exercise 3: Comparing Script Execution Timelines

**Scenario:** Demonstrates render-blocking standard scripts vs async vs defer.

**Requirements:**
1. Place defer scripts in `<head>` for optimal performance.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <meta charset="utf-8">
>   <title>Performance Optimized Scripts</title>
>   <!-- Optimal: Deferred in head -->
>   <script src="js/main.js" defer></script>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Standard Script Pitfall**: Plain `<script src="...">` halts HTML parsing until script is fetched and executed.
> 2. **Modern Best Practice**: Place `defer` scripts in `<head>` so downloads start immediately while HTML parses.
> 3. **Performance Metrics**: Improves First Contentful Paint (FCP) and Time to Interactive (TTI).
## 6. Related Terms
- [`<script>`](script.md) — The parent script container element.
- [`<link>`](link.md) — The element used to connect stylesheets (which are also render-blocking).
- [Render-Blocking Resources](../level_09/render_blocking.md) — Related concept: Render-Blocking Resources.

---

## 7. Key Takeaways
- The `defer` and `async` attributes prevent scripts from blocking HTML rendering.
- Both attributes download scripts in the background while the browser compiles the page.
- `async` scripts execute the instant they finish downloading, blocking the parser briefly (order is random).
- `defer` scripts wait and run only after the DOM has finished parsing (order matches declaration).
- These attributes only apply to external script files containing a `src` attribute.
