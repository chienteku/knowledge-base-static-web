# 04-APIs: Zero to Hero

A progressive glossary of essential APIs, protocols, and network communication terms, ordered from physical connections to advanced tooling.

---

## Level 1: The Foundations of the Web

| # | Term | Description |
|---|------|-------------|
| 1 | **Client-Server Model** | The basic network model dividing tasks between service providers and requestors. |
| 2 | **IP Address & Port** | The numeric address + door number that locates a server on the network. |
| 3 | **DNS (Domain Name System)** | The internet's phonebook: turns `example.com` into an IP address. |
| 4 | **TCP/IP (high-level)** | The reliable delivery layer HTTP rides on ("guaranteed, in-order packets"). |
| 5 | **URL / URI (Uniform Resource Identifier)** | Strings specifying resource locations and identifiers on the web. |
| 6 | **HTTP / HTTPS** | Hypertext Transfer Protocol (Secure) for loading pages and assets. |
| 7 | **SSL/TLS & the Handshake** | How HTTPS encrypts a connection before any data is sent. |
| 8 | **Request & Response Lifecycle** | The round-trip flow from client request triggers to server responses. |
| 9 | **JSON (JavaScript Object Notation)** | Lightweight, standard text-based data interchange format. |
| 10 | **Latency & Bandwidth** | Why the network is "slow": round-trip time vs throughput. |

---

## Level 2: HTTP Anatomy

| # | Term | Description |
|---|------|-------------|
| 11 | **HTTP Methods (Verbs)** | Essential concepts and mechanics. |
| 12 | **Idempotent vs Safe Methods** | Which verbs are safe (GET) vs idempotent (PUT/DELETE) vs neither (POST). |
| 13 | **HTTP Status Codes** | Essential concepts and mechanics. |
| 14 | **HTTP Headers** | Essential concepts and mechanics. |
| 15 | **Content-Type & MIME Types** | How sender declares payload format (application/json, text/html, multipart/form-data). |
| 16 | **Content Negotiation (`Accept`)** | How client asks for a preferred response format. |
| 17 | **Request Body & Payloads** | Essential concepts and mechanics. |
| 18 | **Query Parameters & Path Variables** | Essential concepts and mechanics. |
| 19 | **URL Encoding (Percent-Encoding)** | Escaping unsafe characters in query strings and paths. |

---

## Level 3: RESTful APIs

| # | Term | Description |
|---|------|-------------|
| 20 | **API (Application Programming Interface)** | Essential concepts and mechanics. |
| 21 | **REST (Representational State Transfer)** | Essential concepts and mechanics. |
| 22 | **Endpoints & Resources** | Essential concepts and mechanics. |
| 23 | **Resource Naming & URI Design** | Conventions for clean REST endpoints (/users/42/posts). |
| 24 | **Statelessness** | Essential concepts and mechanics. |
| 25 | **CRUD Operations** | Essential concepts and mechanics. |
| 26 | **HATEOAS** | Responses that embed links to next actions (REST maturity). |
| 27 | **Richardson Maturity Model** | The 0–3 scale that grades how "RESTful" an API really is. |

---

## Level 4: Security & Authentication

| # | Term | Description |
|---|------|-------------|
| 28 | **API Keys** | Essential concepts and mechanics. |
| 29 | **Secrets & Environment Variables** | Keeping API keys out of source code (.env, secret managers). |
| 30 | **Basic & Bearer Authentication** | Essential concepts and mechanics. |
| 31 | **Session vs Token Authentication** | Stateful server sessions vs stateless tokens — the core auth trade-off. |
| 32 | **JWT (JSON Web Tokens)** | Essential concepts and mechanics. |
| 33 | **Access Token vs Refresh Token** | Short-lived access token + long-lived refresh token pattern. |
| 34 | **OAuth 2.0** | Essential concepts and mechanics. |
| 35 | **OAuth Scopes** | Fine-grained permissions granted to a token (read:user). |
| 36 | **Same-Origin Policy** | The default browser rule isolating one origin from another. |
| 37 | **CORS (Cross-Origin Resource Sharing)** | Essential concepts and mechanics. |
| 38 | **Preflight Request (OPTIONS)** | The automatic OPTIONS probe the browser sends before a cross-origin call. |
| 39 | **CSRF (Cross-Site Request Forgery)** | Attack that rides a logged-in user's cookies; why tokens/SameSite exist. |
| 40 | **XSS (Cross-Site Scripting)** | Injected script stealing tokens; why you never store JWT carelessly. |

---

## Level 5: Fetching Data (Client-Side)

| # | Term | Description |
|---|------|-------------|
| 41 | **XMLHttpRequest / AJAX** | The legacy request API fetch() replaced; explains fetch's "why". |
| 42 | **The `fetch()` API** | Essential concepts and mechanics. |
| 43 | **Promises (in the context of networks)** | Essential concepts and mechanics. |
| 44 | **`async` / `await`** | Essential concepts and mechanics. |
| 45 | **`Promise.all` / Parallel Requests** | Firing many requests concurrently and awaiting all. |
| 46 | **Error Handling (`try` / `catch`)** | Essential concepts and mechanics. |
| 47 | **The `Response` Object (`res.json()`, `res.ok`)** | Essential concepts and mechanics. |
| 48 | **Request Timeout** | Aborting a request that hangs too long. |
| 49 | **AbortController / Cancellation** | Canceling an in-flight fetch. |
| 50 | **Retry & Exponential Backoff** | Re-attempting failed calls with growing delays. |
| 51 | **FormData & Multipart Uploads** | Sending files/binary instead of JSON. |
| 52 | **CORS Errors in the Browser** | Reading and diagnosing a blocked cross-origin fetch. |

---

## Level 6: Advanced API Concepts

| # | Term | Description |
|---|------|-------------|
| 53 | **Pagination (Offset vs. Cursor)** | Essential concepts and mechanics. |
| 54 | **Bulk / Batch Requests** | Combining many operations into one call. |
| 55 | **Rate Limiting (429 Too Many Requests)** | Essential concepts and mechanics. |
| 56 | **Circuit Breaker** | Failing fast when a downstream API is down. |
| 57 | **Idempotency** | Essential concepts and mechanics. |
| 58 | **Idempotency Keys** | Client-supplied key so a retried POST doesn't double-charge. |
| 59 | **Caching (ETag, Cache-Control)** | Essential concepts and mechanics. |
| 60 | **Cache Invalidation** | Knowing when cached data is stale (the "hard problem"). |
| 61 | **Webhooks** | Essential concepts and mechanics. |

---

## Level 7: Data Formats & Serialization

| # | Term | Description |
|---|------|-------------|
| 62 | **Serialization & Deserialization** | Transforming data structures into storage/transit bytes. |
| 63 | **Deserialization / Parsing** | Turning a wire string back into a live object (the inverse of serialization). |
| 64 | **JSON Methods (parse / stringify)** | Built-in functions to convert JS objects to strings and back. |
| 65 | **XML** | eXtensible Markup Language: legacy markup data format. |
| 66 | **Character Encoding (UTF-8)** | How text becomes bytes, and why non-ASCII/emoji break naive payloads. |
| 67 | **Base64 Encoding** | Binary-to-text encoding format using 64 printable characters. |
| 68 | **Binary vs Text Formats** | When to send bytes (protobuf, files) instead of text (JSON, XML). |
| 69 | **Blob & ArrayBuffer** | Handling binary response bodies in the browser (res.blob(), res.arrayBuffer()). |
| 70 | **GraphQL (The REST Alternative)** | A query language and runtime for API data fetching. |
| 71 | **Over-fetching vs Under-fetching** | The REST pain points GraphQL was built to solve. |

---

## Level 8: Real-Time APIs

| # | Term | Description |
|---|------|-------------|
| 72 | **WebSockets** | Essential concepts and mechanics. |
| 73 | **WebSocket Handshake (Upgrade)** | The HTTP→WS Upgrade request that opens a socket. |
| 74 | **The WebSocket API (Client-side)** | Essential concepts and mechanics. |
| 75 | **Heartbeat / Ping-Pong** | Keep-alive frames that detect a dead connection. |
| 76 | **Reconnection & Backoff** | Re-establishing a dropped real-time connection. |
| 77 | **Server-Sent Events (SSE)** | Essential concepts and mechanics. |
| 78 | **Polling vs Long Polling** | Essential concepts and mechanics. |
| 79 | **Socket.io (Ecosystem tool)** | Essential concepts and mechanics. |
| 80 | **Pub/Sub & Channels** | The messaging pattern behind rooms/topics in real-time apps. |

---

## Level 9: Browser APIs (Storage & State)

| # | Term | Description |
|---|------|-------------|
| 81 | **`localStorage` & `sessionStorage`** | Essential concepts and mechanics. |
| 82 | **Storage Serialization** | Why Web Storage only holds strings (JSON.stringify round-trip). |
| 83 | **Cookies** | Essential concepts and mechanics. |
| 84 | **Cookie Attributes (HttpOnly, Secure, SameSite)** | The flags that make cookies safe for auth. |
| 85 | **IndexedDB** | Essential concepts and mechanics. |
| 86 | **Cache API** | Essential concepts and mechanics. |
| 87 | **Storage Limits & Eviction** | Quotas and when browsers purge cached/stored data. |
| 88 | **Service Workers** | Essential concepts and mechanics. |
| 89 | **Offline-First / PWA** | Designing apps that work without a network. |

---

## Level 10: Designing & Tooling

| # | Term | Description |
|---|------|-------------|
| 90 | **Postman / Insomnia (API Clients)** | Essential concepts and mechanics. |
| 91 | **DevTools Network Tab** | Inspecting real requests/responses in the browser. |
| 92 | **Swagger / OpenAPI Specification** | Essential concepts and mechanics. |
| 93 | **API Contract / Schema-First Design** | Agreeing the interface before writing code. |
| 94 | **SDK / Client Library** | Language wrappers that hide raw HTTP from consumers. |
| 95 | **API Versioning (v1, v2)** | Essential concepts and mechanics. |
| 96 | **Deprecation & Sunsetting** | Retiring old API versions gracefully. |
| 97 | **Mocking APIs** | Essential concepts and mechanics. |
| 98 | **Microservices vs Monolith** | Why many small APIs vs one big one. |
| 99 | **API Gateway** | The single entry point that routes/authenticates/rate-limits. |
| 100 | **Load Balancing** | Spreading traffic across servers (and why statelessness enables it). |
| 101 | **gRPC (Remote Procedure Call)** | Essential concepts and mechanics. |
| 102 | **Protocol Buffers (protobuf)** | The binary schema format that powers gRPC. |
| 103 | **SOAP & XML-RPC (legacy)** | The pre-REST protocols still alive in enterprise. |

---

> **Total: 103 terms** covering Web APIs and networking protocols.
