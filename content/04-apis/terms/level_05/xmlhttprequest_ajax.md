# XMLHttpRequest / AJAX

> **Level 5 — Fetching Data (Client-Side)**
> The legacy request API `fetch()` replaced; explains fetch's "why".

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — The network request round-trip fundamentals.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Browser-Specific**: Built-in objects provided by the browser window engine. Not natively available in Node.js.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, clicking a link or submitting a form required the browser to discard the current page completely, fetch a new HTML file from the server, and rebuild the entire window. This made browsing slow and jarring.

To allow pages to fetch data and update the user interface dynamically in the background without reloading the page, developers introduced **AJAX** powered by **XMLHttpRequest (XHR)**:
- **AJAX (Asynchronous JavaScript and XML):** A design technique of sending and receiving data asynchronously in the background to update specific segments of the DOM.
- **XMLHttpRequest (XHR):** The legacy built-in browser class used to execute these background requests.

#### The Limit of XHR: Callback Hell
XHR was designed before JavaScript had Promises. It relies entirely on event listener callbacks (like `onload`, `onerror`, `onreadystatechange`) to handle data. If you need to make multiple sequential API calls (e.g. fetch a user → fetch their posts → fetch comments on those posts), the code nests inside callbacks, creating unreadable, unmaintainable code.

To solve this verbosity, the modern **`fetch()` API** was created to replace XHR with a clean, Promise-based syntax that integrates with `async`/`await`.

### (2) Reality Metaphor
Imagine ordering food at a restaurant.
- **Full Page Reload** is like **exiting the building** and re-entering every time you want to order a new drink. The restaurant staff must throw away your plate, clean the table, and seat you all over again.
- **AJAX / XHR** is like sending **orders to the kitchen via a fax machine** on your table. You write your order and wait for the paper response to print. It works in the background, but the fax machine is verbose, loud, requires dial-in setups, and can get jammed if you send messages too fast.
- **Fetch API** is like sending a **quick text message** to the waiter from your phone. You hit send and cleanly wait for a push notification when your drink is ready.

---

### (3) Syntax Comparison: XHR vs. Fetch

#### 1. Fetch API (Modern, Promise-based)
```javascript
fetch('/api/users/42')
  .then(res => res.json())
  .then(user => console.log("User:", user.name))
  .catch(err => console.error("Error:", err));
```

#### 2. XMLHttpRequest (Legacy, Callback-based)
To accomplish the exact same request, XHR requires setting up configuration states and event listener loops manually:
```javascript
// 1. Instantiate the XHR object constructor
var xhr = new XMLHttpRequest();

// 2. Configure the HTTP method and destination URL path
xhr.open('GET', '/api/users/42', true);

// 3. Register the success handler callback
xhr.onload = function() {
  if (xhr.status >= 200 && xhr.status < 400) {
    var user = JSON.parse(xhr.responseText);
    console.log("User:", user.name);
  } else {
    console.error("Server Error:", xhr.statusText);
  }
};

// 4. Register the network error handler callback
xhr.onerror = function() {
  console.error("Connection failed");
};

// 5. Explicitly fire the request payload
xhr.send();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming XHR is completely obsolete and useless

**The mistake:** Assuming that because `fetch` exists, XHR has been deleted from browsers, or that modern HTTP libraries (like Axios) do not use it.

**Why it's wrong:** XHR is fully supported for backwards compatibility. In fact, many popular libraries like **Axios** use XHR under the hood in browser environments because XHR has native support for **upload progress event tracking** (e.g. `xhr.upload.onprogress`), which the standard `fetch` API cannot do easily.

---

### Mistake 2: Using Legacy `XMLHttpRequest` in New Web Projects Instead of Modern `fetch()`

**The mistake:** Writing verbose `new XMLHttpRequest()` callbacks in new 2026 JavaScript codebases.

**Why it's wrong:** XMLHttpRequest uses legacy callback patterns, lacks Promise support, and requires verbose event handling. Modern JavaScript standardizes on `fetch()` and `async/await`.

*Incorrect:*
```javascript
// Obsolete XHR request
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.onload = function() { console.log(xhr.responseText); }; // ❌ Legacy callback architecture!
xhr.send();
```

*Fix:*
```javascript
// Modern promise-based fetch API:
const res = await fetch('/api/data');
const data = await res.json();
```

---

### Mistake 3: Using Synchronous XMLHttpRequest (`open('GET', url, false)`) Blocking Browser UI

**The mistake:** Setting `async` parameter to `false` in `xhr.open('GET', url, false)`.

**Why it's wrong:** Synchronous XHR freezes the browser main UI thread completely until the network request completes, rendering the webpage unresponsive and triggering browser console deprecation warnings.

*Incorrect:*
```javascript
xhr.open('GET', '/api/data', false); // ❌ Freezes browser main thread!
```

*Fix:*
```javascript
/* Always use asynchronous requests via fetch() or async XHR */
```


---

## 6. Practice Exercises

### Exercise 1: Refactoring Legacy Code

**Problem:** Refactor this legacy XHR request code into a clean, modern `async`/`await` `fetch` request:

```javascript
// Legacy XHR
function sendData(data) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/data', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    console.log("Saved!");
  };
  xhr.send(JSON.stringify(data));
}
```

> [!check]- Answer
> - ```javascript
> - async function sendData(data) {
> - try {
> - const res = await fetch('/api/data', {
> - method: 'POST',
> - headers: { 'Content-Type': 'application/json' },
> - body: JSON.stringify(data)
> - });
> - if (!res.ok) throw new Error('Request failed');
> - console.log("Saved!");
> - } catch (err) {
> - console.error("Error:", err);
> - }
> - }
> - ```
> 
> 
---

### Exercise 2: AJAX Acronym Breakdown

**Problem:** What does the AJAX acronym stand for?

**Expected output:**
> [!check]- Answer
> ```text
> Asynchronous JavaScript And XML
> ```
> ```text
> Asynchronous JavaScript And XML
> ```
> - **Explanation:** AJAX describes asynchronous web data fetching without reloading the HTML page.
---

### Exercise 3: XHR readyState Matrix

**Problem:** Identify the `readyState` integer corresponding to XHR DONE (request completed):

**Expected output:**
> [!check]- Answer
> ```text
> readyState 4 (DONE)
> ```
> ```text
> readyState 4 (DONE - The operation is complete).
> ```
> - **Explanation:** `readyState === 4` signals XHR network transfer completion.
---

## 7. Related Terms
- [The fetch() API](fetch.md) — The modern Promise-based request standard.
- [Promises (in the context of networks)](promises.md) — The asynchronous data container object returned by fetch.
- [AbortController / Cancellation](abortcontroller.md) — Related concept: AbortController / Cancellation.

---

## 8. Key Takeaways
- AJAX is a design concept for performing background network queries to dynamically update the DOM.
- XMLHttpRequest (XHR) is the legacy browser constructor object that implemented AJAX.
- XHR relies on event callbacks, often leading to callback hell on sequential requests.
- Modern `fetch()` replaces XHR with a clean, promise-driven model.
- XHR remains in browsers for compatibility and is used by libraries like Axios to track file upload progress.
