# Benchmarking

> **Level 8 — Testing & Documentation**
> Performance measurement; stable Rust uses the `criterion` crate.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The correctness counterpart to benchmarking.
- [Cargo](../level_01/cargo.md) — The build system used to run benchmarks via `cargo bench`.

---

## 2. Term Category

**Rust-nonspecific (the performance tester)**: Unit tests verify that your code calculates the correct answer. Benchmarks verify *how fast* your code calculates that answer. 

In Rust, performance is a first-class citizen. Benchmarking is how you mathematically prove that your new algorithm is actually faster than the old one, rather than just guessing.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

*"Is this code faster?"* Developers love to argue about performance. 

But writing a manual timer (`let start = Instant::now(); run_code();`) is wildly inaccurate. Modern CPUs fluctuate in clock speed, cache states change randomly, and the OS interrupts your program to do background tasks. A single timer run is meaningless.

Proper benchmarking requires running a function thousands of times, dropping statistical outliers, tracking CPU cycles, and calculating a true mathematical average. 

Because the built-in `cargo bench` tool relies on unstable compiler features, the entire Rust ecosystem has agreed to use a wildly popular, statistically rigorous external crate called **`criterion`** for all benchmarking.

### (2) Reality Metaphor

Imagine you are a Formula 1 race team.

- A **Unit Test** is putting the car on blocks in the garage and turning the steering wheel to make sure the tires move. It verifies the car works.
- A **Benchmark** is taking the car to the track, driving 100 laps, tracking the exact milliseconds of every single lap with lasers, and calculating the true average lap time to see if the new engine is actually faster than last year's model.

### (3) Rust Code Examples

#### Short Snippet (The Configuration)
To use Criterion, you must add it to a special `[dev-dependencies]` section in your `Cargo.toml`. These dependencies are only downloaded when running tests or benchmarks, saving your customers from downloading them!

**File: `Cargo.toml`**
```toml
[dev-dependencies]
criterion = "0.5"

# We must tell Cargo about our benchmark file and disable the default runner
[[bench]]
name = "my_benchmark"
harness = false
```

#### Fuller Example (The Black Box)
Benchmarks live in a `benches/` directory at the root of your project, exactly like Integration Tests!

**File: `benches/my_benchmark.rs`**
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use my_awesome_library::calculate_fibonacci;

fn criterion_benchmark(c: &mut Criterion) {
    // We tell Criterion to benchmark this specific function
    c.bench_function("fibonacci 20", |b| {
        // `b.iter` runs the closure inside it thousands of times
        b.iter(|| {
            // We use `black_box` to trick the compiler! (See Common Mistakes below)
            calculate_fibonacci(black_box(20))
        })
    });
}

// These macros generate the main function that actually runs the benchmarks
criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```
To run this, you simply type `cargo bench` in your terminal. Criterion will print out a beautiful statistical report showing the exact nanoseconds it took to run.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Benchmarking Scoping and Lifecycle Rules

**The mistake:** Assuming Benchmarking instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("benchmarking_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("benchmarking_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Benchmarking State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Benchmarking through an immutable reference `&T` or without specifying `mut` in variable declarations.

**Why it's wrong:** Rust's aliasing XOR mutability rule (`&T` for shared immutable access, `&mut T` for exclusive mutable access) prohibits mutating state through shared references unless interior mutability patterns (e.g. `RefCell`, `Mutex`) are explicitly used.

*Incorrect:*
```rust
fn update_val(data: &i32) {
    // *data += 1; // ❌ Error E0594: cannot assign to `*data`, which is behind a `&` reference
}
```

*Fix:*
```rust
fn update_val(data: &mut i32) {
    *data += 1; // Correct: exclusive mutable reference permits mutation
}
```

### Mistake 3: Concurrent Access to Benchmarking Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Benchmarking instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Types that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

*Incorrect:*
```rust
use std::rc::Rc;
use std::thread;

let rc = Rc::new(42);
// thread::spawn(move || { println!("{}", rc); }); // ❌ Error E0277: `Rc` cannot be sent between threads safely
```

*Fix:*
```rust
use std::sync::Arc;
use std::thread;

let arc = Arc::new(42);
thread::spawn(move || {
    println!("{}", arc); // Correct: `Arc` implements `Send` and `Sync`
});
```

## 5. Practice Exercises

### Exercise 1: The Invisible Code

**Problem:** You write a benchmark that calculates `2 + 2`. The compiler sees this and simply replaces the code with `4` at compile time, ruining your benchmark. Where should you place the `black_box` to force the compiler to do the math during the benchmark?

> [!check]- Answer
> You wrap the inputs!
>
> ```rust
> b.iter(|| black_box(2) + black_box(2))
> ```
> Because the compiler can no longer "see" inside the black box, it doesn't know the values are `2`, so it is forced to actually run the addition instruction on the CPU.

---

### Exercise 2: Preventing Compiler Elimination with `black_box`

**Problem:** Pass inputs and outputs through `std::hint::black_box` inside a benchmark loop.

**Expected output:**
> [!check]- Answer
> ```
> Black box result: 100
> ```
> ```rust
> use std::hint::black_box;
> fn main() {
>     let res = black_box(10) * black_box(10);
>     println!("Black box result: {}", black_box(res));
> }
> ```
>
> **Explanation:** `black_box` prevents the compiler from optimizing away computations based on constant inputs.

---

### Exercise 3: Executing Benchmarks with Cargo

**Problem:** Command line invocation to run benchmark targets in Cargo.

**Expected output:**
> [!check]- Answer
> ```
> cargo bench
> ```
> fn main() {
>     println!("cargo bench");
> }
> ```
>
> **Explanation:** `cargo bench` compiles targets with release optimizations and runs benchmark harnesses.

---

## 6. Related Terms

- [`[dependencies]`](../level_07/dependencies_section.md) — The file where `criterion` must be added under `[dev-dependencies]`.
- [`#[test]`](../level_08/test_attribute.md) — The correctness counterpart to benchmarking.

---

## 7. Key Takeaways

- Unit Tests check for correctness; **Benchmarks check for speed**.
- The standard tool for benchmarking in stable Rust is the external **`criterion`** crate.
- Benchmarks live in a `benches/` directory at the root of your project.
- You execute them by running **`cargo bench`** in the terminal.
- You **must** wrap inputs and outputs in `black_box()` to prevent the Rust compiler from deleting your benchmark code during optimization!
