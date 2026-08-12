# CORS

> **Level 9 — REST APIs & Best Practices**
> A strict security feature built into all web browsers that blocks a website from making an API request to a different domain name, unless the API explicitly gives it permission.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — You usually fix CORS issues using an Express middleware.
- [REST API Design](rest_api.md) — APIs are the target of CORS blocks.

---

## 2. Term Category

**Browser Security / API Configuration (Browser-to-Server Communication)**: CORS is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are logged into your bank at `bank.com`. Your browser stores a secret authentication cookie for the bank.
Later, you visit an evil hacker's website: `evil.com`. Behind the scenes, the hacker writes JavaScript that secretly runs `fetch('https://bank.com/transfer_money')`. Because your browser automatically attaches your bank cookie, the bank thinks *you* made the request, and steals your money!
To stop this, browsers invented the **Same-Origin Policy**. The browser says: *"If the JavaScript is running on `evil.com`, it is NOT ALLOWED to fetch data from `bank.com`!"*

### (2) The Problem for Developers
This security feature creates a massive headache for legitimate developers. 
If your React frontend is hosted on `my-app.com`, and your Node.js backend is hosted on `api.my-app.com`, the browser sees two different domains. When React tries to fetch data from the API, the browser blocks it and throws a massive red **CORS Error** in the console.

### (3) The Solution: The CORS Header
To fix this, the backend server must explicitly tell the browser: *"It's okay! I trust `my-app.com`. Let them through."*
In Node.js, we do this by adding a special HTTP Header (`Access-Control-Allow-Origin`) to the response. The easiest way to do this is using the official `cors` middleware package.
```javascript
const express = require('express');
const cors = require('cors'); // The magic package
const app = express();

// Tell the browser that our specific frontend is allowed to access the API
app.use(cors({
  origin: 'https://my-app.com' 
}));

app.get('/data', (req, res) => res.json({ secret: 123 }));
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The Wildcard CORS (`*`)

**The mistake:** A developer gets a CORS error. They Google the solution and paste `app.use(cors({ origin: '*' }))` into their server. The error goes away.

**Why it's wrong:** The `*` wildcard tells the browser: *"I trust EVERY website on the internet!"* You just disabled the entire security system. Now, `evil.com` can successfully steal your users' data again.
**Golden Rule:** Never use `origin: '*'` in production for an API that requires authentication. Always hardcode your specific frontend URLs. (Note: Public, open APIs like a Weather API *should* use `*` because they want everyone to access the data).

---



### Mistake 2: Using Wildcard CORS `origin: '*'` with Credentials (`credentials: true`)

**The mistake:** Configuring CORS with `origin: '*'` while enabling `credentials: true`.

**Why it's wrong:** Browsers reject CORS requests specifying `credentials: true` when `origin` is a wildcard `'*'`. Specify explicit client domain origins (e.g. `https://myapp.com`).

*Incorrect:*
```javascript
app.use(cors({ origin: '*', credentials: true })); // ❌ Rejected by browser!
```

*Fix:*
```javascript
app.use(cors({ origin: 'https://myapp.com', credentials: true })); // Explicit client origin
```

### Mistake 3: Failing to Handle Preflight OPTIONS Requests in Express Routes

**The mistake:** Omitting OPTIONS HTTP method support when implementing custom CORS headers manually without the `cors` package.

**Why it's wrong:** Browsers issue an automatic `OPTIONS` preflight request before sending complex HTTP requests (e.g. `POST` with `Content-Type: application/json` or custom headers). Unhandled `OPTIONS` requests fail CORS checks.

*Incorrect:*
```javascript
// Manual CORS headers added to GET/POST but omitting OPTIONS handler
```

*Fix:*
```javascript
app.use(cors()); // Use official cors middleware handling OPTIONS preflight automatically
```

## 5. Practice Exercises

### Exercise 1: Custom CORS Whitelist Origin Evaluator Middleware

**Scenario:** An API gateway middleware checks incoming request `Origin` headers against an allowed domain whitelist and injects CORS response headers.

**Requirements:**
1. Write corsWhitelistMiddleware(allowedOriginsArray).
2. Return Express middleware `(req, res, next)`.
3. Set `Access-Control-Allow-Origin` if origin matched.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createCorsMiddleware(allowedOriginsArray = []) {
>   const allowedSet = new Set(allowedOriginsArray);
>
>   return function corsWhitelistMiddleware(req, res, next) {
>     const origin = req.headers["origin"] || req.headers["Origin"];
>
>     if (origin && allowedSet.has(origin)) {
>       res.setHeader("Access-Control-Allow-Origin", origin);
>       res.setHeader("Vary", "Origin");
>     }
>
>     next();
>   };
> }
>
> // Verification tests
> const headers = {};
> const mockRes = { setHeader: (k, v) => { headers[k] = v; } };
>
> const cors = createCorsMiddleware(["https://app.company.com", "https://admin.company.com"]);
> cors({ headers: { origin: "https://app.company.com" } }, mockRes, () => {});
>
> console.assert(headers["Access-Control-Allow-Origin"] === "https://app.company.com", "Test 1 Failed");
> console.assert(headers["Vary"] === "Origin", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Cross-Origin Resource Sharing (CORS)**: Browser security mechanism restricting web pages from making cross-origin requests.
> 2. **Dynamic Origin Whitelisting**: Echoes back matched origin dynamically instead of using unsafe wildcard `*` with credentials.
> 3. **`Vary: Origin` Header**: Tells CDNs and browser caches to cache separate response copies for different origin headers.
> 
---

### Exercise 2: CORS Preflight OPTIONS Handling with Credentials

**Scenario:** Handles CORS OPTIONS preflight requests by setting `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Access-Control-Allow-Credentials`.

**Requirements:**
1. Write handleCorsPreflight(req, res).
2. Check HTTP method OPTIONS.
3. Set preflight headers and status 204.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleCorsPreflight(req, res) {
>   if (req.method !== "OPTIONS") {
>     return false;
>   }
>
>   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
>   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
>   res.setHeader("Access-Control-Allow-Credentials", "true");
>   res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
>
>   res.statusCode = 204;
>   res.end();
>   return true;
> }
>
> // Verification tests
> const headers = {};
> let status = 0;
> const mockRes = {
>   setHeader: (k, v) => { headers[k] = v; },
>   set statusCode(c) { status = c; },
>   end: () => {}
> };
>
> const handled = handleCorsPreflight({ method: "OPTIONS" }, mockRes);
> console.assert(handled === true, "Test 1 Failed: Preflight handled");
> console.assert(status === 204, "Test 2 Failed: Status 204 No Content");
> console.assert(headers["Access-Control-Allow-Credentials"] === "true", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **CORS Preflight Requests**: Browsers automatically issue HTTP OPTIONS requests before sending POST/PUT/DELETE or requests with custom headers.
> 2. **Access-Control-Allow-Credentials**: Required when client requests send cookies or Authorization headers (`credentials: 'include'`).
> 3. **Access-Control-Max-Age**: Caches preflight permission results in browser cache to eliminate OPTIONS round-trip latency.
> 
---

### Exercise 3: Dynamic Multi-Tenant CORS Header Injector

**Scenario:** Resolves CORS origin permissions dynamically based on the requested API tenant domain.

**Requirements:**
1. Write dynamicTenantCors(req, res, getTenantOriginsFn).
2. Lookup allowed origins for tenant.
3. Set CORS headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function dynamicTenantCors(req, res, getTenantOriginsFn) {
>   const origin = req.headers["origin"] || req.headers["Origin"];
>   const tenantId = req.headers["x-tenant-id"] || "default";
>
>   if (!origin) return;
>
>   const allowedOrigins = await getTenantOriginsFn(tenantId);
>   if (allowedOrigins.includes(origin)) {
>     res.setHeader("Access-Control-Allow-Origin", origin);
>     res.setHeader("Access-Control-Allow-Credentials", "true");
>   }
> }
>
> // Verification tests
> const headers = {};
> const mockRes = { setHeader: (k, v) => { headers[k] = v; } };
> const getTenantOrigins = async (tenantId) => tenantId === "tenant_a" ? ["https://a.com"] : [];
>
> dynamicTenantCors({ headers: { origin: "https://a.com", "x-tenant-id": "tenant_a" } }, mockRes, getTenantOrigins).then(() => {
>   console.assert(headers["Access-Control-Allow-Origin"] === "https://a.com", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Tenant CORS Isolation**: Dynamically verifies allowed origins per tenant account instead of maintaining a static global whitelist.
> 2. **Security Hardening**: Prevents Tenant A's domain from accessing Tenant B's API endpoints.
> 3. **Async Origin Lookup**: Allows loading allowed CORS origins dynamically from database or Redis cache.
## 6. Related Terms
- [Middleware](../level_07/middleware.md) — `cors()` is just a standard Express middleware.
- [REST API Design](rest_api.md) — What the browser is trying to protect.
- [Express.js](../level_07/express_js.md) — Express CORS setup.

---

## 7. Key Takeaways
- **CORS** is a browser security mechanism that blocks scripts on one domain from calling an API on a different domain.
- It exists to prevent malicious websites from making requests on your behalf.
- To bypass it for legitimate frontends, your Node.js API must explicitly whitelist the frontend domain using the `cors` npm package.
- Never use the `*` wildcard on private APIs, as it completely destroys the security mechanism.
