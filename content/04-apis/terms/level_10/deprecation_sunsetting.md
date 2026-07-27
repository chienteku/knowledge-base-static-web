# Deprecation & Sunsetting

> **Level 10 — Designing & Tooling**
> Retiring old API versions gracefully.

---

## 1. Prerequisites
- [API Versioning (v1, v2)](./versioning.md) — The methods of releasing new endpoint versions.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Affects release management, API gateways, and microservice lifecycles.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Header Auditor

**Problem:** Review this response header segment. Determine the date the client integration will break:

`Deprecation: true; Sunset: Tue, 01 Sep 2026 00:00:00 GMT; Link: <https://api.com/v3>; rel="successor-version"`

> [!check]- Answer
> - **September 1st, 2026.** (The `Sunset` header defines the deactivation date. After this timestamp, the route is retired and will return a `410 Gone` status).


---

### Exercise 2: IETF Sunset and Deprecation Header Syntax

**Problem:** Write HTTP headers declaring an endpoint deprecated as of timestamp `1700000000` and scheduled for final Sunset on `Sun, 01 Nov 2026 00:00:00 GMT`.

**Expected output:**
```text
Deprecation: @1700000000
Sunset: Sun, 01 Nov 2026 00:00:00 GMT
```

> [!check]- Answer
> ```http
> Deprecation: @1700000000
> Sunset: Sun, 01 Nov 2026 00:00:00 GMT
> Link: <https://api.example.com/docs/v2-migration>; rel="deprecation"
> ```
> - **Explanation:** Standard IETF `Deprecation` and `Sunset` headers communicate API lifecycles.
---

### Exercise 3: API Sunset Lifecycle Phases

**Problem:** Identify the 4 phases of a formal API deprecation process.

**Expected output:**
```text
1. Announcement (Documentation & headers added)
2. Deprecated phase (API works, warning headers returned)
3. Brownout phase (Temporary scheduled outages testing client resilience)
4. Sunset phase (Permanent shutdown and 410 Gone response)
```

> [!check]- Answer
> ```text
> 1. Announcement
> 2. Deprecation (with headers)
> 3. Brownout (simulated temporary outages)
> 4. Sunset (Permanent HTTP 410 Gone shutdown)
> ```
> - **Explanation:** Structured deprecation phases manage client migration safely.
---

## 7. Related Terms
- [API Versioning (v1, v2)](./versioning.md) — The process of releasing new API versions.
- [API Contract / Schema-First Design](./api_contract.md) — The interface definitions that outline version upgrades.

---

## 8. Key Takeaways
- Deprecation warns consumers that an API endpoint is obsolete but keeps it functional.
- Sunsetting deactivates the endpoint permanently, returning `410 Gone` or `404 Not Found`.
- Standard `Deprecation` and `Sunset` HTTP headers communicate deactivation details.
- Brownouts temporarily disable endpoints to alert developers to perform updates.
- Monitor backend server logs to ensure traffic to deprecated routes has ceased before sunsetting.
