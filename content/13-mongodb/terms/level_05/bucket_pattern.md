# The Bucket Pattern

> **Level 5 — Data Modeling & Schema Design**
> The schema design pattern used in time-series, IoT, and logging applications that aggregates sequential event readings into fixed-size "bucket" documents to reduce index sizes and accelerate range queries.

---

## 1. Prerequisites
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [updateOne() / updateMany()](../../level_03/update.md) — executing updates.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Crucial for high-ingestion time-series platforms. Standard practice in IoT, stock tickers, and system performance monitoring engines).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In IoT systems or server monitors, devices stream data constantly:
-   A weather sensor writes temperature every 10 seconds.
-   A stock ticker logs price changes every millisecond.

If you write a separate document for every single reading:
`{ device_id: 1, temp: 22.4, time: 10:00:00 }`
`{ device_id: 1, temp: 22.5, time: 10:00:10 }`

This creates severe database bottlenecks:
-   **Metadata Bloat:** Each document must store its own `_id`, field keys (`device_id`, `temp`, `time`), and index pointers. The metadata overhead can exceed the actual data size!
-   **Index Explosion:** The database must index millions of documents daily, exhausting RAM cache.
-   **Slow Range Queries:** Fetching a 1-hour history chart requires reading 360 separate documents from disk.

We designed **The Bucket Pattern** to solve this. 

Instead of writing one document per reading, you group readings into **fixed-time or fixed-count "buckets"** (such as 1 hour or 100 readings) inside a single document.

---

### (2) Bucket Structure
A bucket document targets a specific device and time window:
-   It stores metadata at the root level (e.g. `device_id`, `date`, `start_time`).
-   It stores the actual readings inside a nested array: `measurements: [ { time: 10:00:00, temp: 22.4 }, ... ]`.

---

### (3) Reality Metaphor (Milk Cartons)
Imagine packaging milk from a dairy farm:
-   **One Document per Log:** Storing milk in **millions of tiny plastic eyedroppers**. 
    -   Each eyedropper requires its own label, cap, and slot in a warehouse crate. 
    -   This takes massive space (metadata bloat) and drinking a glass of milk requires opening 500 eyedroppers (slow range queries).
-   **The Bucket Pattern:** Pouring the milk into **1-Gallon Cartons** (the buckets). 
    -   Each carton holds a fixed volume of milk. 
    -   You only label and store a few cartons, and pouring a glass of milk is instant.

---

### (4) Code Examples

#### 1. Ingestion via the Bucket Pattern (Upsert)
To save data, the application uses `updateOne()` with `upsert: true` and a count ceiling check:

```javascript
// Add a reading to the current hour's bucket. 
// If the bucket doesn't exist, create it. If it has less than 1000 items, append to it.
db.sensor_buckets.updateOne(
  {
    device_id: 105,
    count: { $lt: 1000 }, // Cap the bucket size to prevent bloat!
    hour_bucket: new Date("2026-07-21T23:00:00Z")
  },
  {
    $push: { measurements: { temp: 22.4, time: new Date() } },
    $inc: { count: 1 }, // Track the number of items in the bucket
    $setOnInsert: { created_at: new Date() } // Set metadata on create
  },
  { upsert: true }
);
```

#### 2. The Resulting Bucket Document
```json
{
  "_id": ObjectId("65fc71239b1d8b2e88a8d111"),
  "device_id": 105,
  "hour_bucket": "2026-07-21T23:00:00Z",
  "count": 2,
  "measurements": [
    { "temp": 22.4, "time": "2026-07-21T23:00:10Z" },
    { "temp": 22.5, "time": "2026-07-21T23:00:20Z" }
  ]
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing to cap the bucket size, allowing the nested measurements array to grow infinitely

**The mistake:** Creating a single bucket document per device and pushing all readings into it forever, without checking size bounds.

**Why it's wrong:** An uncapped array will eventually hit the 16MB document size limit, crashing all subsequent writes. 

Furthermore, loading a bloated multi-megabyte bucket document to read a single value wastes database performance.

**Fix: Always implement a count limit check (e.g. `{ count: { $lt: 1000 } }` or `{ hour_bucket: new Date(...) }`) in your query filter to automatically spawn a new bucket document when the current bucket fills.**

---



### Mistake 2: Storing IoT Time-Series Data as One Document Per Second (Document Explosion)

**The mistake:** Inserting 1 document per second for 10,000 IoT sensors (864,000,000 documents per day).

**Why it's wrong:** Inserting 1 document per second creates massive index and storage overhead. The Bucket Pattern groups measurements by hour/day into single bucket documents containing measurement arrays.

*Incorrect:*
```javascript
// Inserting 1 document per second for every sensor
```

*Fix:*
```javascript
Group measurements by hour/device into bucket documents: { deviceId, hour, count: 3600, measurements: [...] }
```

### Mistake 3: Allowing Time-Series Buckets to Grow Beyond Fixed Bounds

**The mistake:** Creating a bucket document without capping the number of measurements per bucket (e.g. 100 or 1,000 items).

**Why it's wrong:** Uncapped bucket documents grow without bound, risking 16MB document size limit violations. Cap bucket limits and roll over to new bucket documents.

*Incorrect:*
```javascript
db.sensor_buckets.updateOne({ deviceId, count: { $lt: 1000000 } }, ...);
```

*Fix:*
```javascript
db.sensor_buckets.updateOne({ deviceId, count: { $lt: 1000 } }, { $push: { readings }, $inc: { count: 1 } }, { upsert: true });
```

## 6. Practice Exercises

### Exercise 1: Ingestion Query Formulation

**Problem:** A solar panel sensor (`panel_id: 44`) logs `watts_generated: 15.2` every minute. You decide to bucket data by **day** (`date_bucket: "2026-07-21"`), capping each document at **1440** readings (1 day of minutes).
Write the MongoDB upsert query to log a reading.

**Expected output:**
```javascript
db.solar_buckets.updateOne(
  {
    panel_id: 44,
    date_bucket: "2026-07-21",
    count: { $lt: 1440 }
  },
  {
    $push: { readings: { watts: 15.2, time: new Date() } },
    $inc: { count: 1 }
  },
  { upsert: true }
);
```

> [!check]- Answer
> - Match the panel ID, the current date bucket, and check that the count is strictly less than 1440.
> - Append the new reading to the array using `$push` and increment the count using `$inc`.
> - Enable the upsert option.

---



### Exercise 2: Bucket Pattern Document Structure

**Problem:** Model IoT sensor bucket document for `sensor:100` storing hourly readings and summary metrics.

**Expected output:**
```text
{ sensorId: 100, day: ISODate("2026-01-01"), count: 60, readings: [...] }
```

> [!check]- Answer
> ```javascript
> const bucket = {
>   sensorId: 100,
>   day: new Date("2026-01-01T00:00:00Z"),
>   count: 60,
>   sum: 1200,
>   readings: [ { t: 0, val: 20 }, { t: 1, val: 22 } ]
> };
> ```
>
> **Explanation:** Bucket Pattern aggregates time-series data streams into bounded group documents.

### Exercise 3: Upserting into Bounded Bucket Document

**Problem:** Upsert reading into bucket `sensorId: 100` where `count < 100` using `$inc` and `$push`.

**Expected output:**
```text
db.buckets.updateOne({ sensorId: 100, count: { $lt: 100 } }, { $push: { readings: reading }, $inc: { count: 1, sum: reading.val } }, { upsert: true });
```

> [!check]- Answer
> ```javascript
> db.buckets.updateOne(
>   { sensorId: 100, count: { $lt: 100 } },
>   { $push: { readings: reading }, $inc: { count: 1, sum: reading.val } },
>   { upsert: true }
> );
> ```
>
> **Explanation:** `{ count: { $lt: N } }` with `upsert: true` automatically rolls over to new buckets when caps are reached.

## 7. Related Terms
- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Upsert (`upsert: true`)](../../level_03/upsert.md) — The ingestion operator.

---

## 8. Key Takeaways
- The Bucket Pattern groups time-series event data into fixed-size documents.
- Drastically reduces database index sizes and document counts.
- Speeds up range queries by reading sequential logs in a single read.
- Utilizes `updateOne` + `upsert: true` to append readings dynamically.
- Always enforce a bucket size ceiling (e.g., maximum count or time duration).
- Failing to cap bucket sizes causes documents to hit the 16MB boundary.
- Perfect for IoT sensors, financial stock feeds, and performance logging.
