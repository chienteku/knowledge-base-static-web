# Mongoose Middleware (Hooks)

> **Level 10 — Administration, Security & Advanced Features**
> The Mongoose feature that intercepts asynchronous document operations to run pre-processing logic (like password hashing before `save`) or post-processing logic (like email dispatches), serving as the application-layer equivalent of SQL database triggers.

---

## 1. Prerequisites
- [Mongoose Schema & Model](mongoose_schema_model.md) — The parent modeling blueprint.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **JavaScript / Node.js** (Executed inside the Node.js application process thread during the Mongoose document lifecycle, preceding BSON compilation).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Slug Generation Middleware

**Problem:** You have a `Article` schema. You want to generate a URL-friendly `slug` from the `title` field automatically before validation.
Example title: `"My First Post"` should become slug: `"my-first-post"`.
Write the `pre` middleware code block for the `articleSchema` using standard function syntax. Assume you have access to a helper function `slugify(text)` that performs the string conversion.

**Expected output:**
```javascript
articleSchema.pre('validate', function(next) {
  const article = this;
  if (article.isModified('title') && article.title) {
    article.slug = slugify(article.title);
  }
  next();
});
```

> [!check]- Answer
> - Hook into the `'validate'` event (which runs before the validation check).
> - Refer to the current document using the `this` keyword inside a standard function scope.

---



### Exercise 2: Password Hashing Pre-Save Hook

**Problem:** Write Mongoose `pre('save')` hook hashing `password` if modified using bcrypt.

**Expected output:**
```text
userSchema.pre('save', async function() { if (this.isModified('password')) { this.password = await bcrypt.hash(this.password, 10); } });
```

> [!check]- Answer
> ```javascript
> userSchema.pre('save', async function() {
>   if (this.isModified('password')) {
>     this.password = await bcrypt.hash(this.password, 10);
>   }
> });
> ```
>
> **Explanation:** `this.isModified('password')` checks if the password field was changed before hashing.

### Exercise 3: Post-Remove Cleanup Hook

**Problem:** Write `post('findOneAndDelete')` hook deleting user orders after user removal.

**Expected output:**
```text
userSchema.post('findOneAndDelete', async function(doc) { if (doc) { await Order.deleteMany({ userId: doc._id }); } });
```

> [!check]- Answer
> ```javascript
> userSchema.post('findOneAndDelete', async function(doc) {
>   if (doc) {
>     await Order.deleteMany({ userId: doc._id });
>   }
> });
> ```
>
> **Explanation:** Post hooks execute after query operations complete to handle cascading cleanups.

## 7. Related Terms
- [Mongoose Schema & Model](mongoose_schema_model.md) — The parent modeling blueprint.

---

## 8. Key Takeaways
- Mongoose Middleware intercepts asynchronous operations during the lifecycle.
- Direct application-layer equivalent to database SQL trigger constraints.
- `pre` hooks run before operations; `post` hooks run after operations succeed.
- Used for password encryption, field normalization, and event logging.
- Do not use ES6 arrow functions for hooks; they break the `this` document binding.
- Always call `next()` or return a Promise to prevent query execution hangs.
- Bypassing Mongoose (via mongosh) bypasses these middleware triggers.
