# The req & res Objects

> **Level 7 — Web Servers & APIs**
> The two massive JavaScript objects passed into every single route and middleware function. One represents what the user sent you, and the other provides the tools to send data back.

---

## 1. Prerequisites
- [Express.js](express_js.md) — This article focuses specifically on the Express-enhanced versions of these objects.
- [JSON (JavaScript Object Notation)](../../../04-apis/terms/level_01/json.md) — How you usually send data back using `res`.

---

## 2. Term Category
- **API Core Objects**

---

## 3. Environment Context
- **Express.js Route Callbacks**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Confusing `req.query` with `req.params` in Express Routes

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

### Mistake 5: Using `res.json()` Followed by `res.send()` in Same Handler

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



### Mistake 6: Confusing `req.query` with `req.params` in Express Routes

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

### Mistake 7: Using `res.json()` Followed by `res.send()` in Same Handler

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

## 6. Practice Exercises

### Exercise 1: Extracting the Data

**Problem:** A user submits a POST request to `http://localhost:3000/api/users/99/update?force=true`.
The body of their request contains a JSON object: `{ "email": "bob@bob.com" }`.
Inside your route `app.post('/api/users/:id/update')`, how do you extract the `99`, the `true`, and the `email`?

**Expected output:**
> [!check]- Answer
> ```javascript
> app.post('/api/users/:id/update', (req, res) => {
>   const userId = req.params.id;         // 99 (From the dynamic path)
>   const isForce = req.query.force;      // "true" (From the URL query string)
>   const userEmail = req.body.email;     // "bob@bob.com" (From the JSON body)
>   
>   res.json({ success: true });
> });
> ```
> - `params` = Path variables
> - `query` = Question mark variables
> - `body` = JSON payload

---



### Exercise 2: Setting HTTP Response Status and JSON Body

**Problem:** Write Express line setting HTTP 201 Created and JSON body `{ id: 1 }`.

**Expected output:**
> [!check]- Answer
> ```text
> res.status(201).json({ id: 1 });
> ```
> ```javascript
> res.status(201).json({ id: 1 });
> ```
>
> **Explanation:** `res.status().json()` chains HTTP status and JSON response body formatting.

---

### Exercise 3: Extracting Request IP and User-Agent

**Problem:** Extract client IP address and User-Agent header from Express `req` object.

**Expected output:**
> [!check]- Answer
> ```text
> const ip = req.ip; const agent = req.get('User-Agent');
> ```
> ```javascript
> const ip = req.ip;
> const agent = req.get('User-Agent');
> ```
>
> **Explanation:** `req.ip` returns client IP; `req.get(headerName)` gets request header values.

## 7. Related Terms
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

## 8. Key Takeaways
- **`req` (Request)** contains all incoming data: `req.body` (JSON payload), `req.params` (URL paths), and `req.query` (Search queries).
- **`res` (Response)** is the toolbox to send data back: `res.json()` and `res.status()`.
- You must have the `express.json()` middleware enabled to read `req.body`.
- You can only send ONE response per request. Use `return res.json()` to avoid "Headers already sent" crashes.
