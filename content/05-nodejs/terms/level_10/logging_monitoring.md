# Logging & Monitoring

> **Level 10 — Security & Production**
> Structured logs and health metrics beyond `console.log` in production.

---

## 1. Prerequisites
- [PM2 (Process Manager)](pm2.md) — The process runner monitoring output logs.
- [Environment Variables (dotenv)](env_vars.md) — Configurations adjusting logging levels dynamically.

---

## 2. Term Category

**Production / DevOps (Observability Layer .)**: Logging & Monitoring is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Structured JSON Logger with Log Levels

**Scenario:** Constructs a structured JSON logger emitting standardized log entries containing timestamps, log levels (`INFO`, `WARN`, `ERROR`), and metadata.

**Requirements:**
1. Write createJsonLogger(minLevelStr).
2. Format output as JSON line.
3. Filter logs below minLevel.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createJsonLogger(minLevelStr = "INFO") {
>   const levels = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
>   const minWeight = levels[minLevelStr.toUpperCase()] || 20;
>
>   return {
>     log(level, message, meta = {}) {
>       const weight = levels[level.toUpperCase()] || 20;
>       if (weight < minWeight) return null;
>
>       const entry = {
>         timestamp: new Date().toISOString(),
>         level: level.toUpperCase(),
>         message,
>         ...meta
>       };
>
>       return JSON.stringify(entry);
>     }
>   };
> }
>
> // Verification tests
> const logger = createJsonLogger("WARN");
> console.assert(logger.log("INFO", "Ignore me") === null, "Test 1 Failed: Filtered out INFO log");
>
> const errLog = JSON.parse(logger.log("ERROR", "DB Down", { code: 500 }));
> console.assert(errLog.level === "ERROR" && errLog.code === 500, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Structured JSON Logging**: Outputs logs as single-line JSON objects easily parsed by log aggregation systems (Elasticsearch, Datadog).
> 2. **Log Severity Levels**: `DEBUG`, `INFO`, `WARN`, `ERROR`; filtering out debug logs in production reduces I/O volume.
> 3. **Pino & Winston Libraries**: Standard Node.js logging libraries optimized for high-throughput JSON serialization.
> 
---

### Exercise 2: Prometheus HTTP Request Counter Collector

**Scenario:** Implements a Prometheus metrics counter tracking total HTTP requests by method, route, and status code.

**Requirements:**
1. Write createPrometheusMetricsCollector().
2. Track request counts.
3. Format Prometheus exposition text.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createPrometheusMetricsCollector() {
>   const counters = new Map();
>
>   return {
>     inc(method, route, statusCode) {
>       const key = `http_requests_total{method="${method}",route="${route}",status="${statusCode}"}`;
>       counters.set(key, (counters.get(key) || 0) + 1);
>     },
>     toPrometheusText() {
>       const lines = ["# HELP http_requests_total Total number of HTTP requests"];
>       lines.push("# TYPE http_requests_total counter");
>
>       for (const [labels, val] of counters.entries()) {
>         lines.push(`${labels} ${val}`);
>       }
>
>       return lines.join("
> ");
>     }
>   };
> }
>
> // Verification tests
> const collector = createPrometheusMetricsCollector();
> collector.inc("GET", "/users", 200);
> collector.inc("GET", "/users", 200);
>
> const text = collector.toPrometheusText();
> console.assert(text.includes('http_requests_total{method="GET",route="/users",status="200"} 2'), "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Prometheus Exposition Format**: Standard plain-text metric format (`metric_name{labels} value`) scraped by Prometheus server.
> 2. **Prometheus Counters**: Monotonically increasing metrics tracking cumulative totals (e.g., total requests, total errors).
> 3. **prom-client Library**: Official Node.js Prometheus client module for collecting default process and custom metrics.
> 
---

### Exercise 3: Correlation ID Tracing Middleware

**Scenario:** Injects or propagates a unique Correlation ID (`X-Correlation-ID`) header across HTTP microservice requests for distributed tracing.

**Requirements:**
1. Write correlationIdMiddleware(req, res, next).
2. Extract or generate UUID for X-Correlation-ID.
3. Set response header.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function correlationIdMiddleware(req, res, next) {
>   const cryptoLib = require("crypto");
>   const existingId = req.headers["x-correlation-id"] || req.headers["X-Correlation-ID"];
>
>   const correlationId = existingId || cryptoLib.randomUUID();
>
>   req.correlationId = correlationId;
>   res.setHeader("X-Correlation-ID", correlationId);
>
>   next();
> }
>
> // Verification tests
> const headers = {};
> const mockRes = { setHeader: (k, v) => { headers[k] = v; } };
> const mockReq = { headers: {} };
>
> correlationIdMiddleware(mockReq, mockRes, () => {});
> console.assert(typeof mockReq.correlationId === "string", "Test 1 Failed: Attached correlationId to req");
> console.assert(headers["X-Correlation-ID"] === mockReq.correlationId, "Test 2 Failed: Set header");
> ```
>
> #### Technical Explanation
>
> 1. **Distributed Tracing**: Correlates log entries across multiple microservices handling the same user transaction.
> 2. **X-Correlation-ID Header**: Standard HTTP header passed along internal microservice HTTP/gRPC requests.
> 3. **AsyncLocalStorage Context**: Node.js `AsyncLocalStorage` stores correlation IDs in async context without passing parameters manually.
## 6. Related Terms
- [PM2 (Process Manager)](pm2.md) — Captures stdout/stderr outputs and manages application logs.
- [Graceful Shutdown & Process Signals](graceful_shutdown.md) — Works with health probes to drain traffic before container termination.

---

## 7. Key Takeaways
- Use structured JSON logging (via Pino or Winston) in production to enable query filters.
- Plain text `console.log` statements are synchronous in some contexts and can block the event loop.
- Logging aggregators index JSON log parameters for fast analysis.
- Expose `/health/live` liveness probes to verify the application process is running.
- Expose `/health/ready` readiness probes to verify database and cache connections.
- Control logging verbosity dynamically in production using log level environment variables.
