# REST API Design

> **Level 9 — REST APIs & Best Practices**
> A strict set of architectural rules and naming conventions for building web APIs, ensuring that developers across the world can understand how to interact with your server without needing a manual.

---

## 1. Prerequisites
- [JSON](../../../04-apis/terms/level_01/json.md) — The language REST APIs speak.

---

## 2. Term Category
- **Architecture / Design Philosophy**

---

## 3. Environment Context
- **System Architecture**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, every developer named their API routes differently.
- Bob: `app.get('/get_all_users')` and `app.post('/create-new-user')`
- Alice: `app.get('/users/all')` and `app.post('/users/add')`
This chaos meant that if you wanted to connect to 5 different APIs, you had to read 5 different manuals just to figure out what the URLs were. 
**REST (Representational State Transfer)** was created to standardize this. If an API is "RESTful," you instantly know exactly how the routes are named and what HTTP methods to use, even if you've never seen the code before.

### (2) The Rules of REST
REST forces you to treat everything as a "Resource" (a noun, never a verb). 
Instead of putting the action in the URL (`/create-user`), you put the action in the **HTTP Method** (POST), and the resource in the URL (`/users`).

**The Standard CRUD (Create, Read, Update, Delete) Mapping:**
- **`GET /users`**: Return a list of all users.
- **`GET /users/12`**: Return the specific user with ID 12.
- **`POST /users`**: Create a brand new user. (Data is in the body).
- **`PUT /users/12`**: Completely replace user 12.
- **`PATCH /users/12`**: Partially update user 12 (e.g., just change their email).
- **`DELETE /users/12`**: Delete user 12.

### (3) Statelessness
The most important technical rule of REST is **Statelessness**. The server must not remember the client between requests. 
If a user logs in, the server doesn't keep a sticky note saying "User 12 is logged in." Instead, every single request the user makes must contain an ID badge (like a JWT Token) proving who they are. This allows the server to scale instantly to millions of users without running out of memory tracking them.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Verbs in the URL

**The mistake:** A developer creates a REST API and writes the following route: `app.post('/users/12/delete')`.

**Why it's wrong:** This violates the core rule of REST! The URL must only contain Nouns (the resource). The action must be defined by the HTTP Method.
**Golden Rule:** If you see an action verb (`get`, `create`, `delete`, `update`) in your URL path, your API is not RESTful. The correct route is `app.delete('/users/12')`.

---



### Mistake 2: Using Verb Verbs in REST Resource URIs (`GET /getUsers`, `POST /deleteUser/1`)

**The mistake:** Designing REST URIs like `/getUsers` or `/updateProduct`.

**Why it's wrong:** REST architecture dictates URIs should represent **Nouns** (resources), while **HTTP Verbs** (`GET`, `POST`, `PUT`, `DELETE`) specify actions.

*Incorrect:*
```javascript
app.get('/getUsers', ...); // ❌ Anti-pattern verb in URI!
app.post('/deleteUser/:id', ...);
```

*Fix:*
```javascript
app.get('/users', ...); // GET fetches resource
app.delete('/users/:id', ...); // DELETE removes resource
```

### Mistake 3: Using `PUT` Instead of `PATCH` for Partial Resource Updates

**The mistake:** Using `PUT /users/1` to update only the user's `email` field.

**Why it's wrong:** HTTP `PUT` implies FULL replacement of the target resource object. HTTP `PATCH` is designated for PARTIAL resource updates.

*Incorrect:*
```javascript
// Updating single field via PUT endpoint
```

*Fix:*
```javascript
app.patch('/users/:id', (req, res) => { ... }); // Partial update via PATCH
```



### Mistake 4: Using Verb Verbs in REST Resource URIs (`GET /getUsers`, `POST /deleteUser/1`)

**The mistake:** Designing REST URIs like `/getUsers` or `/updateProduct`.

**Why it's wrong:** REST architecture dictates URIs should represent **Nouns** (resources), while **HTTP Verbs** (`GET`, `POST`, `PUT`, `DELETE`) specify actions.

*Incorrect:*
```javascript
app.get('/getUsers', ...); // ❌ Anti-pattern verb in URI!
app.post('/deleteUser/:id', ...);
```

*Fix:*
```javascript
app.get('/users', ...); // GET fetches resource
app.delete('/users/:id', ...); // DELETE removes resource
```

### Mistake 5: Using `PUT` Instead of `PATCH` for Partial Resource Updates

**The mistake:** Using `PUT /users/1` to update only the user's `email` field.

**Why it's wrong:** HTTP `PUT` implies FULL replacement of the target resource object. HTTP `PATCH` is designated for PARTIAL resource updates.

*Incorrect:*
```javascript
// Updating single field via PUT endpoint
```

*Fix:*
```javascript
app.patch('/users/:id', (req, res) => { ... }); // Partial update via PATCH
```



### Mistake 6: Using Verb Verbs in REST Resource URIs (`GET /getUsers`, `POST /deleteUser/1`)

**The mistake:** Designing REST URIs like `/getUsers` or `/updateProduct`.

**Why it's wrong:** REST architecture dictates URIs should represent **Nouns** (resources), while **HTTP Verbs** (`GET`, `POST`, `PUT`, `DELETE`) specify actions.

*Incorrect:*
```javascript
app.get('/getUsers', ...); // ❌ Anti-pattern verb in URI!
app.post('/deleteUser/:id', ...);
```

*Fix:*
```javascript
app.get('/users', ...); // GET fetches resource
app.delete('/users/:id', ...); // DELETE removes resource
```

### Mistake 7: Using `PUT` Instead of `PATCH` for Partial Resource Updates

**The mistake:** Using `PUT /users/1` to update only the user's `email` field.

**Why it's wrong:** HTTP `PUT` implies FULL replacement of the target resource object. HTTP `PATCH` is designated for PARTIAL resource updates.

*Incorrect:*
```javascript
// Updating single field via PUT endpoint
```

*Fix:*
```javascript
app.patch('/users/:id', (req, res) => { ... }); // Partial update via PATCH
```

## 6. Practice Exercises

### Exercise 1: RESTful Refactoring

**Problem:** Refactor these three terrible, non-RESTful routes into standard REST APIs:
1. `app.post('/get-books')`
2. `app.post('/books/5/update-title')`
3. `app.get('/delete-all-books')`

**Expected output:**
> [!check]- Answer
> ```text
> 1. app.get('/books')        // Use GET to read. Noun is plural.
> 2. app.patch('/books/5')    // Use PATCH for partial updates. 
> 3. app.delete('/books')     // Use DELETE to destroy.
> ```
> - Match the HTTP Method (GET, POST, PATCH, DELETE) to the action.
> - Remove all verbs from the URL.

---



### Exercise 2: Designing RESTful Endpoint Paths

**Problem:** Design standard RESTful URI paths and HTTP methods for:
1. Get all articles
2. Create new article
3. Update single article
4. Delete single article

**Expected output:**
> [!check]- Answer
> ```text
> 1. GET /articles
> 2. POST /articles
> 3. PUT (or PATCH) /articles/:id
> 4. DELETE /articles/:id
> ```
> ```text
> 1. GET /articles
> 2. POST /articles
> 3. PUT or PATCH /articles/:id
> 4. DELETE /articles/:id
> ```
>
> **Explanation:** REST APIs map standard HTTP CRUD methods to noun resource paths.

---

### Exercise 3: Idempotent HTTP Methods

**Problem:** Which of these HTTP methods are Idempotent?
`GET`, `POST`, `PUT`, `DELETE`

**Expected output:**
> [!check]- Answer
> ```text
> GET, PUT, DELETE are Idempotent (POST is NOT idempotent).
> ```
> ```text
> GET, PUT, DELETE are Idempotent. POST is NOT idempotent.
> ```
>
> **Explanation:** Idempotent methods produce identical system state results regardless of how many times they are repeated.

## 7. Related Terms
- [Routing](../level_07/routing.md) — How you physically implement REST in Express.
- [HTTP Status Codes](../level_09/status_codes.md) — REST APIs must return standard status codes to indicate success or failure.

---

## 8. Key Takeaways
- A **REST API** uses standard HTTP Methods to indicate the action, and Nouns in the URL to indicate the resource.
- **Statelessness** means the server does not remember the client; every request must contain all necessary authentication data.
- Never put action verbs (`create`, `delete`) in your URLs.
