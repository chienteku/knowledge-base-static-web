# Routing

> **Level 7 — Web Servers & APIs**
> The mechanism of defining how an application responds to a client request to a specific Endpoint (URL path) and a specific HTTP Request Method (GET, POST, PUT, DELETE).

---

## 1. Prerequisites
- [Express.js](express_js.md) — The framework that makes Routing clean and manageable.
- [REST API Design](../level_09/rest_api.md) — The design philosophy that dictates how routes should be named.

---

## 2. Term Category

**API Architecture (Web Servers)**: Routing is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Express Router Modular Factory

**Scenario:** Constructs a modular RESTful resource router for `/users` containing CRUD route handlers.

**Requirements:**
1. Write createResourceRouter(controllerObj).
2. Bind GET, POST, PUT, DELETE endpoints.
3. Return routing table.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createResourceRouter(controllerObj = {}) {
>   const routes = [];
>
>   const register = (method, path, handlerName) => {
>     if (typeof controllerObj[handlerName] === "function") {
>       routes.push({ method, path, handler: controllerObj[handlerName] });
>     }
>   };
>
>   register("GET", "/", "list");
>   register("POST", "/", "create");
>   register("GET", "/:id", "getById");
>   register("PUT", "/:id", "update");
>   register("DELETE", "/:id", "delete");
>
>   return {
>     routes,
>     routeCount: routes.length
>   };
> }
>
> // Verification tests
> const controller = {
>   list: () => {},
>   create: () => {},
>   getById: () => {},
>   update: () => {},
>   delete: () => {}
> };
>
> const router = createResourceRouter(controller);
> console.assert(router.routeCount === 5, "Test 1 Failed: All 5 CRUD routes registered");
> ```
>
> #### Technical Explanation
>
> 1. **RESTful Routing Conventions**: Maps standard HTTP verbs (GET, POST, PUT, DELETE) to resource actions.
> 2. **Separation of Concerns**: Separates URL routing declarations from business logic controller implementations.
> 3. **Modular Router Export**: Modular routers are exported as standalone CommonJS/ESM modules.
> 
---

### Exercise 2: Regex & Wildcard Route Matcher

**Scenario:** Simulates Express wildcard (`/files/*`) and regex route matching algorithm.

**Requirements:**
1. Write matchWildcardRoute(routePattern, reqPath).
2. Support `*` wildcard matching.
3. Return match result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function matchWildcardRoute(routePattern, reqPath) {
>   if (routePattern === "*") {
>     return { matched: true, wildcardValue: reqPath };
>   }
>
>   const regexPattern = routePattern.replace(/\*/g, "(.*)");
>   const regex = new RegExp(`^${regexPattern}$`);
>   const match = reqPath.match(regex);
>
>   if (!match) {
>     return { matched: false, wildcardValue: null };
>   }
>
>   return {
>     matched: true,
>     wildcardValue: match[1] || ""
>   };
> }
>
> // Verification tests
> const r1 = matchWildcardRoute("/static/*", "/static/images/logo.png");
> console.assert(r1.matched === true, "Test 1 Failed");
> console.assert(r1.wildcardValue === "images/logo.png", "Test 2 Failed: Captured wildcard subpath");
> ```
>
> #### Technical Explanation
>
> 1. **Wildcard Routes**: Asterisks (`*`) match arbitrary path segments in route definitions.
> 2. **Catch-All Fallback Routes**: Wildcard `app.use('*')` routes registered at the end of the stack handle 404 pages.
> 3. **Regex Route Support**: Express accepts JavaScript Regular Expressions directly as route path arguments.
> 
---

### Exercise 3: RESTful Resource Routing Table

**Scenario:** Executes matching route handlers from a pre-compiled routing table for incoming HTTP requests.

**Requirements:**
1. Write dispatchRoutingTable(method, path, routingTable).
2. Match method and path.
3. Execute handler.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function dispatchRoutingTable(method, path, routingTable = []) {
>   const targetMethod = method.toUpperCase();
>
>   for (const route of routingTable) {
>     if (route.method === targetMethod && route.path === path) {
>       return { matched: true, response: route.handler() };
>     }
>   }
>
>   return { matched: false, response: null };
> }
>
> // Verification tests
> const table = [
>   { method: "GET", path: "/health", handler: () => "OK" }
> ];
>
> const res = dispatchRoutingTable("GET", "/health", table);
> console.assert(res.matched === true && res.response === "OK", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Routing Table Execution**: Internal data structure mapping HTTP method and path combinations to handler functions.
> 2. **Routing Priority**: Routes are evaluated in top-to-bottom registration order; first matching route executes.
> 3. **Overlapping Route Ordering**: Specific routes (`/users/active`) MUST be defined before parameter routes (`/users/:id`).
## 6. Related Terms
- [Middleware](middleware.md) — Middleware executes right before the Router triggers your code.
- [REST API Design](../level_09/rest_api.md) — The strict rules for naming your routes properly.
- [Express.js](express_js.md) — Related concept: Express.js.
- [The req & res Objects](req_res.md) — Related concept: The req & res Objects.
- [Route Parameters & Query Strings](route_parameters.md) — Related concept: Route Parameters & Query Strings.
- [Serving Static Files (express.static)](static_files.md) — Related concept: Serving Static Files (express.static).

---

## 7. Key Takeaways
- **Routing** directs incoming requests to the correct block of code.
- A Route is a unique combination of an **HTTP Method** (GET/POST) and a **Path** (`/users`).
- Routes are evaluated **Top-to-Bottom**. Always put specific routes above generic/dynamic routes.
- Use `express.Router()` to split massive applications into clean, separate files.
