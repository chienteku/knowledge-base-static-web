# CRUD Operations

> **Level 3 — RESTful APIs**
> An acronym for Create, Read, Update, and Delete. The four basic functions of persistent storage that every API must handle.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — CRUD operations map directly to HTTP verbs.
- [REST (Representational State Transfer)](rest.md) — Building a REST API essentially means building a CRUD interface for your database.

---

## 2. Term Category

**Programming Concept / Database Pattern (Universal .)**: CRUD Operations is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Memory-Backed CRUD Data Store Module

**Scenario:** A state management store implements complete Create, Read, Update, Delete (CRUD) operations for a collection of user entities.

**Requirements:**
1. Write createCrudStore().
2. Implement Create(item), Read(id), ReadAll(), Update(id, patch), Delete(id).
3. Return operation results.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createCrudStore() {
>   const items = new Map();
>
>   return {
>     create(data) {
>       const id = `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
>       const record = { id, ...data };
>       items.set(id, record);
>       return record;
>     },
>     read(id) {
>       return items.get(id) || null;
>     },
>     readAll() {
>       return Array.from(items.values());
>     },
>     update(id, patch) {
>       if (!items.has(id)) return null;
>       const existing = items.get(id);
>       const updated = { ...existing, ...patch, id };
>       items.set(id, updated);
>       return updated;
>     },
>     delete(id) {
>       return items.delete(id);
>     }
>   };
> }
>
> // Verification tests
> const store = createCrudStore();
> const created = store.create({ name: "Alice", role: "Admin" });
> console.assert(store.read(created.id).name === "Alice", "Test 1 Failed: Read after Create");
>
> const updated = store.update(created.id, { role: "SuperAdmin" });
> console.assert(updated.role === "SuperAdmin" && updated.name === "Alice", "Test 2 Failed: Update");
>
> const deleted = store.delete(created.id);
> console.assert(deleted === true && store.read(created.id) === null, "Test 3 Failed: Delete");
> ```
>
> #### Technical Explanation
>
> 1. **CRUD Acronym**: Create, Read, Update, Delete represent the four basic persistent storage functions.
> 2. **HTTP Mapping to CRUD**: Create -> POST, Read -> GET, Update -> PUT/PATCH, Delete -> DELETE.
> 3. **Immutable Update Pattern**: Updates preserve entity identity while replacing state attributes safely.
> 
---

### Exercise 2: Transactional Batch CRUD Processor with Rollback

**Scenario:** A database service executes batch CRUD operations transactionally, rolling back all changes if any single item mutation fails.

**Requirements:**
1. Write executeBatchCrud(operations, initialStore).
2. Execute operations array.
3. Rollback if operation throws or fails.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function executeBatchCrud(operations, initialStoreMap) {
>   const backup = new Map(initialStoreMap);
>
>   try {
>     for (const op of operations) {
>       if (op.type === "CREATE") {
>         if (!op.id || initialStoreMap.has(op.id)) throw new Error(`Create failed for ID ${op.id}`);
>         initialStoreMap.set(op.id, op.data);
>       } else if (op.type === "UPDATE") {
>         if (!initialStoreMap.has(op.id)) throw new Error(`Update failed: missing ID ${op.id}`);
>         const curr = initialStoreMap.get(op.id);
>         initialStoreMap.set(op.id, { ...curr, ...op.data });
>       } else if (op.type === "DELETE") {
>         if (!initialStoreMap.has(op.id)) throw new Error(`Delete failed: missing ID ${op.id}`);
>         initialStoreMap.delete(op.id);
>       }
>     }
>     return { success: true };
>   } catch (err) {
>     initialStoreMap.clear();
>     for (const [k, v] of backup.entries()) {
>       initialStoreMap.set(k, v);
>     }
>     return { success: false, error: err.message };
>   }
> }
>
> // Verification tests
> const db = new Map([["1", { name: "Item 1" }]]);
> const ops = [
>   { type: "UPDATE", id: "1", data: { name: "Updated 1" } },
>   { type: "DELETE", id: "missing-id" }
> ];
>
> const res = executeBatchCrud(ops, db);
> console.assert(res.success === false, "Test 1 Failed: Batch must fail on error");
> console.assert(db.get("1").name === "Item 1", "Test 2 Failed: Transaction must rollback to initial state");
> ```
>
> #### Technical Explanation
>
> 1. **ACID Transactions in CRUD**: Atomicity ensures batch operations either ALL succeed or ALL roll back completely.
> 2. **State Snapshot Backup**: Saving pre-transaction state enables instant in-memory rollback on failure.
> 3. **Batch Endpoint Optimization**: Processes multi-entity mutations in a single API roundtrip.
> 
---

### Exercise 3: Audit Logging Middleware for CRUD Mutations

**Scenario:** An API audit logger tracks every CRUD data mutation, creating structured audit trail records.

**Requirements:**
1. Write auditCrudMutation(actionType, entityName, entityId, actorId).
2. Generate structured audit log object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditCrudMutation(actionType, entityName, entityId, actorId) {
>   const validActions = ["CREATE", "READ", "UPDATE", "DELETE"];
>   const action = String(actionType).toUpperCase();
>
>   if (!validActions.includes(action)) {
>     throw new Error(`Invalid CRUD action type: ${actionType}`);
>   }
>
>   return {
>     auditId: `audit_${Date.now()}`,
>     timestamp: new Date().toISOString(),
>     action,
>     entity: entityName,
>     entityId,
>     performedBy: actorId || "SYSTEM"
>   };
> }
>
> // Verification tests
> const log = auditCrudMutation("DELETE", "Order", "ord_99", "usr_admin");
> console.assert(log.action === "DELETE", "Test 1 Failed");
> console.assert(log.entity === "Order" && log.entityId === "ord_99", "Test 2 Failed");
> console.assert(log.performedBy === "usr_admin", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Compliance Audit Trails**: Logging CRUD mutations (especially UPDATE and DELETE) is mandatory for SOC2 and GDPR compliance.
> 2. **Actor Attribution**: Records WHICH user or system service triggered each CRUD mutation.
> 3. **Immutable Audit Logs**: Audit records must be stored in append-only storage systems for tamper-proof security.
---

## 6. Related Terms
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The tools we use to execute CRUD over the network.
- [REST (Representational State Transfer)](rest.md) — The architecture that enforces this mapping.
- [Idempotent vs Safe Methods](../level_02/idempotent_vs_safe_methods.md) — Related concept: Idempotent vs Safe Methods.
- [Resource Naming & URI Design](resource_naming.md) — Related concept: Resource Naming & URI Design.
- [Richardson Maturity Model](richardson_maturity_model.md) — Related concept: Richardson Maturity Model.

---

## 7. Key Takeaways
- **CRUD** stands for Create, Read, Update, Delete.
- It represents the four fundamental operations of any persistent storage system.
- In a REST API, these map to `POST`, `GET`, `PUT/PATCH`, and `DELETE`.
- The vast majority of the web is just simple CRUD applications!
