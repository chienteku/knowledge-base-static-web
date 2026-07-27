# HTTP Status Codes

> **Level 2 — HTTP Anatomy**
> A 3-digit number sent by the Server in its HTTP Response to tell the Client exactly how the request went (Success, Error, Redirect, etc.).

---

## 1. Prerequisites
- [Request & Response Lifecycle](../level_01/request_response.md) — Status codes are the core feature of the Response phase.

---

## 2. Term Category
- **HTTP Standard / Error Handling**

---

## 3. Environment Context
- **Universal Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a Client sends a request, the Server processes it and sends back a Response. But how does the Client know if it worked? 
If the Client asked for User 5, but User 5 doesn't exist, the Server could send back a JSON string: `{"error": "Not Found"}`. But what if a different Server sends `{"message": "Missing user"}`? The Client's code would break trying to parse 100 different error formats.
The W3C created **Status Codes** as a universal, language-agnostic way for Servers to communicate success or failure using simple 3-digit numbers.

### (2) The 5 Categories
You don't need to memorize every code, you just need to know the first digit!
- **`1xx` (Informational)**: "Hold on, I'm still thinking." (Rarely used directly by developers).
- **`2xx` (Success)**: "Everything worked perfectly!"
- **`3xx` (Redirection)**: "The thing you want moved; go look over there instead."
- **`4xx` (Client Error)**: "You messed up." (The Client sent bad data, or isn't logged in).
- **`5xx` (Server Error)**: "I messed up." (The Client's request was fine, but the Server's backend code crashed).

### (3) Reality Metaphor
Imagine ordering food at a drive-thru.
- **`200`**: They hand you your food.
- **`301`**: There's a sign on the window saying "We moved across the street!"
- **`400`**: You ask for a "McWhopper" at a Wendy's. The cashier tells you that you are making a bad, invalid request.
- **`500`**: The restaurant is on fire. Your request was fine, but they physically cannot fulfill it.

### (4) The Most Important Codes to Memorize
- **`200 OK`**: Standard success.
- **`201 Created`**: Success, and a new database record was created (Usually sent after a POST).
- **`400 Bad Request`**: The Client sent invalid data (e.g., missing a required password field).
- **`401 Unauthorized`**: The Client didn't provide a valid API Key or Login Token.
- **`403 Forbidden`**: The Client is logged in, but doesn't have Admin permissions to do this.
- **`404 Not Found`**: The URL or resource does not exist.
- **`500 Internal Server Error`**: The backend code threw an unhandled exception and crashed.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Always returning `200 OK` even on errors

**The mistake:** A backend developer catches an error in their code, and sends a response: `res.status(200).json({ error: "User not found" })`.

**Why it's wrong:** The HTTP Status Code is `200 OK`. The browser, the network proxies, and the frontend JavaScript `fetch()` API will all look at the `200` and say "Great, it succeeded!" They won't read your custom JSON body. 
Frontend code relies on `res.ok` (which checks for `2xx` status codes) to know whether to show a green success toast or a red error toast. If you send errors with a `200` status, you break the entire architecture of the web!
**Golden Rule:** Always map your backend logic to the correct HTTP status code. If it's an error, send a `4xx` or `5xx`.

---

### Mistake 2: Returning `200 OK` for API Error Responses ("200 OK Error Anti-Pattern")

**The mistake:** Returning HTTP `200 OK` with payload `{ success: false, error: 'Unauthorized' }`.

**Why it's wrong:** HTTP status codes communicate protocol-level status. Returning 200 OK breaks API client monitoring, caching layers, and `fetch().ok` checks. Use proper 4xx/5xx status codes.

*Incorrect:*
```http
HTTP/1.1 200 OK
Content-Type: application/json

{"status": 401, "error": "Invalid credentials"} // ❌ Misleads HTTP proxies and client libraries!
```

*Fix:*
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error": "Invalid credentials"}
```

---

### Mistake 3: Confusing `401 Unauthorized` with `403 Forbidden`

**The mistake:** Returning `401 Unauthorized` when a logged-in user attempts to access an admin endpoint.

**Why it's wrong:** `401 Unauthorized` means **Unauthenticated** (user has not provided valid credentials/login). `403 Forbidden` means **Unauthorized** (server knows who you are, but you lack permission).

*Incorrect:*
```http
/* User is logged in as 'member', attempting to access admin route */
HTTP/1.1 401 Unauthorized ; ❌ Incorrect! User IS authenticated!
```

*Fix:*
```http
HTTP/1.1 403 Forbidden ; Correct code: User authenticated, but forbidden permission
```


---

## 6. Practice Exercises

### Exercise 1: Whose fault is it?

**Problem:** You are building a React frontend that talks to a Node.js backend. You click "Submit" and check the Network tab in your DevTools. The API returned a `502 Bad Gateway`. 
Should you spend the next hour debugging your React code, or call the backend engineer?

**Expected output:**
```text
Call the backend engineer! 
Any code starting with `5` means the Server failed. Your React code is completely fine; the backend infrastructure is broken.
```

> [!check]- Answer
> - Remember the 4xx vs 5xx rule! 4 is your fault, 5 is their fault.

---

### Exercise 2: HTTP Status Code Categorization

**Problem:** Match the 3-digit status code class to its category:
1. 1xx
2. 2xx
3. 3xx
4. 4xx
5. 5xx

**Expected output:**
```text
1. Informational
2. Success
3. Redirection
4. Client Error
5. Server Error
```

> [!check]- Answer
> ```text
> 1xx -> Informational
> 2xx -> Success
> 3xx -> Redirection
> 4xx -> Client Error
> 5xx -> Server Error
> ```
> - **Explanation:** The first digit of HTTP status codes defines response class.
---

### Exercise 3: Status Code Identification

**Problem:** Identify the proper HTTP status code for each scenario:
1. New resource created successfully via POST.
2. Requested resource ID does not exist in database.
3. Server rate limit exceeded by client.
4. Database connection timeout inside backend service.

**Expected output:**
```text
1. 201 Created
2. 404 Not Found
3. 429 Too Many Requests
4. 500 Internal Server Error (or 504 Gateway Timeout)
```

> [!check]- Answer
> ```text
> 1. 201 Created
> 2. 404 Not Found
> 3. 429 Too Many Requests
> 4. 500 Internal Server Error (or 504 Gateway Timeout)
> ```
> - **Explanation:** Standard HTTP status codes communicate specific application outcomes.
---

## 7. Related Terms
- [The `Response` Object](../level_05/response_object.md) — How we check the status code in JavaScript using `response.status` and `response.ok`.

---

## 8. Key Takeaways
- Status Codes are a 3-digit standard for communicating success/failure over the network.
- **`2xx` = Success.**
- **`4xx` = Client Error** (Frontend messed up: Bad data, not logged in, wrong URL).
- **`5xx` = Server Error** (Backend messed up: Database down, code crashed).
- **NEVER** return a `200` status code if the operation actually failed!
