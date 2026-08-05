# Schema Validation (`$jsonSchema`)

> **Level 5 — Data Modeling & Schema Design**
> MongoDB's database-level enforcement mechanism that validates document structures, required fields, data types, and value constraints on inserts and updates using standard JSON Schema rules.

---

## 1. Prerequisites

- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [BSON Data Types (Overview)](../level_02/bson_data_types.md) — The target types validated.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **MongoDB Core** (Checked during the write pipeline on the database server. Aborts writes and rolls back changes if validations fail).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Validation Rule Construction

**Problem:** You want to create a `products` collection. The schema validation must enforce:
1.  The `title` field is required and must be a BSON `string`.
2.  The `price` field is required and must be a BSON `decimal` (Decimal128).
Write the `db.createCollection` command.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.createCollection("products", {
>   validator: {
>     $jsonSchema: {
>       bsonType: "object",
>       required: [ "title", "price" ],
>       properties: {
>         title: {
>           bsonType: "string"
>         },
>         price: {
>           bsonType: "decimal"
>         }
>       }
>     }
>   }
> });
> ```
> - Add `title` and `price` to the `required` array list.
> - Specify the exact BSON type aliases `"string"` and `"decimal"` under properties.

---



### Exercise 2: Adding `$jsonSchema` Validation Rule

**Problem:** Create collection `account` requiring `email` (string) and `balance` (number).

**Expected output:**
> [!check]- Answer
> ```text
> db.createCollection("account", { validator: { $jsonSchema: { required: ["email", "balance"], properties: { email: { bsonType: "string" }, balance: { bsonType: ["int", "double", "decimal"] } } } } });
> ```
> ```javascript
> db.createCollection("account", {
>   validator: {
>     $jsonSchema: {
>       bsonType: "object",
>       required: ["email", "balance"],
>       properties: {
>         email: { bsonType: "string" },
>         balance: { bsonType: ["int", "double", "decimal"] }
>       }
>     }
>   }
> });
> ```
>
> **Explanation:** `$jsonSchema` enforces database-level type validation on document insertions.

---

### Exercise 3: Modifying Schema Validator with `collMod`

**Problem:** Command to update schema validator rules on existing collection `account` (`collMod`).

**Expected output:**
> [!check]- Answer
> ```text
> db.runCommand({ collMod: "account", validator: { ... } });
> ```
> ```javascript
> db.runCommand({
>   collMod: "account",
>   validator: { $jsonSchema: { ... } }
> });
> ```
>
> **Explanation:** `collMod` updates validator rules on active collections without dropping data.

## 7. Related Terms

- [BSON Data Types (Overview)](../level_02/bson_data_types.md) — The target types.
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Database Migrations (MongoDB)](../level_10/database_migrations.md) — Related concept: Database Migrations (MongoDB).

---

## 8. Key Takeaways
- `$jsonSchema` enforces document structure rules at the database layer.
- Runs automatically on every database insert and update query.
- Rejects writes that violate rules, preventing data corruption.
- Supports defining required fields, data types, and regex patterns.
- Always use `bsonType` instead of JSON's standard `type` to validate exact BSON types.
- Can be configured as warning logs (`validationAction: "warn"`) during migrations.
- Serves as the database-layer equivalent to SQL column constraint rules.
