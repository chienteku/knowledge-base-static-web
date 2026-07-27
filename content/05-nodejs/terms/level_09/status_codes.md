# HTTP Status Codes

> **Level 9 — REST APIs & Best Practices**
> Standardized 3-digit numbers returned by a server to instantly tell the client's browser if their request succeeded, failed, or requires further action.

---

## 1. Prerequisites
- [REST API](../level_09/rest_api.md) — REST dictates that you must use these codes correctly.
- [The Response Object (`res`)](../level_07/req_res.md) — Where you set the code (`res.status(404)`).

---

## 2. Term Category
- **Internet Protocol / Standard**

---

## 3. Environment Context
- **Universal** (Every single web request on the internet uses these).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a React frontend sends a login request to an API, and the API returns `{ message: "Bad password" }`, the React app has to manually read the string, parse the English language, and figure out if that means success or failure. What if the backend changes the message to `"Incorrect password"`? The frontend breaks.
**HTTP Status Codes** fix this. They are universal, machine-readable numbers. 
If the React app sees a `401`, it instantly knows the login failed, regardless of what the English text says.

### (2) The 5 Categories
Status codes are grouped by their first digit:
- **1xx (Informational):** "Hold on, I'm thinking." (Rarely used directly by developers).
- **2xx (Success):** "Everything worked perfectly."
  - `200 OK`: Standard success.
  - `201 Created`: Success, and a new resource was created (used for POST requests).
- **3xx (Redirection):** "Go look somewhere else."
  - `301 Moved Permanently`: This URL changed.
- **4xx (Client Error):** "YOU messed up." (The user sent bad data).
  - `400 Bad Request`: You forgot a required field.
  - `401 Unauthorized`: You are not logged in.
  - `403 Forbidden`: You are logged in, but you aren't an admin.
  - `404 Not Found`: You asked for a URL or ID that doesn't exist.
- **5xx (Server Error):** "I messed up." (The server crashed).
  - `500 Internal Server Error`: The database exploded, or a fatal code bug occurred.

### (3) How to use them in Node.js
In Express, you chain the status method before sending the JSON:
```javascript
app.post('/users', (req, res) => {
  if (!req.body.email) {
    // 400 Client Error!
    return res.status(400).json({ error: "Email is required" });
  }
  // 201 Created Success!
  res.status(201).json({ message: "User created" });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Sending a 200 OK for an Error

**The mistake:** A developer catches an error, but forgets to set the status code.
```javascript
app.get('/users/99', (req, res) => {
  // By default, Express sends a 200 OK status!
  res.json({ error: "User 99 does not exist." }); 
});
```

**Why it's wrong:** The frontend sees the `200 OK` status code, assumes the request was successful, and tries to render the user data. It crashes because the data is actually an error message!
**Golden Rule:** Always align your status code with the reality of the situation. An error message must be accompanied by a 4xx or 5xx status code.

---



### Mistake 2: Returning `HTTP 200 OK` for Error Responses with Error Payloads (200 OK Anti-Pattern)

**The mistake:** Returning `HTTP 200 OK` with payload `{ status: 'error', message: 'Unauthorized' }`.

**Why it's wrong:** Returning 200 OK for errors breaks HTTP specifications, client caching, and automated API monitoring tools. Return proper 4xx/5xx HTTP status codes.

*Incorrect:*
```javascript
res.status(200).json({ success: false, error: 'Unauthorized' }); // ❌ 200 OK error anti-pattern!
```

*Fix:*
```javascript
res.status(401).json({ error: 'Unauthorized' }); // Correct 401 status
```

### Mistake 3: Confusing `401 Unauthorized` with `403 Forbidden` Status Codes

**The mistake:** Returning `401 Unauthorized` when a logged-in user tries to access an admin page without admin permissions.

**Why it's wrong:** `401 Unauthorized` means **Unauthenticated** (user is not logged in). `403 Forbidden` means **Unauthorized** (user is authenticated but lacks required access permissions).

*Incorrect:*
```javascript
// User logged in as 'member' accessing /admin -> Returning 401
```

*Fix:*
```javascript
// User logged in as 'member' accessing /admin -> Return 403 Forbidden
```



### Mistake 4: Returning `HTTP 200 OK` for Error Responses with Error Payloads (200 OK Anti-Pattern)

**The mistake:** Returning `HTTP 200 OK` with payload `{ status: 'error', message: 'Unauthorized' }`.

**Why it's wrong:** Returning 200 OK for errors breaks HTTP specifications, client caching, and automated API monitoring tools. Return proper 4xx/5xx HTTP status codes.

*Incorrect:*
```javascript
res.status(200).json({ success: false, error: 'Unauthorized' }); // ❌ 200 OK error anti-pattern!
```

*Fix:*
```javascript
res.status(401).json({ error: 'Unauthorized' }); // Correct 401 status
```

### Mistake 5: Confusing `401 Unauthorized` with `403 Forbidden` Status Codes

**The mistake:** Returning `401 Unauthorized` when a logged-in user tries to access an admin page without admin permissions.

**Why it's wrong:** `401 Unauthorized` means **Unauthenticated** (user is not logged in). `403 Forbidden` means **Unauthorized** (user is authenticated but lacks required access permissions).

*Incorrect:*
```javascript
// User logged in as 'member' accessing /admin -> Returning 401
```

*Fix:*
```javascript
// User logged in as 'member' accessing /admin -> Return 403 Forbidden
```



### Mistake 6: Returning `HTTP 200 OK` for Error Responses with Error Payloads (200 OK Anti-Pattern)

**The mistake:** Returning `HTTP 200 OK` with payload `{ status: 'error', message: 'Unauthorized' }`.

**Why it's wrong:** Returning 200 OK for errors breaks HTTP specifications, client caching, and automated API monitoring tools. Return proper 4xx/5xx HTTP status codes.

*Incorrect:*
```javascript
res.status(200).json({ success: false, error: 'Unauthorized' }); // ❌ 200 OK error anti-pattern!
```

*Fix:*
```javascript
res.status(401).json({ error: 'Unauthorized' }); // Correct 401 status
```

### Mistake 7: Confusing `401 Unauthorized` with `403 Forbidden` Status Codes

**The mistake:** Returning `401 Unauthorized` when a logged-in user tries to access an admin page without admin permissions.

**Why it's wrong:** `401 Unauthorized` means **Unauthenticated** (user is not logged in). `403 Forbidden` means **Unauthorized** (user is authenticated but lacks required access permissions).

*Incorrect:*
```javascript
// User logged in as 'member' accessing /admin -> Returning 401
```

*Fix:*
```javascript
// User logged in as 'member' accessing /admin -> Return 403 Forbidden
```

## 6. Practice Exercises

### Exercise 1: The Detective

**Problem:** You are building a frontend app. You send a request to a backend API you don't control, and the server returns a `500 Internal Server Error`. Your boss yells at you to fix your frontend code. How do you defend yourself using your knowledge of Status Codes?

**Expected output:**
```text
"Boss, a 500-level error explicitly means the SERVER crashed. It is a Backend bug, not a Frontend bug! If I had sent bad data from the frontend, the server would have returned a 400-level error."
```

> [!check]- Answer
> - 4xx = Client's fault. 5xx = Server's fault.

---



### Exercise 2: Selecting Correct HTTP Status Codes

**Problem:** Select status code for:
1. Resource created successfully (201)
2. Invalid input validation failed (400)
3. Resource not found (404)
4. Unhandled server database crash (500)

**Expected output:**
```text
1. 201 Created
2. 400 Bad Request
3. 404 Not Found
4. 500 Internal Server Error
```

> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 400 Bad Request
> 3. 404 Not Found
> 4. 500 Internal Server Error
> ```
>
> **Explanation:** Standard status codes communicate exact request processing outcomes.

### Exercise 3: 204 No Content Usage

**Problem:** When should `HTTP 204 No Content` be returned? (When a request succeeds, e.g. DELETE, and requires no response body payload).

**Expected output:**
```text
When a request succeeds (e.g. DELETE or UPDATE) and requires no response body payload.
```

> [!check]- Answer
> ```javascript
> app.delete('/items/:id', async (req, res) => {
>   await Item.delete(req.params.id);
>   res.status(204).end(); // 204 No Content
> });
> ```
>
> **Explanation:** Status 204 indicates successful processing without sending response body bytes.



### Exercise 4: Selecting Correct HTTP Status Codes

**Problem:** Select status code for:
1. Resource created successfully (201)
2. Invalid input validation failed (400)
3. Resource not found (404)
4. Unhandled server database crash (500)

**Expected output:**
```text
1. 201 Created
2. 400 Bad Request
3. 404 Not Found
4. 500 Internal Server Error
```

> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 400 Bad Request
> 3. 404 Not Found
> 4. 500 Internal Server Error
> ```
>
> **Explanation:** Standard status codes communicate exact request processing outcomes.

### Exercise 5: 204 No Content Usage

**Problem:** When should `HTTP 204 No Content` be returned? (When a request succeeds, e.g. DELETE, and requires no response body payload).

**Expected output:**
```text
When a request succeeds (e.g. DELETE or UPDATE) and requires no response body payload.
```

> [!check]- Answer
> ```javascript
> app.delete('/items/:id', async (req, res) => {
>   await Item.delete(req.params.id);
>   res.status(204).end(); // 204 No Content
> });
> ```
>
> **Explanation:** Status 204 indicates successful processing without sending response body bytes.



### Exercise 6: Selecting Correct HTTP Status Codes

**Problem:** Select status code for:
1. Resource created successfully (201)
2. Invalid input validation failed (400)
3. Resource not found (404)
4. Unhandled server database crash (500)

**Expected output:**
```text
1. 201 Created
2. 400 Bad Request
3. 404 Not Found
4. 500 Internal Server Error
```

> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 400 Bad Request
> 3. 404 Not Found
> 4. 500 Internal Server Error
> ```
>
> **Explanation:** Standard status codes communicate exact request processing outcomes.

### Exercise 7: 204 No Content Usage

**Problem:** When should `HTTP 204 No Content` be returned? (When a request succeeds, e.g. DELETE, and requires no response body payload).

**Expected output:**
```text
When a request succeeds (e.g. DELETE or UPDATE) and requires no response body payload.
```

> [!check]- Answer
> ```javascript
> app.delete('/items/:id', async (req, res) => {
>   await Item.delete(req.params.id);
>   res.status(204).end(); // 204 No Content
> });
> ```
>
> **Explanation:** Status 204 indicates successful processing without sending response body bytes.

## 7. Related Terms
- [REST API](../level_09/rest_api.md) — The architecture that relies on these codes.
- [Unhandled Promise Rejections](../level_05/unhandled_rejections.md) — When this happens, the server usually fails to even send a 500 error!

---

## 8. Key Takeaways
- **Status Codes** are universal 3-digit numbers that indicate the result of an HTTP request.
- **2xx** = Success. **3xx** = Redirects. **4xx** = Client errors (bad data, unauthorized). **5xx** = Server errors (crashes).
- Always explicitly set `res.status()` when returning an error, or the frontend will mistakenly assume the request succeeded.
