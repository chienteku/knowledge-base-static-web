# The Bucket Pattern

> **Level 5 — Data Modeling & Schema Design**
> The schema design pattern used in time-series, IoT, and logging applications that aggregates sequential event readings into fixed-size "bucket" documents to reduce index sizes and accelerate range queries.

---

## 1. Prerequisites

- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [`updateOne()` / `updateMany()`](../level_03/update.md) — executing updates.

---

## 2. Term Category

**Data Modeling** (Time-Series & Telemetry Grouping Pattern): The Bucket Pattern groups time-series datapoints or log events into discrete time-bounded bucket documents to optimize index footprint and IOPS.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Crucial for high-ingestion time-series platforms. Standard practice in IoT, stock tickers, and system performance monitoring engines).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Bucketing IoT Sensor Readings by Hour

**Scenario:**
Group incoming IoT temperature sensor readings into 1-hour bucket documents in collection `sensor_buckets`.

**Requirements:**
1. Store `deviceId`, `bucketStart`, `count`, and `readings: [{ t, val }]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const now = new Date();
> const hourStart = new Date(now.setMinutes(0, 0, 0));
> 
> db.sensor_buckets.updateOne(
>   {
>     deviceId: "DEV-101",
>     bucketStart: hourStart,
>     count: { $lt: 60 }
>   },
>   {
>     $push: { readings: { t: new Date(), val: 22.4 } },
>     $inc: { count: 1, sumVal: 22.4 },
>     $setOnInsert: { deviceId: "DEV-101", bucketStart: hourStart }
>   },
>   { upsert: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. The Bucket Pattern groups time-series datapoints into pre-allocated time bucket documents.
> 2. Reduces total collection document count by 60x to 1000x compared to 1-doc-per-reading models.
> 3. Dramatically reduces index memory footprint and IOPS.
> 
---

### Exercise 2: Computing Pre-Aggregated Bucket Metrics

**Scenario:**
Maintain pre-calculated `minVal` and `maxVal` summary fields inside sensor bucket documents during upserts.

**Requirements:**
1. Use `$min` and `$max` operators during bucket updates.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.sensor_buckets.updateOne(
>   { deviceId: "DEV-101", bucketStart: hourStart },
>   {
>     $push: { readings: { t: new Date(), val: 24.8 } },
>     $inc: { count: 1 },
>     $min: { minVal: 24.8 },
>     $max: { maxVal: 24.8 }
>   },
>   { upsert: true }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$min` and `$max` calculate running summary bounds inside bucket documents atomically.
> 2. Allows dashboards to query pre-computed min/max values without scanning individual array items.
> 3. Accelerates analytical reporting queries.
> 
---

### Exercise 3: Evaluating Native Time-Series Collections vs Manual Bucketing

**Scenario:**
Compare manual Bucket Pattern schemas against MongoDB 5.0+ native Time-Series collections.

**Requirements:**
1. Contrast manual bucketing vs native `timeseries` collection features.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // MongoDB 5.0+ Native Time-Series Collection Creation
> db.createCollection("weather_metrics", {
>   timeseries: {
>     timeField: "timestamp",
>     metaField: "metadata",
>     granularity: "hours"
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. Native Time-Series collections handle bucketing, columnar compression, and lifecycle management automatically.
> 2. Manual bucketing is useful when custom bucket limits or pre-aggregations are required.
> 3. Both models significantly reduce disk and memory overhead.
> 
---



## 6. Related Terms

- [Schema Design (Document Modeling)](schema_design.md) — The parent modeling rules.
- [Upsert (`upsert: true`)](../level_03/upsert.md) — The ingestion operator.
- [`$bucket` / `$bucketAuto` Stages](../level_06/bucket_stages.md) — Related concept: `$bucket` / `$bucketAuto` Stages.

---

## 7. Key Takeaways
- The Bucket Pattern groups time-series event data into fixed-size documents.
- Drastically reduces database index sizes and document counts.
- Speeds up range queries by reading sequential logs in a single read.
- Utilizes `updateOne` + `upsert: true` to append readings dynamically.
- Always enforce a bucket size ceiling (e.g., maximum count or time duration).
- Failing to cap bucket sizes causes documents to hit the 16MB boundary.
- Perfect for IoT sensors, financial stock feeds, and performance logging.
