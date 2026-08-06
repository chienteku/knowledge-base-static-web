# Geospatial Index

> **Level 7 — Indexes, Full-Text Search & Performance**
> The index architecture in SurrealDB designed for spatial coordinate data (`geometry` fields), accelerating distance calculations, polygon boundary checks, and nearest-location queries.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [`geometry` (GeoJSON)](../level_02/geometry_type.md) — Geospatial data types.

---

## 2. Term Category


**Performance / Operations (R-tree spatial coordinate index)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: MTREE Geospatial Index Creation

**Scenario:**
A rideshare service indexes vehicle locations (`location` GeoJSON Point) using an R-Tree / MTREE spatial index.

**Requirements:**
1. Define field `location` as `geometry<point>`.
2. Define spatial index `idx_vehicle_loc` ON TABLE `vehicle` COLUMNS `location` MTREE.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE vehicle SCHEMAFULL;
> DEFINE FIELD location ON TABLE vehicle TYPE geometry<point>;
> 
> -- Define MTREE spatial index
> DEFINE INDEX idx_vehicle_loc ON TABLE vehicle COLUMNS location MTREE;
> ```
>
> #### Technical Explanation
>
> 1. `MTREE` builds bounding-box spatial R-tree index structures for GeoJSON geometries.
> 2. Accelerates spatial proximity (`geo::distance`) and bounding box containment queries.
> 3. Converts spatial $O(N)$ scans into fast spatial index lookups.

---

### Exercise 2: Spatial Proximity Queries with MTREE

**Scenario:**
Find all vehicles located within 5000 meters of coordinates `[-73.9851, 40.7589]` using spatial indexing.

**Requirements:**
1. Write a `SELECT` query utilizing `geo::distance()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM vehicle 
> WHERE geo::distance(location, { type: "Point", coordinates: [-73.9851, 40.7589] }) <= 5000;
> ```
>
> #### Technical Explanation
>
> 1. `geo::distance()` evaluates spherical distance in meters.
> 2. SurrealDB's query planner leverages `MTREE` indexes to prune distant spatial regions.
> 3. Powers real-time geospatial location features.

---

### Exercise 3: Polygon Boundary Spatial Search

**Scenario:**
Query vehicles located inside a delivery zone GeoJSON Polygon.

**Requirements:**
1. Use `INSIDE` operator with a polygon variable `$zone`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $zone = {
>     type: "Polygon",
>     coordinates: [[
>         [-74.00, 40.70],
>         [-73.95, 40.70],
>         [-73.95, 40.80],
>         [-74.00, 40.80],
>         [-74.00, 40.70]
>     ]]
> };
> 
> SELECT * FROM vehicle WHERE location INSIDE $zone;
> ```
>
> #### Technical Explanation
>
> 1. `INSIDE` evaluates point-in-polygon containment using MTREE spatial indexes.
> 2. Prunes spatial search areas outside polygon bounding boxes.
> 3. Enables automated geofencing coverage checks.

---



## 6. Related Terms

- [`geometry` (GeoJSON)](../level_02/geometry_type.md) — Geospatial data type.
- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.

---

## 7. Key Takeaways
- Geospatial indexes accelerate spatial radius lookups and boundary checks.
- Automatically handles GeoJSON `geometry` data types (Point, Polygon, etc.).
- Relational equivalent to PostGIS `GIST` indexes; NoSQL equivalent to MongoDB `2dsphere` indexes.
- Prevents expensive spherical trigonometry scans across full tables.
- Use `geo::distance()` for distance calculations (in meters).
- Always format point coordinates as `(Longitude, Latitude)`.
