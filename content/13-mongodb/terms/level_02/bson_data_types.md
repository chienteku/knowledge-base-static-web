# BSON Data Types (Overview)

> **Level 2 — BSON Data Types & Document Structure**
> The complete type system supported by the BSON specification inside MongoDB, defining how strings, numbers, dates, lists, and nested objects are represented and stored.

---

## 1. Prerequisites

- [BSON (Binary JSON)](../level_01/bson.md) — The parent binary serialization format.

---

## 2. Term Category

**Core Concept** (Type System Specification): BSON Data Types define the full set of binary-encoded types supported natively by MongoDB, expanding beyond basic JSON data types.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Fully enforced by the storage engine. Each value in a BSON document is prefixed by a single-byte type identifier that determines how the engine parses the following bytes).

### (1) Design Motivation — "Why did we design this?"
In PostgreSQL, column data types are strictly defined inside the table schema. 

If a column is declared as `INT`, the database guarantees that every row stores a 32-bit integer in that slot.

In MongoDB, because collections are schema-free, a single field can hold different data types in different documents (e.g., `status: "active"` (String) and `status: 1` (Integer)).

To query and sort this data safely:
-   MongoDB needs a strict internal **Type System** to identify what kind of value is stored in every field.
-   Unlike standard JSON (which only has 6 types), the **BSON type system** includes 19 distinct type identifiers. This allows MongoDB to support exact financial decimals, timestamps, regular expressions, and unique ObjectIds, making it a robust database engine rather than a simple text store.

---

### (2) The Core BSON Type List

| Type Name | BSON Alias | Description | PostgreSQL Equivalent |
| :--- | :--- | :--- | :--- |
| **String** | `"string"` | UTF-8 text string. | `TEXT`, `VARCHAR` |
| **Double** | `"double"` | 64-bit floating-point number. | `DOUBLE PRECISION` |
| **Int32** | `"int"` | 32-bit signed integer. | `INTEGER` |
| **Int64** | `"long"` | 64-bit signed integer. | `BIGINT` |
| **Decimal128**| `"decimal"` | 128-bit decimal (exact precision). | `NUMERIC`, `DECIMAL` |
| **Boolean** | `"bool"` | `true` or `false` logic. | `BOOLEAN` |
| **Date** | `"date"` | Milliseconds since Unix epoch. | `TIMESTAMPTZ` |
| **Null** | `"null"` | Absence of value. | `NULL` |
| **Object** | `"object"` | Embedded subdocument. | `JSONB` (object keys) |
| **Array** | `"array"` | Ordered list of any types. | `JSONB` / Array types |
| **ObjectId** | `"objectId"` | 12-byte unique identifier. | `UUID` |
| **Binary** | `"binData"` | Raw byte arrays. | `BYTEA` |

---

### (3) Reality Metaphor
Imagine packing a compartmentalized lunchbox:
-   **SQL Column:** A single-ingredient jar. It is labeled "Soup" (`TEXT`). You can only pour soup inside. If you drop a carrot in, it breaks.
-   **BSON Document:** A **Bento Lunch Box** containing multiple compartments. 
    -   Compartment 1 holds rice (String).
    -   Compartment 2 holds a strawberry (Boolean).
    -   Compartment 3 holds 3 pieces of sushi (Array).
    -   Compartment 4 holds a tiny mini-sauce container (Embedded sub-document).
    -   Each compartment holds a completely different food type, but they are all carried in the same container.

---

### (4) Code Examples

#### Querying by Data Type using the `$type` Operator
Because data can vary, you can filter documents by their specific BSON type:

```javascript
// Find all documents where the 'price' field is stored as a String type
db.products.find({ price: { $type: "string" } });

// Find all documents where the 'phone' field is stored as an Array
db.products.find({ phone: { $type: "array" } });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing JavaScript data types with MongoDB BSON data types in your application code

**The mistake:** Assuming that because JavaScript only has a single `Number` type (which is a floating-point double), MongoDB will automatically store all numbers as integers if they have no decimals.

**Why it's wrong:** If you save a JavaScript number `42` to MongoDB using standard drivers, some drivers might save it as a BSON `Double` (64-bit float) while others save it as an `Int32`. 

This causes mixed types in your collection, which can lead to floating-point rounding errors in calculations or sorting inconsistencies during indexes.

**Fix: When saving numbers where precision is critical (like quantities or currencies), use your database driver's explicit type wrappers (e.g. `Long(42)` or `Decimal128("19.99")`) to guarantee they are serialized to the correct BSON type.**

---



### Mistake 2: Using Invalid BSON Type Numbers in `$type` Queries

**The mistake:** Querying `{ age: { $type: 16 } }` without knowing numeric vs string BSON type aliases.

**Why it's wrong:** BSON types can be referenced by number or string alias (e.g. `"int"`, `"double"`, `"string"`, `"objectId"`, `"date"`). Using string aliases prevents numeric type code confusion.

*Incorrect:*
```javascript
db.users.find({ age: { $type: 16 } }); // Hard to read type code
```

*Fix:*
```javascript
db.users.find({ age: { $type: "int" } }); // Readable string BSON type alias
```

### Mistake 3: Comparing Dissimilar BSON Types in Index Range Queries

**The mistake:** Querying `db.coll.find({ val: { $gt: 10 } })` when `val` contains mixed strings and numbers.

**Why it's wrong:** MongoDB defines a strict BSON Type Comparison Order (MinKey < Null < Numbers < Symbol/String < Object < Array < BinData < ObjectId < Date < Timestamp < MaxKey). Comparing mixed types yields unexpected ordering.

*Incorrect:*
```javascript
// When val contains "50" (string) and 10 (number)
```

*Fix:*
```javascript
Ensure field values are consistently typed using Schema Validation
```

## 5. Practice Exercises

### Exercise 1: Inserts with Explicit BSON Type Expressions

**Scenario:**
Insert a customer document demonstrating explicit BSON types: `ObjectId`, `Date`, `Int32`, and `Decimal128`.

**Requirements:**
1. Insert document using `NumberInt()` and `NumberDecimal()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.insertOne({
>   _id: new ObjectId(),
>   name: "Acme Corp",
>   accountCode: NumberInt(402),
>   creditLimit: NumberDecimal("50000.00"),
>   registeredAt: new Date()
> });
> ```
>
> #### Technical Explanation
>
> 1. `NumberInt()` forces BSON 32-bit integer encoding instead of default 64-bit double float.
> 2. `NumberDecimal()` forces exact 128-bit IEEE decimal encoding.
> 3. Prevents JavaScript driver type coercion implicit errors.

---

### Exercise 2: Querying Fields by BSON Type with `$type`

**Scenario:**
Find all documents in `orders` where field `total` was incorrectly stored as a `string` instead of a numeric type.

**Requirements:**
1. Use `$type: "string"` operator.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({
>   total: { $type: "string" }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$type` inspects the BSON binary type of document fields.
> 2. Accepts type names (`"string"`, `"decimal"`, `"date"`) or numeric BSON type codes (2, 19, 9).
> 3. Essential tool for auditing schema inconsistencies.

---

### Exercise 3: Aggregation BSON Type Conversions with `$convert`

**Scenario:**
Convert string price fields to BSON `Decimal128` inside an aggregation pipeline.

**Requirements:**
1. Use `$convert` to transform `priceString` to `decimal`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.aggregate([
>   {
>     $project: {
>       name: 1,
>       priceDecimal: {
>         $convert: {
>           input: "$priceString",
>           to: "decimal",
>           onError: NumberDecimal("0.00"),
>           onNull: NumberDecimal("0.00")
>         }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$convert` performs explicit type conversions inside aggregation pipeline stages.
> 2. `onError` handles unparseable string values gracefully without aborting the pipeline.
> 3. `onNull` handles missing or null fields.

---



## 6. Related Terms

- [BSON (Binary JSON)](../level_01/bson.md) — The binary serialization.
- [String](string.md) — The text type.
- [Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)](number_types.md) — The numeric types.
- [Field](../level_01/field.md) — Related concept: Field.
- [`Binary` Data](binary_data.md) — Related concept: `Binary` Data.
- [Boolean](boolean_type.md) — Related concept: Boolean.
- [Date](date_type.md) — Related concept: Date.
- [`null`](null_type.md) — Related concept: `null`.
- [Schema Validation (`$jsonSchema`)](../level_05/schema_validation.md) — Related concept: Schema Validation (`$jsonSchema`).

---

## 7. Key Takeaways
- BSON enforces a type system containing 19 distinct type identifiers.
- Expands basic JSON types to include dates, decimal128, and object IDs.
- Helps MongoDB parse and sort data fields efficiently on disk.
- Query documents by type values using the `$type` query operator.
- JavaScript numbers default to doubles; wrap them to store exact integers.
- Consistent BSON type choices are required to optimize index scans.
