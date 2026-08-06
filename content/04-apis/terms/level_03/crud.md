# CRUD Operations

> **Level 3 — RESTful APIs**
> An acronym for Create, Read, Update, and Delete. The four basic functions of persistent storage that every API must handle.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — CRUD operations map directly to HTTP verbs.
- [REST (Representational State Transfer)](rest.md) — Building a REST API essentially means building a CRUD interface for your database.

---

## 2. Term Category
- **Programming Concept / Database Pattern**

---

## 3. Environment Context
- **Universal** (Applies to databases, APIs, and UIs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you boil down 99% of all software applications in the world—from Twitter, to Amazon, to a simple To-Do app—they all do exactly the same four things. You create data, you view the data, you change the data, and you destroy the data.
Programmers recognized this universal pattern and coined the acronym **CRUD**. When a developer says, "I'm just building a CRUD app," they mean they are building a standard application that simply moves data in and out of a database without any hyper-complex algorithms (like AI or physics engines).

### (2) The CRUD to HTTP Mapping
In a RESTful API, the CRUD operations map perfectly to HTTP Methods:
- **C**reate $\rightarrow$ `POST` (e.g., `POST /users` creates a new user).
- **R**ead $\rightarrow$ `GET` (e.g., `GET /users/5` reads user 5).
- **U**pdate $\rightarrow$ `PUT` or `PATCH` (e.g., `PATCH /users/5` updates user 5).
- **D**elete $\rightarrow$ `DELETE` (e.g., `DELETE /users/5` deletes user 5).

### (3) Reality Metaphor
Imagine a physical notebook where you keep a list of your friends' phone numbers.
- **Create**: You meet a new person and write their name and number on a blank page.
- **Read**: You open the notebook to look up your mom's phone number.
- **Update**: Your friend gets a new phone number, so you cross out the old one and write the new one.
- **Delete**: You fall out with a friend, so you rip their page out of the notebook and throw it away.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that Update has two variants

**The mistake:** A developer uses `PUT` to update a user's email, sending only `{ "email": "new@email.com" }` in the payload. The backend accidentally erases the user's name, age, and address!

**Why it's wrong:** There are two types of Updates in HTTP:
- `PUT` means **Replace**. If you send a `PUT` with just an email, a strict REST API will replace the *entire* user object with just that email, deleting everything else!
- `PATCH` means **Partial Update**. If you only want to update the email and leave the rest alone, you must use `PATCH`.
**Golden Rule:** Be very careful with `PUT`. In modern web development, `PATCH` is almost always the safer choice for Updates.

---

### Mistake 2: Mapping All CRUD Operations to HTTP `POST` Method

**The mistake:** Creating endpoints `/api/createUser`, `/api/getUser`, `/api/updateUser`, `/api/deleteUser` using HTTP `POST` for all calls.

**Why it's wrong:** Using `POST` for everything ignores standard HTTP semantics, preventing HTTP proxy caching (for reads) and safety guarantees.

*Incorrect:*
```http
POST /api/getUser?id=5 HTTP/1.1 ; ❌ Violates REST CRUD conventions!
```

*Fix:*
```http
GET /api/users/5 HTTP/1.1 ; Use standard HTTP GET for read operations
```

---

### Mistake 3: Confusing Hard Delete with Soft Delete in Database Records

**The mistake:** Executing SQL `DELETE FROM orders` directly when a client invokes a CRUD Delete operation.

**Why it's wrong:** Hard deleting database rows destroys audit trails and invalidates foreign key relational references. Use Soft Deletes (`deleted_at` timestamp flag) for business-critical entities.

*Incorrect:*
```javascript
app.delete('/orders/:id', async (req, res) => {
  await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]); // ❌ Permanent data loss!
});
```

*Fix:*
```javascript
app.delete('/orders/:id', async (req, res) => {
  await db.query('UPDATE orders SET deleted_at = NOW() WHERE id = ?', [req.params.id]); // Soft delete
  res.status(204).send();
});
```


---

### Mistake 4: Mapping All CRUD Operations to HTTP `POST` Method

**The mistake:** Creating endpoints `/api/createUser`, `/api/getUser`, `/api/updateUser`, `/api/deleteUser` using HTTP `POST` for all calls.

**Why it's wrong:** Using `POST` for everything ignores standard HTTP semantics, preventing HTTP proxy caching (for reads) and safety guarantees.

*Incorrect:*
```http
POST /api/getUser?id=5 HTTP/1.1 ; ❌ Violates REST CRUD conventions!
```

*Fix:*
```http
GET /api/users/5 HTTP/1.1 ; Use standard HTTP GET for read operations
```

---

### Mistake 5: Confusing Hard Delete with Soft Delete in Database Records

**The mistake:** Executing SQL `DELETE FROM orders` directly when a client invokes a CRUD Delete operation.

**Why it's wrong:** Hard deleting database rows destroys audit trails and invalidates foreign key relational references. Use Soft Deletes (`deleted_at` timestamp flag) for business-critical entities.

*Incorrect:*
```javascript
app.delete('/orders/:id', async (req, res) => {
  await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]); // ❌ Permanent data loss!
});
```

*Fix:*
```javascript
app.delete('/orders/:id', async (req, res) => {
  await db.query('UPDATE orders SET deleted_at = NOW() WHERE id = ?', [req.params.id]); // Soft delete
  res.status(204).send();
});
```


---

### Mistake 6: Mapping All CRUD Operations to HTTP `POST` Method

**The mistake:** Creating endpoints `/api/createUser`, `/api/getUser`, `/api/updateUser`, `/api/deleteUser` using HTTP `POST` for all calls.

**Why it's wrong:** Using `POST` for everything ignores standard HTTP semantics, preventing HTTP proxy caching (for reads) and safety guarantees.

*Incorrect:*
```http
POST /api/getUser?id=5 HTTP/1.1 ; ❌ Violates REST CRUD conventions!
```

*Fix:*
```http
GET /api/users/5 HTTP/1.1 ; Use standard HTTP GET for read operations
```

---

### Mistake 7: Confusing Hard Delete with Soft Delete in Database Records

**The mistake:** Executing SQL `DELETE FROM orders` directly when a client invokes a CRUD Delete operation.

**Why it's wrong:** Hard deleting database rows destroys audit trails and invalidates foreign key relational references. Use Soft Deletes (`deleted_at` timestamp flag) for business-critical entities.

*Incorrect:*
```javascript
app.delete('/orders/:id', async (req, res) => {
  await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]); // ❌ Permanent data loss!
});
```

*Fix:*
```javascript
app.delete('/orders/:id', async (req, res) => {
  await db.query('UPDATE orders SET deleted_at = NOW() WHERE id = ?', [req.params.id]); // Soft delete
  res.status(204).send();
});
```


---

## 6. Practice Exercises

### Exercise 1: Identify the CRUD

**Problem:** You are using Twitter/X. Identify the CRUD operation for each action:
1. You scroll through your timeline.
2. You write a tweet and hit "Post".
3. You realize you made a typo, so you click "Edit Tweet" and fix it.
4. The tweet is embarrassing, so you remove it from your profile.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Read (GET)
> 2. Create (POST)
> 3. Update (PATCH/PUT)
> 4. Delete (DELETE)
> ```
> - Think about what is happening to the permanent data in the Twitter database.
> 
---

### Exercise 2: CRUD to HTTP Method Mapping Table

**Problem:** Map the 4 CRUD operations to their standard HTTP verbs and SQL commands:
1. Create
2. Read
3. Update
4. Delete

**Expected output:**
> [!check]- Answer
> ```text
> 1. Create: POST -> INSERT
> 2. Read: GET -> SELECT
> 3. Update: PUT/PATCH -> UPDATE
> 4. Delete: DELETE -> DELETE
> ```
> ```text
> 1. Create -> HTTP POST   -> SQL INSERT
> 2. Read   -> HTTP GET    -> SQL SELECT
> 3. Update -> HTTP PUT/PATCH -> SQL UPDATE
> 4. Delete -> HTTP DELETE -> SQL DELETE (or soft update)
> ```
> - **Explanation:** REST architecture aligns HTTP verbs with database CRUD operations.
---

### Exercise 3: CRUD Response Status Codes

**Problem:** Identify the conventional success status codes for:
1. Successful Create (POST)
2. Successful Delete with empty body (DELETE)

**Expected output:**
> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 204 No Content
> ```
> ```text
> 1. 201 Created
> 2. 204 No Content
> ```
> - **Explanation:** Explicit 2xx status codes communicate specific CRUD operational success.
---

### Exercise 4: CRUD to HTTP Method Mapping Table

**Problem:** Map the 4 CRUD operations to their standard HTTP verbs and SQL commands:
1. Create
2. Read
3. Update
4. Delete

**Expected output:**
> [!check]- Answer
> ```text
> 1. Create: POST -> INSERT
> 2. Read: GET -> SELECT
> 3. Update: PUT/PATCH -> UPDATE
> 4. Delete: DELETE -> DELETE
> ```
> ```text
> 1. Create -> HTTP POST   -> SQL INSERT
> 2. Read   -> HTTP GET    -> SQL SELECT
> 3. Update -> HTTP PUT/PATCH -> SQL UPDATE
> 4. Delete -> HTTP DELETE -> SQL DELETE (or soft update)
> ```
> - **Explanation:** REST architecture aligns HTTP verbs with database CRUD operations.
---

### Exercise 5: CRUD Response Status Codes

**Problem:** Identify the conventional success status codes for:
1. Successful Create (POST)
2. Successful Delete with empty body (DELETE)

**Expected output:**
> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 204 No Content
> ```
> ```text
> 1. 201 Created
> 2. 204 No Content
> ```
> - **Explanation:** Explicit 2xx status codes communicate specific CRUD operational success.
---

### Exercise 6: CRUD to HTTP Method Mapping Table

**Problem:** Map the 4 CRUD operations to their standard HTTP verbs and SQL commands:
1. Create
2. Read
3. Update
4. Delete

**Expected output:**
> [!check]- Answer
> ```text
> 1. Create: POST -> INSERT
> 2. Read: GET -> SELECT
> 3. Update: PUT/PATCH -> UPDATE
> 4. Delete: DELETE -> DELETE
> ```
> ```text
> 1. Create -> HTTP POST   -> SQL INSERT
> 2. Read   -> HTTP GET    -> SQL SELECT
> 3. Update -> HTTP PUT/PATCH -> SQL UPDATE
> 4. Delete -> HTTP DELETE -> SQL DELETE (or soft update)
> ```
> - **Explanation:** REST architecture aligns HTTP verbs with database CRUD operations.
---

### Exercise 7: CRUD Response Status Codes

**Problem:** Identify the conventional success status codes for:
1. Successful Create (POST)
2. Successful Delete with empty body (DELETE)

**Expected output:**
> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 204 No Content
> ```
> ```text
> 1. 201 Created
> 2. 204 No Content
> ```
> - **Explanation:** Explicit 2xx status codes communicate specific CRUD operational success.
---

## 7. Related Terms
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The tools we use to execute CRUD over the network.
- [REST (Representational State Transfer)](rest.md) — The architecture that enforces this mapping.
- [Idempotent vs Safe Methods](../level_02/idempotent_vs_safe_methods.md) — Related concept: Idempotent vs Safe Methods.
- [Resource Naming & URI Design](resource_naming.md) — Related concept: Resource Naming & URI Design.
- [Richardson Maturity Model](richardson_maturity_model.md) — Related concept: Richardson Maturity Model.

---

## 8. Key Takeaways
- **CRUD** stands for Create, Read, Update, Delete.
- It represents the four fundamental operations of any persistent storage system.
- In a REST API, these map to `POST`, `GET`, `PUT/PATCH`, and `DELETE`.
- The vast majority of the web is just simple CRUD applications!
