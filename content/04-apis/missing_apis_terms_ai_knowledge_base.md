# Missing APIs Terms — AI Knowledge Base (Gap Analysis)

> **Purpose:** This document is an input for an AI generation pass. It lists the terms
> that are **used in the existing `04-apis/` prose but never defined as their own term**,
> plus the relationships each missing term has to other missing terms and to existing terms.
> Every row is pre-shaped to drop directly into the curriculum's 8-section term template
> (`Prerequisites → Category → Environment → Explanation → Common Mistakes → Exercises → Related Terms → Key Takeaways`).
>
> **Scope reviewed:** 50 existing terms across `terms/level_01` … `terms/level_10`,
> plus `_meta/apis_terms_zero_to_hero.md` and `_meta/technology_context.md`.
>
> **Method:** (1) Verified cross-link integrity — **no broken `../level_XX/*.md` links exist**,
> so "missing" here means *conceptual* gaps (a concept appears in prose/code but has no term file),
> not dangling references. (2) `grep`-counted how many existing files lean on each undefined
> concept, to prioritize by blast radius.

---

## 0. Two structural findings the generating AI must know first

1. **The Level 7 index no longer matches the files — RESOLVED by re-titling Level 7.**
   `_meta/apis_terms_zero_to_hero.md` advertises **Level 7 = "GraphQL Fundamentals"**
   (GraphQL, Schema & Types, Queries, Mutations, Resolvers), but the actual `terms/level_07/`
   files are a *data-formats* set: `serialization.md`, `json_methods.md`, `xml.md`,
   `base64.md`, `graphql.md`. **Decision (adopted here): re-title Level 7 to
   "Data Formats & Serialization"** so the index matches the files that already exist,
   and treat GraphQL as a **single introductory term** inside that level rather than a
   five-term sub-curriculum. The four GraphQL sub-terms (Schema & Types, Queries, Mutations,
   Resolvers) are therefore **descoped** — no longer counted as required gaps. They remain an
   *optional* future deep-dive, listed at the end of Section 2 for reference only.

   **Exact index rewrite the generating AI must apply** to `_meta/apis_terms_zero_to_hero.md`:
   ```
   ## Level 7: Data Formats & Serialization
   31. Serialization & Deserialization
   32. JSON Methods (parse / stringify)
   33. XML
   34. Base64 Encoding
   35. GraphQL (The REST Alternative)
   ```
   This maps 1:1 onto the five existing files and removes the contradiction.

2. **No `missing_terms.md` tracker exists in `_meta/`** (unlike `03-javascript`).
   When these terms are generated, create `_meta/missing_terms.md` to record them, mirroring
   the JavaScript knowledge base's tracker convention.

---

## 1. Critical gaps — concepts used everywhere but never defined

These block comprehension the most because existing terms *depend* on them in prose/code.

| Missing Term | Why it blocks learning | Evidence (files referencing it) |
|---|---|---|
| **Content-Type / MIME Types** | `application/json`, `Content-Type` headers appear constantly, but the header's meaning is never taught | `http_headers`, `request_body`, `fetch`, `response_object`, `sse` (5) |
| **Same-Origin Policy** | The browser rule that CORS exists to relax — CORS can't be understood without it | `cors` |
| **Preflight Request (OPTIONS)** | The `OPTIONS` handshake CORS triggers; mentioned but undefined | `cors`, `http_methods` (2) |
| **XMLHttpRequest / AJAX** | `fetch.md` defines itself as "the replacement for XHR" but XHR is never explained | `fetch` |
| **Access Token vs Refresh Token** | JWT/OAuth flows hinge on this pair; only "access token" is mentioned in passing | `jwt`, `oauth` |
| **Network Reliability: Timeout / Retry / Backoff** | `technology_context.md` *mandates* handling these, yet no term covers them | `error_handling`, `rate_limiting`, `idempotency` |

---

## 2. Missing terms by level

Each row: **Proposed Term | description | Category | Prerequisites | Related**.
Categories follow the ones already used in this KB (Networking Protocol, Browser API / Networking,
Data Format, Security, Architecture / Design, Real-Time, Tooling). 🆕 = brand-new concept.

### Level 1 — Foundations of the Web (networking substrate under HTTP)
> Per `technology_context.md`, keep these **high-level mental models**, not academic TCP/IP theory.

| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **IP Address & Port** [DONE] | The numeric address + door number that locates a server on the network | Networking Protocol | Client-Server Model | HTTP/HTTPS, DNS, URL/URI |
| **DNS (Domain Name System)** [DONE] | The internet's phonebook: turns `example.com` into an IP address | Networking Protocol | IP Address & Port | URL/URI, HTTP/HTTPS |
| **TCP/IP (high-level)** [DONE] | The reliable delivery layer HTTP rides on ("guaranteed, in-order packets") | Networking Protocol | IP Address & Port | HTTP/HTTPS, WebSockets |
| **SSL/TLS & the Handshake** [DONE] | How HTTPS encrypts a connection before any data is sent | Security | HTTP/HTTPS | Certificate, HTTPS |
| **Latency & Bandwidth** [DONE] | Why the network is "slow": round-trip time vs throughput | Networking Protocol | Client-Server Model | Caching, Pagination |

### Level 2 — HTTP Anatomy
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Content-Type & MIME Types** [DONE] | How sender declares payload format (`application/json`, `text/html`, `multipart/form-data`) | Data Format | HTTP Headers | Request Body, Serialization, JSON |
| **Content Negotiation (`Accept`)** [DONE] | How client asks for a preferred response format | Data Format | HTTP Headers, Content-Type & MIME Types | Response Object, Versioning |
| **URL Encoding (Percent-Encoding)** [DONE] | Escaping unsafe characters in query strings and paths | Data Format | Query Parameters, URL/URI | Request Body, Serialization |
| **Idempotent vs Safe Methods** [DONE] | Which verbs are safe (GET) vs idempotent (PUT/DELETE) vs neither (POST) | Networking Protocol | HTTP Methods | Idempotency, CRUD |

### Level 3 — RESTful APIs
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Resource Naming & URI Design** [DONE] | Conventions for clean REST endpoints (`/users/42/posts`) | Architecture / Design | Endpoints & Resources, REST | CRUD, Versioning |
| **HATEOAS** [DONE] | Responses that embed links to next actions (REST maturity) | Architecture / Design | REST, Statelessness | Endpoints & Resources |
| **Richardson Maturity Model** [DONE] | The 0–3 scale that grades how "RESTful" an API really is | Architecture / Design | REST, HATEOAS | Endpoints & Resources |

### Level 4 — Security & Authentication
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Same-Origin Policy** [DONE] | The default browser rule isolating one origin from another | Security | Client-Server Model, URL/URI | CORS, Preflight Request, CSRF |
| **Preflight Request (OPTIONS)** [DONE] | The automatic `OPTIONS` probe the browser sends before a cross-origin call | Security | CORS, HTTP Methods | Same-Origin Policy, HTTP Headers |
| **Access Token vs Refresh Token** [DONE] | Short-lived access token + long-lived refresh token pattern | Security | JWT, OAuth 2.0 | Bearer Authentication, Session |
| **OAuth Scopes** [DONE] | Fine-grained permissions granted to a token (`read:user`) | Security | OAuth 2.0 | JWT, API Keys |
| **CSRF (Cross-Site Request Forgery)** [DONE] | Attack that rides a logged-in user's cookies; why tokens/SameSite exist | Security | Cookies, Session | CORS, Same-Origin Policy |
| **XSS (Cross-Site Scripting)** [DONE] | Injected script stealing tokens; why you never store JWT carelessly | Security | JWT, Cookies | Web Storage, CSRF |
| **Session vs Token Authentication** [DONE] | Stateful server sessions vs stateless tokens — the core auth trade-off | Security | Statelessness, JWT, Cookies | Access/Refresh Token |
| **Secrets & Environment Variables** [DONE] | Keeping API keys out of source code (`.env`, secret managers) | Tooling | API Keys | Basic & Bearer Auth |

### Level 5 — Fetching Data (Client-Side)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **XMLHttpRequest / AJAX** [DONE] | The legacy request API `fetch()` replaced; explains fetch's "why" | Browser API / Networking | Request & Response Lifecycle | fetch, Promises |
| **Request Timeout** [DONE] | Aborting a request that hangs too long | Browser API / Networking | fetch, Promises | AbortController, Retry & Backoff |
| **AbortController / Cancellation** [DONE] | Canceling an in-flight `fetch` | Browser API / Networking | fetch, Promises | Request Timeout |
| **Retry & Exponential Backoff** [DONE] | Re-attempting failed calls with growing delays | Browser API / Networking | Error Handling, Rate Limiting | Idempotency, Request Timeout |
| **`Promise.all` / Parallel Requests** [DONE] | Firing many requests concurrently and awaiting all | Browser API / Networking | Promises, async/await | fetch |
| **FormData & Multipart Uploads** [DONE] | Sending files/binary instead of JSON | Data Format | Request Body, fetch | Content-Type & MIME Types |
| **CORS Errors in the Browser** [DONE] | Reading and diagnosing a blocked cross-origin `fetch` | Browser API / Networking | CORS, fetch | Preflight Request, Same-Origin Policy |

### Level 6 — Advanced API Concepts
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Idempotency Keys** [DONE] | Client-supplied key so a retried POST doesn't double-charge | Architecture / Design | Idempotency, Retry & Backoff | Rate Limiting |
| **Cache Invalidation** [DONE] | Knowing when cached data is stale (the "hard problem") | Architecture / Design | Caching | ETag, Webhooks |
| **Circuit Breaker** [DONE] | Failing fast when a downstream API is down | Architecture / Design | Retry & Backoff, Error Handling | Rate Limiting |
| **Bulk / Batch Requests** [DONE] | Combining many operations into one call | Architecture / Design | HTTP Methods, Pagination | Rate Limiting |

### Level 7 — Data Formats & Serialization *(re-titled to match existing files)*
> Existing files: `serialization.md`, `json_methods.md`, `xml.md`, `base64.md`, `graphql.md`.
> The gaps below deepen the *data-format* theme this level actually teaches.

| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Deserialization / Parsing** [DONE] | Turning a wire string back into a live object (the inverse of serialization) | Data Format | Serialization, JSON Methods | JSON, XML |
| **Character Encoding (UTF-8)** [DONE] | How text becomes bytes, and why non-ASCII/emoji break naive payloads | Data Format | Serialization | Base64, JSON |
| **Binary vs Text Formats** [DONE] | When to send bytes (protobuf, files) instead of text (JSON, XML) | Data Format | Serialization, Base64 | Protocol Buffers, gRPC |
| **Blob & ArrayBuffer** [DONE] | Handling binary response bodies in the browser (`res.blob()`, `res.arrayBuffer()`) | Browser API / Networking | Response Object, fetch | FormData & Multipart Uploads, Binary vs Text Formats |
| **Over-fetching vs Under-fetching** [DONE] | The REST pain points GraphQL was built to solve | Architecture / Design | REST, GraphQL | Pagination |

### Level 8 — Real-Time APIs
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **WebSocket Handshake (Upgrade)** [DONE] | The HTTP→WS `Upgrade` request that opens a socket | Real-Time | WebSockets, HTTP Headers | TCP/IP, WebSocket API |
| **Heartbeat / Ping-Pong** [DONE] | Keep-alive frames that detect a dead connection | Real-Time | WebSockets | Reconnection |
| **Reconnection & Backoff** [DONE] | Re-establishing a dropped real-time connection | Real-Time | WebSockets, Retry & Backoff | Heartbeat |
| **Pub/Sub & Channels** [DONE] | The messaging pattern behind rooms/topics in real-time apps | Real-Time | WebSockets, Socket.io | Webhooks |

### Level 9 — Browser APIs (Storage & State)
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **Cookie Attributes (`HttpOnly`, `Secure`, `SameSite`)** [DONE] | The flags that make cookies safe for auth | Security | Cookies | CSRF, Session vs Token Auth |
| **Storage Limits & Eviction** [DONE] | Quotas and when browsers purge cached/stored data | Browser API / Networking | Web Storage, IndexedDB, Cache API | Service Workers |
| **Offline-First / PWA** [DONE] | Designing apps that work without a network | Architecture / Design | Service Workers, Cache API | IndexedDB |
| **Storage Serialization** [DONE] | Why Web Storage only holds strings (`JSON.stringify` round-trip) | Data Format | Web Storage, Serialization | JSON, JSON Methods |

### Level 10 — Designing & Tooling
| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| **API Contract / Schema-First Design** [DONE] | Agreeing the interface before writing code | Architecture / Design | OpenAPI, REST | Mocking, Versioning |
| **Deprecation & Sunsetting** [DONE] | Retiring old API versions gracefully | Architecture / Design | Versioning | API Contract |
| **API Gateway** [DONE] | The single entry point that routes/authenticates/rate-limits | Architecture / Design | REST, Rate Limiting | Microservices, Load Balancer |
| **Microservices vs Monolith** [DONE] | Why many small APIs vs one big one | Architecture / Design | API, REST | API Gateway |
| **Load Balancing** [DONE] | Spreading traffic across servers (and why statelessness enables it) | Architecture / Design | Statelessness | API Gateway |
| **SOAP & XML-RPC (legacy)** [DONE] | The pre-REST protocols still alive in enterprise | Architecture / Design | XML, HTTP Methods | REST, gRPC |
| **Protocol Buffers (protobuf)** [DONE] | The binary schema format that powers gRPC | Data Format | Serialization, gRPC | Base64, JSON |
| **SDK / Client Library** [DONE] | Language wrappers that hide raw HTTP from consumers | Tooling | API, fetch | OpenAPI, API Clients |
| **DevTools Network Tab** [DONE] | Inspecting real requests/responses in the browser | Tooling | Request & Response Lifecycle, HTTP Headers | API Clients, Status Codes |

### Optional (descoped) — GraphQL sub-curriculum
> **Not required gaps.** Because Level 7 is now "Data Formats & Serialization" (Section 0),
> GraphQL is a single term and these are an *optional* future deep-dive only. Generate them
> only if the curriculum owner later decides to expand GraphQL into its own dedicated level.

| Proposed Term | description | Category | Prerequisites | Related |
|---|---|---|---|---|
| ⏸️ GraphQL Schema & Types | The typed contract defining what a GraphQL API exposes | Data Format | GraphQL, JSON | Queries, Mutations, Resolvers |
| ⏸️ GraphQL Queries | Client-authored read that asks for exactly the fields it needs | Data Format | GraphQL, Schema & Types | Mutations, Resolvers |
| ⏸️ GraphQL Mutations | The write operation (create/update/delete) in GraphQL | Data Format | GraphQL, Schema & Types | Queries, CRUD |
| ⏸️ GraphQL Resolvers | Server-side functions that fetch the data for each field | Architecture / Design | GraphQL, Schema & Types | Queries, Mutations |

---

## 3. Relationship map (dependency graph)

Notation: `A → B` means **"A requires / builds on B"**. Bold = existing term; plain = missing.

### Cluster 1 — Networking substrate (new foundation *under* Level 1)
```
HTTPS ───────→ SSL/TLS & Handshake ──→ Certificate
**HTTP/HTTPS** → TCP/IP (high-level) → IP Address & Port → DNS
**URL/URI** ──→ DNS
**WebSockets** → TCP/IP (high-level)
```

### Cluster 2 — Data format & serialization (glue across the whole KB)
```
Content-Type & MIME Types → **HTTP Headers**
   ├─→ **Request Body**        (declares payload format)
   ├─→ **Response Object**     (reads it back)
   └─→ FormData & Multipart Uploads
Content Negotiation (Accept) → Content-Type & MIME Types
URL Encoding → **Query Parameters**
**Serialization** → **JSON** / **XML** / **Base64** / Protocol Buffers
Storage Serialization → **Web Storage** + **Serialization**
```

### Cluster 3 — CORS & browser security (currently a floating island)
```
**CORS** → Same-Origin Policy → Client-Server Model
**CORS** → Preflight Request (OPTIONS) → **HTTP Methods**
CORS Errors in the Browser → **CORS** + **fetch**
CSRF → **Cookies** + Session vs Token Auth
XSS → **JWT** + **Web Storage**
```

### Cluster 4 — Auth token lifecycle
```
**OAuth 2.0** → OAuth Scopes
**JWT** → Access Token vs Refresh Token → Session vs Token Auth
Session vs Token Auth → **Statelessness**
Cookie Attributes (HttpOnly/Secure/SameSite) → **Cookies** → CSRF
Secrets & Environment Variables → **API Keys**
```

### Cluster 5 — Network reliability (mandated by technology_context.md)
```
Request Timeout → **fetch**
AbortController → **fetch**
Retry & Exponential Backoff → **Error Handling** + **Rate Limiting**
   └─→ Idempotency Keys → **Idempotency**
Circuit Breaker → Retry & Exponential Backoff
Promise.all / Parallel Requests → **Promises** + **async/await**
```

### Cluster 6 — Data formats & serialization (re-titled Level 7)
```
**Serialization** → Deserialization / Parsing
**Serialization** → Character Encoding (UTF-8) → Base64
Binary vs Text Formats → **Base64** / Protocol Buffers
Blob & ArrayBuffer → **Response Object** + **fetch**
Over-fetching vs Under-fetching → **REST** (the problem **GraphQL** solves)
   (optional deep-dive) **GraphQL** → Schema & Types → Queries / Mutations → Resolvers
```

### Cluster 7 — Real-time deepening
```
WebSocket Handshake (Upgrade) → **WebSockets** + **HTTP Headers**
Heartbeat / Ping-Pong → **WebSockets**
Reconnection & Backoff → **WebSockets** + Retry & Exponential Backoff
Pub/Sub & Channels → **Socket.io**
```

### Cluster 8 — Architecture & tooling (Level 10 breadth)
```
API Gateway → **Rate Limiting** + Load Balancing
Microservices vs Monolith → API Gateway
Load Balancing → **Statelessness**
API Contract / Schema-First → **OpenAPI** → Mocking
Deprecation & Sunsetting → **Versioning**
Protocol Buffers → **gRPC** + **Serialization**
SDK / Client Library → **API** + **fetch**
SOAP & XML-RPC → **XML**
```

---

## 4. Suggested generation priority

| Tier | Rationale | Terms |
|---|---|---|
| **P0 — Pervasive, blocks existing prose** | Referenced across many files but undefined | Content-Type & MIME Types · Same-Origin Policy · Preflight Request · XMLHttpRequest/AJAX · Access vs Refresh Token |
| **P1 — Re-title Level 7 + close data-format gaps** | Make the index match the files (Section 0), then deepen the data-format theme | *Re-title index Level 7 → "Data Formats & Serialization"* · Deserialization / Parsing · Character Encoding (UTF-8) · Binary vs Text Formats · Blob & ArrayBuffer · Over/Under-fetching |
| **P2 — Reliability (mandated by tech context)** | "Network is unreliable" principle | Request Timeout · AbortController · Retry & Backoff · Idempotency Keys · Promise.all |
| **P3 — Foundations & security depth** | Rounds out mental models | IP/Port · DNS · TCP/IP · SSL/TLS Handshake · CSRF · XSS · Session vs Token · Cookie Attributes · OAuth Scopes · Secrets/Env |
| **P4 — Breadth & ecosystem literacy** | Nice-to-have for "hero" level | API Gateway · Microservices · Load Balancing · SOAP · Protocol Buffers · SDK · DevTools Network Tab · HATEOAS · Richardson Maturity · Real-time deepening (Handshake/Heartbeat/Reconnection/PubSub) · PWA/Offline-first · Storage limits |

---

## 5. Notes for the generating AI

1. **Follow the existing 8-section template exactly** (see `terms/level_05/fetch.md` and
   `terms/level_01/http_https.md`): Prerequisites → Term Category → Environment Context →
   Explanation (Design Motivation / Reality Metaphor / Anatomy or Code Examples) →
   Common Mistakes & Pitfalls → Practice Exercises → Related Terms → Key Takeaways.
2. **Obey `_meta/technology_context.md`**: Senior Full-Stack Architect persona; pragmatic,
   security-conscious tone; `async`/`await` + `fetch` over `XMLHttpRequest`; keep networking
   internals (TCP/IP, handshakes) at a **high-level mental-model** depth, not academic theory.
3. **Wire cross-links** using the relative format `../level_XX/<file>.md`, matching the
   Prerequisites/Related columns in Section 2. Every new term must be reachable from at least
   one existing term (add it to that term's Related section too).
4. **Re-title Level 7 first (decision already made — Section 0).** Replace the Level 7 block in
   `_meta/apis_terms_zero_to_hero.md` with the "Data Formats & Serialization" heading and the
   five entries listed in Section 0, so the index matches the existing files. GraphQL stays a
   single term; do **not** generate the four GraphQL sub-terms (they are descoped/optional).
5. **Renumber consistently.** Existing terms use `# Term #N:` headers. Decide whether new terms
   append after #50 or adopt level-relative numbering, and apply it uniformly.
6. **Create `_meta/missing_terms.md`** (it does not yet exist here) and record each generated
   term, mirroring the tracker convention in `knowledge-base/03-javascript/_meta/missing_terms.md`.
7. **Environment tags** must be one of the values already in use: *Universal Web Standard*,
   *Client-Side (Browser)*, *Node.js / Server-Side*, or *Both* — pick per the term's reality
   (e.g. Same-Origin Policy = Browser; Load Balancing = Server; Content-Type = Universal).
