# Direct Browser-to-Database Architecture

> **Level 8 — Authentication, Permissions & Security**
> An architectural pattern where web and mobile clients connect directly to SurrealDB over WebSocket, using Record Access and row-level permissions to eliminate middle-tier CRUD API backend servers.

---

## 1. Prerequisites
- [Authentication Architecture](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — End-user record authentication.
- [PERMISSIONS Clause](permissions_clause.md) — Table and field level security.

---

## 2. Term Category
- **Architecture & System Design**

---

## 3. Environment Context
- **Full-Stack Application Architecture** (Applies when designing web apps with React, Vue, Next.js, or mobile frameworks connecting to SurrealDB).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Bypassing Database Table `PERMISSIONS` When Connecting Web Browsers Directly to Database

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

### Mistake 5: Exposing Root Credentials in Web Browser JavaScript Bundles

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

## 6. Practice Exercises

### Exercise 1: Trade-off Evaluation
Determine whether the following application features should connect **Directly to SurrealDB from Browser** or route through a **Serverless/Backend Service**:
1. User fetching their personal bookmarked articles list.
2. Charging a customer's credit card via Stripe API.
3. Subscribing to live updates on a collaborative whiteboard canvas.

> [!check]- Answer
> - Standard CRUD and real-time live queries work great directly to DB.
> - Third-party API calls requiring secret keys require backend services.

---



### Exercise 2: Browser Direct SDK Architecture Flow

**Problem:** List 3 steps of Browser-to-Database flow (1. Browser connects via WSS, 2. Signin to RECORD access, 3. SurrealDB enforces PERMISSIONS).

**Expected output:**
```text
1. WSS Connection, 2. Scoped Signin, 3. Row-level PERMISSIONS evaluation
```

> [!check]- Answer
> ```text
> 1. WSS Connection, 2. Scoped Signin, 3. Row-level PERMISSIONS evaluation
> ```
>
> **Explanation:** Direct browser-to-database connections rely on WSS and scoped row-level security.

### Exercise 3: Browser Live Query Subscriptions

**Problem:** Subscribe to real-time `LIVE SELECT` events directly from web browser SDK.

**Expected output:**
```text
const query = await db.live('article', (action, result) => console.log(action, result));
```

> [!check]- Answer
> ```javascript
> const query = await db.live('article', (action, result) => console.log(action, result));
> ```
>
> **Explanation:** Web browser clients subscribe to real-time WebSocket push updates directly from SurrealDB.

## 7. Related Terms
- [Authentication Architecture](auth_architecture.md) — The 4-tier security hierarchy.
- [Record Access (`DEFINE ACCESS ... TYPE RECORD`)](define_access_record.md) — Built-in end-user authentication.
- [PERMISSIONS Clause](permissions_clause.md) — Row-level authorization.

---

## 8. Key Takeaways
- Direct Browser-to-Database Architecture connects clients directly to SurrealDB via WebSocket.
- Eliminates middle-tier REST/GraphQL CRUD API boilerplate.
- Secured by Record Access authentication, Row-Level Security (`PERMISSIONS`), and field `ASSERT` rules.
- Combine with serverless functions or backend workers for tasks requiring third-party secret API keys.
