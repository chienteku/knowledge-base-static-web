# `MaybeUninit<T>`

> **Level 11 — Smart Pointers & Advanced Types**
> Represents possibly uninitialized memory; used in low-level code to avoid UB.

---

## 1. Prerequisites

- [Unsafe Rust](../level_13/unsafe_block.md) — The unsafe superpowers required to extract data from this wrapper.
- [Memory Allocation](../level_15/stack_vs_heap.md) — Understanding how RAM works under the hood.

---

## 2. Term Category

**Rust-specific (the memory placeholder)**: In older languages like C or C++, you can ask the Operating System for an array of memory, and the OS will just hand you a block of RAM full of random garbage left over from whatever program used it last. This is incredibly fast, but if you accidentally read that garbage, your program crashes (Undefined Behavior) or exposes security flaws.

Rust completely forbids uninitialized memory in Safe Rust. If you want the raw speed of uninitialized memory, you must use **`MaybeUninit<T>`**, a strict wrapper that forces you to prove to the compiler that you've overwritten the garbage before you read it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you need to allocate a massive buffer (e.g., a 4KB array for reading a file from the hard drive). 

In safe Rust, you would write `let mut buffer = [0u8; 4096]`. This forces the CPU to physically write 4,096 zeroes into memory. If you are immediately going to overwrite those zeroes with data from the hard drive, writing the zeroes was a complete waste of CPU cycles! 

You want to skip the initialization. `MaybeUninit` allows you to allocate the 4096 bytes of garbage memory *without* paying the CPU cost of zeroing it out, but it traps that memory inside an `unsafe` API so you don't accidentally read the garbage.

### (2) Reality Metaphor

Imagine you are building a new house. 

- **Safe Rust (`[0u8; 4096]`)**: You build a brick wall. You painstakingly paint every single brick white (zero initialization). An hour later, the homeowners arrive and paint the entire wall red (the actual data). The white paint was a massive waste of time and money!
- **`MaybeUninit<T>`**: You build the brick wall and leave it covered in mud and cement dust (uninitialized garbage). You put up a massive **"CAUTION: DO NOT TOUCH"** barrier (`MaybeUninit`). When the homeowners arrive, they paint the wall red directly over the dust, and *only then* do they remove the caution barrier (`.assume_init()`). You saved hours of unnecessary white painting!

### (3) Rust Code Examples

#### Short Snippet (The Basic Workflow)
You create the uninitialized memory, you write to it, and then you use `unsafe` to promise the compiler that the garbage is gone and the data is safe to use.

```rust
use std::mem::MaybeUninit;

fn main() {
    // 1. Create a block of uninitialized garbage memory
    let mut x: MaybeUninit<u32> = MaybeUninit::uninit();

    // 2. Overwrite the garbage with real data
    x.write(100);

    // 3. Extract the real data. 
    // This requires `unsafe` because the compiler cannot mathematically 
    // prove that you actually called .write()! You are making a promise.
    let initialized_x: u32 = unsafe { x.assume_init() };

    println!("Value is: {}", initialized_x);
}
```

#### Fuller Example (The Fast Buffer)
This is the most common use case in systems programming: creating a massive uninitialized array to act as a buffer for a C-library or an Operating System read call.

```rust
use std::mem::MaybeUninit;

fn main() {
    // Create an array of 1024 garbage bytes. ZERO CPU cost!
    let mut buffer: [MaybeUninit<u8>; 1024] = unsafe { MaybeUninit::uninit().assume_init() };
    
    // Simulate an Operating System function that fills the first 3 bytes with data
    buffer[0].write(72); // 'H'
    buffer[1].write(73); // 'I'
    buffer[2].write(33); // '!'
    
    // We KNOW the first 3 bytes are safe. We use unsafe to cast those specific 
    // 3 bytes into a standard, safe &[u8] slice so the rest of our program can use it!
    let safe_slice: &[u8] = unsafe {
        // Transmute the initialized portion from `MaybeUninit<u8>` to `u8`
        std::slice::from_raw_parts(buffer.as_ptr() as *const u8, 3)
    };
    
    println!("Received: {:?}", safe_slice); // [72, 73, 33]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Maybeuninit T Scoping and Lifecycle Rules

**The mistake:** Assuming Maybeuninit T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("maybeuninit_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("maybeuninit_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Maybeuninit T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Maybeuninit T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Maybeuninit T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Maybeuninit T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Trade-off

**Problem:** Why does Safe Rust force you to write zeroes into an array (`[0u8; 100]`) instead of just giving you uninitialized memory by default like C++ does?

> [!check]- Answer
> Because reading uninitialized memory is **Undefined Behavior** and a massive security risk (it can expose sensitive data left in RAM by other programs). 
>
> Safe Rust prioritizes absolute safety over the microscopic CPU cost of writing zeroes. If you want the speed, you have to explicitly opt-in using the `unsafe` `MaybeUninit` wrapper!

---

### Exercise 2: Building an Array Without Double-Initialization

**Problem:**
Safe Rust zero-initialises every value before you use it. For a large `[u8; 4096]` buffer that you immediately overwrite entirely (e.g. from a `read()` syscall), this is wasted work. `MaybeUninit` lets you skip the zeroing.

Do the following:
1. Create an uninitialised array of three `i32`s using `MaybeUninit`.
2. Write the values `10`, `20`, `30` into slots 0, 1, 2 using `.write()`.
3. Extract the fully-initialised array using the safe helper and print it.

Then answer: **Why is calling `.assume_init()` before writing all elements Undefined Behaviour?**

**Expected output:**
> [!check]- Answer
> ```text
> Initialized array: [10, 20, 30]
> ```
>
> - **Hint 1:** Create the array with `let mut buf: [MaybeUninit<i32>; 3] = MaybeUninit::uninit_array();` (stable since Rust 1.55). This is safe — the array slots are uninitialized but no UB occurs until you *read* from them.
> - **Hint 2:** Write each element with `buf[i].write(value)`. `.write()` takes ownership of the value, places it in the slot, and returns a `&mut i32` reference — it is always safe to call.
> - **Hint 3:** Extract the array with `unsafe { MaybeUninit::array_assume_init(buf) }` (stable since Rust 1.65). The `unsafe` block is *your* guarantee to the compiler that every slot has been written to. If you have missed a slot, reading it is UB — the integer bits are whatever garbage the allocator left behind, which can cause incorrect branching, optimisation miscompilation, or security exploits.
> - **Answer to the UB question:** `assume_init()` / `array_assume_init()` tell the compiler "treat this memory as a fully-initialized `T`". If any slot was never written, the compiler may read whatever bytes happen to be in that memory location and treat them as a valid `i32`. Depending on the optimizer, it may even eliminate branches that "could never happen" based on this false assumption — producing code that silently computes wrong results.
>
> ```rust
> use std::mem::MaybeUninit;
>
> fn main() {
>     // Step 1: allocate three MaybeUninit<i32> slots — no zeroing, no UB yet.
>     let mut buf: [MaybeUninit<i32>; 3] = MaybeUninit::uninit_array();
>
>     // Step 2: write real values into each slot individually.
>     buf[0].write(10);
>     buf[1].write(20);
>     buf[2].write(30);
>
>     // Step 3: NOW we can assert all slots are initialised and extract the array.
>     // SAFETY: every element has been written to exactly once above.
>     let init: [i32; 3] = unsafe { MaybeUninit::array_assume_init(buf) };
>     println!("Initialized array: {:?}", init);
> }
> ```
>
> **Explanation:**
> The `MaybeUninit<T>` wrapper is essentially a union of `T` and a byte array of the same size. The compiler refuses to make any assumptions about its contents — it will not optimise based on the value, and it disables `Drop`. The *safety contract* is simple: you may only call `assume_init()` once every byte of the wrapped value has been fully initialised by your code. The `unsafe` keyword is the language's mechanism for expressing this contract — you are taking responsibility from the compiler. In practice, `MaybeUninit` is used for large I/O buffers, FFI output parameters (`C` functions that write into a pointer you pass), and performance-critical data structures in `no_std` environments.

---

### Exercise 3: Using `MaybeUninit::write`

**Problem:** Initialize a `MaybeUninit<String>` using `.write(String::from("hello"))`.

**Expected output:**
> [!check]- Answer
> ```
> Initialized: hello
> ```
> ```rust
> use std::mem::MaybeUninit;
> fn main() {
>     let mut uninit = MaybeUninit::<String>::uninit();
>     let val = uninit.write(String::from("hello"));
>     println!("Initialized: {}", val);
> }
> ```
>
> **Explanation:** `.write()` writes values to `MaybeUninit` memory and returns mutable references.

---

## 6. Related Terms

- [Unsafe Rust](../level_13/unsafe_block.md) — The only place you will use `MaybeUninit`.
- [FFI (Foreign Function Interface)](../level_13/ffi.md) — The most common reason to use it (passing empty, uninitialized buffers to C code).

---

## 7. Key Takeaways

- **`MaybeUninit<T>`** is a wrapper that safely holds potentially uninitialized garbage memory.
- It allows you to avoid the CPU cost of zeroing out massive arrays (commonly used for File or Network buffers).
- You must manually `.write()` data into the garbage memory.
- Extracting the data requires an **`unsafe { val.assume_init() }`** block, where *you* promise the compiler that the garbage has been fully overwritten with real data.
- It permanently disables the `Drop` trait, meaning it will leak memory if you don't extract the value before it goes out of scope!
