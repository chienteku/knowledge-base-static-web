# Lifetime Bounds

> **Level 5 — Lifetimes**
> Constraining generic types or trait objects with lifetime relationships: `T: 'a` or `dyn Trait + 'a`.

---

## 1. Prerequisites


- [Trait Bound](../level_04/trait_bound.md) — Constraining `<T>` with traits.
- [Lifetime (`'a`)](lifetime.md) — Reference scope annotations.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — Dynamic dispatch objects requiring lifetime bounds.

---

## 2. Term Category

**Rust-specific (lifetime constraints on generics & trait objects)**: Just as trait bounds (`T: Display`) constrain generic types to types implementing specific behavior, **Lifetime Bounds** (`T: 'a`, `'b: 'a`, `dyn Trait + 'a`) constrain generic types or trait objects to outlive a specific lifetime parameter `'a`. This guarantees that internal references encapsulated inside generic instances remain strictly valid throughout the target lifecycle.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When creating generic abstractions (`struct Container<'a, T>`) or trait objects (`Box<dyn Trait>`), generic type parameters `T` can potentially contain borrowed references (e.g., `T = &'b str`).

If `T` contains a reference with a lifetime `'b` that expires *before* lifetime `'a`, storing `T` inside a container valid for `'a` would leave a dangling pointer when `'b` ends.

To guarantee memory safety without sacrificing generic abstractions, Rust introduces three forms of **Lifetime Bounds**:
1. **Type Lifetime Bound (`T: 'a`)**: Declares that every reference nested inside generic type `T` must live at least as long as `'a`. Owned types without references (like `i32` or `String`) automatically satisfy `T: 'a` for any `'a`.
2. **Outlives Lifetime Relationship (`'b: 'a`)**: Read as *"'b outlives 'a"*. Declares that lifetime `'b` is greater than or equal to lifetime `'a` in duration.
3. **Trait Object Lifetime Bound (`dyn Trait + 'a`)**: Specifies that dynamic dispatch trait objects cannot encapsulate references with lifespans shorter than `'a`. By default, `Box<dyn Trait>` assumes `Box<dyn Trait + 'static>`.

### (2) Deep Dive — Mechanics of Trait Object Lifetime Defaults

When working with `dyn Trait`, Rust applies implicit default lifetime bounds based on container contexts:

```rust
// Box<dyn Trait> implicitly expands to Box<dyn Trait + 'static>
fn create_static_object() -> Box<dyn Trait> { ... }

// &`a (dyn Trait) implicitly expands to &`a (dyn Trait + 'a)
fn inspect_object<'a>(obj: &'a dyn Trait) { ... }

// Explicit bound needed when Box holds non-static references
fn create_borrowed_object<'a>(data: &'a str) -> Box<dyn Trait + 'a> { ... }
```

### (3) Reality Metaphor

A temperature-controlled pharmaceutical shipping container (`'a`):
- The container voyage across international transit takes 14 days (`'a`).
- If you load generic medical samples (`T`) into the container, every internal perishable chemical compound inside `T` must have a shelf stability of at least 14 days (`T: 'a`).
- If a sample contains a chemical that breaks down in 3 days, it will decompose during transit and ruin the container cargo. `T: 'a` forces the shipper to verify expiration dates before accepting the container shipment.

### (4) Rust Code Examples

#### Short Snippet (`T: 'a` Generic Bound)
```rust
struct RefHolder<'a, T: 'a> {
    item: &'a T,
}
```

#### Outlives Lifetime Bounds (`'b: 'a`)
```rust
struct ExecutionContext<'b>(&'b str);

// Lifetime 'b must outlive lifetime 'a
struct OperationRunner<'a, 'b: 'a> {
    ctx: &'a ExecutionContext<'b>,
}

fn create_runner<'a, 'b: 'a>(ctx: &'a ExecutionContext<'b>) -> OperationRunner<'a, 'b> {
    OperationRunner { ctx }
}

fn main() {
    let global_config = String::from("production_env");
    let ctx = ExecutionContext(&global_config);
    let runner = create_runner(&ctx);
    println!("Runner active for env: {}", runner.ctx.0);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `+ 'a` on Trait Objects Containing Borrowed Data

**The mistake:** Returning `Box<dyn Trait>` from a function that constructs a trait object wrapping borrowed references with lifetime `'a`.

**Why it is wrong:** `Box<dyn Trait>` defaults to `Box<dyn Trait + 'static>`. Storing a reference borrowed for `'a` inside a `'static` trait object violates the default bound and triggers compiler error `E0759` or `E0310`.

*Incorrect:*
```rust
trait Logger { fn log(&self); }
struct PrefixLogger<'a>(&'a str);
impl<'a> Logger for PrefixLogger<'a> { fn log(&self) { println!("{}", self.0); } }

fn make_logger<'a>(prefix: &'a str) -> Box<dyn Logger> { // ❌ Error E0310: defaults to + 'static!
    Box::new(PrefixLogger(prefix))
}
```

*Fix:*
```rust
fn make_logger<'a>(prefix: &'a str) -> Box<dyn Logger + 'a> { // Explicit lifetime bound!
    Box::new(PrefixLogger(prefix))
}
```

### Mistake 2: Reversing Outlives Lifetime Relationship Order (`'a: 'b` vs `'b: 'a`)

**The mistake:** Writing `'a: 'b` when `'b` is required to outlive `'a`.

**Why it is wrong:** `'b: 'a` means *"'b outlives 'a"*. Writing `'a: 'b` asserts that `'a` outlives `'b`, which causes compiler rejection when a shorter lifetime `'a` is assigned to a target expecting longer lifetime `'b`.

*Incorrect:*
```rust
// Intended: reference inside Context ('b) outlives Parser reference ('a)
struct Parser<'a, 'b> where 'a: 'b { // ❌ Reversed! Asserting 'a outlives 'b
    ctx: &'a &'b str,
}
```

*Fix:*
```rust
struct Parser<'a, 'b> where 'b: 'a { // Correct: 'b outlives 'a ('b outlives container)
    ctx: &'a &'b str,
}
```

### Mistake 3: Omitting `T: 'a` Bounds on Generic Structures Holding Reference `&'a T`

**The mistake:** Declaring `struct Container<'a, T> { item: &'a T }` without specifying `T: 'a`.

**Why it is wrong:** If `T` itself contains borrowed references with a lifespan shorter than `'a`, accessing `container.item` can lead to dangling references inside `T`. In modern Rust editions, the compiler often infers simple `T: 'a` bounds on struct fields, but omitting `T: 'a` on generic traits or `where` clauses causes explicit lifetime errors.

*Incorrect:*
```rust
trait Processor<'a, T> {
    fn process(&self, item: &'a T);
}
```

*Fix:*
```rust
trait Processor<'a, T: 'a> { // Explicitly guarantees T lives at least as long as 'a
    fn process(&self, item: &'a T);
}
```

---

## 5. Practice Exercises

### Exercise 1: Real-Time Event Dispatcher with Borrowed Listener Trait Objects

**Scenario:** You are implementing an event routing system for a high-performance GUI framework. Event handlers implement an `EventHandler` trait and borrow short-lived scope configuration state. You must store these handlers inside a `Dispatcher` struct using `Box<dyn EventHandler + 'a>`.

**Requirements:**
1. Define trait `EventHandler` with method `fn handle(&self, event: &str)`.
2. Define a struct `ClosureHandler<'a>` that borrows a prefix string `&'a str`.
3. Define `EventDispatcher<'a>` holding a `Vec<Box<dyn EventHandler + 'a>>`.
4. Write unit tests creating dispatcher instances, adding handlers borrowing local stack variables, and firing events.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait EventHandler {
>     fn handle(&self, event: &str) -> String;
> }
> 
> pub struct PrefixHandler<'a> {
>     pub prefix: &'a str,
> }
> 
> impl<'a> EventHandler for PrefixHandler<'a> {
>     fn handle(&self, event: &str) -> String {
>         format!("{}: {}", self.prefix, event)
>     }
> }
> 
> pub struct EventDispatcher<'a> {
>     handlers: Vec<Box<dyn EventHandler + 'a>>,
> }
> 
> impl<'a> EventDispatcher<'a> {
>     pub fn new() -> Self {
>         Self { handlers: Vec::new() }
>     }
> 
>     pub fn register(&mut self, handler: Box<dyn EventHandler + 'a>) {
>         self.handlers.push(handler);
>     }
> 
>     pub fn dispatch(&self, event: &str) -> Vec<String> {
>         self.handlers.iter().map(|h| h.handle(event)).collect()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_event_dispatcher_lifetime_bounds() {
>         let app_name = String::from("SYSTEM_ALERT");
>         let mut dispatcher = EventDispatcher::new();
>         
>         let handler = PrefixHandler { prefix: &app_name };
>         dispatcher.register(Box::new(handler));
>         
>         let results = dispatcher.dispatch("CPU temperature high");
>         assert_eq!(results, vec!["SYSTEM_ALERT: CPU temperature high"]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Box<dyn EventHandler + 'a>` explicitly overrides the default `'static` trait object bound to allow storing trait implementations that borrow data valid for `'a`.
> 2. `PrefixHandler<'a>` implements `EventHandler` while holding `&'a str`.
> 3. `EventDispatcher<'a>` ensures all contained trait objects remain valid until lifetime `'a` ends.

---

### Exercise 2: Cascading Configuration Parser with Outlives Bounds (`'b: 'a`)

**Scenario:** Build a configuration parser where a `ConfigBuffer<'b>` holds raw file strings, and a `Parser<'a, 'b>` holds a reference `&'a ConfigBuffer<'b>` to parse section tokens. You must use outlives bounds `'b: 'a` to guarantee the underlying text outlives the parser instance.

**Requirements:**
1. Define `struct ConfigBuffer<'b> { text: &'b str }`.
2. Define `struct ConfigParser<'a, 'b: 'a> { buffer: &'a ConfigBuffer<'b> }`.
3. Implement `fn parse_key(&self, key: &str) -> Option<&'b str>` returning string slices tied to `'b`.
4. Write unit tests verifying that parsed value references remain valid after the parser struct is dropped.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct ConfigBuffer<'b> {
>     pub raw_text: &'b str,
> }
> 
> pub struct ConfigParser<'a, 'b: 'a> {
>     pub buffer: &'a ConfigBuffer<'b>,
> }
> 
> impl<'a, 'b: 'a> ConfigParser<'a, 'b> {
>     pub fn new(buffer: &'a ConfigBuffer<'b>) -> Self {
>         Self { buffer }
>     }
> 
>     pub fn parse_key(&self, target_key: &str) -> Option<&'b str> {
>         for line in self.buffer.raw_text.lines() {
>             let mut parts = line.splitn(2, '=');
>             let key = parts.next()?.trim();
>             let value = parts.next()?.trim();
>             if key == target_key {
>                 return Some(value);
>             }
>         }
>         None
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_outlives_bounds() {
>         let config_data = String::from("port=8080\nhost=localhost");
>         let buffer = ConfigBuffer { raw_text: &config_data };
>         
>         let extracted_val: &str = {
>             let parser = ConfigParser::new(&buffer);
>             parser.parse_key("port").unwrap()
>         }; // `parser` drops here, but `extracted_val` carries lifetime `'b` from `buffer`!
>         
>         assert_eq!(extracted_val, "8080");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `'b: 'a` specifies that lifetime `'b` (the raw text buffer) outlives lifetime `'a` (the parser reference).
> 2. `parse_key` returns `Option<&'b str>`, tying the returned slice to the buffer's longer lifetime `'b` rather than the parser's lifetime `'a`.
> 3. The test confirms `extracted_val` remains valid after `parser` is dropped.

---

### Exercise 3: Generic Async Task Payload Context (`T: 'a`)

**Scenario:** Design a generic task wrapper `TaskWrapper<'a, T: 'a>` that holds a reference `&'a T` to arbitrary context structures. Constrain generic type `T` with `T: 'a` to guarantee nested references inside `T` do not expire during task execution.

**Requirements:**
1. Define struct `TaskWrapper<'a, T: 'a>` with fields `id: u64` and `context: &'a T`.
2. Implement method `fn execute<F, R>(&self, f: F) -> R where F: FnOnce(&'a T) -> R`.
3. Write unit tests demonstrating wrapping complex structs containing internal string slices.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct TaskWrapper<'a, T: 'a> {
>     pub id: u64,
>     pub context: &'a T,
> }
> 
> impl<'a, T: 'a> TaskWrapper<'a, T> {
>     pub fn new(id: u64, context: &'a T) -> Self {
>         Self { id, context }
>     }
> 
>     pub fn execute<F, R>(&self, f: F) -> R
>     where
>         F: FnOnce(&'a T) -> R,
>     {
>         f(self.context)
>     }
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct DatabaseContext<'ctx> {
>     pub connection_string: &'ctx str,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;

> 
>     #[test]
>     fn test_generic_task_wrapper_bound() {
>         let conn_str = String::from("postgres://localhost:5432/db");
>         let db_ctx = DatabaseContext { connection_string: &conn_str };
>         
>         let task = TaskWrapper::new(101, &db_ctx);
>         let conn = task.execute(|ctx| ctx.connection_string);
>         
>         assert_eq!(conn, "postgres://localhost:5432/db");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `T: 'a` ensures generic payload `T` (like `DatabaseContext<'ctx>`) does not contain references that expire before `'a`.
> 2. `execute` passes `&'a T` into the closure safely, guaranteeing lifetime consistency across generic abstractions.

---

## 6. Related Terms


- [Lifetime (`'a`)](lifetime.md) — The fundamental annotation.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The dynamic objects requiring `+ 'a` bounds.
- [`where` Clause](../level_04/where_clause.md) — Where complex lifetime bounds can be specified (`where T: 'a + Display`).
- [Struct Lifetimes](struct_lifetimes.md) — Related concept: Struct Lifetimes.

---

## 7. Key Takeaways

- `T: 'a` guarantees that generic type `T` contains no references shorter than `'a`.
- `'b: 'a` means lifetime `'b` outlives (is at least as long as) lifetime `'a`.
- `Box<dyn Trait>` defaults to `Box<dyn Trait + 'static>`.
- Use `Box<dyn Trait + 'a>` when storing trait objects that hold borrowed data tied to lifetime `'a`.
