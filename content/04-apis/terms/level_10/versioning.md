# API Versioning (v1, v2)

> **Level 10 — Designing & Tooling**
> The practice of creating a new, separate iteration of your API when making breaking changes, so you don't instantly crash all the old applications currently using it.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The architecture where versioning is most heavily debated.
- [Endpoints & Resources](../level_03/endpoints_resources.md) — The URLs that get versioned.

---

## 2. Term Category
- **API Architecture / Best Practices**

---

## 3. Environment Context
- **Backend Architecture**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you build an endpoint `GET /api/users`. It returns an array of strings: `["Bob", "Alice"]`. Thousands of mobile apps download your API and write code expecting an array of strings.
Six months later, your manager says: "We need more data. Change the API to return an array of Objects: `[{name: 'Bob'}, {name: 'Alice'}]`."
If you just change the code on the server and deploy it, **every single mobile app in the world will instantly crash** because their code is trying to read strings, not objects. This is called a "Breaking Change."
Because you cannot force users to update their mobile apps, you must support *both* the old code and the new code simultaneously. This is **API Versioning**.

### (2) How it looks (URL Versioning)
The most common way to version an API is to put a `/v1/` or `/v2/` directly into the URL path.
- The old mobile apps keep calling: `GET /api/v1/users` (returns Strings).
- The newly updated apps call: `GET /api/v2/users` (returns Objects).
Your backend server literally runs both versions of the code side-by-side.

### (3) The Cost of Versioning
Versioning is heavily discouraged unless absolutely necessary. 
Why? Because if you have a `v1`, `v2`, and `v3` API running simultaneously, you have to fix a bug in three different places! It doubles or triples your maintenance workload.
A change is only "Breaking" if you rename/delete a field, or change its data type. **Adding** a new field is *not* a breaking change, and does not require a new version!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Versioning because of a new feature

**The mistake:** A developer builds `GET /api/v1/posts`. A week later, they want to add a new `GET /api/comments` endpoint. They decide to bump the whole API to `v2` because it has new features.

**Why it's wrong:** Version bumps are for *Destructive* changes only! If you add a new endpoint, or if you add a new `createdAt` field to an existing JSON response, old clients will simply ignore the new data. Their code won't break. You only bump to `v2` if you are destroying or mutating existing behavior that old clients rely on.
**Golden Rule:** Avoid creating a `v2` at all costs. Always try to make your changes backwards-compatible.

---

### Mistake 2: Using Query Parameter Versioning (`?v=2`) for Major Breaking API Changes

**The mistake:** Versioning major breaking structural API changes using optional query parameters (`/users?version=2`).

**Why it's wrong:** Query parameters are easily omitted by clients and complicate caching layers. Use **URI Path Versioning** (`/v1/users` vs `/v2/users`) or **Header Versioning** for major breaking changes.

*Incorrect:*
```http
GET /api/users?v=2 HTTP/1.1 ; ❌ Easily omitted query parameter versioning!
```

*Fix:*
```http
GET /api/v2/users HTTP/1.1 ; Explicit URI path versioning
```

---

### Mistake 3: Creating New API Major Versions for Non-Breaking Compatible Field Additions

**The mistake:** Bumping API version from `/v1/users` to `/v2/users` simply to add a new optional `middleName` field.

**Why it's wrong:** Adding optional fields is backward compatible. Bumping major versions for non-breaking changes forces unnecessary migration work for clients. Reserve major versions for breaking contract changes.

*Incorrect:*
```http
/* Bumping version /v1 -> /v2 to add optional field */
```

*Fix:*
```http
/* Add optional fields directly to /v1 endpoint without version bump */
```


---

## 6. Practice Exercises

### Exercise 1: Breaking or Non-Breaking?

**Problem:** Look at the original JSON response for `/users/5`:
`{ "id": 5, "name": "Bob" }`

Are the following changes Breaking (requires `v2`) or Non-Breaking (keep `v1`)?
1. Adding an email: `{ "id": 5, "name": "Bob", "email": "bob@mail.com" }`
2. Splitting the name: `{ "id": 5, "firstName": "Bob", "lastName": "Smith" }`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Non-Breaking! Old apps will just ignore the `email` field. Keep v1.
> 2. Breaking! Old apps are looking for `response.name`. Since `name` is gone, the old apps will crash trying to read `undefined`. You MUST create a v2 for this.
> ```
> - If you delete something that existed before, it's breaking.

---

### Exercise 2: API Versioning Strategies Matrix

**Problem:** Match the API versioning strategy to its example:
1. URI Path Versioning
2. Header Versioning
3. Media Type (Accept) Versioning

**Expected output:**
> [!check]- Answer
> ```text
> 1. GET /v1/users
> 2. X-API-Version: 2.0
> 3. Accept: application/vnd.example.v2+json
> ```
> ```text
> 1. URI Path -> GET /v1/users
> 2. Header   -> X-API-Version: 2.0
> 3. Media Type -> Accept: application/vnd.example.v2+json
> ```
> - **Explanation:** Different versioning strategies communicate contract versions to clients.
---

### Exercise 3: Semantic Versioning (SemVer) Breakdown

**Problem:** Given SemVer version `2.4.1`, identify Major, Minor, and Patch numbers and explain when Major increments.

**Expected output:**
> [!check]- Answer
> ```text
> Major: 2, Minor: 4, Patch: 1. Major increments when incompatible breaking API changes are introduced.
> ```
> ```text
> Major: 2 (Increments on breaking API changes)
> Minor: 4 (Increments on backward-compatible new features)
> Patch: 1 (Increments on backward-compatible bug fixes)
> ```
> - **Explanation:** SemVer standardizes version number increments.
---

## 7. Related Terms
- [Endpoints & Resources](../level_03/endpoints_resources.md) — Where the `/v1/` is injected.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — GraphQL famously avoids versioning because clients specifically ask for the exact fields they want. If a field is deprecated, GraphQL just throws a warning.
- [Content Negotiation (Accept)](../level_02/content_negotiation.md) — Related concept: Content Negotiation (Accept).
- [Resource Naming & URI Design](../level_03/resource_naming.md) — Related concept: Resource Naming & URI Design.
- [API Contract / Schema-First Design](api_contract.md) — Related concept: API Contract / Schema-First Design.
- [Deprecation & Sunsetting](deprecation_sunsetting.md) — Related concept: Deprecation & Sunsetting.
- [API Gateway](api_gateway.md) — Related concept: API Gateway.

---

## 8. Key Takeaways
- **API Versioning** allows old, outdated clients to continue working while new clients get updated data structures.
- It is most commonly implemented in the URL path (e.g., `/api/v1/resource`).
- You should only create a new version for **Breaking Changes** (renaming, deleting, or changing data types).
- Adding new endpoints or new fields to a JSON payload is non-breaking.
