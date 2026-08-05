# Logging & Monitoring

> **Level 10 — Security & Production**
> Structured logs and health metrics beyond `console.log` in production.

---

## 1. Prerequisites
- [PM2 (Process Manager)](pm2.md) — The process runner monitoring output logs.
- [Environment Variables (dotenv)](env_vars.md) — Configurations adjusting logging levels dynamically.
---

## 2. Term Category
- **Production / DevOps**

---

## 3. Environment Context
- **Observability Layer** (Tracks application health, diagnostics, and performance metrics in production).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In local development, using `console.log()` to debug variables is quick and easy. 

However, in production environments, plain text console logs are highly inefficient:
-   **No Structure:** Plain text is difficult to search, index, or filter.
-   **No Context:** Text logs lack essential metadata (such as timestamps, hostnames, correlation IDs, or execution environments).
-   **Event Loop Bottleneck:** Writing massive amounts of text to standard output via `console.log` is synchronous in Node.js when outputting to a terminal or file stream, which can block the event loop and degrade server performance.

To monitor applications effectively, developers implement **Structured Logging & Health Monitoring**:

#### 1. Structured Logging
Every log entry is formatted as a single line **JSON object**:
`{"level":"info","timestamp":"2026-07-18T09:47:00Z","message":"Transaction completed","userId":108,"durationMs":14}`
JSON logs can be easily parsed and queried by log aggregation tools (like Datadog, AWS CloudWatch, or ElasticSearch/Kibana). This allows you to run precise search queries (e.g. *"Show me all logs where level = ERROR and userId = 108"*). Commonly used structured loggers in Node.js include **Pino** (high performance) and **Winston** (feature-rich).

#### 2. Health Monitoring
To allow load balancers and orchestrators (like Kubernetes) to track application health, servers expose dedicated endpoints:
-   **Liveness Probe (`/health/live`):** Verifies that the Node process is running and responding. If this endpoint fails, the container manager restarts the container.
-   **Readiness Probe (`/health/ready`):** Verifies that database connections, cache servers, and external APIs are fully connected before routing client traffic to the container.

---

### (2) Reality Metaphor
Imagine an airplane cockpit.
- **`console.log`** is like a **pilot scribbling notes on their hand**. They write: *"Left engine running hot"* or *"Rough headwind."* By the end of the flight, the ink is smudged, there are no timestamps, and the airline company cannot analyze flight patterns across their fleet. If the plane crashes, the notes are lost.
- **Structured Logging** is the **flight data recorder (Black Box)**. It automatically records multiple flight parameters (altitude, fuel level, speed) with microsecond precision into structured data fields. The airline can query this data instantly to identify anomalies across thousands of flights.

---

### (3) JavaScript Logging & Health Implementation

```javascript
const express = require('express');
const mongoose = require('mongoose');
const pino = require('pino'); // High-performance JSON logger

const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // Adjust logging level dynamically
});

const app = express();

// 1. Logging Request Interceptor Middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming Request');
  next();
});

// 2. Readiness Probe Endpoint
app.get('/health/ready', async (req, res) => {
  // Check if database is fully connected
  const dbConnected = mongoose.connection.readyState === 1;
  
  if (dbConnected) {
    logger.debug('Readiness check passed');
    return res.status(200).json({ status: 'ready', database: 'connected' });
  } else {
    logger.error('Readiness check failed: Database not connected');
    return res.status(503).json({ status: 'unready', database: 'disconnected' });
  }
});

app.listen(3000);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving raw verbose debug logs active in production

**The mistake:** Leaving verbose debug logs (e.g. logging complete database query results) active in production.

**Why it's wrong:** Writing large volumes of log data consumes disk space and network bandwidth, increasing log storage costs. In addition, logging sensitive user data (like passwords, credit card numbers, or API keys) violates security compliance regulations (PCI/GDPR).

*Fix:* Configure your structured logger to filter messages by log level using environment variables. In production, only log `'info'`, `'warn'`, and `'error'` levels, filtering out `'debug'` and `'trace'` logs.

---



### Mistake 2: Using `console.log()` for Production Server Logging (Performance and Formatting Trap)

**The mistake:** Using `console.log()` for all server logging in high-throughput production environments.

**Why it's wrong:** `console.log()` is synchronous, lacks log severity levels (`info`, `warn`, `error`), and outputs unstructured text strings impossible to query in log aggregators. Use structured loggers like `pino` or `winston`.

*Incorrect:*
```javascript
console.log('User logged in: ' + user.id); // ❌ Synchronous unstructured text logging!
```

*Fix:*
```javascript
logger.info({ userId: user.id }, 'User logged in'); // Fast structured JSON logging via Pino
```

### Mistake 3: Logging Sensitive PII Data (Passwords, Credit Cards, Auth Tokens)

**The mistake:** Logging `req.body` directly in request logging middleware.

**Why it's wrong:** Logging `req.body` plain-text records passwords, credit card numbers, and API tokens into log files, violating GDPR and PCI-DSS compliance. Redact sensitive keys.

*Incorrect:*
```javascript
logger.info({ body: req.body }); // ❌ Logs passwords and credit cards to disk!
```

*Fix:*
```javascript
const logger = pino({ redact: ['req.body.password', 'req.body.creditCard'] });
```

## 6. Practice Exercises

### Exercise 1: Custom Health Check Route

**Problem:** Complete the Express readiness probe route below. The check should verify that both the database and the cache (mock checks provided) are connected before returning a `200` status:

```javascript
const express = require('express');
const app = express();

const db = { isConnected: () => true };
const cache = { isConnected: () => false }; // Mocked offline!

app.get('/health/ready', (req, res) => {
  // Solution:
  const dbOk = db.isConnected();
  const cacheOk = cache.isConnected();

  if (dbOk && cacheOk) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({
      status: 'unready',
      details: { database: dbOk, cache: cacheOk }
    });
  }
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Configuring Pino JSON Logger

**Problem:** Instantiate Pino logger and log an `'info'` level event with `{ userId: 42 }` payload.

**Expected output:**
> [!check]- Answer
> ```text
> const logger = require('pino')(); logger.info({ userId: 42 }, 'User action');
> ```
> ```javascript
> const pino = require('pino');
> const logger = pino();
> logger.info({ userId: 42 }, 'User action recorded');
> ```
>
> **Explanation:** Pino outputs high-performance structured JSON logs compatible with Datadog/ELK.

---

### Exercise 3: Application Performance Metrics (APM)

**Problem:** List 3 key RED metrics tracked by Application Performance Monitoring (APM) tools for web services.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Rate (Requests per second)
> 2. Errors (Failed requests ratio)
> 3. Duration (Response latency distributions)
> ```
> ```text
> 1. Rate (requests/sec)
> 2. Errors (error percentage)
> 3. Duration (latency percentiles p95/p99)
> ```
>
> **Explanation:** RED metrics provide visibility into server throughput, error rates, and response latency.

## 7. Related Terms
- [PM2 (Process Manager)](pm2.md) — Captures stdout/stderr outputs and manages application logs.
- [Graceful Shutdown & Process Signals](graceful_shutdown.md) — Works with health probes to drain traffic before container termination.
---

## 8. Key Takeaways
- Use structured JSON logging (via Pino or Winston) in production to enable query filters.
- Plain text `console.log` statements are synchronous in some contexts and can block the event loop.
- Logging aggregators index JSON log parameters for fast analysis.
- Expose `/health/live` liveness probes to verify the application process is running.
- Expose `/health/ready` readiness probes to verify database and cache connections.
- Control logging verbosity dynamically in production using log level environment variables.
