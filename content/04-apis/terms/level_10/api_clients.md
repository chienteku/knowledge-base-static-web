# Postman / Insomnia (API Clients)

> **Level 10 — Designing & Tooling**
> Desktop applications designed specifically for developers to test, debug, and document HTTP APIs without having to write any frontend code.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — These tools are essentially graphical interfaces for building complex HTTP requests.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The primary format used to test payloads in these tools.

---

## 2. Term Category

**Developer Tooling (Local Development / QA)**: Postman / Insomnia (API Clients) is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are a backend developer building a new `POST /api/users` endpoint. To test if your code actually works, you have to build an HTML form, write a JavaScript `fetch()` request, stringify a JSON body, and handle the response. That takes 20 minutes just to test one line of backend code!
To solve this, developers use **API Clients** (like Postman or Insomnia). They provide a beautiful Graphical User Interface (GUI). You simply type in the URL, select `POST` from a dropdown, type some JSON into a text box, and hit "Send." You see the server's exact response instantly.

### (2) Key Features
1. **Environments & Variables:** You can set a variable `{{base_url}}` to be `localhost:3000` on your laptop, and `api.production.com` when testing the live server.
2. **Authentication Helpers:** Instead of manually writing `Authorization: Bearer <token>` in the headers, you just paste your token into the "Auth" tab, and it formats it automatically.
3. **Collections:** You can save 50 different requests (e.g., "Login," "Get User," "Delete User") into a single folder (Collection) and share that folder with your team.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not saving tokens as variables

**The mistake:** A developer tests the "Login" endpoint, copies the JWT token, opens the "Get User" endpoint, pastes the token into the header, and hits Send. They do this 50 times a day.

**Why it's wrong:** Postman allows you to write simple test scripts that run automatically *after* a request finishes. You should write a 2-line script on the Login endpoint that says: `pm.environment.set("my_token", response.jwt)`. Then, all your other endpoints can just use `{{my_token}}`. This saves hours of manual copying and pasting!
**Golden Rule:** If you are manually copying data between endpoints in Postman, you are using the tool wrong. Automate it!

---

### Mistake 2: Creating New Axios or Fetch HTTP Client Instances Per Request (No Connection Reuse)

**The mistake:** Instantiating `axios.create()` inside an express route handler function.

**Why it's wrong:** Instantiating HTTP client instances inside request handlers prevents TCP socket pool reuse and Keep-Alive connection pooling. Instantiate HTTP client instances globally.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const client = axios.create({ baseURL: 'https://api.com' }); // ❌ Created on every request!
  const data = await client.get('/items');
});
```

*Fix:*
```javascript
// Instantiate API client singleton globally once outside route handlers:
const apiClient = axios.create({ baseURL: 'https://api.com', timeout: 5000 });
app.get('/data', async (req, res) => {
  const data = await apiClient.get('/items');
});
```

---

### Mistake 3: Hardcoding API Client Base URLs Across Source Files

**The mistake:** Hardcoding `https://api.staging.example.com` in 20 component files.

**Why it's wrong:** Hardcoding base URLs makes switching environments (local, staging, prod) impossible without refactoring codebase files. Inject base URLs via environment variables.

*Incorrect:*
```javascript
const res = await fetch('https://api.staging.example.com/users'); // ❌ Hardcoded environment URL!
```

*Fix:*
```javascript
const res = await fetch(`${process.env.API_BASE_URL}/users`);
```


---

## 5. Practice Exercises

### Exercise 1: Standardized HTTP API Client Factory

**Scenario:** An enterprise SDK wraps native fetch to create configured API client instances with default headers, base URLs, and timeout guards.

**Requirements:**
1. Write createApiClient(baseUrl, defaultHeaders, timeoutMs).
2. Expose get(path) and post(path, body) methods.
3. Prepend baseUrl and attach headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createApiClient(baseUrl, defaultHeaders = {}, timeoutMs = 5000, mockFetch) {
>   const fetchFn = mockFetch || globalThis.fetch;
>   const cleanBase = baseUrl.replace(/\/$/, "");
>
>   async function request(path, options = {}) {
>     const url = `${cleanBase}${path.startsWith("/") ? path : "/" + path}`;
>     const controller = new AbortController();
>     const timer = setTimeout(() => controller.abort(), timeoutMs);
>
>     try {
>       const response = await fetchFn(url, {
>         ...options,
>         signal: controller.signal,
>         headers: {
>           "Accept": "application/json",
>           ...defaultHeaders,
>           ...options.headers
>         }
>       });
>       clearTimeout(timer);
>
>       if (!response.ok) {
>         throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
>       }
>       return await response.json();
>     } catch (err) {
>       clearTimeout(timer);
>       throw err;
>     }
>   }
>
>   return {
>     get: (path, headers) => request(path, { method: "GET", headers }),
>     post: (path, body, headers) => request(path, {
>       method: "POST",
>       headers: { "Content-Type": "application/json", ...headers },
>       body: JSON.stringify(body)
>     })
>   };
> }
>
> // Verification tests
> const mockFetch = async (url, opts) => ({
>   ok: true,
>   status: 200,
>   json: async () => ({ url, auth: opts.headers["Authorization"] })
> });
>
> const client = createApiClient("https://api.com/v1", { "Authorization": "Bearer secret" }, 3000, mockFetch);
> client.get("/users").then(res => {
>   console.assert(res.url === "https://api.com/v1/users", "Test 1 Failed");
>   console.assert(res.auth === "Bearer secret", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **API Client Abstraction**: Encapsulates network connection setup, base URLs, and authentication headers in a reusable module.
> 2. **Centralized Timeout Guards**: Applies AbortController timeouts to all outbound client requests automatically.
> 3. **Decoupled Codebase Integration**: Prevents repeating raw fetch/Axios configuration across multiple UI components.
> 
---

### Exercise 2: Response Interceptor Pipeline & Auth Refresh

**Scenario:** An API client implements a response interceptor pipeline that automatically handles HTTP 401 Unauthorized errors by refreshing tokens.

**Requirements:**
1. Write executeWithInterceptor(apiCallFn, refreshAuthTokenFn).
2. Execute call.
3. If 401, invoke refreshAuthTokenFn and retry once.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeWithInterceptor(apiCallFn, refreshAuthTokenFn) {
>   try {
>     return await apiCallFn();
>   } catch (err) {
>     if (err.status === 401) {
>       const newAuthToken = await refreshAuthTokenFn();
>       if (!newAuthToken) throw err;
>       return await apiCallFn(newAuthToken);
>     }
>     throw err;
>   }
> }
>
> // Verification tests
> let attempts = 0;
> const mockApi = async (token) => {
>   attempts++;
>   if (!token || token !== "fresh_token") {
>     const e = new Error("Unauthorized");
>     e.status = 401;
>     throw e;
>   }
>   return { data: "PROTECTED_DATA" };
> };
>
> const refresh = async () => "fresh_token";
>
> executeWithInterceptor((tok) => mockApi(tok), refresh).then(res => {
>   console.assert(res.data === "PROTECTED_DATA", "Test 1 Failed");
>   console.assert(attempts === 2, "Test 2 Failed: Must retry once after refresh");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Transparent Token Refresh**: Intercepts 401 responses and refreshes authentication tokens without forcing user logout.
> 2. **Retry Mechanism**: Re-executes original API call with updated authorization credentials.
> 3. **Concurrency Lock Consideration**: In production, multiple parallel 401s should be queued behind a single token refresh execution.
> 
---

### Exercise 3: Multi-Environment Base URL Resolver

**Scenario:** Configures API client base URLs dynamically based on environment variables (`development`, `staging`, `production`).

**Requirements:**
1. Write resolveApiBaseUrl(envName, configMap).
2. Return environment target URL.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function resolveApiBaseUrl(envName, configMap = {}) {
>   const env = (envName || "development").toLowerCase();
>
>   const defaultConfig = {
>     development: "http://localhost:3000/api",
>     staging: "https://staging-api.example.com",
>     production: "https://api.example.com"
>   };
>
>   const activeConfig = { ...defaultConfig, ...configMap };
>   return activeConfig[env] || activeConfig.development;
> }
>
> // Verification tests
> console.assert(resolveApiBaseUrl("production") === "https://api.example.com", "Test 1 Failed");
> console.assert(resolveApiBaseUrl("unknown") === "http://localhost:3000/api", "Test 2 Failed: Fallback to dev");
> ```
>
> #### Technical Explanation
>
> 1. **Environment Config Separation**: Twelve-Factor App principle: store configuration in environment variables rather than hardcoded strings.
> 2. **Local Development Mocking**: Points local environments to mock servers or localhost ports.
> 3. **Production Isolation**: Ensures staging testing cannot accidentally contaminate production databases.
---

## 6. Related Terms
- [Swagger / OpenAPI Specification](openapi.md) — While Postman is for *testing* APIs, Swagger is for *documenting* them.
- [The fetch() API](../level_05/fetch.md) — What Postman is essentially replacing during the testing phase.
- [Mocking APIs](mocking.md) — Related concept: Mocking APIs.
- [DevTools Network Tab](network_tab.md) — Related concept: DevTools Network Tab.
- [SDK / Client Library](sdk.md) — Related concept: SDK / Client Library.

---

## 7. Key Takeaways
- **Postman** and **Insomnia** are desktop apps used to test HTTP APIs.
- They allow you to send `POST`/`PUT`/`DELETE` requests with custom headers and bodies without writing any frontend code.
- They support Variables and Collections to automate testing workflows.
