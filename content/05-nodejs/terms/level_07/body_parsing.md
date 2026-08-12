# Body Parsing (express.json())

> **Level 7 — Web Servers & APIs**
> The middleware that turns the raw request stream into `req.body` — used everywhere, taught nowhere.

---

## 1. Prerequisites
- [Middleware](middleware.md) — The interception pipeline.
- [The req & res Objects](req_res.md) — The request structure populated by parsed inputs.
- [Streams (General Concept)](../level_06/streams.md) — Under the hood, the request is a Readable Stream.

---

## 2. Term Category

**Third-Party Framework Concept (Express.js) (Web App Server Layer .)**: Body Parsing (express.json()) is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a client sends data to a server (e.g. submitting a form or sending a JSON payload via `fetch`), the payload is sent inside the HTTP request body. 

In Node.js, the incoming request object (`req`) is a **Readable Stream**. This means request data does not arrive all at once; it streams in as raw binary buffers over the network. 

By default, Express does not parse this stream. If you attempt to access `req.body` in a route handler, it will evaluate to `undefined`.

To read this incoming data as a JavaScript object, we use **Body Parsing Middleware** (like `express.json()`):
-   **Stream Interception:** The middleware intercepts the request stream.
-   **Buffering Chunks:** It listens for incoming `'data'` events on the `req` stream, collecting all binary chunks in memory.
-   **Parsing & Mounting:** Once the stream ends (`'end'` event), the middleware joins the chunks, decodes the resulting buffer into a string, parses it using `JSON.parse()`, and mounts the parsed object onto **`req.body`** before calling `next()`.

---

### (2) What `express.json()` Does Under the Hood
Before Express added built-in body parsing, developers had to parse incoming stream data manually:

```javascript
// This is exactly what express.json() automates:
app.use((req, res, next) => {
  let rawData = '';
  
  req.on('data', (chunk) => {
    rawData += chunk; // Accumulate incoming chunks
  });
  
  req.on('end', () => {
    try {
      req.body = JSON.parse(rawData); // Parse once completely loaded
    } catch (err) {
      req.body = {}; // Fallback if JSON is malformed
    }
    next();
  });
});
```

---

### (3) Reality Metaphor: The Brick Delivery
Imagine a delivery truck arriving at your warehouse.
- **The Incoming Request** is a truck filled with loose, raw clay bricks (**binary buffers**).
- **Without Body Parsing:** The truck dumps the massive pile of loose bricks in your warehouse driveway. The warehouse manager sits in their office (**`req.body`**) looking at an empty desk because no one carried the bricks inside.
- **With Body Parsing (`express.json()`):** A warehouse receiving worker (**the middleware**) intercepts the truck at the gate. They stack the bricks as they are unloaded (**chunk collection**), build a toy model house out of them (**JSON parsing**), and place the completed model neatly on the manager's desk (**`req.body`**). The manager can now work with the model house immediately.

---

### (4) Express Implementation Example

```javascript
const express = require('express');
const app = express();

// Register the body parser globally BEFORE defining any routes
app.use(express.json());

app.post('/api/users', (req, res) => {
  // If express.json() is active, req.body is a parsed JavaScript object
  const { username, email } = req.body;
  
  if (!username || !email) {
    return res.status(400).send('Missing username or email');
  }

  res.status(201).json({
    message: 'User created successfully',
    data: { username, email }
  });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Registering routes before the body parsing middleware

**The mistake:** Defining route handlers before calling `app.use(express.json())`:

```javascript
const express = require('express');
const app = express();

// WRONG: Route is defined BEFORE the parser!
app.post('/api/data', (req, res) => {
  console.log(req.body); // undefined!
  res.send('Done');
});

app.use(express.json()); // Too late!
```

**Why it's wrong:** Express routes and middleware are executed in the exact order they are registered. If a request matches a route defined before the body parser, the route handler executes immediately. Because the body parser has not run yet, the request stream has not been read, and `req.body` remains `undefined`.

*Fix:* Always place global body parsing middleware (like `express.json()`) at the very top of your application script, before defining any routes.

---



### Mistake 2: Accessing `req.body` Without Registering Body Parser Middleware in Express

**The mistake:** Writing `const { email } = req.body;` in an Express route without mounting `express.json()`.

**Why it's wrong:** Express does NOT parse HTTP POST request bodies by default. `req.body` will be `undefined`, throwing `TypeError: Cannot destructure property of undefined`.

*Incorrect:*
```javascript
app.post('/login', (req, res) => {
  console.log(req.body.email); // ❌ TypeError: Cannot read properties of undefined!
});
```

*Fix:*
```javascript
app.use(express.json()); // Register JSON body parser middleware
app.post('/login', (req, res) => {
  console.log(req.body.email);
});
```

### Mistake 3: Failing to Configure Payload Size Limits on Body Parsers (DOS Attack Vector)

**The mistake:** Mounting `app.use(express.json())` without restricting body payload size.

**Why it's wrong:** By default, body parsers accept up to 100kb (or higher if misconfigured). Attackers can send huge JSON payloads to consume server memory. Specify explicit limits.

*Incorrect:*
```javascript
app.use(express.json()); // Accepts default payload limits
```

*Fix:*
```javascript
app.use(express.json({ limit: '10kb' })); // Restrict JSON body payload size
```

## 5. Practice Exercises

### Exercise 1: Custom Raw JSON Stream Body Parser

**Scenario:** An API gateway parses incoming HTTP request stream chunks into a JSON object while enforcing a strict 1MB byte limit to prevent Denial of Service (DoS) memory attacks.

**Requirements:**
1. Write parseJsonStreamBody(reqMock, byteLimit).
2. Buffer incoming data chunks.
3. Enforce byteLimit check on chunk arrival.
4. Parse JSON and resolve.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseJsonStreamBody(reqMock, byteLimit = 1_048_576) {
>   return new Promise((resolve, reject) => {
>     let bodyText = "";
>     let receivedBytes = 0;
>
>     reqMock.on("data", (chunk) => {
>       const chunkBuf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
>       receivedBytes += chunkBuf.length;
>
>       if (receivedBytes > byteLimit) {
>         reqMock.destroy();
>         return reject(new Error("PAYLOAD_TOO_LARGE"));
>       }
>
>       bodyText += chunkBuf.toString("utf-8");
>     });
>
>     reqMock.on("end", () => {
>       if (!bodyText.trim()) {
>         return resolve({});
>       }
>
>       try {
>         const parsed = JSON.parse(bodyText);
>         resolve(parsed);
>       } catch (err) {
>         reject(new Error(`INVALID_JSON: ${err.message}`));
>       }
>     });
>
>     reqMock.on("error", (err) => reject(err));
>   });
> }
>
> // Verification tests
> const events = {};
> const mockReq = {
>   on: (e, fn) => { events[e] = fn; },
>   destroy: () => {}
> };
>
> const promise = parseJsonStreamBody(mockReq, 100);
> events["data"](Buffer.from('{"name":"Alice"}'));
> events["end"]();
>
> promise.then(body => {
>   console.assert(body.name === "Alice", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Stream Body Buffering**: HTTP request bodies arrive as asynchronous stream chunks; `express.json()` buffers and parses these chunks internally.
> 2. **Payload Size Defense**: Enforcing byte limits before buffer allocation protects servers against memory exhaustion DoS attacks.
> 3. **Content-Type Validation**: Always verify `Content-Type: application/json` before attempting JSON parsing.
> 
---

### Exercise 2: URL-Encoded Form Data Parser

**Scenario:** A legacy form endpoint parses `application/x-www-form-urlencoded` request body text into a key-value JavaScript object.

**Requirements:**
1. Write parseUrlEncodedBody(bodyStr).
2. Split key-value pairs by `&` and `=`.
3. Decode URL components via `decodeURIComponent`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseUrlEncodedBody(bodyStr = "") {
>   if (typeof bodyStr !== "string" || !bodyStr.trim()) {
>     return {};
>   }
>
>   const result = {};
>   const pairs = bodyStr.split("&");
>
>   for (const pair of pairs) {
>     if (!pair) continue;
>     const [rawKey, rawVal] = pair.split("=");
>     const key = decodeURIComponent((rawKey || "").replace(/\+/g, " "));
>     const val = decodeURIComponent((rawVal || "").replace(/\+/g, " "));
>
>     if (key in result) {
>       if (Array.isArray(result[key])) {
>         result[key].push(val);
>       } else {
>         result[key] = [result[key], val];
>       }
>     } else {
>       result[key] = val;
>     }
>   }
>
>   return result;
> }
>
> // Verification tests
> const parsed = parseUrlEncodedBody("user=Alice+Smith&role=admin&tag=js&tag=node");
> console.assert(parsed.user === "Alice Smith", "Test 1 Failed: + decoded to space");
> console.assert(parsed.role === "admin", "Test 2 Failed");
> console.assert(Array.isArray(parsed.tag) && parsed.tag.length === 2, "Test 3 Failed: Duplicate keys parsed into array");
> ```
>
> #### Technical Explanation
>
> 1. **URL Encoding Format**: `application/x-www-form-urlencoded` formats key-value pairs separated by `&` with spaces encoded as `+` or `%20`.
> 2. **express.urlencoded Middleware**: Express uses `express.urlencoded({ extended: true })` (using `qs` library) to parse nested form fields.
> 3. **Array Parameter Handling**: Duplicate keys (`tag=js&tag=node`) are parsed into arrays.
> 
---

### Exercise 3: Multipart Form-Data Boundary Header Inspector

**Scenario:** An image upload service inspects `Content-Type` headers to extract the multipart boundary delimiter string.

**Requirements:**
1. Write parseMultipartBoundary(contentTypeHeader).
2. Verify header starts with `multipart/form-data`.
3. Extract `boundary=...` token.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseMultipartBoundary(contentTypeHeader = "") {
>   if (!contentTypeHeader.toLowerCase().includes("multipart/form-data")) {
>     return { isMultipart: false, boundary: null };
>   }
>
>   const match = contentTypeHeader.match(/boundary=([^;]+)/i);
>   if (!match) {
>     return { isMultipart: true, boundary: null, error: "MISSING_BOUNDARY" };
>   }
>
>   const boundary = match[1].replace(/^"|"$/g, "").trim();
>
>   return {
>     isMultipart: true,
>     boundary,
>     delimiter: `--${boundary}`
>   };
> }
>
> // Verification tests
> const header = 'multipart/form-data; boundary="----WebKitFormBoundary7MA4YWxkTrZu0gW"';
> const parsed = parseMultipartBoundary(header);
>
> console.assert(parsed.isMultipart === true, "Test 1 Failed");
> console.assert(parsed.boundary === "----WebKitFormBoundary7MA4YWxkTrZu0gW", "Test 2 Failed");
> console.assert(parsed.delimiter === "------WebKitFormBoundary7MA4YWxkTrZu0gW", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Multipart Stream Uploads**: File uploads use `multipart/form-data` where boundary tokens separate individual file/field payloads.
> 2. **Stream Parsing with Busboy/Multer**: Express body parsers cannot parse multipart streams directly; specialized libraries (`multer`, `busboy`) stream files directly to disk/S3.
> 3. **Boundary Delimiter Format**: Each section in a multipart body is prefixed with `--boundary`.
## 6. Related Terms
- [The req & res Objects](req_res.md) — The HTTP request and response structures.
- [Middleware](middleware.md) — The pipeline routing pattern.
- [Streams (General Concept)](../level_06/streams.md) — The underlying network stream technology.
- [Input Validation (joi / zod)](../level_09/input_validation.md) — Related concept: Input Validation (joi / zod).

---

## 7. Key Takeaways
- The request body (`req.body`) is `undefined` by default in Express.
- Node receives HTTP request payloads as an active stream of raw binary buffers.
- `express.json()` is middleware that intercepts, buffers, and parses incoming JSON streams.
- The parsed object is attached directly to the `req.body` property.
- Register body-parsing middleware at the very top of your application file, before any routes.
- Ensure clients set the `Content-Type: application/json` header for JSON payloads.
