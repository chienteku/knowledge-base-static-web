# JSON / JSON.stringify / JSON.parse

> **Level 7 — Objects & Prototypes**
> Serialize/parse the JSON data-interchange format.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Array](../level_02/array.md) — Ordered list structures.
- [String](../level_01/string.md) — Plain-text characters representing data.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: JSON / JSON.stringify / JSON.parse is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When two computers communicate over a network (e.g. a browser calling an API server), they cannot transmit active JavaScript objects located in RAM. Instead, they must convert the structured object into a raw string of text to send over network pipes, and convert the text string back into a living object on the receiving end.

To solve this, Douglas Crockford popularized **JSON** (JavaScript Object Notation)—a lightweight, text-based data-interchange format derived from JavaScript object syntax. It has become the language-agnostic industry standard format for data APIs.

JavaScript provides the global static **`JSON`** namespace object, offering two methods to handle conversion (serialization and deserialization):
- **`JSON.stringify(value)`** converts (serializes) a JavaScript object or value into a JSON text string.
- **`JSON.parse(text)`** converts (deserializes) a JSON text string back into a living JavaScript object.

### (2) Strict JSON Syntax Constraints
JSON is a sub-syntax of JavaScript, but it enforces stricter formatting rules:
- **Double Quotes Only:** All string values and object **keys** must be wrapped in double quotes (`"key": "value"`). Single quotes (`'`) are invalid.
- **No Trailing Commas:** The last property in an object or item in an array must not have a comma after it.
- **Supported Data Types:** JSON only supports: String, Number, Boolean, Array, Object, and `null`. (It does not support `undefined`, Functions, Symbols, RegExp, or BigInt).

### (3) Reality Metaphor
- **`JSON.stringify`** is like flat-packing a three-dimensional wooden cabinet (a living object in RAM) into a flat, flat cardboard shipping box from IKEA (a plain text string) so it can fit inside a shipping truck (the network pipe).
- **`JSON.parse`** is like opening that cardboard shipping box at the destination house and assembling the flat boards back into the fully functional, three-dimensional physical cabinet.

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
const user = { name: "Alice", active: true };

// Serialize: Object -> JSON String
const jsonString = JSON.stringify(user);
console.log(jsonString); // '{"name":"Alice","active":true}'

// Deserialize: JSON String -> Object
const parsedObject = JSON.parse(jsonString);
console.log(parsedObject.name); // "Alice"
```

#### Fuller Example
```javascript
// Processing API payloads with error handling and pretty printing
const incomingPayload = '{"userId": 105, "status": "pending"}';
const badPayload = "{ userId: 105 }"; // Invalid: keys lack double quotes!

function parseApiResponse(rawText) {
  try {
    // 1. JSON.parse will throw an exception if formatting is invalid
    const data = JSON.parse(rawText);
    console.log("Parsing Success! User ID:", data.userId);
    return data;
  } catch (error) {
    console.error("Parsing Failure: Input is not valid JSON.");
    console.error("Details:", error.message);
    return null;
  }
}

parseApiResponse(incomingPayload);
parseApiResponse(badPayload); // Triggers SyntaxError

// Pretty-printing stringify with indentation formatting
const student = { name: "Bob", grades: [90, 85] };
// Arguments: (value, replacer, spaces-indentation)
const prettyString = JSON.stringify(student, null, 2);
console.log(prettyString);
/* Logs:
{
  "name": "Bob",
  "grades": [
    90,
    85
  ]
}
*/
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not Wrapping `JSON.parse` in a `try/catch` block

**The mistake:** Parsing incoming data from a network API directly without protective try-catch handlers.

**Why it's wrong:** If the server returns an unexpected database error string, an HTML error page, or malformed JSON, `JSON.parse` will throw a `SyntaxError` exception immediately, crashing the execution thread.

*Incorrect:*
```javascript
function loadSettings(settingsString) {
  const settings = JSON.parse(settingsString); // Crashes application if settingsString is malformed!
  return settings;
}
```

*Fix:*
```javascript
function loadSettings(settingsString) {
  try {
    return JSON.parse(settingsString);
  } catch (error) {
    console.warn("Invalid settings configuration, loading default fallback.");
    return { theme: "light" };
  }
}
```

### Mistake 2: Single-Quotes inside JSON Strings

**The mistake:** Creating raw JSON strings using single quotes around keys or strings.

*Incorrect:*
```javascript
// JSON.parse throws SyntaxError: Unexpected token ' in JSON at position 1
const user = JSON.parse("{ 'name': 'Bob' }"); 
```

*Fix:*
```javascript
// Use double quotes around keys and values inside the string
const user = JSON.parse('{ "name": "Bob" }'); // Correct
```

---

### Mistake 3: Unhandled Asynchronous Failures in Json Operations

**The mistake:** Executing asynchronous operations within Json without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/json"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/json");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in json: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Safe JSON Serialization & Reviver Deserialization

**Scenario:** A web storage utility uses JSON.stringify() with a replacer function to serialize maps, and JSON.parse() with a reviver to restore Date objects.

**Requirements:**
1. Write safeSerialize(data).
2. Write safeParse(jsonStr).
3. Handle Date string conversion in reviver.
4. Verify round-trip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeSerialize(data) {
>   return JSON.stringify(data);
> }
>
> function safeParse(jsonStr) {
>   return JSON.parse(jsonStr, (key, value) => {
>     // Reviver function converts ISO date strings back into Date objects
>     if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
>       return new Date(value);
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const payload = { title: "Event", date: new Date("2026-01-01T00:00:00.000Z") };
> const serialized = safeSerialize(payload);
> const deserialized = safeParse(serialized);
>
> console.assert(deserialized.date instanceof Date, "Test 1 Failed: Date object not revived");
> ```
>
> #### Technical Explanation
>
> 1. **JSON.stringify() & JSON.parse()**: Standard methods for serializing JS data structures to JSON strings and parsing JSON strings back into JS objects.
> 2. **Reviver Parameter**: The second parameter of JSON.parse(str, reviver) transforms parsed property values during deserialization.
> 3. **Replacer Parameter**: The second parameter of JSON.stringify(obj, replacer) filters or formats properties during serialization.
> 
---

### Exercise 2: Json Advanced Context Handler

**Scenario:** A web application component processes json data operations within enterprise workflows.

**Requirements:**
1. Write handleJsonSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleJsonSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleJsonSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Json Architecture**: Applying json patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Json Performance Optimization

**Scenario:** An application utility optimizes json execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeJsonTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeJsonTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeJsonTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Json Optimization**: Optimizing json improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Web Storage (localStorage / sessionStorage)](../level_05/web_storage.md) — Persistent storage APIs that only accept string values, relying on JSON for objects.
- [Shallow Copy vs Deep Copy](shallow_vs_deep_copy.md) — The copy behaviors that often use JSON serialization as a quick deep-cloning mechanism.
- [Fetch API](../level_06/fetch_api.md) — The network client request API that frequently parses response streams using `.json()`.
- [Date object](../level_02/date_object.md) — Related concept: Date object.
- [structuredClone](../level_09/structuredclone.md) — Related concept: structuredClone.

---

## 7. Key Takeaways
- JSON is a standardized text-based data-interchange format based on JavaScript object syntax.
- Use `JSON.stringify(obj)` to serialize a JS object to a string.
- Use `JSON.parse(str)` to deserialize a string back to a JS object.
- JSON enforces strict syntax rules: double quotes are mandatory for keys/strings, and trailing commas are forbidden.
- JSON does not support `undefined`, Functions, Symbols, RegExp, or circular reference structures.
- Always enclose `JSON.parse` calls in `try/catch` blocks to protect against invalid string layout crashes.
