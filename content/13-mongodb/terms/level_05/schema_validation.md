# Schema Validation (`$jsonSchema`)

> **Level 5 — Data Modeling & Schema Design**
> MongoDB's database-level enforcement mechanism that validates document structures, required fields, data types, and value constraints on inserts and updates using standard JSON Schema rules.

---

## 1. Prerequisites

- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [BSON Data Types (Overview)](../level_02/bson_data_types.md) — The target types validated.

---

## 2. Term Category

**Data Modeling** (JSON Schema Constraint Validation): Schema Validation ($jsonSchema) enforces structural types, required fields, and value ranges on collection writes directly at the database tier.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Checked during the write pipeline on the database server. Aborts writes and rolls back changes if validations fail).

### (1) Design Motivation — "Why did we design this?"
Because MongoDB has a **Flexible Schema** by default, you can write any document to a collection. 

If a junior developer writes a user document containing a string for age (`age: "twenty"`) instead of an integer, or completely omits the `email` field:
-   Your backend API might crash when parsing the string.
-   Your database data becomes corrupt and inconsistent.

While most applications validate data in backend code (using tools like Joi or Zod), you need a **last line of defense** at the database layer. 

If an administrator runs a manual script in `mongosh` or connects an external dashboard, they could bypass backend validations and write bad data.

We designed **Schema Validation** to solve this. 

By declaring a **`$jsonSchema`** validation rule on your collection, MongoDB checks every write. 

If a write violates your rules, the database rejects it, keeping your data clean.

---

### (2) Schema Validation Structure
Validation is defined when creating a collection or modifying it using the `collMod` command:
-   **`bsonType`:** Specifies the exact BSON binary type (e.g. `"int"`, `"string"`, `"decimal"`).
-   **`required`:** An array of field keys that *must* exist in the document.
-   **`properties`:** A nested object detailing rules for individual fields.

---

### (3) Reality Metaphor (Airport Security Gates)
-   **No Validation:** An open public park. Anyone can walk in wearing a bathing suit, carrying a ladder, or walking a pet.
-   **Schema Validation:** An **Airport Security Checkpoint**. 
    -   The automated gate checks: *"Do they have a passport? Yes (required). Is their ticket paper or digital? Yes (type). Are they carrying liquids > 100ml? No (value check)."* 
    -   If any check fails, the gate sounds an alarm and blocks entry.

---

### (4) Code Examples

#### Creating a Validated Collection in mongosh
Let's build a `users` collection that requires name and email, and validates age:

```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [ "name", "email" ], // Mandatory fields!
      properties: {
        name: {
          bsonType: "string",
          description: "name must be a string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "@", // Simple regex check for '@' character
          description: "email must be a string containing '@' and is required"
        },
        age: {
          bsonType: "int", // Strict 32-bit integer!
          minimum: 18,     // Numeric range validation
          description: "age must be an integer >= 18 if present"
        }
      }
    }
  }
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Declaring validation rules using JSON 'type' instead of BSON 'bsonType' for numeric constraints

**The mistake:** Writing the validation rule as `{ age: { type: "number" } }` instead of `{ age: { bsonType: "int" } }`.

**Why it's wrong:** The JSON Schema keyword `type: "number"` matches all numeric types, including Doubles (floats). 

If you use `type: "number"`, MongoDB will accept float values (like `age: 21.5`), violating your integer database expectations and bloating storage.

**Fix: Always use the MongoDB-specific keyword `bsonType` to specify exact binary data types on disk (e.g. `int`, `long`, `decimal`, `double`).**

---



### Mistake 2: Setting Validation Action to `warn` in Production Databases

**The mistake:** Configuring `{ validationAction: "warn" }` in production schema validation rules.

**Why it's wrong:** `validationAction: "warn"` logs a warning to server logs but ALLOWS invalid data to be inserted! Use `{ validationAction: "error" }` to reject invalid writes.

*Incorrect:*
```javascript
db.createCollection("user", { validator: { ... }, validationAction: "warn" }); // ❌ Allows invalid writes!
```

*Fix:*
```javascript
db.createCollection("user", { validator: { ... }, validationAction: "error" }); // Rejects invalid writes
```

### Mistake 3: Applying Strict `$jsonSchema` Rules to Legacy Collections Without Setting `validationLevel`

**The mistake:** Adding strict required fields to a legacy collection with 1 million existing non-conforming documents.

**Why it's wrong:** By default, updating legacy non-conforming documents fails validation. Use `validationLevel: "moderate"` so validation applies only to newly inserted or modified documents.

*Incorrect:*
```javascript
db.runCommand({ collMod: "legacy", validator: { ... }, validationLevel: "strict" }); // Fails on existing docs!
```

*Fix:*
```javascript
db.runCommand({ collMod: "legacy", validator: { ... }, validationLevel: "moderate" });
```

## 5. Practice Exercises

### Exercise 1: Enforcing Mandatory Fields with `$jsonSchema`

**Scenario:**
Add a `$jsonSchema` validation rule to collection `users` requiring fields `username` (`string`), `email` (`string`), and `age` (`number`).

**Requirements:**
1. Use `createCollection()` with `validator: { $jsonSchema: ... }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.createCollection("users", {
>   validator: {
>     $jsonSchema: {
>       bsonType: "object",
>       required: ["username", "email", "age"],
>       properties: {
>         username: { bsonType: "string", description: "must be a string" },
>         email: { bsonType: "string", pattern: "^.+@.+$", description: "must be valid email" },
>         age: { bsonType: "int", minimum: 18, description: "must be integer >= 18" }
>       }
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$jsonSchema` enforces document structural invariants directly at the database engine tier.
> 2. `required` array specifies mandatory field keys.
> 3. `bsonType` and `minimum` enforce data types and numeric range boundaries on all write operations.
> 
---

### Exercise 2: Updating Validation Rules with `collMod`

**Scenario:**
Modify existing collection `users` validation rules to require a new field `status` using `collMod`.

**Requirements:**
1. Execute `db.runCommand({ collMod: "users", validator: ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.runCommand({
>   collMod: "users",
>   validator: {
>     $jsonSchema: {
>       bsonType: "object",
>       required: ["username", "email", "status"],
>       properties: {
>         status: { enum: ["active", "pending", "suspended"] }
>       }
>     }
>   },
>   validationLevel: "strict",
>   validationAction: "error"
> });
> ```
>
> #### Technical Explanation
>
> 1. `collMod` updates collection Schema Validation rules dynamically without dropping data.
> 2. `enum` restricts field values to a specified list of allowed string values.
> 3. `validationAction: "error"` rejects invalid write attempts immediately.
> 
---

### Exercise 3: Handling Validation Failures in Write Commands

**Scenario:**
Demonstrate write rejection error output when inserting a document violating `$jsonSchema` rules.

**Requirements:**
1. Attempt invalid write and inspect `DocumentValidationFailure` exception.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> try {
>   db.users.insertOne({
>     username: "alice",
>     email: "invalid-email-format",
>     age: 15 // Violates minimum: 18
>   });
> } catch (err) {
>   console.error("Write Rejected by Schema Validator:", err.message);
> }
> ```
>
> #### Technical Explanation
>
> 1. Writes violating `$jsonSchema` rules throw `DocumentValidationFailure` (Error Code 121).
> 2. Prevents malformed or low-quality data from entering the database.
> 3. Complements application-tier Mongoose/Zod validation models.
> 
---



## 6. Related Terms

- [BSON Data Types (Overview)](../level_02/bson_data_types.md) — The target types.
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Database Migrations (MongoDB)](../level_10/database_migrations.md) — Related concept: Database Migrations (MongoDB).

---

## 7. Key Takeaways
- `$jsonSchema` enforces document structure rules at the database layer.
- Runs automatically on every database insert and update query.
- Rejects writes that violate rules, preventing data corruption.
- Supports defining required fields, data types, and regex patterns.
- Always use `bsonType` instead of JSON's standard `type` to validate exact BSON types.
- Can be configured as warning logs (`validationAction: "warn"`) during migrations.
- Serves as the database-layer equivalent to SQL column constraint rules.
