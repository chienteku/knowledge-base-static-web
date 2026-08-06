# Query Parameters & Path Variables

> **Level 2 — HTTP Anatomy**
> The two primary ways to pass dynamic data to a Server directly inside the URL (without using a Request Body).

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — This is an extension of how URLs are structured.
- [HTTP Methods (Verbs)](http_methods.md) — This is primarily used for `GET` requests, which cannot have bodies.

---

## 2. Term Category
- **HTTP Standard / URL Structure**

---

## 3. Environment Context
- **Universal Standard** (Essential for REST API design).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a `GET` request is forbidden from having a Request Body, how do you tell the Server *which* data you want? 
For example, if you want to look at User #5, you can't just request `/users` (that would return *all* users). 
If you want to look at a list of shoes, but only red ones under $50, how do you send those filters?
The W3C established two conventions for embedding data directly into the URL: **Path Variables** (for identifying a specific resource) and **Query Parameters** (for filtering/sorting a list of resources).

### (2) Path Variables (The Identifier)
A Path Variable is injected directly into the structural hierarchy of the URL. It is used when you are asking for **one specific item**.
In API documentation, it is usually denoted with a colon `:id`.

**Example:**
- `GET /users/5` (5 is the Path Variable).
- `GET /repos/chienteku/javascript-tutorial` (`chienteku` and `javascript-tutorial` are Path Variables).

### (3) Query Parameters (The Filter)
A Query Parameter is attached to the very end of the URL, starting with a Question Mark (`?`), followed by key-value pairs separated by an Ampersand (`&`). It is used for **filtering, sorting, or paginating** a list of items.

**Example:**
- `GET /shoes?color=red&maxPrice=50`
- The server will return a list of shoes, but *filtered* by those parameters.

### (4) Code Examples

#### Building URLs dynamically in JavaScript
```javascript
const userId = 42;
const sortOrder = "desc";
const limit = 10;

// Using Template Literals to inject variables into the URL string
const url = `https://api.example.com/users/${userId}/posts?sort=${sortOrder}&limit=${limit}`;

// The resulting URL: 
// https://api.example.com/users/42/posts?sort=desc&limit=10

fetch(url); // Sends a GET request
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Query Params when you should use Path Variables

**The mistake:** Designing your API so that getting a specific user looks like this: `GET /users?id=5`.

**Why it's wrong:** While this technically works, it violates REST architectural standards. If `5` is the unique identifier for a specific user, it should be a Path Variable (`GET /users/5`). Query parameters (`?`) should be reserved strictly for modifying a list (like `GET /users?role=admin`). 
**Golden Rule:** If it identifies ONE specific thing, use a Path Variable. If it filters MANY things, use a Query Parameter.

---

### Mistake 2: Passing Sensitive Passwords or Tokens in URL Query Parameters

**The mistake:** Sending passwords or JWT tokens via query strings: `GET /api/login?password=secret123`.

**Why it's wrong:** Query parameters are logged in plaintext across browser history, server access logs, proxy servers, and analytics tools. Pass secrets in headers or request bodies.

*Incorrect:*
```http
GET /api/auth?token=eyJhbGciOi... HTTP/1.1 ; ❌ Token saved in proxy access logs!
```

*Fix:*
```http
GET /api/auth HTTP/1.1
Authorization: Bearer eyJhbGciOi... ; Secure header placement
```

---

### Mistake 3: Forgetting to URL-Encode Special Characters in Query Parameters

**The mistake:** Constructing query strings manually with raw spaces or `&` characters: `/api/search?q=C++ & Java`.

**Why it's wrong:** Un-encoded `&` characters split query parameters into separate key-value pairs, corrupting input parameters. Use `encodeURIComponent()` or `URLSearchParams`.

*Incorrect:*
```javascript
const query = 'C++ & Java';
fetch('/api/search?q=' + query); // ❌ Evaluates as q=C++ and ' Java'=
```

*Fix:*
```javascript
const params = new URLSearchParams({ q: 'C++ & Java' });
fetch('/api/search?' + params.toString()); // Resolves to ?q=C%2B%2B+%26+Java
```


---

## 6. Practice Exercises

### Exercise 1: Identify the pieces

**Problem:** Look at this URL: `https://shop.com/categories/electronics/laptops?brand=apple&sort=price`
1. What are the Path Variables?
2. What are the Query Parameters?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Path Variables: `electronics` and `laptops` (they define the specific categories we are looking in).
> 2. Query Parameters: `brand=apple` and `sort=price` (they filter and sort the list of laptops).
> ```
> - Where does the question mark start?
> 
---

### Exercise 2: URLSearchParams Usage Pattern

**Problem:** Write JavaScript code using `URLSearchParams` to construct query string for `page=2`, `limit=50`, `sort=asc`.

**Expected output:**
> [!check]- Answer
> ```text
> const params = new URLSearchParams({ page: '2', limit: '50', sort: 'asc' });
> ```
> ```javascript
> const params = new URLSearchParams({
> page: '2',
> limit: '50',
> sort: 'asc'
> });
> console.log(params.toString()); // 'page=2&limit=50&sort=asc'
> ```
> - **Explanation:** `URLSearchParams` handles escaping and formatting query strings safely.
---

### Exercise 3: Query Params vs Path Params Guideline

**Problem:** When should you use Path Parameters (`/users/123`) vs Query Parameters (`/users?role=admin`)?

**Expected output:**
> [!check]- Answer
> ```text
> Use Path Parameters for identifying specific resources; use Query Parameters for filtering, sorting, pagination, or searching collections.
> ```
> ```text
> Path Parameters -> Resource identification (/users/123)
> Query Parameters -> Filtering, sorting, and pagination (/users?role=admin&page=1)
> ```
> - **Explanation:** Path params target resource hierarchy; query params filter representation state.
---

## 7. Related Terms
- [Request Body & Payloads](request_body.md) — The alternative way to send data (used for `POST`/`PUT`).
- [REST (Representational State Transfer)](../level_03/rest.md) — The architectural style that dictates when to use Path vs Query params.
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — Related concept: URL / URI (Uniform Resource Identifier).
- [URL Encoding (Percent-Encoding)](url_encoding.md) — Related concept: URL Encoding (Percent-Encoding).
- [Endpoints & Resources](../level_03/endpoints_resources.md) — Related concept: Endpoints & Resources.
- [Pagination (Offset vs. Cursor)](../level_06/pagination.md) — Related concept: Pagination (Offset vs. Cursor).

---

## 8. Key Takeaways
- **Path Variables** are built into the URL path (e.g., `/users/5`) and are used to identify a specific, unique resource.
- **Query Parameters** are tacked onto the end of the URL (e.g., `?color=red&size=M`) and are used to filter, sort, or paginate data.
- Both are incredibly useful for `GET` requests, because `GET` requests are not allowed to have a Request Body.
