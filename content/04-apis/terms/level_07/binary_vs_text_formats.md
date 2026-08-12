# Binary vs Text Formats

> **Level 7 — Data Formats & Serialization**
> When to send bytes (protobuf, files) instead of text (JSON, XML).

---

## 1. Prerequisites
- [Serialization & Deserialization](serialization.md) — The processes of preparing data for network transit.
- [Base64 Encoding](base64.md) — The mechanism that wraps binary data inside text strings.

---

## 2. Term Category

**Data Format (Universal: Affects database storage strategies, frontend network resource optimization, and microservice architectures.)**: Binary vs Text Formats is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Protocol Buffers / Binary vs JSON Payload Benchmark

**Scenario:** An API architecture benchmark measures payload byte size differences between text JSON payloads and packed binary ArrayBuffers.

**Requirements:**
1. Write comparePayloadFormats(userObject, binaryEncoderFn).
2. Serialize userObject as JSON string.
3. Encode userObject as binary ArrayBuffer.
4. Return byte size comparison.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function comparePayloadFormats(userObject, binaryEncoderFn) {
>   const jsonString = JSON.stringify(userObject);
>   const jsonByteSize = Buffer.byteLength(jsonString, "utf-8");
>
>   const binaryBuffer = binaryEncoderFn(userObject);
>   const binaryByteSize = binaryBuffer.byteLength || binaryBuffer.length;
>
>   const savingsPct = Number((((jsonByteSize - binaryByteSize) / jsonByteSize) * 100).toFixed(2));
>
>   return {
>     jsonByteSize,
>     binaryByteSize,
>     savingsPct,
>     isBinarySmaller: binaryByteSize < jsonByteSize
>   };
> }
>
> // Verification tests
> const user = { id: 101, active: true, balance: 49.99 };
> const mockBinaryEncoder = (obj) => {
>   const buf = new ArrayBuffer(13);
>   const view = new DataView(buf);
>   view.setUint32(0, obj.id);
>   view.setUint8(4, obj.active ? 1 : 0);
>   view.setFloat64(5, obj.balance);
>   return buf;
> };
>
> const res = comparePayloadFormats(user, mockBinaryEncoder);
> console.assert(res.isBinarySmaller === true, "Test 1 Failed: Binary must be smaller than JSON");
> console.assert(res.binaryByteSize === 13, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Text Formats (JSON/XML)**: Human-readable text strings requiring keys to be sent in every payload message.
> 2. **Binary Formats (Protobuf/MessagePack)**: Compact schema-based binary byte arrays eliminating key strings.
> 3. **Parsing Performance**: Binary formats deserialize orders of magnitude faster because they avoid string parsing overhead.
> 
---

### Exercise 2: Sensor Telemetry ArrayBuffer Pack/Unpack Engine

**Scenario:** An IoT gateway packs high-frequency temperature sensor readings into fixed-width binary ArrayBuffer packets for low-latency transmission.

**Requirements:**
1. Write packSensorData(sensorId, tempFloat, humidityInt).
2. Write unpackSensorData(arrayBuffer).
3. Ensure byte-exact roundtrip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function packSensorData(sensorId, tempFloat, humidityInt) {
>   const buffer = new ArrayBuffer(7);
>   const view = new DataView(buffer);
>
>   view.setUint16(0, sensorId);
>   view.setFloat32(2, tempFloat);
>   view.setUint8(6, humidityInt);
>
>   return buffer;
> }
>
> function unpackSensorData(buffer) {
>   const view = new DataView(buffer);
>   return {
>     sensorId: view.getUint16(0),
>     tempFloat: Number(view.getFloat32(2).toFixed(2)),
>     humidityInt: view.getUint8(6)
>   };
> }
>
> // Verification tests
> const packed = packSensorData(1001, 23.45, 65);
> console.assert(packed.byteLength === 7, "Test 1 Failed: Must be 7 bytes");
>
> const unpacked = unpackSensorData(packed);
> console.assert(unpacked.sensorId === 1001 && unpacked.humidityInt === 65, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Fixed Byte Offsets**: DataView reads binary fields at exact byte offsets (0, 2, 6) matching low-level struct layouts.
> 2. **Typed Arrays**: Uint16Array, Float32Array provide high-performance typed views over raw ArrayBuffer memory.
> 3. **Bandwidth Efficiency**: Transmits telemetry in 7 bytes vs ~80 bytes for equivalent JSON string.
> 
---

### Exercise 3: Format Serialization Protocol Selector

**Scenario:** An API client automatically selects binary format (MessagePack/Protobuf) for high-frequency streams and JSON for web UI inspection.

**Requirements:**
1. Write selectSerializationProtocol(frequencyHz, requiresHumanReadability).
2. Return 'BINARY' or 'JSON'.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function selectSerializationProtocol(frequencyHz, requiresHumanReadability = false) {
>   if (requiresHumanReadability) {
>     return "JSON";
>   }
>   if (frequencyHz >= 10) {
>     return "BINARY_PROTOBUF";
>   }
>   return "JSON";
> }
>
> // Verification tests
> console.assert(selectSerializationProtocol(100, false) === "BINARY_PROTOBUF", "Test 1 Failed");
> console.assert(selectSerializationProtocol(100, true) === "JSON", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **High-Frequency Streaming**: Real-time gaming, financial tickers, and sensor streams require binary formats to prevent GC pauses.
> 2. **Human Readability Trade-off**: JSON excels in developer ergonomics and ease of debugging in browser DevTools.
> 3. **Hybrid API Design**: Modern APIs use JSON for REST management and gRPC/Protobuf for internal microservice streams.
---

## 6. Related Terms
- [gRPC (Remote Procedure Call)](../level_10/grpc.md) — The network protocol designed on top of Protocol Buffers.
- [JSON Methods (parse / stringify)](json_methods.md) — The standard functions used to manage text-based JSON configurations.
- [Blob & ArrayBuffer](blob_arraybuffer.md) — Related concept: Blob & ArrayBuffer.
- [Character Encoding (UTF-8)](character_encoding.md) — Related concept: Character Encoding (UTF-8).
- [Protocol Buffers (protobuf)](../level_10/protocol_buffers.md) — Related concept: Protocol Buffers (protobuf).

---

## 7. Key Takeaways
- Text formats are human-readable but carry syntax bloat and higher CPU parsing overhead.
- Binary formats compile data directly into byte streams, making payloads significantly smaller and faster to parse.
- Binary formatting requires a shared schema containing numeric tag indexes to decode payloads.
- Avoid using JSON for high-traffic internal server-to-server networks; use gRPC instead.
- Use text formats for public developer APIs where ease of debugging is the priority.
