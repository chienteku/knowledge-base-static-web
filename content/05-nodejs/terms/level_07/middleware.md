# Middleware

> **Level 7 — Web Servers & APIs**
> A function that executes "in the middle" of the Request-Response cycle, allowing you to intercept, modify, or block a user's request before it reaches your final route logic.

---

## 1. Prerequisites
- [Express.js](express_js.md) — Middleware is the defining architectural feature of Express.

---

## 2. Term Category

**Design Pattern / Framework Feature (Node.js)**: Middleware is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you have 50 different API routes in your app. For 40 of them, you need to check if the user is logged in. 
If you write the authentication check inside every single route, you will duplicate your code 40 times. If you need to change how authentication works, you have to rewrite 40 files!
**Middleware** solves this. It is a function that sits *in front* of your routes. When a request comes in, it passes through the Middleware first. The Middleware can check the authentication, log the request, or parse the JSON. If everything looks good, it passes the request on to the final route.

### (2) The `next()` Function
A Middleware function looks exactly like a normal route `(req, res)`, but it has a crucial third argument: `next`.
Because Middleware intercepts the request, the server is essentially paused. The server will not continue until the Middleware explicitly calls the `next()` function, passing the baton to the next function in line.
```javascript
const myLoggerMiddleware = (req, res, next) => {
  console.log(`User requested: ${req.url}`);
  
  // CRITICAL: Pass the baton!
  next(); 
};

// Apply it globally to all routes
app.use(myLoggerMiddleware);

app.get('/home', (req, res) => {
  res.send('Welcome Home');
});
```

### (3) The Bouncer Metaphor
Middleware acts like a Bouncer at a nightclub.
1. User requests entry (`req`).
2. The Bouncer (Middleware) checks their ID.
3. If the ID is bad, the Bouncer kicks them out immediately: `res.status(401).send("Go away")`.
4. If the ID is good, the Bouncer lets them into the club: `next()`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to call `next()`

**The mistake:** A developer writes a middleware to verify an API key. They write the `if` statement to block bad keys, but forget to write `next()` for the good keys.

**Why it's wrong:** If a user provides a *good* API key, the middleware function successfully finishes, but because `next()` was never called, Express doesn't know what to do! The request just hangs in purgatory. The user's browser spins forever until it times out.
**Golden Rule:** Every single path through a middleware function must either end the response (e.g., `res.send()`) or call `next()`.

---



### Mistake 2: Forgetting to Call `next()` in Custom Middleware Functions (Request Hanging Trap)

**The mistake:** Writing a custom logging or authentication middleware without calling `next()`.

**Why it's wrong:** Middleware functions must either send an HTTP response (`res.send()`) or call `next()` to pass control to the next middleware. Omitting both causes request hanging.

*Incorrect:*
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // ❌ Missing next()! Request hangs forever!
});
```

*Fix:*
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass control to next middleware in chain
});
```

### Mistake 3: Calling `next()` AND `res.send()` in the Same Middleware Execution Path

**The mistake:** Calling `next()` after sending a response in custom middleware.

**Why it's wrong:** Calling `next()` after sending a response executes subsequent route handlers, which will attempt to send a 2nd response and throw `ERR_HTTP_HEADERS_SENT`.

*Incorrect:*
```javascript
app.use((req, res, next) => {
  if (blocked) res.status(403).send('Forbidden');
  next(); // ❌ Missing return! Executes next handler anyway!
});
```

*Fix:*
```javascript
app.use((req, res, next) => {
  if (blocked) return res.status(403).send('Forbidden');
  next();
});
```

## 5. Practice Exercises

### Exercise 1: Request Rate-Limiting Express Middleware

**Scenario:** An Express middleware enforces rate limits by tracking client IP request counts in memory and returning `429 Too Many Requests` when limits are exceeded.

**Requirements:**
1. Write rateLimitMiddleware(limit, windowMs).
2. Return Express middleware `(req, res, next)`.
3. Track IP request counts and return 429 when exceeded.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createRateLimiter(limit = 3, windowMs = 1000) {
>   const ipStore = new Map();
>
>   return function rateLimitMiddleware(req, res, next) {
>     const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
>     const now = Date.now();
>
>     if (!ipStore.has(clientIp)) {
>       ipStore.set(clientIp, { count: 1, startTime: now });
>       return next();
>     }
>
>     const record = ipStore.get(clientIp);
>     if (now - record.startTime > windowMs) {
>       record.count = 1;
>       record.startTime = now;
>       return next();
>     }
>
>     record.count++;
>     if (record.count > limit) {
>       res.statusCode = 429;
>       res.setHeader("Content-Type", "application/json");
>       res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
>       return res.end(JSON.stringify({ error: "Too Many Requests" }));
>     }
>
>     next();
>   };
> }
>
> // Verification tests
> const limiter = createRateLimiter(2, 1000);
> let status = 0;
> const mockRes = { setHeader: () => {}, end: () => {}, set statusCode(c) { status = c; } };
> const mockReq = { ip: "1.1.1.1" };
>
> limiter(mockReq, mockRes, () => {});
> limiter(mockReq, mockRes, () => {});
> limiter(mockReq, mockRes, () => {}); // 3rd request exceeds limit!
>
> console.assert(status === 429, "Test 1 Failed: Must return 429 status code");
> ```
>
> #### Technical Explanation
>
> 1. **Middleware Rate Limiting**: Protects API endpoints against brute-force attacks and resource exhaustion.
> 2. **HTTP 429 Status Code**: Standard HTTP status code for rate limiting (`Too Many Requests`).
> 3. **Retry-After Header**: Indicates seconds client must wait before sending next request.
> 
---

### Exercise 2: JWT Bearer Authentication Middleware

**Scenario:** An Express authentication middleware verifies `Authorization: Bearer <token>` headers on protected API endpoints.

**Requirements:**
1. Write bearerAuthMiddleware(secretKey, verifyJwtFn).
2. Extract Bearer token.
3. Attach decoded user to `req.user` or return 401.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBearerAuthMiddleware(secretKey, verifyJwtFn) {
>   return function authMiddleware(req, res, next) {
>     const authHeader = req.headers["authorization"] || req.headers["Authorization"];
>
>     if (!authHeader || !authHeader.startsWith("Bearer ")) {
>       res.statusCode = 401;
>       return res.end(JSON.stringify({ error: "UNAUTHORIZED_MISSING_TOKEN" }));
>     }
>
>     const token = authHeader.split(" ")[1];
>     try {
>       const decodedUser = verifyJwtFn(token, secretKey);
>       req.user = decodedUser; // Attach authenticated user to request!
>       next();
>     } catch (err) {
>       res.statusCode = 401;
>       return res.end(JSON.stringify({ error: "UNAUTHORIZED_INVALID_TOKEN" }));
>     }
>   };
> }
>
> // Verification tests
> const verifyJwt = (tok) => {
>   if (tok === "valid_token") return { id: 42, role: "admin" };
>   throw new Error("Invalid token");
> };
>
> const middleware = createBearerAuthMiddleware("secret", verifyJwt);
> let nextCalled = false;
> const mockReq = { headers: { authorization: "Bearer valid_token" } };
>
> middleware(mockReq, { end: () => {} }, () => { nextCalled = true; });
> console.assert(nextCalled === true, "Test 1 Failed");
> console.assert(mockReq.user.id === 42, "Test 2 Failed: Attached user object to req");
> ```
>
> #### Technical Explanation
>
> 1. **Bearer Token Authorization**: Standard HTTP authorization pattern using JWT tokens in `Authorization: Bearer <token>`.
> 2. **Request Object Enrichment**: Middlewares attach authenticated user models directly to `req.user` for downstream route handlers.
> 3. **401 Unauthorized Response**: Returns 401 if token is missing or signature verification fails.
> 
---

### Exercise 3: Request Execution Logger & Response Timing Middleware

**Scenario:** An Express logging middleware measures total HTTP response execution time and logs method, URL, and status code.

**Requirements:**
1. Write requestTimingMiddleware(loggerMock).
2. Record start time on request entry.
3. Listen to `res.on('finish')` to calculate duration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createTimingMiddleware(loggerMock) {
>   return function timingMiddleware(req, res, next) {
>     const start = Date.now();
>
>     // Listen for completion of HTTP response stream
>     res.on("finish", () => {
>       const durationMs = Date.now() - start;
>       const logEntry = `${req.method} ${req.url} ${res.statusCode} - ${durationMs}ms`;
>       if (loggerMock && typeof loggerMock.info === "function") {
>         loggerMock.info(logEntry);
>       }
>     });
>
>     next();
>   };
> }
>
> // Verification tests
> const events = {};
> let loggedMsg = "";
> const mockRes = {
>   statusCode: 200,
>   on: (e, fn) => { events[e] = fn; }
> };
>
> const middleware = createTimingMiddleware({ info: (msg) => { loggedMsg = msg; } });
> middleware({ method: "GET", url: "/api/users" }, mockRes, () => {});
>
> events["finish"](); // Response completed
> console.assert(loggedMsg.includes("GET /api/users 200"), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **res.on('finish') Event**: Emitted when HTTP response stream header and body have been flushed to the client socket.
> 2. **Morgan & Logger Middleware**: Popular logging packages (Morgan, Pino-http) hook into `res.on('finish')` to log requests.
> 3. **Non-Blocking Logging**: Calculating duration inside response completion callback avoids adding lag to API handler logic.
## 6. Related Terms
- [Routing](routing.md) — Where the request goes after it survives the Middleware.
- [Body Parsing (express.json())](body_parsing.md) — Related concept: Body Parsing (express.json()).
- [Express.js](express_js.md) — Related concept: Express.js.
- [The Middleware Chain & next()](middleware_chain.md) — Related concept: The Middleware Chain & next().
- [CORS](../level_09/cors.md) — Related concept: CORS.
- [Rate Limiting](../level_09/rate_limiting.md) — Related concept: Rate Limiting.

---

## 7. Key Takeaways
- **Middleware** are functions that execute between the incoming request and the final route handler.
- They are used for shared logic like Authentication, Logging, and JSON parsing.
- They take three arguments: `req, res, next`.
- You MUST call **`next()`** to pass the request to the next function, otherwise the server will hang forever.
- You can apply them globally using `app.use()`, or attach them to specific routes.
