# Routing

> **Level 7 — Web Servers & APIs**
> The mechanism of defining how an application responds to a client request to a specific Endpoint (URL path) and a specific HTTP Request Method (GET, POST, PUT, DELETE).

---

## 1. Prerequisites
- [Express.js](express_js.md) — The framework that makes Routing clean and manageable.
- [REST API Design](../level_09/rest_api.md) — The design philosophy that dictates how routes should be named.

---

## 2. Term Category
- **API Architecture**

---

## 3. Environment Context
- **Web Servers**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a server only had one job (like returning the current time), you wouldn't need routing. Any request to the server would return the time.
But modern applications are massive. A single server handles registering users, logging in, fetching products, creating orders, and deleting comments. 
**Routing** is the system of organizing the server like a massive office building with thousands of doors. The router looks at the URL (the door number) and the Method (the type of knock), and directs the user to the correct piece of code inside the server.

### (2) The Two Halves of a Route
A Route is defined by a combination of two things:
1. **The HTTP Method:** Represents the *Action* (GET = Read, POST = Create, DELETE = Destroy).
2. **The Path (URL):** Represents the *Resource* (`/users`, `/products/12`).

```javascript
// Route 1: Read all users
app.get('/users', (req, res) => { /* ... */ });

// Route 2: Create a new user
app.post('/users', (req, res) => { /* ... */ });

// Route 3: Delete a specific user
app.delete('/users/12', (req, res) => { /* ... */ });
```
Notice that Route 1 and Route 2 have the exact same Path (`/users`), but because the Methods are different (`GET` vs `POST`), the Router treats them as completely separate doors!

### (3) The Express Router
If you put 500 routes inside `server.js`, the file becomes an unreadable nightmare.
Express provides the `express.Router()` class, which allows you to split your routes into separate files. You can create a `userRoutes.js` file, define all the user routes, and import them into `server.js` as one clean block.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Route Order (The "Catch-All" Trap)

**The mistake:** A developer writes a dynamic route for fetching users by ID, and *then* writes a route for the admin panel:
```javascript
app.get('/users/:id', getUserById);
app.get('/users/admin', getAdminPanel);
```
When they visit `/users/admin`, the server crashes trying to look up a user with the ID of "admin".

**Why it's wrong:** Express reads routes **top-to-bottom**. When the request for `/users/admin` arrives, it hits the `:id` route first. Express thinks "admin" is a dynamic ID, triggers `getUserById("admin")`, and never reaches the actual admin panel route!
**Golden Rule:** Always put your specific, static routes (`/users/admin`) ABOVE your generic, dynamic routes (`/users/:id`).

---



### Mistake 2: Placing Catch-All 404 Route Handlers Above Specific API Routes

**The mistake:** Mounting `app.use('*', notFoundHandler)` at top of script file.

**Why it's wrong:** Express evaluates routes top-to-bottom. Placing a wildcard 404 handler at the top intercepts all incoming HTTP requests before specific API handlers are evaluated.

*Incorrect:*
```javascript
app.use('*', (req, res) => res.status(404).send('Not Found')); // ❌ Intercepts all routes!
app.get('/api/users', ...);
```

*Fix:*
```javascript
app.get('/api/users', ...); // Specific routes first
app.use('*', (req, res) => res.status(404).send('Not Found')); // 404 fallback LAST
```

### Mistake 3: Failing to Modularize Routes via `express.Router()` in Large Apps

**The mistake:** Writing 500 route handlers directly on a single global `app` object inside `server.js`.

**Why it's wrong:** Monolithic route files become unmaintainable. Group related resource routes using `express.Router()` into modular controller files.

*Incorrect:*
```javascript
// 500 lines of app.get(), app.post() in server.js
```

*Fix:*
```javascript
// routes/users.js:
const router = express.Router();
router.get('/', getUsers);
module.exports = router;
// server.js:
app.use('/users', userRouter);
```



### Mistake 4: Placing Catch-All 404 Route Handlers Above Specific API Routes

**The mistake:** Mounting `app.use('*', notFoundHandler)` at top of script file.

**Why it's wrong:** Express evaluates routes top-to-bottom. Placing a wildcard 404 handler at the top intercepts all incoming HTTP requests before specific API handlers are evaluated.

*Incorrect:*
```javascript
app.use('*', (req, res) => res.status(404).send('Not Found')); // ❌ Intercepts all routes!
app.get('/api/users', ...);
```

*Fix:*
```javascript
app.get('/api/users', ...); // Specific routes first
app.use('*', (req, res) => res.status(404).send('Not Found')); // 404 fallback LAST
```

### Mistake 5: Failing to Modularize Routes via `express.Router()` in Large Apps

**The mistake:** Writing 500 route handlers directly on a single global `app` object inside `server.js`.

**Why it's wrong:** Monolithic route files become unmaintainable. Group related resource routes using `express.Router()` into modular controller files.

*Incorrect:*
```javascript
// 500 lines of app.get(), app.post() in server.js
```

*Fix:*
```javascript
// routes/users.js:
const router = express.Router();
router.get('/', getUsers);
module.exports = router;
// server.js:
app.use('/users', userRouter);
```



### Mistake 6: Placing Catch-All 404 Route Handlers Above Specific API Routes

**The mistake:** Mounting `app.use('*', notFoundHandler)` at top of script file.

**Why it's wrong:** Express evaluates routes top-to-bottom. Placing a wildcard 404 handler at the top intercepts all incoming HTTP requests before specific API handlers are evaluated.

*Incorrect:*
```javascript
app.use('*', (req, res) => res.status(404).send('Not Found')); // ❌ Intercepts all routes!
app.get('/api/users', ...);
```

*Fix:*
```javascript
app.get('/api/users', ...); // Specific routes first
app.use('*', (req, res) => res.status(404).send('Not Found')); // 404 fallback LAST
```

### Mistake 7: Failing to Modularize Routes via `express.Router()` in Large Apps

**The mistake:** Writing 500 route handlers directly on a single global `app` object inside `server.js`.

**Why it's wrong:** Monolithic route files become unmaintainable. Group related resource routes using `express.Router()` into modular controller files.

*Incorrect:*
```javascript
// 500 lines of app.get(), app.post() in server.js
```

*Fix:*
```javascript
// routes/users.js:
const router = express.Router();
router.get('/', getUsers);
module.exports = router;
// server.js:
app.use('/users', userRouter);
```

## 6. Practice Exercises

### Exercise 1: The Express Router

**Problem:** You want to move all your Product routes into a separate file called `productRoutes.js` so they all automatically start with `/products`. How do you export the router from the file, and how do you connect it in `server.js`?

**Expected output:**
> [!check]- Answer
> ```javascript
> // --- productRoutes.js ---
> const express = require('express');
> const router = express.Router();
> 
> // This automatically becomes /products/list
> router.get('/list', (req, res) => res.send("List of products")); 
> 
> module.exports = router;
> 
> // --- server.js ---
> const productRoutes = require('./productRoutes');
> 
> // Mount the router! Any request starting with /products goes to that file.
> app.use('/products', productRoutes); 
> ```
> - Create `express.Router()`. 
> - Use `app.use()` to mount it to a specific base path.
> 
---



### Exercise 2: Creating Modular Router File

**Problem:** Create modular `express.Router()` instance for `/products` export.

**Expected output:**
> [!check]- Answer
> ```text
> const router = express.Router(); router.get('/', getProducts); module.exports = router;
> ```
> ```javascript
> const express = require('express');
> const router = express.Router();
> router.get('/', (req, res) => res.send('Products list'));
> module.exports = router;
> ```
>
> **Explanation:** `express.Router()` creates isolated modular route handler modules.
> 
---

### Exercise 3: Chaining HTTP Route Methods

**Problem:** Chain `get`, `post`, `delete` handlers on path `'/api/items'` using `app.route()`.

**Expected output:**
> [!check]- Answer
> ```text
> app.route('/api/items').get(getItems).post(createItem).delete(deleteItem);
> ```
> ```javascript
> app.route('/api/items')
>   .get((req, res) => res.send('Get'))
>   .post((req, res) => res.send('Post'))
>   .delete((req, res) => res.send('Delete'));
> ```
>
> **Explanation:** `app.route()` avoids duplicate path definitions for multi-method endpoints.
> 
## 7. Related Terms
- [Middleware](middleware.md) — Middleware executes right before the Router triggers your code.
- [REST API Design](../level_09/rest_api.md) — The strict rules for naming your routes properly.
- [Express.js](express_js.md) — Related concept: Express.js.
- [The req & res Objects](req_res.md) — Related concept: The req & res Objects.
- [Route Parameters & Query Strings](route_parameters.md) — Related concept: Route Parameters & Query Strings.
- [Serving Static Files (express.static)](static_files.md) — Related concept: Serving Static Files (express.static).

---

## 8. Key Takeaways
- **Routing** directs incoming requests to the correct block of code.
- A Route is a unique combination of an **HTTP Method** (GET/POST) and a **Path** (`/users`).
- Routes are evaluated **Top-to-Bottom**. Always put specific routes above generic/dynamic routes.
- Use `express.Router()` to split massive applications into clean, separate files.
