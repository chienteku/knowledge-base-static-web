# Mongoose (ODM)

> **Level 10 — Administration, Security & Advanced Features**
> The Object-Document Mapper (ODM) library for MongoDB and Node.js that provides application-level schema enforcement, data validation, type casting, and middleware query lifecycle hooks, acting as the NoSQL equivalent to a relational ORM.

---

## 1. Prerequisites

- [MongoDB Node.js Driver](node_driver.md) — Official Node.js driver.

---

## 2. Term Category

**Driver / Integration** (Node.js Object Data Modeling Framework): Mongoose is the leading Node.js Object Data Modeling (ODM) library for MongoDB, providing schema validation, middleware hooks, population, and business logic abstraction.



---

## 3. Explanation

### Environment Context
- **JavaScript / Node.js** (Installed as a dependency via `npm install mongoose`. Runs inside Node.js to pre-process database queries before sending them to the MongoDB driver).

### (1) Design Motivation — "Why did we design this?"
While the raw MongoDB Node.js Driver is powerful, it is entirely schema-agnostic. 

You can write a user document with an email string to a collection, and in the next query write another user document with an array for the email field. 

This flexibility is great, but in large team projects, it leads to database inconsistency and runtime crashes in frontend applications.

In relational SQL databases, you enforce schemas on tables and often use **ORMs (Object-Relational Mappers)** like Sequelize to map rows to code objects.

We designed **Mongoose** as an **ODM (Object-Document Mapper)** to bring these modeling patterns to MongoDB. 

Instead of writing raw query filters, Mongoose allows you to define strict **Schemas** in your Node.js code. 

Mongoose acts as a filter: it validates types, sets default values, strips unrecognized fields, and runs lifecycle hooks (like hashing passwords) in application memory before the query ever reaches the database, keeping your data clean.

---

### (2) The Role of Mongoose
-   **Schema Enforcement:** Enforces structure at the application layer, even though MongoDB is schema-flexible.
-   **Type Casting:** Automatically converts types (e.g. if the schema requires a `Number` and you write `"45"` as a string, Mongoose casts it to `45`).
-   **Validation:** Rejects writes that fail range, format, or required criteria.

---

### (3) Reality Metaphor (Bowling Bumpers)
Imagine throwing a bowling ball:
-   **Raw Node.js Driver:** An open bowling lane without side bumpers. 
    -   You can throw the ball anywhere. 
    -   If your throw is wild, the ball lands in the gutter or rolls into a different lane. (Inconsistent, invalid data writes).
-   **Mongoose ODM:** Installing **Bumper Guardrails** along the sides of the lane. 
    -   No matter how poorly you throw the ball, the bumpers keep it guided down the lane, ensuring it hits the target pins. (Schema validation).

---

### (4) Code Examples

#### Connecting using Mongoose
Install the library:
`npm install mongoose`

Initialize the global connection pool:

```javascript
const mongoose = require('mongoose');

async function connectDB() {
  try {
    // Connect using Mongoose (automatically creates connection pool)
    await mongoose.connect('mongodb://localhost:27017/shop');
    console.log("Mongoose connected to MongoDB!");
  } catch (error) {
    console.error("Mongoose connection failed:", error);
  }
}

connectDB();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Mongoose schema validation with MongoDB server-side validation schema ($jsonSchema)

**The mistake:** Assuming that because you defined a `required: true` validation rule in your Mongoose schema, no user can write a document missing that field when connecting via `mongosh` or a raw database client.

**Why it's wrong:** Mongoose validation occurs **in Node.js application memory** before sending data. 

It is not enforced by the MongoDB database server. 

If an administrator runs a script in `mongosh` or uses the raw Node.js driver, they bypass Mongoose entirely, allowing invalid documents to be written and corrupting your collections.

**Fix: Rely on Mongoose for user-facing API validation. For critical production data parameters (like account balances or security roles), configure database-level Schema Validation (`$jsonSchema`) as a second line of defense.**

---



### Mistake 2: Modifying Returned Mongoose Documents Expecting Changes to Persist Without `.save()`

**The mistake:** Mutating `user.name = 'Alice'` and omitting `await user.save()`.

**Why it's wrong:** In Mongoose, mutating document properties modifies memory state only. Changes persist to MongoDB ONLY when `await doc.save()` is called.

*Incorrect:*
```javascript
const user = await User.findById(id);
user.name = "Alice"; // ❌ Not saved to database!
```

*Fix:*
```javascript
const user = await User.findById(id);
user.name = "Alice";
await user.save(); // Persists changes
```

### Mistake 3: Expecting Mongoose Schema Hooks (`pre('save')`) to Trigger on `updateMany()`

**The mistake:** Relying on `schema.pre('save')` hooks when executing `User.updateMany()`.

**Why it's wrong:** Direct query methods like `updateMany()`, `updateOne()`, and `findOneAndUpdate()` bypass Mongoose document `save` middleware hooks! Use `pre('updateMany')` or document `.save()` loops.

*Incorrect:*
```javascript
// Expecting pre('save') middleware to run during updateMany()
```

*Fix:*
```javascript
Use pre('updateMany') query middleware or update document instances
```

## 5. Practice Exercises

### Exercise 1: Defining Mongoose Schemas and Models

**Scenario:**
Define a Mongoose `User` schema and model in TypeScript with required fields (`name`, `email`), unique index, and default values.

**Requirements:**
1. Use `new Schema({ ... })` and `mongoose.model()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>("User", UserSchema);
```

> #### Technical Explanation
>
> 1. Mongoose `Schema` defines document structure, type constraints, validation, and defaults in Node.js.
> 2. `mongoose.model("User", UserSchema)` creates the compiled Model interface wrapping MongoDB CRUD commands.
> 3. Automatically maps model `"User"` to lowercased plural collection `"users"`.

---

### Exercise 2: Population of Referenced Documents with `populate()`

**Scenario:**
Query orders and populate referenced `customerId` foreign ObjectId links into full `User` subdocuments.

**Requirements:**
1. Execute `Order.find().populate("customerId")`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const orders = await Order.find({ status: "pending" })
>   .populate("customerId", "name email") // Select only name and email
>   .exec();

console.log("Populated Customer Name:", orders[0].customerId.name);
```

> #### Technical Explanation
>
> 1. `populate("field", "select")` automatically executes a secondary query to fetch referenced documents by ObjectId.
> 2. Simplifies relationship navigation in Node.js code.
> 3. Note: Executing `populate()` across large arrays issues multiple queries under the hood; consider aggregate `$lookup` for massive batches.

---

### Exercise 3: Validating Schema Rules in Express API Handlers

**Scenario:**
Handle Mongoose `ValidationError` exceptions in Express error-handling middleware.

**Requirements:**
1. Catch `err.name === "ValidationError"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> app.post("/users", async (req, res, next) => {
>   try {
>     const user = await User.create(req.body);
>     res.status(201).json(user);
>   } catch (err: any) {
>     if (err.name === "ValidationError") {
>       res.status(400).json({ error: "Validation Failed", details: err.errors });
>     } else {
>       next(err);
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. Mongoose validates document properties client-side before sending write commands to MongoDB.
> 2. Catches missing required fields or type mismatches early.
> 3. Returns structured HTTP 400 validation error payloads.

---



## 6. Related Terms

- [MongoDB Node.js Driver](node_driver.md) — The low-level driver wrapped.
- [Mongoose Schema & Model](mongoose_schema_model.md) — The core concepts.
- [Mongoose Middleware (Hooks)](mongoose_middleware.md) — Mongoose pre/post middleware.

---

## 7. Key Takeaways
- Mongoose is an ODM library that enforces schemas at the application layer.
- Direct NoSQL equivalent to SQL's Object-Relational Mappers (ORMs).
- Automatically casts incoming values to their defined schema types.
- Validates documents in Node.js RAM before compiling database writes.
- Provides helper features like pre/post middleware hooks.
- Bypassing Mongoose (via mongosh or raw driver) bypasses its validation rules.
- Set up database-level `$jsonSchema` for critical constraints defense.
