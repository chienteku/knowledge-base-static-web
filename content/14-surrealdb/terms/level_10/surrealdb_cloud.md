# SurrealDB Cloud

> **Level 10 — SDKs, Deployment & Production**
> The fully managed cloud platform for deploying, auto-scaling, monitoring, and backing up SurrealDB clusters in production without managing infrastructure.

---

## 1. Prerequisites

- [SurrealDB Server (`surreal start`)](../level_01/surreal_start.md) — Server process basics.
- [Storage Backends (Memory, RocksDB, TiKV)](../level_01/storage_backends.md) — Distributed database engines.

---

## 2. Term Category


**SurrealDB Cloud (Surrealist) (managed SurrealDB cloud platform & IDE)**: - **Cloud & Managed Services**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Deploying distributed database clusters in production requires configuring multi-node TiKV backends, SSL certificates, automatic backups, monitoring dashboards, zero-downtime upgrades, security firewalls, and horizontal auto-scaling. Managing database infrastructure manually consumes significant DevOps engineering time.

**SurrealDB Cloud** provides a fully managed database-as-a-service (DBaaS), equivalent to MongoDB Atlas or managed PostgreSQL services (Supabase, Neon, AWS RDS). Developers provision a SurrealDB cluster in seconds via a web interface or CLI, while SurrealDB Cloud handles hardware provisioning, storage scaling, automated daily backups, security patching, and global multi-region deployments.

### (2) Reality Metaphor
Think of riding a high-speed train:
- **Self-Hosted Deployment**: Purchasing locomotive engines, laying down tracks, hiring conductors, and scheduling maintenance yourself.
- **SurrealDB Cloud**: Buying a ticket on a high-speed train network. You step aboard and enjoy the ride while professional rail engineers handle train maintenance, safety systems, and track infrastructure.

### (3) Architectural Features
- **Serverless Tier**: Auto-scaling compute that scales down to zero when idle, charging only for resources used.
- **Dedicated Clusters**: Provisioned high-performance compute and distributed TiKV storage for enterprise workloads.
- **Surrealist Integration**: One-click visual query editor and schema explorer connected directly to cloud instances.
- **Automated Backups & Point-in-Time Recovery**: Continuous backup snapshots with one-click database restoration.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Leaving Cloud Admin Credentials Unprotected

**The mistake:** Exposing Root superuser credentials on cloud database instances or committing production connection URIs to public GitHub repositories.

**Why it's wrong:** Publicly exposed cloud databases can be compromised or wiped. Always restrict administrative IP access and use environment variables (`.env`).

*Incorrect:*
```typescript
// Hardcoded cloud database credentials in frontend code!
const db = new Surreal();
await db.connect('wss://my-instance.surreal.cloud/rpc');
await db.signin({ user: 'root', pass: 'prod-secret' }); // Dangerous!
```

*Fix:*
```typescript
// Use environment variables and Record Access for client-side authentication
const db = new Surreal();
await db.connect(process.env.NEXT_PUBLIC_SURREAL_URL);
await db.signin({ access: 'app_user', email: userEmail, pass: userPass });
```

---



### Mistake 2: Hardcoding Development Localhost Connection URIs in Production Cloud Deployments

**The mistake:** Connecting cloud web apps to `ws://127.0.0.1:8000/rpc` in production.

**Why it's wrong:** SurrealDB Cloud instances run on managed secure cloud endpoints (e.g. `wss://instance.surreal.cloud/rpc`). Update connection URIs in environment configs.

*Incorrect:*
```surrealql
await db.connect("ws://127.0.0.1:8000/rpc"); // ❌ Localhost URI in production!
```

*Fix:*
```surrealql
await db.connect(process.env.SURREAL_CLOUD_URI); // Managed SurrealDB Cloud URI
```

### Mistake 3: Exposing Root Superuser Credentials in Cloud Environments

**The mistake:** Using root credentials for web client connections in SurrealDB Cloud.

**Why it's wrong:** Always use RECORD access scopes and JWT authentication for public client web apps in SurrealDB Cloud.

*Incorrect:*
```surrealql
await db.signin({ user: "root", pass: "cloud_root_pass" }); // ❌ Security leak!
```

*Fix:*
```surrealql
await db.signin({ access: "user", ns: "main", db: "app", username, pass });
```





## 5. Practice Exercises

### Exercise 1: Connecting SDK Clients to SurrealDB Cloud

**Scenario:**
Configure a Node.js microservice to connect securely to a managed SurrealDB Cloud cluster endpoint over TLS (`wss://`).

**Requirements:**
1. Connect to `wss://my-cluster.surrealdb.cloud/rpc`.
2. Authenticate using cloud database credentials.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import Surreal from "@surrealdb/surrealdb";
> 
> const db = new Surreal();
> 
> await db.connect("wss://my-cluster.surrealdb.cloud/rpc");
> 
> await db.signin({
>   access: "user_access",
>   ns: "production",
>   db: "main",
>   username: "app_user",
>   pass: process.env.CLOUD_DB_PASS!
> });
> 
> console.log("Connected to SurrealDB Cloud!");
> ```
> 
> #### Technical Explanation
>
> 1. SurrealDB Cloud provides fully managed, auto-scaling database clusters.
> 2. `wss://` enforces encrypted TLS WebSocket communication for remote cloud connections.
> 3. Managed cluster endpoints handle high availability, automated backups, and global scaling.
> 
---

### Exercise 2: Using Surrealist IDE with SurrealDB Cloud

**Scenario:**
Connect Surrealist (the official visual IDE) to your SurrealDB Cloud cluster instance to design schemas visually.

**Requirements:**
1. Specify endpoint `wss://my-cluster.surrealdb.cloud/rpc`.
2. Enter database credentials and namespace targets.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Cloud IDE Connection Steps:
> - Open Surrealist IDE (web app or desktop app).
> - Create new connection targeting 'wss://my-cluster.surrealdb.cloud/rpc'.
> - Enter Namespace, Database, and User Authentication Credentials.
> - Use Query View, Schema Designer, and Graph Explorer tools.
> ```
>
> #### Technical Explanation
>
> 1. Surrealist connects directly to SurrealDB Cloud clusters over secure WebSocket RPC channels.
> 2. Provides visual schema design, query debugging, and graph network exploration.
> 3. Simplifies cloud database management.
> 
---

### Exercise 3: Provisioning Managed Cloud Resources

**Scenario:**
Summarize the operational benefits of managed SurrealDB Cloud over self-hosted single-node deployments.

**Requirements:**
1. Highlight automated backups, multi-region scaling, and zero maintenance.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Operational Benefits:
> - Fully Managed: Automated server patching, zero infrastructure maintenance.
> - High Availability: Multi-region replication powered by TiKV distributed storage.
> - Automated Backups: Continuous point-in-time recovery and snapshot management.
> ```
>
> #### Technical Explanation
>
> 1. Managed cloud infrastructure offloads database maintenance overhead.
> 2. Auto-scales compute nodes and TiKV storage nodes independently.
> 3. Provides enterprise SLA availability for production workloads.
> 
---





## 6. Related Terms

- [Surrealist (Web IDE)](../level_01/surrealist.md) — Visual cloud query editor.
- [Docker Deployment](docker_deployment.md) — Self-hosted container deployment alternative.
- [TiKV Backend (Distributed Mode)](tikv_backend.md) — Distributed cloud storage engine.

---

## 7. Key Takeaways
- SurrealDB Cloud is the official managed DBaaS platform for SurrealDB.
- Eliminates manual database operations: auto-scaling, backups, security patches, and monitoring.
- Connects seamlessly with Surrealist web IDE and application client SDKs.
