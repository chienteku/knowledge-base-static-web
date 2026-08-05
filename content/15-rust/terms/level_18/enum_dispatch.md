# Enum Dispatch

> **Level 18 — Rust**
> Using enums instead of trait objects (`dyn Trait`) to achieve static dispatch with per-variant behavior at zero runtime overhead.

---

## 1. Prerequisites

- [Enum](../level_02/enum.md) — Enums.
- [Trait](../level_04/trait.md) — Traits.

---


## 2. Term Category

**Performance Architecture**: Polymorphism via enum dispatch instead of dynamic trait objects (`dyn Trait`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Dynamic dispatch via `Box<dyn Trait>` incurs virtual table (vtable) pointer dereferencing and prevents CPU branch predictors from inlining code across polymorphic calls.

When the set of polymorphic types is known and closed, using Enum Dispatch wraps variants inside a single `enum`. Pattern matching on enum variants executes static dispatch, allowing LLVM to perform full inlining, CPU cache optimization, and auto-vectorization without dynamic memory allocation.

### (2) Reality Metaphor

A multi-blade pocket knife: selecting between three fixed built-in blades attached to the handle rather than calling an external contractor with specialized tools.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub enum Driver { Fast(FastDriver), Slow(SlowDriver) }
impl Driver { pub fn run(&self) { match self { Self::Fast(f) => f.run(), Self::Slow(s) => s.run() } } }
```

#### Fuller Example
```rust
pub struct Circle { pub r: f64 }
pub struct Square { pub w: f64 }

pub enum Shape {
    Circle(Circle),
    Square(Square),
}

impl Shape {
    pub fn area(&self) -> f64 {
        match self {
            Shape::Circle(c) => std::f64::consts::PI * c.r * c.r,
            Shape::Square(s) => s.w * s.w,
        }
    }
}

fn main() {
    let shapes = vec![Shape::Circle(Circle { r: 2.0 }), Shape::Square(Square { w: 3.0 })];
    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    assert!((total - 21.566).abs() < 0.01);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `Vec<Box<dyn Trait>>` for Known Closed Polymorphic Types

**The mistake:** Using heap-allocated dynamic trait objects when all polymorphic variants are defined in the same crate.

**Why it is wrong:** Triggers unnecessary memory allocations and vtable lookup performance penalties.

*Incorrect:*
```rust
let items: Vec<Box<dyn Action>> = vec![];
```

*Fix:*
```rust
let items: Vec<ActionEnum> = vec![]; // Use Enum Dispatch!
```

### Mistake 2: Exposing Open Extension Points with Enum Dispatch

**The mistake:** Using enum dispatch when third-party downstream library users need to add custom polymorphic variants.

**Why it is wrong:** Enums cannot be extended by external crates without editing the library source code. Use `dyn Trait` for open plugins.

*Incorrect:*
```rust
pub enum Plugin { Builtin(A) } // Downstream crates cannot add variants!
```

*Fix:*
```rust
pub trait Plugin { fn run(&self); } // Use trait objects for open plugin architectures!
```

### Mistake 3: Writing Repetitive Boilerplate `match` Blocks

**The mistake:** Manually matching across 20 enum variants for every single trait method.

**Why it is wrong:** Creates verbose, error-prone delegate boilerplate.

*Incorrect:*
```rust
fn a(&self) { match self { V1(x) => x.a(), V2(x) => x.a() ... } }
```

*Fix:*
```rust
Use macros or `enum_dispatch` crate to automatically generate variant delegation!
```

---

## 5. Practice Exercises

### Exercise 1: High-Throughput Packet Parser Enum Dispatch

**Scenario:** Build a high-performance network packet parser routing between `IPv4`, `IPv6`, and `ARP` packets using enum dispatch.

**Requirements:**
1. Define `IPv4Packet`, `IPv6Packet`, `ARPPacket` structs.
1. Wrap variants in `Packet` enum.
1. Implement `process(&self) -> u32` via match dispatch.
1. Test throughput.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct IPv4Packet { pub len: u32 }
> pub struct IPv6Packet { pub len: u32 }
> pub struct ARPPacket { pub len: u32 }
> 
> pub enum Packet {
>     V4(IPv4Packet),
>     V6(IPv6Packet),
>     Arp(ARPPacket),
> }
> 
> impl Packet {
>     pub fn payload_length(&self) -> u32 {
>         match self {
>             Packet::V4(p) => p.len,
>             Packet::V6(p) => p.len,
>             Packet::Arp(p) => p.len,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_enum_dispatch() {
>         let packets = vec![
>             Packet::V4(IPv4Packet { len: 64 }),
>             Packet::V6(IPv6Packet { len: 128 }),
>             Packet::Arp(ARPPacket { len: 42 }),
>         ];
>         let total: u32 = packets.iter().map(|p| p.payload_length()).sum();
>         assert_eq!(total, 234);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Packet` enum holds fixed polymorphic packet variants in contiguous memory.
> 2. `payload_length` performs static match dispatch, enabling LLVM inlining.

---

### Exercise 2: Abstract Game Engine Renderer Node Dispatch

**Scenario:** Implement a game scene graph rendering `Sprite`, `Mesh`, and `Light` nodes using enum dispatch.

**Requirements:**
1. Define node variants in `SceneNode` enum.
1. Implement static dispatch.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct Sprite { pub id: u32 }
> pub struct Mesh { pub triangles: u32 }
> pub struct Light { pub intensity: f32 }
> 
> pub enum SceneNode {
>     SpriteNode(Sprite),
>     MeshNode(Mesh),
>     LightNode(Light),
> }
> 
> impl SceneNode {
>     pub fn render(&self) -> String {
>         match self {
>             SceneNode::SpriteNode(s) => format!("Sprite_{}", s.id),
>             SceneNode::MeshNode(m) => format!("Mesh_{}", m.triangles),
>             SceneNode::LightNode(l) => format!("Light_{}", l.intensity),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scene_render() {
>         let node = SceneNode::MeshNode(Mesh { triangles: 100 });
>         assert_eq!(node.render(), "Mesh_100");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Eliminates vtable dynamic allocation for scene graph elements.
> 2. Stores nodes in contiguous stack or array memory.

---

### Exercise 3: Financial Order Execution Strategy Dispatch

**Scenario:** Build a trading engine routing `MarketOrder`, `LimitOrder`, and `StopLossOrder` variants.

**Requirements:**
1. Define order variants.
1. Implement `execute()` matching dispatch.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct MarketOrder { pub qty: u32 }
> pub struct LimitOrder { pub qty: u32, pub price: u32 }
> 
> pub enum Order {
>     Market(MarketOrder),
>     Limit(LimitOrder),
> }
> 
> impl Order {
>     pub fn total_value(&self) -> u32 {
>         match self {
>             Order::Market(m) => m.qty * 100, // Fixed market assumption
>             Order::Limit(l) => l.qty * l.price,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_dispatch() {
>         let o = Order::Limit(LimitOrder { qty: 5, price: 20 });
>         assert_eq!(o.total_value(), 100);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. High-frequency trading dispatch without dynamic vtable lookup latency.
> 2. Maximizes L1 CPU cache hit rates.

---

## 5. Related Terms

- [Visitor Pattern](visitor_pattern.md) — Visitor pattern alternative.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — Trait objects vs static enum dispatch.

---


## 7. Key Takeaways

- Polymorphism via enum matching instead of dynamic vtables (`dyn Trait`).
- Eliminates vtable pointer dereferencing and heap allocations.
- Enables LLVM compiler inlining and auto-vectorization.
- Ideal for known, closed sets of polymorphic variants.
