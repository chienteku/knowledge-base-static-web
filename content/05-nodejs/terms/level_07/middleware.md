# Middleware

> **Level 7 — Web Servers & APIs**
> A function that executes "in the middle" of the Request-Response cycle, allowing you to intercept, modify, or block a user's request before it reaches your final route logic.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — Middleware is the defining architectural feature of Express.

---

## 2. Term Category
- **Design Pattern / Framework Feature**

---

## 3. Environment Context
- **Node.js (Server Infrastructure)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Forgetting to Call `next()` in Custom Middleware Functions (Request Hanging Trap)

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

### Mistake 5: Calling `next()` AND `res.send()` in the Same Middleware Execution Path

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



### Mistake 6: Forgetting to Call `next()` in Custom Middleware Functions (Request Hanging Trap)

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

### Mistake 7: Calling `next()` AND `res.send()` in the Same Middleware Execution Path

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

## 6. Practice Exercises

### Exercise 1: The Bouncer

**Problem:** Write an Express middleware function called `requireAdmin` that checks if `req.query.role` is exactly equal to `"admin"`. If it is, allow the request to continue. If it is not, return a 403 Forbidden status.

**Expected output:**
> [!check]- Answer
> ```javascript
> const requireAdmin = (req, res, next) => {
>   if (req.query.role === 'admin') {
>     next(); // Pass the baton!
>   } else {
>     res.status(403).send("Forbidden: Admins only."); // Block them!
>   }
> };
> 
> // Usage:
> app.get('/dashboard', requireAdmin, (req, res) => {
>   res.send("Welcome to the secret admin dashboard!");
> });
> ```
> - Remember the three arguments: `req, res, next`.
> - Use `if/else` to decide between `next()` and `res.status().send()`.

---



### Exercise 2: Writing Custom Logger Middleware

**Problem:** Write an Express middleware that logs `req.method` and `req.url` before calling `next()`.

**Expected output:**
> [!check]- Answer
> ```text
> app.use((req, res, next) => { console.log(req.method, req.url); next(); });
> ```
> ```javascript
> app.use((req, res, next) => {
>   console.log(`${req.method} ${req.url}`);
>   next();
> });
> ```
>
> **Explanation:** Express middleware functions receive `(req, res, next)` signature.

---

### Exercise 3: Express Middleware Parameter Count Distinction

**Problem:** How does Express distinguish standard middleware from error-handling middleware? (By parameter count: standard has 3 `(req, res, next)`; error-handling has 4 `(err, req, res, next)`).

**Expected output:**
> [!check]- Answer
> ```text
> By parameter count: error middleware has 4 arguments (err, req, res, next).
> ```
> ```text
> By parameter count: error middleware has 4 arguments (err, req, res, next).
> ```
>
> **Explanation:** Express inspects function `length` property to identify 4-parameter error handlers.

## 7. Related Terms
- [Routing](../level_07/routing.md) — Where the request goes after it survives the Middleware.

---

## 8. Key Takeaways
- **Middleware** are functions that execute between the incoming request and the final route handler.
- They are used for shared logic like Authentication, Logging, and JSON parsing.
- They take three arguments: `req, res, next`.
- You MUST call **`next()`** to pass the request to the next function, otherwise the server will hang forever.
- You can apply them globally using `app.use()`, or attach them to specific routes.
