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
- **Security**

---

## 3. Environment Context
- **Browser-Specific**: Initiated automatically by browser engines when making cross-origin requests.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Trigger Classifier

**Problem:** Determine if the following browser fetch requests will trigger an automatic preflight (`OPTIONS`) request:

1. `GET` request fetching an image payload using standard headers.
2. `POST` request sending a JSON object payload (`Content-Type: application/json`).
3. `POST` request sending raw HTML form data (`Content-Type: application/x-www-form-urlencoded`).
4. `GET` request specifying a custom header `X-Requested-With: Fetch`.

> [!check]- Answer
> - 1. **No** (It is a simple GET request).
> - 2. **Yes** (`application/json` is not a simple content type).
> - 3. **No** (Standard HTML form format meets simple conditions).
> - 4. **Yes** (Setting a custom header triggers preflight).


---

### Exercise 2: Preflight Response Header Verification

**Problem:** Identify 3 mandatory CORS response headers returned in response to a preflight `OPTIONS` request.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Access-Control-Allow-Origin
> 2. Access-Control-Allow-Methods
> 3. Access-Control-Allow-Headers
> ```
> ```http
> HTTP/1.1 204 No Content
> Access-Control-Allow-Origin: https://app.example.com
> Access-Control-Allow-Methods: POST, PUT, DELETE, OPTIONS
> Access-Control-Allow-Headers: Content-Type, Authorization
> ```
> - **Explanation:** Preflight headers inform browser which origins, methods, and headers are permitted.
---

### Exercise 3: Simple Request vs Preflight Request

**Problem:** Does a `GET /data` request with `Accept: application/json` trigger a CORS preflight OPTIONS request?

**Expected output:**
> [!check]- Answer
> ```text
> No. GET with standard headers is a 'Simple Request' and bypasses preflight.
> ```
> ```text
> No. GET with standard headers is a 'Simple Request' and bypasses preflight.
> ```
> - **Explanation:** Simple requests (GET/POST with standard headers) skip preflight checks.
---

## 7. Related Terms
- [Same-Origin Policy](same_origin_policy.md) — The browser security wall that necessitates CORS and preflight probes.
- [HTTP Headers](../level_02/http_headers.md) — The metadata lines negotiating CORS parameters.
- [CORS Errors in the Browser](../level_05/cors_errors.md) — Related concept: CORS Errors in the Browser.
- [CORS (Cross-Origin Resource Sharing)](cors.md) — Related concept: CORS (Cross-Origin Resource Sharing).

---

## 8. Key Takeaways
- A preflight request is an automatic `OPTIONS` query sent by browsers to verify CORS permissions.
- It prevents complex, unexpected cross-origin requests from hitting server endpoints unprepared.
- Triggered by custom headers, non-simple verbs (PUT/DELETE), or JSON payloads (`application/json`).
- If preflight fails, the actual request payload is never transmitted.
- Servers should implement `Access-Control-Max-Age` to cache preflight approvals, reducing RTT latency overhead.
- Backend routing setups must permit and correctly respond to incoming `OPTIONS` requests.
