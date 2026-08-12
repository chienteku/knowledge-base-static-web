# SDK / Client Library

> **Level 10 — Designing & Tooling**
> Language wrappers that hide raw HTTP from consumers.

---

## 1. Prerequisites
- [The fetch() API](../level_05/fetch.md) — The core networking protocol engine.
- [Swagger / OpenAPI Specification](openapi.md) — The schema descriptions used to generate client code.

---

## 2. Term Category

**Tooling (Universal: Implemented across various client programming languages .)**: SDK / Client Library is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a developer wants to integrate a third-party API (like Stripe, Twilio, or Firebase) into their codebase, writing raw HTTP calls using `fetch()` or `axios` is tedious. They must:
- Manually construct exact URL endpoints.
- Configure headers, authorization protocols, and content types.
- Serialize request bodies and deserialize response strings.
- Manually write error-handling logic for HTTP status codes.

To simplify integration and improve developer experience (DX), providers distribute **SDKs (Software Development Kits) or Client Libraries**:
- **SDK / Client Library:** A language-specific package wrapper (e.g. an `npm` package for JavaScript, or a PyPI package for Python) that encapsulates raw HTTP calls behind standard programmatic methods and class functions.
- **Type Safety & Autocomplete:** Modern client libraries provide native TypeScript definitions, giving developers inline autocomplete suggestions and compilation checks for request payloads directly inside their IDE.
- **Automated Generation:** Modern companies rarely write SDK code by hand. They feed their **API Contract (OpenAPI specification)** into code generators (such as OpenAPI Generator) to output SDKs in multiple programming languages automatically.

---

### (2) Code Comparison: Raw HTTP vs. SDK Client

#### 1. The Raw HTTP Approach
```javascript
const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/123/Messages.json', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('user:pass'),
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    To: '+1234567890',
    From: '+1987654321',
    Body: 'Hello!'
  })
});
const data = await response.json();
```

#### 2. The SDK Client Library Approach
The SDK abstracts all network paths, credentials formatting, and serialization away:
```javascript
import twilio from 'twilio';
const client = twilio('user', 'pass');

const message = await client.messages.create({
  to: '+1234567890',
  from: '+1987654321',
  body: 'Hello!'
});
```

---

### (3) Reality Metaphor
Imagine renting a vehicle.
- **Raw HTTP** is like walking to a factory, buying engine blocks, steel frames, tires, and spark plugs, **assembling the car yourself**, and figuring out how to direct fuel to the cylinders. It works, but it takes massive effort and is prone to errors.
- **An SDK / Client Library** is like renting an assembled car equipped with a **steering wheel and ignition key**. You do not need to understand how the fuel injectors work; you just turn the key and drive.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding secrets inside the SDK constructor initialization script

**The mistake:** Writing raw API key credentials directly into your codebase where you instantiate the SDK:
```javascript
// WRONG! SECURITY LEAK!
const stripe = new Stripe('sk_live_51Mz893hjK...');
```

**Why it's wrong:** Hardcoded secrets are easily committed to Git repositories, leaking credentials to the public.

*Fix:* Always retrieve credentials from environment variables:
```javascript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

---

### Mistake 2: Wrapping HTTP APIs in Heavy Monolithic SDKs for Simple Endpoints

**The mistake:** Requiring external developers to download a 50MB SDK library to make 1 simple HTTP GET call.

**Why it's wrong:** Heavy SDKs add supply-chain dependency overhead. For simple APIs, clean REST HTTP endpoints with `fetch` / `curl` documentation are lighter and easier to use.

*Incorrect:*
```http
/* Forcing developers to install massive SDKs for basic HTTP endpoints */
```

*Fix:*
```http
/* Provide clean REST documentation alongside optional lightweight SDKs */
```

---

### Mistake 3: Failing to Expose Idiomatic Language Features inside Language SDKs

**The mistake:** Building a Python SDK that uses JS-style callbacks instead of Pythonic `asyncio` or `requests` semantics.

**Why it's wrong:** Un-idiomatic SDKs frustrate developers. SDKs must feel native to the target programming language (Promises in JS, async/await in Python, Goroutines in Go).

*Incorrect:*
```python
# Un-idiomatic JS callback style in Python SDK
sdk.get_user(5, callback=handle_result) # ❌ Non-pythonic!
```

*Fix:*
```python
# Idiomatic Pythonic async/await SDK style:
user = await sdk.get_user(5)
```


---

## 5. Practice Exercises

### Exercise 1: Enterprise JavaScript Client SDK Factory

**Scenario:** An enterprise SDK wraps API authentication, base configuration, and resource models into a unified JavaScript SDK class instance.

**Requirements:**
1. Create PaymentSdk class.
2. Implement sdk.charges.create(payload) and sdk.refunds.create(id).
3. Handle API key authorization.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class PaymentSdk {
>   constructor(apiKey, config = {}) {
>     if (!apiKey) throw new Error("API key is required to initialize PaymentSdk");
>     this.apiKey = apiKey;
>     this.baseUrl = (config.baseUrl || "https://api.payments.com").replace(/\/$/, "");
>     this.mockFetch = config.mockFetch || globalThis.fetch;
>
>     this.charges = {
>       create: (payload) => this.#request("POST", "/v1/charges", payload)
>     };
>   }
>
>   async #request(method, path, body) {
>     const url = `${this.baseUrl}${path}`;
>     const res = await this.mockFetch(url, {
>       method,
>       headers: {
>         "Authorization": `Bearer ${this.apiKey}`,
>         "Content-Type": "application/json"
>       },
>       body: body ? JSON.stringify(body) : null
>     });
>
>     if (!res.ok) throw new Error(`SDK Request Failed with status ${res.status}`);
>     return await res.json();
>   }
> }
>
> // Verification tests
> const mockFetch = async (url, opts) => ({
>   ok: true,
>   status: 200,
>   json: async () => ({ id: "ch_123", status: "succeeded" })
> });
>
> const sdk = new PaymentSdk("sk_test_secret", { mockFetch });
> sdk.charges.create({ amount: 5000 }).then(res => {
>   console.assert(res.id === "ch_123" && res.status === "succeeded", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **SDK (Software Development Kit)**: Developer library wrapping raw API endpoints into idiomatic language methods and objects.
> 2. **Encapsulation & Ergonomics**: Abstracts HTTP authentication, headers, serialization, and error handling away from developer code.
> 3. **Version Pinning**: SDKs pin backend API version headers to shield developers from backend breaking changes.
> 
---

### Exercise 2: Fluent Builder Pattern for SDK Resource Queries

**Scenario:** Implements a fluent method-chaining Query Builder in a JavaScript SDK (`sdk.users().where('role', 'admin').limit(10).execute()`).

**Requirements:**
1. Write createUserQueryBuilder(fetchFn).
2. Support where(), limit(), and execute() method chaining.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createUserQueryBuilder(mockFetchFn) {
>   const queryParams = { filters: {}, limit: 20 };
>
>   const builder = {
>     where(field, value) {
>       queryParams.filters[field] = value;
>       return builder; // Return this for method chaining!
>     },
>     limit(count) {
>       queryParams.limit = count;
>       return builder;
>     },
>     async execute() {
>       return await mockFetchFn(queryParams);
>     }
>   };
>
>   return builder;
> }
>
> // Verification tests
> const mockFetch = async (params) => ({
>   results: [{ id: 1 }],
>   query: params
> });
>
> createUserQueryBuilder(mockFetch)
>   .where("role", "admin")
>   .limit(5)
>   .execute()
>   .then(res => {
>     console.assert(res.query.filters.role === "admin", "Test 1 Failed");
>     console.assert(res.query.limit === 5, "Test 2 Failed");
>   });
> ```
>
> #### Technical Explanation
>
> 1. **Fluent Interface Pattern**: Method chaining syntax returning `this` for readable, expressive API query construction.
> 2. **Query Object Accumulation**: Accumulates query options in memory before executing single network request on `.execute()`.
> 3. **SDK Developer Ergonomics**: Provides intuitive IDE auto-completion for building complex API filters.
> 
---

### Exercise 3: SDK Retry & Rate Limit Decorator

**Scenario:** An SDK wrapper decorates API request methods with automatic retries and exponential backoff on transient HTTP 429 errors.

**Requirements:**
1. Write wrapSdkWithRetry(sdkMethod, maxRetries).
2. Execute method.
3. Retry on 429/503 errors up to maxRetries.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function wrapSdkWithRetry(sdkMethod, maxRetries = 2, mockSleep) {
>   const sleep = mockSleep || ((ms) => new Promise(r => setTimeout(r, ms)));
>
>   return async function (...args) {
>     let attempt = 0;
>
>     while (attempt <= maxRetries) {
>       try {
>         return await sdkMethod(...args);
>       } catch (err) {
>         const isRetryable = err.status === 429 || err.status === 503;
>         if (!isRetryable || attempt === maxRetries) {
>           throw err;
>         }
>
>         const delay = Math.pow(2, attempt) * 50;
>         await sleep(delay);
>         attempt++;
>       }
>     }
>   };
> }
>
> // Verification tests
> let attempts = 0;
> const mockSleep = async () => {};
> const flakySdkCall = async () => {
>   attempts++;
>   if (attempts < 2) {
>     const e = new Error("Rate limited");
>     e.status = 429;
>     throw e;
>   }
>   return { ok: true };
> };
>
> const resilientCall = wrapSdkWithRetry(flakySdkCall, 2, mockSleep);
> resilientCall().then(res => {
>   console.assert(res.ok === true && attempts === 2, "Test 1 Failed: Retried 429 automatically");
> });
> ```
>
> #### Technical Explanation
>
> 1. **SDK Resilience Built-In**: Commercial SDKs (Stripe, AWS SDK) automatically handle rate limits and transient network retries internally.
> 2. **Retryable HTTP Error Codes**: 429 (Too Many Requests), 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout).
> 3. **Developer Peace of Mind**: Application code calling the SDK does not need custom retry loops for network blips.
---

## 6. Related Terms
- [Secrets & Environment Variables](../level_04/secrets_env.md) — The system configurations used to secure keys injected into SDK constructors.
- [Postman / Insomnia (API Clients)](api_clients.md) — External clients used to test API behaviors before installing SDK packages.
- [Swagger / OpenAPI Specification](openapi.md) — Related concept: Swagger / OpenAPI Specification.

---

## 7. Key Takeaways
- SDKs / Client Libraries wrap raw HTTP requests in language-specific classes and methods.
- They manage endpoint routing, authorization headers, data formatting, and error-handling.
- Modern SDKs improve developer experience by offering IDE autocomplete and type safety.
- OpenAPI specification schemas are used to generate SDK packages automatically in multiple languages.
- Never hardcode credentials during SDK instantiation; read keys via environment variables.
