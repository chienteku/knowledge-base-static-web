# Mongoose Schema & Model

> **Level 10 — Administration, Security & Advanced Features**
> The two core modeling concepts in Mongoose, comparing Schema (the logical blueprint defining document fields and validations) with Model (the compiled constructor class providing the database CRUD interface).

---

## 1. Prerequisites

- [Mongoose (ODM)](mongoose.md) — The parent ODM framework.

---

## 2. Term Category

**Driver / Integration** (Mongoose Document Schema & Model Mapping): Mongoose Schemas & Models define document structure constraints, default values, virtual properties, and collection wrapper methods for Node.js applications.



---

## 3. Explanation

### Environment Context
- **JavaScript / Node.js** (Written in application controller modules. Models are registered globally in the Mongoose connection manager memory).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Computing Virtual Properties with Mongoose

**Scenario:**
Define a Mongoose virtual property `fullName` that concatenates `firstName` and `lastName` without storing `fullName` in MongoDB.

**Requirements:**
1. Define `UserSchema.virtual("fullName").get(function() { ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> UserSchema.virtual("fullName").get(function() {
>   return `${this.firstName} ${this.lastName}`;
> });
> 
> UserSchema.set("toJSON", { virtuals: true });
> ```
>
> #### Technical Explanation
>
> 1. Virtual properties are dynamic getter/setter attributes computed on the fly in Node.js.
> 2. Do not consume BSON disk storage in MongoDB collections.
> 3. Included in `toJSON()` API responses when `virtuals: true` is configured.

---

### Exercise 2: Defining Custom Instance and Static Model Methods

**Scenario:**
Add a custom instance method `verifyPassword()` and static model method `findByEmail()` to a Mongoose schema.

**Requirements:**
1. Attach methods to `UserSchema.methods` and `UserSchema.statics`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Instance Method (operates on document instance)
> UserSchema.methods.verifyPassword = async function(candidatePassword: string) {
>   return await bcrypt.compare(candidatePassword, this.password);
> };
> 
> // Static Method (operates on Model collection)
> UserSchema.statics.findByEmail = function(email: string) {
>   return this.findOne({ email: email.toLowerCase() });
> };
> ```
>
> #### Technical Explanation
>
> 1. `methods` attach custom helper functions to document instances (`user.verifyPassword()`).
> 2. `statics` attach custom query helpers directly to the compiled Model (`User.findByEmail()`).
> 3. Promotes Active Record business logic encapsulation.

---

### Exercise 3: Defining Custom Schema Field Validators

**Scenario:**
Add a custom regex validator ensuring `phone` strings conform to valid US phone number formats.

**Requirements:**
1. Add `validate` object to field definition.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const UserSchema = new Schema({
>   phone: {
>     type: String,
>     validate: {
>       validator: (v: string) => /^\d{3}-\d{3}-\d{4}$/.test(v),
>       message: (props: any) => `${props.value} is not a valid phone number (XXX-XXX-XXXX)!`
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. Custom `validate` functions evaluate field inputs before saving documents to MongoDB.
> 2. Returns custom error messages on validation failure.
> 3. Enforces domain data validation in Mongoose.

---



## 6. Related Terms

- [Mongoose (ODM)](mongoose.md) — The parent ODM framework.
- [Mongoose Middleware (Hooks)](mongoose_middleware.md) — Lifecycle hooks.

---

## 7. Key Takeaways
- The Schema is the blueprint defining document fields, types, and constraints.
- The Model is the compiled class used to perform collection CRUD operations.
- Schemas run in-memory; they cannot connect or query the database.
- Models map model names (e.g. `'User'`) to plural collections (`"users"`).
- Calling query methods on Schema definitions triggers `TypeError` crashes.
- Models automatically validate document formats before executing database writes.
- Export compiled Models from schema files to share them across controllers.
