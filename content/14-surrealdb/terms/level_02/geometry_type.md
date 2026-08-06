# `geometry` (GeoJSON)

> **Level 2 — Data Types & Record Structure**
> The native data type in SurrealDB for storing geospatial coordinates and shapes (using GeoJSON standards like Points, LineStrings, and Polygons), enabling built-in spatial queries and indexing.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (GeoJSON spatial coordinate data types)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: GeoJSON Point Creation & Spatial Storage

**Scenario:**
A food delivery platform stores restaurant location coordinates using GeoJSON `Point` geometry objects.

**Requirements:**
1. Define table `restaurant` in `SCHEMAFULL` mode.
2. Define field `location` as `geometry<point>`.
3. Create restaurant `restaurant:r1` at longitude `-73.9851` and latitude `40.7589` (Times Square, NYC).

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE restaurant SCHEMAFULL;
> DEFINE FIELD location ON TABLE restaurant TYPE geometry<point>;
> 
> CREATE restaurant:r1 SET 
>     name = "Central Diner",
>     location = { type: "Point", coordinates: [-73.9851, 40.7589] };
> ```
>
> #### Technical Explanation
>
> 1. `geometry<point>` enforces valid GeoJSON Point structure (`{ type: "Point", coordinates: [lng, lat] }`).
> 2. Coordinates must follow `[longitude, latitude]` order according to the GeoJSON spec.
> 3. Spatial types enable spatial indexing and geographic boundary queries.
> 
---

### Exercise 2: Spatial Proximity Distance Querying

**Scenario:**
A mobile app finds restaurants located within 5 kilometers of a user's current GPS position using `geo::distance()`.

**Requirements:**
1. Calculate geographic distance between restaurant `restaurant:r1` and user position `[-73.9800, 40.7500]`.
2. Filter restaurants where distance is $\le 5000$ meters.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- User location: [-73.9800, 40.7500]
> SELECT 
>     name, 
>     geo::distance(location, { type: "Point", coordinates: [-73.9800, 40.7500] }) AS distance_meters
> FROM restaurant
> WHERE geo::distance(location, { type: "Point", coordinates: [-73.9800, 40.7500] }) <= 5000;
> ```
>
> #### Technical Explanation
>
> 1. `geo::distance(point1, point2)` calculates Great Circle spherical distance in meters between two geometries.
> 2. Works natively with GeoJSON Point fields stored in SurrealDB.
> 3. Can be combined with spatial R-tree indexes (`DEFINE INDEX ... MTREE`) for fast spatial lookups.
> 
---

### Exercise 3: GeoJSON Polygon Boundary Containment

**Scenario:**
A delivery zone system checks whether a customer's address point lies inside a delivery zone GeoJSON `Polygon`.

**Requirements:**
1. Define a delivery zone polygon.
2. Query whether point `[-73.9851, 40.7589]` is inside the polygon using `inside` or `geo::intersects()`.

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
> SELECT { type: "Point", coordinates: [-73.9851, 40.7589] } INSIDE $zone AS is_deliverable;
> ```
>
> #### Technical Explanation
>
> 1. GeoJSON Polygons represent enclosed geographic areas defined by coordinate ring arrays.
> 2. The `INSIDE` operator evaluates point-in-polygon containment natively in SurrealQL.
> 3. Enables automated delivery coverage checks directly inside database queries.
> 
---



## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Geospatial Index](../level_07/geospatial_index.md) — Indexing spatial data.

---

## 7. Key Takeaways
- The `geometry` type stores geographic shapes (Points, LineStrings, Polygons).
- Natively compliant with standard GeoJSON schemas without requiring extensions.
- Coordinates must be written as `[Longitude, Latitude]` (Longitude first!).
- Polygons require a closed loop (last coordinate must match the first coordinate).
- Can use tuple syntax `(longitude, latitude)` for quick point entries.
- Enables database-level calculations like checking if a point is within an area.
- Pairs with geospatial indexes to query geographic boundaries efficiently.
