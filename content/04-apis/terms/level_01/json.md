# JSON (JavaScript Object Notation)

> **Level 1 — The Foundations of the Web**
> The universal, lightweight text format used for sending data back and forth between Clients and Servers.

---

## 1. Prerequisites
- [HTTP / HTTPS](http_https.md) — HTTP is the envelope; JSON is the letter inside the envelope.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal Standard** (Used by virtually every programming language, not just JavaScript!).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Spot the Syntax Error

**Problem:** Why is this JSON invalid?
```json
{
  name: 'John',
  "age": 30,
}
```

**Expected output:**
> [!check]- Answer
> ```text
> There are 3 errors here!
> 1. The key `name` is missing double quotes (`"name"`).
> 2. The value `'John'` is using single quotes instead of double quotes.
> 3. There is a trailing comma after `30`.
> ```
> - JSON is incredibly strict compared to standard JavaScript. Check the quotes!
> 
---

### Exercise 2: Valid JSON Validator

**Problem:** Identify the 2 invalid lines in the following JSON snippet:
```json
{
  "id": 101,
  "title": "API Essentials",
  "active": true,
  "tags": ['rest', 'http'],
  "author": undefined
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Line 5: Single quotes on string array items ['rest', 'http']
> Line 6: undefined is not a valid JSON primitive value
> ```
> ```json
> {
> "id": 101,
> "title": "API Essentials",
> "active": true,
> "tags": ["rest", "http"],
> "author": null
> }
> ```
> - **Explanation:** JSON requires double quotes for strings and `null` instead of `undefined`.
---

### Exercise 3: Date Object Serialization Behavior

**Problem:** What data type does a JavaScript `Date` object serialize to when passed to `JSON.stringify()`?

**Expected output:**
> [!check]- Answer
> ```text
> An ISO 8601 string representation (e.g. "2026-07-25T01:00:00.000Z").
> ```
> ```text
> An ISO 8601 string representation (e.g. "2026-07-25T01:00:00.000Z").
> ```
> - **Explanation:** Date instances implement `.toJSON()` which returns ISO formatted strings.
---

## 7. Related Terms
- [Request Body & Payloads](../level_02/request_body.md) — JSON is the most common format placed inside the Body of an HTTP request.
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — How we extract JSON out of a network response using `.json()`.
- [API (Application Programming Interface)](../level_03/api.md) — Related concept: API (Application Programming Interface).
- [XML](../level_07/xml.md) — Related concept: XML.
- [Serialization & Deserialization](../level_07/serialization.md) — JSON serialization.
- [Content-Type & MIME Types](../level_02/content_type.md) — application/json Content-Type.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — Related concept: GraphQL (The REST Alternative).

---

## 8. Key Takeaways
- JSON is a **text format** used to send data across the internet.
- It is language-agnostic (Python, Java, and Go all use it to talk to each other).
- JSON is incredibly strict: **Double quotes only**, and no trailing commas.
- Use `JSON.stringify()` to convert JS Objects into JSON text before sending.
- Use `JSON.parse()` (or `res.json()`) to convert JSON text back into JS Objects after receiving.
