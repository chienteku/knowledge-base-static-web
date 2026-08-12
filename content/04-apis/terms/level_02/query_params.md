# Query Parameters & Path Variables

> **Level 2 — HTTP Anatomy**
> The two primary ways to pass dynamic data to a Server directly inside the URL (without using a Request Body).

---

## 1. Prerequisites
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — This is an extension of how URLs are structured.
- [HTTP Methods (Verbs)](http_methods.md) — This is primarily used for `GET` requests, which cannot have bodies.

---

## 2. Term Category

**HTTP Standard / URL Structure (Universal Standard .)**: Query Parameters & Path Variables is a fundamental concept in this technology stack. **Level 2 — HTTP Anatomy**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Pagination & Sorting Query Parameter Parser

**Scenario:** A REST API handler parses pagination and sorting query parameters from request URLs, applying default fallbacks.

**Requirements:**
1. Write parseListQueryParams(queryString).
2. Extract page (default 1), limit (default 10, max 100), and sort.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseListQueryParams(queryString) {
>   const params = new URLSearchParams(queryString || "");
>
>   let page = parseInt(params.get("page"), 10);
>   if (isNaN(page) || page < 1) page = 1;
>
>   let limit = parseInt(params.get("limit"), 10);
>   if (isNaN(limit) || limit < 1) limit = 10;
>   if (limit > 100) limit = 100; // Cap at max limit
>
>   const sort = params.get("sort") || "createdAt:desc";
>
>   return { page, limit, sort, offset: (page - 1) * limit };
> }
>
> // Verification tests
> const p1 = parseListQueryParams("page=2&limit=20&sort=name:asc");
> console.assert(p1.page === 2 && p1.limit === 20 && p1.offset === 20, "Test 1 Failed");
> console.assert(p1.sort === "name:asc", "Test 2 Failed");
>
> const p2 = parseListQueryParams("limit=500");
> console.assert(p2.limit === 100, "Test 3 Failed: Must cap limit at 100");
> ```
>
> #### Technical Explanation
>
> 1. **Query Parameter Usage**: Query parameters (?key=val) pass non-hierarchical parameters like filtering, sorting, and pagination.
> 2. **Defensive Defaults**: Applying fallbacks prevents runtime NaN crashes when clients omit query arguments.
> 3. **Offset Calculation**: Offset = (page - 1) * limit maps page numbers directly to SQL OFFSET database queries.
> 
---

### Exercise 2: Dynamic Filter Object to Query String Builder

**Scenario:** A search SDK serializes complex filter objects into clean URL query strings, omitting empty or null fields.

**Requirements:**
1. Write buildQueryString(filterObj).
2. Filter out null, undefined, and empty string values.
3. Return query string starting with ?.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildQueryString(filterObj) {
>   if (!filterObj || typeof filterObj !== "object") return "";
>
>   const params = new URLSearchParams();
>   for (const [key, value] of Object.entries(filterObj)) {
>     if (value !== null && value !== undefined && value !== "") {
>       if (Array.isArray(value)) {
>         value.forEach(v => params.append(key, String(v)));
>       } else {
>         params.set(key, String(value));
>       }
>     }
>   }
>
>   const str = params.toString();
>   return str ? `?${str}` : "";
> }
>
> // Verification tests
> const filters = { search: "node", status: "active", category: null, tags: ["js", "api"] };
> const qs = buildQueryString(filters);
>
> console.assert(qs.includes("search=node"), "Test 1 Failed");
> console.assert(qs.includes("status=active"), "Test 2 Failed");
> console.assert(!qs.includes("category"), "Test 3 Failed: null must be omitted");
> console.assert(qs.includes("tags=js&tags=api"), "Test 4 Failed: Arrays must append repeated keys");
> ```
>
> #### Technical Explanation
>
> 1. **URLSearchParams Serialization**: URLSearchParams converts objects and array entries into valid URL-encoded query strings.
> 2. **Omitted Blank Values**: Omitting empty parameters keeps URL strings concise and avoids unnecessary server filter logic.
> 3. **Repeated Key Array Formatting**: Arrays can be represented as repeated query keys (?tags=js&tags=api).
> 
---

### Exercise 3: Query Parameter Array Syntax Normalizer

**Scenario:** An API gateway normalizes different array query parameter conventions (`?tag=a&tag=b` vs `?tag=a,b` vs `?tag[]=a&tag[]=b`).

**Requirements:**
1. Write normalizeArrayQueryParam(queryParams, paramName).
2. Extract array items regardless of syntax format.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function normalizeArrayQueryParam(queryParams, paramName) {
>   if (!queryParams) return [];
>   const params = new URLSearchParams(queryParams);
>
>   // Format 1: ?tag[]=a&tag[]=b
>   const bracketKey = `${paramName}[]`;
>   if (params.has(bracketKey)) {
>     return params.getAll(bracketKey);
>   }
>
>   // Format 2: ?tag=a&tag=b
>   const repeated = params.getAll(paramName);
>   if (repeated.length > 1) {
>     return repeated;
>   }
>
>   // Format 3: ?tag=a,b
>   if (repeated.length === 1) {
>     return repeated[0].split(",").map(s => s.trim());
>   }
>
>   return [];
> }
>
> // Verification tests
> console.assert(normalizeArrayQueryParam("tag[]=a&tag[]=b", "tag").join(",") === "a,b", "Test 1 Failed");
> console.assert(normalizeArrayQueryParam("tag=a&tag=b", "tag").join(",") === "a,b", "Test 2 Failed");
> console.assert(normalizeArrayQueryParam("tag=a,b", "tag").join(",") === "a,b", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Query Array Conventions**: Different frameworks use different conventions: repeated keys, comma-separated lists, or bracket notation ([]).
> 2. **Gateway Normalization**: Normalizing query array inputs at the gateway protects internal API services from parser discrepancies.
> 3. **URLSearchParams.getAll()**: getAll(key) retrieves ALL values associated with a repeated query parameter key.
---

## 6. Related Terms
- [Request Body & Payloads](request_body.md) — The alternative way to send data (used for `POST`/`PUT`).
- [REST (Representational State Transfer)](../level_03/rest.md) — The architectural style that dictates when to use Path vs Query params.
- [URL / URI (Uniform Resource Identifier)](../level_01/url_uri.md) — Related concept: URL / URI (Uniform Resource Identifier).
- [URL Encoding (Percent-Encoding)](url_encoding.md) — Related concept: URL Encoding (Percent-Encoding).
- [Endpoints & Resources](../level_03/endpoints_resources.md) — Related concept: Endpoints & Resources.
- [Pagination (Offset vs. Cursor)](../level_06/pagination.md) — Related concept: Pagination (Offset vs. Cursor).

---

## 7. Key Takeaways
- **Path Variables** are built into the URL path (e.g., `/users/5`) and are used to identify a specific, unique resource.
- **Query Parameters** are tacked onto the end of the URL (e.g., `?color=red&size=M`) and are used to filter, sort, or paginate data.
- Both are incredibly useful for `GET` requests, because `GET` requests are not allowed to have a Request Body.
