# CORS (Cross-Origin Resource Sharing)

> **Level 4 — Security & Authentication**
> A strict security mechanism built into modern web browsers that blocks frontend code from making API requests to a different domain, unless the API explicitly allows it.

---

## 1. Prerequisites
- [HTTP Headers](../level_02/http_headers.md) — CORS relies entirely on specific HTTP headers to work.
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — A "Origin" is just the Domain/Port part of a URL.

---

## 2. Term Category

**Security / Browser Policy (Browser Only .)**: CORS (Cross-Origin Resource Sharing) is a fundamental concept in this technology stack. **Level 4 — Security & Authentication**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are logged into your bank (`bank.com`). Your browser has a secret login cookie saved. 
You then open a new tab and visit `evil-hacker.com`. The hacker wrote JavaScript on their site that says `fetch('https://bank.com/api/transferMoney')`. Because your browser automatically attaches your login cookie, the hacker successfully steals your money!
To stop this, browsers invented the **Same-Origin Policy**. It strictly says: JavaScript running on `evil-hacker.com` is ONLY allowed to make API requests to `evil-hacker.com`. If it tries to request `bank.com`, the browser will physically block the request and throw a massive red error in the console.

### (2) The Problem: Legitimate Cross-Origin Requests
What if you build your frontend at `my-react-app.com` and your backend at `api.my-backend.com`? They are different domains! The browser will block your own frontend from talking to your own backend!
To fix this, we need a way to punch a safe hole in the Same-Origin Policy. That hole is **CORS (Cross-Origin Resource Sharing)**.

### (3) How CORS works
CORS is a conversation of **HTTP Headers** between the Browser and the Server.
1. The Browser asks the Server: "Hey, my frontend is `my-react-app.com`. Are you okay with me making a request?"
2. The Server replies with a specific header: `Access-Control-Allow-Origin: https://my-react-app.com`
3. The Browser sees the header, says "Okay, the Server trusts this frontend," and lets the data through.

If the Server replies with `Access-Control-Allow-Origin: *`, it means "I allow ANY website on the internet to call my API" (Common for public APIs like weather data).

### (4) The Preflight Request (The `OPTIONS` Method)
If you try to send a complex request (like a `POST` with a JSON body), the browser doesn't just send it blindly. It pauses, and sends an invisible "Preflight" request using the `OPTIONS` HTTP method. 
It basically asks the Server: "Hey, I'm about to send a POST request with JSON. Is that cool?" The Server must reply "Yes, POST is allowed" before the browser will actually send your real `POST` request.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to "fix" CORS on the Frontend

**The mistake:** A frontend developer sees a red CORS error in their Chrome console. They spend 3 hours tweaking their React `fetch()` code, adding weird headers like `mode: 'no-cors'`.

**Why it's wrong:** You **cannot** fix a CORS error from the frontend. Period. 
CORS is a security policy enforced by the Browser to protect the Server. The only way to fix a CORS error is to open the Backend code (Node, Python, Java) and configure the server to return the correct `Access-Control-Allow-Origin` headers. 
**Golden Rule:** If you get a CORS error, you must call the Backend engineer.

---

### Mistake 2: Configuring `Access-Control-Allow-Origin: *` Alongside `Access-Control-Allow-Credentials: true`

**The mistake:** Setting wildcard origin `*` on an API that accepts cookies or credentials.

**Why it's wrong:** Browsers strictly reject CORS responses that combine wildcard `*` origins with `Access-Control-Allow-Credentials: true`. Server must reflect the exact requesting origin.

*Incorrect:*
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true ; ❌ Blocked by browser security rules!
```

*Fix:*
```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

---

### Mistake 3: Attempting to Solve CORS Bugs by Modifying Frontend Request Headers

**The mistake:** Adding `headers: { 'Access-Control-Allow-Origin': '*' }` inside frontend `fetch()` calls.

**Why it's wrong:** `Access-Control-Allow-Origin` is a **RESPONSE header** set by the BACKEND server. Setting CORS response headers inside client requests has zero effect.

*Incorrect:*
```javascript
// Frontend fetch
fetch('https://api.com/data', {
  headers: { 'Access-Control-Allow-Origin': '*' } // ❌ Response header in request!
});
```

*Fix:*
```javascript
// Configure CORS headers in backend server middleware (Express CORS plugin):
app.use(cors({ origin: 'https://app.example.com' }));
```


---

## 5. Practice Exercises

### Exercise 1: Dynamic Origin Whitelist CORS Middleware

**Scenario:** An API gateway inspects the incoming request `Origin` header and matches it against an allowed whitelist before reflecting CORS headers.

**Requirements:**
1. Write handleCorsOrigin(requestOrigin, allowedWhitelist).
2. If origin is in whitelist, reflect Access-Control-Allow-Origin.
3. Else reject CORS access.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleCorsOrigin(requestOrigin, allowedWhitelist = []) {
>   if (!requestOrigin) {
>     return { status: 200, headers: {} };
>   }
>
>   if (allowedWhitelist.includes(requestOrigin)) {
>     return {
>       status: 200,
>       headers: {
>         "Access-Control-Allow-Origin": requestOrigin,
>         "Vary": "Origin"
>       }
>     };
>   }
>
>   return {
>     status: 403,
>     error: "CORS Policy Error: Origin not allowed",
>     headers: {}
>   };
> }
>
> // Verification tests
> const whitelist = ["https://app.example.com", "https://admin.example.com"];
>
> const res1 = handleCorsOrigin("https://app.example.com", whitelist);
> console.assert(res1.status === 200 && res1.headers["Access-Control-Allow-Origin"] === "https://app.example.com", "Test 1 Failed");
>
> const res2 = handleCorsOrigin("https://evil.com", whitelist);
> console.assert(res2.status === 403, "Test 2 Failed: Disallowed origin must return 403");
> ```
>
> #### Technical Explanation
>
> 1. **CORS Mechanism**: Cross-Origin Resource Sharing allows servers to declare which origins can load browser assets.
> 2. **Vary: Origin Header**: Tells caching proxies that responses differ based on the request Origin header.
> 3. **Wildcard Risk**: Using `Access-Control-Allow-Origin: *` prevents sending cookies/credentials in cross-origin requests.
> 
---

### Exercise 2: CORS Credentials & Cookie Configuration Evaluator

**Scenario:** An API security auditor checks CORS configurations to ensure `Access-Control-Allow-Credentials: true` is NEVER paired with `Access-Control-Allow-Origin: *`.

**Requirements:**
1. Write auditCorsCredentialsConfig(allowOrigin, allowCredentials).
2. Flag invalid spec combination.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditCorsCredentialsConfig(allowOrigin, allowCredentials) {
>   if (allowCredentials === true && allowOrigin === "*") {
>     return {
>       valid: false,
>       error: "Spec Error: Access-Control-Allow-Credentials cannot be true when Access-Control-Allow-Origin is '*'"
>     };
>   }
>
>   return { valid: true };
> }
>
> // Verification tests
> console.assert(auditCorsCredentialsConfig("*", true).valid === false, "Test 1 Failed: Wildcard + Credentials is invalid");
> console.assert(auditCorsCredentialsConfig("https://app.com", true).valid === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Credentials Spec Constraint**: Browsers reject CORS responses if allow-credentials is true while allow-origin is wildcard *.
> 2. **Cookies in CORS**: Setting allow-credentials to true permits cross-origin HTTP-only cookies and Authorization headers.
> 3. **Security Hardening**: Explicit origin reflection prevents malicious sites from stealing authenticated user cookies.
> 
---

### Exercise 3: CORS Exposed Custom Headers Generator

**Scenario:** An API server explicitly configures `Access-Control-Expose-Headers` so browser JavaScript can read custom response headers (e.g. `X-Total-Count`).

**Requirements:**
1. Write buildCorsExposeHeaders(customHeaderList).
2. Return Access-Control-Expose-Headers header string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildCorsExposeHeaders(customHeaderList = []) {
>   const defaultExposed = ["Cache-Control", "Content-Language", "Content-Type", "Expires", "Last-Modified", "Pragma"];
>   const allExposed = new Set([...defaultExposed, ...customHeaderList]);
>
>   return {
>     "Access-Control-Expose-Headers": Array.from(allExposed).join(", ")
>   };
> }
>
> // Verification tests
> const headers = buildCorsExposeHeaders(["X-Total-Count", "X-Request-Id"]);
> console.assert(headers["Access-Control-Expose-Headers"].includes("X-Total-Count"), "Test 1 Failed");
> console.assert(headers["Access-Control-Expose-Headers"].includes("X-Request-Id"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Browser Header Exposure Limit**: By default, browser JS can only read simple CORS response headers.
> 2. **Access-Control-Expose-Headers**: Explicitly lists custom headers (X-Total-Count) frontend code is permitted to read in fetch responses.
> 3. **API Gateway Integration**: Mandatory configuration when returning custom pagination or tracing headers to single-page applications.
---

## 6. Related Terms
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The Preflight request uses the obscure `OPTIONS` method.
- [HTTP Headers](../level_02/http_headers.md) — CORS is entirely driven by `Access-Control` headers.
- [Same-Origin Policy](same_origin_policy.md) — Related concept: Same-Origin Policy.
- [Preflight Request (OPTIONS)](preflight_request.md) — CORS preflight OPTIONS request.
- [CORS Errors in the Browser](../level_05/cors_errors.md) — CORS errors handling.

---

## 7. Key Takeaways
- **CORS** is a browser security mechanism that blocks websites from calling APIs on different domains.
- It protects users from malicious scripts making unauthorized background requests.
- To allow communication between different domains, the **Server** must send back specific `Access-Control-Allow-Origin` headers.
- CORS errors can ONLY be fixed on the Backend. You cannot bypass them with Frontend code.
