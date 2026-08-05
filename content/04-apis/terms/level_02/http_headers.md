# HTTP Headers

> **Level 2 — HTTP Anatomy**
> The metadata sent alongside every HTTP Request and Response. It contains critical hidden instructions for the browser and the server.

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Headers are attached to both halves of this cycle.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The server uses Headers to announce that the data is JSON.
---

## 2. Term Category
- **HTTP Standard / Metadata**

---

## 3. Environment Context
- **Universal Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a Server sends a massive block of raw text to a Client, how does the Client know what to do with it? Is it an HTML page that should be rendered? Is it an MP4 video file that should be played? Is it JSON data? 
The W3C created **HTTP Headers** as a way to pass "Metadata" (data about the data) back and forth. They are hidden key-value pairs (`Key: Value`) attached to the top of every HTTP message. They instruct the receiving computer on exactly how to interpret the payload, how to handle security, and how to cache the data.

### (2) Reality Metaphor
Imagine a shipping container. The items inside the container are the "Body" (the actual payload). 
The **Headers** are the stickers plastered on the outside of the shipping container:
- `Content-Type: Fragile Glass` (Tells the receiver what is inside).
- `Authorization: Security Clearance Level 3` (Tells the guards if the sender is allowed in).
- `Cache-Control: Keep refrigerated for 5 days` (Tells the warehouse how long they can store it).

### (3) Critical Headers Every Developer Uses
**Request Headers (Sent by the Client):**
- `Authorization: Bearer <token>`: "Here is my secret password, please let me access this API."
- `Accept: application/json`: "Please only send me JSON data back, I don't want XML or HTML."
- `Content-Type: application/json`: "Hey server, the payload I'm sending you is formatted as JSON."

**Response Headers (Sent by the Server):**
- `Content-Type: application/json`: "Hey client, the payload I'm sending you is JSON, parse it accordingly."
- `Set-Cookie: sessionId=123`: "Hey browser, please save this cookie to the user's hard drive."

### (4) Code Examples

#### Setting Headers in Fetch
When sending a POST request with JSON data, you **must** explicitly set the `Content-Type` header, otherwise the Server might reject it, assuming it's just raw gibberish text!
```javascript
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // CRITICAL!
    'Authorization': 'Bearer secret_token_123'
  },
  body: JSON.stringify({ myData: "Hello" })
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `Content-Type: application/json`

**The mistake:** You send a `POST` request with a JSON string in the body, but you forget to add the `Content-Type` header.

**Why it's wrong:** Modern backend frameworks (like Express.js in Node, or Spring Boot in Java) use "body parsers". If the request arrives without a header explicitly declaring `Content-Type: application/json`, the backend will look at the JSON string, say "I don't know what this text is," and completely ignore it. Your `req.body` on the backend will show up as `undefined` or `{}`! 
**Golden Rule:** If you are sending JSON, you MUST include the JSON Content-Type header.

---

### Mistake 2: Using Legacy Custom Header `X-` Prefixes in New API Designs

**The mistake:** Designing new API headers named `X-Api-Key` or `X-Transaction-ID`.

**Why it's wrong:** RFC 6648 officially deprecated the `X-` prefix convention for custom headers. Modern custom headers should use clean names like `Api-Key` or `Transaction-ID`.

*Incorrect:*
```http
X-Client-Version: 2.1.0 ; ❌ Deprecated X- prefix convention!
```

*Fix:*
```http
Client-Version: 2.1.0 ; Modern RFC 6648 custom header naming
```

---

### Mistake 3: Including Newline Characters in HTTP Header Values (Header Injection Vulnerability)

**The mistake:** Constructing HTTP response headers using un-sanitized user input containing `\r\n` characters.

**Why it's wrong:** Un-sanitized newlines allow attackers to split HTTP headers (HTTP Response Splitting), injecting malicious response headers or HTML content into downstream clients.

*Incorrect:*
```javascript
// Vulnerable server code
res.setHeader('User-Token', userInput); // ❌ Dangerous if userInput contains \r\n!
```

*Fix:*
```javascript
// Sanitize and strip newlines before setting headers
const sanitizedInput = userInput.replace(/[\r\n]/g, '');
res.setHeader('User-Token', sanitizedInput);
```


---

## 6. Practice Exercises

### Exercise 1: Inspecting the Real World

**Problem:** Go to any website (e.g., github.com). Right-click and open Chrome DevTools. Go to the **Network** tab. Refresh the page. Click on the very first document request (usually the website URL). Look at the "Response Headers" section. What is the `Content-Type`?

**Expected output:**
> [!check]- Answer
> ```text
> It will be `text/html; charset=utf-8`. 
> The server uses this header to tell Chrome, "Hey, this is HTML, please render it visually on the screen instead of just downloading a text file!"
> ```
> - The Network tab is the most important tool for debugging APIs!

---

### Exercise 2: Header Category Classification

**Problem:** Classify header as Request, Response, or Representation header:
1. `Authorization` 
2. `Server` 
3. `Content-Type` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Request Header
> 2. Response Header
> 3. Representation Header
> ```
> ```text
> 1. Authorization -> Request Header
> 2. Server -> Response Header
> 3. Content-Type -> Representation Header
> ```
> - **Explanation:** Request headers send client metadata; Response headers send server info; Representation headers describe payload encoding.
---

### Exercise 3: Case-Insensitivity Verification

**Problem:** True or False: HTTP header names are case-insensitive according to RFC specifications.

**Expected output:**
> [!check]- Answer
> ```text
> True. `content-type`, `Content-Type`, and `CONTENT-TYPE` are semantically equivalent.
> ```
> ```text
> True. HTTP header field names are case-insensitive.
> ```
> - **Explanation:** HTTP/1.1 defines header field names as case-insensitive; HTTP/2 requires lowercasing headers.
---

## 7. Related Terms
- [Request Body & Payloads](request_body.md) — The data that the Headers are describing.
- [JWT (JSON Web Tokens)](../level_04/jwt.md) — Tokens are placed inside the `Authorization` header.
- [CORS (Cross-Origin Resource Sharing)](../level_04/cors.md) — Related concept: CORS (Cross-Origin Resource Sharing).
- [Preflight Request (OPTIONS)](../level_04/preflight_request.md) — Related concept: Preflight Request (OPTIONS).
- [Caching (ETag, Cache-Control)](../level_06/caching.md) — Related concept: Caching (ETag, Cache-Control).
- [Server-Sent Events (SSE)](../level_08/sse.md) — Related concept: Server-Sent Events (SSE).
- [Content-Type & MIME Types](content_type.md) — Content-Type header.
- [Content Negotiation (Accept)](content_negotiation.md) — Content negotiation headers.
---

## 8. Key Takeaways
- **Headers** are hidden key-value pairs containing metadata about the HTTP message.
- They dictate security, content parsing, caching, and cookies.
- **`Content-Type: application/json`** is the most important header you will write; it tells the receiving server how to parse the payload.
- You can view all headers traveling across the internet using the Network tab in your browser DevTools.
