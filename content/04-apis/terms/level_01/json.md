# JSON (JavaScript Object Notation)

> **Level 1 — The Foundations of the Web**
> The universal, lightweight text format used for sending data back and forth between Clients and Servers.

---

## 1. Prerequisites
- [HTTP / HTTPS](http_https.md) — HTTP is the envelope; JSON is the letter inside the envelope.

---

## 2. Term Category

**Data Format (Universal Standard .)**: JSON (JavaScript Object Notation) is a fundamental concept in this technology stack. **Level 1 — The Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, if a Server wanted to send data to a Client, they used XML (eXtensible Markup Language). XML looked like HTML (`<user><name>John</name><age>30</age></user>`). It was incredibly bloated, hard to read, and difficult for programming languages to parse efficiently.
Douglas Crockford popularized **JSON** in the early 2000s. He looked at how JavaScript creates Objects (`{ name: "John", age: 30 }`) and realized it was the most elegant, lightweight way to format data. Today, JSON has completely destroyed XML. It is the undisputed king of API data transfer.

### (2) Reality Metaphor
Imagine an international business conference. 
The attendees (Servers and Clients) all speak different native languages (Python, Java, Go, Rust, JavaScript). If the Python server sends native Python code to the Java client, Java will crash.
JSON is like Esperanto or English—a universal, agreed-upon, simple language. Python translates its data into JSON text, sends the text over the network, and Java reads the JSON text and translates it back into Java objects.

### (3) The Strict Rules of JSON
JSON looks exactly like a JavaScript object, but it is **strictly text**, and it has very rigid formatting rules:
1. Keys/Properties **MUST** be wrapped in double quotes `" "`. (Single quotes `' '` will break JSON!).
2. String values **MUST** be wrapped in double quotes.
3. No trailing commas allowed on the last item.
4. You cannot put functions or `undefined` inside JSON.

#### Valid JSON Example:
```json
{
  "id": 101,
  "username": "chienteku",
  "isActive": true,
  "skills": ["HTML", "CSS", "APIs"],
  "address": {
    "city": "Tokyo"
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing a JS Object with a JSON String

**The mistake:** A developer has a JavaScript object: `const user = { name: "Bob" };`. They try to send this raw object over the network using `fetch()`.

**Why it's wrong:** You cannot send memory structures (Objects) over a copper wire! You can only send raw text (Strings). The network doesn't understand what a JS Object is.
**Solution:** You must "Serialize" the object into a JSON string before sending it using `JSON.stringify()`. 
```javascript
const user = { name: "Bob" }; // JS Object in memory
const jsonString = JSON.stringify(user); // Turns into the literal string: '{"name":"Bob"}'
// Now you can send jsonString over the network!
```
Conversely, when receiving a JSON string from a server, you must use `JSON.parse()` to turn the text back into a usable memory Object!

---

### Mistake 2: Including Trailing Commas or Single Quotes in Raw JSON strings

**The mistake:** Writing `{ 'name': 'Alice', 'age': 30, }` in a JSON payload file.

**Why it's wrong:** The JSON specification (RFC 8259) strictly forbids trailing commas and single quotes. Keys and string values MUST be wrapped in double quotes (`"`).

*Incorrect:*
```json
{
  'name': 'Alice',
  'age': 30, // ❌ SyntaxError: Trailing comma and single quotes!
}
```

*Fix:*
```json
{
  "name": "Alice",
  "age": 30
}
```

---

### Mistake 3: Attempting to Serialize Functions or `undefined` into JSON

**The mistake:** Passing object methods or `undefined` properties into `JSON.stringify()`. 

**Why it's wrong:** JSON supports only 6 primitive data types: object, array, string, number, boolean, and null. Functions, Symbols, and `undefined` properties are silently omitted during serialization.

*Incorrect:*
```javascript
const data = { name: 'Bob', score: undefined, calculate: () => 10 };
console.log(JSON.stringify(data)); // ❌ Returns '{"name":"Bob"}'!
```

*Fix:*
```javascript
const data = { name: 'Bob', score: null }; // Use null explicitly for empty values
console.log(JSON.stringify(data)); // '{"name":"Bob","score":null}'
```


---

## 5. Practice Exercises

### Exercise 1: Safe JSON Parsing with Fallback Default

**Scenario:** A resilient API client parses incoming JSON payload strings safely, returning a fallback default value if the JSON is malformed.

**Requirements:**
1. Write safeJsonParse(jsonStr, fallbackValue).
2. Wrap JSON.parse in try...catch block.
3. Return parsed object or fallbackValue on syntax error.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeJsonParse(jsonStr, fallbackValue = null) {
>   if (typeof jsonStr !== "string") {
>     return fallbackValue;
>   }
>   try {
>     return JSON.parse(jsonStr);
>   } catch (err) {
>     return fallbackValue;
>   }
> }
>
> // Verification tests
> const validRes = safeJsonParse('{"user":"Alice","role":"admin"}', {});
> console.assert(validRes.user === "Alice", "Test 1 Failed");
>
> const invalidRes = safeJsonParse('{bad json}', { error: true });
> console.assert(invalidRes.error === true, "Test 2 Failed: Malformed JSON must return fallback");
> ```
>
> #### Technical Explanation
>
> 1. **JSON Format Specification**: JSON (JavaScript Object Notation) requires double quotes for string keys and values: {"key": "value"}.
> 2. **Syntax Error Prevention**: JSON.parse() throws a SyntaxError on malformed text; try...catch prevents application crashes.
> 3. **Strict Parsing Rules**: Single quotes, trailing commas, and unquoted keys are invalid in standard JSON.
> 
---

### Exercise 2: Custom JSON Reviver for Date Deserialization

**Scenario:** An API payload deserializer uses a custom `JSON.parse(str, reviver)` function to automatically convert ISO date strings into Date objects.

**Requirements:**
1. Write parseJsonWithDates(jsonStr).
2. Implement reviver function checking ISO 8601 date string pattern.
3. Return parsed object with Date instances.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseJsonWithDates(jsonStr) {
>   const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
>
>   return JSON.parse(jsonStr, (key, value) => {
>     if (typeof value === "string" && isoDateRegex.test(value)) {
>       return new Date(value);
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const json = '{"name":"Order #1","createdAt":"2026-08-12T10:00:00.000Z"}';
> const parsed = parseJsonWithDates(json);
>
> console.assert(parsed.name === "Order #1", "Test 1 Failed");
> console.assert(parsed.createdAt instanceof Date, "Test 2 Failed: ISO string must be converted to Date");
> console.assert(parsed.createdAt.getUTCFullYear() === 2026, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **JSON Reviver Parameter**: The second reviver argument in JSON.parse(text, reviver) transforms parsed value nodes before return.
> 2. **No Native Date Type in JSON**: JSON supports strings, numbers, booleans, null, arrays, objects, but NO native Date type.
> 3. **Automatic ISO Deserialization**: Converts serialized date string representations back into native Date object instances.
> 
---

### Exercise 3: Sensitive Data Redaction via Custom JSON Replacer

**Scenario:** A logging library uses `JSON.stringify(obj, replacer)` to automatically sanitize sensitive keys (like passwords and credit cards) during serialization.

**Requirements:**
1. Write stringifySanitized(obj, sensitiveKeys).
2. Implement replacer function.
3. Replace matching sensitive key values with "[REDACTED]".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function stringifySanitized(obj, sensitiveKeys = ["password", "token", "ssn"]) {
>   const keysSet = new Set(sensitiveKeys.map(k => k.toLowerCase()));
>
>   return JSON.stringify(obj, (key, value) => {
>     if (keysSet.has(key.toLowerCase())) {
>       return "[REDACTED]";
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const payload = {
>   username: "alice",
>   password: "super-secret-password",
>   profile: { token: "abc-123", age: 30 }
> };
>
> const jsonStr = stringifySanitized(payload);
> console.assert(jsonStr.includes('"password":"[REDACTED]"'), "Test 1 Failed");
> console.assert(jsonStr.includes('"token":"[REDACTED]"'), "Test 2 Failed");
> console.assert(jsonStr.includes('"username":"alice"'), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **JSON Replacer Function**: The second replacer argument in JSON.stringify(value, replacer) filters or modifies properties during serialization.
> 2. **Security Audit Safeguard**: Prevents accidentally logging plaintext passwords or authorization tokens in server log files.
> 3. **Recursive Object Traversal**: The replacer function is called recursively for every key-value pair in the object tree.
---

## 6. Related Terms
- [Request Body & Payloads](../level_02/request_body.md) — JSON is the most common format placed inside the Body of an HTTP request.
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — How we extract JSON out of a network response using `.json()`.
- [API (Application Programming Interface)](../level_03/api.md) — Related concept: API (Application Programming Interface).
- [XML](../level_07/xml.md) — Related concept: XML.
- [Serialization & Deserialization](../level_07/serialization.md) — JSON serialization.
- [Content-Type & MIME Types](../level_02/content_type.md) — application/json Content-Type.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — Related concept: GraphQL (The REST Alternative).

---

## 7. Key Takeaways
- JSON is a **text format** used to send data across the internet.
- It is language-agnostic (Python, Java, and Go all use it to talk to each other).
- JSON is incredibly strict: **Double quotes only**, and no trailing commas.
- Use `JSON.stringify()` to convert JS Objects into JSON text before sending.
- Use `JSON.parse()` (or `res.json()`) to convert JSON text back into JS Objects after receiving.
