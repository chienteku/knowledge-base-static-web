# WebSocket vs HTTP Connection

> **Level 10 — SDKs, Deployment & Production**
> Comparing SurrealDB's two primary client network transport protocols: persistent, stateful WebSockets (`ws://`, `wss://`) vs stateless, request-response HTTP (`http://`, `https://`).

---

## 1. Prerequisites

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — URI schemes.
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Real-time subscription requirements.

---

## 2. Term Category
- **Protocol & Architecture**

---

## 3. Environment Context
- **Network Architecture & Deployment** (Selecting the right protocol based on client environment: browser apps, serverless functions, mobile apps, or microservices).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Choosing HTTP Protocol for Real-Time `LIVE SELECT` Applications

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

### Mistake 5: Using WebSockets for Simple Ephemeral Serverless Lambda Functions

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

## 6. Practice Exercises

### Exercise 1: Choose the Protocol
Select the best protocol (WebSocket or HTTP) for each scenario:
1. A real-time collaborative Figma-like whiteboard application.
2. An AWS Lambda webhook endpoint processing Stripe checkout payments.

> [!check]- Answer
> 1. Collaborative UI = WebSocket (`wss://`).
> 2. AWS Lambda Webhook = HTTP (`https://`).

---



### Exercise 2: Protocol Selection Decision Matrix

**Problem:** Match protocol with use case: 1. Real-time web browser apps (`WebSockets`), 2. Stateless serverless lambdas (`HTTP`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. WebSockets, 2. HTTP
> ```
> ```text
> 1. WebSockets, 2. HTTP
> ```
>
> **Explanation:** WebSockets provide real-time bi-directional streaming; HTTP provides stateless request-response execution.

---

### Exercise 3: WebSocket Scheme Options

**Problem:** List URI schemes for local un-encrypted and production encrypted WebSockets (`ws://`, `wss://`).

**Expected output:**
> [!check]- Answer
> ```text
> ws:// (local un-encrypted), wss:// (production TLS-encrypted)
> ```
> ```text
> ws:// (local un-encrypted), wss:// (production TLS-encrypted)
> ```
>
> **Explanation:** `wss://` encrypts WebSocket frames using TLS/SSL in production.

## 7. Related Terms

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](../level_01/connection_uri.md) — Connection strings.
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Live queries.
- [JavaScript / TypeScript SDK](js_sdk.md) — SDK client configuration.
- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Related concept: SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`).
- [SDK Error Handling & Retry Patterns](sdk_error_handling.md) — Related concept: SDK Error Handling & Retry Patterns.

---

## 8. Key Takeaways
- Use **WebSocket (`wss://`)** for interactive apps requiring live queries (`LIVE SELECT`) and low latency.
- Use **HTTP (`https://`)** for serverless functions, edge microservices, and one-off batch scripts.
- WebSockets preserve auth state; HTTP requires sending authentication headers on each request.
