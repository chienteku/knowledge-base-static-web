# Surrealist (Web IDE)

> **Level 1 — What Is SurrealDB?**
> The official graphical web and desktop user interface (IDE) for SurrealDB, allowing developers to write SurrealQL queries, inspect collection tables, edit document properties, and manage schemas visually.

---

## 1. Prerequisites

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](connection_uri.md) — Connect string setups.

---

## 2. Term Category


**Integration / Ecosystem (visual web IDE and management GUI)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Querying a database exclusively through command-line terminal shells can be slow and abstract:
-   You cannot easily visualize relationships or graphs.
-   Inspecting deeply nested JSON structures in a terminal is hard to read.
-   Designing table schemas requires writing complex syntax definitions by memory.

In PostgreSQL, developers use graphical tools like **pgAdmin** or DBeaver. 

In MongoDB, developers use **MongoDB Compass**.

We designed **Surrealist** to provide a unified visual cockpit for SurrealDB. 

Because SurrealDB natively communicates over WebSockets, the Surrealist web application can connect directly to your local running database instance from your browser. 

It provides an interactive console to write queries, a visual data explorer to traverse graph nodes, and a schema generator, making database administration accessible to developers of all levels.

---

### (2) Key Features of Surrealist
-   **Interactive Query Console:** Write SurrealQL queries with syntax highlighting, autocomplete, history tracking, and JSON formatter panels.
-   **Visual Data Explorer:** Browse tables and click on record link IDs to navigate between documents, letting you traverse document graphs visually.
-   **Schema Designer:** Create tables, define field types, and write assertion validation logic using GUI panels.
-   **Connection Manager:** Save connection profiles (local memory dev, cloud staging, production) to quickly jump between environments.

---

### (3) Reality Metaphor (Control Rooms)
Imagine searching files in a dark archives warehouse:
-   **Command-Line Interface:** Searching the warehouse with a single **Flashlight**. 
    -   You can find folders, but you must look at one spot at a time and type codes in the dark.
-   **Surrealist Web IDE:** Turning on the **Master Facility Control Room Lights**. 
    -   A large glass window reveals the entire warehouse layout. 
    -   You can point at drawers (tables), click on folders (records), expand sub-folders (objects), and view the links connecting different shelves on a screen.

---

### (4) Connection Settings
To connect Surrealist to a local database:

1.  Start your local server: `surreal start --user root --pass root memory`
2.  Open `https://surrealist.app` in your browser.
3.  Configure the connection details:
    -   **Endpoint:** `ws://localhost:8000/rpc` (WebSocket is default)
    -   **Namespace (NS):** `test`
    -   **Database (DB):** `test`
    -   **Authentication:** Select `Root` credentials and enter user `root` / password `root`.
4.  Click **Connect** to open the query console workspace.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Getting connection errors when connecting the HTTPS web app (surrealist.app) to a local HTTP database, unaware of mixed-content browser blocks

**The mistake:** Opening `https://surrealist.app` in Google Chrome and attempting to connect to your local unencrypted server at `ws://localhost:8000/rpc`, receiving silent connection drop alerts.

**Why it's wrong:** Modern web browsers enforce strict security rules that block secure HTTPS web pages from making unencrypted WebSocket (`ws://`) connections to localhost. This is called a **Mixed Content Block**.

**Fix: Download and install the native Desktop Surrealist App (which is exempt from browser sandbox mixed-content rules), or configure your local server to use SSL/TLS (`wss://`).**

---



### Mistake 2: Forgetting to Configure Namespace and Database in Surrealist Connection Panel

**The mistake:** Connecting Surrealist GUI to a database without selecting active NS and DB target fields.

**Why it's wrong:** Surrealist requires an active Namespace and Database target to display tables, schemas, and execute queries in the visual editor.

*Incorrect:*
```surrealql
// Connection string missing NS & DB fields in Surrealist connection modal
```

*Fix:*
```surrealql
// Fill Namespace 'main' and Database 'app' fields in Surrealist Connection View
```

### Mistake 3: Running Destructive Schema Dropping Statements in Surrealist Production Connections

**The mistake:** Executing `REMOVE DATABASE` or `REMOVE TABLE` in Surrealist while connected to production.

**Why it's wrong:** Surrealist executes queries with full administrative rights of the authenticated user. Double-check connection target environment headers.

*Incorrect:*
```surrealql
REMOVE TABLE user; -- Executed accidentally against Production connection
```

*Fix:*
```surrealql
-- Use Sandbox environment or dev connection tabs for destructive schema testing
```

## 5. Practice Exercises

### Exercise 1: Surrealist Query Execution and Explorer Workflow

**Scenario:**
You are using Surrealist (SurrealDB's official visual management web IDE) to design and test a database schema interactively.

**Requirements:**
1. Describe the primary workflow in Surrealist for executing multi-statement SurrealQL queries.
2. Describe how Surrealist displays document records, record links, and graph edge connections visually.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> - Query View: Write, format, and execute multi-statement SurrealQL queries with syntax highlighting and JSON output inspection.
> - Designer View: Visually create tables, fields, indexes, and PERMISSIONS rules without writing manual DDL commands.
> - Explorer View: Browse records as interactive document trees and inspect graph relationships as node-edge visual graphs.
> ```
>
> #### Technical Explanation
>
> 1. Surrealist acts as the official visual IDE for SurrealDB (similar to pgAdmin for PostgreSQL or MongoDB Compass).
> 2. Connects directly to local (`ws://localhost:8000`), remote, or SurrealDB Cloud database instances.
> 3. Allows developers to test authentication tokens, inspect live query streams, and visualize graph arrow connections.

---

### Exercise 2: Testing Authentication Scopes in Surrealist

**Scenario:**
A developer is configuring `DEFINE ACCESS` rules in Surrealist and needs to test client query execution under a simulated user auth session.

**Requirements:**
1. Explain how to configure session authentication variables inside Surrealist's query view settings.
2. Describe how Surrealist validates row-level security `PERMISSIONS` during query testing.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> - Open Session Variables panel in Surrealist Query View.
> - Set namespace (ns), database (db), and authentication access mode (e.g. RECORD access token).
> - Execute queries to verify that PERMISSIONS clauses restrict visible records correctly.
> ```
>
> #### Technical Explanation
>
> 1. Surrealist allows developers to toggle between Root Admin sessions and Scoped User sessions seamlessly.
> 2. Executing queries under scoped user sessions verifies row-level security (`PERMISSIONS`) before frontend SDK deployment.
> 3. Prevents security misconfigurations by providing instant visual query validation.

---

### Exercise 3: Visualizing Graph Edge Connections in Explorer

**Scenario:**
You have created graph relation edges `user:1 -> wrote -> post:10` and want to inspect the connection visually using Surrealist Graph View.

**Requirements:**
1. Navigate to Explorer / Graph View in Surrealist.
2. Describe how node records (`user`, `post`) and edge records (`wrote`) are rendered visually.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Node Rendering: 'user:1' and 'post:10' render as circular vertex nodes.
> Edge Rendering: 'wrote' renders as a directed line arrow connecting 'user:1' to 'post:10'.
> Edge Properties: Clicking the 'wrote' arrow displays stored edge metadata (e.g. created_at).
> ```
>
> #### Technical Explanation
>
> 1. Surrealist automatically parses `in` and `out` record link fields on relation tables to build visual graph diagrams.
> 2. Enables visual inspection of complex multi-hop graph networks without writing manual graph export code.
> 3. Facilitates data modeling validation for graph-heavy application domains.

---



## 6. Related Terms

- [Connection URI & Protocols (`ws://`, `wss://`, `http://`)](connection_uri.md) — Connect string setups.
- [SurrealDB CLI (`surreal sql`)](surreal_cli.md) — Terminal commands.
- [SurrealDB Cloud](../level_10/surrealdb_cloud.md) — Related concept: SurrealDB Cloud.
- [SurrealQL](surrealql.md) — Related concept: SurrealQL.

---

## 7. Key Takeaways
- Surrealist is the official web-based and desktop graphical IDE for SurrealDB.
- Equivalent to PostgreSQL's pgAdmin and MongoDB's Compass utilities.
- Provides interactive query consoles, schema designs, and data explorers.
- Web version connects directly to local databases over WebSockets.
- Visual explorer allows clicking record links to traverse document graphs.
- Browsers block `https://surrealist.app` from connecting to local `ws://` links.
- Use the Desktop Surrealist App to bypass browser mixed-content blocks.
