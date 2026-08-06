# Attribute Macros

> **Level 12 — Macros**
> Procedural macros defined with `#[proc_macro_attribute]` that create custom outer attributes to transform functions, structs, enums, modules, or statements.

---

## 1. Prerequisites


- [Procedural Macros](procedural_macros.md) — Understanding compile-time Rust code transformation function definitions and proc-macro crate requirements.
- [Token Stream](token_stream.md) — The input (`attr` and `item`) and output token sequences (`proc_macro::TokenStream`) manipulated by procedural attribute macros.
- [Attributes (`#[...]`)](../level_07/attributes.md) — Basic syntax and mechanics of built-in attributes like `#[inline]`, `#[test]`, and `#[allow(...)]`.

---

## 2. Term Category



**Rust Procedural Macro (custom item attribute code generator)**: Attribute Macros are a specific flavor of procedural macros in Rust. Unlike derive macros (which can only generate *additional* code alongside structs, enums, or unions), attribute macros can attach to almost any item (functions, structs, modules, trait definitions, and statements), consume both the attribute arguments and the target item, and completely rewrite, wrap, or replace the item in place.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In JavaScript and TypeScript, cross-cutting concerns (like logging, authentication checks, performance tracing, or route handling) are often implemented using ECMAScript Decorators (`@decorator`) or higher-order functions. However, JavaScript decorators wrapped functions at runtime, introducing dynamic dispatch overhead and binding risks.

Rust needed a way to provide decorator-like syntax with:
1. **Zero Runtime Overhead**: Transformations happen entirely at compile time.
2. **Item Mutability / Replacement**: The ability to inspect, modify, or completely wrap existing function bodies or struct declarations (which Derive macros cannot do, as Derive macros are strictly append-only).
3. **Attribute Parameter Parsing**: The ability to pass custom configurations directly within the attribute declaration (e.g., `#[route(GET, path = "/api/v1/users")]`).

Attribute macros solve this by receiving *two* `TokenStream` parameters:
- `attr`: The arguments passed inside the attribute parentheses (e.g., `GET, path = "/api/v1/users"`).
- `item`: The full code definition of the item the attribute is attached to (e.g., the `async fn handle_request() { ... }`).

The macro can parse both token streams, generate wrapped or rewritten code, and return the new combined `TokenStream`.

### (2) Reality Metaphor

Imagine a **Security Guard Wrapper at a VIP Entrance**:

- A **Derive Macro** is like giving a guest an extra badge (**appending a trait implementation**): the guest walks in wearing their original clothes, but now holds an extra ID card.
- An **Attribute Macro** is like a security checkpoint team that takes the guest (**the function definition**), inspects their parameters and identity (**reads `attr` and `item`**), dresses them in a protective suit with logging radios and bodyguards (**wraps the function with logging/tracing boilerplate**), and sends this newly equipped security team (**transformed `TokenStream`**) into the event building in place of the original unguarded guest.

### (3) Code Examples

#### Short Snippet (Conceptual Proc-Macro Attribute Definition)

*Note: Must be defined in a dedicated crate with `proc-macro = true` in `Cargo.toml`.*

```rust
// In proc_macro_crate/src/lib.rs:
use proc_macro::TokenStream;

/// A custom attribute macro that transforms a target function.
/// `attr` receives token parameters passed inside `#[my_log(...)]`.
/// `item` receives the full function definition token stream.
#[proc_macro_attribute]
pub fn my_log(attr: TokenStream, item: TokenStream) -> TokenStream {
    // For demonstration, we simply pass through the original item un-modified.
    // In real macros, `syn` and `quote` are used to inspect and wrap `item`.
    println!("Macro attribute args: {}", attr.to_string());
    item
}
```

#### Fuller Example (Consuming `#[tokio::main]` Async Entrypoint Attribute)

```rust
// In user application:
// The `#[tokio::main]` attribute macro rewrites the `async fn main()` function
// into a standard synchronous `fn main()` that initializes the Tokio async runtime,
// enters the runtime context, and executes the async block block_on style.

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Initializing async background worker...");

    let task_handle = tokio::spawn(async {
        // Simulated async task work
        42
    });

    let result = task_handle.await?;
    println!("Task completed with result: {}", result);

    Ok(())
}

/* 
   Under the hood, `#[tokio::main]` transforms the above code at compile time into:

   fn main() -> Result<(), Box<dyn std::error::Error>> {
       tokio::runtime::Builder::new_multi_thread()
           .enable_all()
           .build()
           .unwrap()
           .block_on(async {
               println!("Initializing async background worker...");
               let task_handle = tokio::spawn(async { 42 });
               let result = task_handle.await?;
               println!("Task completed with result: {}", result);
               Ok(())
           })
   }
*/
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Original Item Code to Persist when Not Returned in TokenStream

**The mistake:** Forgetting that attribute macros *replace* the target item rather than simply appending to it.

**Why it's wrong:** Unlike derive macros (which keep the struct/enum unchanged and only add new `impl` blocks), attribute macros discard the original item unless the returned `TokenStream` explicitly includes or reconstructs it.

*Incorrect:*
```rust
// In proc_macro_crate:
#[proc_macro_attribute]
pub fn trace_execution(_attr: TokenStream, _item: TokenStream) -> TokenStream {
    // ❌ Returning only generated helper code discards the original function entirely!
    "fn helper() {}".parse().unwrap()
}
```

*Fix:*
```rust
// In proc_macro_crate:
#[proc_macro_attribute]
pub fn trace_execution(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Correct: return transformed code that retains or wraps the original `item`
    item
}
```

### Mistake 2: Signature Mismatches when Signature-Modifying Attribute Macros Interact

**The mistake:** Applying multiple attribute macros in an incompatible order where one macro changes function signatures (e.g. converting `async fn` to `fn`) and a second attribute macro expects the original signature.

**Why it's wrong:** Attribute macros execute top-to-bottom (outer-to-inner). The output of the top attribute macro becomes the `item` input for the attribute macro below it.

*Incorrect:*
```rust
// Order matters! If macro_a expects an `async fn` but macro_b rewrites it into a sync `fn`:
#[macro_b_sync_converter]
#[macro_a_requires_async] // ❌ Fails because macro_a now receives a sync `fn` emitted by macro_b
async fn process() {}
```

*Fix:*
```rust
// Ensure outer-to-inner execution order matches macro expectations
#[macro_a_requires_async]
#[macro_b_sync_converter]
async fn process() {}
```

### Mistake 3: Confusing Derive Macro Syntax with Attribute Macro Syntax

**The mistake:** Attempting to invoke an attribute macro using `#[derive(MyAttribute)]` instead of `#[MyAttribute]`.

**Why it's wrong:** Derive macros are invoked strictly via `#[derive(...)]` and only target structs/enums/unions. Attribute macros are invoked directly as outer attributes `#[my_attribute(...)]`.

*Incorrect:*
```rust
#[derive(tokio::main)] // ❌ Error: `tokio::main` is an attribute macro, not a derive macro
async fn main() {}
```

*Fix:*
```rust
#[tokio::main] // Correct invocation for attribute macro
async fn main() {}
```

---

## 5. Practice Exercises

### Exercise 1: Embedded Telemetry Execution Tracing Attribute Macro

**Scenario:** In an embedded IoT system monitoring industrial sensor telemetry, functions such as `read_sensor_adc` need automated execution timing, call counting, and metric tracking without cluttering core control logic with boilerplate code.
Design an attribute macro pattern `#[trace_execution(target = "ADC_SENSOR")]` that intercepts function invocation, records execution tick duration, updates global telemetry metrics, and returns the original function result intact. Provide the macro parsing structure (using `syn`/`quote` token processing concepts) alongside the complete expanded, compilable Rust code and unit tests with assertions (`assert_eq!`, `assert!`) demonstrating correctness.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> // Proc-macro crate definition (proc_macro_crate/src/lib.rs):
> /*
> use proc_macro::TokenStream;
> use quote::quote;
> use syn::{parse_macro_input, ItemFn};
>
> #[proc_macro_attribute]
> pub fn trace_execution(attr: TokenStream, item: TokenStream) -> TokenStream {
>     let input_fn = parse_macro_input!(item as ItemFn);
>     let fn_vis = &input_fn.vis;
>     let fn_sig = &input_fn.sig;
>     let fn_name = &input_fn.sig.ident;
>     let fn_body = &input_fn.block;
>
>     let expanded = quote! {
>         #fn_vis #fn_sig {
>             let start_ticks = GLOBAL_TELEMETRY.read_ticks();
>             let inner_body = || #fn_body;
>             let result = inner_body();
>             let elapsed = GLOBAL_TELEMETRY.read_ticks().saturating_sub(start_ticks);
>             GLOBAL_TELEMETRY.record_call(stringify!(#fn_name), elapsed);
>             result
>         }
>     };
>     TokenStream::from(expanded)
> }
> */
>
> // Complete compilable target code resulting from macro expansion:
> use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
>
> pub struct TelemetryTracker {
>     pub total_calls: AtomicUsize,
>     pub simulated_ticks: AtomicU64,
>     pub last_elapsed_ticks: AtomicU64,
> }
>
> impl TelemetryTracker {
>     pub const fn new() -> Self {
>         Self {
>             total_calls: AtomicUsize::new(0),
>             simulated_ticks: AtomicU64::new(1000),
>             last_elapsed_ticks: AtomicU64::new(0),
>         }
>     }
>
>     pub fn read_ticks(&self) -> u64 {
>         self.simulated_ticks.load(Ordering::SeqCst)
>     }
>
>     pub fn advance_ticks(&self, ticks: u64) {
>         self.simulated_ticks.fetch_add(ticks, Ordering::SeqCst);
>     }
>
>     pub fn record_call(&self, _fn_name: &str, elapsed: u64) {
>         self.total_calls.fetch_add(1, Ordering::SeqCst);
>         self.last_elapsed_ticks.store(elapsed, Ordering::SeqCst);
>     }
> }
>
> pub static GLOBAL_TELEMETRY: TelemetryTracker = TelemetryTracker::new();
>
> // Transformed function output generated by #[trace_execution(target = "ADC_SENSOR")]
> pub fn read_sensor_adc(channel: u8) -> Result<u16, &'static str> {
>     let start_ticks = GLOBAL_TELEMETRY.read_ticks();
>     
>     let inner_body = || -> Result<u16, &'static str> {
>         if channel > 16 {
>             return Err("Invalid ADC channel");
>         }
>         GLOBAL_TELEMETRY.advance_ticks(45); // Simulate hardware conversion delay
>         Ok(512 + (channel as u16 * 10))
>     };
>
>     let result = inner_body();
>     let elapsed = GLOBAL_TELEMETRY.read_ticks().saturating_sub(start_ticks);
>     GLOBAL_TELEMETRY.record_call("read_sensor_adc", elapsed);
>     result
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_trace_execution_successful_read() {
>         let initial_calls = GLOBAL_TELEMETRY.total_calls.load(Ordering::SeqCst);
>         
>         let sample = read_sensor_adc(4).expect("Valid channel should return ADC value");
>         
>         assert_eq!(sample, 552);
>         assert_eq!(
>             GLOBAL_TELEMETRY.total_calls.load(Ordering::SeqCst),
>             initial_calls + 1
>         );
>         assert_eq!(GLOBAL_TELEMETRY.last_elapsed_ticks.load(Ordering::SeqCst), 45);
>     }
>
>     #[test]
>     fn test_trace_execution_error_handling() {
>         let initial_calls = GLOBAL_TELEMETRY.total_calls.load(Ordering::SeqCst);
>         let err = read_sensor_adc(99).unwrap_err();
>         
>         assert_eq!(err, "Invalid ADC channel");
>         assert_eq!(
>             GLOBAL_TELEMETRY.total_calls.load(Ordering::SeqCst),
>             initial_calls + 1
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **TokenStream Arguments**: Attribute macros receive two input streams: `attr` (capturing attribute parameters like `target = "ADC_SENSOR"`) and `item` (capturing the AST of `fn read_sensor_adc(...)`).
> 2. **AST Parsing via `syn`**: `syn::parse_macro_input!(item as ItemFn)` deconstructs the function into visibility (`vis`), signature (`sig`), identifier (`ident`), and body block (`block`).
> 3. **Body Rewriting via `quote!`**: Unlike derive macros which can only append new `impl` blocks, attribute macros replace the target item completely. The macro synthesizes a wrapper function block that captures start ticks before invoking `#fn_body` and logs elapsed metrics to `GLOBAL_TELEMETRY` before returning `#result`.
> 4. **Zero-Cost Abstraction**: Execution tracing logic is woven directly into the function call site at compile time, eliminating dynamic function pointers and runtime vtable dispatch.
> 
---

### Exercise 2: API Gateway Rate-Limiting Route Decorator

**Scenario:** In a web microservice, public API routes must enforce quota rate limiting (e.g., maximum 3 requests per IP key) to prevent denial-of-service or credential brute-forcing.
Design an attribute macro `#[rate_limit(max_requests = 3)]` that parses attribute quota configurations from `attr`, inspects route handler `item`, and wraps the function so that calling `fetch_user_profile(client_ip: &str, user_id: u64)` evaluates client quota against a thread-safe rate limiter before executing the handler. If quota is exceeded, the rewritten function returns `Err(ApiError::RateLimitExceeded)` immediately.
Provide the procedural macro definition pattern, complete compilable Rust code, and unit tests with assertions (`assert_eq!`, `assert!`) verifying rate limiting enforcement.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> // Proc-macro crate definition (proc_macro_crate/src/lib.rs):
> /*
> #[proc_macro_attribute]
> pub fn rate_limit(attr: TokenStream, item: TokenStream) -> TokenStream {
>     // 1. Parse max_requests parameter from `attr` token stream
>     // 2. Parse handler function syntax tree from `item` token stream
>     // 3. Emit wrapped function injecting ROUTE_LIMITER.check_and_consume(...)
> }
> */
>
> // Transformed compilable Rust code:
> use std::collections::HashMap;
> use std::sync::Mutex;
>
> #[derive(Debug, PartialEq, Eq)]
> pub enum ApiError {
>     RateLimitExceeded,
>     UserNotFound,
> }
>
> pub struct RateLimiter {
>     quota: u32,
>     store: Mutex<HashMap<String, u32>>,
> }
>
> impl RateLimiter {
>     pub fn new(quota: u32) -> Self {
>         Self {
>             quota,
>             store: Mutex::new(HashMap::new()),
>         }
>     }
>
>     pub fn check_and_consume(&self, key: &str) -> bool {
>         let mut map = self.store.lock().unwrap();
>         let count = map.entry(key.to_string()).or_insert(0);
>         if *count < self.quota {
>             *count += 1;
>             true
>         } else {
>             false
>         }
>     }
>
>     pub fn reset(&self, key: &str) {
>         let mut map = self.store.lock().unwrap();
>         map.remove(key);
>     }
> }
>
> pub static ROUTE_LIMITER: std::sync::LazyLock<RateLimiter> =
>     std::sync::LazyLock::new(|| RateLimiter::new(3));
>
> // Transformed route function output generated by #[rate_limit(max_requests = 3)]
> pub fn fetch_user_profile(client_ip: &str, user_id: u64) -> Result<String, ApiError> {
>     // Early return injected by attribute macro: check rate limit quota
>     if !ROUTE_LIMITER.check_and_consume(client_ip) {
>         return Err(ApiError::RateLimitExceeded);
>     }
>
>     // Original route handler body
>     if user_id == 0 {
>         return Err(ApiError::UserNotFound);
>     }
>     Ok(format!("User Profile Data for ID: {}", user_id))
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_rate_limit_allows_under_quota() {
>         let ip = "192.168.1.50";
>         ROUTE_LIMITER.reset(ip);
>
>         // First 3 requests must succeed
>         assert!(fetch_user_profile(ip, 101).is_ok());
>         assert!(fetch_user_profile(ip, 102).is_ok());
>         
>         let third_res = fetch_user_profile(ip, 103);
>         assert_eq!(third_res, Ok("User Profile Data for ID: 103".to_string()));
>     }
>
>     #[test]
>     fn test_rate_limit_blocks_overflow() {
>         let ip = "10.0.0.1";
>         ROUTE_LIMITER.reset(ip);
>
>         // Exhaust allowed 3 request quota
>         for i in 1..=3 {
>             assert!(fetch_user_profile(ip, i).is_ok());
>         }
>
>         // 4th request must be rejected with RateLimitExceeded
>         let overflow_res = fetch_user_profile(ip, 999);
>         assert_eq!(overflow_res, Err(ApiError::RateLimitExceeded));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Attribute Token Parsing**: Attribute arguments (`attr`) are parsed into custom macro configuration values (`max_requests = 3`), configuring security limits at compile time.
> 2. **Short-Circuit Early Return Control Flow**: The attribute macro replaces the handler body with early-checking control flow (`if !LIMITER.check_and_consume(...) { return Err(...); }`). If quota checks fail, execution returns immediately without expending CPU resources on business logic.
> 3. **Preserving Return Types**: The transformed function retains its exact parameter signature (`client_ip: &str`, `user_id: u64`) and error return types (`Result<String, ApiError>`), integrating seamlessly with web framework registries.
> 4. **Declarative Metadata Mapping**: Attribute macros act as declarative metadata annotations that attach imperative runtime guard logic to endpoints cleanly.
> 
---

### Exercise 3: Memory-Mapped Hardware Register Attribute Macro

**Scenario:** In `#![no_std]` microcontroller embedded driver development, hardware peripheral control registers reside at fixed physical memory addresses (e.g. USART control register at address `0x4000_1000`). Performing raw pointer arithmetic and bit shifts (`0x1 << 4`) manually is unsafe and error-prone.
Design an attribute macro `#[register_mapped(address = 0x4000_1000)]` attached to a struct `UsartControlReg` that consumes struct field definitions and generates atomic bitfield manipulation accessors (`set_enable()`, `set_baud_prescaler()`).
Provide the macro AST generation design, full compilable Rust code simulating memory-mapped hardware access, and unit tests with assertions (`assert_eq!`, `assert!`) verifying bitmasking and register field operations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> // Proc-macro crate definition (proc_macro_crate/src/lib.rs):
> /*
> #[proc_macro_attribute]
> pub fn register_mapped(attr: TokenStream, item: TokenStream) -> TokenStream {
>     // 1. Parse base physical address from `attr`: address = 0x4000_1000
>     // 2. Parse target struct item (syn::ItemStruct)
>     // 3. Emit pointer wrapper struct and bitfield accessor methods
> }
> */
>
> // Transformed compilable Rust code:
> #![allow(dead_code)]
> use std::sync::atomic::{AtomicU32, Ordering};
>
> // Mock physical memory hardware register location for testing
> pub static MOCK_USART_HW_REG: AtomicU32 = AtomicU32::new(0);
>
> // Hardware Register interface emitted by #[register_mapped(address = 0x4000_1000)]
> pub struct UsartControlReg {
>     address: *mut u32,
> }
>
> impl UsartControlReg {
>     // Bitfield mask and shift constants generated from struct field annotations
>     pub const ENABLE_BIT: u32 = 0;       // Bit 0: Peripheral Enable
>     pub const TX_INT_BIT: u32 = 1;       // Bit 1: TX Interrupt Enable
>     pub const BAUD_SHIFT: u32 = 4;       // Bits 4..7: Baud Prescaler
>     pub const BAUD_MASK: u32 = 0x0F;
>
>     pub fn new(address: *mut u32) -> Self {
>         Self { address }
>     }
>
>     /// Safely read full 32-bit register value
>     pub fn read(&self) -> u32 {
>         // In embedded #![no_std] code: unsafe { core::ptr::read_volatile(self.address) }
>         MOCK_USART_HW_REG.load(Ordering::SeqCst)
>     }
>
>     /// Safely write full 32-bit register value
>     pub fn write(&self, val: u32) {
>         // In embedded #![no_std] code: unsafe { core::ptr::write_volatile(self.address, val) }
>         MOCK_USART_HW_REG.store(val, Ordering::SeqCst);
>     }
>
>     /// Set peripheral enable bit (Bit 0)
>     pub fn set_enable(&self, enabled: bool) {
>         let mut reg = self.read();
>         if enabled {
>             reg |= 1 << Self::ENABLE_BIT;
>         } else {
>             reg &= !(1 << Self::ENABLE_BIT);
>         }
>         self.write(reg);
>     }
>
>     /// Set baud rate prescaler (Bits 4..7)
>     pub fn set_baud_prescaler(&self, prescaler: u8) {
>         let mut reg = self.read();
>         let val_masked = ((prescaler as u32) & Self::BAUD_MASK) << Self::BAUD_SHIFT;
>         reg &= !(Self::BAUD_MASK << Self::BAUD_SHIFT);
>         reg |= val_masked;
>         self.write(reg);
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_register_enable_bit() {
>         let reg = UsartControlReg::new(&MOCK_USART_HW_REG as *const _ as *mut u32);
>         MOCK_USART_HW_REG.store(0, Ordering::SeqCst);
>
>         reg.set_enable(true);
>         assert_eq!(reg.read(), 0b0000_0001);
>         assert_eq!(MOCK_USART_HW_REG.load(Ordering::SeqCst) & 1, 1);
>
>         reg.set_enable(false);
>         assert_eq!(reg.read(), 0b0000_0000);
>     }
>
>     #[test]
>     fn test_register_baud_prescaler_field() {
>         let reg = UsartControlReg::new(&MOCK_USART_HW_REG as *const _ as *mut u32);
>         MOCK_USART_HW_REG.store(0, Ordering::SeqCst);
>
>         // Set prescaler to 0xA (1010 binary), shifted to bits 4..7 -> 0xA0
>         reg.set_baud_prescaler(0x0A);
>         assert_eq!(reg.read(), 0x0000_00A0);
>
>         // Ensure prescaler bitfield is preserved when setting enable bit
>         reg.set_enable(true);
>         assert_eq!(reg.read(), 0x0000_00A1);
>         assert_eq!((reg.read() >> 4) & 0x0F, 0x0A);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Targeting Structs**: Attribute macros can be applied to structs (`syn::ItemStruct`) as well as functions. The macro parses struct fields to extract bitfield offsets and access properties.
> 2. **Replacing Data Layouts**: The attribute macro replaces the original struct declaration with a hardware register pointer wrapper equipped with bit masking constants and accessor methods.
> 3. **Encapsulating Unsafe Pointer Access**: Volatile memory reads and writes require `unsafe` blocks. Attribute macros encapsulate unsafe pointer dereferencing within safe, strongly-typed Rust helper methods (`set_enable`, `set_baud_prescaler`), preventing low-level safety bugs in user code.
> 4. **Compile-Time Hardware Address Binding**: Attributes passed via `attr` (`address = 0x4000_1000`) bind target memory locations at compile time, generating zero-overhead register abstractions.
> 
---

## 6. Related Terms


- [Procedural Macros](procedural_macros.md) — The parent macro category encompassing attribute, derive, and function-like macros.
- [Derive Macros](derive_macros.md) — Append-only procedural macros for auto-implementing traits on structs/enums.
- [Function-like Macros](function_like_macros.md) — Procedural macros invoked like function calls using bang syntax (`!`).
- [Token Stream](token_stream.md) — Compiler token stream representations processed by macro functions.

---

## 7. Key Takeaways

- Attribute Macros are procedural macros defined with `#[proc_macro_attribute]`.
- They are invoked as outer attributes `#[my_macro(...)]` directly on functions, structs, modules, or statements.
- They accept two inputs: `attr` (the attribute arguments) and `item` (the target item definition).
- Unlike derive macros, attribute macros can replace, wrap, or rewrite the target item completely at compile time.
