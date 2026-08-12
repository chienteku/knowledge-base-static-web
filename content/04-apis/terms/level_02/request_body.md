# Request Body & Payloads

> **Level 2 — HTTP Anatomy**
> The actual data (like a JSON object, a file, or form inputs) sent inside an HTTP Request or returned in an HTTP Response.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](http_methods.md) — Not all methods are allowed to have a body!
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The most common format for a payload.

---

## 2. Term Category

**HTTP Standard / Data Transfer (Universal Standard)**: Request Body & Payloads is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to read a user's profile, you can just put their ID in the URL (`/users/5`). But what if you are submitting a massive registration form with a username, password, biography, profile picture, and home address? 
You cannot put all of that data into the URL. URLs have character limits, and URLs are saved in browser histories (so your password would be visible to anyone looking at your history!). 
To solve this, HTTP allows you to attach a **Body** (also called a **Payload**) to your request. It is a secure, theoretically unlimited-size block of data sent "inside the envelope" of the HTTP message, completely hidden from the URL.

### (2) Reality Metaphor
When you send a package in the mail:
- The **URL** is the address printed on the outside of the box.
- The **Headers** are the "Fragile" stickers and postage stamps on the outside.
- The **Body (Payload)** is the actual gift sitting inside the box.

### (3) The Strict Rule: `GET` vs `POST`
- **`POST`, `PUT`, `PATCH`**: These methods are designed to send data to the server, so they **ALLOW** a Body.
- **`GET`, `DELETE`**: These methods are designed to just point at a URL and say "Read this" or "Destroy this". According to the HTTP specification, **`GET` requests CANNOT have a Body.** (If you try to attach a body to a `GET` request using `fetch()`, the browser will throw a fatal error and crash your code).

### (4) Code Examples

#### Sending a JSON Body
```javascript
const userData = {
  username: "chienteku",
  password: "supersecretpassword123"
};

fetch('https://api.example.com/register', {
  method: 'POST', // Must be POST/PUT/PATCH to have a body!
  headers: {
    'Content-Type': 'application/json' // Telling the server what's inside the box
  },
  // The Body MUST be converted to a raw string!
  body: JSON.stringify(userData) 
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to send a body in a GET request

**The mistake:** A developer has a very complex search filter (Price: $10-50, Color: Red, Size: M). They want to send this data to the server to get a list of products, so they put it in the `body` of a `GET` request.

**Why it's wrong:** The HTTP/1.1 specification explicitly forbids `GET` requests from having a body. `fetch()` enforces this strictly and will instantly throw a `TypeError`. 
**Solution:** If you are reading data (GET), you must put all your filters into the URL as [Query Parameters](../level_02/query_params.md) instead! If the data is truly too massive for a URL, you must compromise and use a `POST` request instead, even though you are technically just "reading" data.

---

### Mistake 2: Attaching a Request Body to HTTP `GET` or `DELETE` Requests

**The mistake:** Sending a JSON payload inside a `GET` request body.

**Why it's wrong:** HTTP/1.1 and HTTP/2 specifications state that request bodies on `GET` requests have no defined semantics. Many proxies, firewalls, and CDNs drop GET request bodies completely.

*Incorrect:*
```http
GET /api/search HTTP/1.1
Content-Type: application/json

{"query": "shoes"} // ❌ Proxies drop GET request bodies!
```

*Fix:*
```http
GET /api/search?q=shoes HTTP/1.1 ; Pass parameters in query string or use POST for complex queries
```

---

### Mistake 3: Failing to Enforce Payload Size Limits on Incoming Server Request Bodies

**The mistake:** Configuring backend body parsers without setting a maximum `limit` parameter.

**Why it's wrong:** Unrestricted request body parsers allow malicious clients to send 500MB JSON payloads, causing server out-of-memory crashes (Denial of Service).

*Incorrect:*
```javascript
// Express without size limit
app.use(express.json()); // ❌ Vulnerable to payload memory crashes!
```

*Fix:*
```javascript
// Enforce strict payload limit
app.use(express.json({ limit: '100kb' }));
```


---

## 5. Practice Exercises

### Exercise 1: Streaming Request Body Chunk Accumulator & Max Size Guard

**Scenario:** A Node.js HTTP server parses incoming stream chunks, enforcing a strict maximum byte limit to prevent Memory Exhaustion Denial of Service.

**Requirements:**
1. Write accumulateRequestBody(stream, maxBytes).
2. Listen to 'data' chunks.
3. Throw 413 Payload Too Large if byte length exceeds maxBytes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function accumulateRequestBody(stream, maxBytes = 1_000_000) {
>   let totalBytes = 0;
>   const chunks = [];
>
>   for await (const chunk of stream) {
>     totalBytes += chunk.length;
>     if (totalBytes > maxBytes) {
>       const err = new Error("Payload Too Large");
>       err.statusCode = 413;
>       throw err;
>     }
>     chunks.push(chunk);
>   }
>
>   return Buffer.concat(chunks).toString("utf-8");
> }
>
> // Verification tests
> async function* createMockStream(chunkList) {
>   for (const chunk of chunkList) {
>     yield Buffer.from(chunk);
>   }
> }
>
> accumulateRequestBody(createMockStream(["hello ", "world"]), 100).then(body => {
>   console.assert(body === "hello world", "Test 1 Failed");
> });
>
> accumulateRequestBody(createMockStream(["a".repeat(200)]), 100).catch(err => {
>   console.assert(err.statusCode === 413, "Test 2 Failed: Must throw 413 on size overflow");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Streamed Payload Accumulation**: HTTP request bodies are transmitted asynchronously as streams of data chunks.
> 2. **413 Payload Too Large**: HTTP status code 413 indicates request body exceeds server size limits.
> 3. **Memory DoS Protection**: Enforcing byte limits prevents attackers from crashing servers with giant payload memory buffers.
> 
---

### Exercise 2: Request Body JSON Schema Validator

**Scenario:** An API endpoint validator verifies that incoming parsed JSON request bodies contain required fields and valid data types.

**Requirements:**
1. Write validateBodySchema(bodyObj, requiredFields).
2. Verify existence and non-null values for requiredFields.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateBodySchema(bodyObj, requiredFieldsMap) {
>   if (!bodyObj || typeof bodyObj !== "object") {
>     return { valid: false, errors: ["Missing or non-object body"] };
>   }
>
>   const errors = [];
>   for (const [field, expectedType] of Object.entries(requiredFieldsMap)) {
>     const val = bodyObj[field];
>     if (val === undefined || val === null) {
>       errors.push(`Field '${field}' is required`);
>     } else if (typeof val !== expectedType) {
>       errors.push(`Field '${field}' must be of type ${expectedType}`);
>     }
>   }
>
>   return {
>     valid: errors.length === 0,
>     errors
>   };
> }
>
> // Verification tests
> const schema = { name: "string", age: "number" };
>
> const v1 = validateBodySchema({ name: "Alice", age: 30 }, schema);
> console.assert(v1.valid === true, "Test 1 Failed");
>
> const v2 = validateBodySchema({ name: "Alice", age: "thirty" }, schema);
> console.assert(v2.valid === false && v2.errors.length === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Input Validation Principle**: Never trust client inputs; always validate request body structure and types before processing.
> 2. **Schema Validation Contracts**: Schema definitions enforce consistent data contracts between frontend and backend.
> 3. **400 Bad Request Feedback**: Returning clear validation error lists helps client developers fix bad request payloads.
> 
---

### Exercise 3: Raw Binary Octet-Stream Body Processor

**Scenario:** A file upload endpoint processes `application/octet-stream` binary request bodies, calculating SHA-256 checksums of the raw payload.

**Requirements:**
1. Write processBinaryPayload(binaryBuffer, mockCrypto).
2. Calculate hash of raw binary buffer.
3. Return byte size and checksum.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processBinaryPayload(binaryBuffer, mockCrypto) {
>   if (!binaryBuffer || !Buffer.isBuffer(binaryBuffer)) {
>     return { error: "Expected Buffer payload" };
>   }
>
>   const checksum = mockCrypto 
>     ? mockCrypto.hash(binaryBuffer) 
>     : `hash_${binaryBuffer.length}`;
>
>   return {
>     byteLength: binaryBuffer.length,
>     checksum,
>     type: "application/octet-stream"
>   };
> }
>
> // Verification tests
> const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
> const res = processBinaryPayload(buf);
>
> console.assert(res.byteLength === 4, "Test 1 Failed");
> console.assert(res.type === "application/octet-stream", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **application/octet-stream**: Standard MIME type for unformatted raw binary data transfers (files, images, compiled binaries).
> 2. **Binary Buffer Manipulation**: Node.js Buffer represents fixed-length sequences of raw memory bytes.
> 3. **Payload Integrity Verification**: Calculating checksums (SHA-256) verifies binary payload was not corrupted during transit.
---

## 6. Related Terms
- [HTTP Headers](http_headers.md) — How you tell the server what format the body is in (e.g., `Content-Type`).
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The format you must convert your payload into.
- [Content-Type & MIME Types](content_type.md) — Related concept: Content-Type & MIME Types.
- [Query Parameters & Path Variables](query_params.md) — Related concept: Query Parameters & Path Variables.
- [URL Encoding (Percent-Encoding)](url_encoding.md) — Related concept: URL Encoding (Percent-Encoding).

---

## 7. Key Takeaways
- The **Body (Payload)** is the actual data you are sending or receiving.
- **`POST`, `PUT`, and `PATCH`** use bodies to send data to the server.
- **`GET` and `DELETE`** are generally forbidden from having bodies.
- You must convert your JavaScript objects into strings (via `JSON.stringify()`) before putting them in the body.
- Highly sensitive data (passwords, tokens) must ALWAYS go in the Body or Headers, never in the URL.
