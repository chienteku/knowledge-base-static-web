# `$graphLookup` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that executes a recursive lookup on a collection to traverse hierarchical, tree, or graph-structured relations, serving as the direct equivalent of PostgreSQL's Recursive CTE (`WITH RECURSIVE`).

---

## 1. Prerequisites

- [`$lookup` Stage](lookup_stage.md) — The parent non-recursive join stage.
- [Recursive CTE](../../../12-postgres/terms/level_09/recursive_cte.md) — Relational recursive joins.

---

## 2. Term Category

**Aggregation** (Recursive Graph Traversal): The $graphLookup stage performs recursive search operations over graph-structured or hierarchical collections (e.g. org charts, category trees).



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Evaluated in the aggregation engine. Automatically tracks visited nodes in memory to prevent infinite loops when traversing circular graph structures).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Recursive Organizational Chart Traversal

**Scenario:**
Traverse an employee reporting hierarchy in collection `employees` to retrieve all recursive direct and indirect reports for manager `"emp_mgr_01"`.

**Requirements:**
1. Use `$graphLookup` with `startWith: "$_id"`, `connectFromField: "_id"`, `connectToField: "managerId"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.employees.aggregate([
>   { $match: { _id: "emp_mgr_01" } },
>   {
>     $graphLookup: {
>       from: "employees",
>       startWith: "$_id",
>       connectFromField: "_id",
>       connectToField: "managerId",
>       as: "allReports"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$graphLookup` performs recursive graph traversal across document references.
> 2. `connectFromField` specifies the field value to search for in target `connectToField`.
> 3. Recursively collects all management hierarchy descendants into an array.

---

### Exercise 2: Capping Traversal Depth with `maxDepth`

**Scenario:**
Traverse social connections up to 2 degrees of separation (`maxDepth: 1`) using `$graphLookup`.

**Requirements:**
1. Pass `maxDepth: 1` and `depthField: "degrees"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.aggregate([
>   { $match: { username: "alice" } },
>   {
>     $graphLookup: {
>       from: "users",
>       startWith: "$friendIds",
>       connectFromField: "friendIds",
>       connectToField: "_id",
>       maxDepth: 1,
>       depthField: "degrees",
>       as: "extendedNetwork"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `maxDepth` limits the recursive search depth (0 = direct links, 1 = 2 degrees of separation).
> 2. `depthField` injects the traversal step count into returned graph subdocuments.
> 3. Prevents runaway infinite loops on cyclic graph structures.

---

### Exercise 3: Circular Graph Prevention with `$graphLookup`

**Scenario:**
Explain how MongoDB automatically prevents infinite recursion when traversing cyclic graph references.

**Requirements:**
1. Describe `$graphLookup` internal visited-node tracking.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Graph Visited Node Cache:
> $graphLookup maintains an internal set of visited document _id keys during traversal.
> If a node is re-encountered, it is skipped automatically to break circular loops.
> ```
>
> #### Technical Explanation
>
> 1. Built-in cycle detection prevents infinite loops during graph traversal.
> 2. Safe execution over complex, cyclic social networks and graph topologies.
> 3. High performance graph querying.

---



## 6. Related Terms

- [`$lookup` Stage](lookup_stage.md) — The parent non-recursive join.
- [Recursive CTE](../../../12-postgres/terms/level_09/recursive_cte.md) — Relational recursive joins.

---

## 7. Key Takeaways
- `$graphLookup` performs recursive lookups to traverse trees and graphs.
- Direct NoSQL equivalent to PostgreSQL's `WITH RECURSIVE` CTE query.
- Eliminates the need to write multiple chained `$lookup` stages.
- Automatically handles circular loops without getting stuck in infinite crawls.
- Set `maxDepth` to restrict recursive depths and protect server memory.
- Returns all matched hierarchical documents inside a flat output array.
- Crucial for org charts, category paths, and social network connections.
