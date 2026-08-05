# SDK / Client Library

> **Level 10 — Designing & Tooling**
> Language wrappers that hide raw HTTP from consumers.

---

## 1. Prerequisites
- [The fetch() API](../level_05/fetch.md) — The core networking protocol engine.
- [Swagger / OpenAPI Specification](openapi.md) — The schema descriptions used to generate client code.

---

## 2. Term Category
- **Tooling**

---

## 3. Environment Context
- **Universal**: Implemented across various client programming languages (TypeScript, Python, Go, Swift, etc.).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Custom SDK Class

**Problem:** Complete this simple custom SDK wrapper class designed to fetch profile data from a mock service:

```javascript
class UserServiceSDK {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async getProfile(userId) {
    const res = await fetch(`${this.baseUrl}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    if (!res.ok) throw new Error("Profile query failed");
    return res.json();
  }
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: SDK vs API Distinction

**Problem:** Distinguish between an API and an SDK (Software Development Kit).

**Expected output:**
> [!check]- Answer
> ```text
> API is the raw network interface protocol contract (HTTP/gRPC); SDK is a language-specific code library wrapping the API with helper methods, authentication, and error handling.
> ```
> ```text
> API -> The raw network interface protocol (REST/HTTP endpoints).
> SDK -> Language-specific client library wrapping the API with native code methods.
> ```
> - **Explanation:** SDKs provide developer-friendly language wrappers over raw network APIs.
---

### Exercise 3: Automated SDK Generation

**Problem:** Which open-source tool generates client SDK libraries in 40+ programming languages from an OpenAPI spec?

**Expected output:**
> [!check]- Answer
> ```text
> OpenAPI Generator (or Swagger Codegen)
> ```
> ```bash
> npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./sdk
> ```
> - **Explanation:** OpenAPI Generator automates multi-language SDK code generation.
---

## 7. Related Terms
- [Secrets & Environment Variables](../level_04/secrets_env.md) — The system configurations used to secure keys injected into SDK constructors.
- [Postman / Insomnia (API Clients)](api_clients.md) — External clients used to test API behaviors before installing SDK packages.
- [Swagger / OpenAPI Specification](openapi.md) — Related concept: Swagger / OpenAPI Specification.

---

## 8. Key Takeaways
- SDKs / Client Libraries wrap raw HTTP requests in language-specific classes and methods.
- They manage endpoint routing, authorization headers, data formatting, and error-handling.
- Modern SDKs improve developer experience by offering IDE autocomplete and type safety.
- OpenAPI specification schemas are used to generate SDK packages automatically in multiple languages.
- Never hardcode credentials during SDK instantiation; read keys via environment variables.
