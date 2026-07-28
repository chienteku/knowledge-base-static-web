# The Node.js REPL

> **Level 2 — Core Modules & Globals**
> The interactive shell for experimenting with Node before writing files.

---

## 1. Prerequisites
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — The parent runtime executing the code.
- [Global Objects (global, __dirname, __filename)](./global_objects.md) — The APIs available inside the REPL context.

---

## 2. Term Category
- **Core Module / Tooling**

---

## 3. Environment Context
- **Node.js Core Architecture** (Governed by the command-line interface runtime loop).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before building complex applications, developers often need to quickly test small blocks of JavaScript: checking how a path parses, inspecting a global object, formatting dates, or testing regular expressions.

Creating a new `.js` file, writing the code, running `node script.js`, and then deleting the file is slow and tedious.

To support rapid experimentation, Node.js provides a built-in **REPL (Read-Eval-Print Loop)**:
- **REPL:** An interactive command-line shell that:
  1.  **Reads:** Takes your JavaScript input string.
  2.  **Evaluates:** Runs it through the V8 engine context.
  3.  **Prints:** Formats and outputs the result in color.
  4.  **Loops:** Waits for your next line of input.
- **Starting the REPL:** Open your terminal, type `node` (with no trailing arguments or filenames), and hit Enter. The prompt changes to `>` to show you are in the REPL.

---

### (2) Key REPL Shortcuts & Features

-   **The Underscore `_` Variable:** A special variable that holds the result of the *last evaluated expression*.
-   **Autocomplete:** Pressing the `Tab` key twice lists all variables, global objects, and properties available in your current scope.
-   **System Commands:**
    -   `.exit` (or pressing `Ctrl+D`, or pressing `Ctrl+C` twice) exits the REPL.
    -   `.help` lists all available REPL system commands.
    -   `.load <path>` loads a local file into the active REPL session.

---

### (3) Reality Metaphor
Imagine working in a wood workshop.
- **Writing Node Scripts** is like **building a complete dining table**. You measure, cut multiple pieces of wood, glue them, wait for them to dry, and inspect the final result. If you made a mistake on step 2, you might have to throw the table away.
- **The REPL** is like a **sandbox whiteboard**. You can scribble a sketch, write down mathematical formulas, erase it immediately with your hand, and test a different layout. It is not a permanent table, but it is the fastest way to verify measurements.

---

### (4) REPL Terminal Output Example

```text
$ node
Welcome to Node.js v20.0.0.
Type ".help" for more information.
> 1 + 2
3
> const path = require('path')
undefined
> path.join('usr', 'local', 'bin')
'usr/local/bin'
> _
'usr/local/bin'
> .exit
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to reference `__dirname` or `__filename` inside the REPL

**The mistake:** Accessing directory helper globals directly in the REPL shell session:
```text
> __dirname
ReferenceError: __dirname is not defined
```

**Why it's wrong:** The globals `__dirname` (current folder path) and `__filename` (current file path) are module-scoped wrapper variables created dynamically when Node loads a physical file from the hard drive. Because the REPL operates interactively in memory without loading a file, these variables do not exist.

*Fix:* Use `process.cwd()` to fetch the current working directory from which the REPL was launched.

---



### Mistake 2: Expecting Code Executed in REPL Session to Automatically Persist to Disk Files

**The mistake:** Writing functions inside terminal Node REPL and expecting them to save into your project `.js` file.

**Why it's wrong:** The REPL (Read-Eval-Print Loop) is an interactive memory-only evaluation environment. Closing REPL discards all declared variables unless saved via `.save`.

*Incorrect:*
```javascript
// Typing 50 lines of complex app code into terminal REPL without saving
```

*Fix:*
```javascript
Use REPL for quick expression testing; write persistent code in .js files
```

### Mistake 3: Misinterpreting Special REPL Variables (`_`) in Production Code

**The mistake:** Using `_` in production scripts expecting it to hold the result of the last evaluated expression.

**Why it's wrong:** The `_` variable is a REPL-exclusive special global representing the last evaluated expression result. In standard JS scripts, `_` is a regular variable name (or Lodash reference).

*Incorrect:*
```javascript
const data = fetch();
console.log(_); // ❌ _ is undefined in standard script files!
```

*Fix:*
```javascript
const data = fetch();
console.log(data); // Use explicit variable names
```

## 6. Practice Exercises

### Exercise 1: REPL Sandbox Session

**Problem:** Perform the following actions using the REPL shell in your local terminal:
1.  Open your terminal and enter the Node.js REPL.
2.  Calculate the square root of `256` using the global `Math` object.
3.  Assign the result of that calculation to a variable named `result`.
4.  Print `result` using the special `_` variable.

**Expected Output Log:**
```text
$ node
> Math.sqrt(256)
16
> const result = 16
undefined
> result
16
> _
16
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Launching Custom Context REPL

**Problem:** Launch a custom REPL instance programmatically using `repl.start()` injecting custom context variable `db`.

**Expected output:**
> [!check]- Answer
> ```text
> const r = repl.start('> '); r.context.db = myDbInstance;
> ```
> ```javascript
> const repl = require('repl');
> const r = repl.start('> ');
> r.context.db = myDbInstance;
> ```
>
> **Explanation:** `repl.start()` starts a interactive custom REPL shell with pre-loaded database/service contexts.

---

### Exercise 3: Node REPL History Saving

**Problem:** What command saves current REPL session history to a file? (`.save filename.js`).

**Expected output:**
> [!check]- Answer
> ```text
> .save filename.js
> ```
> ```text
> .save filename.js
> ```
>
> **Explanation:** `.save` writes the current REPL interactive command history to disk.

## 7. Related Terms
- [Global Objects (global, __dirname, __filename)](./global_objects.md) — The properties loaded in the REPL runtime scope.
- [The process Object](./process_object.md) — The system environment configurations checked via the REPL.

---

## 8. Key Takeaways
- The Node.js REPL is an interactive command-line environment for quick JavaScript prototyping.
- Start the REPL by running `node` in your command terminal with no file target.
- It operates on a continuous Read-Eval-Print-Loop cycle.
- The special `_` variable contains the result of the last evaluated expression.
- File-specific variables like `__dirname` and `__filename` are not defined in the REPL; use `process.cwd()` instead.
