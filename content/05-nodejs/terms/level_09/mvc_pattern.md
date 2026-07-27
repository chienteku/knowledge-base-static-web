# MVC Pattern (Model–View–Controller)

> **Level 9 — REST APIs & Best Practices**
> The folder/architecture pattern for organizing a real server.

---

## 1. Prerequisites
- [Express.js](../level_07/express_js.md) — The routing web framework.
- [ORMs & ODMs](../level_08/orms_odms.md) — The database schemas representing data models.

---

## 2. Term Category
- **Architecture / Design Pattern**

---

## 3. Environment Context
- **Web App Server Layer** (Governs folder structure, modularity, and separation of concerns).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Placing Database Query Logic Directly Inside View Templates

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

### Mistake 5: Tightly Coupling Model Classes to HTTP Request/Response Objects

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



### Mistake 6: Placing Database Query Logic Directly Inside View Templates

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

### Mistake 7: Tightly Coupling Model Classes to HTTP Request/Response Objects

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

## 6. Practice Exercises

### Exercise 1: MVC File Routing

**Problem:** You are building a blog API. Group the components below into their correct MVC directories:
- `models/Post.js`
- `controllers/postController.js`
- `routes/postRoutes.js`

Write a thin Express route inside `routes/postRoutes.js` that maps `POST /posts` to a controller method named `createPost`:

```javascript
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// Solution:
router.post('/posts', postController.createPost);

module.exports = router;
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Matching MVC Component Roles

**Problem:** Match component to MVC role:
1. User database schema and queries (Model)
2. Route handler that receives HTTP request and calls model (Controller)
3. HTML EJS template rendered to browser (View)

**Expected output:**
```text
1. Model
2. Controller
3. View
```

> [!check]- Answer
> ```text
> 1. Model
> 2. Controller
> 3. View
> ```
>
> **Explanation:** Model manages data; View handles presentation; Controller orchestrates requests.

### Exercise 3: Express res.render Method

**Problem:** Which Express method renders a View template file passing data variables? (`res.render('templateName', { data })`).

**Expected output:**
```text
res.render('templateName', { data })
```

> [!check]- Answer
> ```javascript
> res.render('profile', { user });
> ```
>
> **Explanation:** `res.render` compiles template files with data objects and returns HTML to client.



### Exercise 4: Matching MVC Component Roles

**Problem:** Match component to MVC role:
1. User database schema and queries (Model)
2. Route handler that receives HTTP request and calls model (Controller)
3. HTML EJS template rendered to browser (View)

**Expected output:**
```text
1. Model
2. Controller
3. View
```

> [!check]- Answer
> ```text
> 1. Model
> 2. Controller
> 3. View
> ```
>
> **Explanation:** Model manages data; View handles presentation; Controller orchestrates requests.

### Exercise 5: Express res.render Method

**Problem:** Which Express method renders a View template file passing data variables? (`res.render('templateName', { data })`).

**Expected output:**
```text
res.render('templateName', { data })
```

> [!check]- Answer
> ```javascript
> res.render('profile', { user });
> ```
>
> **Explanation:** `res.render` compiles template files with data objects and returns HTML to client.



### Exercise 6: Matching MVC Component Roles

**Problem:** Match component to MVC role:
1. User database schema and queries (Model)
2. Route handler that receives HTTP request and calls model (Controller)
3. HTML EJS template rendered to browser (View)

**Expected output:**
```text
1. Model
2. Controller
3. View
```

> [!check]- Answer
> ```text
> 1. Model
> 2. Controller
> 3. View
> ```
>
> **Explanation:** Model manages data; View handles presentation; Controller orchestrates requests.

### Exercise 7: Express res.render Method

**Problem:** Which Express method renders a View template file passing data variables? (`res.render('templateName', { data })`).

**Expected output:**
```text
res.render('templateName', { data })
```

> [!check]- Answer
> ```javascript
> res.render('profile', { user });
> ```
>
> **Explanation:** `res.render` compiles template files with data objects and returns HTML to client.

## 7. Related Terms
- [Controllers & Services](./controllers_services.md) — A deeper separation refining the controller layer.
- [ORMs & ODMs](../level_08/orms_odms.md) — The database mapping technologies representing Models.

---

## 8. Key Takeaways
- The MVC pattern separates application concerns into Models, Views, and Controllers.
- **Models** represent schemas, data layouts, and database interaction logic.
- **Views** format and present output to clients (JSON structures or HTML templates).
- **Controllers** handle HTTP requests, query models, and return views.
- Keep route files thin; they should only direct URL pathways to controllers.
- MVC improves code modularity, testability, and maintainability in large codebases.
