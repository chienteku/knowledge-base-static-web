# `VACUUM` / `ANALYZE`

> **Level 7 — Indexes & Query Performance**
> The PostgreSQL maintenance commands used to reclaim disk storage space from deleted rows (`VACUUM`) and update table statistics for the query planner (`ANALYZE`).

---

## 1. Prerequisites
- [Query Planner / Optimizer](query_planner.md) — The cost-calculation engine.
- [Index-Only Scan (Covering Index)](index_only_scan.md) — The scans that rely on Visibility Maps cleaned by vacuum.

---

## 2. Term Category
- **PostgreSQL Command**

---

## 3. Environment Context
- **PostgreSQL Core** (Specific to PostgreSQL's MVCC design. Postgres runs a background daemon called **Autovacuum** to execute these commands automatically).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Under PostgreSQL's MVCC concurrency model (which we will learn in Level 8):
-   When you `DELETE` a row, Postgres does not instantly erase it from the hard drive. It simply flags the row as "dead" (invisible to new queries).
-   When you `UPDATE` a row, Postgres marks the old version as "dead" and writes a brand new version of the row to another location on disk.

These dead rows (called **Dead Tuples**) remain inside your table storage files, consuming disk space. 

If you write 1 million logs and delete 900,000 of them:
-   Your database still consumes the disk space of all 1 million rows.
-   This storage waste is called **Table Bloat**.
-   It slows down database reads because sequential scans must still read these dead blocks off disk.

We designed the **`VACUUM`** command to solve this. It sweeps tables, marks the storage space of dead tuples as "available for reuse," and updates the Visibility Map (enabling Index-Only Scans).

Additionally, we designed the **`ANALYZE`** command to update table statistics. 

This updates the query planner's maps so it can calculate cost scores accurately.

---

### (2) Types of Vacuuming

#### 1. Standard `VACUUM`
Sweeps the table in the background. 

It marks dead tuple space as reusable, but **does not return the space to the operating system**. 

The table file size on disk does not shrink, but new inserts will reuse the empty spaces inside the file first. 

*Benefit:* Runs concurrently without blocking read or write queries.

#### 2. `VACUUM FULL`
Physically rewrites the table into a brand new file on disk, packing rows tightly and **returning all free space to the operating system**.
-   *Danger:* **`VACUUM FULL` locks the table completely.** No one can read or write to the table until it finishes, which can take hours and cause application downtime.

---

### (3) The Autovacuum Daemon
To save you from running these commands manually, PostgreSQL runs a background service called **Autovacuum**. 

It monitors tables and triggers vacuum/analyze tasks automatically when a table accumulates a certain percentage of changes (e.g. 20% of rows updated or deleted).

---

### (4) Reality Metaphor
Imagine an office building paper registry:
-   **Standard `VACUUM`:** A janitor walks around at night, locates folders marked "fired employees" (dead tuples), and throws them in the paper shredder, leaving empty slots in the drawer. The filing cabinets remain in place, and workers continue typing.
-   **`VACUUM FULL`:** Shutting down the entire office building for a weekend. You move all filing cabinets out to the parking lot, sweep the floor, rearrange the remaining active folders tightly, and bring back fewer cabinets, returning the extra cabinets to the warehouse (returning space to the OS). No work can happen during the weekend.
-   **`ANALYZE`:** The manager counts how many active folders are in each drawer and writes the tally on the whiteboard so planners can schedule tasks.

---

### (5) Code Examples

#### Running Vacuum and Analyze manually
```sql
-- 1. Standard Vacuum (Reclaims slot space in background)
VACUUM users;

-- 2. Update stats only
ANALYZE users;

-- 3. Run both together (Standard best practice)
VACUUM ANALYZE users;
```

#### The Table Bloat Audit
```sql
-- DANGER: Blocks all reads and writes! Only run during scheduled maintenance.
VACUUM FULL transaction_logs;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running VACUUM FULL on active production tables during peak hours

**The mistake:** Running `VACUUM FULL users;` to clean up disk space during a high-traffic business afternoon.

**Why it's wrong:** `VACUUM FULL` locks the table. Your web APIs trying to query user profiles or log check-ins will hang. 

Within seconds, the API request pool fills up, and your site displays `'504 Gateway Timeout'` errors.

**Fix: Only run `VACUUM FULL` during scheduled off-peak maintenance windows. For daily cleanups, trust the background `Autovacuum` daemon or run standard concurrent `VACUUM`.**

---



### Mistake 2: Running `VACUUM FULL` on Production High-Traffic Tables (Table Lock Disaster)

**The mistake:** Running `VACUUM FULL heavy_table;` to reclaim disk space during peak hours.

**Why it's wrong:** `VACUUM FULL` rewrites the entire table to a new disk file and acquires an `ACCESS EXCLUSIVE` lock, blocking ALL reads and writes for hours! Use standard `VACUUM` or `pg_repack`.

*Incorrect:*
```sql
VACUUM FULL heavy_table; -- ❌ Blocks all reads/writes for hours!
```

*Fix:*
```sql
Use standard autovacuum or extension pg_repack for non-blocking space reclamation
```

### Mistake 3: Disabling Autovacuum Daemon (`autovacuum = off`) in Production Configurations

**The mistake:** Setting `autovacuum = off` in `postgresql.conf` to increase raw write speed.

**Why it's wrong:** Disabling autovacuum causes extreme table dead tuple bloat, catalog statistics degradation, and eventual 32-bit transaction ID wraparound database shutdowns!

*Incorrect:*
```sql
autovacuum = off -- ❌ Severe table bloat and wraparound risk!
```

*Fix:*
```sql
Keep autovacuum = on enabled globally and tune scale factors for busy tables
```

## 6. Practice Exercises

### Exercise 1: Maintenance Command Sizing

**Problem:** Match the SQL commands to their logical database actions:
1.  `VACUUM`
2.  `ANALYZE`
3.  `VACUUM FULL`
4.  `VACUUM ANALYZE`

**Expected output:**
```text
1. VACUUM: Reclaims dead tuple slots concurrently without blocking reads or writes.
2. ANALYZE: Updates query planner statistics in the system catalogs.
3. VACUUM FULL: Rebuilds the table file on disk to return space to the OS, locking the table.
4. VACUUM ANALYZE: Performs both slot space reclamation and stats compilation in a single run.
```

> [!check]- Answer
> - Differentiate background tasks from blocking table rewrite operations.
> - Identify the command that targets the query planner's maps.

---



### Exercise 2: Executing Non-Blocking VACUUM ANALYZE

**Problem:** Run non-blocking `VACUUM ANALYZE` on `orders` table to clean dead tuples and update planner statistics.

**Expected output:**
```text
VACUUM ANALYZE orders;
```

> [!check]- Answer
> ```sql
> VACUUM ANALYZE orders;
> ```
>
> **Explanation:** Standard `VACUUM ANALYZE` reclaims dead tuple space concurrently while updating query planner statistics.

### Exercise 3: Role of Autovacuum Daemon

**Problem:** List 2 primary responsibilities of the autovacuum background daemon (1. Reclaims dead MVCC tuple space; 2. Updates `pg_statistic` planner statistics).

**Expected output:**
```text
1. Reclaims dead MVCC tuple space; 2. Updates pg_statistic planner statistics
```

> [!check]- Answer
> ```text
> 1. Reclaims dead MVCC tuple space; 2. Updates pg_statistic planner statistics
> ```
>
> **Explanation:** Autovacuum maintains MVCC storage health and query optimizer accuracy.

## 7. Related Terms
- [Query Planner / Optimizer](query_planner.md) — The stats consumer.
- [Index-Only Scan (Covering Index)](index_only_scan.md) — The scans that require clean visibility maps.

---

## 8. Key Takeaways
- Deletes and updates in Postgres generate invisible "dead tuples" on disk.
- Table Bloat slows down read scans and consumes unnecessary disk space.
- `VACUUM` marks dead tuple sectors as available for write reuse.
- `ANALYZE` compiles fresh table statistics to help the query planner.
- Standard `VACUUM` runs in the background; `VACUUM FULL` locks the table.
- Rely on the `Autovacuum` background service for automated daily cleanups.
