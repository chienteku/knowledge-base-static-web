# JSON Methods (parse / stringify)

> **Level 7 — Data Formats & Serialization**
> The two built-in JavaScript functions used to serialize an object into a JSON string, and deserialize a JSON string back into an object.

---

## 1. Prerequisites
- [Serialization / Deserialization](../level_07/serialization.md) — The theoretical concepts these methods execute.
- [JSON](../level_01/json.md) — The text format these methods work with.

---

## 2. Term Category
- **JavaScript Core Feature**

---

## 3. Environment Context
- **Universal JavaScript** (Browsers and Node.js).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Disappearing Function

**Problem:** What happens if you run this code?
```javascript
const myObj = {
  name: "Bob",
  sayHi: function() { console.log("Hi"); }
};

const stringified = JSON.stringify(myObj);
console.log(stringified);
```

**Expected output:**
```text
'{"name":"Bob"}'
`JSON.stringify` intentionally ignores and deletes functions. A function is code, not data. JSON only supports data.
```

> [!check]- Answer
> - Remember the rules of Serialization. Can you send a function over a network?

---

### Exercise 2: JSON.stringify Formatting Indentation

**Problem:** Write `JSON.stringify()` call formatting object `data` with 2-space pretty-print indentation.

**Expected output:**
```text
JSON.stringify(data, null, 2);
```

> [!check]- Answer
> ```javascript
> const formatted = JSON.stringify(data, null, 2);
> ```
> - **Explanation:** The 3rd parameter of `JSON.stringify(value, replacer, space)` specifies indentation.
---

### Exercise 3: JSON.parse Reviver Function Pattern

**Problem:** Write `JSON.parse()` reviver function automatically converting date strings matching ISO pattern back into JavaScript `Date` instances.

**Expected output:**
```text
JSON.parse(jsonStr, (key, value) => { return typeof value === 'string' && ISO_REGEX.test(value) ? new Date(value) : value; });
```

> [!check]- Answer
> ```javascript
> const data = JSON.parse(jsonStr, (key, val) => {
> if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
> return new Date(val);
> }
> return val;
> });
> ```
> - **Explanation:** Reviver functions transform parsed values during JSON deserialization.
---

## 7. Related Terms
- [Web Storage (localStorage)](../level_09/web_storage.md) — A browser API that can ONLY store strings, making `JSON.stringify` mandatory when saving objects.

---

## 8. Key Takeaways
- **`JSON.stringify()`** turns objects into strings (used before sending data).
- **`JSON.parse()`** turns strings into objects (used after receiving data).
- `JSON.parse` will throw a fatal error if the text is not perfectly formatted JSON.
- Functions, Undefined, and Symbols are stripped out during stringification.
