# Controllers & Services

> **Level 9 — REST APIs & Best Practices**
> Splitting route handlers (controllers) from business logic (services).

---

## 1. Prerequisites
- [MVC Pattern (Model–View–Controller)](mvc_pattern.md) — The folder layout organizing data and logic.
- [Routing](../level_07/routing.md) — Directing URL endpoints to code handlers.

---

## 2. Term Category

**Architecture / Design Pattern (Web App Server Layer .)**: Controllers & Services is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In a basic MVC architecture, controllers handle HTTP requests and execute database queries directly using the Model.

However, as applications scale, this coupling presents a challenge. Imagine you need to process a product checkout. This involves checking stock, deducting inventory, creating an invoice, and sending a receipt email. If this logic is written directly inside the controller, it is tied to Express `req` and `res` objects. 

If you later need to execute the same checkout logic from a **background cron job** or a **command-line script**, you cannot reuse the controller code without creating mock `req` and `res` objects.

To solve this, developers split the application logic into **Controllers** and **Services**:

#### 1. Controllers (HTTP Protocol Layer)
-   **Responsibility:** Handles HTTP details. It extracts parameters from `req.params` or `req.query`, validates the request format, and sends responses with appropriate status codes (`res.status()`).
-   **Rule:** Controllers should **never** talk to the database directly or perform complex business calculations.

#### 2. Services (Business Logic Layer)
-   **Responsibility:** Standard JavaScript classes or functions that perform core business tasks (e.g. database writes, calculating invoice totals, calling payment APIs).
-   **Rule:** Services are **completely decoupled from HTTP**. They do not accept `req` or `res` objects. They take clean parameters (like strings or objects) and return standard values or Promises. This allows them to be executed from anywhere (API routers, cron queues, testing suites).

---

### (2) Reality Metaphor
Imagine a fast-food restaurant.
- **The Controller (The Drive-Thru Cashier):** Interacts with the customer at the window. They take orders (**HTTP Requests**), handle credit cards, print receipts (**HTTP responses**), and speak through the microphone. However, the cashier does not cook the food.
- **The Service (The Kitchen Grill Chef):** Stands at the grill. They only know how to cook a burger when given an order slip (**arguments**). The chef does not know if the customer is at the drive-thru, dining in, or ordering via an app (**decoupled from HTTP**). If the manager needs a burger for a quality test (**cron job/test script**), they request it directly from the chef, bypassing the cashier window entirely.

---

### (3) JavaScript Implementation Example

#### 1. The Decoupled Service (`services/userService.js`)
*Contains pure business logic and database queries. No Express references.*
```javascript
const User = require('../models/User');

exports.registerUser = async (email, rawPassword) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered'); // Throw clean error
  }

  // 2. Hash password and save (simulated)
  const newUser = new User({ email, password: rawPassword });
  return await newUser.save();
};
```

#### 2. The Controller (`controllers/userController.js`)
*Bridges HTTP requests to the UserService.*
```javascript
const userService = require('../services/userService');

exports.postRegister = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Call service passing raw data arguments
    const user = await userService.registerUser(email, password);
    
    // Respond with HTTP details
    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    // If database or validation error is thrown in service, catch and route it
    if (err.message === 'Email already registered') {
      return res.status(409).send(err.message);
    }
    return next(err);
  }
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing the Express `req` or `res` objects directly into a service function

**The mistake:** Passing the entire `req` or `res` object as an argument to a service function:

```javascript
// BAD: Service is now tightly coupled to Express HTTP!
const user = await userService.updateProfile(req); 
```

**Why it's wrong:** If a service function queries `req.body` or calls `res.send()`, it cannot be executed without an active Express HTTP lifecycle context. You cannot test this service in isolation or execute it from a scheduled task runner script without mocking the entire Express request structure.

*Fix:* Extract the required parameters inside the controller first, and pass only those values to the service:
```javascript
// GOOD: Service only receives the clean data it needs
const { userId } = req.params;
const { profileData } = req.body;
const user = await userService.updateProfile(userId, profileData);
```

---



### Mistake 2: Writing Heavy Business Logic and Database Queries Directly Inside Controller Route Functions ('Fat Controllers')

**The mistake:** Writing 300 lines of database queries, email sending, and payment processing directly in Express controller functions.

**Why it's wrong:** Fat controllers violate Single Responsibility Principle. They are impossible to unit test without mocking Express `req`/`res` objects. Move business logic into reusable Service classes.

*Incorrect:*
```javascript
exports.register = async (req, res) => {
  // 300 lines of validation, db insert, payment processing, email sending... ❌
};
```

*Fix:*
```javascript
exports.register = async (req, res, next) => {
  try {
    const user = await UserService.registerUser(req.body); // Service handles business logic
    res.status(201).json(user);
  } catch (err) { next(err); }
};
```

### Mistake 3: Passing Express `req` and `res` Objects Down into Service Layer Functions

**The mistake:** Passing `UserService.createUser(req, res)` down to business service layers.

**Why it's wrong:** Service layers should be pure, framework-agnostic JavaScript. Passing Express `req`/`res` tightly couples business logic to Express HTTP frameworks, preventing reuse in CLI or queue workers.

*Incorrect:*
```javascript
await UserService.createUser(req, res); // ❌ Couples service to Express HTTP!
```

*Fix:*
```javascript
await UserService.createUser(req.body); // Pass plain JS payload data
```

## 5. Practice Exercises

### Exercise 1: Controller-Service-Repository Layer Architecture Separator

**Scenario:** Separates HTTP request handling (Controller), business logic (Service), and database access (Repository) into distinct decoupled layers.

**Requirements:**
1. Write createUserRepository(dbMock).
2. Write createUserService(userRepo).
3. Write createUserController(userService).
4. Verify strict separation of concerns.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createUserRepository(dbMock) {
>   return {
>     save: async (user) => dbMock.insert("users", user),
>     findByEmail: async (email) => dbMock.find("users", { email })
>   };
> }
>
> function createUserService(userRepo) {
>   return {
>     async registerUser(name, email) {
>       const existing = await userRepo.findByEmail(email);
>       if (existing) {
>         throw new Error("EMAIL_ALREADY_EXISTS");
>       }
>       const newUser = { id: Date.now(), name, email: email.toLowerCase() };
>       return await userRepo.save(newUser);
>     }
>   };
> }
>
> function createUserController(userService) {
>   return {
>     async handleRegister(req, res) {
>       try {
>         const { name, email } = req.body || {};
>         const user = await userService.registerUser(name, email);
>         res.statusCode = 201;
>         res.end(JSON.stringify({ success: true, user }));
>       } catch (err) {
>         res.statusCode = err.message === "EMAIL_ALREADY_EXISTS" ? 409 : 400;
>         res.end(JSON.stringify({ success: false, error: err.message }));
>       }
>     }
>   };
> }
>
> // Verification tests
> const dbStore = [];
> const mockDb = {
>   insert: async (t, d) => { dbStore.push(d); return d; },
>   find: async (t, q) => dbStore.find(u => u.email === q.email) || null
> };
>
> const repo = createUserRepository(mockDb);
> const service = createUserService(repo);
> const controller = createUserController(service);
>
> let status = 0;
> const mockRes = { set statusCode(c) { status = c; }, end: () => {} };
>
> controller.handleRegister({ body: { name: "Alice", email: "ALICE@TEST.COM" } }, mockRes).then(() => {
>   console.assert(status === 201, "Test 1 Failed: HTTP status 201 Created");
>   console.assert(dbStore[0].email === "alice@test.com", "Test 2 Failed: Service sanitized email");
> });
> ```
>
> #### Technical Explanation
>
> 1. **3-Tier Layered Architecture**: Separates concerns into Presentation (Controller), Domain (Service), and Persistence (Repository).
> 2. **Controller Responsibility**: Controllers only parse HTTP requests (`req.body`), invoke service methods, and set HTTP status codes (`res.status(201)`).
> 3. **Service Responsibility**: Services execute core domain logic without knowing if the caller is an Express HTTP request, CLI script, or gRPC stream.
> 
---

### Exercise 2: Asynchronous Business Logic Error Delegation

**Scenario:** Ensures business rule failures in services throw custom operational errors caught cleanly by HTTP controllers.

**Requirements:**
1. Write createOrderService(inventoryRepo, orderRepo).
2. Check inventory in service.
3. Throw OperationalError on business constraint violation.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class BusinessRuleError extends Error {
>   constructor(message, code = "BUSINESS_RULE_VIOLATION") {
>     super(message);
>     this.code = code;
>     this.isOperational = true;
>   }
> }
>
> function createOrderService(inventoryRepo, orderRepo) {
>   return {
>     async checkoutOrder(userId, productId, quantity) {
>       const stock = await inventoryRepo.getStock(productId);
>       if (stock < quantity) {
>         throw new BusinessRuleError("Insufficient inventory for order", "INSUFFICIENT_STOCK");
>       }
>
>       await inventoryRepo.deductStock(productId, quantity);
>       return await orderRepo.createOrder({ userId, productId, quantity });
>     }
>   };
> }
>
> // Verification tests
> const inv = { getStock: async () => 2, deductStock: async () => {} };
> const ord = { createOrder: async () => ({ id: 101 }) };
>
> const orderService = createOrderService(inv, ord);
> orderService.checkoutOrder(1, 10, 5).catch(err => {
>   console.assert(err.isOperational === true, "Test 1 Failed");
>   console.assert(err.code === "INSUFFICIENT_STOCK", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Decoupled Error Classification**: Services throw domain-specific operational errors instead of HTTP-specific errors.
> 2. **Reusability**: Service methods can be called by background worker queues without depending on Express HTTP objects.
> 3. **Testability**: Services are unit tested without mocking HTTP request/response objects.
> 
---

### Exercise 3: Lightweight Dependency Injection Container

**Scenario:** Constructs a dependency injection container that instantiates and wires repositories, services, and controllers automatically.

**Requirements:**
1. Write createContainer().
2. Register factories.
3. Resolve dependencies.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createContainer() {
>   const factories = new Map();
>   const instances = new Map();
>
>   return {
>     register(name, factoryFn) {
>       factories.set(name, factoryFn);
>     },
>     resolve(name) {
>       if (instances.has(name)) {
>         return instances.get(name);
>       }
>
>       const factory = factories.get(name);
>       if (!factory) {
>         throw new Error(`Service '${name}' not registered in DI container`);
>       }
>
>       const instance = factory(this);
>       instances.set(name, instance);
>       return instance;
>     }
>   };
> }
>
> // Verification tests
> const container = createContainer();
> container.register("db", () => ({ connect: () => "DB_CONNECTED" }));
> container.register("userRepo", (c) => ({ db: c.resolve("db") }));
>
> const repo = container.resolve("userRepo");
> console.assert(repo.db.connect() === "DB_CONNECTED", "Test 1 Failed: Resolved dependency tree");
> ```
>
> #### Technical Explanation
>
> 1. **Dependency Injection (DI)**: Passes dependencies into constructors/factories rather than hardcoding `require()` calls inside modules.
> 2. **Inversion of Control (IoC)**: Centralizes object instantiation and lifecycle management.
> 3. **Mocking in Unit Tests**: Allows injecting mock repositories during unit testing without monkey-patching `require()`.
## 6. Related Terms
- [MVC Pattern (Model–View–Controller)](mvc_pattern.md) — The parent application layout pattern.
- [Error Handling Middleware](error_handling_middleware.md) — Receives errors bubble-passed by controllers and services.
- [REST API Design](rest_api.md) — Related concept: REST API Design.

---

## 7. Key Takeaways
- Controllers manage HTTP transport details; services contain core business logic.
- Services should be completely decoupled from Express `req` and `res` objects.
- Decoupling services allows them to be reused in cron jobs, test suites, and scripts.
- Controllers extract inputs from requests, call services, and assign HTTP status responses.
- Never pass HTTP request or response object references into the service layer.
- Throw standard JavaScript errors in services and catch/translate them in controllers.
