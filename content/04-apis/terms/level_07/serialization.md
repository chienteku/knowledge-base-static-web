# Serialization & Deserialization

> **Level 7 — Data Formats & Serialization**
> The process of converting live, in-memory code objects into a flat string of text that can be sent over a network, and then converting it back into an object on the other side.

---

## 1. Prerequisites
- [Client-Server Model](../level_01/client_server_model.md) — The fundamental reason data must travel.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The most common text format used for Serialization.

---

## 2. Term Category

**Computer Science Concept / Networking (Universal .)**: Serialization & Deserialization is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Inside your computer's RAM, a JavaScript Object (or a Python Dictionary, or a Java Class) is incredibly complex. It has memory addresses, hidden prototype chains, and attached functions. 
If you try to send a raw JavaScript Object through a physical Ethernet cable to a Python server, it will fail completely. An Ethernet cable doesn't understand "JavaScript Objects"—it only understands 1s and 0s (binary text). Furthermore, Python wouldn't know how to read JavaScript memory formats anyway!
To solve this, we invented **Serialization**. Before sending data, we "serialize" it: we strip away all the complex memory stuff and flatten it into a simple, universal string of text (usually JSON). 
When the server receives that string of text, it "deserializes" it back into a live Python Dictionary.

### (2) Reality Metaphor
Imagine you built a massive LEGO castle (an Object in RAM). 
You want to mail it to your friend in another state. You can't fit a built castle into a FedEx box! 
**Serialization:** You break the castle down into individual bricks and write a step-by-step instruction manual. You put the bricks and manual in the box (a flat text string) and mail it.
**Deserialization:** Your friend opens the box, reads the manual, and rebuilds the exact same castle in their own living room.

### (3) What survives Serialization?
Only raw Data survives serialization:
- Strings, Numbers, Booleans, Arrays, and nested Objects.
**What is lost?**
- Functions, Methods, Memory References, and complex data types (like Dates, which are converted into raw strings). You cannot serialize a function!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to send a literal Object

**The mistake:** A developer writes a `fetch` request and sets the body to a raw JavaScript object:
```javascript
const myData = { name: "Bob", age: 25 };
fetch('/api/user', { method: 'POST', body: myData });
```

**Why it's wrong:** The browser's network layer doesn't know how to send an object. It forcefully calls `.toString()` on your object. The Server receives the literal string `"[object Object]"` instead of the actual data!
**Golden Rule:** You must explicitly Serialize your data (using `JSON.stringify()`) before attaching it to an HTTP request body.

---

### Mistake 2: Serializing Complex Non-Serializable Objects (DOM Nodes, Database Connections)

**The mistake:** Attempting to serialize active WebSocket connections, DOM elements, or functions into JSON.

**Why it's wrong:** Active state objects (sockets, file descriptors, functions) cannot be represented as static data structures. Keep non-serializable state out of API DTO payloads.

*Incorrect:*
```javascript
JSON.stringify({ socket: activeSocket }); // ❌ Throws TypeError or serializes to empty object!
```

*Fix:*
```javascript
JSON.stringify({ socketId: activeSocket.id }); // Serialize primitive identifiers only
```

---

### Mistake 3: Ignoring Field Naming Conventions Across Languages (camelCase vs snake_case)

**The mistake:** Returning Python `snake_case` keys directly to JavaScript frontends expecting `camelCase`.

**Why it's wrong:** Inconsistent key casing across API boundaries forces frontend developers to handle mixed casing. Establish explicit serialization DTO transformers.

*Incorrect:*
```json
{
  "first_name": "Alice", // Mixed API response key casing
  "lastName": "Smith"
}
```

*Fix:*
```json
{
  "firstName": "Alice",
  "lastName": "Smith"
}
```


---

## 5. Practice Exercises

### Exercise 1: Canonical JSON Serializer for Cryptographic Signatures

**Scenario:** A security library serializes objects into canonical sorted-key JSON strings to guarantee consistent SHA-256 signature generation.

**Requirements:**
1. Write canonicalJsonStringify(obj).
2. Sort object keys recursively.
3. Return canonical JSON string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function canonicalJsonStringify(obj) {
>   if (obj === null || typeof obj !== "object") {
>     return JSON.stringify(obj);
>   }
>
>   if (Array.isArray(obj)) {
>     return `[${obj.map(canonicalJsonStringify).join(",")}]`;
>   }
>
>   const sortedKeys = Object.keys(obj).sort();
>   const keyValues = sortedKeys.map(key => {
>     return `${JSON.stringify(key)}:${canonicalJsonStringify(obj[key])}`;
>   });
>
>   return `{${keyValues.join(",")}}`;
> }
>
> // Verification tests
> const objA = { b: 2, a: 1 };
> const objB = { a: 1, b: 2 };
>
> const strA = canonicalJsonStringify(objA);
> const strB = canonicalJsonStringify(objB);
>
> console.assert(strA === '{"a":1,"b":2}', "Test 1 Failed");
> console.assert(strA === strB, "Test 2 Failed: Objects with different key orders must produce identical canonical string");
> ```
>
> #### Technical Explanation
>
> 1. **Serialization Definition**: Process of converting in-memory data structures into a string or byte stream for transmission/storage.
> 2. **Key Order Instability**: Standard JSON.stringify does NOT guarantee key iteration order, causing cryptographic signature mismatches.
> 3. **Canonical JSON**: Deterministic serialization format ensuring identical objects produce byte-for-byte identical output.
> 
---

### Exercise 2: Complex Map & Set Serialization Decorator

**Scenario:** A serialization helper extends `JSON.stringify` to support native JavaScript `Map` and `Set` collections.

**Requirements:**
1. Write stringifyWithMapsAndSets(obj).
2. Convert Map to object/entries array, Set to array in replacer.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function stringifyWithMapsAndSets(obj) {
>   return JSON.stringify(obj, (key, value) => {
>     if (value instanceof Map) {
>       return { _dataType: "Map", value: Array.from(value.entries()) };
>     }
>     if (value instanceof Set) {
>       return { _dataType: "Set", value: Array.from(value.values()) };
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const data = {
>   tags: new Set(["js", "api"]),
>   users: new Map([["u1", "Alice"]])
> };
>
> const json = stringifyWithMapsAndSets(data);
> console.assert(json.includes('"_dataType":"Set"'), "Test 1 Failed");
> console.assert(json.includes('"_dataType":"Map"'), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Map/Set Serialization Defect**: By default, JSON.stringify serializes Map and Set objects as empty `{}` objects.
> 2. **Custom Replacer Types**: Decorating serialized payloads with type hints (_dataType) enables accurate deserialization.
> 3. **Data Loss Prevention**: Ensures modern ES6 collection structures survive JSON transport.
> 
---

### Exercise 3: Binary Struct Serialization Engine

**Scenario:** Serializes JavaScript objects directly into fixed-width binary ArrayBuffer byte streams.

**Requirements:**
1. Write serializeStruct(dataObj).
2. Pack fields into ArrayBuffer.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function serializeStruct(dataObj) {
>   // Struct: id (Uint32, 4B), score (Uint16, 2B) = 6 Bytes
>   const buf = new ArrayBuffer(6);
>   const view = new DataView(buf);
>
>   view.setUint32(0, dataObj.id || 0);
>   view.setUint16(4, dataObj.score || 0);
>
>   return buf;
> }
>
> // Verification tests
> const buf = serializeStruct({ id: 100, score: 95 });
> console.assert(buf.byteLength === 6, "Test 1 Failed");
>
> const view = new DataView(buf);
> console.assert(view.getUint32(0) === 100, "Test 2 Failed");
> console.assert(view.getUint16(4) === 95, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Binary Struct Serialization**: Packs object attributes into low-level binary memory buffers without text encoding.
> 2. **Zero Overhead**: Eliminates string quote, colon, and comma characters.
> 3. **Embedded Systems Use**: Standard serialization method for C/C++ microcontrollers and low-latency networking.
---

## 6. Related Terms
- [JSON Methods (parse / stringify)](json_methods.md) — The actual JavaScript functions used to execute this concept.
- [Content-Type & MIME Types](../level_02/content_type.md) — Related concept: Content-Type & MIME Types.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — Related concept: JSON (JavaScript Object Notation).

---

## 7. Key Takeaways
- **Serialization** is converting a live code object into a flat string of text (for network travel or saving to a database).
- **Deserialization** is parsing that string of text back into a live code object.
- Functions and complex memory references cannot be serialized.
- It is the universal mechanism that allows different programming languages (JS, Python, Java) to talk to each other.
