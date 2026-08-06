# Mongoose Middleware (Hooks)

> **Level 10 — Administration, Security & Advanced Features**
> The Mongoose feature that intercepts asynchronous document operations to run pre-processing logic (like password hashing before `save`) or post-processing logic (like email dispatches), serving as the application-layer equivalent of SQL database triggers.

---

## 1. Prerequisites

- [Mongoose Schema & Model](mongoose_schema_model.md) — The parent modeling blueprint.

---

## 2. Term Category

**Driver / Integration** (Mongoose Lifecycle Hooks & Interceptors): Mongoose Middleware (pre/post hooks) intercept schema execution calls (`validate`, `save`, `updateOne`, `find`) to automate password hashing, auditing, and cascading updates.



---

## 3. Explanation

### Environment Context
- **JavaScript / Node.js** (Executed inside the Node.js application process thread during the Mongoose document lifecycle, preceding BSON compilation).

### (1) Design Motivation — "Why did we design this?"
When writing applications, certain business rules must occur automatically on database changes:
-   **Security:** Hashing a user's password before writing it to disk.
-   **Data normalization:** Generating a URL slug from a blog post title before saving.
-   **logging:** Logging user status changes after an update completes.

In SQL databases, you write database-level **Triggers** to execute these actions.

We designed **Mongoose Middleware (Hooks)** to handle this at the application layer. 

Middleware allows you to intercept the document lifecycle at specific execution checkpoints (before validation, before saving to disk, or after updates), executing custom JavaScript logic automatically.

---

### (2) Pre and Post Hooks

#### 1. Pre-Hooks (`schema.pre`)
Run **before** the database operation executes.
-   *Usage:* Modifying document fields (like password encryption) or validating business conditions.
-   *Trigger Example:* `schema.pre('save', async function() { ... })`

#### 2. Post-Hooks (`schema.post`)
Run **after** the database operation has completed successfully.
-   *Usage:* Sending emails, logging actions, or trigger secondary calculations.
-   *Trigger Example:* `schema.post('save', function(doc) { ... })`

---

### (3) Critical Rule: Arrow Function Danger
When defining Mongoose middleware, **you must use standard function declarations (`function()`) instead of ES6 arrow functions (`() => {}`).**
-   Mongoose binds the `this` keyword to the **current document being processed**.
-   ES6 arrow functions bind `this` lexically to the surrounding module scope.
-   If you use an arrow function, `this` will be `undefined` or point to the global module, causing your app to crash when you attempt to read fields (`this.password`).

---

### (4) Reality Metaphor (Filing Clerks)
-   **Pre-Save Middleware:** An assistant standing in front of the filing cabinet. 
    -   Before placing a customer's folder in the drawer, they check the password line, translate it into code language (hashing), and write the code on the page. (Alters the document before storage).
-   **Post-Save Middleware:** An assistant sitting next to the cabinet. 
    -   The second a folder slides inside the drawer, they send a text message to the customer: *"Your account has been registered successfully!"* (Triggers after storage).

---

### (5) Code Examples

#### Password Hashing in Pre-Save Middleware
Let's encrypt user passwords automatically before saving them to disk:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Password encryption helper

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
});

// Enforce a Pre-Save Hook (Encrypt password before writing to disk!)
// WARNING: Do NOT use an arrow function here!
userSchema.pre('save', async function(next) {
  // 'this' refers to the document being saved
  const user = this;

  // Only hash the password if it has been modified or is new
  if (!user.isModified('password')) return next();

  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next(); // Hand control to the next step
  } catch (error) {
    next(error); // Pass errors to abort save
  }
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using ES6 arrow functions (() => {}) to define Mongoose pre-save middleware, causing 'this' context bindings to fail

**The mistake:** Declaring a pre-save hook as `userSchema.pre('save', async () => { this.updated_at = new Date(); })`.

**Why it's wrong:** Arrow functions bind `this` lexically. 

The compiler cannot map `this` to the user document object. 

Running this code will crash with the error: `TypeError: Cannot set property 'updated_at' of undefined`.

**Fix: Always use standard function definitions (`function()`) to preserve the Mongoose document bindings context.**

---



### Mistake 2: Forgetting to Call `next()` or Return Promises in Async Mongoose Middleware

**The mistake:** Writing `schema.pre('save', function() { doSomething(); })` without calling `next()` or returning a Promise.

**Why it's wrong:** In non-async callback middleware, failing to call `next()` hangs document save operations indefinitely.

*Incorrect:*
```javascript
schema.pre("save", function(next) {
  doAsyncWork(); // ❌ Never calls next()!
});
```

*Fix:*
```javascript
schema.pre("save", async function() {
  await doAsyncWork(); // Async functions automatically return Promises
});
```

### Mistake 3: Using Arrow Functions `() => {}` in Mongoose Hooks Requiring `this` Binding

**The mistake:** Writing `schema.pre('save', () => { this.password = hash(this.password); })`.

**Why it's wrong:** Arrow functions do NOT bind `this` to the Mongoose document instance! `this` evaluates to `undefined`. Use standard `function()` syntax.

*Incorrect:*
```javascript
schema.pre("save", () => { this.updatedAt = new Date(); }); // ❌ this is undefined!
```

*Fix:*
```javascript
schema.pre("save", function() { this.updatedAt = new Date(); }); // Correct function binding
```

## 5. Practice Exercises

### Exercise 1: Pre-Save Password Hashing Middleware Hooks

**Scenario:**
Implement a Mongoose `pre("save")` hook that automatically hashes user passwords using `bcrypt` before saving to MongoDB.

**Requirements:**
1. Register `UserSchema.pre("save", async function() { ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import bcrypt from "bcrypt";

UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

> #### Technical Explanation
>
> 1. `pre("save")` hooks intercept `doc.save()` calls before write commands execute.
> 2. `this.isModified("password")` checks if the password field was altered, preventing redundant re-hashing on profile updates.
> 3. Encapsulates security logic inside schema definitions.

---

### Exercise 2: Post-Remove Cascading Cleanup Hooks

**Scenario:**
Implement a Mongoose `post("deleteOne")` middleware hook to automatically delete associated user posts when a user is removed.

**Requirements:**
1. Register `UserSchema.post("deleteOne", async function(doc) { ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> UserSchema.post("deleteOne", { document: true, query: false }, async function() {
>   await Post.deleteMany({ userId: this._id });
>   console.log(`Cascaded deletion of posts for user ${this._id}`);
> });
> ```
>
> #### Technical Explanation
>
> 1. `post()` hooks execute after target operations complete successfully.
> 2. Automates cascading deletes across related collections.
> 3. Maintains referential integrity at the application tier.

---

### Exercise 3: Query Middleware vs Document Middleware Contexts

**Scenario:**
Explain why `this` in `pre("updateOne")` refers to the Query object rather than the Document instance.

**Requirements:**
1. Contrast document middleware (`save`) vs query middleware (`updateOne`).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Query Middleware Hook (this = Mongoose Query object)
> UserSchema.pre("updateOne", function() {
>   const update = this.getUpdate() as any;
>   update.$set = update.$set || {};
>   update.$set.updatedAt = new Date();
> });
> ```
>
> #### Technical Explanation
>
> 1. Query middleware (`updateOne`, `find`) operates on the query filter without loading documents into Node.js memory (`this` = Query).
> 2. Document middleware (`save`, `validate`) operates on instantiated document instances (`this` = Document).
> 3. Critical distinction when authoring Mongoose hooks.

---



## 6. Related Terms

- [Mongoose Schema & Model](mongoose_schema_model.md) — The parent modeling blueprint.
- [Mongoose (ODM)](mongoose.md) — Related concept: Mongoose (ODM).

---

## 7. Key Takeaways
- Mongoose Middleware intercepts asynchronous operations during the lifecycle.
- Direct application-layer equivalent to database SQL trigger constraints.
- `pre` hooks run before operations; `post` hooks run after operations succeed.
- Used for password encryption, field normalization, and event logging.
- Do not use ES6 arrow functions for hooks; they break the `this` document binding.
- Always call `next()` or return a Promise to prevent query execution hangs.
- Bypassing Mongoose (via mongosh) bypasses these middleware triggers.
