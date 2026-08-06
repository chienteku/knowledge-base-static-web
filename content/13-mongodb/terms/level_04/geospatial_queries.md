# Geospatial Queries (`$near`, `$geoWithin`, `2dsphere`)

> **Level 4 — Advanced Querying**
> MongoDB's native location-based querying system that uses standard GeoJSON coordinates, specialized spherical indexes (`2dsphere`), and search operators (`$near`, `$geoWithin`) to perform distance and boundary geometry lookups.

---

## 1. Prerequisites

- [`find()` / `findOne()`](../level_03/find.md) — The query execution methods.

---

## 2. Term Category

**Query Operator** (Spatial Location Queries): Geospatial Query Operators ($near, $geoWithin, $geoIntersects) execute spatial proximity and boundary containment queries over GeoJSON geometries.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Requires using standardized GeoJSON objects. Geospatial operators automatically calculate distances using spherical geometry formulas (haversine formula) on a model of the Earth's surface).

### (1) Design Motivation — "Why did we design this?"
Modern mobile applications require location-aware databases:
-   A ride-sharing app needs to find the **nearest taxi drivers** to a user.
-   A restaurant finder needs to find cafes located **within 2 miles**.
-   A logistics dashboard needs to check if a truck has entered a specific delivery zone (geofencing).

In PostgreSQL, you need to install and configure the heavy `PostGIS` extension to handle coordinates.

We designed **Geospatial Queries** directly into the core MongoDB engine to simplify location-based services. 

By representing locations as standard JSON objects called **GeoJSON**, and indexing them using **`2dsphere`**, you can run radius searches, boundary overlaps, and proximity sorting natively without complex math calculations in your backend server code.

---

### (2) GeoJSON Format & Coordinate Ordering

#### 1. GeoJSON Structure
Coordinates are stored as structured subdocuments:
```json
"location": {
  "type": "Point",
  "coordinates": [ -0.1278, 51.5074 ]
}
```

#### 2. The Longitude-First Rule (CRITICAL)
In traditional mapping, people write coordinates as `[ Latitude, Longitude ]`. 

**GeoJSON reverses this ordering, requiring Longitude first:**

`[ Longitude, Latitude ]`

-   *Mnemonic:* Think of alphabetical order: **Lon**gitude comes before **Lat**itude (**Lo** comes before **La**).
-   *Danger:* If you write latitude first, your point will be plotted in a completely different country, or throw out-of-bounds validation errors (since latitude only goes up to 90°, while longitude goes to 180°).

---

### (3) The Core Geospatial Operators

#### 1. `2dsphere` Index
A spherical index that calculates geometries on an Earth-like sphere.
-   `db.collection.createIndex({ location: "2dsphere" })`

#### 2. `$near` (Proximity Search)
Finds points closest to a target coordinate and **automatically sorts them by distance** (closest first).
-   Supports `$maxDistance` (specified in meters).

#### 3. `$geoWithin` (Boundary Search)
Finds documents that exist entirely within a specified bounding shape (like a polygon boundary or a circle). Does not sort results.

---

### (4) Reality Metaphor
Imagine a massive paper map pinned to a wall:
-   **`$near`:** You drop a pushpin into the map, tie a string to it, stretch the string to represent 2 miles (`$maxDistance`), and swing it in a circle. You record every store the string touches, listing the closest ones first.
-   **`$geoWithin`:** You take a red marker and draw a **Custom Boundary Loop** (a Polygon) around a city neighborhood. You write down the name of every house located inside the red line.

---

### (5) Code Examples

#### Locating the Nearest Coffee Shops
First, index the location field:

```javascript
db.cafes.createIndex({ location: "2dsphere" });
```

Find cafes within 1000 meters (1 km) of London coordinates, sorting by distance:

```javascript
db.cafes.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [ -0.1278, 51.5074 ] // [ Longitude, Latitude ] !
      },
      $maxDistance: 1000 // Distance in meters
    }
  }
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing coordinates with Latitude first, violating GeoJSON standards

**The mistake:** Saving London's coordinates as `[ 51.5074, -0.1278 ]` (Latitude first).

**Why it's wrong:** MongoDB parses coordinates expecting `[ Longitude, Latitude ]`. 

In this case, it treats `51.5074` as the longitude. 

If your latitude coordinate exceeds 90° (for example, if you save a point at `[ 120.0, 45.0 ]` with latitude as 120), the database will reject the write entirely, throwing a BSON write crash:
`ERROR: Latitude values must be between -90 and 90 degrees.`

**Fix: Always write longitude first in the coordinates array: `[ Lon, Lat ]`. Remember: "Lo before La".**

---



### Mistake 2: Reversing Longitude and Latitude Coordinates in GeoJSON Point Literals

**The mistake:** Querying GeoJSON points with `[latitude, longitude]` coordinate ordering.

**Why it's wrong:** GeoJSON and MongoDB spatial indexes strictly mandate `[longitude, latitude]` (`[X, Y]`) coordinate order. Reversing coordinates shifts locations to wrong hemispheres.

*Incorrect:*
```javascript
coordinates: [51.5074, -0.1278] // ❌ Reversed latitude/longitude!
```

*Fix:*
```javascript
coordinates: [-0.1278, 51.5074] // Correct [longitude, latitude] order
```

### Mistake 3: Running `$near` Spatial Queries Without a 2dsphere Index

**The mistake:** Executing `db.places.find({ location: { $near: { $geometry: point } } })` on un-indexed collection.

**Why it's wrong:** `$near` queries REQUIRES a `2dsphere` or `2d` index on the spatial field. Executing `$near` without a spatial index throws a query execution error.

*Incorrect:*
```javascript
db.places.find({ location: { $near: { $geometry: point } } }); // ❌ Fails without 2dsphere index!
```

*Fix:*
```javascript
db.places.createIndex({ location: "2dsphere" });
db.places.find({ location: { $near: { $geometry: point } } });
```

## 5. Practice Exercises

### Exercise 1: Proximity Search with `$near` and `$maxDistance`

**Scenario:**
Find all restaurant locations in collection `places` within 2,000 meters of longitude `-73.9667` and latitude `40.78` using a `2dsphere` index.

**Requirements:**
1. Use `$near` with `$geometry` Point and `$maxDistance: 2000`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.places.find({
>   location: {
>     $near: {
>       $geometry: {
>         type: "Point",
>         coordinates: [-73.9667, 40.78]
>       },
>       $maxDistance: 2000
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$near` calculates spherical distances over GeoJSON Point geometries.
> 2. `$maxDistance` specifies maximum proximity radius in meters.
> 3. Requires a `2dsphere` spatial index on field `location`.
> 
---

### Exercise 2: Boundary Polygon Containment with `$geoWithin`

**Scenario:**
Query delivery drivers located inside a delivery zone GeoJSON Polygon boundary.

**Requirements:**
1. Use `$geoWithin` with `$geometry` Polygon.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.drivers.find({
>   location: {
>     $geoWithin: {
>       $geometry: {
>         type: "Polygon",
>         coordinates: [[
>           [-74.0, 40.7],
>           [-73.9, 40.7],
>           [-73.9, 40.8],
>           [-74.0, 40.8],
>           [-74.0, 40.7]
>         ]]
>       }
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$geoWithin` filters geometries contained entirely inside a target GeoJSON boundary.
> 2. Does not require sorted distance output.
> 3. Underpins geofencing applications.
> 
---

### Exercise 3: Creating `2dsphere` Spatial Indexes

**Scenario:**
Create a 2D sphere index on field `location` in collection `places` to enable geospatial query execution.

**Requirements:**
1. Execute `createIndex({ location: "2dsphere" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.places.createIndex({ location: "2dsphere" });
> ```
>
> #### Technical Explanation
>
> 1. `"2dsphere"` indexes calculate distances over spherical Earth geodesics (WGS84 datum).
> 2. Required for `$near` and `$geoIntersects` queries over GeoJSON points and polygons.
> 3. Converts spatial scans into fast spatial index lookups.
> 
---



## 6. Related Terms

- [`find()` / `findOne()`](../level_03/find.md) — The query framework.
- [Geospatial Index (`2dsphere` / `2d`)](../level_07/geospatial_index.md) — Related concept: Geospatial Index (`2dsphere` / `2d`).

---

## 7. Key Takeaways
- Geospatial queries check proximity and containment shapes natively.
- Relies on GeoJSON coordinate notation (`type: "Point"`).
- **Longitude comes first** in coordinates: `[ Longitude, Latitude ]` ("Lo before La").
- Creating a `2dsphere` index is required to enable geospatial operations.
- `$near` retrieves coordinates sorted by proximity (closest first).
- `$geoWithin` filters documents located inside custom shapes or circles.
- Coordinates out of bounds (Latitude outside $\pm 90^{\circ}$) trigger write crashes.
