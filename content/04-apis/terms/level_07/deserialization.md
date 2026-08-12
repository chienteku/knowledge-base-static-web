# Deserialization / Parsing

> **Level 7 — Data Formats & Serialization**
> Turning a wire string back into a live object (the inverse of serialization).

---

## 1. Prerequisites
- [Serialization & Deserialization](serialization.md) — The core high-level data transport concepts.
- [JSON Methods (parse / stringify)](json_methods.md) — The standard JSON transformation methods.

---

## 2. Term Category

**Data Format (Universal: Universal concept across frontend clients and backend database parsers.)**: Deserialization / Parsing is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While **Serialization** flattens an active, in-memory object (like a JavaScript Object) into a text string (like JSON) so it can travel across a network, **Deserialization (or Parsing)** is the reverse process. It reads the incoming flat string from the network card, interprets its syntax, and recreates a live, interactive object in the receiver's memory.

Because deserialization instantiates fresh memory structures based on raw input, it is a critical security and stability boundary:
- **Unhandleable Crashes:** If your application attempts to parse a string that is not valid JSON (for instance, an empty response, or a raw HTML error page returned by a proxy), `JSON.parse()` will throw a syntax error. If not caught, this crashes your Node.js process instantly.
- **Security Risks (RCE):** In some programming ecosystems (like Java or Python's `pickle` library), deserialization can instantiate executable code. Attackers exploit this to execute malicious code on the server, a vulnerability known as **Insecure Deserialization**.
- **Data Corruption:** Even if the JSON syntax is valid, the data might be missing required properties or contain wrong types (e.g. `price: "free"` instead of a number), breaking database queries.

#### Safe Deserialization Checklist
1.  **Always wrap parsing in a `try/catch` block** to catch syntax errors.
2.  **Validate the schema** (using libraries like Zod or Ajv) immediately after parsing to ensure the shape of the object matches your expectations before execution.

---

### (2) Reality Metaphor
Imagine ordering a **prefabricated kit house** from a manufacturer.
- **Serialization** is the manufacturer taking a model house, disassembly of the frames into flat panels, loading them into a shipping container, and sending them to your site.
- **Deserialization** is your construction team assembling the panels back into a standing house.
  - If a panel is warped or broken (corrupted string), trying to hammer it into place will crack the frames and collapse the build (**crashes the program**).
  - If you construct the house blindly without checking the materials, you might assemble a box containing a booby-trap left by an attacker (**RCE security breach**).

---

### (3) JavaScript Implementation Example

#### Safe Parsing and Validation with `try/catch` and Zod Schema
```javascript
import { z } from 'zod';

// 1. Define the expected shape of the object
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

function safeDeserializeUser(rawJsonString) {
  let parsedData;
  
  try {
    // 2. Safely parse the string to catch malformed syntax errors
    parsedData = JSON.parse(rawJsonString);
  } catch (error) {
    console.error("Syntax Error: Failed to parse raw string. Malformed JSON.");
    return null;
  }
  
  // 3. Validate the structural schema
  const validationResult = UserSchema.safeParse(parsedData);
  
  if (!validationResult.success) {
    console.error("Validation Error: Parsed object has incorrect schema structure:", validationResult.error.format());
    return null;
  }
  
  // Returns validated, safe object structure
  return validationResult.data; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking `JSON.parse` directly on API responses without error wrapping

**The mistake:** Assuming the backend will always return valid JSON and writing:
```javascript
const response = await fetch('/api/user');
const text = await response.text();
const user = JSON.parse(text); // CRASH HAZARD!
```

**Why it's wrong:** If the server is offline or experiencing a `502 Bad Gateway` error, the response body might be a raw HTML error page from the Nginx proxy (e.g. `<html><body>502...`). Passing HTML text directly to `JSON.parse` throws a syntax error that crashes the client browser script or Node handler process.

---

### Mistake 2: Deserializing Untrusted Payloads into Executable Code (Insecure Deserialization Vulnerability)

**The mistake:** Using `eval()`, Python `pickle.loads()`, or Java `ObjectInputStream` on untrusted client API payloads.

**Why it's wrong:** Insecure deserialization allows attackers to inject malicious executable objects, executing Remote Code Execution (RCE) on the server process.

*Incorrect:*
```python
# Vulnerable Python backend
import pickle
data = pickle.loads(user_input_bytes) # ❌ RCE Vulnerability!
```

*Fix:*
```python
# Use safe text data formats like JSON:
import json
data = json.loads(user_input_string)
```

---

### Mistake 3: Failing to Validate Types and Schemas After Deserialization

**The mistake:** Calling `JSON.parse(req.body)` and assuming parsed fields contain valid data types without schema validation.

**Why it's wrong:** `JSON.parse()` produces unvalidated JS objects. Clients can send unexpected types (numbers instead of strings, array instead of object), breaking downstream code. Use schema validators (Zod/Joi).

*Incorrect:*
```javascript
const data = JSON.parse(req.body);
data.email.toLowerCase(); // ❌ Crashes if client sent email: 123!
```

*Fix:*
```javascript
const schema = z.object({ email: z.string().email() });
const data = schema.parse(JSON.parse(req.body)); // Validates type schema
```


---

## 5. Practice Exercises

### Exercise 1: Safe API Payload Deserializer with Custom Reviver

**Scenario:** A resilient API client parses incoming JSON payloads, using a custom reviver to convert ISO date strings into Date instances while sanitizing keys.

**Requirements:**
1. Write deserializeApiPayload(jsonStr).
2. Revive ISO date strings.
3. Return deserialized object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function deserializeApiPayload(jsonStr) {
>   if (!jsonStr || typeof jsonStr !== "string") return null;
>
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
> const json = '{"user":"Alice","createdAt":"2026-08-12T10:00:00.000Z"}';
> const data = deserializeApiPayload(json);
>
> console.assert(data.user === "Alice", "Test 1 Failed");
> console.assert(data.createdAt instanceof Date, "Test 2 Failed: Must revive ISO string to Date instance");
> ```
>
> #### Technical Explanation
>
> 1. **Deserialization Concept**: Process of converting a serialized text/binary format (JSON) back into native language objects in memory.
> 2. **JSON Reviver Function**: JSON.parse(text, reviver) inspects each key-value pair during object construction.
> 3. **Type Hydration**: Hydrates primitive text strings back into rich domain types (Dates, BigInts, Maps).
> 
---

### Exercise 2: Prototype Pollution Security Guard in Object Deserialization

**Scenario:** A secure JSON deserializer strips dangerous keys (`__proto__`, `constructor`, `prototype`) to defend against Prototype Pollution attacks.

**Requirements:**
1. Write safeObjectDeserializer(jsonStr).
2. Reject or strip dangerous keys in JSON reviver.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeObjectDeserializer(jsonStr) {
>   if (!jsonStr || typeof jsonStr !== "string") return null;
>
>   return JSON.parse(jsonStr, (key, value) => {
>     if (key === "__proto__" || key === "constructor" || key === "prototype") {
>       return undefined; // Strip dangerous key
>     }
>     return value;
>   });
> }
>
> // Verification tests
> const maliciousJson = '{"name":"Normal","__proto__":{"admin":true}}';
> const parsed = safeObjectDeserializer(maliciousJson);
>
> console.assert(parsed.name === "Normal", "Test 1 Failed");
> console.assert(Object.prototype.admin === undefined, "Test 2 Failed: Prototype pollution prevented");
> ```
>
> #### Technical Explanation
>
> 1. **Prototype Pollution Vulnerability**: Attackers inject __proto__ keys into JSON payloads to pollute Object.prototype, triggering Remote Code Execution.
> 2. **Sanitizing Revivers**: Filtering dangerous keys during deserialization prevents polluting base Object prototypes.
> 3. **Object.create(null)**: Creating dictionary objects with Object.create(null) avoids prototype inheritance risks.
> 
---

### Exercise 3: Polymorphic Class Instance Deserializer Factory

**Scenario:** An API payload factory maps deserialized JSON objects to specific class instances based on a `type` discriminator attribute.

**Requirements:**
1. Write instantiatePayloadClass(jsonObj, classRegistry).
2. Instantiate matching class based on type attribute.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class UserAccount {
>   constructor(data) { this.id = data.id; this.role = "USER"; }
> }
>
> class AdminAccount {
>   constructor(data) { this.id = data.id; this.role = "ADMIN"; }
> }
>
> function instantiatePayloadClass(jsonObj, classRegistry) {
>   if (!jsonObj || !jsonObj.type) return jsonObj;
>
>   const TargetClass = classRegistry[jsonObj.type];
>   if (!TargetClass) return jsonObj;
>
>   return new TargetClass(jsonObj);
> }
>
> // Verification tests
> const registry = { USER: UserAccount, ADMIN: AdminAccount };
>
> const userInst = instantiatePayloadClass({ type: "USER", id: 1 }, registry);
> console.assert(userInst instanceof UserAccount && userInst.role === "USER", "Test 1 Failed");
>
> const adminInst = instantiatePayloadClass({ type: "ADMIN", id: 2 }, registry);
> console.assert(adminInst instanceof AdminAccount && adminInst.role === "ADMIN", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Type Discriminators**: Attributes (e.g. type: 'USER') indicating which concrete domain class an object belongs to.
> 2. **Polymorphic Deserialization**: Instantiates specialized class behavior based on payload type fields.
> 3. **Domain-Driven Design (DDD)**: Bridge between untyped DTO payloads and domain class methods.
---

## 6. Related Terms
- [JSON Methods (parse / stringify)](json_methods.md) — The functions executing standard serialization and deserialization in JavaScript.
- [XML](xml.md) — The alternative markup data format requiring parsing libraries.

---

## 7. Key Takeaways
- Deserialization turns serialized text streams back into active memory objects.
- Parsing untrusted text input without safety measures is a leading cause of software crashes and security breaches.
- Always wrap `JSON.parse()` in a `try/catch` block to handle syntax formatting errors.
- Schema validation libraries verify the parsed object structure before it interacts with your database.
