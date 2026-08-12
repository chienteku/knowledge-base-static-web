# Protocol Buffers (protobuf)

> **Level 10 — Designing & Tooling**
> The binary schema format that powers gRPC.

---

## 1. Prerequisites
- [Serialization & Deserialization](../level_07/serialization.md) — The concepts of formatting objects for transmission.
- [gRPC (Remote Procedure Call)](grpc.md) — The network protocol designed on top of Protocol Buffers.

---

## 2. Term Category

**Data Format (Universal: Compiled into multiple programming languages .)**: Protocol Buffers (protobuf) is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Protocol Buffers Varint Integer Encoder & Decoder

**Scenario:** Implements Protobuf's variable-width integer (Varint) encoding algorithm for 64-bit integer compression.

**Requirements:**
1. Write encodeVarint(uintVal).
2. Write decodeVarint(uint8Array).
3. Verify byte-exact roundtrip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function encodeVarint(uintVal) {
>   const bytes = [];
>   let val = uintVal;
>
>   while (val > 127) {
>     // Set MSB to 1 to indicate more bytes follow
>     bytes.push((val & 0x7f) | 0x80);
>     val >>>= 7;
>   }
>   bytes.push(val & 0x7f);
>
>   return new Uint8Array(bytes);
> }
>
> function decodeVarint(uint8Array) {
>   let result = 0;
>   let shift = 0;
>
>   for (let i = 0; i < uint8Array.length; i++) {
>     const byte = uint8Array[i];
>     result |= (byte & 0x7f) << shift;
>     if ((byte & 0x80) === 0) {
>       return { result, bytesRead: i + 1 };
>     }
>     shift += 7;
>   }
>
>   throw new Error("Invalid Varint encoding");
> }
>
> // Verification tests
> const encoded300 = encodeVarint(300); // 300 encoded as 2 bytes: 0xAC 0x02
> console.assert(encoded300.length === 2, "Test 1 Failed: 300 fits in 2 bytes");
>
> const decoded = decodeVarint(encoded300);
> console.assert(decoded.result === 300 && decoded.bytesRead === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Varint Encoding Mechanism**: Uses 1 to 10 bytes for integers based on magnitude; small numbers (0-127) consume just 1 byte.
> 2. **MSB Continuation Bit**: Most Significant Bit (0x80) indicates whether additional bytes follow in the stream.
> 3. **Protobuf Space Compression**: Dramatically reduces message size compared to fixed 32-bit (4B) or 64-bit (8B) integer storage.
> 
---

### Exercise 2: Protobuf Wire Format Tag & Type Packer

**Scenario:** Packs Protobuf field tag numbers and wire types into a combined 32-bit field header key (`(field_number << 3) | wire_type`).

**Requirements:**
1. Write packProtobufTag(fieldNumber, wireType).
2. Write unpackProtobufTag(tagVal).
3. Ensure lossless roundtrip.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function packProtobufTag(fieldNumber, wireType) {
>   // Wire types: 0=Varint, 1=64-bit, 2=Length-delimited, 5=32-bit
>   return (fieldNumber << 3) | (wireType & 0x07);
> }
>
> function unpackProtobufTag(tagVal) {
>   return {
>     fieldNumber: tagVal >>> 3,
>     wireType: tagVal & 0x07
>   };
> }
>
> // Verification tests
> const tag = packProtobufTag(2, 2); // Field 2, WireType 2 (Length-delimited string/message)
> console.assert(tag === 18, "Test 1 Failed: (2 << 3) | 2 = 18");
>
> const unpacked = unpackProtobufTag(18);
> console.assert(unpacked.fieldNumber === 2 && unpacked.wireType === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Protobuf Wire Format**: Every message field is serialized as tag header key followed by payload bytes.
> 2. **Field Tag Index vs String Key**: Uses 1-byte integer tag index numbers (e.g. tag 1, tag 2) instead of string property names.
> 3. **Wire Types**: 0=Varint, 1=64-bit, 2=Length-delimited (string/bytes/sub-message), 5=32-bit.
> 
---

### Exercise 3: Protobuf Schema Backward Compatibility Validator

**Scenario:** Verifies that changes to `.proto` schema files preserve existing field tag index numbers to prevent breaking legacy binary decoders.

**Requirements:**
1. Write validateProtoSchemaCompatibility(oldTagsMap, newTagsMap).
2. Ensure existing field tag IDs are NEVER re-assigned or altered.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateProtoSchemaCompatibility(oldTagsMap = {}, newTagsMap = {}) {
>   const breakingErrors = [];
>
>   for (const [tagId, oldName] of Object.entries(oldTagsMap)) {
>     if (!(tagId in newTagsMap)) {
>       breakingErrors.push(`Protobuf breaking change: Field tag #${tagId} ('${oldName}') was removed`);
>     } else if (newTagsMap[tagId] !== oldName) {
>       breakingErrors.push(`Protobuf breaking change: Field tag #${tagId} changed name from '${oldName}' to '${newTagsMap[tagId]}'`);
>     }
>   }
>
>   return { compatible: breakingErrors.length === 0, breakingErrors };
> }
>
> // Verification tests
> const oldProto = { "1": "id", "2": "name" };
> const newProto = { "1": "id", "2": "username" }; // Tag #2 changed name!
>
> const res = validateProtoSchemaCompatibility(oldProto, newProto);
> console.assert(res.compatible === false && res.breakingErrors.length === 1, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Field Tag Permanence**: Protobuf field tag numbers MUST NEVER be changed or re-assigned once published.
> 2. **Renaming Fields Safety**: Renaming a field in `.proto` is non-breaking as long as tag number remains identical.
> 3. **Reserved Tags**: Deleted tags should be marked as `reserved` to prevent future developers from re-using the tag number.
---

## 6. Related Terms
- [Binary vs Text Formats](../level_07/binary_vs_text_formats.md) — The serialization format comparisons.
- [Base64 Encoding](../level_07/base64.md) — The text translation method used if binary bytes must travel over text channels.
- [gRPC (Remote Procedure Call)](grpc.md) — Related concept: gRPC (Remote Procedure Call).

---

## 7. Key Takeaways
- Protocol Buffers is a binary serialization format developed by Google.
- Data structures are defined in `.proto` files using strict type schemas.
- The `protoc` compiler converts schemas into language-specific helper modules.
- Protobuf discards key strings, sending only numeric tag indexes and values.
- Never alter tag index numbers in active schemas to avoid breaking backwards compatibility.
