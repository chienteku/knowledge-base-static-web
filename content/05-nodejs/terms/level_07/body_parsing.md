# Body Parsing (express.json())

> **Level 7 — Web Servers & APIs**
> The middleware that turns the raw request stream into `req.body` — used everywhere, taught nowhere.

---

## 1. Prerequisites
- [Middleware](./middleware.md) — The interception pipeline.
- [The req & res Objects](./req_res.md) — The request structure populated by parsed inputs.
- [Streams (General Concept)](../level_06/streams.md) — Under the hood, the request is a Readable Stream.

---

## 2. Term Category
- **Third-Party Framework Concept (Express.js)**

---

## 3. Environment Context
- **Web App Server Layer** (Extracts and formats network payloads during request routing).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Accessing `req.body` Without Registering Body Parser Middleware in Express

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

### Mistake 5: Failing to Configure Payload Size Limits on Body Parsers (DOS Attack Vector)

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



### Mistake 6: Accessing `req.body` Without Registering Body Parser Middleware in Express

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

### Mistake 7: Failing to Configure Payload Size Limits on Body Parsers (DOS Attack Vector)

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

## 6. Practice Exercises

### Exercise 1: Debugging Undefined Payloads

**Problem:** A client sends a POST request with the header `Content-Type: application/json` containing `{"score": 42}`. However, the route logs `undefined`. Fix the registration order below:

```javascript
// Before (Fails to log score):
const express = require('express');
const app = express();

app.post('/submit', (req, res) => {
  console.log("Score:", req.body?.score); // Logs: Score: undefined
  res.sendStatus(200);
});
app.use(express.json());

// After (Fixed):
const express = require('express');
const app = express();

app.use(express.json()); // FIXED: Body parser is registered first!

app.post('/submit', (req, res) => {
  console.log("Score:", req.body?.score); // Logs: Score: 42
  res.sendStatus(200);
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Parsing URL-Encoded Form Submissions

**Problem:** Write middleware line to parse traditional HTML form submissions (`application/x-www-form-urlencoded`).

**Expected output:**
```text
app.use(express.urlencoded({ extended: true }));
```

> [!check]- Answer
> ```javascript
> app.use(express.urlencoded({ extended: true }));
> ```
>
> **Explanation:** `express.urlencoded()` parses URL-encoded body payloads from standard HTML `<form>` submissions.

### Exercise 3: Multipart Form Upload Parsing

**Problem:** Which middleware library is standard in Express for parsing `multipart/form-data` file uploads? (`multer`).

**Expected output:**
```text
multer
```

> [!check]- Answer
> ```text
> multer
> ```
>
> **Explanation:** `multer` processes multipart form requests containing file attachments.

## 7. Related Terms
- [The req & res Objects](./req_res.md) — The HTTP request and response structures.
- [Middleware](./middleware.md) — The pipeline routing pattern.
- [Streams (General Concept)](../level_06/streams.md) — The underlying network stream technology.

---

## 8. Key Takeaways
- The request body (`req.body`) is `undefined` by default in Express.
- Node receives HTTP request payloads as an active stream of raw binary buffers.
- `express.json()` is middleware that intercepts, buffers, and parses incoming JSON streams.
- The parsed object is attached directly to the `req.body` property.
- Register body-parsing middleware at the very top of your application file, before any routes.
- Ensure clients set the `Content-Type: application/json` header for JSON payloads.
