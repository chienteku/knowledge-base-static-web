# Content-Type & MIME Types

> **Level 2 — HTTP Anatomy**
> How sender declares payload format (`application/json`, `text/html`, `multipart/form-data`).

---

## 1. Prerequisites
- [HTTP Headers](http_headers.md) — Metadata wrappers sent with HTTP payloads.

---

## 2. Term Category

**Data Format (Universal: Configured inside all HTTP requests and responses.)**: Content-Type & MIME Types is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Data traveling across network cables consists of raw streams of binary bytes. When a client or server receives a message body, it only sees zeroes and ones. How does the receiving application know how to interpret those bytes? Do they represent a JPEG image, a JSON dataset, a plain text message, or a HTML page?

To resolve this, HTTP uses the **`Content-Type`** header:
- The sender uses the `Content-Type` header to declare the exact format of the payload.
- The format is defined using **MIME Types** (Multipurpose Internet Mail Extensions), structured as `type/subtype`.

#### Core MIME Types for Web Developers:
- **`application/json`:** The industry standard for modern APIs. Tells the receiver to parse the body as a JSON string.
- **`application/x-www-form-urlencoded`:** Used by default when submitting standard HTML forms. Formats data as a flat query string of key-value pairs (e.g. `name=Bob&age=30`).
- **`multipart/form-data`:** Used for **uploading files**. It divides the request body into multiple distinct parts, separated by boundary markers, allowing you to upload images alongside text metadata.
- **`text/html`:** Tells the browser to parse the incoming stream as an HTML web page.
- **`image/png` / `image/jpeg`:** Tells the browser to render the payload as an image.

### (2) Reality Metaphor
Imagine receiving a wrapped **cardboard package** in the mail.
- The raw payload is the cardboard container. You cannot see what is inside.
- The **`Content-Type`** header is a **shipping label** stamped on the outside of the box:
  - If the label reads `document/json`, you take the box to your desk and open it with a reader program.
  - If the label reads `multipart/files`, you know the box contains multiple wrapped items inside (like a shirt and shoes) that you must unpack individually.
  - If the label is missing, you might try to eat the contents thinking it's food, or throw it away because you cannot identify it.

### (3) JavaScript & HTTP Examples

#### Fetch Request sending JSON
When sending JSON payloads, you must explicitly declare the Content-Type header so the server knows to parse the body as JSON:

```javascript
fetch('/api/users', {
  method: 'POST',
  headers: {
    // 1. Declare payload format
    'Content-Type': 'application/json; charset=utf-8' 
  },
  // 2. Stringify the object
  body: JSON.stringify({ name: 'Alice', role: 'admin' }) 
});
```

#### Node.js Express server matching parser middleware
Servers check the `Content-Type` header to choose which internal parser to run:
```javascript
import express from 'express';
const app = express();

// Middleware that intercepts 'application/json' requests 
// and parses them into req.body objects
app.use(express.json()); 

app.post('/api/users', (req, res) => {
  // If the client forgot 'Content-Type: application/json', 
  // req.body will be undefined or empty!
  console.log("User Name:", req.body.name); 
  res.sendStatus(201);
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `Content-Type: application/json` header in client requests

**The mistake:** Sending a JSON string via `body: JSON.stringify(data)` in a fetch request, but omitting the `Content-Type` header.

**Why it's wrong:** Without the header, the server defaults to assuming the body is plain text or urlencoded. The server's JSON parsing middleware skips the request, resulting in the backend reading `req.body` as `undefined` or an empty string, causing server crashes.

---

### Mistake 2: Omitting `Content-Type` Header When Sending JSON Request Payloads

**The mistake:** Sending a stringified JSON body in a POST request without specifying `Content-Type: application/json`.

**Why it's wrong:** Without `Content-Type: application/json`, backend parsers (like Express `express.json()`) treat the incoming request body as raw text or ignore it, causing `req.body` to be `undefined`.

*Incorrect:*
```javascript
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'Alice' })
  // ❌ Missing Content-Type header!
});
```

*Fix:*
```javascript
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' })
});
```

---

### Mistake 3: Manually Setting `Content-Type: multipart/form-data` When Sending `FormData` Objects

**The mistake:** Manually adding `headers: { 'Content-Type': 'multipart/form-data' }` when uploading files via JS `FormData`.

**Why it's wrong:** Manually setting `multipart/form-data` strips the mandatory boundary string (e.g. `; boundary=----WebKitFormBoundary...`), making the backend unable to parse file chunks.

*Incorrect:*
```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);
fetch('/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }, // ❌ Destroys boundary string!
  body: form
});
```

*Fix:*
```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);
fetch('/upload', {
  method: 'POST',
  body: form // Browser automatically adds Content-Type with boundary parameter
});
```


---

## 5. Practice Exercises

### Exercise 1: Content-Type Header Parser & Parameters Extractor

**Scenario:** A backend server middleware parses Content-Type header strings to extract media type and optional charset parameters.

**Requirements:**
1. Write parseContentTypeHeader(headerStr).
2. Extract main media type (e.g. "application/json").
3. Extract boundary or charset parameters.
4. Return parsed object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseContentTypeHeader(headerStr) {
>   if (!headerStr || typeof headerStr !== "string") {
>     return { mediaType: "application/octet-stream", parameters: {} };
>   }
>
>   const parts = headerStr.split(";").map(p => p.trim());
>   const mediaType = parts[0].toLowerCase();
>   const parameters = {};
>
>   for (let i = 1; i < parts.length; i++) {
>     const [key, val] = parts[i].split("=");
>     if (key && val) {
>       parameters[key.toLowerCase()] = val.replace(/^"|"$/g, "");
>     }
>   }
>
>   return { mediaType, parameters };
> }
>
> // Verification tests
> const res1 = parseContentTypeHeader("application/json; charset=utf-8");
> console.assert(res1.mediaType === "application/json", "Test 1 Failed");
> console.assert(res1.parameters.charset === "utf-8", "Test 2 Failed");
>
> const res2 = parseContentTypeHeader('multipart/form-data; boundary="---12345"');
> console.assert(res2.mediaType === "multipart/form-data", "Test 3 Failed");
> console.assert(res2.parameters.boundary === "---12345", "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Content-Type Structure**: Consists of primary media type (type/subtype) followed by optional semicolon-separated parameters.
> 2. **charset Parameter**: Specifies text character encoding (e.g. utf-8) used to decode payload bytes.
> 3. **boundary Parameter**: Specifies unique delimiter string used in multipart/form-data file upload requests.
> 
---

### Exercise 2: Unsupported Media Type (415) Guard Middleware

**Scenario:** An API endpoint validator verifies that incoming POST request Content-Type matches expected endpoint media types.

**Requirements:**
1. Write validateRequestContentType(request, allowedMediaTypes).
2. Extract Content-Type.
3. Return 415 Unsupported Media Type error if disallowed.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateRequestContentType(request, allowedMediaTypes = ["application/json"]) {
>   const header = request?.headers?.["content-type"] || request?.headers?.["Content-Type"];
>   if (!header) {
>     return { valid: false, status: 415, error: "Missing Content-Type header" };
>   }
>
>   const mediaType = header.split(";")[0].trim().toLowerCase();
>   if (!allowedMediaTypes.includes(mediaType)) {
>     return { valid: false, status: 415, error: `Media type ${mediaType} not allowed` };
>   }
>
>   return { valid: true, mediaType };
> }
>
> // Verification tests
> const req1 = { headers: { "Content-Type": "application/json" } };
> console.assert(validateRequestContentType(req1).valid === true, "Test 1 Failed");
>
> const req2 = { headers: { "Content-Type": "text/xml" } };
> const res2 = validateRequestContentType(req2);
> console.assert(res2.valid === false && res2.status === 415, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **415 Status Code**: HTTP status code 415 Unsupported Media Type indicates server refuses to accept payload format.
> 2. **Defensive Server Validation**: Ensures server payload parsers do not attempt to process unexpected file formats.
> 3. **Security Hardening**: Prevents XML External Entity (XXE) attacks by rejecting unvalidated XML payloads on JSON endpoints.
> 
---

### Exercise 3: Form vs JSON Payload Body Decoder Router

**Scenario:** An API request router routes incoming requests to appropriate body decoders based on Content-Type.

**Requirements:**
1. Write routePayloadDecoder(contentTypeHeader, rawBody).
2. Route application/json to JSON.parse.
3. Route application/x-www-form-urlencoded to URLSearchParams.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function routePayloadDecoder(contentTypeHeader, rawBody) {
>   if (!contentTypeHeader) return null;
>   const mediaType = contentTypeHeader.split(";")[0].trim().toLowerCase();
>
>   if (mediaType === "application/json") {
>     return JSON.parse(rawBody);
>   }
>   if (mediaType === "application/x-www-form-urlencoded") {
>     const params = new URLSearchParams(rawBody);
>     const result = {};
>     for (const [k, v] of params.entries()) {
>       result[k] = v;
>     }
>     return result;
>   }
>   throw new Error(`Decoder unavailable for ${mediaType}`);
> }
>
> // Verification tests
> const jsonDecoded = routePayloadDecoder("application/json", '{"name":"Alice"}');
> console.assert(jsonDecoded.name === "Alice", "Test 1 Failed");
>
> const formDecoded = routePayloadDecoder("application/x-www-form-urlencoded", "name=Bob&age=25");
> console.assert(formDecoded.name === "Bob" && formDecoded.age === "25", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Content-Driven Processing**: Server selects parsing strategy based on Content-Type header rather than endpoint path.
> 2. **application/x-www-form-urlencoded**: Standard form encoding format where key-value pairs are joined by & and =.
> 3. **Structured Parsing Safety**: Encapsulates body decoding behind unified interface for clean handler processing.
---

## 6. Related Terms
- [Request Body & Payloads](request_body.md) — The raw message payload described by Content-Type.
- [Serialization & Deserialization](../level_07/serialization.md) — The process of transforming objects into raw MIME formats.
- [FormData & Multipart Uploads](../level_05/formdata.md) — Related concept: FormData & Multipart Uploads.
- [HTTP Headers](http_headers.md) — Related concept: HTTP Headers.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — Related concept: JSON (JavaScript Object Notation).

---

## 7. Key Takeaways
- The `Content-Type` header tells the receiver how to decode and parse the raw binary payload stream.
- MIME Types represent formats using the `type/subtype` syntax structure.
- `application/json` is the standard MIME type for modern JSON APIs.
- Use `multipart/form-data` when uploading files to split payloads into separate segments.
- Always declare `Content-Type: application/json` when posting stringified JSON objects to prevent server parsing failures.
