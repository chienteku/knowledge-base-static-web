# Swagger / OpenAPI Specification

> **Level 10 — Designing & Tooling**
> A universally accepted standard for writing a "blueprint" (documentation) of your API, allowing computers to automatically generate documentation websites and testing tools.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — OpenAPI is specifically designed to document REST APIs.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The OpenAPI blueprint is written in JSON (or YAML).

---

## 2. Term Category

**API Documentation / Standard (Architecture / Backend Documentation)**: Swagger / OpenAPI Specification is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: OpenAPI 3.0 Document Specification Validator

**Scenario:** An API linter validates structural compliance of OpenAPI 3.0 document schemas (`openapi`, `info`, `paths`).

**Requirements:**
1. Write validateOpenApiSpec(specObj).
2. Check openapi version string '3.0.x'.
3. Check info title/version.
4. Check paths object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateOpenApiSpec(specObj = {}) {
>   const errors = [];
>
>   if (!specObj.openapi || typeof specObj.openapi !== "string" || !specObj.openapi.startsWith("3.")) {
>     errors.push("Missing or invalid 'openapi' version string (expected 3.x.x)");
>   }
>
>   if (!specObj.info || typeof specObj.info.title !== "string" || typeof specObj.info.version !== "string") {
>     errors.push("Missing or invalid 'info.title' or 'info.version'");
>   }
>
>   if (!specObj.paths || typeof specObj.paths !== "object") {
>     errors.push("Missing or invalid 'paths' object");
>   }
>
>   return { valid: errors.length === 0, errors };
> }
>
> // Verification tests
> const validSpec = {
>   openapi: "3.0.3",
>   info: { title: "User API", version: "1.0.0" },
>   paths: { "/users": {} }
> };
>
> console.assert(validateOpenApiSpec(validSpec).valid === true, "Test 1 Failed");
> console.assert(validateOpenApiSpec({}).valid === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **OpenAPI Specification (Swagger)**: Standard machine-readable specification language for describing RESTful APIs in YAML or JSON.
> 2. **Root Structure**: Requires openapi version, info (metadata), and paths (endpoints & operations) top-level attributes.
> 3. **API Documentation Automation**: OpenAPI specs automatically render interactive Swagger UI documentation and SDK generators.
> 
---

### Exercise 2: OpenAPI Path & Method Router Generator

**Scenario:** Generates route configuration objects from an OpenAPI `paths` specification definition.

**Requirements:**
1. Write generateRoutesFromOpenApi(pathsObj).
2. Iterate paths and HTTP methods (get, post, put, delete).

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateRoutesFromOpenApi(pathsObj = {}) {
>   const routes = [];
>
>   for (const [path, operations] of Object.entries(pathsObj)) {
>     for (const [method, config] of Object.entries(operations)) {
>       if (["get", "post", "put", "delete", "patch"].includes(method.toLowerCase())) {
>         routes.push({
>           method: method.toUpperCase(),
>           path,
>           operationId: config.operationId || `${method}_${path}`,
>           summary: config.summary || ""
>         });
>       }
>     }
>   }
>
>   return routes;
> }
>
> // Verification tests
> const paths = {
>   "/users": {
>     get: { operationId: "listUsers", summary: "Get all users" },
>     post: { operationId: "createUser", summary: "Add user" }
>   }
> };
>
> const routes = generateRoutesFromOpenApi(paths);
> console.assert(routes.length === 2, "Test 1 Failed");
> console.assert(routes[0].operationId === "listUsers", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Code-First vs Spec-First API Design**: Spec-first defines OpenAPI specs before coding; code-first generates OpenAPI specs from annotations.
> 2. **Automated Route Binding**: Generates Express/Fastify server routing logic directly from OpenAPI spec definitions.
> 3. **Single Source of Truth**: Ensures server code, documentation, and SDKs remain synchronized with the OpenAPI spec.
> 
---

### Exercise 3: OpenAPI Spec Component Schema Resolver

**Scenario:** Resolves `$ref` schema references inside OpenAPI specs (e.g. `"$ref": "#/components/schemas/User"`).

**Requirements:**
1. Write resolveOpenApiRef(refString, specObj).
2. Parse pointer path and return schema object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveOpenApiRef(refString, specObj = {}) {
>   if (!refString || typeof refString !== "string" || !refString.startsWith("#/")) {
>     return null;
>   }
>
>   const parts = refString.substring(2).split("/");
>   let current = specObj;
>
>   for (const part of parts) {
>     if (current && typeof current === "object" && part in current) {
>       current = current[part];
>     } else {
>       return null;
>     }
>   }
>
>   return current;
> }
>
> // Verification tests
> const spec = {
>   components: {
>     schemas: {
>       User: { type: "object", properties: { name: { type: "string" } } }
>     }
>   }
> };
>
> const userSchema = resolveOpenApiRef("#/components/schemas/User", spec);
> console.assert(userSchema.properties.name.type === "string", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **$ref JSON Pointers**: Allows re-using shared data model schemas across multiple endpoints in OpenAPI specs.
> 2. **DRY Spec Definitions**: Defines data models once under components.schemas to avoid code duplication.
> 3. **Recursive Schema Resolution**: Tooling recursively expands $ref pointers to construct full validation schemas.
---

## 6. Related Terms
- [REST (Representational State Transfer)](../level_03/rest.md) — The architecture this specification documents.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — GraphQL doesn't need Swagger, because GraphQL has "Introspection" (it inherently documents itself!).
- [Postman / Insomnia (API Clients)](api_clients.md) — Related concept: Postman / Insomnia (API Clients).
- [Mocking APIs](mocking.md) — Related concept: Mocking APIs.
- [API Contract / Schema-First Design](api_contract.md) — API Contract specification.
- [SDK / Client Library](sdk.md) — Generating client SDKs.

---

## 7. Key Takeaways
- **OpenAPI** is a standardized format (YAML/JSON) for describing a REST API.
- **Swagger UI** is the tool that reads that format and generates a beautiful, interactive documentation website.
- It allows for auto-generation of Frontend code and Backend validation.
- The best practice is to have the server automatically generate the OpenAPI file from the actual code.
