# Mocking APIs

> **Level 10 — Designing & Tooling**
> The practice of creating a fake, "dummy" version of an API that returns hardcoded JSON data, allowing frontend developers to build the UI before the real backend is actually finished.

---

## 1. Prerequisites
- [The fetch() API](../level_05/fetch.md) — The frontend code that calls the mock.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The hardcoded data returned by the mock.

---

## 2. Term Category

**Developer Workflow / Tooling (Local Development)**: Mocking APIs is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In a professional tech company, Frontend and Backend teams work at the same time (in parallel). 
If the Frontend team is assigned to build the "User Profile" page, they need to fetch data from `GET /api/profile`. But the Backend team hasn't built that endpoint yet! 
Does the Frontend team just go home and wait for a week? No! They create a **Mock API**.
They spin up a tiny, fake server on their laptop. When the frontend `fetch`es the data, the fake server instantly returns a hardcoded JSON string: `{ "name": "Fake Bob", "age": 99 }`. The Frontend team can now build out the entire UI, HTML, and CSS using this dummy data. When the Backend team finishes a week later, the Frontend just switches the URL from the fake server to the real server.

### (2) Tools for Mocking
How do you build a fake server?
1. **JSON Server:** An incredibly popular NPM package. You literally just write a `db.json` file, run one terminal command, and it magically creates a full, working REST API (with GET, POST, and DELETE) that reads and writes to that text file!
2. **Postman / Mockoon:** Desktop tools that let you click a button to launch a fake API on your laptop.
3. **MSW (Mock Service Worker):** The modern industry standard. It intercepts `fetch` requests *inside* the browser before they even hit the network, and returns fake data.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mocking the "Happy Path" only

**The mistake:** A frontend developer mocks `GET /users` to return an array of 5 users. They build a beautiful UI list. When they connect to the real backend, the real backend occasionally takes 3 seconds to respond, or returns a `500 Server Error`. The UI immediately crashes.

**Why it's wrong:** If you only mock the "Happy Path" (instant, perfect data), you forget to build Loading Spinners and Error Messages! 
**Golden Rule:** A good Mock API should randomly delay responses by 2 seconds to test your loading UI, and should occasionally be programmed to return a `404` or `500` status code to ensure your `catch` blocks work correctly.

---

### Mistake 2: Using Flaky Hardcoded Mock Responses in Production Bundles

**The mistake:** Leaving `if (isMock) return mockData;` toggle flags in production web code.

**Why it's wrong:** Leaving mock code in production bundles inflates JS bundle size and introduces risks of serving fake mock data to real users. Use MSW (Mock Service Worker) for isolated test mocking.

*Incorrect:*
```javascript
// Hardcoded mock in production file
if (process.env.NODE_ENV === 'development') return MOCK_DATA; // ❌ Risky production leaks!
```

*Fix:*
```javascript
// Use MSW (Mock Service Worker) to intercept fetch calls at network level during testing
```

---

### Mistake 3: Allowing Mock Data Schemas to Drift Away from Real API Responses

**The mistake:** Maintaining static mock JSON files manually without validating them against production OpenAPI specs.

**Why it's wrong:** Outdated mocks pass frontend unit tests while real production API integrations fail. Generate mock data automatically from OpenAPI schemas using tools like `msw-auto-mock` or Prism.

*Incorrect:*
```http
/* Static mock JSON file maintained manually for 2 years without schema validation */
```

*Fix:*
```http
/* Generate dynamic mock handlers automatically from authoritative OpenAPI spec files */
```


---

## 5. Practice Exercises

### Exercise 1: MSW Mock Service Worker Interceptor Simulator

**Scenario:** Simulates Mock Service Worker (MSW) by intercepting outgoing fetch requests and returning mocked JSON HTTP responses in test suites.

**Requirements:**
1. Write createMockServer(handlersArray).
2. Intercept matching method and path.
3. Return mocked status and JSON body.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createMockServer(handlersArray = []) {
>   const handlerMap = new Map();
>   handlersArray.forEach(h => {
>     handlerMap.set(`${h.method.toUpperCase()}:${h.path}`, h.resolver);
>   });
>
>   return {
>     async fetch(url, options = {}) {
>       const method = (options.method || "GET").toUpperCase();
>       const path = new URL(url, "https://dummy.com").pathname;
>       const key = `${method}:${path}`;
>
>       if (handlerMap.has(key)) {
>         const resolver = handlerMap.get(key);
>         const mockRes = await resolver(options);
>         return {
>           ok: mockRes.status >= 200 && mockRes.status < 300,
>           status: mockRes.status || 200,
>           json: async () => mockRes.body
>         };
>       }
>
>       throw new Error(`Unhandled mock request: ${method} ${path}`);
>     }
>   };
> }
>
> // Verification tests
> const handlers = [
>   { method: "GET", path: "/api/users", resolver: async () => ({ status: 200, body: [{ id: 1 }] }) }
> ];
>
> const mockServer = createMockServer(handlers);
> mockServer.fetch("https://api.com/api/users").then(res => {
>   console.assert(res.ok === true && res.status === 200, "Test 1 Failed");
>   return res.json().then(body => {
>     console.assert(body.length === 1 && body[0].id === 1, "Test 2 Failed");
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **API Mocking Concept**: Simulating API responses during testing or development without connecting to live backend servers.
> 2. **MSW (Mock Service Worker)**: Standard tool intercepting network requests at the Service Worker / Node.js process layer.
> 3. **Decoupled Frontend Development**: Allows UI developers to build features before backend APIs are deployed.
> 
---

### Exercise 2: Dynamic Mock Data Generator with Failure Injection

**Scenario:** A testing utility generates mock API responses with configurable artificial network delay and failure probability.

**Requirements:**
1. Write generateMockResponse(dataObj, delayMs, failureRatePct).
2. Simulate delay.
3. Fail with 500 error if failure hit.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function generateMockResponse(dataObj, delayMs = 50, failureRatePct = 0, mockSleep) {
>   const sleep = mockSleep || ((ms) => new Promise(r => setTimeout(r, ms)));
>
>   await sleep(delayMs);
>
>   const randomVal = Math.random() * 100;
>   if (randomVal < failureRatePct) {
>     return {
>       ok: false,
>       status: 500,
>       error: "Mock Injected Server Error"
>     };
>   }
>
>   return {
>     ok: true,
>     status: 200,
>     data: dataObj
>   };
> }
>
> // Verification tests
> const mockSleep = async () => {};
>
> generateMockResponse({ name: "Alice" }, 10, 0, mockSleep).then(res => {
>   console.assert(res.ok === true && res.data.name === "Alice", "Test 1 Failed");
> });
>
> generateMockResponse({ name: "Alice" }, 10, 100, mockSleep).then(res => {
>   console.assert(res.ok === false && res.status === 500, "Test 2 Failed: Must inject failure when rate 100%");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Chaos Engineering Simulation**: Injecting artificial errors and latency tests UI resiliency under adverse network conditions.
> 2. **Latency Simulation**: Simulating 3G/4G delays reveals missing loading spinners and skeleton screens.
> 3. **Deterministic Test Stubs**: Providing reliable mock stubs ensures test suites run fast and reproducibly.
> 
---

### Exercise 3: Contract-Based Mock Provider

**Scenario:** Generates dynamic mock object instances directly from JSON Schema definitions for unit test suites.

**Requirements:**
1. Write generateMockFromSchema(schemaObj).
2. Generate fallback values for primitive types.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generateMockFromSchema(schemaObj = {}) {
>   const mock = {};
>   const props = schemaObj.properties || {};
>
>   for (const [key, rules] of Object.entries(props)) {
>     if (rules.type === "string") {
>       mock[key] = rules.example || `mock_${key}`;
>     } else if (rules.type === "number" || rules.type === "integer") {
>       mock[key] = rules.example !== undefined ? rules.example : 42;
>     } else if (rules.type === "boolean") {
>       mock[key] = rules.example !== undefined ? rules.example : true;
>     }
>   }
>
>   return mock;
> }
>
> // Verification tests
> const schema = {
>   properties: {
>     username: { type: "string", example: "alice_test" },
>     age: { type: "number" }
>   }
> };
>
> const mock = generateMockFromSchema(schema);
> console.assert(mock.username === "alice_test", "Test 1 Failed");
> console.assert(mock.age === 42, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Schema-Driven Test Mocks**: Generates realistic mock data automatically from OpenAPI or JSON Schema definitions.
> 2. **Consistent Test Fixtures**: Eliminates hardcoded test data files across frontend unit test suites.
> 3. **Schema Alignment Guard**: Guarantees test mocks update automatically when API schemas change.
---

## 6. Related Terms
- [Swagger / OpenAPI Specification](openapi.md) — You can actually feed an OpenAPI file into a mocking tool, and it will automatically generate the fake API for you!
- [Postman / Insomnia (API Clients)](api_clients.md) — Postman has built-in Mock Server capabilities.
- [API Contract / Schema-First Design](api_contract.md) — Related concept: API Contract / Schema-First Design.

---

## 7. Key Takeaways
- **Mocking** is creating a fake API that returns hardcoded JSON.
- It unblocks Frontend developers, allowing them to build the UI while the Backend is still being developed.
- Tools like `json-server` or `MSW` make spinning up a mock API take less than 5 minutes.
- You must always remember to mock Errors and Network Delays, not just perfect data.
