# Input Validation (joi / zod)

> **Level 9 — REST APIs & Best Practices**
> Rejecting bad payloads at the edge ("never trust the client") before they hit the DB.

---

## 1. Prerequisites
- [Body Parsing (express.json())](../level_07/body_parsing.md) — Extracting payload data into JavaScript objects.
- [HTTP Status Codes](status_codes.md) — Utilizing standard client error responses (`400 Bad Request`).

---

## 2. Term Category
- **Security / Data Validation**

---

## 3. Environment Context
- **Web App Server Layer** (Acts as an edge guard blocking invalid payloads before they enter the application logic).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Trusting Client Input Without Server-Side Schema Validation (Security Vulnerability)

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

### Mistake 5: Performing Input Validation Handlers Inside Controller Business Logic Functions

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



### Mistake 6: Trusting Client Input Without Server-Side Schema Validation (Security Vulnerability)

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

### Mistake 7: Performing Input Validation Handlers Inside Controller Business Logic Functions

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

## 6. Practice Exercises

### Exercise 1: Zod Schema Configuration

**Problem:** Complete the Zod validation schema for a new blog post. The post requires a `title` (string, minimum 3 characters) and a `category` (must be one of: 'news', 'tutorials', or 'reviews'):

```javascript
const { z } = require('zod');

// Solution Schema:
const postSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().optional(),
  category: z.enum(['news', 'tutorials', 'reviews'], {
    errorMap: () => ({ message: "Category must be news, tutorials, or reviews" })
  })
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Validating Input with Zod

**Problem:** Define Zod schema for `loginSchema` requiring valid `email` string and `password` string of min length 8.

**Expected output:**
> [!check]- Answer
> ```text
> const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
> ```
> ```javascript
> const { z } = require('zod');
> const loginSchema = z.object({
>   email: z.string().email(),
>   password: z.string().min(8)
> });
> ```
>
> **Explanation:** Zod schemas validate input types and constraints at runtime.

---

### Exercise 3: Sanitizing HTML Input

**Problem:** Which attack type is prevented by sanitizing user input against embedded `<script>` tags? (Cross-Site Scripting / XSS).

**Expected output:**
> [!check]- Answer
> ```text
> Cross-Site Scripting (XSS)
> ```
> ```text
> Cross-Site Scripting (XSS)
> ```
>
> **Explanation:** Sanitizing HTML tags prevents malicious client-side script execution.

## 7. Related Terms
- [Body Parsing (express.json())](../level_07/body_parsing.md) — The parser feeding data to the validation schemas.
- [SQL Injection](../level_08/sql_injection.md) — Database query vulnerabilities prevented by parameterized inputs and edge validation.

---

## 8. Key Takeaways
- Never trust data sent from the client; always validate at the server edge.
- Input validation middleware blocks invalid payloads before they consume database resources.
- Centralize validation logic using declarative schema libraries like Zod or Joi.
- Return `400 Bad Request` with structured error feedback when validation fails.
- Zod is highly popular because it supports compile-time TypeScript type inference.
- Keep controllers clean by separating validation logic into dedicated middleware.
