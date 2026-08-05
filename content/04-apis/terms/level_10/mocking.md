# Mocking APIs

> **Level 10 — Designing & Tooling**
> The practice of creating a fake, "dummy" version of an API that returns hardcoded JSON data, allowing frontend developers to build the UI before the real backend is actually finished.

---

## 1. Prerequisites
- [The fetch() API](../level_05/fetch.md) — The frontend code that calls the mock.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The hardcoded data returned by the mock.
---

## 2. Term Category
- **Developer Workflow / Tooling**

---

## 3. Environment Context
- **Local Development**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Parallel Engineering

**Problem:** You are the Frontend lead. The Backend lead says, "I will have the `/checkout` API ready next Friday." What exact steps do you take today to ensure your team isn't blocked?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Meet with the Backend lead today to agree upon the EXACT JSON schema (what the keys and data types will be).
> 2. Write a `db.json` file containing that exact dummy data.
> 3. Use a tool like JSON Server to launch a mock API.
> 4. Have the frontend team build the entire checkout UI using the mock API.
> 5. Next Friday, swap the base URL to the real backend.
> ```
> - What must both teams agree upon *before* you can write the dummy data?

---

### Exercise 2: Mock Service Worker (MSW) Request Handler Pattern

**Problem:** Write MSW REST handler intercepting `GET /api/user` and returning HTTP 200 JSON `{ id: 1, name: 'Alice' }`.

**Expected output:**
> [!check]- Answer
> ```text
> http.get('/api/user', () => { return HttpResponse.json({ id: 1, name: 'Alice' }); })
> ```
> ```javascript
> import { http, HttpResponse } from 'msw';
> export const handlers = [
> http.get('/api/user', () => {
> return HttpResponse.json({ id: 1, name: 'Alice' });
> })
> ];
> ```
> - **Explanation:** MSW intercepts network requests at the Service Worker level.
---

### Exercise 3: Prism OpenAPI Mocking Server

**Problem:** Which CLI command starts an instant mock API server from an `openapi.yaml` specification file using Prism?

**Expected output:**
> [!check]- Answer
> ```text
> prism mock openapi.yaml
> ```
> ```bash
> npx @stoplight/prism-cli mock openapi.yaml
> ```
> - **Explanation:** Prism reads OpenAPI specs and serves instant contract-compliant mock APIs.
---

## 7. Related Terms
- [Swagger / OpenAPI Specification](openapi.md) — You can actually feed an OpenAPI file into a mocking tool, and it will automatically generate the fake API for you!
- [Postman / Insomnia (API Clients)](api_clients.md) — Postman has built-in Mock Server capabilities.
- [API Contract / Schema-First Design](api_contract.md) — Related concept: API Contract / Schema-First Design.
---

## 8. Key Takeaways
- **Mocking** is creating a fake API that returns hardcoded JSON.
- It unblocks Frontend developers, allowing them to build the UI while the Backend is still being developed.
- Tools like `json-server` or `MSW` make spinning up a mock API take less than 5 minutes.
- You must always remember to mock Errors and Network Delays, not just perfect data.
