# Mongoose (MongoDB ODM)

> **Level 8 — Database Integration**
> The concrete ODM; makes the generic ORM/ODM term tangible.

---

## 1. Prerequisites
- [ORMs & ODMs](./orms_odms.md) — The theoretical concept behind mapping data objects.
- [SQL vs NoSQL](./sql_vs_nosql.md) — Understanding document-based MongoDB storage.

---

## 2. Term Category
- **Database / Third-Party Library**

---

## 3. Environment Context
- **Web App Server Layer** (Bridges Node.js application models to a MongoDB database).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Schema Construction

**Problem:** Complete the product schema below to require a name, a description, and a price that cannot be negative:

```javascript
const mongoose = require('mongoose');

// Solution Schema:
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
});

const Product = mongoose.model('Product', ProductSchema);
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Defining Mongoose Schema and Model

**Problem:** Define Mongoose schema for `User` with required string `email` and default boolean `isActive: true`.

**Expected output:**
> [!check]- Answer
> ```text
> const userSchema = new mongoose.Schema({ email: { type: String, required: true }, isActive: { type: Boolean, default: true } }); const User = mongoose.model('User', userSchema);
> ```
> ```javascript
> const userSchema = new mongoose.Schema({
>   email: { type: String, required: true },
>   isActive: { type: Boolean, default: true }
> });
> const User = mongoose.model('User', userSchema);
> ```
>
> **Explanation:** Mongoose schemas define MongoDB document structures, validations, and default values.

---

### Exercise 3: Populating Mongoose References

**Problem:** Use Mongoose `.populate()` to load `author` reference on `Post.find()` query.

**Expected output:**
> [!check]- Answer
> ```text
> const posts = await Post.find().populate('author');
> ```
> ```javascript
> const posts = await Post.find().populate('author');
> ```
>
> **Explanation:** `.populate()` replaces ObjectId references with actual referenced document data.

## 7. Related Terms
- [ORMs & ODMs](./orms_odms.md) — The general concept of bridging databases to object logic.
- [SQL vs NoSQL](./sql_vs_nosql.md) — The database engines mapped by Mongoose.

---

## 8. Key Takeaways
- Mongoose is a schema-validation ODM library for MongoDB and Node.js.
- MongoDB is natively schema-less; Mongoose enforces consistency at the application layer.
- A Mongoose Schema defines the structure, validations, and default values.
- A Mongoose Model is compiled from a Schema to perform CRUD database queries.
- Mongoose schema validations occur in the Node application process, not MongoDB itself.
- Schema casting automatically converts string types (like dates and numbers) to their schema equivalents.
