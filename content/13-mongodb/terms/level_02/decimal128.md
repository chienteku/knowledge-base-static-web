# `Decimal128`

> **Level 2 — BSON Data Types & Document Structure**
> The high-precision 128-bit BSON decimal data type that guarantees exact base-10 arithmetic, serving as the definitive type for currency and financial calculations.

---

## 1. Prerequisites

- [Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)](number_types.md) — The parent numeric type family.
- [BSON Data Types (Overview)](bson_data_types.md) — BSON data types overview.

---

## 2. Term Category

**Core Concept** (High-Precision Monetary BSON Type): Decimal128 is the 128-bit IEEE 754-2008 BSON decimal format designed for exact monetary and financial calculations without floating-point rounding errors.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Conforms to the IEEE 754-2008 decimal floating-point standard. Stored as 16 bytes of data. Enforced in queries using `NumberDecimal()` constructors).

### (1) Design Motivation — "Why did we design this?"
In database design, storing money requires absolute precision. 

If you use the default **Double** (binary floating-point) type to store a currency balance:
-   Doubles store numbers as binary fractions (powers of 2). 
-   This works for fractions like `0.5` or `0.25`, but cannot represent standard base-10 fractions like `0.1` (ten cents) or `0.01` (one cent) exactly.
-   When you add `0.10` and `0.20` using Doubles, the computer computes:
    `0.30000000000000004`
-   This micro-fraction drift is called a **floating-point rounding error**. Over millions of transactions, these rounding errors aggregate, causing audits to fail.

We designed **`Decimal128`** to solve this financial math problem. 

`Decimal128` uses a base-10 representation. 

It preserves up to 34 decimal digits of precision, ensuring that values like `0.1` are stored exactly.

---

### (2) The Constructor String Requirement
Because JavaScript does not have a native 128-bit decimal type, you must pass the value as a **string** to the `NumberDecimal` constructor:

`NumberDecimal("19.99")`

If you pass it as a raw number:
`NumberDecimal(19.99)`

The JavaScript interpreter will translate `19.99` into a 64-bit float *before* handing it to MongoDB, importing the exact rounding error you are trying to avoid.

---

### (3) Reality Metaphor
Imagine measuring expensive spices:
-   **Double:** A generic **kitchen scale** that measures in grams. It works for flour, but if you weigh saffron, a few fractions of a gram are rounded off. (Float error).
-   **Decimal128:** A **High-precision Chemistry scale** in a clean lab. It measures down to the exact micro-gram. It takes longer to calibrate (CPU overhead), but ensures you don't lose a single atom of gold or spice.

---

### (4) Code Examples

#### 1. Correct Financial Insert
Always pass the numeric value as a quoted string:

```javascript
db.wallets.insertOne({
  user: "Alice",
  balance: NumberDecimal("100.30") // CORRECT: Preserves exact decimal
});
```

#### 2. The Float Trap (Incorrect Precision)
Let's see what happens if you pass a float instead of a string:

```javascript
db.wallets.insertOne({
  user: "Bob",
  balance: NumberDecimal(100.30) // BAD: Passes a float first!
});

db.wallets.find();
// Output:
// { "user": "Alice", "balance": NumberDecimal("100.30") }
// { "user": "Bob",   "balance": NumberDecimal("100.299999999999997") } <-- Float noise!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting quotation marks around the numeric value inside the NumberDecimal constructor

**The mistake:** Writing `NumberDecimal(10.20)` inside an insert query.

**Why it's wrong:** As shown in the Bob example above, the JavaScript runtime parses `10.20` as a Double first. 

The float noise (`10.199999999999997`) is created in RAM, and then saved into the Decimal128 field, defeating the purpose of the data type.

**Fix: Always wrap the numeric value in quotes inside the constructor: `NumberDecimal("10.20")` to bypass JavaScript float conversions.**

---



### Mistake 2: Using Double Floating-Point Numbers for Financial Currency Balances

**The mistake:** Storing financial monetary values using standard double numbers `{ balance: 19.99 }`.

**Why it's wrong:** Double floating-point numbers suffer binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). Use `Decimal128` (`NumberDecimal("19.99")`) for exact financial precision.

*Incorrect:*
```javascript
db.accounts.updateOne({ _id: id }, { $inc: { balance: 0.1 } }); // ❌ Floating point precision loss!
```

*Fix:*
```javascript
db.accounts.updateOne({ _id: id }, { $inc: { balance: NumberDecimal("0.1") } });
```

### Mistake 3: Passing Numbers Instead of Strings to `NumberDecimal()` Constructor

**The mistake:** Constructing `NumberDecimal(0.1 + 0.2)` passing floating-point expressions.

**Why it's wrong:** Passing floating-point expressions to `NumberDecimal()` preserves the pre-existing float rounding error! Pass string literals `NumberDecimal("0.1")`.

*Incorrect:*
```javascript
NumberDecimal(0.1 + 0.2); // ❌ Preserves float rounding error 0.30000000000000004!
```

*Fix:*
```javascript
NumberDecimal("0.1"); // Pass exact string literal
```

## 5. Practice Exercises

### Exercise 1: Precision Financial Price Calculation

**Scenario:**
Calculate total price including tax for a product costing `NumberDecimal("19.99")` at tax rate `NumberDecimal("0.0825")`.

**Requirements:**
1. Use `$multiply` and `$add` in aggregation with `Decimal128` values.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.aggregate([
>   {
>     $project: {
>       name: 1,
>       basePrice: "$price",
>       taxAmount: { $multiply: ["$price", NumberDecimal("0.0825")] },
>       totalWithTax: {
>         $add: [
>           "$price",
>           { $multiply: ["$price", NumberDecimal("0.0825")] }
>         ]
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `Decimal128` arithmetic maintains 34 decimal digits of IEEE 754-2008 precision.
> 2. Prevents binary floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
> 3. Standard choice for accounting and monetary database fields.

---

### Exercise 2: Aggregating Decimal Sums with `$sum`

**Scenario:**
Compute the sum total of all account balances in collection `accounts`.

**Requirements:**
1. Aggregate `$sum` over `NumberDecimal` balance fields.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.accounts.aggregate([
>   {
>     $group: {
>       _id: null,
>       totalAssets: { $sum: "$balance" }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$sum` preserves `Decimal128` types during aggregation math.
> 2. Accumulates exact balances across millions of documents without rounding drift.
> 3. Outputs a single `Decimal128` result payload.

---

### Exercise 3: Constructing Decimal128 Objects in Node.js

**Scenario:**
Write Node.js MongoDB driver code to insert a `Decimal128` value using `Decimal128.fromString()`.

**Requirements:**
1. Use `Decimal128.fromString("299.95")` in Node.js.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { MongoClient, Decimal128 } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");
const db = client.db("store");

await db.collection("orders").insertOne({
  orderId: "ORD-9912",
  amount: Decimal128.fromString("299.95")
});
```

> #### Technical Explanation
>
> 1. `Decimal128.fromString(str)` parses exact decimal strings into BSON binary structures.
> 2. Avoids passing JavaScript numbers (`299.95`) which would cast to 64-bit IEEE double floats.
> 3. Guarantees client-to-database precision integrity.

---



## 6. Related Terms

- [Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)](number_types.md) — The parent types.

---

## 7. Key Takeaways
- Decimal128 is a 128-bit BSON type designed for exact base-10 decimal math.
- Serves as the MongoDB equivalent to PostgreSQL's `NUMERIC` and `DECIMAL` types.
- Natively prevents floating-point binary rounding errors.
- Always instantiate using `NumberDecimal("value_string")`.
- Always wrap the number inside quotes to prevent JavaScript float parses.
- Standard Doubles are faster to calculate; use Decimal128 strictly for money.
- Ensures database monetary audits pass without calculation drift.
