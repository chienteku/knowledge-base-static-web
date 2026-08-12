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

## 5. Practice Exercises

### Exercise 1: Dynamic Route Parameter Matcher & Extractor

**Scenario:** Parses Express-style route patterns containing parameter placeholders (`/users/:userId/orders/:orderId`) to extract parameter values from URLs.

**Requirements:**
1. Write matchAndExtractRouteParams(pattern, path).
2. Convert `:param` to regex groups.
3. Return parameter key-value object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function matchAndExtractRouteParams(pattern, path) {
>   const paramNames = [];
>   const regexPattern = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
>     paramNames.push(name);
>     return "([^/]+)";
>   });
>
>   const regex = new RegExp(`^${regexPattern}$`);
>   const match = path.match(regex);
>
>   if (!match) {
>     return { matched: false, params: {} };
>   }
>
>   const params = {};
>   paramNames.forEach((name, index) => {
>     params[name] = decodeURIComponent(match[index + 1]);
>   });
>
>   return { matched: true, params };
> }
>
> // Verification tests
> const res = matchAndExtractRouteParams("/users/:userId/orders/:orderId", "/users/42/orders/ord_999");
> console.assert(res.matched === true, "Test 1 Failed");
> console.assert(res.params.userId === "42", "Test 2 Failed");
> console.assert(res.params.orderId === "ord_999", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Route Parameters Concept**: Named URL segments defined with a colon (`:id`) used to capture values at specific path positions.
> 2. **path-to-regexp Engine**: Express uses `path-to-regexp` library under the hood to convert route patterns into regular expressions.
> 3. **req.params Object**: Express places extracted parameters onto `req.params` (e.g. `req.params.userId`).
> 
---

### Exercise 2: Route Parameter Validation Middleware

**Scenario:** An Express parameter validator middleware verifies route parameter types (e.g. `:id` must be integer) before executing controller logic.

**Requirements:**
1. Write validateParamIntMiddleware(paramName).
2. Verify `req.params[paramName]` is numeric.
3. Return 400 Bad Request if validation fails.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateParamIntMiddleware(paramName) {
>   return function (req, res, next) {
>     const rawVal = req.params?.[paramName];
>     const isInteger = /^\d+$/.test(rawVal || "");
>
>     if (!isInteger) {
>       res.statusCode = 400;
>       return res.end(JSON.stringify({ error: `INVALID_PARAMETER: '${paramName}' must be an integer` }));
>     }
>
>     req.params[paramName] = parseInt(rawVal, 10);
>     next();
>   };
> }
>
> // Verification tests
> let status = 0;
> const mockRes = { setHeader: () => {}, end: () => {}, set statusCode(c) { status = c; } };
>
> const middleware = validateParamIntMiddleware("userId");
> const reqOk = { params: { userId: "42" } };
>
> middleware(reqOk, mockRes, () => {});
> console.assert(reqOk.params.userId === 42, "Test 1 Failed: Converted to integer");
>
> const reqBad = { params: { userId: "abc" } };
> middleware(reqBad, mockRes, () => {});
> console.assert(status === 400, "Test 2 Failed: Returned 400 for non-integer");
> ```
>
> #### Technical Explanation
>
> 1. **Input Validation Shift-Left**: Validating parameter types at the middleware layer prevents database query errors downstream.
> 2. **Type Conversion**: Converts string URL params into native numbers or UUIDs before reaching controllers.
> 3. **400 Bad Request**: Standard HTTP status code returned for client input validation failures.
> 
---

### Exercise 3: Express router.param() Parameter Pre-loader

**Scenario:** Simulates Express `router.param(name, callback)` pattern to automatically load entity models from the database when a parameter is present in the route.

**Requirements:**
1. Write registerParamPreloader(paramName, fetchEntityFn).
2. Execute fetchEntityFn.
3. Attach entity to `req[entityName]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createParamPreloader(paramName, fetchEntityFn) {
>   return async function paramPreloadMiddleware(req, res, next) {
>     const paramVal = req.params?.[paramName];
>     if (!paramVal) return next();
>
>     try {
>       const entity = await fetchEntityFn(paramVal);
>       if (!entity) {
>         res.statusCode = 404;
>         return res.end(JSON.stringify({ error: `${paramName} NOT_FOUND` }));
>       }
>       req[paramName] = entity;
>       next();
>     } catch (err) {
>       next(err);
>     }
>   };
> }
>
> // Verification tests
> const fetchUser = async (id) => id === "42" ? { id: 42, name: "Alice" } : null;
> const preloader = createParamPreloader("user", fetchUser);
>
> const mockReq = { params: { user: "42" } };
> preloader(mockReq, {}, () => {}).then(() => {
>   console.assert(mockReq.user.name === "Alice", "Test 1 Failed: Entity attached to req.user");
> });
> ```
>
> #### Technical Explanation
>
> 1. **router.param() Pattern**: Triggers automatic pre-loading logic whenever a route contains a specified parameter.
> 2. **DRY Controller Logic**: Eliminates repeating entity database lookup code across multiple HTTP route handlers.
> 3. **Automatic 404 Handling**: If pre-loaded entity is not found in database, middleware triggers 404 response automatically.
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
