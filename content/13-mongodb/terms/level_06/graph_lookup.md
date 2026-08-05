# `$graphLookup` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that executes a recursive lookup on a collection to traverse hierarchical, tree, or graph-structured relations, serving as the direct equivalent of PostgreSQL's Recursive CTE (`WITH RECURSIVE`).

---

## 1. Prerequisites

- [`$lookup` Stage](lookup_stage.md) — The parent non-recursive join stage.
- [Recursive CTE](../../../12-postgres/terms/level_09/recursive_cte.md) — Relational recursive joins.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Evaluated in the aggregation engine. Automatically tracks visited nodes in memory to prevent infinite loops when traversing circular graph structures).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In application data modeling, you occasionally need to represent hierarchies of unknown depth:
-   **Organizational Charts:** Bob reports to Jane $\rightarrow$ Jane reports to Dave $\rightarrow$ Dave reports to CEO.
-   **Category Trees:** Laptop $\rightarrow$ Computers $\rightarrow$ Electronics.
-   **Social Networks:** Follower connections (finding friends of friends).

If you want to trace a path from a child node up to the root:
-   In SQL, you must write a complex, multi-line **Recursive CTE** query using `WITH RECURSIVE`.
-   In standard MongoDB `$lookup` queries, you can only join one level. To query 5 levels, you would need to chain 5 separate `$lookup` stages in your pipeline, which is verbose and hard-coded to a fixed depth.

We designed the **`$graphLookup`** stage to solve this hierarchical search problem. 

It acts as a recursive join engine. 

You declare the starting pointer and tell MongoDB how fields connect. 

The database engine follows the links recursively, climbing up or down the hierarchy automatically until the chain ends, returning all matched documents in a single array.

---

### (2) `$graphLookup` Parameters

```javascript
{
  $graphLookup: {
    from: "collection_name",          // Target collection to search
    startWith: "$manager_id",         // Value to start the recursion with
    connectFromField: "manager_id",   // Field in target document to link from
    connectToField: "_id",            // Field in target document to link to
    as: "reporting_chain",            // Output array field name
    maxDepth: 5,                      // Optional: Limit recursion depth
    depthField: "levels"              // Optional: Inject depth offset numbers
  }
}
```

---

### (3) Reality Metaphor (Genealogy Archive Searches)
Imagine tracing your family lineage:
-   **`$graphLookup` Stage:** A genealogist holding your birth certificate.
    -   They read your father's name (`startWith`).
    -   They walk to the archives cabinet (`from`), locate your father's birth certificate matching his name (`connectToField`), and read *his* father's name (`connectFromField`).
    -   They repeat this process, walking from folder to folder, collecting all birth certificates into a **consolidated binder** (`as` array) until they reach the family founder (no more matches).

---

### (4) Code Examples

#### Tracing an Organizational Reporting Chain
Let's find all managers Dave reports to, up to the CEO:

```javascript
db.employees.insertMany([
  { _id: 1, name: "CEO", manager_id: null },
  { _id: 2, name: "Director", manager_id: 1 },
  { _id: 3, name: "Manager", manager_id: 2 },
  { _id: 4, name: "Dave", manager_id: 3 }
]);

db.employees.aggregate([
  { $match: { name: "Dave" } },
  // Trace reporting hierarchy recursively
  {
    $graphLookup: {
      from: "employees",
      startWith: "$manager_id",
      connectFromField: "manager_id",
      connectToField: "_id",
      as: "managers_hierarchy"
    }
  }
]);

// Output: 'Dave' document is returned containing an array 'managers_hierarchy' 
// holding the Manager, Director, and CEO documents!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting recursion depth caps (maxDepth) on extremely deep or circular datasets, risking memory exhaustion

**The mistake:** Running a `$graphLookup` on a massive social network user-connection map without specifying limits, allowing the recursion to crawl millions of linked nodes.

**Why it's wrong:** Without a depth limit, MongoDB will follow links indefinitely, loading thousands of related documents into RAM. 

This will exhaust the aggregation stage's 100MB memory ceiling and crash the query.

**Fix: If your collection is large and you only need near-level hierarchy details (e.g. up to 2 tiers of categories or manager connections), always define a `maxDepth` limit.**

```javascript
// CORRECT (Only crawls up to 2 steps)
{
  $graphLookup: {
    from: "employees",
    startWith: "$manager_id",
    connectFromField: "manager_id",
    connectToField: "_id",
    as: "managers_hierarchy",
    maxDepth: 1 // Depth 0 is the manager; Depth 1 is the manager's manager
  }
}
```

---



### Mistake 2: Running Unbounded Recursive `$graphLookup` Traversals on Cyclic Graphs (Infinite Loops)

**The mistake:** Running `$graphLookup` on graph data with circular references without setting `maxDepth`.

**Why it's wrong:** If graph references contain cycles (Node A -> Node B -> Node A), omitting `maxDepth` causes infinite recursive loops and memory crashes. Always specify `maxDepth`.

*Incorrect:*
```javascript
db.users.aggregate([{ $graphLookup: { from: "users", startWith: "$reportsTo", connectFromField: "reportsTo", connectToField: "_id", as: "hierarchy" } }]); // ❌ Cycle risk!
```

*Fix:*
```javascript
db.users.aggregate([{ $graphLookup: { from: "users", startWith: "$reportsTo", connectFromField: "reportsTo", connectToField: "_id", maxDepth: 5, as: "hierarchy" } }]);
```

### Mistake 3: Executing `$graphLookup` Without Indexes on `connectToField`

**The mistake:** Executing recursive `$graphLookup` joining `connectFromField` to an un-indexed `connectToField`.

**Why it's wrong:** `$graphLookup` executes iterative join lookups per recursive depth level. Failing to index `connectToField` causes exponential collection scans.

*Incorrect:*
```javascript
// Un-indexed connectToField in graph lookup
```

*Fix:*
```javascript
db.users.createIndex({ _id: 1 }); // Ensure connectToField is indexed
```

## 6. Practice Exercises

### Exercise 1: Recursive Category Search

**Problem:** You have a `categories` collection. Each category document links to its parent category via a `parent_id` field:
`{ _id: "Laptops", parent_id: "Computers" }`
Write the `$graphLookup` stage (as a JSON block) to recursively find all ancestor categories for a given starting category, storing results in the array field `"ancestors"`.

**Expected output:**
> [!check]- Answer
> ```javascript
> {
>   $graphLookup: {
>     from: "categories",
>     startWith: "$parent_id",
>     connectFromField: "parent_id",
>     connectToField: "_id",
>     as: "ancestors"
>   }
> }
> ```
> - The target collection is `"categories"`.
> - The links are resolved by mapping `parent_id` to `_id` recursively.

---



### Exercise 2: Organizational Hierarchy Recursive Traversal

**Problem:** Traverse management reporting hierarchy up to 3 levels deep using `$graphLookup`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $graphLookup: { from: "users", startWith: "$managerId", connectFromField: "managerId", connectToField: "_id", maxDepth: 3, as: "managers" } }]);
> ```
> ```javascript
> db.users.aggregate([
>   {
>     $graphLookup: {
>       from: "users",
>       startWith: "$managerId",
>       connectFromField: "managerId",
>       connectToField: "_id",
>       maxDepth: 3,
>       as: "managers"
>     }
>   }
> ]);
> ```
>
> **Explanation:** `$graphLookup` performs recursive graph traversals over parent-child relationships.

---

### Exercise 3: Tracking Depth Level with `depthField`

**Problem:** Add depth level number to recursive graph results using `depthField: "level"`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $graphLookup: { ..., depthField: "level", as: "network" } }]);
> ```
> ```javascript
> db.users.aggregate([
>   {
>     $graphLookup: {
>       from: "users",
>       startWith: "$friends",
>       connectFromField: "friends",
>       connectToField: "_id",
>       maxDepth: 2,
>       depthField: "level",
>       as: "network"
>     }
>   }
> ]);
> ```
>
> **Explanation:** `depthField` attaches recursion iteration depth numbers to joined graph elements.

## 7. Related Terms

- [`$lookup` Stage](lookup_stage.md) — The parent non-recursive join.
- [Recursive CTE](../../../12-postgres/terms/level_09/recursive_cte.md) — Relational recursive joins.

---

## 8. Key Takeaways
- `$graphLookup` performs recursive lookups to traverse trees and graphs.
- Direct NoSQL equivalent to PostgreSQL's `WITH RECURSIVE` CTE query.
- Eliminates the need to write multiple chained `$lookup` stages.
- Automatically handles circular loops without getting stuck in infinite crawls.
- Set `maxDepth` to restrict recursive depths and protect server memory.
- Returns all matched hierarchical documents inside a flat output array.
- Crucial for org charts, category paths, and social network connections.
