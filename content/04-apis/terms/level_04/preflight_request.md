# Preflight Request (OPTIONS)

> **Level 4 — Security & Authentication**
> The automatic `OPTIONS` probe the browser sends before a cross-origin call.

---

## 1. Prerequisites
- [Same-Origin Policy](same_origin_policy.md) — The browser sandbox isolating domains.
- [CORS (Cross-Origin Resource Sharing)](cors.md) — The mechanism relaxing same-origin restrictions.
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The verbs defining request actions.

---

## 2. Term Category

**Security (Browser-Specific: Initiated automatically by browser engines when making cross-origin requests.)**: Preflight Request (OPTIONS) is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before the CORS standard was introduced, older legacy servers only had to handle requests from their own domains or simple HTML form submissions (which only used `GET` or `POST` verbs with flat text payloads). 

If a modern browser script on `evil.com` could suddenly send a request with custom headers or dangerous verbs (like `DELETE` or `PUT`) directly to a legacy server, it could trigger state changes or database modifications on that server before the browser had a chance to inspect the response.

To protect servers from unexpected, complex cross-origin requests, browsers perform a **Preflight Request**:
- Before sending the actual request, the browser sends a small, lightweight probe request using the **`OPTIONS`** HTTP method.
- The browser asks the server: *"Are you willing to receive a request from my domain using a `PUT` verb and containing an `Authorization` header?"*
- If the server replies with headers confirming it allows the request, the browser sends the actual payload.
- If the server rejects the preflight, the browser cancels the request immediately, ensuring the actual payload is never sent to the server.

---

### (2) Trigger Conditions: Simple vs. Preflighted Requests
Browsers skip the preflight check for **Simple Requests**. A request is simple **only** if it satisfies all the following:
1. **Verb:** Uses `GET`, `HEAD`, or `POST`.
2. **Headers:** Does not set custom headers (only allows standard headers like `Accept`, `User-Agent`, or `Content-Language`).
3. **Content-Type:** The body is formatted strictly as `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`.

*Key Rule:* Since modern web APIs communicate using **`application/json`** payloads, **almost all JSON API calls trigger an automatic preflight OPTIONS request.**

---

### (3) The Preflight OPTIONS Exchange

```text
Client (Browser)                                         Server
  │                                                        │
  │ ─── 1. OPTIONS /api/data (Preflight Probe) ──────────> │
  │    (Origin: client.com, Access-Control-Method: PUT)    │ [Checks CORS permissions]
  │ <── 2. Response 204 No Content (Approval) ──────────── │
  │    (Access-Control-Allow-Origin: client.com, ...)      │
  │                                                        │
  │ ─── 3. PUT /api/data (Actual Request + Payload) ─────> │ [Processes data]
  │ <── 4. Response 200 OK (Data Payload) ──────────────── │
  ▼                                                        ▼
```

#### Performance Overhead: `Access-Control-Max-Age`
Because preflight requests require a complete network round-trip before the actual request can start, they double RTT latency (e.g. a `150ms` RTT becomes `300ms`). 

To avoid this overhead, the server can return the **`Access-Control-Max-Age`** header. This tells the browser to cache the preflight approval for a specific number of seconds (e.g., 24 hours), letting subsequent requests bypass the OPTIONS probe.

---

### (4) Reality Metaphor
Imagine a delivery service dropping off a large cargo crate at a secure warehouse.
- A **Simple Request** is like arriving at the gate with a **standard letter**. The guard looks at it, matches the standard layout, and lets you drop it in the mailbox directly.
- A **Preflight Request** is like pulling up to the gates in a **large commercial container truck** (a JSON payload with a `PUT` verb). The guard does not open the gates yet. Instead, the guard sends a **scout** (the `OPTIONS` preflight probe) into the warehouse manager's office:
  - The scout asks: *"A truck from `client.com` is at the gate wanting to deliver cargo using the PUT method. Do we allow deliveries from them?"*
  - If the manager says: *"Yes, we accept PUT deliveries from `client.com`"* (`Access-Control-Allow-Origin: client.com`), the scout runs back to the gate, opens it, and the truck drives in to deliver the cargo.
  - If the manager says: *"No,"* the truck is turned away immediately, and the warehouse never touches the cargo.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Failing to handle the `OPTIONS` method on your backend server routes

**The mistake:** Configuring a backend route handler for `POST /api/users` that processes JSON payloads, but failing to write a handler for the `OPTIONS` method, or blocking `OPTIONS` requests at your authentication middleware.

**Why it's wrong:** When a client-side browser fetches your JSON API, it automatically triggers an `OPTIONS` request first. If your server returns a `401 Unauthorized` or a `404 Not Found` for `OPTIONS` requests, the browser fails the preflight check and cancels the subsequent `POST` request. The API fails, throwing a "CORS preflight channel block" error in the browser console.

---

### Mistake 2: Returning HTTP 404 or 405 Errors for Preflight `OPTIONS` Requests

**The mistake:** Failing to configure an explicit route handler for HTTP `OPTIONS` requests on backend API servers.

**Why it's wrong:** Browsers send preflight `OPTIONS` requests BEFORE executing cross-origin `POST`, `PUT`, or `DELETE` requests. If `OPTIONS` returns 404 or 405, the main request is blocked.

*Incorrect:*
```http
/* Express route lacking OPTIONS handler returns 404 on preflight */
```

*Fix:*
```javascript
// Handle OPTIONS preflight requests globally in Express:
app.options('*', cors());
```

---

### Mistake 3: Omitting `Access-Control-Max-Age` Header (Excessive Preflight Requests)

**The mistake:** Omitting `Access-Control-Max-Age` in CORS preflight responses.

**Why it's wrong:** Without `Access-Control-Max-Age`, browsers must issue a new preflight `OPTIONS` request before EVERY SINGLE API call, doubling network latency.

*Incorrect:*
```http
Access-Control-Allow-Origin: https://app.com ; Missing Max-Age cache header
```

*Fix:*
```http
Access-Control-Allow-Origin: https://app.com
Access-Control-Max-Age: 86400 ; Caches preflight approval for 24 hours
```


---

## 5. Practice Exercises

### Exercise 1: Preflight OPTIONS Request Classifier & Header Inspector

**Scenario:** An API gateway identifies CORS preflight `OPTIONS` requests and validates `Access-Control-Request-Method` and `Access-Control-Request-Headers`.

**Requirements:**
1. Write handlePreflightRequest(method, headers, allowedMethods, allowedHeaders).
2. Return 204 with CORS response headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handlePreflightRequest(method, headers, allowedMethods = ["GET", "POST", "PUT", "DELETE"], allowedHeaders = ["Content-Type", "Authorization"]) {
>   if (method.toUpperCase() !== "OPTIONS") {
>     return { isPreflight: false };
>   }
>
>   const reqMethod = headers?.["access-control-request-method"] || headers?.["Access-Control-Request-Method"];
>   if (!reqMethod) {
>     return { isPreflight: false };
>   }
>
>   if (!allowedMethods.includes(reqMethod.toUpperCase())) {
>     return { isPreflight: true, status: 403, error: "Method not allowed by CORS" };
>   }
>
>   return {
>     isPreflight: true,
>     status: 204,
>     headers: {
>       "Access-Control-Allow-Origin": headers["origin"] || "*",
>       "Access-Control-Allow-Methods": allowedMethods.join(", "),
>       "Access-Control-Allow-Headers": allowedHeaders.join(", "),
>       "Access-Control-Max-Age": "86400"
>     }
>   };
> }
>
> // Verification tests
> const reqHeaders = {
>   "origin": "https://app.com",
>   "Access-Control-Request-Method": "PUT"
> };
>
> const res = handlePreflightRequest("OPTIONS", reqHeaders);
> console.assert(res.isPreflight === true && res.status === 204, "Test 1 Failed");
> console.assert(res.headers["Access-Control-Allow-Methods"].includes("PUT"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Preflight Request Definition**: HTTP OPTIONS request automatically dispatched by browser before cross-origin non-simple requests.
> 2. **204 No Content Status**: Preflight responses carry no response body; 204 No Content is standard status code.
> 3. **CORS Preflight Headers**: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers.
> 
---

### Exercise 2: Preflight Cache Control via Access-Control-Max-Age

**Scenario:** An API gateway configures `Access-Control-Max-Age` to cache preflight responses in browser memory and reduce network latency.

**Requirements:**
1. Write configurePreflightMaxAge(seconds).
2. Return Access-Control-Max-Age header object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function configurePreflightMaxAge(seconds = 86400) {
>   const maxSeconds = Math.min(seconds, 86400);
>
>   return {
>     "Access-Control-Max-Age": String(maxSeconds)
>   };
> }
>
> // Verification tests
> console.assert(configurePreflightMaxAge(3600)["Access-Control-Max-Age"] === "3600", "Test 1 Failed");
> console.assert(configurePreflightMaxAge(999999)["Access-Control-Max-Age"] === "86400", "Test 2 Failed: Must cap at 24 hours");
> ```
>
> #### Technical Explanation
>
> 1. **Access-Control-Max-Age**: Specifies time in seconds browser can cache preflight OPTIONS response.
> 2. **Latency Reduction**: Caching preflight eliminates extra roundtrip latency on subsequent API calls.
> 3. **Browser Caching Limits**: Chromium caps max-age at 2 hours (7200s); Firefox caps at 24 hours (86400s).
> 
---

### Exercise 3: Non-Simple Request Preflight Trigger Detector

**Scenario:** An API developer helper checks HTTP request parameters and determines whether browser will trigger a preflight OPTIONS request.

**Requirements:**
1. Write triggersPreflight(method, contentType, customHeaders).
2. Check non-simple method, non-simple Content-Type, or custom headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function triggersPreflight(method, contentType = "text/plain", customHeaders = {}) {
>   const simpleMethods = ["GET", "HEAD", "POST"];
>   const simpleContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
>
>   if (!simpleMethods.includes(method.toUpperCase())) {
>     return true;
>   }
>
>   const cleanContentType = contentType.split(";")[0].trim().toLowerCase();
>   if (!simpleContentTypes.includes(cleanContentType)) {
>     return true;
>   }
>
>   const headerKeys = Object.keys(customHeaders).map(k => k.toLowerCase());
>   const forbiddenSimple = headerKeys.some(k => !["accept", "accept-language", "content-language", "content-type"].includes(k));
>
>   return forbiddenSimple;
> }
>
> // Verification tests
> console.assert(triggersPreflight("GET", "text/plain") === false, "Test 1 Failed: Simple GET does not trigger preflight");
> console.assert(triggersPreflight("POST", "application/json") === true, "Test 2 Failed: JSON POST triggers preflight");
> console.assert(triggersPreflight("DELETE", "text/plain") === true, "Test 3 Failed: DELETE triggers preflight");
> ```
>
> #### Technical Explanation
>
> 1. **Simple vs Non-Simple Requests**: Simple requests (GET, HEAD, basic POST) bypass preflight; non-simple requests trigger preflight.
> 2. **application/json Triggers Preflight**: Sending JSON payloads (`application/json`) ALWAYS triggers CORS preflight in browsers.
> 3. **Custom Headers Trigger Preflight**: Attaching custom headers (Authorization, X-API-Key) triggers CORS preflight.
---

## 6. Related Terms
- [Same-Origin Policy](same_origin_policy.md) — The browser security wall that necessitates CORS and preflight probes.
- [HTTP Headers](../level_02/http_headers.md) — The metadata lines negotiating CORS parameters.
- [CORS Errors in the Browser](../level_05/cors_errors.md) — Related concept: CORS Errors in the Browser.
- [CORS (Cross-Origin Resource Sharing)](cors.md) — Related concept: CORS (Cross-Origin Resource Sharing).

---

## 7. Key Takeaways
- A preflight request is an automatic `OPTIONS` query sent by browsers to verify CORS permissions.
- It prevents complex, unexpected cross-origin requests from hitting server endpoints unprepared.
- Triggered by custom headers, non-simple verbs (PUT/DELETE), or JSON payloads (`application/json`).
- If preflight fails, the actual request payload is never transmitted.
- Servers should implement `Access-Control-Max-Age` to cache preflight approvals, reducing RTT latency overhead.
- Backend routing setups must permit and correctly respond to incoming `OPTIONS` requests.
