# Mongoose Schema & Model

> **Level 10 — Administration, Security & Advanced Features**
> The two core modeling concepts in Mongoose, comparing Schema (the logical blueprint defining document fields and validations) with Model (the compiled constructor class providing the database CRUD interface).

---

## 1. Prerequisites
- [Mongoose (ODM)](mongoose.md) — The parent ODM framework.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **JavaScript / Node.js** (Written in application controller modules. Models are registered globally in the Mongoose connection manager memory).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Mongoose development, you cannot write database operations without defining data shapes first. 

To organize this, Mongoose separates configuration from execution.

We design this separation using **Schemas** and **Models**. 

A **Schema** acts as the blueprint—it lists fields, types, and defaults, but has no connection to the database. 

A **Model** is the compiled class built from that schema. 

The Model is the active interface that connects to the database collection, running queries and validating documents against the schema blueprint before writing them to disk.

---

### (2) The Two Core Concepts

#### 1. Mongoose Schema (The Blueprint)
Defines the structure, BSON data types, default values, and validations for documents in a collection.
-   *Syntax:* `const userSchema = new mongoose.Schema({ ... })`
-   *Behavior:* Strictly in-memory configuration; cannot query the database.

#### 2. Mongoose Model (The Query Class)
A compiled constructor class built from the Schema blueprint. 
-   *Syntax:* `const User = mongoose.model('User', userSchema)`
-   *Behavior:* Represents a specific MongoDB collection (e.g., `'User'` automatically maps to the lowercase plural collection `"users"` on disk).
-   *Function:* Provides the query API (like `User.find()`, `User.create()`).

---

### (3) Reality Metaphor (Cookie Cutters)
-   **Mongoose Schema:** A **Blueprint Sketch** of a star-shaped cookie. 
    -   It is a drawing on paper showing dimensions, angles, and ingredients. 
    -   You cannot cook it or eat it; it is just a blueprint definition.
-   **Mongoose Model:** The physical **Metal Cookie Cutter** forged from the sketch. 
    -   You press the metal cutter into the dough (the database) to stamp out and bake physical **Cookies** (the database documents). 
    -   The cookie cutter handles the active stamping.

---

### (4) Code Examples

#### Creating a Schema and Compiling a Model
Let's model a product catalog:

```javascript
const mongoose = require('mongoose');

// 1. Define the Schema (The Blueprint)
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"], // Validation rule
    trim: true
  },
  price: {
    type: Number,
    min: [0, "Price cannot be negative"] // Numeric constraint
  },
  created_at: {
    type: Date,
    default: Date.now // Default value fallback
  }
});

// 2. Compile the Model (The Active Query Class)
// 'Product' model will automatically map to the collection 'products'
const Product = mongoose.model('Product', productSchema);

// 3. Use the Model to execute CRUD operations
async function createProduct() {
  try {
    // Inserts document (automatically validates against schema!)
    const laptop = await Product.create({
      name: "   Developer Laptop   ", // Will be trimmed to "Developer Laptop"
      price: 1200
    });
    console.log("Saved Laptop:", laptop);
  } catch (error) {
    console.error("Validation failed:", error.message);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to call query methods (like find or create) directly on a Schema object instead of the compiled Model

**The mistake:** Writing code like `productSchema.find({ price: { $gt: 100 } })` to search products.

**Why it's wrong:** The Schema class is just a configuration definition. 

It does not connect to collections or speak to the database driver, so calling query methods on it throws a `TypeError: productSchema.find is not a function` crash.

**Fix: Always compile the Schema into a Model first, and run your queries strictly on that Model class.**

```javascript
// CORRECT
const Product = mongoose.model('Product', productSchema);
const items = await Product.find({ price: { $gt: 100 } });
```

---



### Mistake 2: Confusing Mongoose Model Names with Actual MongoDB Collection Names

**The mistake:** Defining `mongoose.model('Person', schema)` expecting collection name to be `Person`.

**Why it's wrong:** Mongoose automatically lowercases and pluralizes model names! Model `'Person'` connects to collection `'people'`. Explicitly specify collection name if needed.

*Incorrect:*
```javascript
mongoose.model("Person", schema); // Connects to 'people' collection
```

*Fix:*
```javascript
mongoose.model("Person", schema, "person"); // Explicit collection name 'person'
```

### Mistake 3: Defining Virtual Properties without Configuring `{ toJSON: { virtuals: true } }`

**The mistake:** Defining virtual `fullName` and expecting `JSON.stringify(doc)` or API responses to include `fullName`.

**Why it's wrong:** Virtual properties are excluded from JSON output by default. Configure `{ toJSON: { virtuals: true } }` in schema options.

*Incorrect:*
```javascript
const schema = new Schema({ first: String, last: String }); // Virtual fullName omitted in JSON!
```

*Fix:*
```javascript
const schema = new Schema({ ... }, { toJSON: { virtuals: true } });
```

## 6. Practice Exercises

### Exercise 1: Model Compilation

**Problem:** Write the Mongoose code block to:
1.  Define a schema named `blogSchema` containing a required string field `title` and a string field `body`.
2.  Compile the schema into a model named `Blog` (state what collection name this model will map to on MongoDB).

**Expected output:**
```javascript
// 1. Schema definition
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String }
});

// 2. Model compilation
const Blog = mongoose.model('Blog', blogSchema);
// The model will map to the collection "blogs" on MongoDB.
```

> [!check]- Answer
> - Use the `new mongoose.Schema` constructor for the blueprint.
> - Pass the model string name `"Blog"` to `mongoose.model` to trigger plural collection mapping.

---



### Exercise 2: Defining Virtual Getter Property

**Problem:** Define virtual property `fullName` concatenating `first` and `last` name fields.

**Expected output:**
```text
userSchema.virtual('fullName').get(function() { return `${this.first} ${this.last}`; });
```

> [!check]- Answer
> ```javascript
> userSchema.virtual('fullName').get(function() {
>   return `${this.first} ${this.last}`;
> });
> ```
>
> **Explanation:** Virtual properties compute dynamic fields without persisting data to database storage.

### Exercise 3: Schema Instance Methods vs Static Methods

**Problem:** Compare: `methods` (functions attached to document instances); `statics` (functions attached to Model class).

**Expected output:**
```text
methods: document instance functions; statics: Model class query helper functions
```

> [!check]- Answer
> ```text
> methods: document instance functions; statics: Model class query helper functions
> ```
>
> **Explanation:** Instance methods operate on `this` document; statics operate on the collection Model.

## 7. Related Terms
- [Mongoose (ODM)](mongoose.md) — The parent ODM framework.
- [Mongoose Middleware (Hooks)](mongoose_middleware.md) — Lifecycle hooks.

---

## 8. Key Takeaways
- The Schema is the blueprint defining document fields, types, and constraints.
- The Model is the compiled class used to perform collection CRUD operations.
- Schemas run in-memory; they cannot connect or query the database.
- Models map model names (e.g. `'User'`) to plural collections (`"users"`).
- Calling query methods on Schema definitions triggers `TypeError` crashes.
- Models automatically validate document formats before executing database writes.
- Export compiled Models from schema files to share them across controllers.
