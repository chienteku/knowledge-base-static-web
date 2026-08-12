# The req & res Objects

> **Level 7 — Web Servers & APIs**
> The two massive JavaScript objects passed into every single route and middleware function. One represents what the user sent you, and the other provides the tools to send data back.

---

## 1. Prerequisites
- [Express.js](express_js.md) — This article focuses specifically on the Express-enhanced versions of these objects.
- [JSON (JavaScript Object Notation)](../../../04-apis/terms/level_01/json.md) — How you usually send data back using `res`.

---

## 2. Term Category

**API Core Objects (Express.js Route Callbacks)**: The req & res Objects is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a user clicks "Submit" on a login form, that data travels across the ocean, through fiber optic cables, and hits your server.
How do you actually read their username? How do you read their IP address? How do you tell their browser "Success" or "Failure"?
The framework packages all of this complexity into two massive objects and hands them directly to your callback function: `(req, res) => {}`.

### (2) The Request Object (`req`)
The `req` object represents everything the user is asking or sending. It is essentially a read-only object.
Crucial properties:
- **`req.body`**: The JSON data they sent (e.g., username and password). *Requires `express.json()` middleware!*
- **`req.params`**: Dynamic variables in the URL path (e.g., the `12` in `/users/:id` becomes `req.params.id === 12`).
- **`req.query`**: Variables at the end of the URL after the question mark (e.g., `/search?color=red` becomes `req.query.color === 'red'`).
- **`req.headers`**: Hidden metadata sent by the browser (like Authentication tokens or User-Agent strings).

### (3) The Response Object (`res`)
The `res` object is your toolbox for talking back to the user.
Crucial methods:
- **`res.json({ data: "Hello" })`**: Converts a JS object into JSON and sends it back. (The most common method for APIs).
- **`res.status(404)`**: Sets the HTTP Status Code (e.g., 200 OK, 404 Not Found, 500 Error).
- **`res.send("HTML or Text")`**: Sends raw text or HTML.
- **`res.redirect('/login')`**: Forces the user's browser to instantly navigate to a different page.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to send two responses

**The mistake:** A developer writes a route that checks if a user exists. 
```javascript
app.get('/user', (req, res) => {
  if (!user) {
    res.status(404).json({ error: "No user found" });
  }
  res.json({ message: "Welcome back!" }); // Crash!
});
```

**Why it's wrong:** The HTTP protocol dictates one request gets exactly ONE response. When you call `res.json()`, Node.js closes the connection. If you try to call `res.json()` a second time underneath it, Node.js throws a fatal error: `Cannot set headers after they are sent to the client`.
**Golden Rule:** Always use `return res.json(...)` inside `if` statements to guarantee the function stops executing after sending a response.

---



### Mistake 2: Confusing `req.query` with `req.params` in Express Routes

**The mistake:** Accessing `req.params.sort` for URL `http://api.com/users?sort=asc`.

**Why it's wrong:** `req.params` extracts route path placeholders (`/users/:id`). `req.query` extracts URL query parameters (`?sort=asc`).

*Incorrect:*
```javascript
// URL: /users?sort=asc
const sort = req.params.sort; // ❌ undefined!
```

*Fix:*
```javascript
// URL: /users?sort=asc
const sort = req.query.sort; // 'asc'
```

### Mistake 3: Using `res.json()` Followed by `res.send()` in Same Handler

**The mistake:** Calling `res.json(data)` and `res.send('done')` sequentially.

**Why it's wrong:** Both `res.json()` and `res.send()` end the HTTP response stream. Calling both throws `ERR_HTTP_HEADERS_SENT`.

*Incorrect:*
```javascript
res.json({ user: 'Alice' });
res.send('Done'); // ❌ ERR_HTTP_HEADERS_SENT!
```

*Fix:*
```javascript
return res.json({ user: 'Alice' }); // Single response call
```

## 5. Practice Exercises

### Exercise 1: Express req and res Helper Extender Decorator

**Scenario:** Extends Node.js native `http.IncomingMessage` and `http.ServerResponse` objects with Express-style convenience helper methods (`res.json()`, `res.status()`).

**Requirements:**
1. Write decorateReqRes(reqMock, resMock).
2. Implement `res.status(code)` chaining.
3. Implement `res.json(obj)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function decorateReqRes(reqMock, resMock) {
>   resMock.status = function (code) {
>     this.statusCode = code;
>     return this; // Enable method chaining!
>   };
>
>   resMock.json = function (bodyObj) {
>     this.setHeader("Content-Type", "application/json");
>     this.end(JSON.stringify(bodyObj));
>   };
>
>   reqMock.get = function (headerName) {
>     const key = String(headerName).toLowerCase();
>     return this.headers?.[key];
>   };
>
>   return { req: reqMock, res: resMock };
> }
>
> // Verification tests
> let jsonEnded = "";
> const mockRes = {
>   statusCode: 200,
>   setHeader: () => {},
>   end: (data) => { jsonEnded = data; }
> };
> const mockReq = { headers: { "user-agent": "Mozilla/5.0" } };
>
> const { req, res } = decorateReqRes(mockReq, mockRes);
> console.assert(req.get("User-Agent") === "Mozilla/5.0", "Test 1 Failed");
>
> res.status(201).json({ created: true });
> console.assert(mockRes.statusCode === 201, "Test 2 Failed: Method chaining status");
> console.assert(JSON.parse(jsonEnded).created === true, "Test 3 Failed: res.json sent payload");
> ```
>
> #### Technical Explanation
>
> 1. **Express Object Prototype Extension**: Express extends HTTP prototypes (`http.IncomingMessage.prototype`, `http.ServerResponse.prototype`) to add helper methods.
> 2. **Method Chaining Syntax**: Returning `this` from helper methods allows expressive chaining (`res.status(201).json(...)`).
> 3. **Case-Insensitive Header Lookup**: `req.get('Content-Type')` converts input keys to lowercase to match HTTP header normalization rules.
> 
---

### Exercise 2: Request Metadata & Client IP Extractor

**Scenario:** Extracts client IP addresses, user agents, and query parameters safely from HTTP request objects behind proxies.

**Requirements:**
1. Write extractClientMetadata(reqMock).
2. Extract client IP from `X-Forwarded-For` or `socket.remoteAddress`.
3. Extract user agent.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractClientMetadata(reqMock) {
>   const headers = reqMock.headers || {};
>   const forwardedFor = headers["x-forwarded-for"] || headers["X-Forwarded-For"];
>
>   let clientIp = "127.0.0.1";
>   if (forwardedFor) {
>     clientIp = forwardedFor.split(",")[0].trim();
>   } else if (reqMock.socket?.remoteAddress) {
>     clientIp = reqMock.socket.remoteAddress;
>   }
>
>   return {
>     clientIp,
>     userAgent: headers["user-agent"] || headers["User-Agent"] || "UNKNOWN",
>     method: (reqMock.method || "GET").toUpperCase(),
>     url: reqMock.url || "/"
>   };
> }
>
> // Verification tests
> const mockReq = {
>   method: "POST",
>   url: "/api/login",
>   headers: {
>     "x-forwarded-for": "203.0.113.195, 70.41.3.18",
>     "user-agent": "NodeJS/20.0"
>   }
> };
>
> const meta = extractClientMetadata(mockReq);
> console.assert(meta.clientIp === "203.0.113.195", "Test 1 Failed: First IP in X-Forwarded-For");
> console.assert(meta.userAgent === "NodeJS/20.0", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Proxy Headers (X-Forwarded-For)**: When Node.js is behind reverse proxies (Nginx, Cloudflare), `req.socket.remoteAddress` is proxy IP; real client IP is in `X-Forwarded-For`.
> 2. **app.set('trust proxy')**: Express requires `app.set('trust proxy', true)` to enable automatic `req.ip` proxy resolution.
> 3. **Security Spoofing Alert**: Only trust `X-Forwarded-For` headers if Node.js sits behind a trusted reverse proxy that strips forged client headers.
> 
---

### Exercise 3: Response Cookie & Header Mutator

**Scenario:** Attaches HTTP cookies to response objects by appending `Set-Cookie` headers with attributes (`HttpOnly`, `Secure`, `SameSite`).

**Requirements:**
1. Write setResponseCookie(resMock, name, value, options).
2. Format `Set-Cookie` string.
3. Attach to response headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setResponseCookie(resMock, name, value, options = {}) {
>   const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
>
>   if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
>   if (options.domain) parts.push(`Domain=${options.domain}`);
>   if (options.path) parts.push(`Path=${options.path || "/"}`);
>   if (options.httpOnly) parts.push("HttpOnly");
>   if (options.secure) parts.push("Secure");
>   if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
>
>   const cookieString = parts.join("; ");
>   resMock.setHeader("Set-Cookie", cookieString);
>
>   return cookieString;
> }
>
> // Verification tests
> let setHeaderValue = "";
> const mockRes = { setHeader: (k, v) => { setHeaderValue = v; } };
>
> setResponseCookie(mockRes, "session_id", "xyz123", { httpOnly: true, secure: true, sameSite: "Strict" });
> console.assert(setHeaderValue.includes("session_id=xyz123"), "Test 1 Failed");
> console.assert(setHeaderValue.includes("HttpOnly; Secure; SameSite=Strict"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Set-Cookie HTTP Header**: HTTP response header used by server to store cookies in client browser.
> 2. **HttpOnly & Secure Flags**: `HttpOnly` prevents client-side JS access to block XSS attacks; `Secure` enforces HTTPS-only transmission.
> 3. **res.cookie() in Express**: Express provides `res.cookie(name, val, options)` wrapping `Set-Cookie` string construction.
## 6. Related Terms
- [Routing](routing.md) — The system that passes these objects to your function.
- [HTTP Status Codes](../level_09/status_codes.md) — What you inject into `res.status()`.
- [Body Parsing (express.json())](body_parsing.md) — Related concept: Body Parsing (express.json()).
- [The http Module Deep Dive](http_deep_dive.md) — Related concept: The http Module Deep Dive.
- [The Middleware Chain & next()](middleware_chain.md) — Related concept: The Middleware Chain & next().
- [Route Parameters & Query Strings](route_parameters.md) — Related concept: Route Parameters & Query Strings.
- [Pagination](../level_09/pagination.md) — Related concept: Pagination.
- [The http Module](../level_02/http_module.md) — Related concept: The http Module.
- [Express.js](express_js.md) — Related concept: Express.js.

---

## 7. Key Takeaways
- **`req` (Request)** contains all incoming data: `req.body` (JSON payload), `req.params` (URL paths), and `req.query` (Search queries).
- **`res` (Response)** is the toolbox to send data back: `res.json()` and `res.status()`.
- You must have the `express.json()` middleware enabled to read `req.body`.
- You can only send ONE response per request. Use `return res.json()` to avoid "Headers already sent" crashes.
