# Surrealist (Web IDE)

> **Level 1 — What Is SurrealDB?**
> The official graphical web and desktop user interface (IDE) for SurrealDB, allowing developers to write SurrealQL queries, inspect collection tables, edit document properties, and manage schemas visually.

---

## 1. Prerequisites
- [Connection URI & Protocols](connection_uri.md) — Connect string setups.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **Web Browser** (Accessed online via `https://surrealist.app` or run as a standalone desktop application. Connects directly to local or cloud databases using WebSockets).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Connection Parameter Assembly

**Problem:** You are configuring a Surrealist profile to inspect a remote staging database. 
Identify which connection parameter panel input (**Endpoint**, **Namespace**, **Database**, or **Authentication**) corresponds to these settings:
1.  Selecting the database name `"inventory"`.
2.  Providing the connection protocol address `"wss://staging-db.example.com/rpc"`.
3.  Defining the tenant company name `"corp_alpha"`.
4.  Entering the admin username and password.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Database (DB)
> 2. Endpoint
> 3. Namespace (NS)
> 4. Authentication
> ```
> - The Endpoint represents the network protocol URI address.
> - Namespace handles the tenant boundary groupings.

---



### Exercise 2: Surrealist Tool Views Overview

**Problem:** List 3 primary views in Surrealist GUI (Query Editor, Explorer / Table Inspector, Designer / Schema Visualizer).

**Expected output:**
> [!check]- Answer
> ```text
> Query Editor, Explorer / Table Inspector, Designer / Schema Visualizer
> ```
> ```text
> Query Editor, Explorer / Table Inspector, Designer / Schema Visualizer
> ```
>
> **Explanation:** Surrealist provides visual query editing, table inspection, and schema design views.

---

### Exercise 3: Surrealist Sandbox Mode

**Problem:** What is the purpose of Surrealist's built-in Sandbox mode? (Runs an ephemeral in-memory database for testing without running a separate server).

**Expected output:**
> [!check]- Answer
> ```text
> Runs an in-memory database instance directly in the browser/GUI for instant testing
> ```
> ```text
> Runs an in-memory database instance directly in the browser/GUI for instant testing
> ```
>
> **Explanation:** Sandbox mode provides an instant, isolated testing environment inside Surrealist.

## 7. Related Terms
- [Connection URI & Protocols](connection_uri.md) — Connect string setups.
- [SurrealDB CLI (`surreal sql`)](surreal_cli.md) — Terminal commands.

---

## 8. Key Takeaways
- Surrealist is the official web-based and desktop graphical IDE for SurrealDB.
- Equivalent to PostgreSQL's pgAdmin and MongoDB's Compass utilities.
- Provides interactive query consoles, schema designs, and data explorers.
- Web version connects directly to local databases over WebSockets.
- Visual explorer allows clicking record links to traverse document graphs.
- Browsers block `https://surrealist.app` from connecting to local `ws://` links.
- Use the Desktop Surrealist App to bypass browser mixed-content blocks.
