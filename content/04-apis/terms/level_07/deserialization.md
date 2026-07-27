# Deserialization / Parsing

> **Level 7 — Data Formats & Serialization**
> Turning a wire string back into a live object (the inverse of serialization).

---

## 1. Prerequisites
- [Serialization & Deserialization](./serialization.md) — The core high-level data transport concepts.
- [JSON Methods (parse / stringify)](./json_methods.md) — The standard JSON transformation methods.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Universal concept across frontend clients and backend database parsers.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Bug Spotter

**Problem:** Review this backend handler. Under what scenario will this route crash the server process?

```javascript
app.post('/api/settings', (req, res) => {
  const settings = JSON.parse(req.body.rawSettingsString);
  saveSettingsToDatabase(settings);
  res.send("Success");
});
```

> [!check]- Answer
> - If the client submits a request where `req.body.rawSettingsString` is empty, undefined, or contains invalid JSON formatting (like missing closing brackets), `JSON.parse` will throw an unhandled exception, terminating the Express server process.


---

### Exercise 2: Serialization vs Deserialization Definition

**Problem:** Distinguish between Serialization and Deserialization.

**Expected output:**
```text
Serialization converts in-memory data objects into a transferable string/binary stream. Deserialization reconstructs a stream into in-memory data objects.
```

> [!check]- Answer
> ```text
> Serialization -> Object in RAM ===> Byte Stream / JSON String
> Deserialization -> Byte Stream / JSON String ===> Object in RAM
> ```
> - **Explanation:** Serialization prepares data for transport; Deserialization reconstructs objects.
---

### Exercise 3: Zod Schema Deserialization Validation

**Problem:** Write Zod schema enforcing string `username` and positive integer `age`.

**Expected output:**
```text
const userSchema = z.object({ username: z.string(), age: z.number().int().positive() });
```

> [!check]- Answer
> ```javascript
> const userSchema = z.object({
> username: z.string(),
> age: z.number().int().positive()
> });
> ```
> - **Explanation:** Schema validation verifies deserialized data against structural rules.
---

## 7. Related Terms
- [JSON Methods (parse / stringify)](./json_methods.md) — The functions executing standard serialization and deserialization in JavaScript.
- [XML](./xml.md) — The alternative markup data format requiring parsing libraries.

---

## 8. Key Takeaways
- Deserialization turns serialized text streams back into active memory objects.
- Parsing untrusted text input without safety measures is a leading cause of software crashes and security breaches.
- Always wrap `JSON.parse()` in a `try/catch` block to handle syntax formatting errors.
- Schema validation libraries verify the parsed object structure before it interacts with your database.
