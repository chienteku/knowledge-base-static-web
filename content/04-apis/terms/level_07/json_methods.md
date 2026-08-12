# JSON Methods (parse / stringify)

> **Level 7 — Data Formats & Serialization**
> The two built-in JavaScript functions used to serialize an object into a JSON string, and deserialize a JSON string back into an object.

---

## 1. Prerequisites
- [Serialization & Deserialization](serialization.md) — The theoretical concepts these methods execute.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The text format these methods work with.

---

## 2. Term Category

**JavaScript Core Feature (Universal JavaScript .)**: JSON Methods (parse / stringify) is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To implement the concept of [Serialization](../level_07/serialization.md), developers used to write complex custom scripts to loop through their objects, manually wrapping keys in quotes and adding commas. 
JavaScript eventually added a global `JSON` object to the language specifically to handle this instantly and safely.

### (2) `JSON.stringify(object)` (Serialization)
Takes a live JavaScript object and converts it into a flat JSON text string. 
**Use cases:** 
- Preparing data to be sent in the `body` of a `fetch` POST request.
- Saving an object into `localStorage`.
```javascript
const user = { name: "Alice", role: "Admin" };
const textString = JSON.stringify(user);
console.log(textString); 
// Output: '{"name":"Alice","role":"Admin"}'
```

### (3) `JSON.parse(string)` (Deserialization)
Takes a flat JSON text string and converts it back into a live JavaScript object.
**Use cases:**
- Reading data out of `localStorage`.
- (Note: `response.json()` in fetch uses this under the hood!)
```javascript
const jsonString = '{"score": 99}';
const gameObject = JSON.parse(jsonString);
console.log(gameObject.score); // Output: 99
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Parsing something that isn't JSON

**The mistake:** You receive an error from a server that says `Internal Server Error` (plain text). Your code tries to run `JSON.parse("Internal Server Error")`.

**Why it's wrong:** `JSON.parse` is extremely strict. If the string is not perfectly valid JSON syntax (with curly braces and double quotes), it will instantly throw an unhandled error and crash your app!
`Uncaught SyntaxError: Unexpected token I in JSON at position 0`.
**Golden Rule:** If you are not 100% sure the string you are receiving is valid JSON, you must wrap `JSON.parse` inside a `try/catch` block to prevent it from crashing your entire application.

---

### Mistake 2: Using `JSON.parse(JSON.stringify(obj))` for Deep Cloning Objects with Dates or Functions

**The mistake:** Deep cloning objects containing `Date` instances, `RegExp`, or `undefined` using `JSON.parse(JSON.stringify())`.

**Why it's wrong:** `JSON.stringify()` converts `Date` objects into ISO strings (losing Date methods) and strips `undefined` / functions completely. Use modern `structuredClone()`.

*Incorrect:*
```javascript
const copy = JSON.parse(JSON.stringify({ createdAt: new Date() }));
console.log(typeof copy.createdAt); // ❌ Returns 'string', not Date object!
```

*Fix:*
```javascript
const copy = structuredClone({ createdAt: new Date() });
console.log(copy.createdAt instanceof Date); // Preserves true Date instance
```

---

### Mistake 3: Handling Circular References in `JSON.stringify()` Without a Replacer

**The mistake:** Passing self-referencing objects (`obj.self = obj`) to `JSON.stringify()`.

**Why it's wrong:** Circular references cause `JSON.stringify()` to throw a `TypeError: Converting circular structure to JSON`.

*Incorrect:*
```javascript
const user = {}; user.self = user;
JSON.stringify(user); // ❌ TypeError: Converting circular structure to JSON!
```

*Fix:*
```javascript
// Use custom replacer function or WeakSet tracking to omit circular references
```


---

## 5. Practice Exercises

### Exercise 1: Advanced JSON.stringify Formatter with Custom Replacer

**Scenario:** A logging utility formats complex object trees into pretty-printed JSON while masking sensitive attributes.

**Requirements:**
1. Write formatDebugJson(dataObj, sensitiveKeys, indentSpaces).
2. Use JSON.stringify(value, replacer, space).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatDebugJson(dataObj, sensitiveKeys = ["password", "secret"], indentSpaces = 2) {
>   const keysSet = new Set(sensitiveKeys.map(k => k.toLowerCase()));
>
>   return JSON.stringify(dataObj, (key, val) => {
>     if (keysSet.has(key.toLowerCase())) {
>       return "[REDACTED]";
>     }
>     return val;
>   }, indentSpaces);
> }
>
> // Verification tests
> const user = { name: "Alice", password: "123", details: { secret: "xyz" } };
> const json = formatDebugJson(user);
>
> console.assert(json.includes('"password": "[REDACTED]"'), "Test 1 Failed");
> console.assert(json.includes('"secret": "[REDACTED]"'), "Test 2 Failed");
> console.assert(json.includes("
> "), "Test 3 Failed: Must be pretty-printed with indents");
> ```
>
> #### Technical Explanation
>
> 1. **JSON.stringify 3-Argument Signature**: JSON.stringify(value, replacer, space) configures serialization and formatting.
> 2. **Replacer Function**: Filters or transforms object key-value nodes during serialization.
> 3. **Space Parameter**: Accepts number of indent spaces or string indent characters for pretty-printing.
> 
---

### Exercise 2: Circular Reference Safe JSON Serializer

**Scenario:** A serialization guard uses a `WeakSet` inside a `JSON.stringify` replacer to prevent 'TypeError: Converting circular structure to JSON' crashes.

**Requirements:**
1. Write safeStringifyCircular(obj).
2. Track visited objects in WeakSet.
3. Replace circular references with '[Circular]'.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeStringifyCircular(obj) {
>   const visited = new WeakSet();
>
>   return JSON.stringify(obj, (key, value) => {
>     if (typeof value === "object" && value !== null) {
>       if (visited.has(value)) {
>         return "[Circular]";
>       }
>       visited.add(value);
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const parent = { name: "Parent" };
> const child = { name: "Child", parent };
> parent.child = child; // Circular reference!
>
> const json = safeStringifyCircular(parent);
> console.assert(json.includes('"child": "[Circular]"') || json.includes('"parent": "[Circular]"'), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Circular Reference Exception**: Standard JSON.stringify throws TypeError when an object references itself directly or indirectly.
> 2. **WeakSet Tracking**: WeakSet tracks visited object references during tree traversal without causing memory leaks.
> 3. **Defensive Serialization**: Crucial for logging complex DOM objects or graph data structures safely.
> 
---

### Exercise 3: Custom .toJSON() Method Serialization Decorator

**Scenario:** A domain model class implements a custom `.toJSON()` method to control how its private state is serialized by `JSON.stringify`.

**Requirements:**
1. Create UserDomain class with private fields.
2. Implement toJSON().
3. Verify JSON.stringify output.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class UserDomain {
>   #internalHash;
>
>   constructor(id, name, secretHash) {
>     this.id = id;
>     this.name = name;
>     this.#internalHash = secretHash;
>   }
>
>   toJSON() {
>     return {
>       id: this.id,
>       name: this.name,
>       exportedAt: "2026-08-12"
>     };
>   }
> }
>
> // Verification tests
> const user = new UserDomain("u1", "Alice", "hash_secret_123");
> const json = JSON.stringify(user);
>
> console.assert(json.includes('"name":"Alice"'), "Test 1 Failed");
> console.assert(!json.includes("hash_secret_123"), "Test 2 Failed: Private hash must not be serialized");
> ```
>
> #### Technical Explanation
>
> 1. **.toJSON() Method Protocol**: If an object defines a .toJSON() method, JSON.stringify calls it to get the object representation to serialize.
> 2. **Private Field Protection**: Controls object serialization, concealing internal private class fields (#fields).
> 3. **Custom Type Formatting**: Used by native Date.prototype.toJSON() to format date objects as ISO strings.
---

## 6. Related Terms
- [localStorage & sessionStorage](../level_09/web_storage.md) — A browser API that can ONLY store strings, making `JSON.stringify` mandatory when saving objects.
- [Bulk / Batch Requests](../level_06/batch_requests.md) — Related concept: Bulk / Batch Requests.
- [Binary vs Text Formats](binary_vs_text_formats.md) — Related concept: Binary vs Text Formats.
- [Deserialization / Parsing](deserialization.md) — Related concept: Deserialization / Parsing.
- [Serialization & Deserialization](serialization.md) — Related concept: Serialization & Deserialization.
- [Storage Serialization](../level_09/storage_serialization.md) — Related concept: Storage Serialization.

---

## 7. Key Takeaways
- **`JSON.stringify()`** turns objects into strings (used before sending data).
- **`JSON.parse()`** turns strings into objects (used after receiving data).
- `JSON.parse` will throw a fatal error if the text is not perfectly formatted JSON.
- Functions, Undefined, and Symbols are stripped out during stringification.
