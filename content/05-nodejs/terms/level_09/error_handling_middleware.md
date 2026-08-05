# Error Handling Middleware

> **Level 9 — REST APIs & Best Practices**
> Express's 4-arg `(err, req, res, next)` handler — arguably the most important missing Express term.

---

## 1. Prerequisites
- [The Middleware Chain & next()](../level_07/middleware_chain.md) — The routing conveyor belt.
- [Async Error Handling (try/catch + .catch)](../level_05/async_error_handling.md) — Trapping async errors before forwarding them.
---

## 2. Term Category
- **Architecture / Design Pattern**

---

## 3. Environment Context
- **Web App Server Layer** (Centralizes error interceptors at the base of the routing pipeline).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a database connection fails, a validation schema throws, or a file read errors out inside a controller, the server must handle the error. Writing duplicate error response blocks (e.g. `res.status(500).json(...)`) inside every single controller handler makes code cluttered and hard to maintain.

To resolve this, Express supports **Centralized Error Handling Middleware**:
-   **The 4-Argument Signature:** Express identifies error-handling middleware strictly by the number of parameters it accepts. It **must have exactly 4 arguments**:
    `app.use((err, req, res, next) => { ... })`
    If you omit even one argument (like `next`), Express will interpret it as standard middleware, causing routing logic to break.
-   **Triggering the Handler:** When an error is caught in a controller (typically inside a `try/catch` block), the controller calls **`next(err)`**, passing the error object.
-   **Pipeline Bypass:** When `next(err)` is invoked, Express immediately stops executing standard routes and forwards the error object directly to the 4-arg error-handling middleware at the bottom of the stack.
-   **Security Controls:** The central handler logs the error stack trace to the console (for developer debugging) while returning a clean, user-friendly JSON message to the client, concealing internal server details from potential attackers.

---

### (2) Reality Metaphor
Imagine a massive construction site.
- **Decentralized (No Error Middleware):** Every workspace on the site must have its own stock of bandages, custom medical tools, and doctors. If a worker gets hurt, the team must perform medical care themselves. If they make a mistake, the worker passes out (**the server crashes**).
- **Centralized (Error-Handling Middleware):** The site has a single **first-aid clinic** located at the exit gate. If a worker gets hurt anywhere on the site, the foreman places them on a stretcher and calls the transport cart (**`next(err)`**). The cart bypasses all standard work zones and takes the worker straight to the clinic. The clinic diagnoses the issue, logs it, applies the proper treatment, and releases the patient safely (**returns a standard error JSON response**).

---

### (3) Express Implementation Example

```javascript
const express = require('express');
const app = express();

app.get('/api/data', async (req, res, next) => {
  try {
    // Simulate a database read failure
    throw new Error('Database read timeout');
  } catch (err) {
    // Pass the error to the Express error-handling stack
    next(err); 
  }
});

// ==========================================
// CENTRAL ERROR-HANDLING MIDDLEWARE
// ==========================================
// Note: This must be defined AFTER all standard routes and middleware!
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  
  // Log the detailed error stack trace to our server console for diagnostics
  console.error(`[ERROR] ${err.name}: ${err.message}\nStack: ${err.stack}`);

  // Send a clean, standardized response to the client
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    // ONLY display stack traces in development mode to prevent information disclosure leaks!
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Registering error-handling middleware at the top of the file

**The mistake:** Defining the 4-argument error-handling middleware before defining your routes:

```javascript
// WRONG: Routes declared after this middleware cannot route errors to it!
app.use((err, req, res, next) => {
  res.status(500).send("Crash!");
});

app.get('/api/users', (req, res, next) => {
  next(new Error('Auth failed')); // Skip right past the handler!
});
```

**Why it's wrong:** Express matches and executes middleware in the order they are registered. If the error handler is registered at the top of the file, it has already been bypassed by the time the route handler runs and calls `next(err)`.

*Fix:* Always register your error-handling middleware at the very bottom of your application script, after all route definitions and standard middleware declarations (like `express.json()`).

---



### Mistake 2: Declaring Error Handling Middleware with Fewer Than 4 Parameters

**The mistake:** Writing `app.use((err, req, res) => ...)` with only 3 parameters.

**Why it's wrong:** Express identifies error-handling middleware strictly by checking `function.length === 4` (`(err, req, res, next)`). With 3 parameters, Express treats it as standard middleware.

*Incorrect:*
```javascript
app.use((err, req, res) => {
  res.status(500).send(err.message); // ❌ Express treats this as regular 3-param middleware!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).send(err.message); // Must include all 4 parameters (err, req, res, next)
});
```

### Mistake 3: Leaking Raw Internal Server Error Stack Traces to Clients in Production

**The mistake:** Returning `res.status(500).json({ error: err.stack })` in production environments.

**Why it's wrong:** Exposing internal stack traces to public clients leaks database schema details, file system paths, and library versions to attackers. Return clean error messages in production.

*Incorrect:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack }); // ❌ Leaks sensitive internal paths in prod!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal Server Error' : err.message
  });
});
```



### Mistake 4: Declaring Error Handling Middleware with Fewer Than 4 Parameters

**The mistake:** Writing `app.use((err, req, res) => ...)` with only 3 parameters.

**Why it's wrong:** Express identifies error-handling middleware strictly by checking `function.length === 4` (`(err, req, res, next)`). With 3 parameters, Express treats it as standard middleware.

*Incorrect:*
```javascript
app.use((err, req, res) => {
  res.status(500).send(err.message); // ❌ Express treats this as regular 3-param middleware!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).send(err.message); // Must include all 4 parameters (err, req, res, next)
});
```

### Mistake 5: Leaking Raw Internal Server Error Stack Traces to Clients in Production

**The mistake:** Returning `res.status(500).json({ error: err.stack })` in production environments.

**Why it's wrong:** Exposing internal stack traces to public clients leaks database schema details, file system paths, and library versions to attackers. Return clean error messages in production.

*Incorrect:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack }); // ❌ Leaks sensitive internal paths in prod!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal Server Error' : err.message
  });
});
```



### Mistake 6: Declaring Error Handling Middleware with Fewer Than 4 Parameters

**The mistake:** Writing `app.use((err, req, res) => ...)` with only 3 parameters.

**Why it's wrong:** Express identifies error-handling middleware strictly by checking `function.length === 4` (`(err, req, res, next)`). With 3 parameters, Express treats it as standard middleware.

*Incorrect:*
```javascript
app.use((err, req, res) => {
  res.status(500).send(err.message); // ❌ Express treats this as regular 3-param middleware!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).send(err.message); // Must include all 4 parameters (err, req, res, next)
});
```

### Mistake 7: Leaking Raw Internal Server Error Stack Traces to Clients in Production

**The mistake:** Returning `res.status(500).json({ error: err.stack })` in production environments.

**Why it's wrong:** Exposing internal stack traces to public clients leaks database schema details, file system paths, and library versions to attackers. Return clean error messages in production.

*Incorrect:*
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack }); // ❌ Leaks sensitive internal paths in prod!
});
```

*Fix:*
```javascript
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal Server Error' : err.message
  });
});
```

## 6. Practice Exercises

### Exercise 1: Custom Error Handler

**Problem:** Complete the error-handling middleware below to return a `400` status if the error name is `'ValidationError'`, and a `500` status for other errors:

```javascript
app.use((err, req, res, next) => {
  // Solution:
  const isValidation = err.name === 'ValidationError' || err.message.includes('validation');
  const statusCode = isValidation ? 400 : 500;

  res.status(statusCode).json({
    error: {
      type: err.name,
      message: err.message
    }
  });
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Writing Central Express Error Handler

**Problem:** Write 4-parameter Express error handling middleware logging error and returning status 500 JSON payload.

**Expected output:**
> [!check]- Answer
> ```text
> app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: err.message }); });
> ```
> ```javascript
> app.use((err, req, res, next) => {
>   console.error(err.stack);
>   res.status(err.statusCode || 500).json({
>     error: err.message || 'Internal Server Error'
>   });
> });
> ```
>
> **Explanation:** 4-parameter error middleware catches errors passed via `next(err)`.

---

### Exercise 3: Custom AppError Class Pattern

**Problem:** Create custom `AppError` class extending `Error` adding `statusCode` property.

**Expected output:**
> [!check]- Answer
> ```text
> class AppError extends Error { constructor(message, statusCode) { super(message); this.statusCode = statusCode; } }
> ```
> ```javascript
> class AppError extends Error {
>   constructor(message, statusCode) {
>     super(message);
>     this.statusCode = statusCode;
>   }
> }
> ```
>
> **Explanation:** Custom `AppError` classes attach HTTP status codes to thrown errors.

## 7. Related Terms
- [The Middleware Chain & next()](../level_07/middleware_chain.md) — The middleware queue structure.
- [Async Error Handling (try/catch + .catch)](../level_05/async_error_handling.md) — Catching async errors to pass them to `next(err)`.
- [Controllers & Services](controllers_services.md) — Related concept: Controllers & Services.
---

## 8. Key Takeaways
- Centralized error handlers clean up controller code by isolating error responses.
- Express identifies error middleware by its 4-argument signature: `(err, req, res, next)`.
- You must include all 4 arguments in the signature, even if you do not call `next` inside the handler.
- Register error-handling middleware at the bottom of the file, after all route definitions.
- Hide stack traces in production to prevent leaking sensitive system details.
