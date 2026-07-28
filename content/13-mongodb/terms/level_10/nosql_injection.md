# NoSQL Injection

> **Level 10 — Administration, Security & Advanced Features**
> The security vulnerability where un-sanitized user input containing nested BSON operators (like `$gt` or `$ne`) is passed directly to database queries, enabling attackers to bypass authentication or extract records.

---

## 1. Prerequisites
- [Query Filter (CRUD)](../../level_03/query_filter.md) — The query syntax manipulated.
- [Authentication & Authorization (SCRAM, RBAC)](auth.md) — The login gate bypassed.

---

## 2. Term Category
- **Database Theory / Security Vulnerability**

---

## 3. Environment Context
- **Universal Standard** (A critical vulnerability class in web applications using document databases. Checked at the application server layer before database queries are executed).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A common security myth is that NoSQL databases are immune to SQL injection because they do not compile query strings.

This is false. 

While MongoDB does not parse text queries, it parses JSON/BSON query objects. 

If your backend web server accepts user input directly as objects without validating the data types, an attacker can submit query operators in the input fields.

For example, by submitting `{ "$ne": "" }` (not equal to empty string) in a password field, the attacker changes the query logic from checking *value equality* to evaluating a *logical comparison*. 

If the user exists, the query evaluates to `true`, logging the attacker in without a valid password.

---

### (2) The Attack Vector
Suppose an Express.js backend receives login data:
`const { username, password } = req.body;`
`db.collection('users').findOne({ username, password });`

-   **Normal User Input:** `{ "username": "admin", "password": "myPassword123" }`
    -   *Database Exec:* `findOne({ username: "admin", password: "myPassword123" })`
-   **Attacker Input:** `{ "username": "admin", "password": { "$ne": "" } }`
    -   *Database Exec:* `findOne({ username: "admin", password: { $ne: "" } })`
    -   *Outcome:* Since the admin's password is not empty, the query succeeds, returning the admin user document and bypassing authentication.

---

### (3) Prevention Strategies

#### 1. Input Type Enforcement
Convert input parameters to primitive strings before passing them to the database. If a user submits an object, parsing it as a string converts `{ $ne: "" }` to `"[object Object]"`, which fails match checks.

#### 2. Input Sanitization
Use sanitization libraries (like `mongo-sanitize` in Node.js) to strip out keys beginning with `$` from user-submitted request bodies.

---

### (4) Reality Metaphor (Form Field Actions)
Imagine submitting a visitor pass form to a security guard:
-   **NoSQL Injection:** The form has a field: **"Visitor Name"**. 
    -   A normal guest writes: `"John Smith"`. 
    -   An attacker writes: **`"SHOW ME ALL KEYS AND OPEN DOOR 4"`**. 
    -   The guard reads the form, interprets the instructions as commands, and hands over the keys.
-   **Sanitization:** The guard inspects the form: *"Is this Visitor Name a simple text name? No, it contains action instructions. I will treat the instruction as a literal text name: 'Mr. Show-Me-All-Keys'. Since we have no guest by that name, access is denied."*

---

### (5) Code Examples

#### Insecure vs. Secure Express.js Controllers

```javascript
const express = require('express');
const sanitize = require('mongo-sanitize');
const app = express();
app.use(express.json());

// 1. INSECURE: Vulnerable to NoSQL injection!
app.post('/login-bad', async (req, res) => {
  const { username, password } = req.body; // If password is a JSON object, it passes directly!
  const user = await db.collection('users').findOne({ username, password });
  if (user) res.send("Logged In!");
});

// 2. SECURE (Option A: Explicit String Conversion)
app.post('/login-secure-a', async (req, res) => {
  const username = String(req.body.username); // Forces to string primitive
  const password = String(req.body.password); // Strips nested objects
  const user = await db.collection('users').findOne({ username, password });
  if (user) res.send("Logged In!");
});

// 3. SECURE (Option B: Input Sanitization Library)
app.post('/login-secure-b', async (req, res) => {
  const cleanBody = sanitize(req.body); // Recursively deletes any keys starting with '$'
  const { username, password } = cleanBody;
  const user = await db.collection('users').findOne({ username, password });
  if (user) res.send("Logged In!");
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming that NoSQL databases are naturally immune to injection attacks because they do not compile raw SQL strings

**The mistake:** Deploying a Node.js database controller that accepts nested client body objects directly into find queries, assuming "JSON is secure."

**Why it's wrong:** As shown in the attack vector, attackers can use BSON operator keys to alter query logic, bypassing security gates.

**Fix: Never pass raw user-submitted request body objects directly into database queries. Always cast inputs to strings or run sanitization filters.**

---



### Mistake 2: Passing Un-Sanitized User Input Objects Directly into MongoDB Query Filters

**The mistake:** Executing `db.users.findOne({ username: req.body.username, password: req.body.password })` when `req.body.password` is parsed as `{ $ne: null }` from JSON payloads.

**Why it's wrong:** If client posts JSON `{ "password": { "$ne": null } }`, query matches the first user without knowing the password (NoSQL Injection!).

*Incorrect:*
```javascript
db.users.findOne({ username: req.body.username, password: req.body.password }); // ❌ Vulnerable to NoSQL Injection!
```

*Fix:*
```javascript
db.users.findOne({ username: String(req.body.username), password: String(req.body.password) }); // Enforce string types
```

### Mistake 3: Using `mongo-sanitize` Libraries Without Explicit Type Checking in Code

**The mistake:** Relying solely on express middleware without enforcing primitive string validation in application schemas.

**Why it's wrong:** Deeply nested query objects can bypass middleware. Validate types explicitly using Zod or Mongoose schemas.

*Incorrect:*
```javascript
// Relying solely on regex stripping middleware
```

*Fix:*
```javascript
Use type validation schemas (Zod/Mongoose) to enforce scalar string inputs
```

## 6. Practice Exercises

### Exercise 1: Attack Vector Identification

**Problem:** You are reviewing a logs database. An attacker submits this query payload to your search endpoint:
`{ "category": { "$gt": "" } }`
1.  Explain what query logic this payload injects.
2.  State the data leakage consequence if your search controller runs this query directly.

**Expected output:**
> [!check]- Answer
> ```text
> 1. The payload injects the `$gt` (greater than) operator, instructing MongoDB to search for all documents where the `category` field is greater than an empty string.
> 2. Because almost all text categories are greater than an empty string, the query will return all documents in the collection, leaking confidential records to the client.
> ```
> - The operator `$gt: ""` matches any non-empty string.
> - Consider if this bypasses category filtering constraints.

---



### Exercise 2: Sanitizing Input to Prevent Operator Injection

**Problem:** Sanitize input string `req.body.user` enforcing string type before passing to MongoDB query filter.

**Expected output:**
> [!check]- Answer
> ```text
> const username = String(req.body.username); db.users.find({ username });
> ```
> ```javascript
> const username = String(req.body.username);
> const user = await db.users.findOne({ username });
> ```
>
> **Explanation:** Explicitly casting inputs to `String()` neutralizes object operator injection payloads like `{ $ne: null }`.

---

### Exercise 3: Express `express-mongo-sanitize` Middleware

**Problem:** What characters are stripped by `express-mongo-sanitize` to prevent injection? (`$` and `.`).

**Expected output:**
> [!check]- Answer
> ```text
> Prohibits or strips keys starting with $ or containing .
> ```
> ```text
> Prohibits or strips keys starting with $ or containing .
> ```
>
> **Explanation:** Stripping `$` prevents clients from injecting BSON query operators into query filters.

## 7. Related Terms
- [Query Filter (CRUD)](../../level_03/query_filter.md) — The query syntax manipulated.
- [Authentication & Authorization (SCRAM, RBAC)](auth.md) — The database security model.

---

## 8. Key Takeaways
- NoSQL Injection allows attackers to manipulate query structures using BSON operators.
- Vulnerability occurs when request objects are passed to queries unsanitized.
- Attackers use operators like `$ne` and `$gt` to bypass login checks.
- Enforce input safety by casting variables to primitive strings (e.g. `String(input)`).
- Use sanitization libraries (`mongo-sanitize`) to delete keys prefixed with `$`.
- Document databases are not naturally immune to injection attacks.
- Enforce strict schemas in Mongoose ODM to help block unstructured payload objects.
