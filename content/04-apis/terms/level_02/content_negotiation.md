# Content Negotiation (Accept)

> **Level 2 — HTTP Anatomy**
> How client asks for a preferred response format.

---

## 1. Prerequisites
- [HTTP Headers](http_headers.md) — The metadata wrapper sent with requests.
- [Content-Type & MIME Types](content_type.md) — The standard media type format representations.

---

## 2. Term Category

**Data Format (Universal: Applicable to web browsers and API client integrations.)**: Content Negotiation (Accept) is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Server-Side Accept Header Content Negotiation

**Scenario:** A REST API gateway uses content negotiation to inspect the client's `Accept` header and return data formatted as JSON or XML.

**Requirements:**
1. Write negotiateContentType(acceptHeader, supportedTypes).
2. Parse acceptHeader.
3. Match highest priority supported MIME type.
4. Return 406 Not Acceptable if no match.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function negotiateContentType(acceptHeader, supportedTypes = ["application/json", "application/xml"]) {
>   if (!acceptHeader || acceptHeader.trim() === "" || acceptHeader.includes("*/*")) {
>     return { status: 200, contentType: supportedTypes[0] };
>   }
>
>   const requestedTypes = acceptHeader.split(",").map(t => t.split(";")[0].trim().toLowerCase());
>   for (const reqType of requestedTypes) {
>     if (supportedTypes.includes(reqType)) {
>       return { status: 200, contentType: reqType };
>     }
>   }
>
>   return { status: 406, contentType: null, error: "Not Acceptable" };
> }
>
> // Verification tests
> const res1 = negotiateContentType("application/json, text/html");
> console.assert(res1.status === 200 && res1.contentType === "application/json", "Test 1 Failed");
>
> const res2 = negotiateContentType("text/csv");
> console.assert(res2.status === 406, "Test 2 Failed: Unsupported type should return 406");
> ```
>
> #### Technical Explanation
>
> 1. **Content Negotiation Concept**: Mechanism where client and server agree on response format (MIME type, encoding, language) via HTTP headers.
> 2. **Accept Request Header**: Sent by client to specify acceptable media types (e.g. application/json, text/html).
> 3. **406 Not Acceptable Response**: HTTP status code returned when server cannot serve response in formats acceptable to client.
> 
---

### Exercise 2: Accept-Language Quality Factor (q-factor) Parser

**Scenario:** An internationalized web application parses client `Accept-Language` headers with q-factors to select the optimal locale.

**Requirements:**
1. Write parseAcceptLanguage(headerVal).
2. Extract language codes and q-factor weights (e.g. `fr;q=0.9`).
3. Sort locales by weight descending.
4. Return ordered locale array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseAcceptLanguage(headerVal) {
>   if (!headerVal || typeof headerVal !== "string") return ["en"];
>
>   const items = headerVal.split(",").map(item => {
>     const [lang, ...params] = item.trim().split(";");
>     let q = 1.0;
>     for (const p of params) {
>       const [k, v] = p.trim().split("=");
>       if (k === "q") {
>         const parsedQ = parseFloat(v);
>         if (!isNaN(parsedQ)) q = parsedQ;
>       }
>     }
>     return { lang: lang.trim(), q };
>   });
>
>   items.sort((a, b) => b.q - a.q);
>   return items.map(i => i.lang);
> }
>
> // Verification tests
> const header = "fr-CH, fr;q=0.9, en;q=0.8, *;q=0.5";
> const languages = parseAcceptLanguage(header);
>
> console.assert(languages[0] === "fr-CH", "Test 1 Failed: Highest q (1.0 default)");
> console.assert(languages[1] === "fr", "Test 2 Failed: q=0.9");
> console.assert(languages[2] === "en", "Test 3 Failed: q=0.8");
> ```
>
> #### Technical Explanation
>
> 1. **Quality Value (q-factor)**: Decimal value (0.0 to 1.0) indicating client preference order in content negotiation headers.
> 2. **Default q-factor Weight**: Omitted q parameter defaults to maximum priority q=1.0.
> 3. **Locale Fallback Selection**: Order allows servers to match specific regional locales (fr-CH) before falling back to base language (fr).
> 
---

### Exercise 3: API Format Adapter via Content-Type & Accept Negotiation

**Scenario:** A multi-format data pipeline formats response bodies based on negotiated content type.

**Requirements:**
1. Write formatResponseBody(dataObject, targetContentType).
2. Support application/json and text/plain.
3. Return serialized string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function formatResponseBody(dataObject, targetContentType) {
>   if (targetContentType === "application/json") {
>     return JSON.stringify(dataObject);
>   }
>   if (targetContentType === "text/plain") {
>     return Object.entries(dataObject).map(([k, v]) => `${k}: ${v}`).join("
> ");
>   }
>   throw new Error(`Unsupported content type: ${targetContentType}`);
> }
>
> // Verification tests
> const dataObj = { user: "Alice", id: 101 };
>
> const jsonRes = formatResponseBody(dataObj, "application/json");
> console.assert(jsonRes === '{"user":"Alice","id":101}', "Test 1 Failed");
>
> const textRes = formatResponseBody(dataObj, "text/plain");
> console.assert(textRes === "user: Alice
> id: 101", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Decoupled Representation**: Separates internal data models from client-facing serialization formats.
> 2. **Content-Type Response Header**: Server includes Content-Type header to inform client how to parse returned payload.
> 3. **Extensible Format Serializers**: Allows adding XML or Protocol Buffers serializers without modifying business logic.
---

## 6. Related Terms
- [The Response Object (res.json(), res.ok)](../level_05/response_object.md) — The resulting data container described by content negotiation.
- [API Versioning (v1, v2)](../level_10/versioning.md) — Sometimes implemented via custom MIME types inside the `Accept` header (e.g. `Accept: application/vnd.myapi.v2+json`).
- [HTTP Headers](http_headers.md) — Related concept: HTTP Headers.

---

## 7. Key Takeaways
- Content Negotiation allows clients to request a preferred formatting representation of a resource.
- The `Accept` header declares the client's preferred response formats using MIME types.
- The `q-factor` weight specifies relative preferences between formats from `0` to `1`.
- If a server cannot satisfy any of the client's accepted formats, it returns status `406 Not Acceptable`.
- `Content-Type` describes the format of the current message body; `Accept` describes the desired format of the future response body.
