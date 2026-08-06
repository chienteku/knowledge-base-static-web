# WebSocket vs HTTP Connection

> **Level 10 — SDKs, Deployment & Production**
> Comparing SurrealDB's two primary client network transport protocols: persistent, stateful WebSockets (`ws://`, `wss://`) vs stateless, request-response HTTP (`http://`, `https://`).

---

## 1. Prerequisites

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — URI schemes.
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Real-time subscription requirements.

---

## 2. Term Category


**Integration / Ecosystem (WebSocket vs HTTP connection protocol comparison)**: - **Protocol & Architecture**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
SurrealDB supports two client connection protocols:
1. **WebSocket (`ws://` / `wss://`)**: A persistent, full-duplex TCP connection. Once opened, the socket stays active. It supports **stateful sessions** (authentication state and `$session` parameters persist), **live query push subscriptions** (`LIVE SELECT`), and low-latency binary RPC protocols.
2. **HTTP (`http://` / `https://`)**: A stateless request-response protocol. Each request requires sending `Authorization` and `surreal-ns`/`surreal-db` headers. It does not support `LIVE SELECT` push events, but it is **serverless-friendly** (AWS Lambda, Vercel Edge Functions, Cloudflare Workers) where long-lived TCP sockets cannot be maintained.

### (2) Comparison Matrix

| Feature | WebSocket (`wss://`) | HTTP (`https://`) |
| :--- | :--- | :--- |
| **Connection Style** | Persistent, full-duplex | Stateless, request-response |
| **Live Queries (`LIVE SELECT`)** | ✅ Full Support | ❌ Not Supported |
| **Authentication Overhead** | Auth once on connect | Auth header per request |
| **Serverless Compatibility** | Low (socket limits) | ✅ Excellent (Edge/Lambda) |
| **Primary Use Cases** | Interactive Web/Mobile UIs, Real-time dashboards, WebSockets | Serverless API routes, CI/CD scripts, Webhooks |

### (3) Reality Metaphor
Think of communication styles:
- **WebSocket**: A live phone call — you dial once (`.connect()`), keep the line open, and both parties can speak back and forth at any second.
- **HTTP**: Sending postal letters — each letter is individually addressed, stamped with credentials, mailed, and receives a separate reply letter back.

### (4) Code Examples

#### Short Snippet
```typescript
// 1. WebSocket Connection (For Interactive Client UIs & Live Queries)
await db.connect('wss://db.example.com/rpc');

// 2. HTTP Connection (For Serverless & Stateless Edge Functions)
await db.connect('https://db.example.com');
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using WebSockets in Short-Lived Serverless Functions (Vercel / AWS Lambda)

**The mistake:** Opening WebSocket connections (`wss://`) inside ephemeral serverless Lambda functions that execute for 50ms and terminate.

**Why it's wrong:** Opening WebSocket handshakes adds latency to short-lived serverless functions and exhausts server socket connection pools. HTTP connections are designed for serverless environments.

*Incorrect:*
```typescript
// Inside AWS Lambda / Vercel Edge Function
export async function handler() {
    const db = new Surreal();
    await db.connect('wss://db.example.com/rpc'); // Slow socket handshake per invocation!
    return await db.select('user');
}
```

*Fix:*
```typescript
// Use HTTP protocol in serverless/edge functions
export async function handler() {
    const db = new Surreal();
    await db.connect('https://db.example.com'); // Stateless HTTP query!
    await db.use({ namespace: 'app', database: 'prod' });
    return await db.select('user');
}
```

---



### Mistake 2: Choosing HTTP Protocol for Real-Time `LIVE SELECT` Applications

**The mistake:** Connecting SDK over HTTP protocol when building real-time messaging apps.

**Why it's wrong:** HTTP request-response is stateless and cannot receive real-time server push events. Use WebSockets (`ws://` / `wss://`).

*Incorrect:*
```surrealql
await db.connect("http://127.0.0.1:8000/rpc"); // ❌ Live queries fail!
```

*Fix:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc"); // Real-time WebSockets
```

### Mistake 3: Using WebSockets for Simple Ephemeral Serverless Lambda Functions

**The mistake:** Establishing persistent WebSocket connections in short-lived serverless AWS Lambda execution environments.

**Why it's wrong:** Serverless functions spin up and shut down in milliseconds. Opening persistent WebSockets adds unnecessary handshake latency. Use HTTP REST/RPC endpoints for serverless functions.

*Incorrect:*
```surrealql
// Inside AWS Lambda handler:
const db = new Surreal(); await db.connect("ws://..."); // Handshake overhead per execution!
```

*Fix:*
```surrealql
await db.connect("http://..."); // Fast stateless HTTP request for serverless
```





## 5. Practice Exercises

### Exercise 1: Protocol Feature Comparison Matrix

**Scenario:**
Compare WebSocket (`wss://`) vs HTTP (`https://`) connection endpoints in SurrealDB across key database capabilities.

**Requirements:**
1. Compare real-time live queries, session state persistence, and request latency.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Feature Comparison Matrix:
> +-----------------------+-----------------------+-----------------------+
> | Feature               | WebSocket (wss://)    | HTTP REST (https://)  |
> +-----------------------+-----------------------+-----------------------+
> | Connection Model      | Persistent Binary     | Stateless Request/Resp|
> | Real-Time Live Queries| Supported (LIVE)      | Not Supported         |
> | Session Auth Token    | Stored in WS Channel  | Required per Request  |
> | Best For              | Interactive Web Apps  | Serverless REST APIs  |
> +-----------------------+-----------------------+-----------------------+
> ```
>
> #### Technical Explanation
>
> 1. WebSockets maintain persistent bi-directional binary channels required for `LIVE SELECT` real-time subscriptions.
> 2. HTTP endpoints process stateless REST requests, ideal for serverless functions (AWS Lambda, Cloudflare Workers).
> 3. WebSocket connections eliminate HTTP connection handshake overhead per query.
> 
---

### Exercise 2: Executing HTTP REST API Queries

**Scenario:**
Execute a SurrealQL query via HTTP POST request targeting SurrealDB's `/sql` REST endpoint using `curl`.

**Requirements:**
1. Formulate `curl` request passing authentication headers and SurrealQL query string.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> curl -X POST http://localhost:8000/sql >   -H "NS: main" >   -H "DB: app" >   -u "root:root" >   -d "SELECT * FROM user WHERE active = true;"
> ```
>
> #### Technical Explanation
>
> 1. `/sql` REST endpoint accepts raw SurrealQL query scripts via HTTP POST.
> 2. Headers (`NS`, `DB`) specify active target namespace and database scopes.
> 3. Enables HTTP client integrations without requiring SDK libraries.
> 
---

### Exercise 3: Selecting Protocols for Application Use Cases

**Scenario:**
Select WebSockets vs HTTP REST for a real-time chat application vs a stateless webhook listener endpoint.

**Requirements:**
1. Recommend protocol for Real-Time Chat App.
2. Recommend protocol for Stateless Webhook Receiver.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Real-Time Chat App: WebSockets (wss://) for instant bi-directional push notifications.
> Stateless Webhook Receiver: HTTP REST (https://) for single-request stateless event ingestion.
> ```
>
> #### Technical Explanation
>
> 1. Real-time collaborative web apps require WebSockets for server push notifications.
> 2. Stateless serverless lambdas require HTTP REST to avoid holding open socket handles.
> 3. SurrealDB supports both protocols concurrently over the same server port.
> 
---





## 6. Related Terms

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Connection strings.
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Live queries.
- [JavaScript / TypeScript SDK](js_sdk.md) — SDK client configuration.
- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Related concept: SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`).
- [SDK Error Handling & Retry Patterns](sdk_error_handling.md) — Related concept: SDK Error Handling & Retry Patterns.

---

## 7. Key Takeaways
- Use **WebSocket (`wss://`)** for interactive apps requiring live queries (`LIVE SELECT`) and low latency.
- Use **HTTP (`https://`)** for serverless functions, edge microservices, and one-off batch scripts.
- WebSockets preserve auth state; HTTP requires sending authentication headers on each request.
