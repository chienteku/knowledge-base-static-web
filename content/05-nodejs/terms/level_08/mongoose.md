# Mongoose (MongoDB ODM)

> **Level 8 — Database Integration**
> The concrete ODM; makes the generic ORM/ODM term tangible.

---

## 1. Prerequisites
- [ORMs & ODMs](orms_odms.md) — The theoretical concept behind mapping data objects.
- [SQL vs NoSQL](sql_vs_nosql.md) — Understanding document-based MongoDB storage.

---

## 2. Term Category

**Database / Third-Party Library (Web App Server Layer .)**: Mongoose (MongoDB ODM) is a fundamental concept in this technology stack. **Level 8 — Database Integration**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
MongoDB is a document database. By design, MongoDB is **schema-less**, meaning documents in the same collection do not need to share the same structure. 

While this offers great flexibility, in production systems it can lead to inconsistent data, corrupt documents, or security issues if developers write malformed entries to the database.

To enforce data consistency without losing the flexibility of MongoDB, Node.js developers use **Mongoose**:
-   **Mongoose:** An **ODM (Object Document Mapper)** for MongoDB.
-   **Schemas:** You define a Javascript blueprint (Schema) specifying fields, data types, validators, and defaults.
-   **Models:** You compile the Schema into a Model (a constructor class representing the MongoDB collection). All CRUD queries (like `.find()`, `.create()`) are performed through this Model.
-   **Features:** Mongoose automatically runs validators before saving data to MongoDB, casts inputs (e.g. converting a string `"2026-07-18"` into a proper Date object), and manages the MongoDB connection pool in the background.

---

### (2) Reality Metaphor
Imagine building a residential community.
- **Raw MongoDB (A Zero-Zoning Plot):** A plot of land where you can build anything you want. You can construct a skyscraper, a treehouse, or dig a mud pit right next to each other. It is fast to build, but it's highly disorganized and potentially unsafe.
- **Mongoose (The Zoning Permit Office):** A strict building inspector sitting at the gate. Before you lay a single brick of your building (**saving a document**), the inspector compares your blueprint against the master plans (**the Schema**). If you forget to include a door (**required field**) or have the wrong wall heights (**validation types**), the inspector rejects the construction, throwing a validation error instead.

---

### (3) JavaScript Implementation Example

```javascript
const mongoose = require('mongoose');

// 1. Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/my_app')
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('Connection failed:', err));

// 2. Define a Schema with types and validations
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 3. Compile the Schema into a Model
const User = mongoose.model('User', UserSchema);

// 4. Usage in Route / Service
async function createUser(data) {
  try {
    const newUser = new User(data);
    const savedUser = await newUser.save(); // Triggers Mongoose validation!
    console.log("Saved User:", savedUser);
  } catch (err) {
    console.error("Validation Failed:", err.message);
  }
}

createUser({ username: "Jo", email: "jo@example.com" }); 
// Output: Validation Failed: User validation failed: username: Username must be at least 3 characters long
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming Mongoose validations are enforced inside the database engine

**The mistake:** Thinking MongoDB itself blocks invalid data formats because Mongoose has a schema validator configured.

**Why it's wrong:** Mongoose is an **application-level library**. The schema validation happens inside the Node.js application process *before* the data is sent across the network to MongoDB. If you use a raw MongoDB driver bypass, connect via a GUI tool (like MongoDB Compass), or disable Mongoose validations, you can write invalid data to the database without warnings.

*Fix:* Centralize database writes through Mongoose models. If you have multiple services, duplicate schemas or configure MongoDB's native JSON Schema validation rules inside the database.

---



### Mistake 2: Modifying Returned Mongoose Documents Without Saving (`doc.save()`)

**The mistake:** Writing `const user = await User.findById(id); user.name = 'Bob';` without calling `await user.save()`.

**Why it's wrong:** Modifying JavaScript properties on a Mongoose document object mutates local memory only. You MUST call `await user.save()` to write changes to MongoDB.

*Incorrect:*
```javascript
const user = await User.findById(id);
user.status = 'active'; // ❌ Not saved to MongoDB database!
```

*Fix:*
```javascript
const user = await User.findById(id);
user.status = 'active';
await user.save(); // Persists changes to MongoDB
```

### Mistake 3: Failing to Use `.lean()` for Read-Only Mongoose Queries (Performance Bottleneck)

**The mistake:** Fetching 10,000 documents via `User.find()` without `.lean()` when only reading data.

**Why it's wrong:** By default, Mongoose wraps returned documents in heavy Mongoose Document instances (with change tracking, getters/setters). Calling `.lean()` returns plain JavaScript objects, running 5x faster.

*Incorrect:*
```javascript
const users = await User.find(); // ❌ Heavy Mongoose Document wrapper memory overhead!
```

*Fix:*
```javascript
const users = await User.find().lean(); // Fast plain JS objects
```

## 5. Practice Exercises

### Exercise 1: Mongoose Schema Definition & Virtual Field Decorator

**Scenario:** Defines a MongoDB Mongoose document schema with field validation rules, default timestamps, and virtual property getters.

**Requirements:**
1. Write createProductSchema(SchemaClass).
2. Define name, price, stock fields.
3. Attach virtual `isAvailable` getter.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createProductSchema(SchemaClass) {
>   const Schema = SchemaClass || require("mongoose").Schema;
>
>   const productSchema = new Schema(
>     {
>       name: { type: String, required: true, trim: true },
>       price: { type: Number, required: true, min: 0 },
>       stock: { type: Number, default: 0, min: 0 }
>     },
>     { timestamps: true }
>   );
>
>   productSchema.virtual("isAvailable").get(function () {
>     return this.stock > 0;
>   });
>
>   return productSchema;
> }
>
> // Verification tests
> const SchemaMock = function (def, opts) {
>   this.def = def;
>   this.opts = opts;
>   this.virtuals = {};
>   this.virtual = (name) => ({
>     get: (fn) => { this.virtuals[name] = fn; }
>   });
> };
>
> const schema = createProductSchema(SchemaMock);
> console.assert(schema.def.name.required === true, "Test 1 Failed");
> console.assert(typeof schema.virtuals["isAvailable"] === "function", "Test 2 Failed: Registered virtual property getter");
> ```
>
> #### Technical Explanation
>
> 1. **Mongoose Schema Validation**: Provides strict schema enforcement (types, min/max, required, regex) over schemaless MongoDB collections.
> 2. **Mongoose Virtual Properties**: Computed fields (`fullName`, `isAvailable`) evaluated dynamically at runtime without taking up database storage space.
> 3. **Automatic Timestamps**: `{ timestamps: true }` automatically manages `createdAt` and `updatedAt` Date fields.
> 
---

### Exercise 2: Mongoose Query Population & Lean Execution

**Scenario:** Executes Mongoose populate queries (`User.find().populate('orders')`) with `.lean()` optimization for read-heavy JSON APIs.

**Requirements:**
1. Write fetchUserOrdersPopulated(userModelMock, userId).
2. Call `find({ _id: userId })`.
3. Chain `.populate('orders')` and `.lean()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchUserOrdersPopulated(userModelMock, userId) {
>   const query = userModelMock.findOne({ _id: userId });
>   query.populate("orders");
>   query.lean();
>
>   const user = await query.exec();
>   return {
>     isPlainObject: user ? user.constructor.name === "Object" : false,
>     user
>   };
> }
>
> // Verification tests
> const mockUser = { id: 42, orders: [{ id: 101 }] };
> const userModelMock = {
>   findOne: () => ({
>     populate() { return this; },
>     lean() { return this; },
>     exec: async () => mockUser
>   })
> };
>
> fetchUserOrdersPopulated(userModelMock, 42).then(res => {
>   console.assert(res.isPlainObject === true, "Test 1 Failed: .lean() returned plain JS object");
>   console.assert(res.user.orders.length === 1, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Mongoose `.populate()`**: Performs automatic document join operations between MongoDB collections based on `ref` ObjectIds.
> 2. **Mongoose `.lean()` Performance Optimization**: Bypasses instantiating heavy Mongoose Document class wrappers, returning high-performance plain JavaScript objects.
> 3. **Read-Only Query Best Practice**: Always use `.lean()` on read-only REST API query endpoints to reduce RAM usage and CPU overhead.
> 
---

### Exercise 3: Mongoose Pre-Save Document Hook for Hashing

**Scenario:** Attaches a `pre('save')` document middleware hook to a Mongoose user schema to hash passwords prior to database insertion.

**Requirements:**
1. Write attachPreSaveHook(schemaMock, hashFn).
2. Check if `isModified('password')`.
3. Hash password and call `next()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function attachPreSaveHook(schemaMock, hashFn) {
>   schemaMock.pre("save", async function (next) {
>     if (!this.isModified("password")) {
>       return next();
>     }
>
>     try {
>       this.password = await hashFn(this.password);
>       next();
>     } catch (err) {
>       next(err);
>     }
>   });
> }
>
> // Verification tests
> let preFn = null;
> const mockSchema = {
>   pre: (event, fn) => { preFn = fn; }
> };
>
> const mockDoc = {
>   password: "raw_secret_pass",
>   isModified: () => true
> };
>
> attachPreSaveHook(mockSchema, async (pwd) => `hashed_${pwd}`);
>
> let nextCalled = false;
> preFn.call(mockDoc, () => { nextCalled = true; }).then(() => {
>   console.assert(mockDoc.password === "hashed_raw_secret_pass", "Test 1 Failed: Password hashed");
>   console.assert(nextCalled === true, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Mongoose Document Hooks**: Middleware functions executed during document lifecycle (`save`, `validate`, `remove`).
> 2. **`this.isModified()` Guard**: Prevents re-hashing already hashed passwords when updating unrelated fields (e.g. `email`).
> 3. **Asynchronous Hook Errors**: Passing errors to `next(err)` inside pre hooks aborts document save operation.
## 6. Related Terms
- [ORMs & ODMs](orms_odms.md) — The general concept of bridging databases to object logic.
- [SQL vs NoSQL](sql_vs_nosql.md) — The database engines mapped by Mongoose.

---

## 7. Key Takeaways
- Mongoose is a schema-validation ODM library for MongoDB and Node.js.
- MongoDB is natively schema-less; Mongoose enforces consistency at the application layer.
- A Mongoose Schema defines the structure, validations, and default values.
- A Mongoose Model is compiled from a Schema to perform CRUD database queries.
- Mongoose schema validations occur in the Node application process, not MongoDB itself.
- Schema casting automatically converts string types (like dates and numbers) to their schema equivalents.
