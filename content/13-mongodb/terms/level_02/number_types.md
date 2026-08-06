# Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)

> **Level 2 — BSON Data Types & Document Structure**
> The four numeric data types supported by BSON, optimizing storage and calculation speeds for integers, floats, and high-precision financial decimals.

---

## 1. Prerequisites

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type catalog.

---

## 2. Term Category

**Core Concept** (Numeric BSON Types): Numeric Types in BSON encompass Int32 (32-bit integer), Int64 (64-bit long), Double (64-bit float), and Decimal128 (128-bit decimal).



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (JavaScript/Node.js defaults to Double for all numbers; driver wrapper constructors are required to enforce Int32, Long, or Decimal128 in database writes).

### (1) Design Motivation — "Why did we design this?"
Standard **JSON** has only one generic `Number` type, which is interpreted as a double-precision floating-point number.

However, a production database engine cannot rely on a single float type:
-   **Storage waste:** Storing a small status counter (like `0` or `1`) as a 64-bit float wastes disk space.
-   **Precision bugs:** Floating-point numbers suffer from binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). If you run a bank or e-commerce store using floats, customer balances will drift by fractions of a cent, violating financial regulations.

We designed the **BSON Number Types** to provide specialized storage:

1.  **Double (64-bit Float):** The default type. Excellent for coordinates and general fractions.
2.  **Int32 (32-bit Integer):** Stores whole numbers up to $\pm 2$ billion. Efficient and compact (4 bytes).
3.  **Int64 / Long (64-bit Integer):** Stores massive whole numbers up to $\pm 9$ quintillion (e.g. global IDs, system nanosecond offsets).
4.  **Decimal128 (128-bit Decimal):** Stores exact decimal fractions. (The gold standard for financial currency calculations).

---

### (2) The Numeric Type Matrix

| BSON Type | mongosh Constructor | Bytes | Best Use Case | PostgreSQL Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **Double** | *Default* (or `Double()`) | 8 | Coordinates, metrics. | `DOUBLE PRECISION` |
| **Int32** | `NumberInt()` | 4 | Quantities, age, status. | `INTEGER` |
| **Int64** | `NumberLong()` | 8 | Big counters, epoch IDs. | `BIGINT` |
| **Decimal128** | `NumberDecimal()` | 16 | Money, transaction values. | `NUMERIC`, `DECIMAL` |

---

### (3) Reality Metaphor
Imagine measuring tools in a kitchen:
-   **Double:** A liquid measuring cup. It is great for water or oil (fractions/floats). However, some liquid clings to the side or evaporates, leading to slight volume losses (rounding errors).
-   **Int32 / Int64:** A **pill counter box**. It only holds whole units (integers). You cannot put half a pill inside. The Int64 box is just a larger container holding more pills.
-   **Decimal128:** A **High-Precision Laboratory Scale** used to weigh expensive gold powder. It counts to the exact microgram without losing a single atom (exact decimal precision). It takes longer to read (CPU cycles), but guarantees perfect accounting.

---

### (4) Code Examples

#### Enforcing Number Types in mongosh
Because JavaScript default numbers are Double, you must wrap integers and decimals in helper constructors:

```javascript
db.ledger.insertOne({
  item: "Gold Chain",
  quantity: NumberInt(5),                    // Saves as Int32 (4 bytes)
  views: NumberLong("15000000000"),          // Saves as Int64 (8 bytes)
  price: NumberDecimal("199.99")             // Saves as Decimal128 (16 bytes)
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing money or financial transactions using default numbers (Double)

**The mistake:** Running `db.accounts.insertOne({ balance: 10.20 })` in JavaScript, causing MongoDB to store the balance as a Double.

**Why it's wrong:** Doubles store numbers in binary fractions. 

As you add and subtract balances, rounding errors accumulate:
```javascript
// Inside application logic (Double math):
balance = 1000.00 + 0.10 + 0.10 + 0.10;
// balance becomes 1000.3000000000001 instead of 1000.30
```

These micro-fractions aggregate across millions of rows, corrupting financial reports.

**Fix: Always wrap money values inside `NumberDecimal("string_value")` strings. Passing the value as a string prevents JavaScript's compiler from parsing it as a Double before sending it to MongoDB.**

---



### Mistake 2: Assuming JavaScript Numbers In `mongosh` Are Stored as 32-Bit Integers by Default

**The mistake:** Inserting `{ count: 1 }` in `mongosh` expecting `count` to be stored as BSON `int` (32-bit).

**Why it's wrong:** JavaScript numbers default to 64-bit double floating-point numbers! In `mongosh`, `{ count: 1 }` stores BSON `double`. Use `NumberInt(1)` or `NumberLong(1)` for integer storage.

*Incorrect:*
```javascript
db.stats.insertOne({ count: 1 }); // ❌ Stored as BSON double!
```

*Fix:*
```javascript
db.stats.insertOne({ count: NumberInt(1) }); // Stored as 32-bit BSON int
```

### Mistake 3: Exceeding 64-Bit Integer Bounds in JavaScript Number Operations

**The mistake:** Handling 64-bit integers larger than `Number.MAX_SAFE_INTEGER` ($2^{53}-1$) as plain JS numbers.

**Why it's wrong:** JavaScript numbers lose precision for integers larger than $2^{53}-1$. Use BSON `Long` or `BigInt` primitives for 64-bit integer values.

*Incorrect:*
```javascript
const id = 9007199254740993; // ❌ Precision loss in JS runtime!
```

*Fix:*
```javascript
const { Long } = require('mongodb'); const id = Long.fromString("9007199254740993");
```

## 5. Practice Exercises

### Exercise 1: Explicit Integer Inserts with `NumberInt` and `NumberLong`

**Scenario:**
Insert a server metric document specifying `Int32` for `port` (27017) and `Int64` for `bytesTransferred` (9876543210).

**Requirements:**
1. Use `NumberInt()` and `NumberLong()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.server_metrics.insertOne({
>   server: "db-node-01",
>   port: NumberInt(27017),
>   bytesTransferred: NumberLong("9876543210"),
>   recordedAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. `NumberInt()` forces 32-bit BSON integer encoding (4 bytes).
> 2. `NumberLong()` forces 64-bit BSON long integer encoding (8 bytes).
> 3. Prevents JavaScript numbers from defaulting to 64-bit double precision floats.

---

### Exercise 2: Atomic Incrementing with `$inc`

**Scenario:**
Increment a product's `views` count by 1 and decrement `stock` count by 1 atomically.

**Requirements:**
1. Use `$inc: { views: NumberInt(1), stock: NumberInt(-1) }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $inc: { views: NumberInt(1), stock: NumberInt(-1) } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$inc` performs atomic numeric addition and subtraction at the storage engine level.
> 2. Prevents race conditions during concurrent write updates.
> 3. Operates over integer, long, float, and decimal types.

---

### Exercise 3: Querying Numeric Ranges with `$gt` and `$lt`

**Scenario:**
Query products with price between 50.00 and 150.00.

**Requirements:**
1. Range filter `{ price: { $gte: 50.00, $lte: 150.00 } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find({
>   price: {
>     $gte: 50.00,
>     $lte: 150.00
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. Range comparison operators evaluate numeric values according to BSON type comparison rules.
> 2. Numeric types (Int32, Int64, Double, Decimal128) compare across type boundaries correctly.
> 3. Efficiently utilizes numeric B-tree indexes.

---



## 6. Related Terms

- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.
- [`Decimal128`](decimal128.md) — Finer details on financial math.
- [String](string.md) — Related concept: String.

---

## 7. Key Takeaways
- BSON supports four distinct number types: Double, Int32, Int64, and Decimal128.
- Default numbers in JavaScript/Node.js are stored as BSON Double (floats).
- Use `NumberInt()` and `NumberLong()` to save disk space for integer counters.
- Use `NumberDecimal("value")` for precise financial ledger balances.
- Floating-point Doubles suffer from rounding bugs; never use them for money.
- Pass decimal values as strings inside constructors to prevent float parses.
- Selecting optimized numeric types reduces disk file sizes.
