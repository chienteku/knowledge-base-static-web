# Time-Series Collections

> **Level 10 — Administration, Security & Advanced Features**
> The specialized collection type optimized for storing chronological sequences of measurements (like IoT sensor outputs or stock ticks), automatically organizing and compressing data into internal buckets on disk.

---

## 1. Prerequisites

- [The Outlier Pattern](../level_05/outlier_pattern.md) — The manual predecessor template.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Introduced in MongoDB 5.0. Managed at the database storage engine layer. Under the hood, reads/writes interact with standard collections while files are compressed in columnar formats).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications frequently log data points over time:
-   **IoT:** A thermometer logging temperature every 2 seconds.
-   **DevOps:** A server logging CPU load every 5 seconds.
-   **Finance:** Recording stock prices on every trade tick.

If you save each reading as a standard MongoDB document:
`{ time: Date("..."), sensor_id: 10, value: 23.5 }`
-   Each document contains duplicate key metadata strings (overhead).
-   If you log 10,000 sensors, disk footprint grows massive.
-   Index searches across dates become slow and consume RAM cache.

Historically, developers solved this using the **Bucket Pattern** (manually writing complex update queries to bundle array items inside one document per hour).

We designed **Time-Series Collections** to automate this. 

You write data points as simple, separate documents. 

MongoDB automatically intercepts the write, bundles the data points into highly compressed internal columns based on time and metadata fields, and stores them efficiently on disk, reducing disk footprint by up to 90% and speeding up range queries.

---

### (2) Configuration Parameters
To create a time-series collection, you must use the `db.createCollection()` command and configure:

1.  **`timeField`:** The field containing the timestamp (must be a BSON Date type).
2.  **`metaField` (Optional):** The field containing metadata that identifies the source (e.g. `sensor_id` or `device_mac`). MongoDB uses this to group related logs together.
3.  **`granularity`:** The frequency of incoming writes (`"seconds"`, `"minutes"`, or `"hours"`). Helps the engine choose the optimal internal bucket time span.

---

### (3) Reality Metaphor (Filing Receipts)
Imagine filing store receipts:
-   **Standard Collection:** Buying a full-sized paper folder for **every single receipt**. 
    -   If you buy coffee 3 times a day, you file 3 folders. 
    -   Your file cabinets fill up with empty folders instantly. (Excess key metadata overhead).
-   **Time-Series Collection:** A **Structured Log Binder**. 
    -   The filing clerk takes your receipts. 
    -   They bundle receipts from the **same store** (`metaField`) on the **same day** (`timeField`) onto a single, compact sheet, pressing it flat. 
    -   The cabinets are thin, neat, and you can pull June's coffee records instantly.

---

### (4) Code Examples

#### Creating and Inserting into a Time-Series Collection
Here is how to initialize and write data points in mongosh:

```javascript
// 1. Create the time-series collection
db.createCollection("weather_metrics", {
  timeseries: {
    timeField: "timestamp",      // The mandatory Date field
    metaField: "station_id",     // Group data by weather station ID
    granularity: "minutes"       // Optimize buckets for minute-interval writes
  }
});

// 2. Insert metrics (Write them as simple, flat documents!)
db.weather_metrics.insertMany([
  {
    station_id: "station_A",
    timestamp: new Date("2026-07-21T15:30:00Z"),
    temperature: 24.5,
    humidity: 60
  },
  {
    station_id: "station_A",
    timestamp: new Date("2026-07-21T15:31:00Z"),
    temperature: 24.6,
    humidity: 59
  }
]);

// 3. Query ranges normally (MongoDB handles column decompression automatically)
db.weather_metrics.find({
  station_id: "station_A",
  timestamp: {
    $gte: new Date("2026-07-21T15:00:00Z"),
    $lte: new Date("2026-07-21T16:00:00Z")
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating time-series collections as standard transactional collections, attempting frequent updates and document deletions

**The mistake:** Creating a time-series collection for user shopping cart sessions, attempting to update quantities or delete items dynamically using `updateOne` or `deleteOne`.

**Why it's wrong:** To maximize disk compression, time-series data is stored internally in structured column blocks. 

Modifying these blocks frequently requires expensive decompression, update, and re-compression cycles. 

Consequently, MongoDB restricts updates (requiring exact meta/time field matches) and deletes. 

They are designed strictly for **append-only, write-heavy, immutable log data**.

**Fix: Keep user carts or editable documents in standard MongoDB collections. Use time-series collections only for write-once metric logs (like sensor points, server telemetry, or audit trails).**

---



### Mistake 2: Creating Standard BSON Collections for High-Volume Time-Series Metric Data

**The mistake:** Creating standard BSON collections for storing 100,000 sensor measurements per second.

**Why it's wrong:** MongoDB 5.0+ native Time-Series Collections optimize disk storage compression by up to 90% and accelerate time-bucket queries compared to standard collections.

*Incorrect:*
```javascript
db.createCollection("sensor_data"); // Standard BSON collection for time-series
```

*Fix:*
```javascript
db.createCollection("sensor_data", { timeseries: { timeField: "timestamp", metaField: "sensorId", granularity: "seconds" } });
```

### Mistake 3: Modifying or Updating Historical Measurements in Time-Series Collections Frequently

**The mistake:** Executing frequent update mutations on historical time-series collection documents.

**Why it's wrong:** Time-Series Collections are optimized for insert-append and range queries. Frequent update/delete operations degrade compression and performance.

*Incorrect:*
```javascript
// Executing frequent updates on time-series documents
```

*Fix:*
```javascript
Design time-series collections for append-only data ingestion workflows
```

## 6. Practice Exercises

### Exercise 1: Collection Configuration

**Problem:** Write the mongosh command to initialize a time-series collection named `"stock_ticks"`.
-   The timestamp field is named `"trade_time"`.
-   The metadata field is named `"ticker_symbol"`.
-   The write frequency is configured to the level of seconds.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.createCollection("stock_ticks", {
>   timeseries: {
>     timeField: "trade_time",
>     metaField: "ticker_symbol",
>     granularity: "seconds"
>   }
> });
> ```
> - The collection creator helper is `db.createCollection`.
> - Declare the `timeseries` configurations inside the options object argument.

---



### Exercise 2: Creating Native Time-Series Collection

**Problem:** Create Time-Series Collection `weather` with `timeField: "timestamp"` and `metaField: "stationId"`.

**Expected output:**
> [!check]- Answer
> ```text
> db.createCollection("weather", { timeseries: { timeField: "timestamp", metaField: "stationId", granularity: "minutes" } });
> ```
> ```javascript
> db.createCollection("weather", {
>   timeseries: {
>     timeField: "timestamp",
>     metaField: "stationId",
>     granularity: "minutes"
>   }
> });
> ```
>
> **Explanation:** `timeseries: { timeField, metaField }` creates columnar-compressed time-series storage.

---

### Exercise 3: Time-Series Granularity Options

**Problem:** List 3 granularity settings for Time-Series Collections (`"seconds"`, `"minutes"`, `"hours"`).

**Expected output:**
> [!check]- Answer
> ```text
> "seconds", "minutes", "hours"
> ```
> ```text
> "seconds", "minutes", "hours"
> ```
>
> **Explanation:** `granularity` tunes internal bucket compression intervals for metric ingestion streams.

## 7. Related Terms

- [Capped Collections](capped_collections.md) — Circular storage logs.
- [The Outlier Pattern](../level_05/outlier_pattern.md) — The manual predecessor template.

---

## 8. Key Takeaways
- Time-series collections optimize storage for sequential chronological metrics.
- Automatically compress metrics on disk using columnar formats.
- Eliminates application-layer boilerplate of manual bucket patterns.
- Requires defining a `timeField` (timestamp) and optional `metaField` (source ID).
- `granularity` (`seconds`/`minutes`/`hours`) controls internal bucket sizing.
- Designed strictly for append-only, immutable metric streaming.
- Frequent document updates or deletions are restricted or slow.
