# `FOR` Expression

> **Level 6 — Advanced Querying & Functions**
> The looping control-flow expression in SurrealQL used to iterate over arrays, sets, or numeric ranges (`FOR $item IN $array { ... }`), enabling batch processing directly within database scripts.

---

## 1. Prerequisites

- [SurrealQL](../level_01/surrealql.md) — The query language context.
- [`array`](../level_02/array_type.md) — Target iteration arrays.

---

## 2. Term Category


**SurrealQL Command (iterative loop control expression)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In application development, batch processing tasks frequently arise:
- Iterating over an array of user IDs and sending/creating a notification record for each user.
- Generating a sequence of test records or default settings.
- Processing a JSON array payload submitted by an API client.

In PostgreSQL, looping requires PL/pgSQL `FOR ... IN` loops. In MongoDB, looping requires client-side driver code or complex JavaScript stored procedures.

We designed the **`FOR` Expression** in SurrealQL to bring imperative looping into declarative query scripts (`FOR $item IN $list { ... }`). `FOR` loops iterate over arrays, sets, or range lists (`1..5`), running database operations for each item without requiring multiple client-server API calls.

---

### (2) Range Iteration Syntax
SurrealQL supports range syntax (`start..end`) for numeric loops:
`FOR $i IN 1..5 { CREATE log SET step = $i; };`
- Iterates from 1 up to 5 (inclusive).

---

### (3) Reality Metaphor (The Mailroom Stamper)
Imagine processing mail:
- **Single Processing:** Taking 1 letter, stamping it, and placing it in a bin.
- **`FOR` Expression:** A **Conveyor Belt Loop**.
  - A tray of 10 letters (`$letters`) moves past your desk.
  - For every letter `$letter` on the belt, the robotic arm picks up a stamp, presses it onto `$letter`, and moves to the next item until the tray is empty.

---

### (4) Code Examples

#### Using `FOR` Loops in SurrealQL

```sql
-- 1. Iterating over an array of strings to create multiple records
LET $categories = ["technology", "database", "rust"];

FOR $cat IN $categories {
  CREATE category SET 
    name = $cat,
    created_at = time::now();
};

-- 2. Iterating over a numeric range (1 to 5)
FOR $num IN 1..5 {
  CREATE test_record SET 
    index = $num,
    label = "Test #" + <string>$num;
};

-- 3. Iterating over objects inside an array
LET $users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" }
];

FOR $u IN $users {
  CREATE user SET name = $u.name, role = $u.role;
};
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use JavaScript-style 'for (let i = 0; i < N; i++)' syntax in SurrealQL

**The mistake:** Writing `FOR (LET $i = 0; $i < 5; $i++) { ... }` in a script.

**Why it's wrong:** SurrealQL does not support C-style or JavaScript-style `for (;;)` loop expressions. Using it triggers a parser syntax error.

**Fix: Use the clean `FOR $item IN $list` or `FOR $i IN 1..N` syntax:**

```sql
-- BAD
FOR (LET $i = 0; $i < 5; $i++) { ... }

-- GOOD
FOR $i IN 1..5 { ... }
```

---



### Mistake 2: Forgetting `IN` Keyword in `FOR` Loop Expressions

**The mistake:** Writing `FOR $item [1, 2, 3] { ... };` (SyntaxError).

**Why it's wrong:** `FOR` expressions strictly require `FOR $var IN array { ... };`.

*Incorrect:*
```surrealql
FOR $item [1, 2, 3] { CREATE item SET val = $item; }; // ❌ Missing IN keyword!
```

*Fix:*
```surrealql
FOR $item IN [1, 2, 3] { CREATE item SET val = $item; };
```

### Mistake 3: Expecting `FOR` Loops to Mutate Array Variables in Place

**The mistake:** Running `FOR $v IN $arr { $v = $v * 2; };` expecting `$arr` elements to double.

**Why it's wrong:** Loop variables `$v` are local copy bindings. To transform arrays, use `array::map()` or assign block outputs.

*Incorrect:*
```surrealql
FOR $v IN $arr { LET $v = $v * 2; }; // ❌ Does not mutate $arr!
```

*Fix:*
```surrealql
LET $arr = array::map($arr, |$v| $v * 2);
```

## 5. Practice Exercises

### Exercise 1: Iterative Batch Processing with `FOR` Loops

**Scenario:**
An administrative script iterates over an array of user record IDs and creates a default notification record for each user.

**Requirements:**
1. Write a `FOR` loop iterating over `[user:u1, user:u2, user:u3]`.
2. Create a `notification` record for each user inside the loop block.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> FOR $user IN [user:u1, user:u2, user:u3] {
>     CREATE notification SET recipient = $user, message = "Welcome!";
> };
> ```
>
> #### Technical Explanation
>
> 1. `FOR $item IN $array { ... }` iterates over array elements sequentially.
> 2. Binds the loop variable (`$user`) for use inside the loop block.
> 3. Executes procedural database mutations in a single transaction.
> 
---

### Exercise 2: Calculating Iterative Sums in `FOR` Loops

**Scenario:**
Iterate over a list of order amounts, accumulate a running total in a parameter variable `$total`, and return the result.

**Requirements:**
1. Initialize `LET $total = 0.0dec;`.
2. Loop over amounts `[10.0dec, 25.5dec, 14.5dec]`.
3. Add amount to `$total` in each iteration.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $total = 0.0dec;
> 
> FOR $amount IN [10.0dec, 25.5dec, 14.5dec] {
>     LET $total = $total + $amount;
> };
> 
> RETURN $total;
> ```
>
> #### Technical Explanation
>
> 1. Parameter variables (`LET $total`) can be updated inside `FOR` loop bodies.
> 2. Retains accumulator state across iterations.
> 3. Enables stored procedure logic inside SurrealQL scripts.
> 
---

### Exercise 3: Array Mapping with `FOR` Expressions

**Scenario:**
Transform an array of product prices `[100, 200, 300]` by applying a 10% discount to each item using a `FOR` loop expression.

**Requirements:**
1. Use `FOR` loop to output array of discounted prices.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> FOR $price IN [100.0dec, 200.0dec, 300.0dec] {
>     RETURN $price * 0.9dec;
> };
> ```
>
> #### Technical Explanation
>
> 1. `FOR` expressions evaluate to an array containing results of each iteration step.
> 2. Provides functional array mapping capabilities.
> 3. Transforms collection data without external application code.
> 
---



## 6. Related Terms

- [`LET` Statement](let_statement.md) — Script variables.
- [`array`](../level_02/array_type.md) — Iteration target lists.
- [`SPLIT` Clause](split_clause.md) — Unwinding arrays in SELECTs.

---

## 7. Key Takeaways
- `FOR $item IN $list` iterates over arrays, sets, and ranges.
- Numeric range syntax (`1..N`) enables index loops.
- Executes batch updates and creations in a single script session.
- Eliminates client-side loop round-trips to the database server.
- Supports iterating over arrays of scalar values or complex objects.
