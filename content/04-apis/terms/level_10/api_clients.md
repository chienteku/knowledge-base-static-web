# Postman / Insomnia (API Clients)

> **Level 10 — Designing & Tooling**
> Desktop applications designed specifically for developers to test, debug, and document HTTP APIs without having to write any frontend code.

---

## 1. Prerequisites
- [HTTP Methods](../level_02/http_methods.md) — These tools are essentially graphical interfaces for building complex HTTP requests.
- [JSON](../level_01/json.md) — The primary format used to test payloads in these tools.

---

## 2. Term Category
- **Developer Tooling**

---

## 3. Environment Context
- **Local Development / QA**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are a backend developer building a new `POST /api/users` endpoint. To test if your code actually works, you have to build an HTML form, write a JavaScript `fetch()` request, stringify a JSON body, and handle the response. That takes 20 minutes just to test one line of backend code!
To solve this, developers use **API Clients** (like Postman or Insomnia). They provide a beautiful Graphical User Interface (GUI). You simply type in the URL, select `POST` from a dropdown, type some JSON into a text box, and hit "Send." You see the server's exact response instantly.

### (2) Key Features
1. **Environments & Variables:** You can set a variable `{{base_url}}` to be `localhost:3000` on your laptop, and `api.production.com` when testing the live server.
2. **Authentication Helpers:** Instead of manually writing `Authorization: Bearer <token>` in the headers, you just paste your token into the "Auth" tab, and it formats it automatically.
3. **Collections:** You can save 50 different requests (e.g., "Login," "Get User," "Delete User") into a single folder (Collection) and share that folder with your team.

---

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Why not the Browser?

**Problem:** You build a `DELETE /api/users/5` endpoint. Why can't you just test this by typing `http://localhost:3000/api/users/5` into your Chrome address bar and hitting Enter?

**Expected output:**
```text
Because the browser address bar ALWAYS sends an HTTP `GET` request! 
You cannot use the browser's address bar to send `POST`, `PUT`, or `DELETE` requests, and you cannot attach a JSON body to it. This is exactly why tools like Postman exist!
```

> [!check]- Answer
> - What HTTP Method does the browser use when you press Enter in the URL bar?

---

### Exercise 2: Axios Interceptor Authentication Pattern

**Problem:** Write Axios request interceptor injecting `Authorization: Bearer <token>` into all outbound requests.

**Expected output:**
```text
apiClient.interceptors.request.use((config) => { config.headers.Authorization = `Bearer ${getToken()}`; return config; });
```

> [!check]- Answer
> ```javascript
> apiClient.interceptors.request.use((config) => {
> const token = getAuthToken();
> if (token) config.headers.Authorization = `Bearer ${token}`;
> return config;
> });
> ```
> - **Explanation:** Axios interceptors centralize cross-cutting request concerns like header injection.
---

### Exercise 3: API Client Singleton Benefits

**Problem:** Name 2 technical benefits of configuring a centralized API Client instance (Axios / Ky / custom fetch wrapper).

**Expected output:**
```text
1. Centralized base URL and timeout configuration
2. Global request/response interceptors (error logging, token injection)
```

> [!check]- Answer
> ```text
> 1. Centralized base URL, headers, and timeout configuration.
> 2. Global request/response interceptors for auth and error handling.
> ```
> - **Explanation:** Centralized API clients simplify cross-cutting HTTP infrastructure.
---

## 7. Related Terms
- [Swagger / OpenAPI](../level_10/openapi.md) — While Postman is for *testing* APIs, Swagger is for *documenting* them.
- [The `fetch()` API](../level_05/fetch.md) — What Postman is essentially replacing during the testing phase.

---

## 8. Key Takeaways
- **Postman** and **Insomnia** are desktop apps used to test HTTP APIs.
- They allow you to send `POST`/`PUT`/`DELETE` requests with custom headers and bodies without writing any frontend code.
- They support Variables and Collections to automate testing workflows.
