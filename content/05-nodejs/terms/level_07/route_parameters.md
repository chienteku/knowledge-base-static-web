# Route Parameters & Query Strings

> **Level 7 — Web Servers & APIs**
> `req.params` vs `req.query` — the two ways routes receive input.

---

## 1. Prerequisites
- [Routing](routing.md) — Defining the matching pathways.
- [The req & res Objects](req_res.md) — The incoming request wrappers housing parameters.

---

## 2. Term Category

**Third-Party Framework Concept (Express.js) (Web App Server Layer .)**: Route Parameters & Query Strings is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Web servers need to capture input data sent by clients. While large payloads are sent in the HTTP request body, short identifiers, filters, and searches are usually embedded directly in the request URL.

Express parses these URL inputs into two distinct objects on the request:

#### 1. Route Parameters (`req.params`)
-   **Behavior:** Captures variables embedded directly inside the URL path structure.
-   **Declaration:** Indicated in the route pattern using a colon prefix (`:paramName`).
-   **Example Route:** `app.get('/users/:userId/books/:bookId', ...)`
-   **Example URL:** `/users/99/books/240`
-   **Resulting Object:** `req.params` evaluates to `{ userId: '99', bookId: '240' }`
-   **Semantic Intent:** Identifies a specific resource hierarchically.

#### 2. Query Strings (`req.query`)
-   **Behavior:** Captures optional key-value filters appended to the end of the URL starting with a question mark (`?`).
-   **Example Route:** `app.get('/users', ...)`
-   **Example URL:** `/users?role=admin&limit=10`
-   **Resulting Object:** `req.query` evaluates to `{ role: 'admin', limit: '10' }`
-   **Semantic Intent:** Filters, sorts, limits, or searches a list of resources.

---

### (2) Reality Metaphor
Imagine a company's physical filing system.
- **Route Parameters (`req.params`)** represent the **labeled cabinet drawers**. To find an employee's profile, you go to the cabinet labeled `/department/engineering/employee/42`. Each parameter is a physical level in the filing cabinet's structure.
- **Query Strings (`req.query`)** represent a **post-it note filter**. You pull out the entire stack of files from a drawer and stick a note on top saying: *"Only show active folders, sorted by date of hire."* You did not create a new drawer called "Active"; you applied a temporary filter to the files.

---

### (3) Express Implementation Example

An example endpoint illustrating both inputs:

```javascript
const express = require('express');
const app = express();

// 1. Route Parameters Example: Fetching a single user
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id; // Route Parameter
  res.json({ message: `Fetching user details for ID: ${userId}` });
});

// 2. Query Strings Example: Filtering users list
app.get('/api/users', (req, res) => {
  const { role, limit } = req.query; // Query Strings
  res.json({
    message: "Fetching users list",
    filters: {
      role: role || 'any',
      limit: parseInt(limit, 10) || 20
    }
  });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating route parameters and query strings as Numbers

**The mistake:** Comparing `req.params.id` directly with a numeric database ID using strict equality (`===`):

```javascript
const users = [{ id: 1, name: 'Alice' }];

app.get('/users/:id', (req, res) => {
  // WRONG: req.params.id is the string "1", but user.id is the number 1!
  const user = users.find(u => u.id === req.params.id); 
  
  if (!user) return res.status(404).send('User not found'); // Unexpectedly triggers!
  res.json(user);
});
```

**Why it's wrong:** URL parsing engines parse all URL tokens as **Strings**. If you pass `123` in a URL parameter or query string, Node interprets it as `"123"`. Direct strict comparisons against numbers will fail silently.

*Fix:* Cast parameters to numbers before running strict comparisons:
```javascript
const userId = Number(req.params.id);
const user = users.find(u => u.id === userId);
```

---



### Mistake 2: Assuming Route Parameters Are Automatically Cast to Numbers

**The mistake:** Using strict equality `if (req.params.id === 42)` on route `/users/:id`.

**Why it's wrong:** Route parameters in `req.params` are ALWAYS string types (e.g. `'42'`). Strict equality with number `42` evaluates to `false`.

*Incorrect:*
```javascript
app.get('/users/:id', (req, res) => {
  if (req.params.id === 42) {} // ❌ false! '42' !== 42!
});
```

*Fix:*
```javascript
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === 42) {}
});
```

### Mistake 3: Overlooking Route Parameter Specificity Order (Route Shadowing)

**The mistake:** Registering generic route `app.get('/users/:id')` BEFORE specific route `app.get('/users/active')`.

**Why it's wrong:** Express matches routes in order of registration. A request to `/users/active` will match `/users/:id` with `req.params.id = 'active'`, shadowing the specific handler.

*Incorrect:*
```javascript
app.get('/users/:id', ...); // Shadowing route!
app.get('/users/active', ...); // ❌ Never reached for /users/active!
```

*Fix:*
```javascript
app.get('/users/active', ...); // Specific routes first
app.get('/users/:id', ...); // Generic param routes after
```



### Mistake 4: Assuming Route Parameters Are Automatically Cast to Numbers

**The mistake:** Using strict equality `if (req.params.id === 42)` on route `/users/:id`.

**Why it's wrong:** Route parameters in `req.params` are ALWAYS string types (e.g. `'42'`). Strict equality with number `42` evaluates to `false`.

*Incorrect:*
```javascript
app.get('/users/:id', (req, res) => {
  if (req.params.id === 42) {} // ❌ false! '42' !== 42!
});
```

*Fix:*
```javascript
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === 42) {}
});
```

### Mistake 5: Overlooking Route Parameter Specificity Order (Route Shadowing)

**The mistake:** Registering generic route `app.get('/users/:id')` BEFORE specific route `app.get('/users/active')`.

**Why it's wrong:** Express matches routes in order of registration. A request to `/users/active` will match `/users/:id` with `req.params.id = 'active'`, shadowing the specific handler.

*Incorrect:*
```javascript
app.get('/users/:id', ...); // Shadowing route!
app.get('/users/active', ...); // ❌ Never reached for /users/active!
```

*Fix:*
```javascript
app.get('/users/active', ...); // Specific routes first
app.get('/users/:id', ...); // Generic param routes after
```



### Mistake 6: Assuming Route Parameters Are Automatically Cast to Numbers

**The mistake:** Using strict equality `if (req.params.id === 42)` on route `/users/:id`.

**Why it's wrong:** Route parameters in `req.params` are ALWAYS string types (e.g. `'42'`). Strict equality with number `42` evaluates to `false`.

*Incorrect:*
```javascript
app.get('/users/:id', (req, res) => {
  if (req.params.id === 42) {} // ❌ false! '42' !== 42!
});
```

*Fix:*
```javascript
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === 42) {}
});
```

### Mistake 7: Overlooking Route Parameter Specificity Order (Route Shadowing)

**The mistake:** Registering generic route `app.get('/users/:id')` BEFORE specific route `app.get('/users/active')`.

**Why it's wrong:** Express matches routes in order of registration. A request to `/users/active` will match `/users/:id` with `req.params.id = 'active'`, shadowing the specific handler.

*Incorrect:*
```javascript
app.get('/users/:id', ...); // Shadowing route!
app.get('/users/active', ...); // ❌ Never reached for /users/active!
```

*Fix:*
```javascript
app.get('/users/active', ...); // Specific routes first
app.get('/users/:id', ...); // Generic param routes after
```

## 5. Practice Exercises

### Exercise 1: URL Parameters Extraction

**Problem:** Complete the route handler below to return a message containing the parameters and query parameters:
- **Target URL:** `/api/products/laptop?color=blue&discount=true`

```javascript
// Route configuration:
app.get('/api/products/:category', (req, res) => {
  const category = req.params.category;
  const { color, discount } = req.query;

  res.json({
    category,
    color,
    discount: discount === 'true' // Convert string to boolean
  });
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Defining Multi-Param Route Path

**Problem:** Define Express route path matching `/books/category/science/id/101` extracting `category` and `bookId`.

**Expected output:**
> [!check]- Answer
> ```text
> app.get('/books/category/:category/id/:bookId', (req, res) => { ... });
> ```
> ```javascript
> app.get('/books/category/:category/id/:bookId', (req, res) => {
>   const { category, bookId } = req.params;
>   res.send(`Category: ${category}, ID: ${bookId}`);
> });
> ```
>
> **Explanation:** Colons (`:name`) define named path parameter placeholders in Express route definitions.
> 
---

### Exercise 3: Optional Route Parameters

**Problem:** Write route path for `/posts/:id?` making `id` optional.

**Expected output:**
> [!check]- Answer
> ```text
> app.get('/posts/:id?', (req, res) => { ... });
> ```
> ```javascript
> app.get('/posts/:id?', (req, res) => {
>   const id = req.params.id;
> });
> ```
>
> **Explanation:** Question mark (`:id?`) designates optional route parameters.
> 
## 6. Related Terms
- [Routing](routing.md) — The routing system matching URL structures.
- [The req & res Objects](req_res.md) — The HTTP wrapper structures holding incoming parameters.

---

## 7. Key Takeaways
- Route parameters (`req.params`) match named URL segments prefixed with a colon.
- Query strings (`req.query`) capture key-value filters appended after the `?` in a URL.
- Use route parameters for hierarchical resources; use query strings for filters, sorting, and pagination.
- Express parses all URL inputs as string types.
- Always convert parameters to numbers (using `parseInt` or `Number`) before comparing them to numeric IDs.
