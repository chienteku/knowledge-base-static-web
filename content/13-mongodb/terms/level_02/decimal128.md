# `Decimal128`

> **Level 2 — BSON Data Types & Document Structure**
> The high-precision 128-bit BSON decimal data type that guarantees exact base-10 arithmetic, serving as the definitive type for currency and financial calculations.

---

## 1. Prerequisites

- [Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)](number_types.md) — The parent numeric type family.
- [BSON Data Types (Overview)](bson_data_types.md) — BSON data types overview.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **MongoDB Core** (Conforms to the IEEE 754-2008 decimal floating-point standard. Stored as 16 bytes of data. Enforced in queries using `NumberDecimal()` constructors).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Constructor Validation

**Problem:** You are writing a backend payment route. The transaction amount is `45.90`. 
Explain why `NumberDecimal("45.90")` is correct, whereas `NumberDecimal(45.90)` is incorrect.

**Expected output:**
> [!check]- Answer
> ```text
> - `NumberDecimal("45.90")` is correct because passing a string skips JavaScript's floating-point parsing. The string characters are sent directly to MongoDB, which parses them into a precise 128-bit decimal representation on disk.
> - `NumberDecimal(45.90)` is incorrect because the JavaScript interpreter immediately converts the unquoted number `45.90` into a binary float double, introducing rounding noise before the database wrapper can compile it.
> ```
> - Assess the boundary where JavaScript hands variables to database drivers.
> - Consider which parameter type prevents floating-point parsing.

---



### Exercise 2: Constructing Decimal128 in mongosh

**Problem:** Create exact Decimal128 value for `$99.95` using `NumberDecimal()`.

**Expected output:**
> [!check]- Answer
> ```text
> NumberDecimal("99.95")
> ```
> ```javascript
> NumberDecimal("99.95");
> ```
>
> **Explanation:** `NumberDecimal("str")` constructs 128-bit IEEE 754-2008 decimal floating-point values.

---

### Exercise 3: Node.js Driver Decimal128 Usage

**Problem:** Import Decimal128 in Node.js MongoDB driver (`const { Decimal128 } = require('mongodb')`).

**Expected output:**
> [!check]- Answer
> ```text
> Decimal128.fromString("99.95")
> ```
> ```javascript
> const { Decimal128 } = require('mongodb');
> const amount = Decimal128.fromString("99.95");
> ```
>
> **Explanation:** `Decimal128.fromString()` creates exact decimal objects in Node.js.

## 7. Related Terms

- [Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)](number_types.md) — The parent types.

---

## 8. Key Takeaways
- Decimal128 is a 128-bit BSON type designed for exact base-10 decimal math.
- Serves as the MongoDB equivalent to PostgreSQL's `NUMERIC` and `DECIMAL` types.
- Natively prevents floating-point binary rounding errors.
- Always instantiate using `NumberDecimal("value_string")`.
- Always wrap the number inside quotes to prevent JavaScript float parses.
- Standard Doubles are faster to calculate; use Decimal128 strictly for money.
- Ensures database monetary audits pass without calculation drift.
