# Resource Naming & URI Design

> **Level 3 — RESTful APIs**
> Conventions for clean REST endpoints (`/users/42/posts`).

---

## 1. Prerequisites
- [REST (Representational State Transfer)](rest.md) — The architectural style for web services.
- [Endpoints & Resources](endpoints_resources.md) — The entry points representing data.

---

## 2. Term Category

**Architecture / Design (Universal: Applies to backend routing setups and frontend client requests.)**: Resource Naming & URI Design is a fundamental concept in this technology stack. **Level 3 — RESTful APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Technically, developers can design URL endpoint paths in any way they want—for example, calling `POST /getUserProfile?userId=12` or `GET /doDeleteUser`. However, when external developers consume your API, inconsistent or action-based paths make it difficult to guess endpoint structures, leading to integration friction.

To make APIs intuitive and predictable, REST establishes standardized **Resource Naming and URI Design** conventions:

#### 1. Nouns Over Verbs
Endpoints must represent **resources** (objects/nouns) rather than **actions** (verbs). The action is defined strictly by the **HTTP Verb** (`GET`, `POST`, `DELETE`), not the URL path.
- *Bad (Verb-based):* `POST /deleteUser/42`
- *Good (REST Noun-based):* `DELETE /users/42`

#### 2. Plural Nouns for Collections
Always use plural nouns to represent collections, keeping endpoints consistent across the system.
- *Good:* `/users`, `/products`, `/orders` (instead of `/user` or `/product`).

#### 3. Hierarchical Nesting for Relationships
To represent resources that belong to other resources (parent/child relationships), nest the paths logically from left to right.
- *Good:* `/users/42/posts` (Get all posts belonging to User 42).
- *Good:* `/users/42/posts/101` (Get Post 101 belonging to User 42).

#### 4. Query Parameters for Filtering and Sorting
Do not use path variables to filter or sort collections. Keep paths clean and use query string parameters instead.
- *Bad:* `/products/category/shoes/sort/price`
- *Good:* `/products?category=shoes&sort=price`

### (2) Reality Metaphor
Imagine a physical **office filing cabinet system**.
- **Action-based naming** is like sticking labels on the drawers describing physical actions: `"OpenCabinet"`, `"PullPaper"`, `"BurnFolder"`. It is messy and does not scale.
- **Resource-based naming** is like labeling drawers strictly by the **items** they contain—for example, a drawer labeled `"folders"` (`/folders`).
  - To read folder 42: You open drawer `"folders"` and look up file tab `42` (**`GET /folders/42`**).
  - To delete folder 42: You locate tab `42` and throw it in the shredder (**`DELETE /folders/42`**).
  - To read notes inside that folder: You look inside folder 42 for a slot labeled `"notes"` (**`GET /folders/42/notes`**).

### (3) API Comparison Table

Here is how to map typical actions to clean RESTful URIs:

| Action | Bad (Action-based URI) | Good (RESTful Noun + Verb) |
|---|---|---|
| Get all products | `GET /getAllProducts` | **`GET /products`** |
| Get one product | `GET /getProduct?id=12` | **`GET /products/12`** |
| Create a product | `POST /createNewProduct` | **`POST /products`** |
| Update a product | `POST /updateProduct/12` | **`PUT /products/12`** |
| Delete a product | `GET /deleteProduct/12` | **`DELETE /products/12`** |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing action verbs in REST URL paths

**The mistake:** Creating endpoints like `POST /users/42/update-password` or `POST /orders/create`.

**Why it's wrong:** It violates the noun-based REST contract and creates inconsistent API structures. Endpoints should focus on the resource state.

*Incorrect:*
```text
POST /users/42/change-status-to-active
```

*Fix:* Treat the status or password as a nested property resource, or use a partial update:
```text
PATCH /users/42   (Payload: { "status": "active" })
```

---

### Mistake 2: Using CamelCase or UpperCamelCase in URI Endpoint Paths

**The mistake:** Creating endpoints named `/api/userProfiles` or `/api/UserProfiles`.

**Why it's wrong:** URIs are case-sensitive according to RFC specifications (in Linux server environments). Use lowercase kebab-case (`/user-profiles`) for clean, consistent URL naming.

*Incorrect:*
```http
GET /api/userProfiles/123 HTTP/1.1 ; ❌ CamelCase in URI path!
```

*Fix:*
```http
GET /api/user-profiles/123 HTTP/1.1 ; Standard lowercase kebab-case URI
```

---

### Mistake 3: Exposing File Extensions in API Resource URIs (`/api/users.json` or `/api/users.php`)

**The mistake:** Including server technology file extensions in public API paths: `/api/get_users.php`.

**Why it's wrong:** Exposing implementation file extensions (`.php`, `.asp`, `.json`) leaks server technology stacks and prevents migrating backend languages. Use `Accept` headers for format selection.

*Incorrect:*
```http
GET /api/v1/products.json HTTP/1.1 ; ❌ Hardcoded file extension in path!
```

*Fix:*
```http
GET /api/v1/products HTTP/1.1
Accept: application/json ; Content negotiation header
```

## 5. Practice Exercises

### Exercise 1: REST Resource URL Naming Sanitizer & Linter

**Scenario:** A Linter validates API endpoint URI paths, enforcing lowercase kebab-case, plural nouns, and zero file extensions.

**Requirements:**
1. Write lintResourcePath(uriPath).
2. Check lowercase, hyphen-separated kebab-case, plural nouns, no file extensions.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function lintResourcePath(uriPath) {
>   if (!uriPath || typeof uriPath !== "string") return { valid: false, errors: ["Invalid input"] };
>
>   const errors = [];
>   const segments = uriPath.split("/").filter(Boolean);
>
>   if (uriPath !== uriPath.toLowerCase()) {
>     errors.push("URI path must be lowercase");
>   }
>
>   if (/\.(json|xml|html|php)$/.test(uriPath)) {
>     errors.push("URI path must not contain file extensions");
>   }
>
>   if (segments.some(s => s.includes("_"))) {
>     errors.push("Use hyphens (kebab-case) instead of underscores");
>   }
>
>   return {
>     valid: errors.length === 0,
>     errors
>   };
> }
>
> // Verification tests
> console.assert(lintResourcePath("/v1/user-profiles/usr-42").valid === true, "Test 1 Failed");
>
> const badRes = lintResourcePath("/V1/user_profiles/usr-42.json");
> console.assert(badRes.valid === false && badRes.errors.length === 3, "Test 2 Failed: Lowercase, hyphens, and no extensions enforced");
> ```
>
> #### Technical Explanation
>
> 1. **Kebab-Case Convention**: REST URIs use lowercase letters and hyphens (user-profiles) for readability.
> 2. **No File Extensions**: Avoid .json or .xml in paths; use Accept headers for format negotiation.
> 3. **No Underscores**: Underscores can be obscured by underlines in hyperlinked text interfaces.
> 
---

### Exercise 2: Filtering vs Path Parameter URL Structure Analyzer

**Scenario:** An API architect helper categorizes URI path variables vs query parameters for search/filtering endpoints.

**Requirements:**
1. Write analyzeUrlParameters(resourcePath, queryParams).
2. Path variables identity unique resources; query parameters filter/sort.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function analyzeUrlParameters(resourcePath, queryParams) {
>   const segments = resourcePath.split("/").filter(Boolean);
>   const pathIds = segments.filter((s, i) => i % 2 === 1); // e.g. /users/:id
>
>   const queryKeys = Object.keys(queryParams || {});
>
>   return {
>     identifyingResourceIds: pathIds,
>     filteringQueryKeys: queryKeys,
>     isCanonicalPath: pathIds.length > 0
>   };
> }
>
> // Verification tests
> const res = analyzeUrlParameters("/users/123/orders", { status: "shipped", sort: "date" });
> console.assert(res.identifyingResourceIds[0] === "123", "Test 1 Failed");
> console.assert(res.filteringQueryKeys.join(",") === "status,sort", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Path Parameters for Identity**: Path parameters (/users/123) identify specific unique resources in a hierarchy.
> 2. **Query Parameters for Options**: Query parameters (?status=active) modify or filter how resources are retrieved.
> 3. **Clean Resource Boundaries**: Keeps resource hierarchy intuitive and consistent.
> 
---

### Exercise 3: Sub-Resource Action Naming Converter

**Scenario:** Converts RPC-style controller actions (`/cancelOrder?id=12`) into RESTful resource sub-paths (`POST /orders/12/cancellations`).

**Requirements:**
1. Write convertRpcToRestPath(rpcAction, id).
2. Map cancelOrder to POST /orders/:id/cancellations.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function convertRpcToRestPath(rpcAction, id) {
>   const mappings = {
>     cancelOrder: { method: "POST", path: `/orders/${id}/cancellations` },
>     resendInvoice: { method: "POST", path: `/invoices/${id}/resends` },
>     activateUser: { method: "PUT", path: `/users/${id}/activation` }
>   };
>
>   return mappings[rpcAction] || { method: "POST", path: `/actions/${rpcAction}/${id}` };
> }
>
> // Verification tests
> const restCancel = convertRpcToRestPath("cancelOrder", "1001");
> console.assert(restCancel.method === "POST" && restCancel.path === "/orders/1001/cancellations", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Sub-Resource Actions**: Model non-CRUD actions as sub-resource creations (e.g. POST /cancellations).
> 2. **RPC vs REST Alignment**: RPC focuses on verb execution; REST focuses on creating resource representations.
> 3. **Uniform Interface Compliance**: Preserves standard HTTP method semantics across all domain actions.
---

## 6. Related Terms
- [CRUD Operations](crud.md) — The database actions that align with RESTful resource endpoints.
- [API Versioning (v1, v2)](../level_10/versioning.md) — The strategy of prefixing paths with versions (e.g. `/v1/users`).
- [Over-fetching vs Under-fetching](../level_07/overfetching_underfetching.md) — Related concept: Over-fetching vs Under-fetching.

---

## 7. Key Takeaways
- REST URIs should name resources (nouns), never actions (verbs).
- Use plural nouns for collections (e.g. `/users` instead of `/user`).
- Use hierarchy paths (e.g. `/parents/child`) to represent sub-resource relationships.
- Use query string parameters for filtering, sorting, and pagination (e.g. `/items?sort=price`).
- Stick to standard kebab-case naming for multi-word paths (e.g. `/user-profiles`).
