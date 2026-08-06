# Property Access (dot vs bracket notation)

> **Level 2 — Control Flow & Data Structures**
> `obj.key` vs `obj["key"]`; dynamic keys.

---

## 1. Prerequisites
- [Object](object.md) — A collection of key-value pairs representing properties and methods.
- [Property](property.md) — An association between a name (key) and a value within an object.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Objects store data as collections of key-value pairs. To read, write, or update this data, developers need a syntax to target specific keys. The TC39 committee implemented two separate syntaxes for property access to balance readability and flexibility:
1. **Dot Notation (`obj.key`):** A clean, standard syntax used when the key name is static and conforms to standard variable naming rules (no spaces, special characters, or starting with a number).
2. **Bracket Notation (`obj["key"]`):** A dynamic syntax where the key name is specified as a string inside brackets. This is required if the key contains spaces, symbols, or if the key name is stored inside a variable and evaluated dynamically at runtime.

### (2) Reality Metaphor
Imagine a hotel with safety deposit boxes in the lobby.
- **Dot Notation** is like walked up to a box with a pre-printed sign "Manager". You can read it directly because the label is fixed and standard.
- **Bracket Notation** is like holding a slip of paper with a room number written on it. The clerk reads the slip of paper (which acts as a variable) and matches it to the drawer box dynamically. The value on the slip can change, but the bracket code remains the same.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const user = {
  firstName: "Brendan",
  "home address": "123 Web Lane"
};

// Dot notation: clean and simple
console.log(user.firstName); // "Brendan"

// Bracket notation: required due to space in the key
console.log(user["home address"]); // "123 Web Lane"
```

#### Fuller Example
```javascript
// A dynamic localization dictionary swapping interface text based on user language
const localization = {
  welcome: "Welcome!",
  goodbye: "Goodbye!",
  loading: "Loading..."
};

// Dot notation reads static values directly
console.log(localization.welcome); // "Welcome!"

// Dynamic bracket notation: value of the key is computed from variables
function getTranslation(languageKey) {
  // If languageKey is "goodbye", evaluates to: localization["goodbye"]
  return localization[languageKey]; 
}

const currentScreen = "goodbye";
console.log(getTranslation(currentScreen)); // "Goodbye!"

// Creating/Updating properties dynamically
const newKey = "errorMsg";
localization[newKey] = "An error occurred."; // Dynamic property assignment
console.log(localization.errorMsg); // "An error occurred."
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Quoting Variable Names inside Brackets

**The mistake:** Putting quotes around a variable name inside the brackets, causing the engine to look up a literal key name rather than evaluating the variable.

**Why it's wrong:** Wrapping the key in quotes turns it into a string literal. If you write `obj["keyName"]`, JavaScript searches for the literal property named `"keyName"`, ignoring the variable `keyName`.

*Incorrect:*
```javascript
const player = {
  score: 1500
};

const metric = "score";
// Intent: Read player.score dynamically
const playerScore = player["metric"]; 

console.log(playerScore); // undefined (searches for key named "metric")
```

*Fix:*
```javascript
const player = {
  score: 1500
};

const metric = "score";
// Remove quotes to evaluate the variable
const playerScore = player[metric]; 

console.log(playerScore); // 1500
```

### Mistake 2: Losing Context Binding (`this`) in Property Access Callbacks

**The mistake:** Passing methods from Property Access instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "property_access",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "property_access",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Property Access Operations

**The mistake:** Executing asynchronous operations within Property Access without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/property_access"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/property_access");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in property_access: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Config Lookup

**Problem:** Complete the code to retrieve the configuration setting dynamically based on the `userSelection` variable.

```javascript
const settings = {
  notifications: true,
  theme: "light",
  volume: 80
};

const userSelection = "theme";
const currentValue = // Write code here

console.log(currentValue);
```

**Expected output:**
> [!check]- Answer
> ```text
> light
> ```
> - The key name is stored in a variable, so you must use bracket notation.
> - Pass the variable `userSelection` into the brackets without quotes.
> 
---

### Exercise 2: Optional Chaining Property Access (`?.`)

**Problem:** Safely read `user?.address?.city` when `user` is `{ address: null }` without throwing a `TypeError`.

**Expected output:**
> [!check]- Answer
> ```text
> undefined
> ```
> ```javascript
> const user = { address: null };
> console.log(user?.address?.city);
> ```
>
> **Explanation:** `?.` short-circuits and evaluates to `undefined` if target reference operands are nullish (`null` or `undefined`).
> 
---

### Exercise 3: Dynamic Bracket Property Lookup

**Problem:** Use variable `const prop = "age"` to dynamically access `user[prop]` on `{ age: 30 }`.

**Expected output:**
> [!check]- Answer
> ```text
> 30
> ```
> ```javascript
> const user = { age: 30 };
> const prop = "age";
> console.log(user[prop]);
> ```
>
> **Explanation:** Bracket notation `obj[expr]` evaluates `expr` as a string identifier key lookup.
> 
---

## 7. Related Terms
- [Method](method.md) — Functions stored inside objects.
- [Computed Property Names](../level_07/computed_property_names.md) — Declaring dynamic keys inside object literals.
- [Object](object.md) — Related concept: Object.

---

## 8. Key Takeaways
- Use dot notation (`obj.prop`) by default for clean, readable code when the key name is static and standard.
- Use bracket notation (`obj["prop"]` or `obj[variable]`) when the key contains spaces, special characters, starts with a number, or is stored in a variable.
- Do not wrap variable names in quotes inside the brackets, or the engine will treat them as string literals instead of variables.
