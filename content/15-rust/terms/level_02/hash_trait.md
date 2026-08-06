# `Hash` Trait

> **Level 2 — Control Flow & Data Structures**
> The trait a type must implement to be used as a `HashMap`/`HashSet` key.

---

## 1. Prerequisites


- [`HashMap<K, V>`](hashmap_k_v.md) — The collection that requires this trait on its keys.
- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — `Hash` must stay logically consistent with `Eq`.
- [Derive Macro](../level_04/derive_macro.md) — How `Hash` is almost always implemented in practice.

---

## 2. Term Category

**Standard Library Trait (the bucket-finder)**: `Hash` lets a type compute a numeric fingerprint of itself. `HashMap` uses that fingerprint to decide *which internal bucket* a key belongs in, so it can jump straight there instead of scanning every entry. Without `Hash`, a type simply cannot be used as a `HashMap` or `HashSet` key.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A `HashMap` achieves its famous O(1) average lookup speed by never actually *searching*. Instead, it runs the key through a hash function to get a number, uses that number to jump directly to a bucket, and only then checks equality against the (usually one) candidate in that bucket. This means every key type needs a `.hash()` method — that's exactly what the `Hash` trait provides. Rust makes this a real, checkable trait bound (rather than assuming every type is hashable, like some languages do) so the compiler can catch "this type can't be a key" at compile time instead of at runtime.

### (2) Reality Metaphor

Imagine a massive library with a million books (the `HashMap`), but instead of alphabetical shelving, every book has a magic barcode (the `Hash`) that instantly tells you which of 10,000 shelves it belongs on.

- **With `Hash`**: You scan the barcode, walk directly to shelf #4,821, and the book (or an empty spot) is right there. Lookup is instant regardless of library size.
- **Without `Hash`**: The librarian has no barcode scanner for this kind of book. They refuse to shelve it at all — the compiler stops you before you even try.
- **The critical rule**: Two *identical* books (equal by `Eq`) **must** have the *same* barcode (equal by `Hash`), or the librarian will file duplicates on totally different shelves and "lose" one of them forever.

### (3) Rust Code Examples

#### Short Snippet (Deriving `Hash`)
The overwhelmingly common way to implement `Hash` is to derive it — never by hand.
```rust
use std::collections::HashMap;

// `Eq` and `Hash` must ALWAYS be derived together for correctness.
#[derive(Debug, PartialEq, Eq, Hash, Clone)]
struct UserId(u64);

fn main() {
    let mut sessions: HashMap<UserId, &str> = HashMap::new();
    sessions.insert(UserId(42), "alice_token");

    println!("{:?}", sessions.get(&UserId(42))); // Some("alice_token")
}
```

#### Fuller Example (Why `PartialEq` and `Hash` Must Agree)
```rust
use std::collections::HashSet;

// BAD: This type has custom Eq that ignores `id_padding`,
// but derived Hash that includes it. This VIOLATES the Hash contract!
#[derive(Debug, Eq, Hash, Clone)]
struct BrokenKey {
    value: i32,
    id_padding: u8, // Irrelevant to equality, but derived Hash still hashes it!
}

impl PartialEq for BrokenKey {
    fn eq(&self, other: &Self) -> bool {
        self.value == other.value // Only compares `value`!
    }
}

fn main() {
    let mut set = HashSet::new();
    set.insert(BrokenKey { value: 1, id_padding: 0 });

    // These are "equal" by our custom Eq (`value` matches)...
    let lookup = BrokenKey { value: 1, id_padding: 99 };

    // ...but they hash DIFFERENTLY (different id_padding), so HashSet looks
    // in the WRONG bucket and never finds it! This prints `false`.
    println!("{}", set.contains(&lookup));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Hash Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Hash Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("hash_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("hash_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Hash Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Hash Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Hash Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Hash Trait instances across OS threads via `std::thread::spawn`.

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

---

## 5. Practice Exercises

### Exercise 1: Symmetric Network Flow Table with Field Exclusions

**Scenario:** In network middleboxes, firewalls, and packet analyzers, packets belonging to the same connection must map to the exact same state table entry regardless of flow direction. For example, a packet from `192.168.1.10:443` to `10.0.0.1:52100` and a reply packet from `10.0.0.1:52100` to `192.168.1.10:443` must hash to the same bucket and evaluate equal (`PartialEq`). Additionally, transient per-packet framing data such as `vlan_tag` must be excluded from flow identity hashing.

Implement `PartialEq`, `Eq`, and `Hash` manually for `FlowKey` to achieve canonical endpoint ordering and selective field hashing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::{Hash, Hasher};
>
> #[derive(Debug, Clone)]
> pub struct FlowKey {
>     pub src_ip: [u8; 4],
>     pub dst_ip: [u8; 4],
>     pub src_port: u16,
>     pub dst_port: u16,
>     pub protocol: u8,
>     pub vlan_tag: u16, // Ignored in equality and hash
> }
>
> impl FlowKey {
>     pub fn new(
>         src_ip: [u8; 4],
>         dst_ip: [u8; 4],
>         src_port: u16,
>         dst_port: u16,
>         protocol: u8,
>         vlan_tag: u16,
>     ) -> Self {
>         Self {
>             src_ip,
>             dst_ip,
>             src_port,
>             dst_port,
>             protocol,
>             vlan_tag,
>         }
>     }
>
>     /// Returns the endpoint pair in canonical sorted order so (A, B) == (B, A).
>     fn canonical_endpoints(&self) -> (([u8; 4], u16), ([u8; 4], u16)) {
>         let ep1 = (self.src_ip, self.src_port);
>         let ep2 = (self.dst_ip, self.dst_port);
>         if ep1 <= ep2 {
>             (ep1, ep2)
>         } else {
>             (ep2, ep1)
>         }
>     }
> }
>
> impl PartialEq for FlowKey {
>     fn eq(&self, other: &Self) -> bool {
>         self.protocol == other.protocol
>             && self.canonical_endpoints() == other.canonical_endpoints()
>     }
> }
>
> impl Eq for FlowKey {}
>
> impl Hash for FlowKey {
>     fn hash<H: Hasher>(&self, state: &mut H) {
>         self.protocol.hash(state);
>         self.canonical_endpoints().hash(state);
>     }
> }
>
> #[derive(Debug, PartialEq, Eq, Default)]
> pub struct FlowStats {
>     pub packets: u64,
>     pub bytes: u64,
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::collections::hash_map::DefaultHasher;
>
>     fn calculate_hash<T: Hash>(t: &T) -> u64 {
>         let mut hasher = DefaultHasher::new();
>         t.hash(&mut hasher);
>         hasher.finish()
>     }
>
>     #[test]
>     fn test_flow_key_bidirectional_symmetry() {
>         let fwd = FlowKey::new([192, 168, 1, 10], [10, 0, 0, 1], 443, 52100, 6, 100);
>         let rev = FlowKey::new([10, 0, 0, 1], [192, 168, 1, 10], 52100, 443, 6, 200);
>         let diff_proto = FlowKey::new([192, 168, 1, 10], [10, 0, 0, 1], 443, 52100, 17, 100);
>
>         // Explicit symmetry assertions
>         assert_eq!(fwd, rev);
>         assert_eq!(calculate_hash(&fwd), calculate_hash(&rev));
>         assert_ne!(fwd, diff_proto);
>         assert_ne!(calculate_hash(&fwd), calculate_hash(&diff_proto));
>
>         // HashMap bidirectional routing table integration test
>         let mut table: HashMap<FlowKey, FlowStats> = HashMap::new();
>         table.entry(fwd.clone()).or_default().packets += 1;
>         table.entry(rev.clone()).or_default().packets += 1;
>
>         assert_eq!(table.len(), 1);
>         let stats = table.get(&fwd);
>         assert!(matches!(stats, Some(s) if s.packets == 2));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Canonical Normalization**: The helper method `canonical_endpoints()` orders the tuple of IP address and port numerically using lexicographical comparison on `(([u8; 4], u16), ([u8; 4], u16))`. This guarantees that `(ep_A, ep_B)` and `(ep_B, ep_A)` produce identical tuples without mutating internal struct state.
> 2. **Trait Contract Enforcement**: The core requirement of the `Hash` and `Eq` contract in Rust is that `a == b => hash(a) == hash(b)`. Both `PartialEq::eq` and `Hash::hash` delegate directly to `protocol` and `canonical_endpoints()`. Because identical data inputs are fed to `Hasher`, hash collisions for symmetric flows are mathematically zero at the key representation layer.
> 3. **Selective Field Exclusion**: The `vlan_tag` field is deliberately omitted from both `eq` and `hash`. If `vlan_tag` were hashed but omitted from `eq` (or vice versa), two flows arriving on different VLANs would produce different bucket indexes in `HashMap`, breaking lookup mechanics.
> 4. **Edge Cases**: Differing `protocol` values (e.g., TCP `6` vs UDP `17`) between identical IP/port endpoints evaluate as distinct keys and produce different hash values due to feeding `self.protocol` into the `Hasher` first.

---

### Exercise 2: Quantized Financial Order Book Price Key

**Scenario:** In automated trading systems, price levels in an order book are aggregated in a `HashMap`. Primitive `f64` values cannot be directly used as map keys because `f64` does not implement `Eq` or `Hash` (`f64::NAN != f64::NAN` violates total equivalence). Furthermore, slight floating-point representations (such as `100.004` vs `100.001` under a `0.01` tick size) and signed zeroes (`-0.0` vs `+0.0`) must be normalized to identical price ticks.

Implement a wrapper struct `CanonicalPrice` that quantizes prices into integer ticks, handles signed zero normalization, and implements `PartialEq`, `Eq`, and `Hash`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::{Hash, Hasher};
>
> #[derive(Debug, Clone, Copy)]
> pub struct CanonicalPrice {
>     raw_price: f64,
>     tick_size: f64,
> }
>
> impl CanonicalPrice {
>     pub fn new(raw_price: f64, tick_size: f64) -> Self {
>         assert!(tick_size > 0.0 && tick_size.is_finite(), "tick_size must be positive and finite");
>         Self { raw_price, tick_size }
>     }
>
>     /// Quantizes raw price to integer tick steps, normalizing signed zero and NaN.
>     pub fn ticks(&self) -> i64 {
>         if self.raw_price.is_nan() {
>             return i64::MIN;
>         }
>         let ticks = (self.raw_price / self.tick_size).round();
>         if ticks == 0.0 || ticks == -0.0 {
>             0
>         } else {
>             ticks as i64
>         }
>     }
> }
>
> impl PartialEq for CanonicalPrice {
>     fn eq(&self, other: &Self) -> bool {
>         self.ticks() == other.ticks()
>     }
> }
>
> impl Eq for CanonicalPrice {}
>
> impl Hash for CanonicalPrice {
>     fn hash<H: Hasher>(&self, state: &mut H) {
>         self.ticks().hash(state);
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::collections::hash_map::DefaultHasher;
>
>     fn calculate_hash<T: Hash>(t: &T) -> u64 {
>         let mut hasher = DefaultHasher::new();
>         t.hash(&mut hasher);
>         hasher.finish()
>     }
>
>     #[test]
>     fn test_canonical_price_hashing_and_equality() {
>         let p1 = CanonicalPrice::new(100.004, 0.01);
>         let p2 = CanonicalPrice::new(100.001, 0.01);
>         let p3 = CanonicalPrice::new(100.012, 0.01);
>         let p_zero_pos = CanonicalPrice::new(0.0, 0.01);
>         let p_zero_neg = CanonicalPrice::new(-0.0, 0.01);
>
>         // Sub-tick floating noise yields equal price and hash
>         assert_eq!(p1, p2);
>         assert_eq!(calculate_hash(&p1), calculate_hash(&p2));
>         assert_ne!(p1, p3);
>         assert_ne!(calculate_hash(&p1), calculate_hash(&p3));
>
>         // Sign zero normalization test
>         assert_eq!(p_zero_pos, p_zero_neg);
>         assert_eq!(calculate_hash(&p_zero_pos), calculate_hash(&p_zero_neg));
>
>         // Order book hash map aggregation test
>         let mut book: HashMap<CanonicalPrice, u32> = HashMap::new();
>         book.insert(p1, 50);
>
>         let lookup = book.get(&p2);
>         assert!(matches!(lookup, Some(&qty) if qty == 50));
>         assert!(book.contains_key(&p2));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Why `f64` Lacks `Hash` / `Eq`**: Floating-point numbers implement `PartialEq` but not `Eq` because IEEE 754 specifies `NaN != NaN`. Allowing unconstrained floats in `HashMap` would break internal lookup invariants (inserted `NaN` keys could never be retrieved).
> 2. **Integer Scaling Transformation**: By dividing `raw_price` by `tick_size` and rounding to the nearest whole integer, continuous floating-point space is mapped into discrete integer ticks (`i64`). Integer types implement total equivalence (`Eq`) and predictable hashing (`Hash`).
> 3. **Signed Zero Normalization**: IEEE 754 floating-point numbers distinguish between `+0.0` and `-0.0`. In Rust, `+0.0 == -0.0` evaluates to `true`, but converting `-0.0` directly to bits without normalization could risk different internal representations. Normalizing `ticks == -0.0` directly to integer `0` ensures exact equivalence and hash parity.
> 4. **HashMap Aggregation Guarantee**: Because `p1` (`100.004`) and `p2` (`100.001`) both round to tick integer `10000`, `p1 == p2` is `true` and `hash(p1) == hash(p2)` holds, allowing `HashMap::get` using `p2` to seamlessly retrieve entries inserted using `p1`.

---

### Exercise 3: Zero-Allocation Case-Insensitive AST Symbol Key

**Scenario:** Compilers, interpreters, and SQL parsers frequently perform symbol lookups in case-insensitive identifier namespaces. Diagnostic span metadata (`span_start: usize`) stored inside a `SymbolKey` struct must be ignored during symbol table matching. Furthermore, to maximize throughput during compilation, custom hashing must convert string characters to lowercase on the fly without allocating intermediate `String` objects on the heap.

Implement `SymbolKey` with custom `PartialEq`, `Eq`, and `Hash` to perform case-insensitive, scope-aware matching with field-selective hashing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::{Hash, Hasher};
>
> #[derive(Debug, Clone)]
> pub struct SymbolKey {
>     pub name: String,
>     pub scope_id: u32,
>     pub span_start: usize, // Ignored in equality and hash
> }
>
> impl SymbolKey {
>     pub fn new(name: impl Into<String>, scope_id: u32, span_start: usize) -> Self {
>         Self {
>             name: name.into(),
>             scope_id,
>             span_start,
>         }
>     }
> }
>
> impl PartialEq for SymbolKey {
>     fn eq(&self, other: &Self) -> bool {
>         self.scope_id == other.scope_id
>             && self.name.eq_ignore_ascii_case(&other.name)
>     }
> }
>
> impl Eq for SymbolKey {}
>
> impl Hash for SymbolKey {
>     fn hash<H: Hasher>(&self, state: &mut H) {
>         self.scope_id.hash(state);
>         for byte in self.name.bytes() {
>             byte.to_ascii_lowercase().hash(state);
>         }
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::collections::hash_map::DefaultHasher;
>
>     fn calculate_hash<T: Hash>(t: &T) -> u64 {
>         let mut hasher = DefaultHasher::new();
>         t.hash(&mut hasher);
>         hasher.finish()
>     }
>
>     #[test]
>     fn test_symbol_key_case_insensitivity() {
>         let sym1 = SymbolKey::new("UserCounter", 1, 12);
>         let sym2 = SymbolKey::new("usercounter", 1, 98);
>         let sym3 = SymbolKey::new("UserCounter", 2, 12);
>
>         // Case insensitivity and span independence assertions
>         assert_eq!(sym1, sym2);
>         assert_eq!(calculate_hash(&sym1), calculate_hash(&sym2));
>
>         // Scope boundary distinction assertions
>         assert_ne!(sym1, sym3);
>         assert_ne!(calculate_hash(&sym1), calculate_hash(&sym3));
>
>         // Compiler symbol table lookup test
>         let mut sym_table: HashMap<SymbolKey, String> = HashMap::new();
>         sym_table.insert(sym1.clone(), "i32".to_string());
>
>         let retrieved = sym_table.get(&sym2);
>         assert!(matches!(retrieved, Some(type_str) if type_str == "i32"));
>         assert!(sym_table.contains_key(&sym2));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Zero-Allocation Stream Hashing**: Instead of calling `self.name.to_lowercase()` (which allocates a new heap-allocated `String`), `Hash::hash` iterates over `self.name.bytes()` and hashes each byte transformed via `byte.to_ascii_lowercase()`. This streams lowercased byte values directly into the `Hasher` with zero temporary heap allocations.
> 2. **ASCII Case Invariance**: `PartialEq` uses `name.eq_ignore_ascii_case(&other.name)`, which checks ASCII byte equality ignoring case differences without heap allocation. Because both `eq` and `hash` operate byte-by-byte on ASCII-lowercased equivalents, `"UserCounter"` and `"usercounter"` produce identical hash values and compare equal.
> 3. **Scope Scoping and Metadata Filtering**: The `scope_id` field is explicitly hashed and compared, ensuring that variables with the same identifier in different lexical scopes (e.g. `scope_id: 1` vs `scope_id: 2`) generate distinct hashes and evaluate as unequal. The `span_start` byte offset is omitted entirely from both `eq` and `hash`, preventing AST refactoring or line movement from breaking symbol resolution.
> 4. **Safety and Soundness**: The type implements `Eq` because ASCII case-insensitive equality is reflexive (`a == a`), symmetric (`a == b => b == a`), and transitive (`a == b && b == c => a == c`). Combined with streaming lowercase byte hashing, the strict invariant `a == b => hash(a) == hash(b)` is fully satisfied.

---

## 6. Related Terms


- [`HashMap<K, V>`](hashmap_k_v.md) — The primary consumer of this trait.
- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — Must stay logically consistent with `Hash` on every type.
- [`Borrow<T>` Trait](../level_14/borrow_trait.md) — Governs how `HashMap::get(&Q)` can look up a key by a borrowed type (e.g. looking up a `HashMap<String, _>` with a `&str`).
- [Derive Macro](../level_04/derive_macro.md) — The mechanism (`#[derive(Hash)]`) that implements this trait correctly in nearly all real code.
- [`HashSet<T>` / `BTreeSet<T>`](hashset_btreeset.md) — Related concept: `HashSet<T>` / `BTreeSet<T>`.

---

## 7. Key Takeaways

- `Hash` lets a type produce a numeric fingerprint, which is how `HashMap`/`HashSet` achieve O(1) average-case lookups.
- Any type used as a `HashMap` key or `HashSet` element **must** implement both `Hash` and `Eq`.
- The two traits have a **hard contract**: equal values (`Eq`) must produce equal hashes (`Hash`). Breaking this causes silent lookup failures, not compile errors.
- Always `#[derive(PartialEq, Eq, Hash)]` together on simple field-by-field types; only hand-write both if you have a specific reason, and keep them in sync.
