# CORS Errors in the Browser

> **Level 5 — Fetching Data (Client-Side)**
> Reading and diagnosing a blocked cross-origin `fetch`.

---

## 1. Prerequisites
- [CORS (Cross-Origin Resource Sharing)](../level_04/cors.md) — The header policy relaxing domain restrictions.
- [The fetch() API](fetch.md) — The browser API used to trigger network queries.

---

## 2. Term Category
- **Browser API / Networking**

---

## 3. Environment Context
- **Browser-Specific**: Thrown exclusively by browser rendering engines. Server-to-server requests are immune to CORS blocks.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Console Logger

**Problem:** Read the console log error message and identify the correct resolution step:

`Access to fetch at 'https://api.example.com/users' from origin 'http://localhost:3000' has been blocked by CORS policy: Method PUT is not allowed by Access-Control-Allow-Methods in preflight response.`

- **A.** Change the client request to use the `POST` method instead of `PUT`.
- **B.** Add `'Access-Control-Allow-Methods': 'PUT'` to the client fetch headers.
- **C.** Configure the server CORS policy at `api.example.com` to include `'PUT'` in the list of allowed methods.

> [!check]- Answer
> - **C** (CORS configurations are resolved on the server. The server must add `PUT` to the allowed methods headers in the preflight response).
> 
> 
---

### Exercise 2: CORS Error Diagnostic Flowchart

**Problem:** Identify the root cause for DevTools error: `No 'Access-Control-Allow-Origin' header is present on the requested resource.`

**Expected output:**
> [!check]- Answer
> ```text
> The backend server did not include the Access-Control-Allow-Origin response header matching the frontend requesting origin.
> ```
> ```text
> The backend server did not include the Access-Control-Allow-Origin response header matching the frontend requesting origin.
> ```
> - **Explanation:** Missing `Access-Control-Allow-Origin` headers cause browsers to block response access.
---

### Exercise 3: Development Localhost Proxy Pattern

**Problem:** How does setting a development proxy (`"proxy": "http://localhost:5000"` in React/Vite) eliminate CORS errors during local development?

**Expected output:**
> [!check]- Answer
> ```text
> The frontend dev server proxies API calls server-to-server. Browser communicates with same-origin dev server, bypassing CORS rules.
> ```
> ```text
> The frontend dev server proxies API calls server-to-server. Browser communicates with same-origin dev server, bypassing CORS rules.
> ```
> - **Explanation:** Dev proxies convert browser requests into same-origin local calls.
---

## 7. Related Terms
- [Same-Origin Policy](../level_04/same_origin_policy.md) — The security wall that triggers CORS blocks.
- [Preflight Request (OPTIONS)](../level_04/preflight_request.md) — The pre-request probe that often triggers CORS errors if it fails.
- [DevTools Network Tab](../level_10/network_tab.md) — Related concept: DevTools Network Tab.
- [CORS (Cross-Origin Resource Sharing)](../level_04/cors.md) — Related concept: CORS (Cross-Origin Resource Sharing).

---

## 8. Key Takeaways
- CORS errors are browser-enforced security actions, not connection failures.
- Client-side JavaScript catch blocks only receive a generic `Failed to fetch` error.
- Open browser DevTools (Console/Network) to diagnose the specific CORS issue.
- CORS errors must be resolved by updating the backend server headers, not client fetch code.
- Servers cannot use the wildcard `*` origin if the client sends cookies (`credentials: 'include'`).
- Ensure the backend handles `OPTIONS` requests cleanly to prevent preflight blocks.
