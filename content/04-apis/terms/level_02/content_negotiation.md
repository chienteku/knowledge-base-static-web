# Content Negotiation (Accept)

> **Level 2 — HTTP Anatomy**
> How client asks for a preferred response format.

---

## 1. Prerequisites
- [HTTP Headers](http_headers.md) — The metadata wrapper sent with requests.
- [Content-Type & MIME Types](content_type.md) — The standard media type format representations.
---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Applicable to web browsers and API client integrations.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A single API resource (for example, a user's transaction invoice) can be represented in multiple formats: a raw JSON dataset, a formatted XML document, a CSV spreadsheet, or a PDF document. 

How does the client tell the server: *"I want this resource, but please format it as a PDF"* or *"I only understand JSON, do not send me XML"*?

This communication is handled by **Content Negotiation** using the HTTP **`Accept`** header:
- The client sets the `Accept` header in its request, listing its preferred MIME formats.
- The server inspects the `Accept` list, selects the best format it can generate, produces the payload, and returns it with a matching `Content-Type` response header.
- **406 Not Acceptable:** If the server cannot output any of the formats the client requested, it returns the `406` status code.
- **Quality Values (q-factor):** Clients can define multiple acceptable formats with weighted preferences (from `0` to `1`). For example: `Accept: application/json;q=0.9, text/xml;q=0.5`.

#### Key Distinction: `Accept` vs. `Content-Type`
- **`Content-Type`** describes the format of the **data currently inside the request or response body** (declaring what is being sent).
- **`Accept`** is sent by the client to describe what format it **wants to receive in the response body** (declaring what is requested).

### (2) Reality Metaphor
Imagine ordering food at a multilingual restaurant.
- The server (waiter) can speak Spanish, English, or French.
- You (the client) walk in and use your **`Accept`** header: *"I prefer Spanish (`q=1.0`), but if you don't speak Spanish, I can accept English (`q=0.5`)"*.
- The waiter checks their skills, decides to speak Spanish, and responds: *"Here is your order"* (**`Content-Type: Spanish`**).
- If you walk in saying *"I only speak Chinese"* (`Accept: chinese`), and the waiter cannot speak Chinese, they say: *"Sorry, I cannot serve you"* (**`406 Not Acceptable`**).

### (3) JavaScript & HTTP Examples

#### HTTP Request Header block
A client requests a resource preferring JSON but accepting XML if necessary:

```text
GET /api/reports/invoice_492 HTTP/1.1
Host: api.example.com
Accept: application/json, text/xml;q=0.8
```

#### Node.js Express server using Content Negotiation
Express provides a helper method `req.accepts()` to read the client's `Accept` preferences:

```javascript
import express from 'express';
const app = express();

app.get('/api/reports', (req, res) => {
  // Check client preferences
  if (req.accepts('json')) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ report: "Sales data summary" });
  } else if (req.accepts('xml')) {
    res.setHeader('Content-Type', 'text/xml');
    res.send("<report>Sales data summary</report>");
  } else {
    // If the client does not accept json or xml, reject the request
    res.status(406).send('Not Acceptable');
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting `Content-Type` instead of `Accept` on GET requests

**The mistake:** Making an HTTP `GET` request and setting the header `Content-Type: application/json` expecting it to force the server to return a JSON response.

**Why it's wrong:** `Content-Type` describes the body of the message *currently being sent*. Because `GET` requests have no body payload, setting `Content-Type` is ignored by the server. To dictate what format you want the server to return, you must use the `Accept` header.

---

### Mistake 2: Confusing `Accept` (Client Preference) with `Content-Type` (Payload Format)

**The mistake:** Sending `Content-Type: application/json` in a GET request to request JSON responses from the server.

**Why it's wrong:** GET requests do not have a request body. `Content-Type` describes the payload in the message body. Use `Accept: application/json` to inform the server what response format the client expects.

*Incorrect:*
```http
GET /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json ; ❌ Content-Type belongs on requests with bodies!
```

*Fix:*
```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/json ; Correct Accept header for response content negotiation
```

---

### Mistake 3: Returning HTTP 200 OK When Requested Content-Type Cannot Be Provided

**The mistake:** Returning HTML error pages with HTTP 200 OK when client specifies `Accept: application/json`.

**Why it's wrong:** If a server cannot satisfy the client's `Accept` header request, it should respond with HTTP `406 Not Acceptable` status code instead of returning an unexpected content format.

*Incorrect:*
```http
HTTP/1.1 200 OK
Content-Type: text/html ; ❌ Client explicitly asked for application/json!
```

*Fix:*
```http
HTTP/1.1 406 Not Acceptable
Content-Type: application/json

{"error": "Client Accept format application/xml not supported"}
```


---

## 6. Practice Exercises

### Exercise 1: Negotiation Resolution

**Problem:** Determine which format the server will return based on these parameters:
- **Server capability:** Can generate `text/html` and `application/json`.
- **Client request header:** `Accept: application/xml;q=0.9, application/json;q=0.8, text/plain;q=0.5`

> [!check]- Answer
> - The client accepts XML, JSON, and Plain Text.
> - Match what the client accepts against what the server can actually generate.

> [!check]- Answer
> - **`application/json`** (The client accepts XML first, but the server cannot produce it. The next highest preference accepted by the client that the server can generate is JSON).


---

### Exercise 2: Quality Value (q-factor) Weighting Calculation

**Problem:** Given header `Accept: application/json; q=0.8, text/html; q=1.0, */*; q=0.1`, order client format preference from highest to lowest.

**Expected output:**
> [!check]- Answer
> ```text
> 1. text/html (q=1.0)
> 2. application/json (q=0.8)
> 3. */* (q=0.1)
> ```
> ```text
> 1. text/html (q=1.0 - Default highest priority)
> 2. application/json (q=0.8)
> 3. */* (q=0.1 - Catch-all fallback)
> ```
> - **Explanation:** `q` factors range from 0.0 to 1.0, where higher values indicate stronger preference.
---

### Exercise 3: Language Negotiation Header

**Problem:** Which HTTP header does a client send to request localized response content in Spanish or French?

**Expected output:**
> [!check]- Answer
> ```text
> Accept-Language: es, fr;q=0.8, en;q=0.5
> ```
> ```http
> Accept-Language: es, fr;q=0.8, en;q=0.5
> ```
> - **Explanation:** `Accept-Language` communicates client locale and language preferences.
---

## 7. Related Terms
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — The resulting data container described by content negotiation.
- [API Versioning (v1, v2)](../level_10/versioning.md) — Sometimes implemented via custom MIME types inside the `Accept` header (e.g. `Accept: application/vnd.myapi.v2+json`).
- [HTTP Headers](http_headers.md) — Related concept: HTTP Headers.
---

## 8. Key Takeaways
- Content Negotiation allows clients to request a preferred formatting representation of a resource.
- The `Accept` header declares the client's preferred response formats using MIME types.
- The `q-factor` weight specifies relative preferences between formats from `0` to `1`.
- If a server cannot satisfy any of the client's accepted formats, it returns status `406 Not Acceptable`.
- `Content-Type` describes the format of the current message body; `Accept` describes the desired format of the future response body.
