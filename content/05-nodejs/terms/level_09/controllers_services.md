# Controllers & Services

> **Level 9 — REST APIs & Best Practices**
> Splitting route handlers (controllers) from business logic (services).

---

## 1. Prerequisites
- [MVC Pattern (Model–View–Controller)](./mvc_pattern.md) — The folder layout organizing data and logic.
- [Routing](../level_07/routing.md) — Directing URL endpoints to code handlers.

---

## 2. Term Category
- **Architecture / Design Pattern**

---

## 3. Environment Context
- **Web App Server Layer** (Further refines the separation of concerns by separating the HTTP transport layer from business logic).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Writing Heavy Business Logic and Database Queries Directly Inside Controller Route Functions ('Fat Controllers')

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

### Mistake 5: Passing Express `req` and `res` Objects Down into Service Layer Functions

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



### Mistake 6: Writing Heavy Business Logic and Database Queries Directly Inside Controller Route Functions ('Fat Controllers')

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

### Mistake 7: Passing Express `req` and `res` Objects Down into Service Layer Functions

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

## 6. Practice Exercises

### Exercise 1: Controller Refactoring

**Problem:** Refactor the coupled route handler below, separating it into a `postService.js` and a `postController.js`:

```javascript
// Before (Coupled Controller):
app.post('/api/posts', async (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).send('Title required');
  const post = await db.query('INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *', [title, content]);
  res.status(201).json(post);
});

// After (Refactored):
// 1. services/postService.js
exports.createPostRecord = async (title, content) => {
  return await db.query('INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *', [title, content]);
};

// 2. controllers/postController.js
exports.createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title) {
      return res.status(400).send('Title required');
    }
    const post = await postService.createPostRecord(title, content);
    return res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Separating Controller and Service Responsibilities

**Problem:** Categorize task as Controller or Service responsibility:
1. Extracting `req.params.id` (Controller)
2. Calculating order tax and applying discount code (Service)
3. Returning HTTP 200 JSON response (Controller)
4. Querying database and saving transaction (Service)

**Expected output:**
```text
1. Controller
2. Service
3. Controller
4. Service
```

> [!check]- Answer
> ```text
> 1. Controller
> 2. Service
> 3. Controller
> 4. Service
> ```
>
> **Explanation:** Controllers handle HTTP transport layer (req/res); Services handle core business domain logic.

### Exercise 3: Service Layer Unit Testing Advantage

**Problem:** Why is testing a Service function easier than testing a Controller function?

**Expected output:**
```text
Service functions take plain parameters and return data directly without requiring HTTP request/response mocks.
```

> [!check]- Answer
> ```text
> Service functions take plain parameters and return data directly without requiring HTTP request/response mocks.
> ```
>
> **Explanation:** Framework-agnostic service layer functions can be unit-tested with standard input values.



### Exercise 4: Separating Controller and Service Responsibilities

**Problem:** Categorize task as Controller or Service responsibility:
1. Extracting `req.params.id` (Controller)
2. Calculating order tax and applying discount code (Service)
3. Returning HTTP 200 JSON response (Controller)
4. Querying database and saving transaction (Service)

**Expected output:**
```text
1. Controller
2. Service
3. Controller
4. Service
```

> [!check]- Answer
> ```text
> 1. Controller
> 2. Service
> 3. Controller
> 4. Service
> ```
>
> **Explanation:** Controllers handle HTTP transport layer (req/res); Services handle core business domain logic.

### Exercise 5: Service Layer Unit Testing Advantage

**Problem:** Why is testing a Service function easier than testing a Controller function?

**Expected output:**
```text
Service functions take plain parameters and return data directly without requiring HTTP request/response mocks.
```

> [!check]- Answer
> ```text
> Service functions take plain parameters and return data directly without requiring HTTP request/response mocks.
> ```
>
> **Explanation:** Framework-agnostic service layer functions can be unit-tested with standard input values.



### Exercise 6: Separating Controller and Service Responsibilities

**Problem:** Categorize task as Controller or Service responsibility:
1. Extracting `req.params.id` (Controller)
2. Calculating order tax and applying discount code (Service)
3. Returning HTTP 200 JSON response (Controller)
4. Querying database and saving transaction (Service)

**Expected output:**
```text
1. Controller
2. Service
3. Controller
4. Service
```

> [!check]- Answer
> ```text
> 1. Controller
> 2. Service
> 3. Controller
> 4. Service
> ```
>
> **Explanation:** Controllers handle HTTP transport layer (req/res); Services handle core business domain logic.

### Exercise 7: Service Layer Unit Testing Advantage

**Problem:** Why is testing a Service function easier than testing a Controller function?

**Expected output:**
```text
Service functions take plain parameters and return data directly without requiring HTTP request/response mocks.
```

> [!check]- Answer
> ```text
> Service functions take plain parameters and return data directly without requiring HTTP request/response mocks.
> ```
>
> **Explanation:** Framework-agnostic service layer functions can be unit-tested with standard input values.

## 7. Related Terms
- [MVC Pattern (Model–View–Controller)](./mvc_pattern.md) — The parent application layout pattern.
- [Error Handling Middleware](./error_handling_middleware.md) — Receives errors bubble-passed by controllers and services.

---

## 8. Key Takeaways
- Controllers manage HTTP transport details; services contain core business logic.
- Services should be completely decoupled from Express `req` and `res` objects.
- Decoupling services allows them to be reused in cron jobs, test suites, and scripts.
- Controllers extract inputs from requests, call services, and assign HTTP status responses.
- Never pass HTTP request or response object references into the service layer.
- Throw standard JavaScript errors in services and catch/translate them in controllers.
