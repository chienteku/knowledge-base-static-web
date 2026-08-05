# Linter (ESLint) & Formatter (Prettier)

> **Level 10 — Ecosystem & Tooling**
> Static analysis and auto-formatting tools.

---

## 1. Prerequisites
- [Node.js](node_js.md) — The runtime engine hosting CLI build tooling.

---

## 2. Term Category
- **Ecosystem / Tooling**

---

## 3. Environment Context
- **Universal**: Configured inside project roots to analyze editor code dynamically.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When developers collaborate on codebases, two problems frequently arise:
1. **Code Quality Bugs:** Writing code that is valid syntax but contains logic flaws or bad habits—such as declaring variables and forgetting to use them, referencing undefined variables, or failing to handle asynchronous rejections.
2. **Formatting Debates:** Arguing over aesthetic styling rules—such as whether to use single quotes (`'`) vs double quotes (`"`), spaces vs tabs, or adding trailing semicolons.

To resolve these automatically, the JavaScript ecosystem employs two complementary static analysis tools:

#### Linter (ESLint)
An analysis tool that inspects your source code **without executing it** to flag code quality issues, stylistic traps, and potential bugs.
- **Focus:** **Code Logic and Quality.**
- **Rules Example:** Enforces using `const` for variables never reassigned, bans `var`, and flags unreachable code after `return` statements.

#### Formatter (Prettier)
An opinionated formatting tool that parses your code and **re-writes it from scratch**, enforcing a consistent style layout.
- **Focus:** **Code Appearance and Layout.**
- **Rules Example:** Automatically wraps lines at 80 characters, formats indentation tabs, and normalizes quote marks.

By delegating formatting strictly to Prettier and logical code inspection to ESLint, teams eliminate style debates and catch bugs before code is committed.

### (2) Reality Metaphor
- A **Linter (ESLint)** is like a **senior book editor**. They read your sentences to check logic and consistency: `"You introduced a character here but they never say a word (unused variable)"` or `"You reference a location that was never described (undefined variable)."`
- A **Formatter (Prettier)** is like a **typesetter/printing press**. They do not read your story or check your facts. They adjust the margins, set the font sizes, enforce standard indentation tabs, and handle line breaks so the final book is clean and uniform.

### (3) JavaScript Code Examples

#### Visualizing Linters and Formatters

##### 1. Raw input with logical errors and poor spacing
```javascript
var userName = "Alice" // 1. Lint Warn: var is banned.
const age = 30;
let score = 100; // 2. Lint Warn: score is never reassigned, use const.

function greet() {
console.log( "Hi" ); // 3. Formatter: bad indentation, ugly spaces
}
```

##### 2. After Formatter (Prettier) runs
```javascript
var userName = "Alice"; // Indent and spacing fixed, semicolon added
const age = 30;
let score = 100;

function greet() {
  console.log("Hi"); // Indentation standardized
}
```

##### 3. After Linter (ESLint --fix) runs
```javascript
const userName = "Alice"; // var corrected to const
const age = 30;
const score = 100; // let corrected to const

function greet() {
  console.log("Hi");
}
```

#### Typical Configuration Files

##### Prettier Config (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

##### ESLint Config (`eslint.config.js`)
```javascript
export default [
  {
    rules: {
      "no-unused-vars": "error", // Error if variables are declared but unused
      "no-undef": "error",       // Error if variable is accessed without declaration
      "prefer-const": "warn"     // Recommend const for variables never reassigned
    }
  }
];
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Linter Formatter Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Linter Formatter blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "linter_formatter";
```

*Fix:*
```javascript
let value = "linter_formatter";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Linter Formatter Callbacks

**The mistake:** Passing methods from Linter Formatter instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "linter_formatter",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "linter_formatter",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Linter Formatter Operations

**The mistake:** Executing asynchronous operations within Linter Formatter without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/linter_formatter"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/linter_formatter");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in linter_formatter: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Bug or Style?

**Problem:** Classify whether the action is the responsibility of a **Linter (ESLint)** or a **Formatter (Prettier)**:

1. Deleting a trailing comma at the end of an object declaration.
2. Flagging that an `await` keyword was used inside a non-async function.
3. Automatically breaking a very long string concatenation across two lines.
4. Throwing a warning because a variable was used before it was declared.

> [!check]- Answer
> - 1. **Formatter** (Styling).
> - 2. **Linter** (Logical bug).
> - 3. **Formatter** (Layout appearance).
> - 4. **Linter** (Potential hoisting code bug).


---

### Exercise 2: Role Division: ESLint vs Prettier

**Problem:** State primary role of ESLint (code quality/logic bugs) vs Prettier (opinionated code formatting).

**Expected output:**
> [!check]- Answer
> ```text
> ESLint: Code quality, Prettier: Code formatting
> ```
> ```javascript
> console.log("ESLint: Code quality, Prettier: Code formatting");
> ```
>
> **Explanation:** Linters catch code smells and syntax bugs; formatters enforce consistent code style layout.

---

### Exercise 3: ESLint Directive Comments

**Problem:** Disable an ESLint rule for a single line using `// eslint-disable-next-line`.

**Expected output:**
> [!check]- Answer
> ```text
> Rule disabled for next line
> ```
> ```javascript
> console.log("Rule disabled for next line");
> ```
>
> **Explanation:** Inline ESLint directives override linting rules for specific code statements.


---

## 7. Related Terms
- [Strict Mode ("use strict")](../level_09/strict_mode.md) — The language runtime mode that flags undeclared variables at runtime.
- [TypeScript](typescript.md) — Extends linting concepts by adding strict static type checking.

---

## 8. Key Takeaways
- ESLint (Linter) focuses on code logic, syntax checks, and bug detection.
- Prettier (Formatter) focuses strictly on layout, spacing, and styling appearance.
- Use both tools together, configuring `eslint-config-prettier` to disable ESLint's styling checks to prevent conflicts.
- Automate linter and formatter executions by connecting them to VS Code's "Save Action" triggers and Git commit hooks.
