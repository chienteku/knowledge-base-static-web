# CORS Errors in the Browser

> **Level 5 — Fetching Data (Client-Side)**
> Reading and diagnosing a blocked cross-origin `fetch`.

---

## 1. Prerequisites
- [CORS (Cross-Origin Resource Sharing)](../level_04/cors.md) — The header policy relaxing domain restrictions.
- [The fetch() API](fetch.md) — The browser API used to trigger network queries.

---

## 2. Term Category

**Browser API / Networking (Browser-Specific: Thrown exclusively by browser rendering engines. Server-to-server requests are immune to CORS blocks.)**: CORS Errors in the Browser is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Every web developer has encountered a red CORS error blocking their API requests in the browser console. Understanding how to read, diagnose, and fix these browser-specific console errors is a critical practical skill:

#### The JavaScript Blindness
When a browser blocks a request due to a CORS violation, the JavaScript catch block only receives a generic error:
```text
TypeError: Failed to fetch
```
Because of browser security policies, **JavaScript is blocked from reading the HTTP status code (like `500` or `404`) or headers of a failed CORS request.** To find out why the call failed, you must look outside your code and inspect the **Browser DevTools Console** or **Network Tab**.

---

### (2) Common CORS Console Errors & Diagnostics

#### Case 1: Missing Allow Header
*   **Console Error:** `Access to fetch at 'https://api.com/data' from origin 'https://client.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
*   **Cause:** The backend server processed the request but did not return the CORS headers, or the client domain is not whitelisted.
*   **Fix:** Configure the backend server to return: `Access-Control-Allow-Origin: https://client.com`.

#### Case 2: Wildcard Cookie Conflict
*   **Console Error:** `Access to fetch at 'https://api.com/data' from origin 'https://client.com' has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`
*   **Cause:** The client request sent cookies (`credentials: 'include'`), but the server returned a wildcard `*` origin. Browsers block cookie transfers to wildcard domains.
*   **Fix:** Update the server to return the specific requesting domain instead of `*` (e.g. `Access-Control-Allow-Origin: https://client.com`) and set `Access-Control-Allow-Credentials: true`.

#### Case 3: Preflight Failure
*   **Console Error:** `Access to fetch at 'https://api.com/data' from origin 'https://client.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.`
*   **Cause:** The browser sent an automatic `OPTIONS` preflight probe, but the server returned a error status code (like `404` or `500`) instead of `200 OK` or `204 No Content`.
*   **Fix:** Ensure your server router responds to `OPTIONS` requests cleanly before authentication middleware runs.

---

### (3) Reality Metaphor
Imagine ordering a package from a vendor in another city (cross-origin request).
- The mail carrier (the browser) arrives at your door carrying the package.
- Before handing it over, the carrier checks the mailing label. They notice the sender forgot to write the stamp: *"Approved for delivery to Apartment 42"* (missing CORS headers).
- **CORS Error:** The carrier holds the box, looks at you, and says: *"Delivery failed"* (`TypeError: Failed to fetch`), then walks away.
- **JavaScript Blindness:** You ask: *"Why? Did they run out of stock? Was it damaged?"* The carrier stays silent and refuses to let you look at the box's invoice data. To find out what went wrong, you must walk to the mail carrier's post office ledger (**the browser DevTools console**) to read their logged notes.

---

### (4) Backend Solution Example (Express CORS Config)
CORS errors **cannot** be fixed by changing client-side fetch code. The fix must be implemented on the backend server:

```javascript
import express from 'express';
import cors from 'cors';
const app = express();

// Configure the CORS middleware on the server
app.use(cors({
  origin: 'https://client.com', // Whitelist client origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies
}));

app.get('/api/data', (req, res) => {
  res.json({ message: "Hello from CORS-approved server!" });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Adding CORS headers inside the client-side `fetch` request headers

**The mistake:** Trying to resolve a CORS error by adding the header `Access-Control-Allow-Origin: '*'` inside your client-side fetch options:
```javascript
// WRONG! THIS DOES NOTHING!
fetch('https://api.com/data', {
  headers: {
    'Access-Control-Allow-Origin': '*' // Useless request header
  }
});
```

**Why it's wrong:** `Access-Control-Allow-Origin` is a **response header** sent by the *server* to grant permissions. Setting it in the client request headers has no effect on browser validation checks.

---

### Mistake 2: Attempting to Fix CORS Errors by Disabling Browser Security Settings in Production

**The mistake:** Instructing web app users to launch Chrome with `--disable-web-security` to fix CORS errors.

**Why it's wrong:** CORS errors are server-side configuration issues. Disabling browser security exposes users to dangerous cross-site attacks. Fix CORS response headers on the backend server.

*Incorrect:*
```http
/* Advising users to disable browser CORS security flags */
```

*Fix:*
```http
/* Add Access-Control-Allow-Origin headers to backend API server responses */
```

---

### Mistake 3: Confusing Network Connection Failures with CORS Errors

**The mistake:** Diagnosing a backend crash (`ECONNREFUSED` or server offline) as a CORS error because DevTools shows CORS warning.

**Why it's wrong:** When a backend server crashes or refuses connection, no CORS headers are returned. Browsers report missing CORS headers even though the root cause is server downtime.

*Incorrect:*
```http
/* Trying to fix CORS headers when server process is completely offline */
```

*Fix:*
```http
/* Verify server process is running and reachable on host/port before debugging CORS */
```


---

## 5. Practice Exercises

### Exercise 1: CORS Error Diagnostic Inspector & Parser

**Scenario:** A developer tools utility inspects failed HTTP fetch errors and identifies whether failure was caused by a CORS violation.

**Requirements:**
1. Write diagnoseCorsError(fetchError, requestDetails).
2. Check TypeError message and response origin headers.
3. Return diagnostic explanation.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function diagnoseCorsError(fetchError, requestDetails = {}) {
>   if (!fetchError) return { isCorsError: false };
>
>   const isTypeError = fetchError.name === "TypeError" || fetchError.message?.includes("Failed to fetch");
>
>   if (isTypeError && requestDetails.isCrossOrigin) {
>     return {
>       isCorsError: true,
>       category: "CORS_POLICY_VIOLATION",
>       possibleCauses: [
>         "Server missing Access-Control-Allow-Origin header",
>         "Disallowed HTTP method in Access-Control-Allow-Methods",
>         "Disallowed custom header in Access-Control-Allow-Headers",
>         "Missing Access-Control-Allow-Credentials when credentials mode is 'include'"
>       ],
>       remedy: "Configure CORS response headers on target backend server"
>     };
>   }
>
>   return { isCorsError: false, message: fetchError.message };
> }
>
> // Verification tests
> const err = new TypeError("Failed to fetch");
> const diag = diagnoseCorsError(err, { isCrossOrigin: true });
>
> console.assert(diag.isCorsError === true, "Test 1 Failed");
> console.assert(diag.category === "CORS_POLICY_VIOLATION", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Browser CORS Enforcement**: CORS errors are enforced strictly by the browser; client JS cannot bypass CORS security without server cooperation.
> 2. **Opaque TypeError**: For security reasons, browsers conceal CORS error details from JavaScript, throwing a generic TypeError.
> 3. **Server-Side Remediation**: Fixing CORS errors requires updating response headers on the destination API server or using a proxy.
> 
---

### Exercise 2: Reverse Proxy CORS Bypass Gateway Simulator

**Scenario:** A frontend development gateway routes API requests through a same-origin reverse proxy (`/api/*` -> `https://api.external.com/*`) to eliminate browser CORS preflights.

**Requirements:**
1. Write proxyRequest(clientPath, targetHost).
2. Rewrite client URI to target URL server-side.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function proxyRequest(clientPath, targetHost = "https://api.external.com") {
>   if (!clientPath.startsWith("/api/")) {
>     return { proxied: false, url: clientPath };
>   }
>
>   const relativePath = clientPath.substring(5);
>   const targetUrl = `${targetHost}/${relativePath}`;
>
>   return {
>     proxied: true,
>     targetUrl,
>     headers: {
>       "Host": new URL(targetHost).hostname
>     }
>   };
> }
>
> // Verification tests
> const res = proxyRequest("/api/v1/users");
> console.assert(res.proxied === true, "Test 1 Failed");
> console.assert(res.targetUrl === "https://api.external.com/v1/users", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Reverse Proxy Pattern**: Proxy receives request on same origin, forwards to external API server-to-server, avoiding browser CORS.
> 2. **Dev Server Proxying**: Vite, Next.js, and Webpack Dev Server use proxies during local development.
> 3. **Same-Origin Compliance**: Browser views proxy endpoint as same-origin, bypassing CORS restrictions completely.
> 
---

### Exercise 3: Preflight OPTIONS Response Header Linter

**Scenario:** An API gateway validator verifies outgoing preflight response headers to prevent CORS errors in SPA frontend clients.

**Requirements:**
1. Write lintCorsResponseHeaders(headers, reqOrigin, reqMethod).
2. Check Access-Control-Allow-Origin, Allow-Methods, Allow-Headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function lintCorsResponseHeaders(headers = {}, reqOrigin, reqMethod) {
>   const allowOrigin = headers["Access-Control-Allow-Origin"] || headers["access-control-allow-origin"];
>   const allowMethods = headers["Access-Control-Allow-Methods"] || headers["access-control-allow-methods"];
>
>   const issues = [];
>   if (!allowOrigin) {
>     issues.push("Missing Access-Control-Allow-Origin header");
>   } else if (allowOrigin !== "*" && allowOrigin !== reqOrigin) {
>     issues.push(`Origin '${reqOrigin}' not allowed by Access-Control-Allow-Origin '${allowOrigin}'`);
>   }
>
>   if (reqMethod && allowMethods && !allowMethods.includes(reqMethod.toUpperCase())) {
>     issues.push(`Method '${reqMethod}' not allowed by Access-Control-Allow-Methods`);
>   }
>
>   return { valid: issues.length === 0, issues };
> }
>
> // Verification tests
> const headers = {
>   "Access-Control-Allow-Origin": "https://app.com",
>   "Access-Control-Allow-Methods": "GET, POST"
> };
>
> console.assert(lintCorsResponseHeaders(headers, "https://app.com", "POST").valid === true, "Test 1 Failed");
> console.assert(lintCorsResponseHeaders(headers, "https://evil.com", "POST").valid === false, "Test 2 Failed");
> console.assert(lintCorsResponseHeaders(headers, "https://app.com", "DELETE").valid === false, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Preflight Validation**: Browsers verify OPTIONS preflight response headers before sending actual cross-origin request.
> 2. **Strict Origin Matching**: Access-Control-Allow-Origin must match request Origin exactly if credentials are included.
> 3. **Method Access List**: Access-Control-Allow-Methods must explicitly include requested HTTP method (PUT, DELETE).
---

## 6. Related Terms
- [Same-Origin Policy](../level_04/same_origin_policy.md) — The security wall that triggers CORS blocks.
- [Preflight Request (OPTIONS)](../level_04/preflight_request.md) — The pre-request probe that often triggers CORS errors if it fails.
- [DevTools Network Tab](../level_10/network_tab.md) — Related concept: DevTools Network Tab.
- [CORS (Cross-Origin Resource Sharing)](../level_04/cors.md) — Related concept: CORS (Cross-Origin Resource Sharing).

---

## 7. Key Takeaways
- CORS errors are browser-enforced security actions, not connection failures.
- Client-side JavaScript catch blocks only receive a generic `Failed to fetch` error.
- Open browser DevTools (Console/Network) to diagnose the specific CORS issue.
- CORS errors must be resolved by updating the backend server headers, not client fetch code.
- Servers cannot use the wildcard `*` origin if the client sends cookies (`credentials: 'include'`).
- Ensure the backend handles `OPTIONS` requests cleanly to prevent preflight blocks.
