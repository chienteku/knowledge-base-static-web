# Binary vs Text Formats

> **Level 7 — Data Formats & Serialization**
> When to send bytes (protobuf, files) instead of text (JSON, XML).

---

## 1. Prerequisites
- [Serialization & Deserialization](./serialization.md) — The processes of preparing data for network transit.
- [Base64 Encoding](./base64.md) — The mechanism that wraps binary data inside text strings.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Universal**: Affects database storage strategies, frontend network resource optimization, and microservice architectures.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
API developers default to text-based formats (like JSON and XML) because they are human-readable, easy to debug, and work natively with web scripting. 

However, in high-performance or low-bandwidth systems (such as high-traffic microservices, IoT devices, or mobile apps on spotty cell connections), text formats present significant drawbacks:
- **Redundant Syntax Bloat:** Text formats require structural characters (braces, quotes, colons, tags) and field names (e.g. repeating `"productId"` 1,000 times in a list), which inflates payload sizes.
- **Binary Conversion Penalty:** Storing binary files (images/videos) inside JSON requires converting them to Base64 text, causing a **33% increase in file size**.
- **CPU Parse Overhead:** Converting strings back into memory structures requires parsing text characters, consuming high CPU cycles.

To bypass these limitations, developers use **Binary Formats** (such as Protocol Buffers / Protobuf, MessagePack, or Avro):
- These formats serialize objects directly into raw byte sequences rather than text characters.
- They omit keys and structural symbols. Instead, they use a pre-compiled schema where each field is mapped to a small numeric index tag.

---

### (2) Comparative Trade-offs

| Feature | Text Formats (JSON, XML) | Binary Formats (Protobuf, MessagePack) |
|---|---|---|
| **Human Readable** | Yes (Open in any text editor) | No (Looks like garbage characters) |
| **Payload Size** | Larger (Includes syntax and keys) | Much Smaller (Up to 5x-10x compression) |
| **Parsing Speed** | Slower (Requires character parsing) | Extremely Fast (Near-zero CPU cycles) |
| **Strict Typing** | Optional / Dynamic | Mandatory (Defined via Schema) |
| **Best Used For** | Public APIs, Web Clients, Debugging | Internal Microservices (gRPC), IoT, File Storage |

---

### (3) Reality Metaphor
Imagine shipping items with instructions.
- **Text Format (JSON)** is like writing a **detailed letter** describing the package contents: *"I am shipping 3 crates of red apples. Each crate is 10 kilograms."* Anyone who intercepts the letter can read it, but you waste paper writing the same descriptive words over and over.
- **Binary Format (Protobuf)** is like scanning a **barcode** containing the numbers `[3, 1, 10]`. The sender and receiver both have a copy of a shared instruction book (**the schema**) that translates the values: the first position `3` = apples, the second position `1` = red, and the third position `10` = weight. The barcode is tiny and read instantly by a scanner, but meaningless to a human without the book.

---

### (4) Technical Implementation Example

#### 1. The Schema Definition File (`product.proto`)
Binary formats require a schema definition to outline positions:
```protobuf
syntax = "proto3";

message Product {
  int32 id = 1;         // Assigned numeric tag index 1
  string name = 2;       // Assigned numeric tag index 2
  double price = 3;      // Assigned numeric tag index 3
}
```

#### 2. JavaScript Usage (Encoding to Binary Bytes)
Using a compiled Protobuf module, encoding produces a compact byte array:

```javascript
import protobuf from 'protobufjs';

// Load the schema
const root = await protobuf.load("product.proto");
const ProductMessage = root.lookupType("Product");

const payload = { id: 101, name: "Premium Widget", price: 99.99 };

// 1. Serialize object into binary byte array (Uint8Array)
const binaryBuffer = ProductMessage.encode(payload).finish();
console.log("Binary Output:", binaryBuffer); 
// Output: <Uint8Array 08 65 12 0e 50 72 65 6d 69 75 6d 20 57 69 64 67 65 74 19 9a 99 99 99 99 ff 58 40>
console.log("Binary Size:", binaryBuffer.length, "bytes"); // Output: 27 bytes

// Compare to JSON equivalent:
const jsonString = JSON.stringify(payload);
console.log("JSON Size:", Buffer.byteLength(jsonString), "bytes"); // Output: 47 bytes
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using JSON for high-throughput internal microservice networks

**The mistake:** Building backend microservices that communicate with each other using REST over JSON, despite handling millions of requests per second.

**Why it's wrong:** Internal server-to-server networks don't require human-readable text. Using JSON for internal calls wastes gigabytes of network bandwidth on repeating keys, while forcing servers to waste CPU cycles parsing strings.

*Fix:* Implement **gRPC** utilizing Protocol Buffers for internal microservice communications to optimize bandwidth and CPU usage.

---

### Mistake 2: Using Text-Based JSON for High-Volume Internal Microservice Payloads (High CPU/Network Cost)

**The mistake:** Parsing massive JSON payloads (50MB) millions of times per second in high-frequency backend pipelines.

**Why it's wrong:** Text-based formats require expensive string parsing and CPU overhead. Binary protocols (Protocol Buffers, gRPC, MessagePack) serialize directly into compact binary structures.

*Incorrect:*
```http
/* Parsing 50MB JSON text strings continuously across high-throughput microservices */
```

*Fix:*
```http
/* Use gRPC / Protocol Buffers for fast binary serialization across internal microservices */
```

---

### Mistake 3: Choosing Binary Formats for Public Third-Party Developer APIs (Developer Experience Friction)

**The mistake:** Exposing raw Protocol Buffer binary endpoints to external web and mobile third-party developers.

**Why it's wrong:** Binary formats are not human-readable and require specialized SDK compilers. Use JSON or XML for public developer facing APIs.

*Incorrect:*
```http
/* Requiring external third-party web apps to compile Protobuf binaries */
```

*Fix:*
```http
/* Expose clean, human-readable JSON REST endpoints for public third-party APIs */
```


---

## 6. Practice Exercises

### Exercise 1: Format Selector

**Problem:** Choose the most appropriate format (**Text/JSON** or **Binary/Protobuf**) for the following scenarios:

1. A public API endpoint designed for third-party developers to query product details.
2. Storing high-frequency real-time flight metrics from a drone's sensors to local disk.
3. Synchronizing chat messages between a web browser client and a Node.js server.

> [!check]- Answer
> - 1. **Text/JSON** (Human readability is critical for developers using public APIs).
> - 2. **Binary/Protobuf** (The drone has limited storage, weak network transmission, and CPU constraints. Minimizing file size and parsing cycles is essential).
> - 3. **Text/JSON** (Web applications work natively with JSON, making integration simple).


---

### Exercise 2: Text vs Binary Format Comparison

**Problem:** Match data format to category (Text vs Binary):
1. JSON
2. Protocol Buffers (Protobuf)
3. XML
4. MessagePack

**Expected output:**
> [!check]- Answer
> ```text
> 1. Text
> 2. Binary
> 3. Text
> 4. Binary
> ```
> ```text
> 1. JSON -> Text-based
> 2. Protobuf -> Binary-based
> 3. XML -> Text-based
> 4. MessagePack -> Binary-based
> ```
> - **Explanation:** Text formats prioritize human readability; binary formats prioritize speed and size.
---

### Exercise 3: Binary Format Bandwidth Advantage

**Problem:** Why do binary formats consume significantly less network bandwidth than JSON for numeric data?

**Expected output:**
> [!check]- Answer
> ```text
> Binary formats store numbers in fixed bit representations (e.g. 4 bytes for 32-bit int), whereas JSON serializes numbers into ASCII character strings (e.g. "123456789" consumes 9 bytes).
> ```
> ```text
> Binary formats store numbers in fixed bit representations (e.g. 4 bytes for 32-bit int), whereas JSON serializes numbers into ASCII character strings (e.g. "123456789" consumes 9 bytes).
> ```
> - **Explanation:** Binary encodings bypass string character conversion.
---

## 7. Related Terms
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — The network protocol designed on top of Protocol Buffers.
- [JSON Methods (parse / stringify)](./json_methods.md) — The standard functions used to manage text-based JSON configurations.

---

## 8. Key Takeaways
- Text formats are human-readable but carry syntax bloat and higher CPU parsing overhead.
- Binary formats compile data directly into byte streams, making payloads significantly smaller and faster to parse.
- Binary formatting requires a shared schema containing numeric tag indexes to decode payloads.
- Avoid using JSON for high-traffic internal server-to-server networks; use gRPC instead.
- Use text formats for public developer APIs where ease of debugging is the priority.
