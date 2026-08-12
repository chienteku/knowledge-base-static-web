# Property Access (dot vs bracket notation)

> **Level 2 — Control Flow & Data Structures**
> `obj.key` vs `obj["key"]`; dynamic keys.

---

## 1. Prerequisites
- [Object](object.md) — A collection of key-value pairs representing properties and methods.
- [Property](property.md) — An association between a name (key) and a value within an object.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Property Access (dot vs bracket notation) is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Dynamic Database Record Field Extractor

**Scenario:** A database ORM extracts record fields dynamically using bracket notation obj[fieldName] when property names are stored in runtime variables.

**Requirements:**
1. Write extractFieldValue(record, fieldName).
2. Access property using bracket notation record[fieldName].
3. Return extracted value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractFieldValue(record, fieldName) {
>   if (!record || typeof record !== "object") return undefined;
>   return record[fieldName];
> }
>
> // Verification tests
> const user = { id: 42, username: "alice", role: "ADMIN" };
> console.assert(extractFieldValue(user, "username") === "alice", "Test 1 Failed");
> console.assert(extractFieldValue(user, "role") === "ADMIN", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Dot vs Bracket Notation**: Dot notation obj.prop requires valid identifier names; bracket notation obj[expr] evaluates dynamic expressions.
> 2. **Expression Evaluation**: Bracket notation converts the inner expression to a string key before accessing property.
> 3. **Dynamic Property Lookups**: Essential for runtime property access when key names are stored in variables.
> 
---

### Exercise 2: Safe Nested Payload Access with Optional Chaining

**Scenario:** An API response parser extracts deeply nested user address properties using optional chaining (?.) to prevent TypeError crashes.

**Requirements:**
1. Write extractCity(apiPayload).
2. Safely access payload?.data?.user?.address?.city.
3. Return city string or fallback default "Unknown City".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractCity(apiPayload) {
>   const city = apiPayload?.data?.user?.address?.city ?? "Unknown City";
>   return city;
> }
>
> // Verification tests
> console.assert(extractCity({ data: { user: { address: { city: "Seattle" } } } }) === "Seattle", "Test 1 Failed");
> console.assert(extractCity({ data: {} }) === "Unknown City", "Test 2 Failed");
> console.assert(extractCity(null) === "Unknown City", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Optional Chaining (?.)**: Short-circuits and evaluates to undefined if the left-hand operand is null or undefined.
> 2. **TypeError Prevention**: Prevents Cannot read properties of undefined crashes when accessing missing nested keys.
> 3. **Nullish Coalescing Combination**: Combining ?. with ?? provides concise default fallbacks for missing nested properties.
> 
---

### Exercise 3: Special Character HTTP Header Access

**Scenario:** An HTTP header parser extracts header values containing hyphens (content-type, x-api-key) requiring bracket notation access.

**Requirements:**
1. Write getHeaderValue(headersObj, headerName).
2. Access property using bracket notation headersObj[headerName].
3. Return header value string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getHeaderValue(headersObj, headerName) {
>   if (!headersObj || typeof headersObj !== "object") return undefined;
>   return headersObj[headerName];
> }
>
> // Verification tests
> const headers = {
>   "content-type": "application/json",
>   "x-api-key": "secret-123"
> };
> console.assert(getHeaderValue(headers, "content-type") === "application/json", "Test 1 Failed");
> console.assert(getHeaderValue(headers, "x-api-key") === "secret-123", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Non-Identifier Keys**: Property keys containing hyphens, spaces, or special characters cannot use dot notation.
> 2. **Bracket Notation Requirement**: Keys with hyphens must be accessed as string keys inside bracket notation (obj["content-type"]).
> 3. **Property Key Coercion**: Property keys inside brackets are automatically coerced to strings or symbols.
---

## 6. Related Terms
- [Method](method.md) — Functions stored inside objects.
- [Computed Property Names](../level_07/computed_property_names.md) — Declaring dynamic keys inside object literals.
- [Object](object.md) — Related concept: Object.

---

## 7. Key Takeaways
- Use dot notation (`obj.prop`) by default for clean, readable code when the key name is static and standard.
- Use bracket notation (`obj["prop"]` or `obj[variable]`) when the key contains spaces, special characters, starts with a number, or is stored in a variable.
- Do not wrap variable names in quotes inside the brackets, or the engine will treat them as string literals instead of variables.
