# 05-Node.js: Zero to Hero

A progressive glossary of essential Node.js architecture, modules, and performance concepts.


## Level 1: Introduction & Architecture

1. **Node.js (Runtime Environment)** (nodejs.md)
2. **V8 JavaScript Engine** (v8_engine.md)
3. **Single-Threaded Architecture** (single_threaded.md)
4. **The Call Stack** (call_stack.md)
5. **Non-Blocking I/O** (non_blocking_io.md)
6. **The Event Loop & Libuv** (event_loop.md)
7. **The Thread Pool (libuv)** (thread_pool.md)
8. **CPU-bound vs I/O-bound** (cpu_vs_io.md)
9. **Blocking the Event Loop** (blocking_event_loop.md)

## Level 2: Core Modules & Globals

10. **Global Objects (`global`, `__dirname`, `__filename`)** (global_objects.md)
11. **The Node.js REPL** (repl.md)
12. **The `process` Object** (process_object.md)
13. **stdin / stdout / stderr (Standard Streams)** (standard_streams.md)
14. **The `fs` Module (File System)** (fs_module.md)
15. **The `path` Module** (path_module.md)
16. **The `http` Module** (http_module.md)
17. **The os & util Modules** (os_util_modules.md)
18. **The events Module** (events_module.md)
19. **The `crypto` Module** (crypto_module.md)

## Level 3: Module Systems

20. **CommonJS (`require`, `module.exports`)** (commonjs.md)
21. **ES Modules (`import`, `export`)** (es_modules.md)
22. **Module Resolution** (module_resolution.md)
23. **Circular Dependencies** (circular_dependencies.md)
24. **Built-in vs External Modules** (module_types.md)

## Level 4: Package Management

25. **NPM (Node Package Manager)** (npm.md)
26. **`package.json`** (package_json.md)
27. **`node_modules`** (node_modules.md)
28. **Semantic Versioning (SemVer)** (semantic_versioning.md)
29. **`package-lock.json` & Deterministic Installs** (package_lock.md)

## Level 5: Asynchronous Patterns

30. **Callbacks & Callback Hell** (callbacks.md)
31. **Promisification (`util.promisify`)** (promisification.md)
32. **async / await in Node** (async_await.md)
33. **Async Error Handling (try/catch + .catch)** (async_error_handling.md)
34. **Unhandled Promise Rejections** (unhandled_rejections.md)
35. **Event Emitter** (event_emitter.md)
36. **Microtasks vs Macrotasks** (microtasks_macrotasks.md)
37. **process.nextTick() vs setImmediate()** (nexttick_setimmediate.md)

## Level 6: Data Handling

38. **Buffers** (buffers.md)
39. **Character Encoding & Buffer ↔ String** (buffer_encoding.md)
40. **Streams (General Concept)** (streams.md)
41. **Readable & Writable Streams** (readable_writable.md)
42. **Duplex & Transform Streams** (duplex_transform_streams.md)
43. **Piping (`.pipe()`)** (piping.md)
44. **Backpressure** (backpressure.md)
45. **Data Chunks** (chunks.md)

## Level 7: Web Servers & APIs

46. **The `http` Module Deep Dive** (http_deep_dive.md)
47. **Express.js** (express_js.md)
48. **Routing** (routing.md)
49. **Route Parameters & Query Strings** (route_parameters.md)
50. **Middleware** (middleware.md)
51. **The Middleware Chain & next()** (middleware_chain.md)
52. **Body Parsing (express.json())** (body_parsing.md)
53. **Serving Static Files (express.static)** (static_files.md)
54. **The `req` & `res` Objects** (req_res.md)

## Level 8: Database Integration

55. **SQL vs NoSQL** (sql_vs_nosql.md)
56. **ORMs & ODMs** (orms_odms.md)
57. **Mongoose (MongoDB ODM)** (mongoose.md)
58. **Prisma / Sequelize (SQL ORMs)** (prisma_sequelize.md)
59. **Connection Pooling** (connection_pools.md)
60. **Migrations** (migrations.md)
61. **Database Transactions** (db_transactions.md)
62. **SQL Injection** (sql_injection.md)
63. **Parameterized Queries / Prepared Statements** (parameterized_queries.md)

## Level 9: REST APIs & Best Practices

64. **REST API Design** (rest_api.md)
65. **API Versioning** (api_versioning.md)
66. **HTTP Status Codes** (status_codes.md)
67. **CORS** (cors.md)
68. **Pagination** (pagination.md)
69. **Rate Limiting** (rate_limiting.md)
70. **MVC Pattern (Model–View–Controller)** (mvc_pattern.md)
71. **Controllers & Services** (controllers_services.md)
72. **Input Validation (joi / zod)** (input_validation.md)
73. **Error Handling Middleware** (error_handling_middleware.md)

## Level 10: Security & Production

74. **Bcrypt (Password Hashing)** (bcrypt.md)
75. **JWT (JSON Web Tokens)** (jwt.md)
76. **Environment Variables (`dotenv`)** (env_vars.md)
77. **Child Processes (child_process)** (child_processes.md)
78. **Worker Threads** (worker_threads.md)
79. **The cluster Module** (cluster_module.md)
80. **PM2 (Process Manager)** (pm2.md)
81. **Load Balancing** (load_balancing.md)
82. **Reverse Proxy (Nginx)** (reverse_proxy.md)
83. **Docker** (docker.md)
84. **Graceful Shutdown & Process Signals** (graceful_shutdown.md)
85. **Logging & Monitoring** (logging_monitoring.md)
86. **Memory Leaks & Garbage Collection** (memory_leaks.md)
