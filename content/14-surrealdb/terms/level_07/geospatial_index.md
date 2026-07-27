# Geospatial Index

> **Level 7 — Indexes, Full-Text Search & Performance**
> The index architecture in SurrealDB designed for spatial coordinate data (`geometry` fields), accelerating distance calculations, polygon boundary checks, and nearest-location queries.

---

## 1. Prerequisites
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.
- [`geometry` (GeoJSON)](../level_02/geometry_type.md) — Geospatial data types.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the spatial engine. Uses spatial bounding box indexes to evaluate spherical earth trigonometry during queries).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Spatial queries operate on multi-dimensional geographic coordinates:
- Finding restaurants within a 5-kilometer radius of a user's current GPS location (`(longitude, latitude)`).
- Checking whether a delivery driver is inside a polygon delivery zone boundary.

Without a spatial index:
- The database engine must calculate spherical distance formulas (like the Haversine formula) for **every record in the table** sequentially.
- Running trigonometry calculations across millions of rows causes queries to lag.

In PostgreSQL, developers install PostGIS and create R-Tree indexes (`GIST`). In MongoDB, developers create `2dsphere` indexes.

We designed native **Geospatial Indexing** in SurrealDB to provide out-of-the-box spatial query acceleration. By defining an index on a `geometry` field (`DEFINE INDEX idx_loc ON restaurant COLUMNS location;`), SurrealDB automatically builds spatial bounding box indexes, allowing location-based radius lookups to run in milliseconds.

---

### (2) Geospatial Functions & Operators
SurrealDB provides built-in spatial functions that leverage geospatial indexes:
- `geo::distance(point1, point2)`: Calculates spherical distance in meters between two coordinates.
- `geo::is::inside(point, polygon)`: Returns `true` if a point falls within a polygon area.
- `<-near->` / spatial operators for bounding box filters.

---

### (3) Reality Metaphor (GPS Map Grid Overlays)
Imagine finding nearby gas stations:
- **No Spatial Index (Haversine Scan):** Measuring the exact kilometer distance from your car to every single gas station across the entire country one-by-one.
- **Geospatial Index:** Dividing the digital map into a **Grid Matrix of Bounding Boxes**.
  - The map system checks which grid box your car sits in.
  - It instantly ignores 99% of gas stations in other cities and measures distance only to gas stations inside your current local grid box.

---

### (4) Code Examples

#### Creating Geospatial Indexes in SurrealQL

```sql
DEFINE TABLE store SCHEMAFULL;
DEFINE FIELD location ON store TYPE geometry;

-- 1. Define a geospatial index on a geometry field
DEFINE INDEX idx_store_location ON store COLUMNS location;

-- 2. Insert sample store coordinates (Longitude FIRST, Latitude SECOND!)
CREATE store SET name = "Downtown Bakery", location = (-73.9857, 40.7484);

-- 3. Query stores within 5,000 meters (5km) of a user's location
LET $user_loc = (-73.9850, 40.7480);

SELECT 
  name,
  geo::distance(location, $user_loc) AS distance_meters
FROM store
WHERE geo::distance(location, $user_loc) <= 5000
ORDER BY distance_meters ASC;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Reversing coordinate pairs when defining or querying geospatial points, causing index lookups to target wrong geographic locations

**The mistake:** Passing `(40.7484, -73.9857)` expecting `[Latitude, Longitude]` format.

**Why it's wrong:** SurrealDB strictly follows the international GeoJSON standard: `[Longitude, Latitude]`. Passing latitude first places your coordinates in the wrong hemisphere, causing spatial queries to return zero matches.

**Fix: Always write spatial point coordinates as `(Longitude, Latitude)`:**

```sql
-- CORRECT (Long, Lat)
CREATE store SET location = (-73.9857, 40.7484);
```

---



### Mistake 2: Using B-Tree Indexes for Geometry Coordinates instead of Spatial MTREE Indexes

**The mistake:** Defining a default B-Tree index on a GeoJSON `location` field (`FIELDS location`).

**Why it's wrong:** B-Tree indexes cannot evaluate 2D spatial polygon containment or distance bounds. Define spatial indexes using `MTREE`.

*Incorrect:*
```surrealql
DEFINE INDEX loc_idx ON TABLE store FIELDS location; // Default B-Tree cannot do 2D spatial queries!
```

*Fix:*
```surrealql
DEFINE INDEX loc_idx ON TABLE store FIELDS location MTREE; // Spatial MTREE index
```

### Mistake 3: Reversing Coordinate Orders in Geometry Data Insertions

**The mistake:** Inserting GeoJSON points with `[latitude, longitude]` coordinate order.

**Why it's wrong:** SurrealDB spatial indexes strictly require GeoJSON `[longitude, latitude]` (`[X, Y]`) coordinate order.

*Incorrect:*
```surrealql
CREATE store SET location = { type: "Point", coordinates: [51.5074, -0.1278] }; // ❌ Reversed!
```

*Fix:*
```surrealql
CREATE store SET location = { type: "Point", coordinates: [-0.1278, 51.5074] };
```

## 6. Practice Exercises

### Exercise 1: Spatial Index & Radius Query

**Problem:** You have a `drivers` table with a `location` field (`TYPE geometry`).
Write the SurrealQL statements to:
1. Create a spatial index named `idx_driver_loc` on table `drivers`, column `location`.
2. Write a query to select `driver_id` from `drivers` where `geo::distance(location, $client_loc)` is less than or equal to `2000` meters.

**Expected output:**
```sql
-- 1. Define Index
DEFINE INDEX idx_driver_loc ON drivers COLUMNS location;

-- 2. Radius Query
SELECT driver_id FROM drivers WHERE geo::distance(location, $client_loc) <= 2000;
```

> [!check]- Answer
> - Define the spatial index with `DEFINE INDEX idx_driver_loc ON drivers COLUMNS location;`.
> - Distance comparison is in meters (`<= 2000`).

---



### Exercise 2: Defining Spatial MTREE Index

**Problem:** Define MTREE spatial index `store_geo_idx` on `store` table for `location` geometry field.

**Expected output:**
```text
DEFINE INDEX store_geo_idx ON TABLE store FIELDS location MTREE;
```

> [!check]- Answer
> ```surrealql
> DEFINE INDEX store_geo_idx ON TABLE store FIELDS location MTREE;
> ```
>
> **Explanation:** `MTREE` indexes spatial geometry fields for `<inside>` spatial queries.

### Exercise 3: Spatial Polygon Containment Query

**Problem:** Select all stores whose `location` is inside `$boundary_polygon`.

**Expected output:**
```text
SELECT * FROM store WHERE location <inside> $boundary_polygon;
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM store WHERE location <inside> $boundary_polygon;
> ```
>
> **Explanation:** `<inside>` evaluates spatial polygon containment utilizing MTREE indexes.

## 7. Related Terms
- [`geometry` (GeoJSON)](../level_02/geometry_type.md) — Geospatial data type.
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.

---

## 8. Key Takeaways
- Geospatial indexes accelerate spatial radius lookups and boundary checks.
- Automatically handles GeoJSON `geometry` data types (Point, Polygon, etc.).
- Relational equivalent to PostGIS `GIST` indexes; NoSQL equivalent to MongoDB `2dsphere` indexes.
- Prevents expensive spherical trigonometry scans across full tables.
- Use `geo::distance()` for distance calculations (in meters).
- Always format point coordinates as `(Longitude, Latitude)`.
