# Geospatial Index (`2dsphere` / `2d`)

> **Level 7 — Indexes & Query Performance**
> The specialized database index types designed to support spatial coordinate queries, comparing `2dsphere` (which calculates three-dimensional spherical geometries like Earth) with `2d` (which calculates flat, two-dimensional Cartesian coordinates).

---

## 1. Prerequisites
- [Geospatial Queries (`$near`, `$geoWithin`)](../../level_06/geospatial_queries.md) — The parent query commands.
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Coordinates must adhere strictly to coordinate bounds. Evaluated using Geohash-based indexing algorithms on the server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `geospatial_queries.md`, finding items within physical distances (e.g. nearby restaurants) requires specialized coordinate calculations. 

Because standard B-Tree indexes only sort in a single dimension (greater or less than a number), they cannot index 2D spatial coordinates (latitude and longitude) efficiently.

We designed **Geospatial Indexes** to solve this spatial search problem. 

They use specialized projection algorithms (like Geohashing) to divide the map into grid tiles and index the tiles. 

This enables instant lookups for queries checking circles, polygons, or nearest neighbors.

---

### (2) The Two Geospatial Index Types

#### 1. `2dsphere` (Spherical Earth Model)
Designed for real-world geography queries on a three-dimensional curved sphere (using the WGS84 datum).
-   *Coord Format:* Requires GeoJSON format (`[ Longitude, Latitude ]`).
-   *Calculations:* Accounts for Earth's curvature (great-circle distances).
-   *Use Case:* GPS tracking, ride-sharing proximity, and location-based apps.

#### 2. `2d` (Flat Cartesian Model)
Designed for flat, two-dimensional coordinate grids.
-   *Coord Format:* Legacy flat coordinate arrays (`[ x, y ]` or `[ lon, lat ]`).
-   *Calculations:* Uses simple Euclidean distance formulas (flat sheet math).
-   *Use Case:* Video game coordinate grids (virtual map coordinates) or warehouse bin mapping.

---

### (3) Reality Metaphor (Globes vs. Paper Maps)
-   **`2dsphere` Index:** A **3D Classroom Globe**. If you draw a path from New York to Paris, you trace a curved line along the round ball. (Accurate for Earth).
-   **`2d` Index:** A **Flat Paper Roadmap**. If you map the blocks of a warehouse building, you draw straight lines on a flat grid sheet. (Accurate for local rooms, but distorts distances when wrapped around a sphere).

---

### (4) Code Examples

#### Building a 2dsphere Proximity Index
Let's build a spatial search for store locations:

```javascript
db.stores.insertMany([
  {
    name: "Downtown Coffee",
    // GeoJSON Point:
    location: {
      type: "Point",
      coordinates: [ -71.0589, 42.3601 ] // [ Longitude, Latitude ]
    }
  }
]);

// Build the spherical index
db.stores.createIndex({ location: "2dsphere" });

// Run proximity query (requires the 2dsphere index!)
db.stores.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [ -71.06, 42.36 ]
      },
      $maxDistance: 1000 // Distance in meters
    }
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to build a 2dsphere index when the collection contains documents with coordinate values that fall out of spherical bounds

**The mistake:** Running `db.stores.createIndex({ location: "2dsphere" })` on a collection where a document contains `coordinates: [ -71, 95 ]` (setting latitude to 95 degrees).

**Why it's wrong:** Spherical geography rules dictate strict coordinate limits:
-   **Latitude** must be between **-90 and 90** degrees.
-   **Longitude** must be between **-180 and 180** degrees.
-   If any document contains values outside these limits, MongoDB's index build aborts and throws a database error.

**Fix: Write a diagnostic query to find and clean up invalid coordinate values before running the index build:**

```javascript
// Locate invalid latitudes
db.stores.find({ "location.coordinates.1": { $gt: 90 } });
db.stores.find({ "location.coordinates.1": { $lt: -90 } });
```

---



### Mistake 2: Creating `2d` Legacy Flat Indexes for Spherical Earth Surface Calculations

**The mistake:** Creating legacy `2d` index for global GPS coordinate queries.

**Why it's wrong:** Legacy `2d` indexes calculate distances on a flat Euclidean plane, producing location errors over long distances. Use `2dsphere` indexes for spherical Earth calculations.

*Incorrect:*
```javascript
db.places.createIndex({ location: "2d" }); // ❌ Flat Euclidean plane index!
```

*Fix:*
```javascript
db.places.createIndex({ location: "2dsphere" }); // Spherical Earth GeoJSON index
```

### Mistake 3: Reversing Coordinates in GeoJSON Points Indexed by `2dsphere`

**The mistake:** Indexing GeoJSON points stored as `[latitude, longitude]`.

**Why it's wrong:** GeoJSON strictly mandates `[longitude, latitude]` coordinate ordering.

*Incorrect:*
```javascript
coordinates: [40.7128, -74.0060] // Reversed latitude/longitude
```

*Fix:*
```javascript
coordinates: [-74.0060, 40.7128] // Correct [longitude, latitude]
```



### Mistake 4: Creating `2d` Legacy Flat Indexes for Spherical Earth Surface Calculations

**The mistake:** Creating legacy `2d` index for global GPS coordinate queries.

**Why it's wrong:** Legacy `2d` indexes calculate distances on a flat Euclidean plane, producing location errors over long distances. Use `2dsphere` indexes for spherical Earth calculations.

*Incorrect:*
```javascript
db.places.createIndex({ location: "2d" }); // ❌ Flat Euclidean plane index!
```

*Fix:*
```javascript
db.places.createIndex({ location: "2dsphere" }); // Spherical Earth GeoJSON index
```

### Mistake 5: Reversing Coordinates in GeoJSON Points Indexed by `2dsphere`

**The mistake:** Indexing GeoJSON points stored as `[latitude, longitude]`.

**Why it's wrong:** GeoJSON strictly mandates `[longitude, latitude]` coordinate ordering.

*Incorrect:*
```javascript
coordinates: [40.7128, -74.0060] // Reversed latitude/longitude
```

*Fix:*
```javascript
coordinates: [-74.0060, 40.7128] // Correct [longitude, latitude]
```

## 6. Practice Exercises

### Exercise 1: Geospatial Index Selector

**Problem:** You are building two systems. Select the correct index type (**2dsphere** or **2d**) for each requirement:
1.  A mobile food delivery application locating users near restaurants on Earth.
2.  A 2D multiplayer video game tracking player coordinates `[x, y]` on a flat virtual board of size $1000 \times 1000$.

**Expected output:**
```text
1. 2dsphere: Because food delivery coordinates reside on the curved spherical surface of the Earth, requiring GeoJSON calculations.
2. 2d: Because the video game maps coordinates onto a flat 2D coordinate grid, requiring Cartesian geometry calculations.
```

> [!check]- Answer
> - Determine if the coordinates exist on a spherical earth or a flat grid coordinate system.
> - Spherical geometry rules are mandatory for GeoJSON datums.

---



### Exercise 2: Creating 2dsphere Index

**Problem:** Create `2dsphere` index on `loc` field of `stores` collection.

**Expected output:**
```text
db.stores.createIndex({ loc: "2dsphere" });
```

> [!check]- Answer
> ```javascript
> db.stores.createIndex({ loc: "2dsphere" });
> ```
>
> **Explanation:** `2dsphere` indexes support GeoJSON spatial queries (`$near`, `$geoWithin`).

### Exercise 3: Geospatial Index Type Comparison

**Problem:** State difference between `2d` and `2dsphere` indexes (2d: flat 2D plane; 2dsphere: spherical Earth geometry).

**Expected output:**
```text
2d: flat Euclidean plane; 2dsphere: spherical Earth geometry
```

> [!check]- Answer
> ```text
> 2d: flat Euclidean plane; 2dsphere: spherical Earth geometry
> ```
>
> **Explanation:** `2dsphere` calculates real-world geodesic Earth distances.

## 7. Related Terms
- [Geospatial Queries (`$near`, `$geoWithin`)](../../level_06/geospatial_queries.md) — The query command.
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The DDL triggers.

---

## 8. Key Takeaways
- `2dsphere` indexes curved surfaces (Earth); `2d` indexes flat grids.
- Proximity queries like `$near` require a geospatial index to run.
- GeoJSON coordinates must be structured as `[ Longitude, Latitude ]`.
- Latitude values must stay in `[-90, 90]`; Longitudes in `[-180, 180]`.
- Invalid coordinate data causes index creation to crash.
- `2dsphere` calculates distances in meters; `2d` calculates flat coordinate units.
- Use `2d` for local flat assets (e.g. building layouts, virtual maps).
