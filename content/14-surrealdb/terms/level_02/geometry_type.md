# `geometry` (GeoJSON)

> **Level 2 — Data Types & Record Structure**
> The native data type in SurrealDB for storing geospatial coordinates and shapes (using GeoJSON standards like Points, LineStrings, and Polygons), enabling built-in spatial queries and indexing.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Supports standard GeoJSON syntax. Spatial calculations are evaluated at the engine layer, utilizing earth curvature trigonometry).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Many applications require geographical calculations:
-   **Delivery Apps:** Finding restaurants within a 5-mile radius of a user.
-   **Real Estate:** Drawing area boundaries (Polygons) on a map to search houses.
-   **Fleet Management:** Tracking GPS coordinates (Points) of trucks.

In PostgreSQL, you must install the heavy **PostGIS** extension and configure custom operators. 

In MongoDB, you store coordinates as sub-objects and configure `2dsphere` indexes.

We designed the native **`geometry`** data type to provide out-of-the-box spatial support in SurrealDB. 

You do not need extensions. 

You declare a field as `TYPE geometry`. 

SurrealDB parses standard GeoJSON shapes, calculates distances, and checks if coordinates fall inside boundaries, streamlining location-based application logic.

---

### (2) Supported Geometry Types
SurrealDB supports standard GeoJSON spatial structures:

1.  **Point:** A single geographic coordinate.
    -   *Syntax:* `(longitude, latitude)` or `{ type: "Point", coordinates: [longitude, latitude] }`
2.  **LineString:** A path connecting multiple coordinates (e.g. a street path).
3.  **Polygon:** An enclosed area boundary (e.g. city limits).
4.  **Collection variants:** `MultiPoint`, `MultiLineString`, `MultiPolygon`, and `GeometryCollection`.

---

### (3) Reality Metaphor (Pins and Highlighters)
Imagine tracking deliveries on a wall map:
-   **No Geospatial Support:** Storing addresses as text strings: `"123 Elm St."` 
    -   The filing system doesn't know where that is in the physical world.
-   **`geometry` Support:** Storing location data as physical **Push Pins** (Points) or drawing **Highlighter Boundaries** (Polygons) directly on a digital glass globe. 
    -   Because the database understands the globe's geometry, it can instantly calculate which driver pins are inside your delivery boundary.

---

### (4) Code Examples

#### Creating and Writing Geometry Fields
Let's define a restaurant and delivery zone schema:

```sql
DEFINE TABLE restaurant SCHEMAFULL;

-- 1. Declare the field as a geometry type
DEFINE FIELD location ON restaurant TYPE geometry;

-- 2. Insert records using GeoJSON point coordinates
-- WARNING: Longitude comes FIRST, Latitude SECOND!
CREATE restaurant:pizza SET
  name = "Luigi's Pizza",
  location = (-73.9857, 40.7484); // New York (Long, Lat)

-- 3. Define a table with polygon boundaries (e.g. delivery zones)
DEFINE TABLE delivery_zone SCHEMAFULL;
DEFINE FIELD area ON delivery_zone TYPE geometry;

CREATE delivery_zone:manhattan SET
  name = "Manhattan Zone",
  area = {
    type: "Polygon",
    coordinates: [[
      [-74.018, 40.700],
      [-73.971, 40.700],
      [-73.971, 40.800],
      [-74.018, 40.800],
      [-74.018, 40.700] // Must close the loop by repeating the first point!
    ]]
  };
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Reversing coordinate pairs by placing Latitude first and Longitude second, placing your data in the wrong hemisphere

**The mistake:** Storing London coordinates (latitude `51.5`, longitude `-0.1`) as `(-0.1, 51.5)` or reversing them to `(51.5, -0.1)`.

**Why it's wrong:** Google Maps displays coordinates as `[Latitude, Longitude]`. 

However, the international GeoJSON standard (and SurrealDB) **requires Longitude first and Latitude second: `[Longitude, Latitude]`**. 

Reversing them flips the X and Y axes, placing your GPS points in completely wrong countries or oceans.

**Fix: Train your backend API or data loaders to map coordinates explicitly as `[Longitude, Latitude]` before writing them to SurrealDB.**

---



### Mistake 2: Reversing Longitude and Latitude Coordinates in GeoJSON Point Literals

**The mistake:** Creating Point geometries with `[latitude, longitude]` coordinate order.

**Why it's wrong:** GeoJSON and SurrealDB Geometry formats strictly mandate `[longitude, latitude]` coordinate order (`[X, Y]`). Reversing coordinates places locations in the wrong hemisphere.

*Incorrect:*
```surrealql
-- Reversed (Latitude, Longitude):
LET $pt = { type: "Point", coordinates: [51.5074, -0.1278] }; // ❌ Wrong order!
```

*Fix:*
```surrealql
-- Correct (Longitude, Latitude):
LET $pt = { type: "Point", coordinates: [-0.1278, 51.5074] };
```

### Mistake 3: Querying Geospatial Distances without Indexing Geometry Fields

**The mistake:** Running `WHERE location <inside> $area` on un-indexed millions of records.

**Why it's wrong:** Geospatial queries on un-indexed geometry fields scan every record sequentially. Create an R-Tree index via `DEFINE INDEX ... MESH` / `SEARCH` for fast spatial queries.

*Incorrect:*
```surrealql
-- Unindexed spatial query
SELECT * FROM store WHERE location <inside> $polygon;
```

*Fix:*
```surrealql
DEFINE INDEX store_location_idx ON TABLE store FIELDS location MTREE;
SELECT * FROM store WHERE location <inside> $polygon;
```

## 6. Practice Exercises

### Exercise 1: Geometry Syntax Audit

**Problem:** You are reviewing a delivery boundary configuration script. 
Explain why the following Polygon coordinate insert query will fail to compile or throw errors:
`area = { type: "Polygon", coordinates: [[ [-74.0, 40.0], [-73.5, 40.0], [-73.5, 40.5], [-74.0, 40.5] ]] }`

**Expected output:**
> [!check]- Answer
> ```text
> The query will fail because the Polygon ring coordinates list is not closed. 
> Under GeoJSON rules, the final coordinate pair in a Polygon path must match the starting coordinate pair exactly to close the boundary loop. 
> To fix it, append the starting coordinate `[-74.0, 40.0]` to the end of the array.
> ```
> - Check the start and end coordinates of the inner array.
> - A polygon requires an enclosed loop to calculate space boundaries.

---



### Exercise 2: Defining GeoJSON Point Field

**Problem:** Define field `location` on `store` table as geometry point `TYPE geometry<feature>` or `TYPE geometry<point>`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD location ON TABLE store TYPE geometry<point>;
> ```
> ```surrealql
> DEFINE FIELD location ON TABLE store TYPE geometry<point>;
> ```
>
> **Explanation:** `TYPE geometry<point>` restricts spatial fields to GeoJSON points.

---

### Exercise 3: Checking Spatial Containment with `<inside>` Operator

**Problem:** Check if `$point` is inside `$polygon` using `<inside>` spatial operator.

**Expected output:**
> [!check]- Answer
> ```text
> SELECT * FROM store WHERE location <inside> $polygon;
> ```
> ```surrealql
> SELECT * FROM store WHERE location <inside> $polygon;
> ```
>
> **Explanation:** `<inside>` tests if geometry points fall within polygon boundaries.

## 7. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Geospatial Index](../level_07/geospatial_index.md) — Indexing spatial data.

---

## 8. Key Takeaways
- The `geometry` type stores geographic shapes (Points, LineStrings, Polygons).
- Natively compliant with standard GeoJSON schemas without requiring extensions.
- Coordinates must be written as `[Longitude, Latitude]` (Longitude first!).
- Polygons require a closed loop (last coordinate must match the first coordinate).
- Can use tuple syntax `(longitude, latitude)` for quick point entries.
- Enables database-level calculations like checking if a point is within an area.
- Pairs with geospatial indexes to query geographic boundaries efficiently.
