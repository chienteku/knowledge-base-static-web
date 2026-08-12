# Deprecation & Sunsetting

> **Level 10 — Designing & Tooling**
> Retiring old API versions gracefully.

---

## 1. Prerequisites
- [API Versioning (v1, v2)](versioning.md) — The methods of releasing new endpoint versions.

---

## 2. Term Category

**Architecture / Design (Universal: Affects release management, API gateways, and microservice lifecycles.)**: Deprecation & Sunsetting is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
As web applications grow, their API designs evolve. Database restructures, security enhancements, and new features eventually make old API endpoints obsolete.

However, you cannot disable old endpoints overnight. If client devices (such as older mobile app versions installed on users' phones) are still querying `/api/v1/checkout`, shutting it down abruptly will crash those apps.

To retire old endpoints safely without breaking downstream clients, APIs use **Deprecation & Sunsetting**:

#### 1. Deprecation (The Warning Phase)
- **Behavior:** The endpoint **continues to function normally**. However, it is officially marked as obsolete, and developers are discouraged from using it.
- **HTTP Header (RFC 8594):** The server returns a `Deprecation` header (often specifying the date deprecation occurred) along with a link header pointing to the successor version.

#### 2. Sunsetting (The Retirement Phase)
- **Behavior:** The final date is announced when the endpoint will be deactivated. After this date, the endpoint returns a `410 Gone` or `404 Not Found` status.
- **HTTP Header (RFC 8594):** The server returns a `Sunset` header indicating the deactivation timestamp.

#### 3. Brownouts (The Wakeup Call)
To nudge developers who ignore header warnings, teams run **brownouts**: temporarily disabling the deprecated endpoint (e.g. returning `503 Service Unavailable` for 1 hour on a Tuesday). This triggers developers' error trackers, alerting them to update their integration before the final sunset date.

---

### (2) Reality Metaphor
Imagine replacing a highway bridge.
- **Abrupt Shutdown** is like **dynamiting the old bridge overnight** without warning. Cars driving in the dark drive off the edge into the river (**crashing client apps**).
- **Deprecation** is opening a new bridge next to the old one. The old bridge remains open, but you place large signs: *"Warning: This bridge is deprecated and will close permanently on December 1st. Please use the new bridge"* (**Deprecation/Sunset headers**).
- **Sunsetting** is officially locking the gates on the old bridge on December 1st (**returning `410 Gone`**).
- **Brownout** is locking the old bridge gates for 2 hours on a Sunday afternoon to force drivers to experience the detour before the final closure date.

---

### (3) HTTP Header Example

A deprecated API response returning headers telling the client to migrate:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: @1716912000
Sunset: Wed, 11 Nov 2026 00:00:00 GMT
Link: <https://api.example.com/v2/users>; rel="successor-version"

{
  "warning": "This API version is deprecated and will be deactivated on Nov 11, 2026.",
  "data": { "userId": 42 }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Deleting legacy endpoints without reviewing server access logs

**The mistake:** Sunsetting `/api/v1/posts` on a scheduled date without checking active server traffic logs.

**Why it's wrong:** Even if you sent emails warning developers, many might have missed it. If backend metrics show that `/v1` is still handling thousands of calls daily, deleting the endpoint will trigger a cascade of client-side failures.

*Fix:* Monitor access log metrics. Identify high-traffic consumer IP addresses still hitting the deprecated route and contact them directly, or execute short brownouts to encourage migration.

---

### Mistake 2: Abruptly Shutting Down Legacy API Endpoints Without Warning Headers or Sunset Windows

**The mistake:** Deleting `/v1/users` endpoint overnight without notification.

**Why it's wrong:** Abrupt shutdowns break third-party client integrations. Enterprise APIs require formal deprecation notices, migration documentation, and sunset periods (e.g. 6-12 months).

*Incorrect:*
```http
/* Deleting v1 routes directly in backend codebase */
```

*Fix:*
```http
// Return Sunset and Deprecation HTTP headers on v1 endpoints prior to removal:
Sunset: Wed, 11 Nov 2026 00:00:00 GMT
Deprecation: @1700000000
```

---

### Mistake 3: Failing to Monitor Active Traffic on Deprecated Endpoints Before Final Sunset

**The mistake:** Decommissioning an API version on the scheduled sunset date without checking analytics logs.

**Why it's wrong:** If major business partners still send high traffic to deprecated endpoints, decommissioning breaks critical business workflows. Track active client metrics via telemetry.

*Incorrect:*
```http
/* Shutting down endpoints on date without inspecting access logs */
```

*Fix:*
```http
/* Track metric counters on deprecated routes to confirm zero active traffic before decommissioning */
```


---

## 5. Practice Exercises

### Exercise 1: RFC 8594 Sunset & Deprecation Header Generator

**Scenario:** An API gateway constructs RFC 8594 `Sunset` and `Deprecation` response headers to notify clients of upcoming endpoint retirement.

**Requirements:**
1. Write buildDeprecationHeaders(sunsetDate, sunsetLinkStr).
2. Format Sunset date header (HTTP date).
3. Format Deprecation header.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildDeprecationHeaders(sunsetDate, sunsetLinkStr) {
>   const headers = {};
>
>   if (sunsetDate instanceof Date) {
>     headers["Sunset"] = sunsetDate.toUTCString();
>     headers["Deprecation"] = "true";
>   }
>
>   if (sunsetLinkStr) {
>     headers["Link"] = `<${sunsetLinkStr}>; rel="deprecation"; type="text/html"`;
>   }
>
>   return headers;
> }
>
> // Verification tests
> const date = new Date("2026-12-31T00:00:00Z");
> const link = "https://api.example.com/docs/deprecation-v1";
> const headers = buildDeprecationHeaders(date, link);
>
> console.assert(headers["Deprecation"] === "true", "Test 1 Failed");
> console.assert(headers["Sunset"].includes("2026"), "Test 2 Failed");
> console.assert(headers["Link"].includes('rel="deprecation"'), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **RFC 8594 Sunset Header**: Standard HTTP response header indicating exact date when API endpoint will be decommissioned.
> 2. **Deprecation Header**: HTTP header signaling that endpoint is deprecated and should not be used for new integrations.
> 3. **Link rel='deprecation'**: Provides documentation link detailing migration instructions to newer API versions.
> 
---

### Exercise 2: Deprecated Endpoint Warning Client Logger

**Scenario:** An API SDK inspects response headers and logs developer warnings when calling deprecated API endpoints.

**Requirements:**
1. Write inspectDeprecationWarning(responseHeaders, loggerFn).
2. Read Sunset and Deprecation headers.
3. Invoke loggerFn with warning message.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectDeprecationWarning(responseHeaders = {}, loggerFn) {
>   const sunset = responseHeaders["Sunset"] || responseHeaders["sunset"];
>   const deprecation = responseHeaders["Deprecation"] || responseHeaders["deprecation"];
>
>   if (deprecation || sunset) {
>     const msg = `WARNING: API Endpoint is deprecated! Sunset date: ${sunset || "TBD"}. Please upgrade client SDK.`;
>     if (typeof loggerFn === "function") {
>       loggerFn(msg);
>     }
>     return { isDeprecated: true, sunsetDate: sunset, warning: msg };
>   }
>
>   return { isDeprecated: false };
> }
>
> // Verification tests
> const headers = { "Sunset": "Thu, 31 Dec 2026 00:00:00 GMT", "Deprecation": "true" };
> let loggedMsg = null;
>
> const result = inspectDeprecationWarning(headers, (msg) => { loggedMsg = msg; });
> console.assert(result.isDeprecated === true, "Test 1 Failed");
> console.assert(loggedMsg.includes("31 Dec 2026"), "Test 2 Failed: Logger must receive sunset date");
> ```
>
> #### Technical Explanation
>
> 1. **Proactive Client Notification**: Alerts client developers during API execution before hard sunset decommissioning.
> 2. **SDK Logging Decorators**: Automatically logs console warnings in development builds when accessing deprecated endpoints.
> 3. **Smooth Sunset Phase-Out**: Allows client teams months of notice to schedule API migration tasks.
> 
---

### Exercise 3: Sunset Version Migration Redirect Router

**Scenario:** An API gateway returns `301 Moved Permanently` or `410 Gone` for endpoints whose Sunset date has passed.

**Requirements:**
1. Write handleSunsetRouting(sunsetDate, newEndpointUrl).
2. If past sunsetDate, return 410 Gone.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleSunsetRouting(sunsetDate, newEndpointUrl) {
>   const now = new Date();
>   const isPastSunset = sunsetDate instanceof Date && now > sunsetDate;
>
>   if (isPastSunset) {
>     return {
>       status: 410,
>       headers: {
>         "Link": `<${newEndpointUrl}>; rel="successor-version"`
>       },
>       error: "410 Gone: This API version has been sunset and is no longer available."
>     };
>   }
>
>   return { status: 200 };
> }
>
> // Verification tests
> const pastDate = new Date("2020-01-01");
> const res = handleSunsetRouting(pastDate, "https://api.example.com/v2/users");
>
> console.assert(res.status === 410, "Test 1 Failed: Must return 410 Gone for past sunset date");
> console.assert(res.headers.Link.includes("v2/users"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP 410 Gone Status**: Standard HTTP status indicating target resource is permanently deleted and has no forwarding address.
> 2. **Sunset Date Enforcement**: Automatically switches from deprecation warnings (200 OK) to error responses (410 Gone) after deadline.
> 3. **Successor Link Header**: Guides developers to the successor API version endpoint.
---

## 6. Related Terms
- [API Versioning (v1, v2)](versioning.md) — The process of releasing new API versions.
- [API Contract / Schema-First Design](api_contract.md) — The interface definitions that outline version upgrades.

---

## 7. Key Takeaways
- Deprecation warns consumers that an API endpoint is obsolete but keeps it functional.
- Sunsetting deactivates the endpoint permanently, returning `410 Gone` or `404 Not Found`.
- Standard `Deprecation` and `Sunset` HTTP headers communicate deactivation details.
- Brownouts temporarily disable endpoints to alert developers to perform updates.
- Monitor backend server logs to ensure traffic to deprecated routes has ceased before sunsetting.
