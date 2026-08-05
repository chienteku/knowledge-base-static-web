# Type-State Pattern

> **Level 14 — Advanced Traits & Type System**
> An API design pattern that encodes the state machine lifecycle of a system directly into Rust's type system using generic marker types, enforcing state transition rules at compile time and making invalid state operations unrepresentable.

---

## 1. Prerequisites


- [Marker Traits](marker_traits.md) — Traits with empty bodies used to categorize types.
- [`ZSTs` (Zero-Sized Types)](../level_11/zsts.md) — Types that occupy 0 bytes of memory used as state tags.
- [Generics (`<T>`)](../level_04/generics.md) — Generic parameters (`struct Machine<State>`).

---

## 2. Term Category

**Pattern / Architecture / Type System**: The Type-State Pattern is an architectural design pattern in Rust. Instead of storing an enum field or boolean flag (`struct Connection { state: ConnectionState }`) and checking state at runtime with `if self.state == Connected`, the state is represented as a static generic parameter (`Connection<Disconnected>`, `Connection<Connected>`). Methods are implemented *only* for specific state parameters, forcing state transitions to consume `self` and return a new state struct.

---

## 3. Environment Context

**Universal Rust**: The Type-State Pattern is supported across all Rust targets (`std`, `no_std`, WASM, embedded). It is heavily used in embedded driver crates (`embedded-hal` GPIO pins `Pin<Input>`, `Pin<Output>`), network client handshakes (`hyper`, `reqwest`), and builder patterns (`CommandBuilder<NeedsProgram>`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a multi-step workflow like an HTTP Client, a File Writer, or a Database Transaction:

In runtime state machines:
```rust
struct FileStream {
    is_open: bool,
    is_authenticated: bool,
}

impl FileStream {
    fn write_data(&mut self, data: &[u8]) -> Result<(), Error> {
        if !self.is_open || !self.is_authenticated {
            return Err(Error::InvalidState); // ❌ Runtime Error!
        }
        // ...
    }
}
```

This runtime approach has severe drawbacks:
1. **Runtime Panics / Error Checking Overhead**: Every method call must check state flags at runtime. If a developer forgets a check, the program panics or enters invalid states at runtime.
2. **Resource Leaks & Misuse**: Callers can mistakenly call `write_data()` before `open()`, or call `close()` twice.

Rust's **Type-State Pattern** moves state machine validation from **Runtime** to **Compile Time**:
- You define zero-sized marker types for each state (`Disconnected`, `Connected`, `Authenticated`).
- You define a generic struct `FileStream<State>`.
- You implement `write_data()` ONLY on `FileStream<Authenticated>`.

Now, if a developer tries to call `write_data()` on a `FileStream<Disconnected>`, the compiler refuses to compile the code with error `E0599` ("no method named `write_data` found for `FileStream<Disconnected>`")! **Invalid state operations become completely unrepresentable.**

### (2) Reality Metaphor

Imagine a **Security Airlock Chamber with Keycard Access**:

- **Runtime State Check**: A door with a sign that says "Do not open unless light is green". If a distracted worker turns the door handle while the light is red, the alarm blares (**runtime error/panic**).
- **Type-State Pattern**: A physical mechanical interlocking key mechanism:
  - The physical key labeled "Outer Door Key" (**`State = OuterOpen`**) physically CANNOT fit into the slot for the Inner Pressure Valve (**method `write_payload`**).
  - Turning the key to open the outer door physically consumes/traps that key in the wall lock (**consuming `self`**) and dispenses a brand-new "Inner Air Lock Key" (**returning `Connection<InnerOpen>`**).
  - It is physically impossible to turn the inner valve key while standing outside the building (**compile error**).

### (3) Code Examples

#### Short Snippet (Type-State Rocket Launch)

```rust
use std::marker::PhantomData;

// 1. Zero-sized state marker types
pub struct Idle;
pub struct Fueled;
pub struct Launched;

// 2. Generic struct parameterized by State
pub struct Rocket<State> {
    _state: PhantomData<State>,
}

// 3. Methods for Idle state
impl Rocket<Idle> {
    pub fn new() -> Self {
        Rocket { _state: PhantomData }
    }

    // Transition: Idle -> Fueled (consumes self!)
    pub fn fill_fuel(self) -> Rocket<Fueled> {
        println!("Fuel tank filled!");
        Rocket { _state: PhantomData }
    }
}

// 4. Methods for Fueled state
impl Rocket<Fueled> {
    // Transition: Fueled -> Launched (consumes self!)
    pub fn launch(self) -> Rocket<Launched> {
        println!("3.. 2.. 1.. Ignition! Rocket launched!");
        Rocket { _state: PhantomData }
    }
}

fn main() {
    let rocket = Rocket::new(); // Rocket<Idle>
    let fueled_rocket = rocket.fill_fuel(); // Rocket<Fueled>
    let _launched_rocket = fueled_rocket.launch(); // Rocket<Launched>

    // ❌ COMPILER ERROR E0599 if we try to call launch() directly on an Idle rocket:
    // let rocket2 = Rocket::new();
    // rocket2.launch(); 
}
```

#### Fuller Example (HTTP Request Builder Type-State)

```rust
use std::marker::PhantomData;

// State markers
pub struct NoUrl;
pub struct HasUrl;

pub struct HttpRequestBuilder<State> {
    url: Option<String>,
    headers: Vec<(String, String)>,
    _state: PhantomData<State>,
}

impl HttpRequestBuilder<NoUrl> {
    pub fn new() -> Self {
        HttpRequestBuilder {
            url: None,
            headers: Vec::new(),
            _state: PhantomData,
        }
    }

    // Transition: NoUrl -> HasUrl
    pub fn url(self, url: impl Into<String>) -> HttpRequestBuilder<HasUrl> {
        HttpRequestBuilder {
            url: Some(url.into()),
            headers: self.headers,
            _state: PhantomData,
        }
    }
}

impl<State> HttpRequestBuilder<State> {
    pub fn header(mut self, key: impl Into<String>, val: impl Into<String>) -> Self {
        self.headers.push((key.into(), val.into()));
        self
    }
}

// `send()` is ONLY available when URL is set (`HasUrl`)!
impl HttpRequestBuilder<HasUrl> {
    pub fn send(self) -> String {
        format!(
            "Sending HTTP GET to '{}' with {} headers",
            self.url.unwrap(),
            self.headers.len()
        )
    }
}

fn main() {
    let request = HttpRequestBuilder::new()
        .header("User-Agent", "Rust/2026")
        .url("https://api.example.com/v1/data") // Transitions to HasUrl
        .header("Authorization", "Bearer token123")
        .send(); // Legal call!

    println!("{}", request);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Borrowing `&self` Instead of Consuming `self` in State Transitions

**The mistake:** Writing state transition methods taking `&self` or `&mut self` instead of consuming `self` by value.

**Why it's wrong:** If a transition takes `&self`, the original old-state variable remains accessible, allowing callers to re-use the old state or invoke duplicate transitions! State transitions MUST consume `self` by value so the compiler invalidates the old state variable.

*Incorrect:*
```rust
impl Connection<Disconnected> {
    // ❌ Taking `&self` leaves `self` valid in the old Disconnected state!
    pub fn connect(&self) -> Connection<Connected> { ... } 
}
```

*Fix:*
```rust
impl Connection<Disconnected> {
    // Correct: Consumes `self` by value to invalidate old state
    pub fn connect(self) -> Connection<Connected> { ... } 
}
```

### Mistake 2: Storing Dynamic Runtime States inside Type-State Structures

**The mistake:** Trying to use the Type-State pattern when state transitions depend purely on unpredictable runtime user input (e.g., parsing arbitrary JSON web tokens where the state is unknown at compile time).

**Why it's wrong:** The Type-State pattern requires state transitions to be known **statically at compile time**. For purely dynamic runtime states, standard enums (`enum State { A, B }`) are the correct tool.

---

## 6. Practice Exercises

### Exercise 1: Embedded Hardware Driver State Machine (GPIO Pin Control)

**Problem:** In embedded systems (`#![no_std]`), microcontroller GPIO hardware pins can be configured in either `Disabled`, `Input`, or `Output` modes. Reading digital levels is only valid when the pin is in `Input` mode, while toggling high/low output voltage is only valid in `Output` mode. 

Build a `#![no_std]` compatible GPIO pin type-state machine:
1. Define zero-sized marker structs `Disabled`, `Input`, and `Output`.
2. Define struct `GpioPin<State>` containing `pin_id: u8` and `PhantomData<State>`.
3. Implement `GpioPin<Disabled>::new(pin_id: u8) -> Self`.
4. Implement state transitions:
   - `GpioPin<Disabled>::into_input(self) -> GpioPin<Input>`
   - `GpioPin<Disabled>::into_output(self) -> GpioPin<Output>`
   - `GpioPin<Input>::into_disabled(self) -> GpioPin<Disabled>`
   - `GpioPin<Output>::into_disabled(self) -> GpioPin<Disabled>`
5. Implement `read_digital(&self) -> bool` on `GpioPin<Input>`.
6. Implement `set_high(&mut self)` and `set_low(&mut self)` on `GpioPin<Output>`.
7. Write unit tests with assertions (`assert!`, `assert_eq!`) validating output toggling and input reading.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> use core::marker::PhantomData;
> 
> // State marker ZSTs
> pub struct Disabled;
> pub struct Input;
> pub struct Output;
> 
> /// Hardware GPIO Pin generic over compile-time state
> pub struct GpioPin<State> {
>     pin_id: u8,
>     output_high: bool, // Simulates hardware register level
>     _state: PhantomData<State>,
> }
> 
> impl GpioPin<Disabled> {
>     pub fn new(pin_id: u8) -> Self {
>         Self {
>             pin_id,
>             output_high: false,
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn into_input(self) -> GpioPin<Input> {
>         GpioPin {
>             pin_id: self.pin_id,
>             output_high: self.output_high,
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn into_output(self) -> GpioPin<Output> {
>         GpioPin {
>             pin_id: self.pin_id,
>             output_high: self.output_high,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl GpioPin<Input> {
>     pub fn read_digital(&self) -> bool {
>         // Simulated digital read
>         true
>     }
> 
>     pub fn into_disabled(self) -> GpioPin<Disabled> {
>         GpioPin {
>             pin_id: self.pin_id,
>             output_high: self.output_high,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl GpioPin<Output> {
>     pub fn set_high(&mut self) {
>         self.output_high = true;
>     }
> 
>     pub fn set_low(&mut self) {
>         self.output_high = false;
>     }
> 
>     pub fn is_high(&self) -> bool {
>         self.output_high
>     }
> 
>     pub fn into_disabled(self) -> GpioPin<Disabled> {
>         GpioPin {
>             pin_id: self.pin_id,
>             output_high: self.output_high,
>             _state: PhantomData,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_gpio_output_workflow() {
>         let pin = GpioPin::new(12); // GpioPin<Disabled>
>         let mut out_pin = pin.into_output(); // GpioPin<Output>
> 
>         assert!(!out_pin.is_high());
>         out_pin.set_high();
>         assert!(out_pin.is_high());
>         out_pin.set_low();
>         assert!(!out_pin.is_high());
> 
>         let _disabled_again = out_pin.into_disabled();
>     }
> 
>     #[test]
>     fn test_gpio_input_workflow() {
>         let pin = GpioPin::new(5);
>         let in_pin = pin.into_input();
>         assert!(in_pin.read_digital());
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Zero Memory Overhead:** `PhantomData<State>` costs 0 bytes at runtime. The GPIO pin struct contains only primitive fields (`pin_id`, `output_high`).
> 2. **State Transition Safety:** Methods like `into_input(self)` take ownership of `self` by value, consuming the `GpioPin<Disabled>` instance so it can no longer be referenced.
> 3. **Unrepresentable Invalid States:** `GpioPin<Input>` does not define `set_high()`, and `GpioPin<Disabled>` defines neither `read_digital()` nor `set_high()`. Calling inappropriate methods causes a compile-time error (`E0599`).

---

### Exercise 2: Secure TLS Connection Handshake Protocol State Machine

**Problem:** Network client protocols follow a mandatory sequence: `Disconnected` $\rightarrow$ `Handshaking` $\rightarrow$ `Authenticated`. Attempting to send application payload data before authentication must be rejected at compile time. Fallible state transitions (e.g. handshake verification failure) must return `Result<TlsSession<Authenticated>, HandshakeError>` to handle bad security credentials.

Build a TLS session typestate machine:
1. Define state markers `Disconnected`, `Handshaking`, and `Authenticated`.
2. Define `TlsSession<State>` containing `host: String` and `session_token: Option<String>`.
3. Implement `TlsSession<Disconnected>::connect(host: &str) -> TlsSession<Handshaking>`.
4. Implement `TlsSession<Handshaking>::authenticate(self, secret: &str) -> Result<TlsSession<Authenticated>, HandshakeError>`.
5. Implement `send_data(&self, payload: &[u8]) -> usize` ONLY on `TlsSession<Authenticated>`.
6. Write unit tests testing successful handshake lifecycle and authentication error handling (`unwrap_err()`).

> [!check]- Answer
> ```rust
> use std::marker::PhantomData;
> 
> pub struct Disconnected;
> pub struct Handshaking;
> pub struct Authenticated;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum HandshakeError {
>     InvalidSecret,
> }
> 
> pub struct TlsSession<State> {
>     host: String,
>     session_token: Option<String>,
>     _state: PhantomData<State>,
> }
> 
> impl TlsSession<Disconnected> {
>     pub fn connect(host: &str) -> TlsSession<Handshaking> {
>         TlsSession {
>             host: host.to_string(),
>             session_token: None,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl TlsSession<Handshaking> {
>     pub fn authenticate(
>         self,
>         secret: &str,
>     ) -> Result<TlsSession<Authenticated>, HandshakeError> {
>         if secret == "valid_secret_123" {
>             Ok(TlsSession {
>                 host: self.host,
>                 session_token: Some(format!("token_{}", secret)),
>                 _state: PhantomData,
>             })
>         } else {
>             Err(HandshakeError::InvalidSecret)
>         }
>     }
> }
> 
> impl TlsSession<Authenticated> {
>     pub fn send_data(&self, payload: &[u8]) -> usize {
>         // Simulated encrypted transmission
>         payload.len()
>     }
> 
>     pub fn session_token(&self) -> &str {
>         self.session_token.as_deref().unwrap()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_tls_handshake_and_send() {
>         let session = TlsSession::<Disconnected>::connect("api.secure-server.com");
>         let auth_session = session
>             .authenticate("valid_secret_123")
>             .expect("Authentication failed");
> 
>         assert_eq!(auth_session.session_token(), "token_valid_secret_123");
>         let bytes_sent = auth_session.send_data(b"GET /index.html");
>         assert_eq!(bytes_sent, 15);
>     }
> 
>     #[test]
>     fn test_failed_tls_authentication() {
>         let session = TlsSession::<Disconnected>::connect("api.secure-server.com");
>         let err = session.authenticate("bad_secret").unwrap_err();
>         assert_eq!(err, HandshakeError::InvalidSecret);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Fallible Typestate Transitions:** `authenticate(self, secret: &str)` returns a `Result<TlsSession<Authenticated>, HandshakeError>`. If authentication fails, ownership of `TlsSession<Handshaking>` is dropped and no `TlsSession<Authenticated>` instance is produced.
> 2. **Compile-Time Data Protection:** `send_data` is declared exclusively on `TlsSession<Authenticated>`. It is impossible to send unencrypted payload bytes while in the `Disconnected` or `Handshaking` states.

---

### Exercise 3: Financial Transaction Pipeline with State-Specific Payload Carrying

**Problem:** In fintech payment processing, financial transactions progress through distinct states: `Draft` $\rightarrow$ `Approved` $\rightarrow$ `Executed`. Unlike zero-sized marker patterns, each state stage accumulates domain data: `Approved` adds a `manager_signature: String`, and `Executed` adds a `receipt_id: u64`.

Build a data-carrying typestate transaction engine:
1. Define state structs holding state-specific payload fields:
   - `struct DraftData;`
   - `struct ApprovedData { pub manager_signature: String }`
   - `struct ExecutedData { pub manager_signature: String, pub receipt_id: u64 }`
2. Define generic `Transaction<State>` containing `amount: u64`, `sender: String`, `recipient: String`, and `state: State`.
3. Implement `Transaction<DraftData>::new(amount: u64, sender: &str, recipient: &str) -> Result<Self, &'static str>` rejecting zero amounts.
4. Implement `approve(self, signature: &str) -> Result<Transaction<ApprovedData>, &'static str>` on `Transaction<DraftData>`.
5. Implement `execute(self, receipt_id: u64) -> Transaction<ExecutedData>` on `Transaction<ApprovedData>`.
6. Implement `receipt(&self) -> String` ONLY on `Transaction<ExecutedData>`.
7. Write unit tests verifying valid workflow execution, zero-amount rejection, and missing signature rejection.

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct DraftData;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ApprovedData {
>     pub manager_signature: String,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ExecutedData {
>     pub manager_signature: String,
>     pub receipt_id: u64,
> }
> 
> pub struct Transaction<State> {
>     pub amount: u64,
>     pub sender: String,
>     pub recipient: String,
>     pub state: State,
> }
> 
> impl Transaction<DraftData> {
>     pub fn new(amount: u64, sender: &str, recipient: &str) -> Result<Self, &'static str> {
>         if amount == 0 {
>             return Err("Transaction amount must be greater than zero");
>         }
>         Ok(Transaction {
>             amount,
>             sender: sender.to_string(),
>             recipient: recipient.to_string(),
>             state: DraftData,
>         })
>     }
> 
>     pub fn approve(self, signature: &str) -> Result<Transaction<ApprovedData>, &'static str> {
>         if signature.is_empty() {
>             return Err("Manager signature required for approval");
>         }
>         Ok(Transaction {
>             amount: self.amount,
>             sender: self.sender,
>             recipient: self.recipient,
>             state: ApprovedData {
>                 manager_signature: signature.to_string(),
>             },
>         })
>     }
> }
> 
> impl Transaction<ApprovedData> {
>     pub fn execute(self, receipt_id: u64) -> Transaction<ExecutedData> {
>         Transaction {
>             amount: self.amount,
>             sender: self.sender,
>             recipient: self.recipient,
>             state: ExecutedData {
>                 manager_signature: self.state.manager_signature,
>                 receipt_id,
>             },
>         }
>     }
> }
> 
> impl Transaction<ExecutedData> {
>     pub fn receipt(&self) -> String {
>         format!(
>             "RECEIPT #{}: Transferred ${} from {} to {} (Signed by: {})",
>             self.state.receipt_id,
>             self.amount,
>             self.sender,
>             self.recipient,
>             self.state.manager_signature
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_financial_transaction_pipeline() {
>         let draft = Transaction::new(5000, "Alice", "Bob").unwrap();
>         let approved = draft.approve("SIG_MGR_99").unwrap();
>         let executed = approved.execute(88401);
> 
>         let receipt_text = executed.receipt();
>         assert_eq!(
>             receipt_text,
>             "RECEIPT #88401: Transferred $5000 from Alice to Bob (Signed by: SIG_MGR_99)"
>         );
>     }
> 
>     #[test]
>     fn test_zero_amount_rejection() {
>         let res = Transaction::new(0, "Alice", "Bob");
>         assert_eq!(res.err(), Some("Transaction amount must be greater than zero"));
>     }
> 
>     #[test]
>     fn test_empty_signature_rejection() {
>         let draft = Transaction::new(100, "Alice", "Bob").unwrap();
>         let res = draft.approve("");
>         assert_eq!(res.err(), Some("Manager signature required for approval"));
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Data-Carrying Typestates:** Unlike zero-sized marker types, state structs (`ApprovedData`, `ExecutedData`) carry operational data specific to that stage of the lifecycle.
> 2. **Progressive Accumulation:** Transitioning from `ApprovedData` to `ExecutedData` preserves the `manager_signature` field while introducing the `receipt_id` field.
> 3. **Compile-Time Receipt Generation:** Calling `.receipt()` is valid ONLY on `Transaction<ExecutedData>`, guaranteeing that unapproved or unexecuted transactions can never generate a receipt string.

---

## 7. Related Terms


- [Marker Traits](marker_traits.md) — Empty traits used as state bounds.
- [`ZSTs` (Zero-Sized Types)](../level_11/zsts.md) — 0-byte state tag types.
- [Generics (`<T>`)](../level_04/generics.md) — Type parameters parameterizing states.
- [Newtype Pattern](../level_11/newtype_pattern.md) — Domain wrapping pattern.
- [GATs (Generic Associated Types)](gats.md) — Related concept: GATs (Generic Associated Types).
- [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — Related concept: Zero-Cost Abstractions.
- [Builder Pattern](../level_18/builder_pattern.md) — Related concept: Builder Pattern.

---

## 8. Key Takeaways

- The Type-State Pattern encodes state machine lifecycles directly into Rust's static type system (`Struct<State>`).
- State transition methods MUST consume `self` by value to invalidate the previous state variable.
- Invalid state transitions cause compile-time errors (`E0599`) rather than runtime panics.
- Use Zero-Sized Types (`PhantomData<State>`) for pure marker states to achieve 0-byte memory overhead.
- Use data-carrying state structs when specific lifecycle stages accumulate distinct fields.
