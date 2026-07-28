# Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON update operators passed to update queries to specify exact field modifications, including writing values (`$set`), removing fields (`$unset`), incrementing numbers (`$inc`), and logging dates.

---

## 1. Prerequisites
- [updateOne() / updateMany()](update.md) — The parent modification methods.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported by all document NoSQL platforms. Handled atomically by the database engine to guarantee write safety).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Confusing `$set` (Field Assignment) with `$inc` (Numeric Increment)

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

### Mistake 5: Updating Current Timestamp Fields with Client System Time instead of `$currentDate`

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

## 6. Practice Exercises

### Exercise 1: Multi-Operator Query Construction

**Problem:** You have a `products` collection. Write the query to update a single document where the `sku` is `"HAMMER-1"`. The update must:
1.  Decrement the `stock` field by `2` (hint: use `$inc` with a negative number).
2.  Set the `last_purchased` field to the current server date/timestamp.

**Expected output:**
```javascript
db.products.updateOne(
  { sku: "HAMMER-1" },
  {
    $inc: { stock: -2 },
    $currentDate: { last_purchased: true }
  }
);
```

> [!check]- Answer
> - Target the document using a query filter first.
> - Chain the `$inc` and `$currentDate` operators in the update object.

---



### Exercise 2: Updating Timestamps with `$currentDate`

**Problem:** Update `updatedAt` to current date timestamp on `user:1` using `$currentDate`.

**Expected output:**
```text
db.users.updateOne({ _id: 1 }, { $currentDate: { updatedAt: true } });
```

> [!check]- Answer
> ```javascript
> db.users.updateOne({
>   _id: 1
> }, {
>   $currentDate: { updatedAt: true }
> });
> ```
>
> **Explanation:** `$currentDate` sets target field values to current server dates or timestamps.

### Exercise 3: Setting Min/Max Field Boundaries with `$min` and `$max`

**Problem:** Update `highScore` on `game:1` to 500 ONLY if 500 is greater than current score using `$max`.

**Expected output:**
```text
db.games.updateOne({ _id: 1 }, { $max: { highScore: 500 } });
```

> [!check]- Answer
> ```javascript
> db.games.updateOne({
>   _id: 1
> }, {
>   $max: { highScore: 500 }
> });
> ```
>
> **Explanation:** `$max` updates fields ONLY if the new value is greater than existing field values.

## 7. Related Terms
- [updateOne() / updateMany()](update.md) — The parent update methods.
- `$set` vs. Whole-Document Replacement](set_vs_replace.md) — The replacement rules.

---

## 8. Key Takeaways
- Update operators modify document values atomically on the database server.
- Prevents write race conditions (like overlapping click counters) in applications.
- `$set` creates or updates fields; `$unset` deletes fields entirely.
- `$inc` performs atomic addition/subtraction on numeric fields.
- `$rename` modifies field keys without copying data.
- `$currentDate` automatically logs BSON Date timestamps.
- Do not mix query operators inside update parameters.
- Combine different update operators inside a single update document.
