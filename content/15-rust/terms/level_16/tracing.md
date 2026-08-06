# `tracing`

> **Level 16 — Ecosystem & Tooling**
> The modern, structured, and async-aware diagnostics and logging framework in Rust — using spans, events, and subscriber layers (`tracing_subscriber`) to instrument concurrent and asynchronous execution flows.

---

## 1. Prerequisites


- [`tokio`](tokio.md) — Asynchronous runtime instrumented by `tracing`.
- [`async` / `.await`](../level_09/async_await.md) — Asynchronous control flow tracked via `tracing::instrument`.

---

## 2. Term Category



**Rust Ecosystem Crate (structured diagnostics & telemetry framework)**: `tracing` is the official Tokio project framework for collecting structured, contextual diagnostic data from Rust applications. Unlike traditional logging libraries (such as `log` or `env_logger`) that output flat unstructured text lines (`println!`), `tracing` expands logging into **Structured Spans**: time-bounded execution contexts (`span!`) that track causal relationships across asynchronous `.await` boundaries and multi-threaded tasks.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In concurrent or asynchronous applications, flat string loggers fail completely:
- When 1,000 requests execute concurrently on a 8-thread Tokio pool, flat log statements (`log::info!("Processing request")`) interleave randomly in stdout without any request ID tracking context.
- Debugging which database query belongs to which HTTP request becomes impossible.

`tracing` introduces **Structured Spans and Events**:
1. **Spans**: Represent a period of time with attached key-value context (e.g. `span!(Level::INFO, "http_request", request_id = 42, user = "ferris")`).
2. **Events**: Log messages recorded *inside* a span inherit all context from parent spans automatically!
3. **Async Awareness**: Spans enter and exit execution dynamically as async tasks pause and resume across `.await` points.
4. **`#[instrument]` Attribute**: Annotates functions to automatically record all input parameters into a diagnostic span.

### (2) Code Examples

#### Instrumenting Async Functions with `tracing`

```rust
use tracing::{info, warn, instrument};
use tracing_subscriber;

#[instrument(skip(db_password), fields(user = %username))]
async fn process_user_login(username: &str, db_password: &str, user_id: u64) -> Result<(), &'static str> {
    info!("Verifying user credentials in database...");

    if user_id == 0 {
        warn!("Invalid user ID received!");
        return Err("Invalid ID");
    }

    info!("User authentication successful!");
    Ok(())
}

#[tokio::main]
async fn main() {
    // Initialize tracing subscriber (formats structured logs to stdout)
    tracing_subscriber::fmt::init();

    info!("Starting application server...");

    let _ = process_user_login("ferris_the_crab", "secret_pass", 101).await;
    let _ = process_user_login("anonymous", "bad_pass", 0).await;
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Forgetting `tracing_subscriber::fmt::init()` in Program `main` Entrypoint

**The mistake:** Emitting `tracing::info!` events without initializing a `Subscriber`.

**Why it's wrong:** Tracing events are completely ignored and dropped if no global subscriber is registered, producing empty log output.

*Fix:* Always call `tracing_subscriber::fmt::init()` at the start of `main()`.

### Mistake 3: Logging Sensitive PII / Secret Data Fields in Unmasked Structured Span Events

**The mistake:** Passing raw passwords or auth tokens to `tracing::info!(secret = %token)`.

**Why it's wrong:** Structured loggers emit span fields to stdout, central log collectors, and external monitoring dashboards, exposing plain-text secrets.

*Fix:* Mask sensitive fields (e.g. `secret = "[REDACTED]"`) before logging.


### Mistake 1: Forgetting to Initialize `tracing_subscriber` in `main()`

**The mistake:** Adding `tracing::info!()` calls throughout a codebase without calling `tracing_subscriber::fmt::init()` in `main()`.

**Why it's wrong:** `tracing` events are silently dropped unless a Subscriber is registered to capture and output them.

---

## 5. Practice Exercises

### Exercise 1: Async Payment Service Instrumentation & Secret Masking

**Scenario:** In an e-commerce microservice, you are building an async payment processing module. To comply with security standards (e.g., PCI-DSS), sensitive data like credit card tokens (`card_token`) must **never** be logged. However, for debugging and telemetry, you need to track `order_id`, `amount_cents`, and dynamically record the `payment_status` within the active span once processing completes.

Write an async function `process_payment(order_id: &str, amount_cents: u64, card_token: &str) -> Result<TransactionResult, String>` instrumented with `#[instrument]`.
1. Instruct `#[instrument]` to skip logging `card_token` while recording `order_id` and `amount_cents`.
2. Pre-declare a dynamic field `payment_status` on the span using `tracing::field::Empty`.
3. If `amount_cents == 0`, log an error event, record `payment_status = "invalid_amount"` into the active span, and return `Err("Invalid amount".into())`.
4. Otherwise, record `payment_status = "approved"` into the active span, log an info event with the generated transaction ID (`TXN_<order_id>`), and return `Ok(TransactionResult)`.
5. Include a comprehensive unit test suite with assertions (`assert_eq!`, `assert!`) validating both successful and failed payment processing flows.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use tracing::{instrument, info, error, Span, field};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct TransactionResult {
>     pub transaction_id: String,
>     pub status: String,
> }
> 
> #[instrument(
>     name = "payment_processor",
>     skip(card_token),
>     fields(
>         order_id = %order_id,
>         amount_cents = amount_cents,
>         payment_status = field::Empty
>     )
> )]
> pub async fn process_payment(
>     order_id: &str,
>     amount_cents: u64,
>     card_token: &str,
> ) -> Result<TransactionResult, String> {
>     let current_span = Span::current();
>     
>     info!("Initiating payment verification");
> 
>     if amount_cents == 0 {
>         current_span.record("payment_status", "invalid_amount");
>         error!("Payment failed: amount cannot be zero");
>         return Err("Invalid amount".to_string());
>     }
> 
>     // Simulate payment gateway transaction ID generation
>     let txn_id = format!("TXN_{}", order_id);
>     current_span.record("payment_status", "approved");
>     info!(transaction_id = %txn_id, "Payment successfully processed");
> 
>     Ok(TransactionResult {
>         transaction_id: txn_id,
>         status: "approved".to_string(),
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_successful_payment_processing() {
>         let result = process_payment("ORD-9901", 4999, "tok_secret_998877").await;
>         assert!(result.is_ok());
>         let txn = result.unwrap();
>         assert_eq!(txn.transaction_id, "TXN_ORD-9901");
>         assert_eq!(txn.status, "approved");
>     }
> 
>     #[tokio::test]
>     async fn test_zero_amount_payment_rejection() {
>         let result = process_payment("ORD-0000", 0, "tok_secret_123456").await;
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), "Invalid amount");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Attribute-Based Instrumentation (`#[instrument]`)**: Automatically creates a diagnostic span whenever `process_payment` is called. The `name` parameter overrides the span name to `payment_processor`.
> 2. **Secret Redaction (`skip(card_token)`)**: Prevents sensitive parameters (such as PCI tokens, passwords, or encryption keys) from being recorded in telemetry logs or exported to distributed tracing collectors.
> 3. **Deferred Field Recording (`field::Empty` & `Span::current().record`)**: Fields like `payment_status` cannot be known when entering the function. Declaring `field::Empty` reserves a slot in the span context, allowing `current_span.record(...)` to populate it dynamically once business logic yields a result.
> 4. **Async & Thread Context**: `tracing` spans track execution across `.await` points automatically, maintaining full trace parentage even when Tokio moves the task between worker threads.
> 
---

### Exercise 2: Custom In-Memory Telemetry Layer for Unit Testing Log Events

**Scenario:** In mission-critical software, automated tests must verify that diagnostic warning and error events are correctly emitted when safety limits are exceeded. Because outputting to stdout via standard formatters (`tracing_subscriber::fmt`) is difficult to inspect in unit tests, you need a custom in-memory telemetry layer.

Design an in-memory telemetry subscriber layer `EventCaptureLayer` that implements `tracing_subscriber::Layer`.
1. Store captured log messages inside a thread-safe shared buffer `Arc<Mutex<Vec<String>>>`.
2. Implement `on_event` to intercept log events, record event attributes via a custom `tracing::field::Visit` visitor, and push formatted strings into the shared buffer.
3. Implement a telemetry function `check_sensor_temperature(sensor_id: u32, temp_celsius: f64) -> &'static str` that logs an `info!` event for normal temperatures and a `warn!` event if `temp_celsius > 85.0`.
4. Write unit tests using `tracing_subscriber::Registry` and `tracing::subscriber::with_default` to execute `check_sensor_temperature` and assert (`assert_eq!`) that expected log entries are captured in memory.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Mutex};
> use tracing::{info, warn, Event, Subscriber};
> use tracing_subscriber::layer::Context;
> use tracing_subscriber::Layer;
> use tracing_subscriber::prelude::*;
> 
> /// Custom Subscriber Layer that captures log messages into a shared in-memory vector
> #[derive(Clone, Default)]
> pub struct EventCaptureLayer {
>     pub logs: Arc<Mutex<Vec<String>>>,
> }
> 
> impl EventCaptureLayer {
>     pub fn new(logs: Arc<Mutex<Vec<String>>>) -> Self {
>         Self { logs }
>     }
> }
> 
> impl<S: Subscriber> Layer<S> for EventCaptureLayer {
>     fn on_event(&self, event: &Event<'_>, _ctx: Context<'_, S>) {
>         let mut visitor = StringVisitor::default();
>         event.record(&mut visitor);
>         
>         let metadata = event.metadata();
>         let log_entry = format!("[{}] {}", metadata.level(), visitor.message);
>         
>         if let Ok(mut logs) = self.logs.lock() {
>             logs.push(log_entry);
>         }
>     }
> }
> 
> #[derive(Default)]
> struct StringVisitor {
>     message: String,
> }
> 
> impl tracing::field::Visit for StringVisitor {
>     fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
>         if field.name() == "message" {
>             self.message = format!("{:?}", value);
>         }
>     }
> }
> 
> pub fn check_sensor_temperature(sensor_id: u32, temp_celsius: f64) -> &'static str {
>     info!(sensor_id = sensor_id, temp = temp_celsius, "Reading sensor temperature");
> 
>     if temp_celsius > 85.0 {
>         warn!(sensor_id = sensor_id, temp = temp_celsius, "CRITICAL: Sensor temperature exceeded threshold!");
>         "OVERHEAT_WARNING"
>     } else {
>         "NORMAL"
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use tracing_subscriber::Registry;
> 
>     #[test]
>     fn test_normal_temperature_logging() {
>         let captured_logs = Arc::new(Mutex::new(Vec::new()));
>         let capture_layer = EventCaptureLayer::new(captured_logs.clone());
>         let subscriber = Registry::default().with(capture_layer);
> 
>         tracing::subscriber::with_default(subscriber, || {
>             let status = check_sensor_temperature(101, 45.5);
>             assert_eq!(status, "NORMAL");
>         });
> 
>         let logs = captured_logs.lock().unwrap();
>         assert_eq!(logs.len(), 1);
>         assert!(logs[0].contains("INFO"));
>         assert!(logs[0].contains("Reading sensor temperature"));
>     }
> 
>     #[test]
>     fn test_overheat_warning_logging() {
>         let captured_logs = Arc::new(Mutex::new(Vec::new()));
>         let capture_layer = EventCaptureLayer::new(captured_logs.clone());
>         let subscriber = Registry::default().with(capture_layer);
> 
>         tracing::subscriber::with_default(subscriber, || {
>             let status = check_sensor_temperature(102, 92.3);
>             assert_eq!(status, "OVERHEAT_WARNING");
>         });
> 
>         let logs = captured_logs.lock().unwrap();
>         assert_eq!(logs.len(), 2); // 1 info, 1 warn
>         assert!(logs[1].contains("WARN"));
>         assert!(logs[1].contains("CRITICAL: Sensor temperature exceeded threshold!"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Custom Telemetry Layers (`tracing_subscriber::Layer`)**: By implementing `Layer`, you build composable subscriber pipeline components. `on_event` is called whenever a log event (`info!`, `warn!`, `error!`) is dispatched.
> 2. **Field Visitor Pattern (`tracing::field::Visit`)**: Struct fields attached to tracing events are opaque. The visitor pattern inspects structured key-value payloads dynamically without allocating strings unless required.
> 3. **Thread-Safe Log Capture (`Arc<Mutex<Vec<String>>>`)**: Shares an in-memory buffer across worker threads while preserving safety under concurrent telemetry events.
> 4. **Scoped Subscriber Testing (`tracing::subscriber::with_default`)**: Sets the subscriber only for the execution duration of a test closure. This isolates subscriber state and prevents race conditions when running tests in parallel (`cargo test`).
> 
---

### Exercise 3: Hierarchical Parent-Child Spans & Hardware Diagnostic Sweeps

**Scenario:** In an embedded edge gateway device, hardware diagnostics require running a multi-stage component sweep. Each sweep creates an overall root context (`hardware_sweep`) that encompasses individual child component diagnostic operations (`sensor_diagnostics`).

Implement a structured diagnostic sweep function `perform_hardware_sweep(sweep_id: u64, sensors: &[SensorDevice]) -> SweepSummary`:
1. Create a root span `hardware_sweep` with `Level::INFO`, capturing `sweep_id` and `component_count`.
2. Enter the root span so child operations inherit parent context.
3. For each sensor component, create and enter a child span `sensor_diagnostics` recording `sensor_name` and `bus_address`.
4. Validate `sensor.reading`: if `< 0.0` or `> 100.0`, emit an `error!` event and count it as a failure; otherwise emit an `info!` event and count it as a pass.
5. Return a `SweepSummary` struct containing `total_tested`, `passed_count`, and `failed_count`.
6. Write unit tests with assertions (`assert_eq!`) verifying summary statistics under all-pass and mixed-failure sensor conditions.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use tracing::{span, Level, info, error};
> 
> #[derive(Debug, Clone)]
> pub struct SensorDevice {
>     pub name: &'static str,
>     pub bus_address: u8,
>     pub reading: f64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct SweepSummary {
>     pub total_tested: usize,
>     pub passed_count: usize,
>     pub failed_count: usize,
> }
> 
> pub fn perform_hardware_sweep(sweep_id: u64, sensors: &[SensorDevice]) -> SweepSummary {
>     let root_span = span!(
>         Level::INFO,
>         "hardware_sweep",
>         sweep_id = sweep_id,
>         component_count = sensors.len()
>     );
>     let _root_guard = root_span.enter();
> 
>     info!("Starting hardware diagnostic sweep");
> 
>     let mut passed = 0;
>     let mut failed = 0;
> 
>     for sensor in sensors {
>         let child_span = span!(
>             Level::DEBUG,
>             "sensor_diagnostics",
>             sensor_name = sensor.name,
>             bus_address = format_args!("0x{:02X}", sensor.bus_address)
>         );
>         let _child_guard = child_span.enter();
> 
>         info!(reading = sensor.reading, "Evaluating sensor data");
> 
>         if sensor.reading < 0.0 || sensor.reading > 100.0 {
>             error!(
>                 reading = sensor.reading,
>                 "Sensor out of operational range [0.0, 100.0]"
>             );
>             failed += 1;
>         } else {
>             info!("Sensor diagnostic check PASSED");
>             passed += 1;
>         }
>     }
> 
>     info!(
>         passed = passed,
>         failed = failed,
>         "Completed hardware diagnostic sweep"
>     );
> 
>     SweepSummary {
>         total_tested: sensors.len(),
>         passed_count: passed,
>         failed_count: failed,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_all_sensors_pass() {
>         let sensors = vec![
>             SensorDevice { name: "temp_core", bus_address: 0x48, reading: 42.5 },
>             SensorDevice { name: "accel_z", bus_address: 0x68, reading: 9.81 },
>         ];
> 
>         let summary = perform_hardware_sweep(1001, &sensors);
>         assert_eq!(summary, SweepSummary {
>             total_tested: 2,
>             passed_count: 2,
>             failed_count: 0,
>         });
>     }
> 
>     #[test]
>     fn test_sensor_out_of_bounds_failure() {
>         let sensors = vec![
>             SensorDevice { name: "temp_core", bus_address: 0x48, reading: 120.0 }, // invalid > 100.0
>             SensorDevice { name: "pressure_bar", bus_address: 0x76, reading: -5.0 }, // invalid < 0.0
>             SensorDevice { name: "humidity", bus_address: 0x40, reading: 55.0 }, // valid
>         ];
> 
>         let summary = perform_hardware_sweep(1002, &sensors);
>         assert_eq!(summary.total_tested, 3);
>         assert_eq!(summary.passed_count, 1);
>         assert_eq!(summary.failed_count, 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Parent-Child Span Relationships**: When `child_span` is created while `_root_guard` is active, `tracing` automatically links `child_span` to `root_span` as its parent. Submitting logs inside `child_span` inherits parent metadata (`sweep_id`).
> 2. **RAII Scope Management (`enter()`)**: `span.enter()` returns a guard (`Entered`). As long as `_root_guard` or `_child_guard` remains in scope, that span is active on the current thread. Dropping the guard exits the span.
> 3. **Structured Field Formatting (`format_args!`)**: Key-value metadata on spans support dynamic formatting like `format_args!("0x{:02X}", address)` without needing allocation.
> 4. **Deterministic Diagnostics Testing**: Combining structured telemetry with return types (`SweepSummary`) allows both runtime diagnostic capturing and unit test assertion via `assert_eq!`.
> 
---


## 6. Related Terms

- None!

---

## 7. Key Takeaways

- `tracing` is the structured, async-aware logging and diagnostics framework for Rust.
- Uses **Spans** (time-bounded contexts with key-value data) and **Events** (log statements).
- Annotate functions with `#[instrument]` to auto-log input parameters and track async execution across `.await` points.
- Always call `tracing_subscriber::fmt::init()` in `main()` to register a log subscriber.
