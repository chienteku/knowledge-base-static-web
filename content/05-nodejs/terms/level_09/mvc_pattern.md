# MVC Pattern (Model–View–Controller)

> **Level 9 — REST APIs & Best Practices**
> The folder/architecture pattern for organizing a real server.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — The routing web framework.
- [ORMs & ODMs](../level_08/orms_odms.md) — The database schemas representing data models.

---

## 2. Term Category

**Architecture / Design Pattern (Web App Server Layer .)**: MVC Pattern (Model–View–Controller) is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When learning Node.js, it is common to write an entire application inside a single `server.js` file. This file often handles database connections, schema validations, route path matches, business logic calculations, and response rendering.

As your application grows, this approach quickly becomes unmaintainable. Making changes is difficult, and code cannot be easily reused.

To enforce the principle of **Separation of Concerns (SoC)**, developers use the **MVC (Model-View-Controller)** architectural pattern to organize their codebase:

```text
       ┌──────────┐    Request     ┌────────────┐
       │  Client  │ ─────────────> │ Controller │
       └──────────┘                └────────────┘
            ▲                            │
            │ Response                   ├───────────────┐
            │                            ▼               ▼
       ┌──────────┐                ┌────────────┐  ┌──────────┐
       │   View   │ <───────────── │   Model    │  │ Database │
       └──────────┘                └────────────┘  └──────────┘
```

#### 1. Model (Data Layer)
-   **Responsibility:** Manages the application data, database logic, schemas, and query rules.
-   **Node Example:** A Mongoose schema file (`models/User.js`). It does not know about HTTP requests, headers, or client routing.

#### 2. View (Presentation Layer)
-   **Responsibility:** The user interface shown to the client.
-   **Node Example:** For a REST API, the View is simply the returned JSON payload. For server-rendered applications, it is an HTML template (like EJS, Pug, or Handlebars) located in the `views/` directory.

#### 3. Controller (Logic/Traffic Cop Layer)
-   **Responsibility:** The brain that connects the Model and the View.
-   **Node Example:** Express route callback functions (`controllers/userController.js`). The controller accepts HTTP requests, extracts parameters, queries the model for data, processes it, and passes it to the view for rendering.

---

### (2) Directory Layout of an MVC Project

```text
my-node-app/
├── models/
│   └── User.js              # Schema & DB validations
├── controllers/
│   └── userController.js    # HTTP Request & orchestration logic
├── routes/
│   └── userRoutes.js        # Thin routing maps (mapping URLs to Controllers)
├── views/
│   └── userProfile.ejs      # Server-rendered HTML UI (optional)
└── server.js                # App entrypoint & middleware configuration
```

---

### (3) Reality Metaphor
Imagine dining at a sit-down restaurant.
- **The Client (Web Browser):** The customer sitting at the table.
- **The View (The Plate Presentation):** The layout and formatting of the food on your plate.
- **The Controller (The Waiter):** Takes your order (**HTTP Request**), runs to the kitchen to explain the order, receives the completed food, plates it nicely (**the View**), and brings it back to your table.
- **The Model (The Kitchen):** The pantry (**database**) and the chef (**schemas/validation**). The kitchen cooks the food, but never interacts with the customers directly.

---

### (4) Code Separation Example

#### 1. The Route Map (`routes/userRoutes.js`)
*Kept thin: only directs paths to controller methods.*
```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users/:id', userController.getUserProfile);

module.exports = router;
```

#### 2. The Controller (`controllers/userController.js`)
*Orchestrates: handles req/res and calls the model.*
```javascript
const User = require('../models/User');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    // Return the JSON view to the client
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing heavy business logic directly inside the router file

**The mistake:** Writing database queries, validation checks, and route handlers directly inside `routes/userRoutes.js`:

```javascript
// BAD: Route file handles business logic and DB queries directly!
router.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  // ... more complex calculations ...
  res.json(user);
});
```

**Why it's wrong:** Route files should only act as traffic maps, routing URLs to their respective controllers. Placing heavy logic inside routes makes it difficult to read the routing structure and makes testing individual controllers in isolation impossible.

*Fix:* Keep routes thin. Delegate all request-handling logic to controller files.

---



### Mistake 2: Placing Database Query Logic Directly Inside View Templates

**The mistake:** Executing SQL queries inside EJS or Handlebars template files.

**Why it's wrong:** Views should be pure rendering templates. Executing database queries in templates breaks MVC separation of concerns and leads to un-maintainable code.

*Incorrect:*
```javascript
// Inside EJS template file: <% const users = await db.query('SELECT...') %>
```

*Fix:*
```javascript
// Controller fetches data and passes to View template:
const users = await db.query('SELECT...');
res.render('users', { users });
```

### Mistake 3: Tightly Coupling Model Classes to HTTP Request/Response Objects

**The mistake:** Accessing `req.body` directly inside Model method definitions.

**Why it's wrong:** Models represent application data and persistence logic. Tightly coupling Models to HTTP `req`/`res` objects prevents reusing models in background workers or CLI scripts.

*Incorrect:*
```javascript
class UserModel {
  static create(req) { return db.save(req.body); } // ❌ Coupled to HTTP req!
}
```

*Fix:*
```javascript
class UserModel {
  static create(userData) { return db.save(userData); } // Decoupled plain data object
}
```

## 5. Practice Exercises

### Exercise 1: MVC Pattern Architecture Dispatcher

**Scenario:** Demonstrates Model-View-Controller architecture where Controller fetches Model data and passes it to View template renderer.

**Requirements:**
1. Write mvcDispatcher(reqUrl, modelMock, viewRendererMock).
2. Fetch Model.
3. Pass Model data to View.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function mvcDispatcher(reqUrl, modelMock, viewRendererMock) {
>   // 1. Controller logic: extract route parameters
>   const match = reqUrl.match(/\/users\/(\d+)/);
>   if (!match) {
>     return { status: 404, html: viewRendererMock.render("404", {}) };
>   }
>
>   const userId = parseInt(match[1], 10);
>
>   // 2. Controller queries Model
>   const userData = await modelMock.findUserById(userId);
>   if (!userData) {
>     return { status: 404, html: viewRendererMock.render("404", { message: "User not found" }) };
>   }
>
>   // 3. Controller passes Model data to View renderer
>   const html = viewRendererMock.render("userProfile", userData);
>
>   return { status: 200, html };
> }
>
> // Verification tests
> const mockModel = { findUserById: async (id) => id === 42 ? { id: 42, name: "Alice" } : null };
> const mockView = { render: (tpl, data) => `<h1>${tpl}:${data.name || "None"}</h1>` };
>
> mvcDispatcher("/users/42", mockModel, mockView).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed");
>   console.assert(res.html === "<h1>userProfile:Alice</h1>", "Test 2 Failed: Rendered view with model data");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Model Component**: Encapsulates data structure, database persistence, and business rules.
> 2. **View Component**: Formats data into user interface representations (HTML templates, EJS, Pug, Handlebars).
> 3. **Controller Component**: Coordinates user input requests, orchestrates Model queries, and selects View representations.
> 
---

### Exercise 2: Model Data Hydration & Domain Guard

**Scenario:** Constructs an MVC Model class that encapsulates data validation and state mutation methods.

**Requirements:**
1. Write createProductModel(data).
2. Validate price > 0.
3. Provide `applyDiscount(percentage)` method.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class ProductModel {
>   constructor(data = {}) {
>     if (!data.name || typeof data.name !== "string") {
>       throw new Error("MODEL_VALIDATION_ERROR: Product name is required");
>     }
>     if (typeof data.price !== "number" || data.price <= 0) {
>       throw new Error("MODEL_VALIDATION_ERROR: Price must be positive");
>     }
>
>     this.id = data.id || null;
>     this.name = data.name;
>     this.price = data.price;
>   }
>
>   applyDiscount(percentage = 10) {
>     const discountAmount = (this.price * percentage) / 100;
>     this.price = Number((this.price - discountAmount).toFixed(2));
>     return this.price;
>   }
> }
>
> // Verification tests
> const product = new ProductModel({ name: "Laptop", price: 1000 });
> product.applyDiscount(10);
>
> console.assert(product.price === 900, "Test 1 Failed: Discount applied via model method");
> ```
>
> #### Technical Explanation
>
> 1. **Rich Domain Model**: Encapsulates business behavior and state mutations directly on Model classes.
> 2. **Anemic Domain Model Anti-Pattern**: Placing all business logic in controllers while treating models as dumb data bags degrades maintainability.
> 3. **Model Self-Validation**: Models validate their own data integrity upon construction.
> 
---

### Exercise 3: Server-Side View Template Renderer Abstraction

**Scenario:** Simulates a server-side view engine template renderer replacing placeholder variables (`{{name}}`) with view model data.

**Requirements:**
1. Write renderViewTemplate(templateString, viewModelData).
2. Replace `{{key}}` placeholders.
3. Return rendered string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function renderViewTemplate(templateString = "", viewModelData = {}) {
>   let output = templateString;
>
>   for (const [key, value] of Object.entries(viewModelData)) {
>     const regex = new RegExp(`{{\s*${key}\s*}}`, "g");
>     output = output.replace(regex, String(value));
>   }
>
>   return output;
> }
>
> // Verification tests
> const tpl = "Hello {{ name }}, your role is {{ role }}!";
> const rendered = renderViewTemplate(tpl, { name: "Alice", role: "Admin" });
>
> console.assert(rendered === "Hello Alice, your role is Admin!", "Test 1 Failed: Replaced template variables");
> ```
>
> #### Technical Explanation
>
> 1. **Server-Side Rendering (SSR)**: Generates complete HTML strings on the server before sending to the client browser.
> 2. **Template Engines in Node.js**: Popular Node.js view engines include EJS (`app.set('view engine', 'ejs')`), Handlebars, and Pug.
> 3. **View Model (VM)**: Lightweight data objects formatted specifically for template rendering consumption.
## 6. Related Terms
- [Controllers & Services](controllers_services.md) — A deeper separation refining the controller layer.
- [ORMs & ODMs](../level_08/orms_odms.md) — The database mapping technologies representing Models.
- [REST API Design](rest_api.md) — Related concept: REST API Design.

---

## 7. Key Takeaways
- The MVC pattern separates application concerns into Models, Views, and Controllers.
- **Models** represent schemas, data layouts, and database interaction logic.
- **Views** format and present output to clients (JSON structures or HTML templates).
- **Controllers** handle HTTP requests, query models, and return views.
- Keep route files thin; they should only direct URL pathways to controllers.
- MVC improves code modularity, testability, and maintainability in large codebases.
