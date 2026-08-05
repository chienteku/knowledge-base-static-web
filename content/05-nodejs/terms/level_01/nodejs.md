# Node.js (Runtime Environment)

> **Level 1 — Introduction & Architecture**
> An open-source, cross-platform runtime environment that allows developers to execute JavaScript code on the server (outside of a web browser).

---

## 1. Prerequisites
None (Entry-level term)
---

## 2. Term Category
- **Runtime Environment / Backend Architecture**

---

## 3. Environment Context
- **Server-Side (Backend)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For the first 15 years of its existence, JavaScript was physically trapped inside the web browser. You could only use it to animate buttons or validate forms on the Frontend. If you wanted to build the Backend Server (to talk to a database or handle HTTP requests), you had to switch to a completely different language like PHP, Java, or Ruby.
In 2009, Ryan Dahl took the incredibly fast **V8 Engine** (the engine inside Google Chrome that executes JS) and ripped it out of the browser. He wrapped it in a C++ program that could read files from a hard drive and listen to network ports. He called this wrapper **Node.js**.
Suddenly, developers could developers use the exact same language (JavaScript) on both the Frontend and the Backend!

### (2) What is a "Runtime"?
A "Language" (like JS) is just a set of grammar rules. It doesn't actually *do* anything.
A "Runtime" is the physical software that reads those rules, translates them into machine code, and executes them on the CPU. 
- The Browser is a runtime for the Frontend.
- Node.js is a runtime for the Backend.

### (3) JavaScript in the Browser vs Node.js
While they use the same grammar, they have completely different superpowers:
- **Browser JS:** Has the `window` object and `document.getElementById()`. It can manipulate the UI, but it is strictly forbidden from reading your computer's hard drive (for security).
- **Node.js:** Has no `window` or `document` (because there is no screen!). Instead, it has the `fs` (File System) and `http` modules. It can read your hard drive, delete files, and spin up an HTTP server on port 3000.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use DOM APIs in Node.js

**The mistake:** A developer writes a backend script in Node.js to scrape data, and tries to use `document.querySelector('h1')`.

**Why it's wrong:** The `document` object does not exist in Node.js! The DOM (Document Object Model) is an API provided exclusively by Web Browsers to manipulate HTML. Because Node.js runs on a headless server without a screen or HTML engine, DOM APIs will throw a fatal `ReferenceError: document is not defined`.
**Golden Rule:** "JavaScript on the server is not JavaScript in the browser."

---



### Mistake 2: Using Browser Global Objects (`window`, `document`) in Node.js Applications

**The mistake:** Referencing `window` or `document` inside Node.js scripts.

**Why it's wrong:** Node.js is a server runtime without a browser DOM. Accessing `window` or `document` throws `ReferenceError`.

*Incorrect:*
```javascript
const theme = window.localStorage.getItem('theme'); // ❌ ReferenceError: window is not defined
```

*Fix:*
```javascript
const fs = require('fs');
const theme = process.env.THEME || 'dark'; // Use Node.js globals & APIs
```

### Mistake 3: Failing to Handle Asynchronous Rejections in Node.js Servers

**The mistake:** Omitting error handling on asynchronous promises or database calls.

**Why it's wrong:** Unhandled promise rejections crash modern Node.js processes or leave them in unhandled states. Always attach `.catch()` or try/catch blocks.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const data = await fetchData(); // ❌ If fetchData rejects, request hangs or crashes server!
  res.send(data);
});
```

*Fix:*
```javascript
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.send(data);
  } catch (err) {
    next(err);
  }
});
```

## 6. Practice Exercises

### Exercise 1: Spot the Environment

**Problem:** Look at the following two lines of code. Which one can only run in the Browser, and which one can only run in Node.js?
1. `const data = fs.readFileSync('passwords.txt');`
2. `alert("Welcome to the website!");`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Node.js only. The Browser cannot read text files directly from the hard drive (huge security risk).
> 2. Browser only. Node.js doesn't have a screen to show popup alerts.
> ```

---



### Exercise 2: Distinguishing Node.js vs Browser Environment APIs

**Problem:** Identify whether each API is available in Browser only, Node.js only, or Both:
1. `fetch()`
2. `process.env`
3. `document.cookie`
4. `Buffer`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Both (Node 18+ & Browser)
> 2. Node.js only
> 3. Browser only
> 4. Node.js only
> ```
> ```text
> 1. Both (Node 18+ native fetch & Browser)
> 2. Node.js only
> 3. Browser only
> 4. Node.js only
> ```
>
> **Explanation:** `process.env` and `Buffer` are Node.js core globals; `document` is browser DOM; `fetch` is standardized web spec available in modern Node.

---

### Exercise 3: Reading Environment Variables in Node.js

**Problem:** Write code to read port from `process.env.PORT` defaulting to `3000`.

**Expected output:**
> [!check]- Answer
> ```text
> const PORT = process.env.PORT || 3000;
> ```
> ```javascript
> const PORT = process.env.PORT || 3000;
> ```
>
> **Explanation:** `process.env` stores runtime environment configuration keys.

## 7. Related Terms
- [V8 JavaScript Engine](v8_engine.md) — The actual engine beating inside the heart of Node.js.
- [NPM (Node Package Manager)](../level_04/npm.md) — The package manager that made the Node.js ecosystem the largest in the world.
- [Docker](../level_10/docker.md) — Related concept: Docker.
- [The Event Loop & Libuv](event_loop.md) — Node.js Event Loop.
- [Non-Blocking I/O](non_blocking_io.md) — Non-blocking I/O model.
---

## 8. Key Takeaways
- **Node.js** is a C++ program that wraps the V8 engine, allowing JS to run on servers.
- It popularized "Full-Stack JavaScript" (using JS for both frontend and backend).
- It lacks Browser APIs (like `window`, `document`, and `alert`).
- It provides Backend APIs (like File System access, Networking, and OS interactions).
