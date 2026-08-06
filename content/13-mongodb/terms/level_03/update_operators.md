# Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON update operators passed to update queries to specify exact field modifications, including writing values (`$set`), removing fields (`$unset`), incrementing numbers (`$inc`), and logging dates.

---

## 1. Prerequisites

- [`updateOne()` / `updateMany()`](update.md) — The parent modification methods.

---

## 2. Term Category

**Query Operator** (Field Mutation Operators): Update Operators ($set, $unset, $inc, $mul, $rename, $min, $max) perform targeted atomic modifications on document fields.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported by all document NoSQL platforms. Handled atomically by the database engine to guarantee write safety).

### (1) Design Motivation — "Why did we design this?"
When updating a document, you rarely want to replace the whole record. 

Suppose you have a user document containing 20 settings fields, and they click a button to increment their profile page view counter:
-   **The manual way:** You read the document into application memory, increment the counter value in JavaScript, and write the entire document back to disk. 
    -   *The Danger:* If two users click at the same time, their reads overlap. One update will overwrite the other's click count. This is a **Race Condition**.

We designed the **BSON Update Operators** to execute database updates **atomically directly on the database server.** 

Instead of reading and writing back, the application sends a command: *"Increment the `views` field by 1."* 

The database locks the record, runs the math, and saves the new value instantly, preventing race conditions and reducing network bandwidth.

---

### (2) The Five Core Update Operators

#### 1. `$set` (Write/Modify Field)
Sets the value of a field. If the field does not exist, it creates it.
-   *Syntax:* `{ $set: { status: "active", theme: "dark" } }`

#### 2. `$unset` (Remove Field)
Deletes a specified field from the document entirely. (Frees disk space).
-   *Syntax:* `{ $unset: { temporary_token: "" } }` *(The value passed is arbitrary, usually an empty string).*

#### 3. `$inc` (Numeric Math)
Increments or decrements a numeric field by a specified value.
-   *Syntax:* `{ $inc: { views: 1, inventory: -5 } }`

#### 4. `$rename` (Rename Key)
Changes the name of a field key without altering its stored value.
-   *Syntax:* `{ $rename: { nickname: "username" } }`

#### 5. `$currentDate` (Log Current Time)
Sets a field to the current date/time as a BSON Date.
-   *Syntax:* `{ $currentDate: { updated_at: true } }`

---

### (3) Reality Metaphor
Imagine editing a paper registration binder:
-   **`$set`:** Writing a phone number inside the blank **"Phone"** box.
-   **`$unset`:** Using **white-out tape** to completely erase the "Middle Name" box, leaving the paper surface clean (removing the key).
-   **`$inc`:** Clicking a mechanical **Tally Counter clicker** on your thumb to add +1 to the visitor count. You don't read the total first; you just click.

---

### (4) Code Examples

#### Combining Multiple Operators in One Update
You can chain different update operators in a single `updateOne()` statement:

```javascript
db.users.updateOne(
  { username: "alice_dev" },
  {
    $set: { status: "active" },             // Change status
    $unset: { signup_referral: "" },        // Delete referral field
    $inc: { login_count: 1 },               // Add 1 to logins
    $currentDate: { last_active: true }     // Set current date timestamp
  }
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Query Operators (like $gt) with Update Operators (like $set)

**The mistake:** Trying to use `$set` in a query filter: `db.users.find({ $set: { status: "active" } })`, or trying to use `$gt` inside an update document.

**Why it's wrong:** MongoDB separates search filters from modify actions. 
-   **Query Operators** (like `$eq`, `$gt`, `$in`) are used to **find** matching folders.
-   **Update Operators** (like `$set`, `$inc`, `$unset`) are used to **modify** the contents inside those folders.
Mixing their scopes will result in syntax and validation errors.

**Fix: Keep them separate. Only use update operators inside the update parameter (the second argument of `updateOne()` / `updateMany()`).**

---





### Mistake 2: Confusing `$set` (Field Assignment) with `$inc` (Numeric Increment)

**The mistake:** Using `$set: { views: views + 1 }` in client application updates.

**Why it's wrong:** Using `$set` for counters creates race conditions where concurrent updates overwrite each other. Use atomic `$inc: { views: 1 }`.

*Incorrect:*
```javascript
db.posts.updateOne({ _id: id }, { $set: { views: currentViews + 1 } }); // ❌ Race condition!
```

*Fix:*
```javascript
db.posts.updateOne({ _id: id }, { $inc: { views: 1 } }); // Atomic server-side increment
```



### Mistake 3: Updating Current Timestamp Fields with Client System Time instead of `$currentDate`

**The mistake:** Updating `{ $set: { updatedAt: new Date() } }` from client application servers.

**Why it's wrong:** Client application server clocks may drift. Use `$currentDate: { updatedAt: true }` to enforce server-side database timestamps.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $set: { updatedAt: new Date() } }); // Client clock drift
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $currentDate: { updatedAt: true } }); // Server-side timestamp
```



## 5. Practice Exercises

### Exercise 1: Field Multiplication with `$mul`

**Scenario:**
Apply a 10% price increase (multiply by `1.10`) to all products in category `"electronics"`.

**Requirements:**
1. Execute `updateMany()` with `$mul: { price: 1.10 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.updateMany(
>   { category: "electronics" },
>   { $mul: { price: 1.10 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$mul` multiplies numeric field values by a specified factor atomically.
> 2. If the field does not exist, `$mul` sets the field to 0.
> 3. Operates over integer, float, and decimal types.

---

### Exercise 2: Atomic Min/Max Bound Enforcement with `$min` and `$max`

**Scenario:**
Update a user's `highScore` to `250` ONLY IF `250` is greater than the current stored `highScore`.

**Requirements:**
1. Execute `updateOne()` with `$max: { highScore: 250 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $max: { highScore: 250 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$max` updates the field value ONLY IF the specified value is greater than the current stored value.
> 2. `$min` updates the field value ONLY IF the specified value is less than the current stored value.
> 3. Eliminates client-side value comparison reads.

---

### Exercise 3: Field Deletion with `$unset`

**Scenario:**
Remove obsolete field `legacyId` from all documents in collection `customers`.

**Requirements:**
1. Execute `updateMany()` with `$unset: { legacyId: "" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.updateMany(
>   { legacyId: { $exists: true } },
>   { $unset: { legacyId: "" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$unset` completely removes specified field keys from matching BSON documents.
> 2. Reclaims storage space occupied by obsolete fields.
> 3. Standard operator for schema cleanup migrations.

---



## 6. Related Terms

- [`updateOne()` / `updateMany()`](update.md) — The parent update methods.
- [Array Update Operators (`$push`, `$pull`, `$addToSet`, `$pop`, `$each`)](array_update_operators.md) — Related concept: Array Update Operators (`$push`, `$pull`, `$addToSet`, `$pop`, `$each`).
- [`$set` / `$unset` Pipeline Stages](../level_06/set_unset_stages.md) — Related concept: `$set` / `$unset` Pipeline Stages.
- [`arrayFilters` Option](../level_04/array_filters.md) — Related concept: `arrayFilters` Option.

---

## 7. Key Takeaways
- Update operators modify document values atomically on the database server.
- Prevents write race conditions (like overlapping click counters) in applications.
- `$set` creates or updates fields; `$unset` deletes fields entirely.
- `$inc` performs atomic addition/subtraction on numeric fields.
- `$rename` modifies field keys without copying data.
- `$currentDate` automatically logs BSON Date timestamps.
- Do not mix query operators inside update parameters.
- Combine different update operators inside a single update document.
