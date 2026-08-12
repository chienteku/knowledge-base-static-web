# The Response Object (res.json(), res.ok)

> **Level 5 — Fetching Data (Client-Side)**
> The massive JavaScript object returned by `fetch()` containing the entire HTTP response (Status Codes, Headers, and the Body).

---

## 1. Prerequisites
- [The fetch() API](fetch.md) — This is what generates the Response object.
- [HTTP Status Codes](../level_02/status_codes.md) — The Response object allows us to check these codes.

---

## 2. Term Category

**Browser API / Networking (Client-Side  and Node.js.)**: The Response Object (res.json(), res.ok) is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When the server sends data back to the browser, it doesn't just send the JSON payload. It sends an entire HTTP message, including the `200 OK` status and the `Content-Type` headers.
When you call `await fetch()`, JavaScript doesn't instantly give you the JSON. It gives you a **`Response` Object**. This object acts as a wrapper around the entire HTTP message, giving you powerful methods to check if the request was successful *before* you attempt to read the JSON payload.

### (2) Key Properties of the Response Object
- **`response.status`**: The exact 3-digit number (e.g., `200`, `404`, `500`).
- **`response.ok`**: A lifesaver boolean! It is strictly `true` if the status is between `200-299`. It is `false` if the status is `400` or `500`.
- **`response.headers`**: A Map allowing you to read the HTTP headers.

### (3) Key Methods of the Response Object
Because downloading a massive 50MB JSON payload takes time, reading the body is *also* asynchronous!
- **`await response.json()`**: Reads the body text and parses it into a JavaScript Object.
- **`await response.text()`**: Reads the body as raw plain text (useful if the server isn't sending JSON).

### (4) The "Perfect" Fetch Boilerplate
Because `fetch` doesn't throw errors on 404s or 500s, you must use `response.ok` to manually throw an error so your `catch` block can handle it. This is the industry-standard way to write a fetch call:

```javascript
async function getUser() {
  try {
    const response = await fetch('https://api.example.com/user');
    
    // 1. Manually check if the HTTP Status was a 400 or 500 error
    if (!response.ok) {
      throw new Error(`Server returned an error: ${response.status}`);
    }

    // 2. If we made it here, the status was 200 OK! Parse the JSON.
    const data = await response.json();
    console.log(data);

  } catch (error) {
    // 3. This catches BOTH network disconnects AND our manual `throw` above!
    console.error("API Call Failed:", error);
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `await` on `.json()`

**The mistake:**
```javascript
const response = await fetch('/api');
const data = response.json(); // Forgot await!
console.log(data.username); // undefined!
```

**Why it's wrong:** The `response.json()` method doesn't parse the data instantly; it returns a *Promise* representing the eventual parsing of the data. If you forget `await`, `data` is just a pending Promise object, not your actual JSON, so `data.username` will be undefined.
**Golden Rule:** `fetch` requires TWO awaits. One for the network trip, and one for parsing the JSON body!

---

### Mistake 2: Assuming `res.json()` Returns Parsed Data Synchronously

**The mistake:** Writing `const data = response.json()` expecting `data` to be a JavaScript object.

**Why it's wrong:** `res.json()` reads the response stream asynchronously and returns a Promise. Always use `await response.json()`.

*Incorrect:*
```javascript
const res = await fetch('/api/user');
const user = res.json(); // ❌ Missing await! Returns Promise instance!
```

*Fix:*
```javascript
const res = await fetch('/api/user');
const user = await res.json(); // Awaits stream resolution
```

---

### Mistake 3: Ignoring `response.headers` Parsing Methods

**The mistake:** Attempting to access headers using dot notation `response.headers['content-type']`.

**Why it's wrong:** `response.headers` is a web `Headers` object. Header values MUST be retrieved using `.get('content-type')`.

*Incorrect:*
```javascript
const type = res.headers['content-type']; // ❌ Returns undefined!
```

*Fix:*
```javascript
const type = res.headers.get('content-type'); // Correct Headers.get() method
```


---

## 5. Practice Exercises

### Exercise 1: Fetch Response Object Property & Header Inspector

**Scenario:** An API developer tool inspects native Fetch `Response` objects to extract HTTP status, ok state, type, and headers.

**Requirements:**
1. Write inspectFetchResponse(responseObj).
2. Extract status, ok, statusText, headers map, type.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectFetchResponse(responseObj) {
>   if (!responseObj) return null;
>
>   const headersMap = {};
>   if (responseObj.headers && typeof responseObj.headers.forEach === "function") {
>     responseObj.headers.forEach((val, key) => {
>       headersMap[key] = val;
>     });
>   }
>
>   return {
>     status: responseObj.status,
>     ok: responseObj.ok,
>     statusText: responseObj.statusText,
>     type: responseObj.type || "basic",
>     headers: headersMap,
>     redirected: responseObj.redirected || false
>   };
> }
>
> // Verification tests
> const mockRes = {
>   status: 200,
>   ok: true,
>   statusText: "OK",
>   type: "cors",
>   headers: new Map([["content-type", "application/json"]]),
>   redirected: false
> };
>
> const inspected = inspectFetchResponse(mockRes);
> console.assert(inspected.status === 200 && inspected.ok === true, "Test 1 Failed");
> console.assert(inspected.headers["content-type"] === "application/json", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Response Object Architecture**: Represents the HTTP response returned by fetch() containing headers, status, and body stream.
> 2. **response.ok Property**: Boolean flag indicating whether HTTP status code is in 200-299 range.
> 3. **response.type Property**: Identifies response origin type: 'basic', 'cors', 'opaque', or 'error'.
> 
---

### Exercise 2: Dual Response Body Reader via response.clone()

**Scenario:** A logging middleware reads the fetch response body as text for logging, then clones the response so calling code can parse it as JSON.

**Requirements:**
1. Write logAndParseResponse(responseObj).
2. Use response.clone() to create independent body stream copy.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function logAndParseResponse(responseObj) {
>   // Clone response BEFORE reading body stream
>   const clonedResponse = responseObj.clone();
>
>   // Read first body stream for logging
>   const rawText = await responseObj.text();
>
>   // Read second cloned body stream for JSON payload
>   const jsonPayload = await clonedResponse.json();
>
>   return {
>     rawText,
>     jsonPayload
>   };
> }
>
> // Verification tests
> const bodyData = JSON.stringify({ message: "Hello World" });
> const mockRes = {
>   text: async () => bodyData,
>   json: async () => JSON.parse(bodyData),
>   clone() {
>     return {
>       text: async () => bodyData,
>       json: async () => JSON.parse(bodyData)
>     };
>   }
> };
>
> logAndParseResponse(mockRes).then(res => {
>   console.assert(res.rawText.includes("Hello World"), "Test 1 Failed");
>   console.assert(res.jsonPayload.message === "Hello World", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Single-Use Body Streams**: Fetch response bodies are ReadableStream streams that can ONLY be consumed ONCE.
> 2. **TypeError Body Used Exception**: Attempting to read res.json() after res.text() throws TypeError: Already read.
> 3. **response.clone() Solution**: clone() creates an exact duplicate response object with an unread body stream.
> 
---

### Exercise 3: Content-Type Response Body Parser Router

**Scenario:** An API response parser inspects `Content-Type` headers and routes body reading to `.json()`, `.text()`, or `.blob()`.

**Requirements:**
1. Write parseResponseBodyByContentType(responseObj).
2. Route based on Content-Type header.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function parseResponseBodyByContentType(responseObj) {
>   const contentType = responseObj.headers.get("content-type") || "";
>
>   if (contentType.includes("application/json")) {
>     return { format: "JSON", data: await responseObj.json() };
>   }
>   if (contentType.includes("text/")) {
>     return { format: "TEXT", data: await responseObj.text() };
>   }
>   if (contentType.includes("image/") || contentType.includes("application/octet-stream")) {
>     return { format: "BLOB", data: await responseObj.blob() };
>   }
>
>   return { format: "UNKNOWN", data: await responseObj.text() };
> }
>
> // Verification tests
> const jsonRes = {
>   headers: new Map([["content-type", "application/json"]]),
>   json: async () => ({ status: "OK" })
> };
>
> parseResponseBodyByContentType(jsonRes).then(res => {
>   console.assert(res.format === "JSON" && res.data.status === "OK", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Polymorphic Body Reading**: Fetch Response provides .json(), .text(), .blob(), .arrayBuffer(), and .formData() reader methods.
> 2. **Content-Type Guided Parsing**: Inspects header before invoking parser method to prevent syntax exceptions.
> 3. **Binary vs Text Payload Handling**: Routes images to Blob buffers and JSON payloads to native objects.
---

## 6. Related Terms
- [Error Handling (try / catch)](error_handling.md) — The `try` block is where we check `response.ok`.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The format `response.json()` expects the body to be in.
- [Content Negotiation (Accept)](../level_02/content_negotiation.md) — Related concept: Content Negotiation (Accept).
- [HTTP Status Codes](../level_02/status_codes.md) — Related concept: HTTP Status Codes.
- [The fetch() API](fetch.md) — Related concept: The fetch() API.

---

## 7. Key Takeaways
- `fetch()` returns a **`Response`** object, representing the entire HTTP response.
- Always check **`response.ok`**. If it is false, manually `throw new Error()` so your catch block can handle the `404` or `500` status.
- You must use **`await`** a second time when calling **`response.json()`** to parse the body.
