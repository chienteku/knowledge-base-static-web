# Resource Naming & URI Design

> **Level 3 — RESTful APIs**
> Conventions for clean REST endpoints (`/users/42/posts`).

---

## 1. Prerequisites
- [REST (Representational State Transfer)](rest.md) — The architectural style for web services.
- [Endpoints & Resources](endpoints_resources.md) — The entry points representing data.
---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Applies to backend routing setups and frontend client requests.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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


---

### Mistake 4: Using CamelCase or UpperCamelCase in URI Endpoint Paths

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

### Mistake 5: Exposing File Extensions in API Resource URIs (`/api/users.json` or `/api/users.php`)

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


---

### Mistake 6: Using CamelCase or UpperCamelCase in URI Endpoint Paths

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

### Mistake 7: Exposing File Extensions in API Resource URIs (`/api/users.json` or `/api/users.php`)

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


---

## 6. Practice Exercises

### Exercise 1: REST Refactoring

**Problem:** Refactor the following action-based endpoints into clean, standardized RESTful URIs:

1. `POST /api/createNewOrder`
2. `GET /api/getCommentsForPost/99`
3. `POST /api/removeUserFromGroup?userId=12&groupId=5`

> [!check]- Answer
> - 1. **`POST /orders`** (Returns the created order).
> - 2. **`GET /posts/99/comments`** (Hierarchy nesting).
> - 3. **`DELETE /groups/5/users/12`** (Deletes user 12 from group 5's list).


---

### Exercise 2: URI Naming Best Practices Checklist

**Problem:** Correct the following 3 poorly formatted REST API endpoint paths:
1. `/API/v1/Get_All_Active_Orders` 
2. `/api/v1/user_profile/` 
3. `/api/v1/deleteItem?id=4` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. /api/v1/active-orders (GET)
> 2. /api/v1/user-profiles (no trailing slash)
> 3. /api/v1/items/4 (DELETE)
> ```
> ```text
> 1. GET /api/v1/active-orders
> 2. GET /api/v1/user-profiles
> 3. DELETE /api/v1/items/4
> ```
> - **Explanation:** REST URIs use lowercase kebab-case, plural nouns, no trailing slashes, and HTTP methods for actions.
---

### Exercise 3: Trailing Slash Convention

**Problem:** Why should REST API design avoid trailing slashes in endpoint paths (e.g. `/users/` vs `/users`)?

**Expected output:**
> [!check]- Answer
> ```text
> Many Web servers and HTTP caches treat `/users` and `/users/` as distinct separate resources, causing duplicate cache entries or unexpected 301 redirects.
> ```
> ```text
> Many Web servers and HTTP caches treat `/users` and `/users/` as distinct separate resources, causing duplicate cache entries or unexpected 301 redirects.
> ```
> - **Explanation:** Standardizing on paths without trailing slashes prevents URL ambiguity.
---

### Exercise 4: URI Naming Best Practices Checklist

**Problem:** Correct the following 3 poorly formatted REST API endpoint paths:
1. `/API/v1/Get_All_Active_Orders` 
2. `/api/v1/user_profile/` 
3. `/api/v1/deleteItem?id=4` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. /api/v1/active-orders (GET)
> 2. /api/v1/user-profiles (no trailing slash)
> 3. /api/v1/items/4 (DELETE)
> ```
> ```text
> 1. GET /api/v1/active-orders
> 2. GET /api/v1/user-profiles
> 3. DELETE /api/v1/items/4
> ```
> - **Explanation:** REST URIs use lowercase kebab-case, plural nouns, no trailing slashes, and HTTP methods for actions.
---

### Exercise 5: Trailing Slash Convention

**Problem:** Why should REST API design avoid trailing slashes in endpoint paths (e.g. `/users/` vs `/users`)?

**Expected output:**
> [!check]- Answer
> ```text
> Many Web servers and HTTP caches treat `/users` and `/users/` as distinct separate resources, causing duplicate cache entries or unexpected 301 redirects.
> ```
> ```text
> Many Web servers and HTTP caches treat `/users` and `/users/` as distinct separate resources, causing duplicate cache entries or unexpected 301 redirects.
> ```
> - **Explanation:** Standardizing on paths without trailing slashes prevents URL ambiguity.
---

### Exercise 6: URI Naming Best Practices Checklist

**Problem:** Correct the following 3 poorly formatted REST API endpoint paths:
1. `/API/v1/Get_All_Active_Orders` 
2. `/api/v1/user_profile/` 
3. `/api/v1/deleteItem?id=4` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. /api/v1/active-orders (GET)
> 2. /api/v1/user-profiles (no trailing slash)
> 3. /api/v1/items/4 (DELETE)
> ```
> ```text
> 1. GET /api/v1/active-orders
> 2. GET /api/v1/user-profiles
> 3. DELETE /api/v1/items/4
> ```
> - **Explanation:** REST URIs use lowercase kebab-case, plural nouns, no trailing slashes, and HTTP methods for actions.
---

### Exercise 7: Trailing Slash Convention

**Problem:** Why should REST API design avoid trailing slashes in endpoint paths (e.g. `/users/` vs `/users`)?

**Expected output:**
> [!check]- Answer
> ```text
> Many Web servers and HTTP caches treat `/users` and `/users/` as distinct separate resources, causing duplicate cache entries or unexpected 301 redirects.
> ```
> ```text
> Many Web servers and HTTP caches treat `/users` and `/users/` as distinct separate resources, causing duplicate cache entries or unexpected 301 redirects.
> ```
> - **Explanation:** Standardizing on paths without trailing slashes prevents URL ambiguity.
---

## 7. Related Terms
- [CRUD Operations](crud.md) — The database actions that align with RESTful resource endpoints.
- [API Versioning (v1, v2)](../level_10/versioning.md) — The strategy of prefixing paths with versions (e.g. `/v1/users`).
- [Over-fetching vs Under-fetching](../level_07/overfetching_underfetching.md) — Related concept: Over-fetching vs Under-fetching.
---

## 8. Key Takeaways
- REST URIs should name resources (nouns), never actions (verbs).
- Use plural nouns for collections (e.g. `/users` instead of `/user`).
- Use hierarchy paths (e.g. `/parents/child`) to represent sub-resource relationships.
- Use query string parameters for filtering, sorting, and pagination (e.g. `/items?sort=price`).
- Stick to standard kebab-case naming for multi-word paths (e.g. `/user-profiles`).
