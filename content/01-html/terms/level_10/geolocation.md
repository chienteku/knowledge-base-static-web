# Geolocation API

> **Level 10 — Canvas, SVG & Storage**
> An HTML5 browser API that allows web applications to access the user's physical geographic location (latitude and longitude coordinates) after receiving explicit user permission.

---

## 1. Prerequisites
- [`<script>`](../level_08/script.md) — The programming script block required to execute the API call.
- [DOM (Document Object Model)](../level_09/dom.md) — The window Navigator bindings hosting the API.

---

## 2. Term Category

**HTML5 API / Concept (Modern Browsers . For security reasons, browsers block the Geolocation API on non-secure HTTP connections, except for local testing on `localhost`).)**: Geolocation API is a fundamental concept in this technology stack. **Level 10 — Canvas, SVG & Storage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Many modern web features rely on knowing the user's physical location:
-   **Navigation:** Showing the user's path on an interactive map.
-   **Local Search:** Locating nearby coffee shops, gyms, or restaurants.
-   **Localization:** Auto-filling country codes or displaying local weather details.

Historically, websites had to guess location by looking up the user's network IP address in a database. This was slow, expensive, and inaccurate (often placing the user in a different city or state).

The W3C introduced the **Geolocation API** in HTML5. It allows the web browser to query the host device's hardware directly (such as built-in GPS chips, Wi-Fi networks, or cell towers) to retrieve highly accurate coordinates.

---

### (2) Strict Privacy & Permission Rules
Because location data is highly sensitive, the browser enforces strict privacy checks:
1.  **HTTPS Restriction:** The API only works if the site is served over secure SSL (`https://`).
2.  **Consent Dialog:** The browser intercepts the code call and displays a native pop-up prompt to the user:
    `"example.com wants to know your location. [Block] [Allow]"`
3.  **Opt-Out:** If the user blocks the request, the API returns a permission error, and the developer receives no data.

---

### (3) Key API Methods
The Geolocation API is accessed via the global `navigator.geolocation` object:

-   **`getCurrentPosition(success, error)`**: Retrieves the current coordinates once.
-   **`watchPosition(success, error)`**: Spawns a tracker that runs continuously, executing the success callback automatically every time the device's location changes (great for navigation apps).
-   **`clearWatch(id)`**: Cancels an active `watchPosition` tracker.

---

### (4) Code Examples

#### Short Snippet
Basic coordinate request:

```javascript
navigator.geolocation.getCurrentPosition((position) => {
  console.log("Latitude: " + position.coords.latitude);
  console.log("Longitude: " + position.coords.longitude);
});
```

#### Fuller Example
A location scanner displaying coordinates or errors:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Location Finder</title>
</head>
<body>

  <h1>Find Nearby Stores</h1>
  <button id="locBtn">Detect My Location</button>
  <div id="output">Click the button above.</div>

  <script>
    const output = document.getElementById("output");

    document.getElementById("locBtn").addEventListener("click", () => {
      // 1. Check if the browser supports Geolocation
      if (!navigator.geolocation) {
        output.innerText = "Geolocation is not supported by your browser.";
        return;
      }

      output.innerText = "Requesting permission...";

      // 2. Call the API
      navigator.geolocation.getCurrentPosition(
        // Success Callback
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          output.innerHTML = `<p>Latitude: ${lat}</p><p>Longitude: ${lon}</p>`;
        },
        // Error Callback
        (error) => {
          switch(error.code) {
            case error.PERMISSION_DENIED:
              output.innerText = "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              output.innerText = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              output.innerText = "The request to get user location timed out.";
              break;
          }
        }
      );
    });
  </script>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming the API is available in non-secure HTTP pages

**The mistake:** Testing your geolocating script on a remote server running standard `http://example.com` and wondering why the click event triggers no prompt.

**Why it's wrong:** The browser security layer blocks the `navigator.geolocation` object entirely on HTTP pages. Trying to access it will either return `undefined` or fail silently, preventing access to the device coordinates.

**Fix:** Ensure your test site has a valid SSL certificate (`https://`).

---



### Mistake 2: Attempting to Call Geolocation API Over Insecure HTTP Protocols (`http://`)

**The mistake:** Calling `navigator.geolocation.getCurrentPosition()` on un-encrypted `http://` sites.

**Why it's wrong:** Modern browsers restrict location and device APIs exclusively to **Secure Contexts** (`https://` or `localhost`). Geolocation calls fail on `http://` websites.

*Incorrect:*
```html
// On http://insecure-site.com/:
navigator.geolocation.getCurrentPosition(...); // ❌ Blocked by browser security policy!
```

*Fix:*
```html
// Serve site over HTTPS (https://) to enable Geolocation APIs
```

### Mistake 3: Failing to Handle Geolocation Permission Denial Errors

**The mistake:** Calling `getCurrentPosition()` without an error callback function.

**Why it's wrong:** Users frequently deny location access permissions. Omitting the error callback leaves applications unresponsive when permission is denied.

*Incorrect:*
```html
navigator.geolocation.getCurrentPosition((pos) => console.log(pos)); // Missing error handler
```

*Fix:*
```html
navigator.geolocation.getCurrentPosition(
  (pos) => console.log(pos),
  (err) => console.error('Location permission denied:', err.message)
);
```

## 5. Practice Exercises

### Exercise 1: Geolocation Permission Trigger UI with Accessible Status Region

**Scenario:** An author builds a geolocation permission trigger button with accessible live region status updates.

**Requirements:**
1. Create location request `<button>`.
2. Include `<output id="geo-status">` live region for screen reader updates.
3. Display location metrics.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <section class="location-picker">
>   <h2>Store Locator</h2>
>   <p>Find the nearest Acme store location automatically.</p>
>
>   <button type="button" id="locate-btn" class="btn-primary">
>     Use My Current Location
>   </button>
>
>   <div class="status-container">
>     <output id="geo-status" for="locate-btn" aria-live="polite">
>       Location permission not requested yet.
>     </output>
>   </div>
> </section>
> ```
>
> #### Technical Explanation
>
> 1. **Geolocation API Integration**: Uses `navigator.geolocation.getCurrentPosition(success, error)` to retrieve device coordinates.
> 2. **HTTPS Origin Requirement**: Geolocation API is restricted strictly to Secure Contexts (HTTPS); calls fail automatically on HTTP.
> 3. **Accessible Output Announcements**: `<output aria-live="polite">` announces status changes ('Acquiring position...', 'Location found') to screen readers.
> 
---

### Exercise 2: High Accuracy Location Tracking Callback Integration

**Scenario:** Configures high accuracy position watching via `watchPosition()`.

**Requirements:**
1. Set `enableHighAccuracy: true` option.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <button type="button" id="start-tracking">Start GPS Tracking</button>
> <p>Current Coordinates: <output id="coords-display">Waiting...</output></p>
> ```
>
> #### Technical Explanation
>
> 1. **`watchPosition()` API**: Continuously tracks device location changes as the user moves.
> 2. **High Accuracy Options**: `{ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }` uses hardware GPS chip.
> 3. **Battery Conservation**: Call `clearWatch(id)` to stop tracking and conserve device battery.
> 
---

### Exercise 3: Graceful Handling of Geolocation Denial and Errors

**Scenario:** Handles permission denial errors gracefully with user fallback UI.

**Requirements:**
1. Provide manual ZIP code input fallback.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="location-fallback">
>   <p>Location access denied. Enter ZIP code manually:</p>
>   <label for="zip-code">ZIP Code</label>
>   <input type="text" id="zip-code" name="zip" pattern="[0-9]{5}">
>   <button type="submit">Search</button>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Permission Denial Code (`PERMISSION_DENIED`)**: Occurs when user rejects browser location prompt.
> 2. **Fallback Necessity**: Always provide manual text inputs (ZIP code/city name) as fallback.
> 3. **User Privacy**: Respect user location privacy choices gracefully.
## 6. Related Terms
- [`<script>`](../level_08/script.md) — The script environment executing API commands.
- [Web Storage (Local/Session Storage)](web_storage.md) — Used to save coordinate preferences locally.
- [Content Security Policy (CSP) & HTML Security](security.md) — Defining secure context parameters.

---

## 7. Key Takeaways
- The Geolocation API requests GPS/Wi-Fi coordinate data from the host device.
- It requires an HTTPS secure connection to run.
- The browser must prompt the user for permission; if blocked, the code fails.
- Use `getCurrentPosition()` to fetch coordinates once.
- Use `watchPosition()` to track coordinate shifts continuously over time.
