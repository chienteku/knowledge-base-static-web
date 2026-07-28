# Swagger / OpenAPI Specification

> **Level 10 — Designing & Tooling**
> A universally accepted standard for writing a "blueprint" (documentation) of your API, allowing computers to automatically generate documentation websites and testing tools.

---

## 1. Prerequisites
- [REST](../level_03/rest.md) — OpenAPI is specifically designed to document REST APIs.
- [JSON](../level_01/json.md) — The OpenAPI blueprint is written in JSON (or YAML).

---

## 2. Term Category
- **API Documentation / Standard**

---

## 3. Environment Context
- **Architecture / Backend Documentation**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a company builds a massive API with 200 endpoints, how do the frontend developers know how to use it? 
In the past, backend developers would manually write Word documents or Markdown files: *"Hey, send a POST to /users. It needs a name and age."* This manual documentation was always outdated, full of typos, and terrible to read.
**OpenAPI** (formerly called **Swagger**) was created to solve this. It is a strict, standardized format (written in JSON or YAML) for describing an API. 

### (2) The Magic of Code Generation
Because the OpenAPI blueprint is standardized, you can feed that YAML file into software tools that will automatically do magic:
1. **Swagger UI:** It instantly generates a beautiful, interactive website where frontend developers can read the docs and click a "Try it out" button to actually send requests to the server directly from the docs!
2. **Client Generation:** You can run a command line tool that reads the OpenAPI file and instantly writes 5,000 lines of frontend React code (TypeScript types and fetch functions) to interact with your API.

### (3) What does the Blueprint look like?
It looks like a giant configuration file:
```yaml
openapi: 3.0.0
info:
  title: My API
paths:
  /users:
    get:
      summary: Returns a list of users.
      responses:
        '200':
          description: A JSON array of user objects
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing the Swagger file manually and letting it rot

**The mistake:** A developer spends a week writing a massive 2,000-line `swagger.yaml` file by hand. Six months later, they change the API code, but forget to update the YAML file. The documentation is now a lie.

**Why it's wrong:** Never write OpenAPI files entirely by hand! The industry best practice is **Code-First Documentation**. You use libraries (like `swagger-jsdoc` in Node, or FastAPI in Python) that automatically generate the `swagger.yaml` file by reading the actual source code and code comments! If you change the code, the documentation updates itself automatically.
**Golden Rule:** Documentation that isn't automatically generated from the code will always become a lie.

---

### Mistake 2: Handwriting Verbal API Documentation Instead of Generating Interactive OpenAPI Specs

**The mistake:** Writing API documentation in static Wiki pages or Word documents.

**Why it's wrong:** Static Wiki documentation quickly drifts out of sync with real code. OpenAPI (Swagger) specifications generate interactive documentation (Swagger UI), client SDKs, and mock servers.

*Incorrect:*
```http
/* Writing manual Word doc API documentation */
```

*Fix:*
```http
/* Author OpenAPI 3.0 specification in YAML/JSON or generate from code annotations */
```

---

### Mistake 3: Using Invalid OpenAPI Schema Types (Confusing OpenAPI with JSON Schema)

**The mistake:** Writing `type: [string, null]` in OpenAPI 3.0.0 specs.

**Why it's wrong:** OpenAPI 3.0.0 handles nullability using `nullable: true`, not array types.

*Incorrect:*
```yaml
# OpenAPI 3.0.0 invalid type syntax
type: [string, null] # ❌ Syntax error in OAS 3.0!
```

*Fix:*
```yaml
# OpenAPI 3.0.0 valid syntax:
type: string
nullable: true
```


---

## 6. Practice Exercises

### Exercise 1: Postman vs Swagger

**Problem:** Your manager says: "We already have Postman Collections for our API, why do we need to bother with Swagger?" What is the main difference in their purpose?

**Expected output:**
> [!check]- Answer
> ```text
> Postman is primarily for Testing. Swagger is primarily for Documentation and Discovery.
> While Postman can generate docs, Swagger is an open-source standard. You can use a Swagger file to automatically generate SDKs (code libraries), generate strict validation rules for your backend, and create interactive web portals for third-party developers.
> ```
> - Which one is an application? Which one is a standardized blueprint?

---

### Exercise 2: OpenAPI 3.0 YAML Path Definition Structure

**Problem:** Write OpenAPI 3.0 snippet defining GET `/users` returning 200 OK response.

**Expected output:**
> [!check]- Answer
> ```yaml
> paths:
>   /users:
>     get:
>       summary: List users
>       responses:
>         '200':
>           description: Success
> ```
> ```yaml
> paths:
> /users:
> get:
> summary: List users
> responses:
> '200':
> description: Success
> ```
> - **Explanation:** OpenAPI paths map URIs, HTTP methods, and response schemas.
---

### Exercise 3: OpenAPI Ecosystem Tooling

**Problem:** List 3 popular tools powered by OpenAPI specifications.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Swagger UI (Interactive API documentation)
> 2. OpenAPI Generator (Automated SDK client code generation)
> 3. Prism (Contract-compliant mock API server)
> ```
> ```text
> 1. Swagger UI (Interactive API documentation)
> 2. OpenAPI Generator (Automated SDK client code generation)
> 3. Prism / MSW (Mock API servers)
> ```
> - **Explanation:** OpenAPI powers documentation, SDK generation, and mock servers.
---

## 7. Related Terms
- [REST](../level_03/rest.md) — The architecture this specification documents.
- [GraphQL](../level_07/graphql.md) — GraphQL doesn't need Swagger, because GraphQL has "Introspection" (it inherently documents itself!).

---

## 8. Key Takeaways
- **OpenAPI** is a standardized format (YAML/JSON) for describing a REST API.
- **Swagger UI** is the tool that reads that format and generates a beautiful, interactive documentation website.
- It allows for auto-generation of Frontend code and Backend validation.
- The best practice is to have the server automatically generate the OpenAPI file from the actual code.
