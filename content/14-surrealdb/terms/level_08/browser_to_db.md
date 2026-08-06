# Direct Browser-to-Database Architecture

> **Level 8 — Authentication, Permissions & Security**
> An architectural pattern where web and mobile clients connect directly to SurrealDB over WebSocket, using Record Access and row-level permissions to eliminate middle-tier CRUD API backend servers.

---

## 1. Prerequisites

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — End-user record authentication.
- [`PERMISSIONS` Clause (Table & Field Level)](permissions_clause.md) — Table and field level security.

---

## 2. Term Category


**Integration / Ecosystem (direct browser-to-database connection pattern)**: - **Architecture & System Design**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional 3-tier web architecture:
`Browser / Mobile App ──HTTP──> Express/FastAPI API Server ──SQL/BSON──> PostgreSQL / MongoDB`

The middle-tier API server spends 80% of its codebase executing routine CRUD boilerplate: accepting JSON, validating JWTs, checking user ownership, running `SELECT`/`INSERT`/`UPDATE` queries, and returning JSON.

SurrealDB enables a **2-tier Direct Browser-to-Database Architecture**:
`Browser / Mobile App ──WebSocket (WSS)──> SurrealDB Engine`

Because SurrealDB includes built-in Record Access (`DEFINE ACCESS ... TYPE RECORD`), Row-Level Security (`PERMISSIONS`), real-time push subscriptions (`LIVE SELECT`), and field validation (`ASSERT`), web browsers can connect directly to SurrealDB. The database engine authenticates the client, enforces row-level permissions, and handles real-time data sync without requiring a custom Express/Node.js backend for CRUD operations.

### (2) Reality Metaphor
Think of shopping at a modern automated supermarket:
- **Traditional 3-Tier Architecture**: Standing in line to hand your shopping list to a clerk behind a desk, who walks into the warehouse, picks items off the shelf, checks your ID, and brings the bag back out to you.
- **Direct Browser-to-Database Architecture**: Walking directly onto the store floor with a smart shopping cart. Automated sensors (Row-Level Security `PERMISSIONS`) ensure you can only access items matching your membership clearance (`$auth`), while self-checkout handles payment directly.

### (3) Code Examples

#### Short Snippet
```javascript
// Browser Client Code (React/Vue/Svelte)
import Surreal from 'surrealdb';

const db = new Surreal();
// Direct WebSocket connection from Browser to SurrealDB
await db.connect('wss://db.example.com/rpc');
await db.signin({ access: 'app_user', email: 'user@example.com', pass: 'secret' });

// Browser queries SurrealDB directly; row-level PERMISSIONS enforce security
const myPosts = await db.select('post');
```

#### Fuller Example Architecture
```surrealql
-- 1. Database Schema configured for Direct Browser Access
DEFINE TABLE post SCHEMAFULL
    PERMISSIONS
        FOR select WHERE published = true OR author = $auth.id
        FOR create WHERE author = $auth.id
        FOR update, delete WHERE author = $auth.id;

DEFINE FIELD title ON post TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD content ON post TYPE string;
DEFINE FIELD author ON post TYPE record<user> DEFAULT $auth.id READONLY;
DEFINE FIELD published ON post TYPE bool DEFAULT false;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Direct Browser Architecture to Replace Complex Server Logic

**The mistake:** Assuming Direct Browser Architecture means you will *never* need backend server code for third-party integrations (Stripe, Twilio, OpenAI API keys).

**Why it's wrong:** Public browsers can never hold secret API keys (like Stripe Secret Keys or SendGrid API Keys). Complex multi-step business logic or payment processing still belongs in a backend service, serverless function, or custom `DEFINE EVENT` trigger.

*Architectural Trade-off:*
- **Use Direct Browser DB Access for**: Real-time collaborative UIs, user profile updates, chat feeds, document CRUD, live subscriptions.
- **Use Backend / Serverless Functions for**: Stripe checkout webhooks, sending transactional emails, calling LLM AI APIs, processing PDF reports.

---



### Mistake 2: Bypassing Database Table `PERMISSIONS` When Connecting Web Browsers Directly to Database

**The mistake:** Enabling browser connections while leaving table `PERMISSIONS` unconfigured or set to `PERMISSIONS FULL`.

**Why it's wrong:** Browser connections bypass backend servers. If table `PERMISSIONS` are unconfigured, browser clients can execute malicious `DELETE` or `UPDATE` queries on any record.

*Incorrect:*
```surrealql
DEFINE TABLE user PERMISSIONS FULL; // ❌ Exposes all records to browser clients!
```

*Fix:*
```surrealql
DEFINE TABLE user PERMISSIONS FOR select WHERE id = $auth.id, FOR update WHERE id = $auth.id;
```

### Mistake 3: Exposing Root Credentials in Web Browser JavaScript Bundles

**The mistake:** Hardcoding `user: 'root', pass: 'secret'` inside frontend React/Vue client code.

**Why it's wrong:** Frontend code is readable by any web user. Exposing root credentials compromises the database.

*Incorrect:*
```surrealql
const db = new Surreal(); db.signin({ user: "root", pass: "secret" }); // ❌ Disastrous security leak!
```

*Fix:*
```surrealql
const db = new Surreal(); db.signin({ access: "user", username: inputUser, pass: inputPass });
```





## 5. Practice Exercises

### Exercise 1: Direct WebSocket Client Connection Setup

**Scenario:**
Configure a full-stack React frontend connecting directly to SurrealDB over WebSockets using the official `@surrealdb/surrealdb` JavaScript SDK.

**Requirements:**
1. Connect to endpoint `wss://db.example.com/rpc`.
2. Authenticate using `db.signin()`.
3. Perform a query safely under row-level security.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import Surreal from "surrealdb";
> 
> const db = new Surreal();
> 
> async function initDB() {
>   await db.connect("wss://db.example.com/rpc");
> 
>   // Sign in as scoped user
>   await db.signin({
>     access: "user_access",
>     ns: "main",
>     db: "app",
>     username: "alice",
>     pass: "UserPass123!"
>   });
> 
>   // Query records directly safely governed by RLS PERMISSIONS!
>   const posts = await db.select("post");
>   console.log("User posts:", posts);
> }
> ```
> 
> #### Technical Explanation
>
> 1. Direct browser-to-database connections bypass intermediate REST API web servers.
> 2. WebSockets maintain a bi-directional binary connection channel for queries and live subscriptions.
> 3. Row-level security (`PERMISSIONS`) inside SurrealDB prevents unauthorized client data access.
> 
---

### Exercise 2: Real-Time Live Queries from Web Browsers

**Scenario:**
Subscribe to real-time `post` creation events directly from a browser web application using `db.live()`.

**Requirements:**
1. Subscribe to `post` table live events using `db.live("post", callback)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> await db.live("post", (action, result) => {
>   console.log(`Live Event [${action}]:`, result);
> });
> ```
>
> #### Technical Explanation
>
> 1. `db.live()` opens a real-time `LIVE SELECT` subscription over the active WebSocket channel.
> 2. Server pushes mutation events (`CREATE`, `UPDATE`, `DELETE`) to the browser instantly.
> 3. Eliminates polling loops and external message queue infrastructure (Socket.io, Redis).
> 
---

### Exercise 3: Comparing Direct Browser-to-DB vs Traditional Backend API

**Scenario:**
Summarize the architecture and latency benefits of direct browser-to-SurrealDB connections vs traditional 3-tier REST API backends.

**Requirements:**
1. Highlight reductions in backend API code.
2. Highlight network latency improvements.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Traditional 3-Tier Architecture:
> Browser -> HTTP -> Express API -> Database (2 network hops, duplicate auth logic)
> 
> SurrealDB Direct Architecture:
> Browser -> WebSocket -> SurrealDB Engine with RLS (1 network hop, unified database security)
> ```
>
> #### Technical Explanation
>
> 1. Cuts network roundtrip latency by half by connecting clients directly to the database.
> 2. Eliminates duplicate data models and authentication code between backend APIs and databases.
> 3. Enforces security centrally at the database tier.
> 
---





## 6. Related Terms

- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in end-user authentication.
- [`PERMISSIONS` Clause (Table & Field Level)](permissions_clause.md) — Row-level authorization.
- [`LIVE SELECT` (Live Queries)](../level_09/live_select.md) — Related concept: `LIVE SELECT` (Live Queries).
- [Embedding SurrealDB (Rust / WASM)](../level_10/embedding.md) — Related concept: Embedding SurrealDB (Rust / WASM).

---

## 7. Key Takeaways
- Direct Browser-to-Database Architecture connects clients directly to SurrealDB via WebSocket.
- Eliminates middle-tier REST/GraphQL CRUD API boilerplate.
- Secured by Record Access authentication, Row-Level Security (`PERMISSIONS`), and field `ASSERT` rules.
- Combine with serverless functions or backend workers for tasks requiring third-party secret API keys.
