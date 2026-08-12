# `<script>`

> **Level 8 — Metadata, SEO & Head**
> Used to embed or reference executable code, almost exclusively JavaScript.

---

## 1. Prerequisites
- [`<body>`](../level_01/body.md) — 
- [Element vs. Tag](../level_01/element_vs_tag.md) — The `<script>` tag is NOT a void element; it must have a closing tag, even if it is empty!

---

## 2. Term Category

**Metadata / Interactive Tag (Universal Browser Support)**: `<script>` is a fundamental concept in this technology stack. **Level 8 — Metadata, SEO & Head**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
HTML provides the structure. CSS provides the design. But what if you want logic? What if you want a modal popup to appear when a button is clicked, or you want to fetch new data from a server without refreshing the page?
The W3C created the `<script>` tag to inject programming logic into the static HTML document. When the browser is reading the HTML file and encounters a `<script>` tag, it literally pauses rendering the webpage, executes the JavaScript code, and then resumes rendering.
You can either write the JavaScript directly inside the tags, or use the `src` attribute to link to an external `.js` file (which is the preferred, cleaner method).

### (2) Reality Metaphor
If building a website is like building a robot:
HTML is the metal chassis (the structure).
CSS is the paint job (the design).
The `<script>` tag is the computer chip you plug into the robot's head that actually makes it move and think.

### (3) Code Examples

#### Short Snippet
```html
<!-- Method 1: Linking to an external JavaScript file (Preferred) -->
<script src="app.js"></script>

<!-- Method 2: Writing JavaScript directly inline -->
<script>
  console.log("Hello from JavaScript!");
</script>
```

#### Fuller Example
```html
<body>
  <h1>Welcome to my App</h1>
  <button id="alertBtn">Click Me</button>
  
  <!-- Scripts are often placed at the very bottom of the body -->
  <!-- This ensures the HTML above it has finished loading before the script runs -->
  <script>
    const button = document.getElementById('alertBtn');
    button.addEventListener('click', () => {
      alert('You clicked the button!');
    });
  </script>
</body>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating `<script>` as a void element

**The mistake:** Using a self-closing syntax when linking to an external file, like `<script src="app.js" />`.

**Why it's wrong:** In HTML5, `<script>` is **not** a void element. It absolutely requires a closing `</script>` tag. If you omit the closing tag, the browser will think the rest of your entire HTML document is part of the script, and the webpage will go completely blank! Even if you use the `src` attribute and the space between the tags is completely empty, you must close it.

*Incorrect:*
```html
<!-- Will break the webpage -->
<script src="main.js" />
```

*Fix:*
```html
<!-- Always include the closing tag! -->
<script src="main.js"></script>
```

### Mistake 2: Putting the script in the `<head>` without `defer`

**The mistake:** Putting `<script src="app.js"></script>` in the `<head>` of the document without any special attributes.

**Why it's wrong:** The browser reads HTML top-to-bottom. If it hits a giant script in the `<head>`, it will pause drawing the webpage until the script downloads and runs. This makes the website load very slowly (a "render-blocking" script). Furthermore, if the script tries to attach an event to a `<button>` that is down in the `<body>`, it will fail because the browser hasn't drawn the button yet!
**Solution:** Either put the `<script>` at the very bottom of the `<body>`, OR add the `defer` attribute (`<script src="app.js" defer></script>`) which tells the browser to download the script in the background and wait to run it until the HTML is fully drawn.

---



### Mistake 3: Placing Blocking `<script>` Tags in `<head>` Without `defer` or `async`

**The mistake:** Placing `<script src="app.js"></script>` in `<head>` without `defer` or `async`.

**Why it's wrong:** Un-deferred scripts in `<head>` block HTML parsing until downloaded and executed, creating a blank white screen during page loads. Add `defer` or move to bottom of `<body>`.

*Incorrect:*
```html
<head>
  <script src="heavy.js"></script> <!-- ❌ Blocks HTML parsing! Blank page! -->
</head>
```

*Fix:*
```html
<head>
  <script src="heavy.js" defer></script> <!-- Non-blocking deferred loading -->
</head>
```

### Mistake 4: Combining `src` Attribute with Inner Inline JavaScript Content in Single Tag

**The mistake:** Writing `<script src="app.js">console.log('hi');</script>`.

**Why it's wrong:** If a `<script>` tag specifies a `src` attribute, any inner JavaScript code written between opening and closing tags is IGNORED completely.

*Incorrect:*
```html
<script src="app.js">
  console.log('Test'); // ❌ Inner code is completely ignored!
</script>
```

*Fix:*
```html
<script src="app.js"></script>
<script>
  console.log('Test'); // Separate inline script tag
</script>
```

## 5. Practice Exercises

### Exercise 1: Finding the Bug

**Problem:** Why will this code result in an error saying `myButton is null`?
```html
<head>
  <script>
    document.getElementById('myButton').style.color = 'red';
  </script>
</head>
<body>
  <button id="myButton">Click Here</button>
</body>
```

**Expected output:**
> [!check]- Answer
> ```text
> Because the browser executes the script immediately when it reads the `<head>`. At that exact millisecond, the browser hasn't reached the `<body>` yet, so the button doesn't exist! You must move the script to the bottom of the body, below the button.
> ```
> - Browsers read top-to-bottom, line-by-line.
> 
---



### Exercise 2: ES Modules Script Setup

**Problem:** Write `<script>` tag loading ES module file `main.js` with deferred module parsing.

**Expected output:**
> [!check]- Answer
> ```text
> <script type="module" src="main.js"></script>
> ```
> ```html
> <script type="module" src="main.js"></script>
> ```
>
> **Explanation:** `type="module"` enables ES Module import/export syntax and defers execution automatically.
> 
---

### Exercise 3: Script Type Attribute Default

**Problem:** Is `type="text/javascript"` required on modern HTML5 `<script>` tags? (Yes/No).

**Expected output:**
> [!check]- Answer
> ```text
> No. HTML5 defaults <script> tags to JavaScript automatically.
> ```
> ```text
> No. HTML5 defaults <script> tags to JavaScript automatically.
> ```
>
> **Explanation:** `type="text/javascript"` is redundant in modern HTML5.
> 
## 6. Related Terms
- [`<link>`](link.md) — Used to import CSS, whereas `<script>` is used to import JavaScript.
- [`defer` & `async` (Script Loading Strategies)](defer_async.md) — Tag parameters optimized for asynchronous asset parsing.
- [`<noscript>`](noscript.md) — A fallback frame shown if script execution is blocked or disabled.
- [`data-*` Attributes](../level_07/data_attributes.md) — Related concept: `data-*` Attributes.
- [Render-Blocking Resources](../level_09/render_blocking.md) — Related concept: Render-Blocking Resources.
- [Geolocation API](../level_10/geolocation.md) — Related concept: Geolocation API.
- [Web Storage (Local/Session Storage)](../level_10/web_storage.md) — Related concept: Web Storage (Local/Session Storage).

---

## 7. Key Takeaways
- The `<script>` tag is used to execute JavaScript logic on a webpage.
- It is NOT a void element; you must always write `</script>`, even when using the `src` attribute.
- Because scripts pause HTML rendering, they should usually be placed at the very bottom of the `<body>` tag, or in the `<head>` using the `defer` attribute.
