# Input Validation (joi / zod)

> **Level 9 — REST APIs & Best Practices**
> Rejecting bad payloads at the edge ("never trust the client") before they hit the DB.

---

## 1. Prerequisites
- [Body Parsing (express.json())](../level_07/body_parsing.md) — Extracting payload data into JavaScript objects.
- [HTTP Status Codes](status_codes.md) — Utilizing standard client error responses (`400 Bad Request`).

---

## 2. Term Category

**Security / Data Validation (Web App Server Layer .)**: Input Validation (joi / zod) is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In web development, the fundamental rule of security is: **Never trust input from the client**. Malicious or poorly formatted requests can trigger database crashes, cause memory issues, corrupt data states, or expose injection vulnerabilities.

While database schemas (like Mongoose schemas) catch errors, validating data at the database layer occurs **too late** in the application lifecycle. By the time database validation runs, the request has already consumed database connections, executed controller logic, and wasted CPU cycles.

To reject invalid payloads immediately, developers use **Input Validation Schema Libraries** (such as **Zod** or **Joi**) as middleware:
-   **Validation Schemas:** Define the exact expected format, shape, and rules for incoming data (e.g., `email` must be a valid email format, and `age` must be an integer between 18 and 100).
-   **Edge Interception:** The schema validates the payload (`req.body`, `req.params`, or `req.query`) at the entry point of the route handler.
-   **Immediate Fail-Fast:** If validation fails, the middleware terminates the request immediately, returning a `400 Bad Request` status and a list of validation errors. The request never reaches the controller or database.

---

### (2) Reality Metaphor
Imagine a high-security nightclub.
- **Database Validation (The Bartender):** You let anyone walk into the club without checking their ID. The guest enters, sits at the bar, orders a drink, and only *then* the bartender checks their ID. If they are underage, the bartender kicks them out. By then, the guest has already occupied a seat and wasted the bartender's time.
- **Input Validation Middleware (The Front-Door Bouncer):** A bouncer stands at the entrance. Before anyone is allowed to step inside the club (**before the controller runs**), they must present their ID. If the ID is invalid or missing, the bouncer turns them away immediately. The club remains secure, and no bartender time is wasted.

---

### (3) JavaScript Implementation Example using Zod

```javascript
const express = require('express');
const { z } = require('zod'); // Zod schema library
const app = express();

app.use(express.json());

// 1. Define the Validation Schema shape
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  age: z.number().int().min(18).max(100).optional()
});

// 2. Create the Validation Middleware Wrapper
const validateRequest = (schema) => {
  return (req, res, next) => {
    // Parse input against schema rules
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      // 3. Fail-fast: Return 400 Bad Request with errors
      return res.status(400).json({
        status: 'fail',
        errors: result.error.errors.map(err => ({
          field: err.path[0],
          message: err.message
        }))
      });
    }
    
    // Replace req.body with the sanitized, parsed output
    req.body = result.data;
    next();
  };
};

// 4. Register the middleware in the route
app.post('/api/register', validateRequest(registerSchema), (req, res) => {
  // If this code runs, we are guaranteed the input is valid!
  res.json({ message: "Registration input valid!", data: req.body });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing manual `if/else` checks inside controllers for input validation

**The mistake:** Manually writing checks for every parameter directly inside your controller code:
```javascript
// BAD: Makes controllers verbose, messy, and hard to maintain!
app.post('/register', (req, res) => {
  if (!req.body.email) return res.status(400).send("Email required");
  if (!req.body.email.includes('@')) return res.status(400).send("Invalid email");
  if (req.body.password.length < 6) return res.status(400).send("Password too short");
  // Controller logic...
});
```

**Why it's wrong:** As your application grows, these manual checks create duplicate boilerplate code across multiple files, increasing the risk of missing edge cases or validation rules.

*Fix:* Keep controllers clean and focused. Outsource all validation checks to centralized schema files and validation middleware.

---



### Mistake 2: Trusting Client Input Without Server-Side Schema Validation (Security Vulnerability)

**The mistake:** Passing `req.body` directly to database models without schema validation.

**Why it's wrong:** Attackers can inject malicious parameters (mass assignment vulnerabilities, prototype pollution, script tags). Always validate input payload schemas on the server using Zod or Joi.

*Incorrect:*
```javascript
app.post('/user', async (req, res) => {
  await User.create(req.body); // ❌ Mass assignment security vulnerability!
});
```

*Fix:*
```javascript
const userSchema = z.object({ email: z.string().email(), name: z.string() });
app.post('/user', async (req, res) => {
  const cleanData = userSchema.parse(req.body); // Validates and strips un-allowed fields
  await User.create(cleanData);
});
```

### Mistake 3: Performing Input Validation Handlers Inside Controller Business Logic Functions

**The mistake:** Writing 50 lines of manual `if (!req.body.email) ...` checks inside every controller.

**Why it's wrong:** Manual validation boilerplate litters controller functions. Use reusable validation middleware (e.g. `validate(schema)`) executed before controllers.

*Incorrect:*
```javascript
// 50 lines of manual if/else checks inside controller function
```

*Fix:*
```javascript
app.post('/user', validate(userSchema), userController.create);
```

## 5. Practice Exercises

### Exercise 1: Schema-Based Request Body Validator Middleware

**Scenario:** Constructs a declarative schema validation middleware that validates `req.body` against required fields and data types.

**Requirements:**
1. Write validateSchema(schemaObj).
2. Validate fields.
3. Return 400 with details if validation fails.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateSchema(schemaObj = {}) {
>   return function schemaValidationMiddleware(req, res, next) {
>     const body = req.body || {};
>     const errors = [];
>
>     for (const [field, rules] of Object.entries(schemaObj)) {
>       const val = body[field];
>
>       if (rules.required && (val === undefined || val === null || val === "")) {
>         errors.push({ field, message: `'${field}' is required` });
>         continue;
>       }
>
>       if (val !== undefined && rules.type && typeof val !== rules.type) {
>         errors.push({ field, message: `'${field}' must be of type ${rules.type}` });
>       }
>     }
>
>     if (errors.length > 0) {
>       res.statusCode = 400;
>       res.setHeader("Content-Type", "application/json");
>       return res.end(JSON.stringify({ success: false, error: "VALIDATION_FAILED", details: errors }));
>     }
>
>     next();
>   };
> }
>
> // Verification tests
> const schema = {
>   name: { required: true, type: "string" },
>   age: { required: true, type: "number" }
> };
>
> const middleware = validateSchema(schema);
> let status = 0;
> const mockRes = { set statusCode(c) { status = c; }, setHeader: () => {}, end: () => {} };
>
> middleware({ body: { name: "Alice", age: "invalid" } }, mockRes, () => {});
> console.assert(status === 400, "Test 1 Failed: Returned 400 Bad Request");
> ```
>
> #### Technical Explanation
>
> 1. **Declarative Schema Validation**: Validates request payload structure prior to executing controller business logic (e.g. Zod, Joi, Ajv).
> 2. **Detailed Error Reports**: Returns array of specific field validation errors to help API consumers correct request payloads.
> 3. **HTTP 400 Bad Request**: Standard HTTP status code for client payload validation failures.
> 
---

### Exercise 2: Sanitization & XSS Input Cleaning Middleware

**Scenario:** Sanitizes string inputs in `req.body` by stripping HTML scripts and dangerous control characters to prevent Cross-Site Scripting (XSS).

**Requirements:**
1. Write sanitizeInputMiddleware(req, res, next).
2. Recursively clean string values.
3. Sanitize HTML tags.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function sanitizeString(str) {
>   if (typeof str !== "string") return str;
>   return str.replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
>             .replace(/<[^>]+>/g, ""); // Strip HTML tags
> }
>
> function sanitizeInputMiddleware(req, res, next) {
>   if (req.body && typeof req.body === "object") {
>     for (const key of Object.keys(req.body)) {
>       if (typeof req.body[key] === "string") {
>         req.body[key] = sanitizeString(req.body[key]);
>       }
>     }
>   }
>   next();
> }
>
> // Verification tests
> const mockReq = { body: { comment: "<script>alert('xss')</script>Hello <b>World</b>" } };
> sanitizeInputMiddleware(mockReq, {}, () => {});
>
> console.assert(mockReq.body.comment === "Hello World", "Test 1 Failed: Stripped HTML tags and script");
> ```
>
> #### Technical Explanation
>
> 1. **Cross-Site Scripting (XSS) Defense**: Prevents attackers from storing executable JavaScript code inside database fields.
> 2. **Input Sanitization vs Validation**: Validation rejects invalid input; Sanitization cleans and normalizes acceptable input.
> 3. **DOMPurify / sanitize-html**: Enterprise applications use specialized HTML sanitizer packages for rich text content.
> 
---

### Exercise 3: Query Parameter Type Casting & Range Validator

**Scenario:** Validates and casts URL query parameters (`?page=2&limit=50`) enforcing default fallback values and maximum boundary limits.

**Requirements:**
1. Write parsePaginationQueryParams(queryObj, maxLimit).
2. Cast page and limit to integers.
3. Enforce maxLimit cap.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parsePaginationQueryParams(queryObj = {}, maxLimit = 100) {
>   let page = parseInt(queryObj.page, 10);
>   let limit = parseInt(queryObj.limit, 10);
>
>   if (isNaN(page) || page < 1) page = 1;
>   if (isNaN(limit) || limit < 1) limit = 20;
>   if (limit > maxLimit) limit = maxLimit;
>
>   return {
>     page,
>     limit,
>     offset: (page - 1) * limit
>   };
> }
>
> // Verification tests
> console.assert(parsePaginationQueryParams({ page: "3", limit: "50" }).offset === 100, "Test 1 Failed: Offset (3-1)*50 = 100");
> console.assert(parsePaginationQueryParams({ limit: "500" }, 100).limit === 100, "Test 2 Failed: Capped limit at maxLimit 100");
> ```
>
> #### Technical Explanation
>
> 1. **Type Casting Query Strings**: HTTP URL query parameters arrive as raw strings; explicit parsing to numbers prevents NaN SQL query bugs.
> 2. **Resource Protection Boundaries**: Capping maximum `limit` values (e.g. max 100 records) prevents clients from requesting 100,000 records at once.
> 3. **Calculated Offset**: Calculates SQL offset formula `(page - 1) * limit` automatically.
## 6. Related Terms
- [Body Parsing (express.json())](../level_07/body_parsing.md) — The parser feeding data to the validation schemas.
- [SQL Injection](../level_08/sql_injection.md) — Database query vulnerabilities prevented by parameterized inputs and edge validation.

---

## 7. Key Takeaways
- Never trust data sent from the client; always validate at the server edge.
- Input validation middleware blocks invalid payloads before they consume database resources.
- Centralize validation logic using declarative schema libraries like Zod or Joi.
- Return `400 Bad Request` with structured error feedback when validation fails.
- Zod is highly popular because it supports compile-time TypeScript type inference.
- Keep controllers clean by separating validation logic into dedicated middleware.
