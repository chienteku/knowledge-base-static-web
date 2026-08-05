# Protocol Buffers (protobuf)

> **Level 10 — Designing & Tooling**
> The binary schema format that powers gRPC.

---

## 1. Prerequisites
- [Serialization & Deserialization](../level_07/serialization.md) — The concepts of formatting objects for transmission.
- [gRPC (Remote Procedure Call)](grpc.md) — The network protocol designed on top of Protocol Buffers.
---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Compiled into multiple programming languages (JavaScript, Python, C++, Go, Java, Swift).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard web APIs serialize data using JSON text. While JSON is human-readable, it has performance limitations:
- **Field Name Overhead:** Field names (keys like `"transaction_amount"`) are repeated in every message payload, bloating size.
- **CPU Parse Overhead:** Converting text strings back into memory structures consumes high CPU cycles.
- **Weak Validation:** JSON does not enforce schemas at the protocol layer, allowing type mismatches.

To solve this, Google designed **Protocol Buffers (Protobuf)**:
- **Schema-First:** You define data structures inside a `.proto` schema text file, assigning a unique **numeric tag index** to each field.
- **Binary Compilation:** You compile the `.proto` file using the `protoc` compiler. This generates helper libraries in your target language containing optimized encoders and decoders.
- **No Keys on the Wire:** When serializing, Protobuf converts the object to raw binary bytes, stripping away all key strings. It transmits only the numeric tag index and the raw field value, reducing payload size by up to **80%**.

---

### (2) Reality Metaphor
Imagine shipping items with instructions.
- **JSON** is like writing out a **detailed letter**: *"Name is Alice. Age is 30. Email is alice@com."* The letter is easy to read, but many words are wasted on descriptors.
- **Protobuf** is like printing a **compact barcode**: `[1: Alice, 2: 30, 3: alice@com]`. Both the sender and receiver have a copy of a shared handbook (**the schema**) translating the tags: index `1` = Name, index `2` = Age, and index `3` = Email. The payload is tiny and parsed instantly by barcode scanners (**the binary decoder**).

---

### (3) Protocol Buffer Schema Example (`user.proto`)

```protobuf
syntax = "proto3";

// Defines the data contract structure
message UserProfile {
  int32 id = 1;          // Field name 'id' mapped to tag index 1
  string username = 2;   // Field name 'username' mapped to tag index 2
  string email = 3;      // Field name 'email' mapped to tag index 3
  bool is_active = 4;    // Field name 'is_active' mapped to tag index 4
}
```

#### JavaScript Encoding Usage
```javascript
import protobuf from 'protobufjs';

const root = await protobuf.load("user.proto");
const UserProfile = root.lookupType("UserProfile");

const userPayload = { id: 42, username: "Alice", email: "alice@com", isActive: true };

// 1. Validate payload against schema contract rules
const error = UserProfile.verify(userPayload);
if (error) throw Error(error);

// 2. Serialize into binary buffer (Uint8Array)
const binaryBuffer = UserProfile.encode(userPayload).finish();
console.log("Protobuf byte array:", binaryBuffer);
console.log("Protobuf size:", binaryBuffer.length, "bytes"); // Output: ~20 bytes

// Compare to equivalent JSON:
// {"id":42,"username":"Alice","email":"alice@com","isActive":true}
// Size is ~62 bytes (3x larger than protobuf!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Changing existing numeric tag index numbers in a `.proto` file

**The mistake:** Changing a field's tag index inside a schema file that is already deployed to production:
```protobuf
// BEFORE:
int32 id = 1;

// AFTER: (Changing tag index from 1 to 5)
int32 id = 5;
```

**Why it's wrong:** Protobuf uses numeric tag indexes to identify fields on the wire. If you change a tag, legacy clients running older code will parse incoming `id` values (now sent with tag `5`) as missing fields, while interpreting whatever you mapped to tag `1` as the `id`, causing data corruption.

*Fix:* **Never change a tag index number once deployed.** If a field is retired, mark it as `reserved` to prevent reuse, and declare new fields using incremented tag index numbers.

---

### Mistake 2: Modifying Existing Field Tag Numbers in `.proto` Files (Breaking Binary Compatibility)

**The mistake:** Re-numbering existing fields in a `.proto` schema file (`int32 id = 1;` -> `int32 id = 2;`).

**Why it's wrong:** Protobuf binary encoding relies strictly on integer **tag numbers** for serialization. Changing tag numbers causes binary deserialization corruption across services.

*Incorrect:*
```text
// Changing tag number breaks binary compatibility
message User {
  int32 id = 2; // ❌ Was tag 1! Re-numbering breaks existing binary decoders!
}
```

*Fix:*
```text
message User {
  int32 id = 1; // Preserve tag 1 permanently
  string email = 2; // Add new fields with new tag numbers
}
```

---

### Mistake 3: Re-Using Deleted Tag Numbers Without Marking Them `reserved`

**The mistake:** Deleting field `string phone = 3;` and immediately assigning tag `3` to a new `string address = 3;` field.

**Why it's wrong:** Older microservice binaries using tag 3 for `phone` will attempt to parse `address` strings into phone numbers. Use the `reserved` keyword for deleted tags.

*Incorrect:*
```text
message User {
  // Tag 3 deleted, reassigned to new field
  string address = 3; // ❌ Dangerous tag reuse!
}
```

*Fix:*
```text
message User {
  reserved 3; // Prevent tag 3 from ever being reassigned
  string address = 4;
}
```


---

## 6. Practice Exercises

### Exercise 1: Schema Design

**Problem:** Complete the `.proto` file segment defining a `Product` message containing:
- An integer `sku` at tag index 1.
- A string `title` at tag index 2.
- A float/double `price` at tag index 3.

```protobuf
message Product {
  int32 sku = 1;
  string title = 2;
  double price = 3;
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Protobuf Definition File Syntax

**Problem:** Write Protobuf 3 syntax for `User` message containing string `name` (tag 1) and int32 `age` (tag 2).

**Expected output:**
> [!check]- Answer
> ```text
> syntax = "proto3";
> 
> message User {
>   string name = 1;
>   int32 age = 2;
> }
> ```
> ```text
> syntax = "proto3";
> message User {
> string name = 1;
> int32 age = 2;
> }
> ```
> - **Explanation:** Protobuf message definitions bind field types and unique tag numbers.
---

### Exercise 3: Protobuf Compiling Tool

**Problem:** What is the name of the official Google compiler CLI used to generate code from `.proto` files?

**Expected output:**
> [!check]- Answer
> ```text
> protoc (Protocol Buffer Compiler)
> ```
> ```bash
> protoc --js_out=import_style=commonjs,binary:. user.proto
> ```
> - **Explanation:** `protoc` compiles `.proto` schemas into language-specific code bindings.
---

## 7. Related Terms
- [Binary vs Text Formats](../level_07/binary_vs_text_formats.md) — The serialization format comparisons.
- [Base64 Encoding](../level_07/base64.md) — The text translation method used if binary bytes must travel over text channels.
- [gRPC (Remote Procedure Call)](grpc.md) — Related concept: gRPC (Remote Procedure Call).
---

## 8. Key Takeaways
- Protocol Buffers is a binary serialization format developed by Google.
- Data structures are defined in `.proto` files using strict type schemas.
- The `protoc` compiler converts schemas into language-specific helper modules.
- Protobuf discards key strings, sending only numeric tag indexes and values.
- Never alter tag index numbers in active schemas to avoid breaking backwards compatibility.
