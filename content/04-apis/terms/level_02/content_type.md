# Content-Type & MIME Types

> **Level 2 — HTTP Anatomy**
> How sender declares payload format (`application/json`, `text/html`, `multipart/form-data`).

---

## 1. Prerequisites
- [HTTP Headers](./http_headers.md) — Metadata wrappers sent with HTTP payloads.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Configured inside all HTTP requests and responses.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: MIME Type Matcher

**Problem:** Match the request scenario to the correct MIME Type:

1. Submitting a user feedback form containing a text message and a profile picture file.
2. Fetching a list of inventory products from a REST API endpoint.
3. Submitting a simple login form containing username and password fields without any files.

> [!check]- Answer
> - 1. **`multipart/form-data`** (Necessary to segment files and metadata inputs).
> - 2. **`application/json`** (Standard API text payload format).
> - 3. **`application/x-www-form-urlencoded`** (Standard key-value form format).


---

### Exercise 2: Common MIME Type Mapping

**Problem:** Match the payload format to its standard MIME type:
1. JSON
2. HTML document
3. URL-encoded form data
4. Binary PNG image

**Expected output:**
```text
1. application/json
2. text/html
3. application/x-www-form-urlencoded
4. image/png
```

> [!check]- Answer
> ```text
> 1. application/json
> 2. text/html
> 3. application/x-www-form-urlencoded
> 4. image/png
> ```
> - **Explanation:** MIME types standardize representation formats for web streams.
---

### Exercise 3: Charset Encoding Parameter

**Problem:** Write `Content-Type` header value for UTF-8 encoded JSON payload.

**Expected output:**
```text
Content-Type: application/json; charset=utf-8
```

> [!check]- Answer
> ```http
> Content-Type: application/json; charset=utf-8
> ```
> - **Explanation:** The optional `charset` parameter specifies text character encoding.
---

## 7. Related Terms
- [Request Body & Payloads](./request_body.md) — The raw message payload described by Content-Type.
- [Serialization & Deserialization](../level_07/serialization.md) — The process of transforming objects into raw MIME formats.

---

## 8. Key Takeaways
- The `Content-Type` header tells the receiver how to decode and parse the raw binary payload stream.
- MIME Types represent formats using the `type/subtype` syntax structure.
- `application/json` is the standard MIME type for modern JSON APIs.
- Use `multipart/form-data` when uploading files to split payloads into separate segments.
- Always declare `Content-Type: application/json` when posting stringified JSON objects to prevent server parsing failures.
