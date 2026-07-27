# HTTP Methods (Verbs)

> **Level 2 — HTTP Anatomy**
> The specific action a Client wants to perform on a Server's resource, indicated by a standardized keyword in the HTTP request.

---

## 1. Prerequisites
- [HTTP / HTTPS](../level_01/http_https.md) — Methods are the very first word in every HTTP request.
- [URL / URI](../level_01/url_uri.md) — You use a Method to tell the server *what* to do with the URL.

---

## 2. Term Category
- **HTTP Standard / Protocol Action**

---

## 3. Environment Context
- **Universal Standard** (Essential for building and consuming REST APIs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a Client sends a request to `https://api.github.com/users/chienteku`, what does it want? 
Does it want to *read* the user's profile? Does it want to *delete* the user's profile? Does it want to *update* the user's bio? The URL only points to the resource; it doesn't tell the Server what action to take. 
To solve this ambiguity, the HTTP protocol requires every request to start with a specific **Method (or Verb)**. This tells the server exactly what the Client's intention is.

### (2) The 5 Core Methods
While there are dozens of HTTP methods, full-stack developers rely on these five (which map perfectly to CRUD operations: Create, Read, Update, Delete):
1. **`GET`**: "Please give me this data." (Read-only. Should never modify the database).
2. **`POST`**: "Here is some brand new data; please create a new record in the database." (Create).
3. **`PUT`**: "Please completely replace the existing record at this URL with this new data." (Update/Replace).
4. **`PATCH`**: "Please partially update the existing record (e.g., just change the email, leave the rest alone)." (Partial Update).
5. **`DELETE`**: "Please delete this record from the database." (Delete).

### (3) Reality Metaphor
Imagine a massive file cabinet at a doctor's office. The URL is the folder labeled "Patient: Bob".
- `GET`: You pull the folder out to read Bob's blood type.
- `POST`: You create a brand new folder for a new patient and shove it into the cabinet.
- `PUT`: You throw away Bob's old medical history and replace it entirely with a brand new stack of papers.
- `PATCH`: You simply cross out Bob's old phone number and write in his new one.
- `DELETE`: You put Bob's folder in the shredder.

### (4) Code Examples

#### Standard Browser Behavior
When you type a URL into Chrome and hit Enter, your browser **ALWAYS** sends a `GET` request. 
```http
GET /users/123 HTTP/1.1
Host: api.example.com
```

#### Fetch API (Client-Side JavaScript)
If you want to send a `POST` or `DELETE`, you have to write JavaScript to manually tell the browser to change the verb!
```javascript
// Telling the browser to send a POST request instead of the default GET
fetch('https://api.example.com/users', {
  method: 'POST',
  body: JSON.stringify({ name: "Alice" })
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using GET to modify data

**The mistake:** A developer builds an endpoint `GET /api/deleteUser?id=5`, and when the server receives it, it deletes User 5 from the database.

**Why it's wrong:** `GET` requests are defined as **safe and idempotent**. This means browsers, proxies, and search engines assume they can aggressively fire `GET` requests to pre-load data because reading data shouldn't hurt anything. If Google's web scraper finds your `/api/deleteUser` link, it will send a `GET` request to it just to see what's there, accidentally deleting your users! 
**Golden Rule:** NEVER use `GET` to alter the database. Use `DELETE`, `POST`, `PUT`, or `PATCH`.

---

### Mistake 2: Using `GET` Requests for Operations That Modify Server State

**The mistake:** Creating a GET endpoint `/api/users/delete?id=5` to delete database records.

**Why it's wrong:** GET requests are designated as Safe and Idempotent. Web crawlers (Googlebot) and browser pre-fetchers will automatically follow GET links, causing unintended database deletions.

*Incorrect:*
```http
GET /api/users/delete?id=5 HTTP/1.1 ; ❌ Modifies server state via GET!
```

*Fix:*
```http
DELETE /api/users/5 HTTP/1.1 ; Correct semantic DELETE method
```

---

### Mistake 3: Confusing `PUT` (Full Replacement) with `PATCH` (Partial Update)

**The mistake:** Sending a `PUT /users/5` request with payload `{ email: 'new@example.com' }` expecting only the email to update.

**Why it's wrong:** `PUT` replaces the ENTIRE resource target. Sending partial fields via `PUT` should set missing fields to `null` or defaults. Use `PATCH` for partial field updates.

*Incorrect:*
```http
/* PUT request intended to update only 1 field */
PUT /users/5 HTTP/1.1

{"email": "new@example.com"} // ❌ Erases user's name and address!
```

*Fix:*
```http
PATCH /users/5 HTTP/1.1

{"email": "new@example.com"} // Safely updates specified fields only
```


---

## 6. Practice Exercises

### Exercise 1: The Shopping Cart

**Problem:** You are building an e-commerce site. 
1. The user clicks "View Cart". Which HTTP method is sent?
2. The user clicks "Checkout", which finalizes the order in the database. Which HTTP method is sent?

**Expected output:**
```text
1. `GET`. You are just reading data.
2. `POST`. You are creating a new "Order" record in the database.
```

> [!check]- Answer
> - Does the action create something new, or just read existing data?

---

### Exercise 2: HTTP Method Selection Matrix

**Problem:** Select the correct HTTP method for each action:
1. Fetch a list of products.
2. Create a new user account with server-generated ID.
3. Completely replace an existing user profile.
4. Delete a user account.

**Expected output:**
```text
1. GET
2. POST
3. PUT
4. DELETE
```

> [!check]- Answer
> ```text
> 1. GET
> 2. POST
> 3. PUT
> 4. DELETE
> ```
> - **Explanation:** Standard REST architecture maps CRUD actions to semantic HTTP verbs.
---

### Exercise 3: HEAD Request Behavior

**Problem:** What distinguishes a `HEAD` request from a `GET` request?

**Expected output:**
```text
HEAD requests return the exact same HTTP status code and response headers as GET, but omit the response body.
```

> [!check]- Answer
> ```text
> HEAD requests return the exact same HTTP status code and response headers as GET, but omit the response body.
> ```
> - **Explanation:** `HEAD` checks resource existence or content-length without downloading body bytes.
---

## 7. Related Terms
- [CRUD Operations](../level_03/crud.md) — The programming concept that HTTP Methods map to.
- [Idempotency](../level_06/idempotency.md) — The mathematical concept explaining why `PUT` and `POST` are treated differently in network retry logic.

---

## 8. Key Takeaways
- Every HTTP request must include a **Method (Verb)** indicating its intention.
- **GET**: Read data. **POST**: Create data. **PUT**: Replace data. **PATCH**: Update data. **DELETE**: Destroy data.
- Never use `GET` for destructive actions, because browsers assume `GET` requests are safe to pre-fetch and cache!
