# Request & Response Lifecycle

> **Level 1 — The Foundations of the Web**
> The complete round-trip process of a Client asking for data, the network delivering it, the Server processing it, and sending the result back.

---

## 1. Prerequisites
- [Client-Server Model](client_server_model.md) — The two actors in this lifecycle.
- [HTTP / HTTPS](http_https.md) — The language they are speaking.

---

## 2. Term Category

**Web Architecture / Core Concept (Universal Standard .)**: Request & Response Lifecycle is a fundamental concept in this technology stack. **Level 1 — The Foundations of the Web**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
To build resilient web applications, developers must understand that data does not teleport instantly. The internet is a physical network of copper wires and fiber-optic cables spanning the globe.
When a Client asks a Server for data, it triggers a complex, multi-step **Lifecycle**. Understanding this lifecycle is critical for debugging (e.g., figuring out if a bug happened because the client sent bad data, the network dropped the connection, or the server crashed while calculating the answer).

### (2) Reality Metaphor
Imagine ordering a custom pizza for delivery.
1. **The Request:** You pick up the phone (Client) and tell the pizza shop you want a large pepperoni (sending the payload).
2. **The Network (Outbound):** The phone company transmits your voice across town.
3. **The Processing (Server):** The chef receives the order, verifies you paid, and bakes the pizza in the oven.
4. **The Response:** The delivery driver drives the pizza back to your house.
If the pizza never arrives, you have to debug the lifecycle: Did you dial the wrong number? Did the chef burn the pizza? Did the driver get a flat tire?

### (3) The 4 Steps of the Web Lifecycle
1. **Client sends Request:** The browser packages a URL, HTTP Headers, and an optional Body, and fires it into the internet.
2. **Network Routing:** The request hops across dozens of physical internet routers, crossing oceans via fiber-optic cables, until it finds the correct Server IP address.
3. **Server Processing:** The backend receives the HTTP text. It parses the request, checks security (Auth), queries the database, and formats the data.
4. **Server sends Response:** The backend packages the data into an HTTP Response (with a Status Code like 200 OK or 404 Not Found) and sends it back across the network to the Client.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Ignoring Network Latency

**The mistake:** A developer assumes the Request/Response lifecycle is instant because they are testing their API locally on `localhost` (0 milliseconds of latency). They don't add loading spinners to their frontend UI.

**Why it's wrong:** In the real world, if your server is in New York and the user is in Australia, light literally has to travel around the curvature of the Earth. A database query might take 50ms, but the *network transit time* might take 500ms! If you don't show a loading state on the Client while waiting for the Response, the user will think the button is broken and click it 10 times in a row, crashing your server! 
**Golden Rule:** Always design UI to handle the "Pending" state of the network lifecycle.

---

### Mistake 2: Reading HTTP Response Body Streams Multiple Times in JavaScript

**The mistake:** Calling `await response.json()` and then calling `await response.text()` on the same `Response` object.

**Why it's wrong:** HTTP body streams can only be read once. Once the stream buffer is consumed by `.json()`, calling another reader method throws a TypeError: Body has already been consumed.

*Incorrect:*
```javascript
const res = await fetch('/api/data');
const data = await res.json();
const text = await res.text(); // ❌ TypeError: Body has already been consumed!
```

*Fix:*
```javascript
const res = await fetch('/api/data');
const text = await res.text();
const data = JSON.parse(text); // Parse JSON from stored text string
```

---

### Mistake 3: Assuming `fetch()` Rejects Promises on HTTP Error Status Codes (4xx/5xx)

**The mistake:** Wrapping `fetch()` in `try / catch` without checking `response.ok`.

**Why it's wrong:** `fetch()` rejects promises ONLY on network failures (DNS lookup failure, offline). It resolves successfully even if the server returns HTTP 404 or 500 status codes.

*Incorrect:*
```javascript
try {
  const res = await fetch('/api/missing');
  // ❌ Executes even on HTTP 404 Not Found!
} catch (err) {
  // Triggers only on network crash
}
```

*Fix:*
```javascript
const res = await fetch('/api/missing');
if (!res.ok) {
  throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
}
```


---

## 5. Practice Exercises

### Exercise 1: HTTP Response Status Code Classifier

**Scenario:** An API gateway helper classifies HTTP response status codes into standard REST result categories.

**Requirements:**
1. Write classifyHttpStatus(statusCode).
2. Return category string: "INFORMATIONAL", "SUCCESS", "REDIRECTION", "CLIENT_ERROR", "SERVER_ERROR".

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function classifyHttpStatus(statusCode) {
>   const code = Number(statusCode);
>   if (isNaN(code) || code < 100 || code > 599) return "UNKNOWN";
>
>   if (code >= 100 && code <= 199) return "INFORMATIONAL";
>   if (code >= 200 && code <= 299) return "SUCCESS";
>   if (code >= 300 && code <= 399) return "REDIRECTION";
>   if (code >= 400 && code <= 499) return "CLIENT_ERROR";
>   if (code >= 500 && code <= 599) return "SERVER_ERROR";
>
>   return "UNKNOWN";
> }
>
> // Verification tests
> console.assert(classifyHttpStatus(200) === "SUCCESS", "Test 1 Failed");
> console.assert(classifyHttpStatus(301) === "REDIRECTION", "Test 2 Failed");
> console.assert(classifyHttpStatus(404) === "CLIENT_ERROR", "Test 3 Failed");
> console.assert(classifyHttpStatus(500) === "SERVER_ERROR", "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Status Categories**: 1xx Informational, 2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error.
> 2. **Client Error vs Server Error**: 4xx means the client sent an invalid request (e.g. 404 Not Found); 5xx means the server crashed (e.g. 500 Internal Error).
> 3. **REST Contract**: API endpoints must return accurate HTTP status codes matching transaction results.
> 
---

### Exercise 2: HTTP Request & Response Header Map Normalizer

**Scenario:** A web server middleware normalizes case-insensitive HTTP header keys into lowercase dictionary keys.

**Requirements:**
1. Write normalizeHeaders(headersObj).
2. Convert all key names to lowercase.
3. Return normalized header object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function normalizeHeaders(headersObj) {
>   if (!headersObj || typeof headersObj !== "object") return {};
>
>   const normalized = {};
>   for (const [key, value] of Object.entries(headersObj)) {
>     normalized[key.toLowerCase()] = String(value).trim();
>   }
>   return normalized;
> }
>
> // Verification tests
> const rawHeaders = {
>   "Content-Type": "application/json ",
>   "AUTHORIZATION": "Bearer token123"
> };
>
> const clean = normalizeHeaders(rawHeaders);
> console.assert(clean["content-type"] === "application/json", "Test 1 Failed");
> console.assert(clean["authorization"] === "Bearer token123", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Case-Insensitive Headers**: HTTP spec dictates header field names are case-insensitive (Content-Type === content-type).
> 2. **Header Value Whitespace Trimming**: Trimming values prevents header parsing bugs in HTTP parsers.
> 3. **Header Standardization in HTTP/2**: HTTP/2 requires all header names to be lowercased in frame transmissions.
> 
---

### Exercise 3: HTTP Request Body Serializer & Content-Type Injector

**Scenario:** An HTTP client library serializes JavaScript objects into request payload bodies and sets appropriate Content-Type headers.

**Requirements:**
1. Write buildRequestBody(data, format).
2. Support "json" and "form-urlencoded".
3. Return { body, contentType }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildRequestBody(data, format = "json") {
>   if (format === "json") {
>     return {
>       body: JSON.stringify(data),
>       contentType: "application/json"
>     };
>   }
>   if (format === "form-urlencoded") {
>     const params = new URLSearchParams();
>     for (const [k, v] of Object.entries(data)) {
>       params.append(k, String(v));
>     }
>     return {
>       body: params.toString(),
>       contentType: "application/x-www-form-urlencoded"
>     };
>   }
>   throw new Error("Unsupported format");
> }
>
> // Verification tests
> const jsonReq = buildRequestBody({ name: "Alice" }, "json");
> console.assert(jsonReq.contentType === "application/json", "Test 1 Failed");
>
> const formReq = buildRequestBody({ user: "bob", page: 1 }, "form-urlencoded");
> console.assert(formReq.body === "user=bob&page=1", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Content-Type Header**: Informs server how to parse incoming request body (application/json vs application/x-www-form-urlencoded).
> 2. **Body Serialization**: Objects must be serialized to string or binary formats for network transmission.
> 3. **URLSearchParams API**: Standard browser & Node API for building form-urlencoded query strings.
---

## 6. Related Terms
- [HTTP Status Codes](../level_02/status_codes.md) — How the Server communicates the result of the processing step back to the Client.
- [The fetch() API](../level_05/fetch.md) — The JavaScript function used to trigger this lifecycle manually.
- [HTTP / HTTPS](http_https.md) — Related concept: HTTP / HTTPS.
- [Client-Server Model](client_server_model.md) — Related concept: Client-Server Model.

---

## 7. Key Takeaways
- The Request/Response lifecycle is the fundamental pulse of the internet.
- It is NOT instant. Network latency (transit time) is a massive factor in web development.
- When APIs break, mentally trace the lifecycle to isolate the bug (Client error vs Network error vs Server error).
