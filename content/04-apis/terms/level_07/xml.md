# XML

> **Level 7 — Data Formats & Serialization**
> The predecessor to JSON. A data formatting language that uses tags (like HTML) to structure information.

---

## 1. Prerequisites
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The modern format that replaced XML.
- [Serialization & Deserialization](serialization.md) — XML is just another format used to serialize data.

---

## 2. Term Category
- **Data Format**

---

## 3. Environment Context
- **Legacy Systems / Enterprise Architecture**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the late 1990s and 2000s, before JSON existed, computers still needed a standardized way to send text data to one another. 
Engineers looked at HTML (which was incredibly popular) and thought: "HTML is great for describing UI. What if we use the exact same tag-based syntax, but use it to describe *data*?"
Thus, **XML** was born. It allows you to create custom tags (`<user>`, `<invoice>`) to structure data hierarchically. For over a decade, it was the absolute standard for APIs (known as SOAP APIs).

### (2) What does it look like?
Compare a User object in JSON vs XML:

**JSON (Modern, Lightweight):**
```json
{
  "user": {
    "name": "Bob",
    "age": 30
  }
}
```

**XML (Older, Verbose):**
```xml
<user>
  <name>Bob</name>
  <age>30</age>
</user>
```

### (3) Why did JSON replace it?
XML is extremely "verbose" (wordy). For every piece of data, you have to write the tag name twice (the opening tag and closing tag). This made the files physically large, which wasted expensive network bandwidth.
Furthermore, parsing XML in JavaScript was a nightmare. Because JSON is literally based on JavaScript Object syntax, parsing JSON is instant and native. Today, JSON has almost entirely replaced XML in modern web APIs.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that XML still runs the world

**The mistake:** A junior developer learns about JSON and assumes XML is completely dead and irrelevant.

**Why it's wrong:** While no *new* web startups use XML for their APIs, almost all legacy enterprise systems (Banks, Hospitals, Government databases, Airlines) still run heavily on XML/SOAP architectures. Furthermore, SVG images, RSS feeds, and Microsoft Office `.docx` files are literally just XML files under the hood! 
**Golden Rule:** You must know how to read XML if you plan to integrate with enterprise software.

---

### Mistake 2: Vulnerability to XML External Entity (XXE) Injection Attacks

**The mistake:** Parsing untrusted incoming XML API payloads without disabling external entity resolution.

**Why it's wrong:** Un-configured XML parsers resolve external DTD entities (`<!ENTITY xxe SYSTEM "file:///etc/passwd">`), leaking local server files or executing SSRF attacks.

*Incorrect:*
```xml
<!-- XXE attack payload reading server files -->
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<user><name>&xxe;</name></user> <!-- ❌ XXE vulnerability! -->
```

*Fix:*
```javascript
// Configure XML parser with external entity resolution DISABLED:
parser.setFeature("http://xml.org/sax/features/external-general-entities", false);
```

---

### Mistake 3: Creating Overly Verbose XML Payloads Compared to Equivalent JSON Formats

**The mistake:** Wrapping single items in multi-layered XML tag hierarchies.

**Why it's wrong:** XML opening and closing tags (`<user><name>...</name></user>`) inflate payload sizes by 40-100% compared to compact JSON syntax.

*Incorrect:*
```xml
<users><user><id>1</id><name>Alice</name></user></users> <!-- Verbose XML payload -->
```

*Fix:*
```json
[{"id": 1, "name": "Alice"}] // Equivalent compact JSON payload
```


---

## 6. Practice Exercises

### Exercise 1: Spot the Inefficiency

**Problem:** Look at the XML below. If you had to convert this to JSON, why would the JSON payload be physically smaller in file size?
```xml
<product>
  <id>99</id>
  <name>Laptop</name>
</product>
```

**Expected output:**
> [!check]- Answer
> ```text
> Because JSON doesn't use closing tags! 
> In XML, the word "product" is written twice, "id" is written twice, and "name" is written twice. In JSON, the keys are only written once (`"name": "Laptop"`), which drastically reduces the total number of characters transferred over the network.
> ```
> - Count how many times the word "name" appears.
> 
---

### Exercise 2: Well-Formed XML Validation Rules

**Problem:** Identify 2 syntax errors in the following XML snippet:
```xml
<user id="5">
  <name>Alice</name
  <email>alice@example.com</Email>
</user>
```

**Expected output:**
> [!check]- Answer
> ```text
> Line 2: Missing closing angle bracket `>` on `</name>` tag
> Line 3: Mismatched tag case `<email>` vs `</Email>`
> ```
> ```xml
> <user id="5">
> <name>Alice</name>
> <email>alice@example.com</email>
> </user>
> ```
> - **Explanation:** XML requires matched closing tags and case-sensitive element names.
---

### Exercise 3: XPath Query Purpose

**Problem:** What is the purpose of XPath in XML processing?

**Expected output:**
> [!check]- Answer
> ```text
> XPath is a query language used to search and select specific nodes or attributes within an XML document tree.
> ```
> ```text
> XPath is a query language used to search and select specific nodes or attributes within an XML document tree.
> ```
> - **Explanation:** XPath navigates XML document tree structures.
---

## 7. Related Terms
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The lightweight successor to XML.
- [REST (Representational State Transfer)](../level_03/rest.md) — REST APIs typically use JSON, while SOAP APIs typically use XML.
- [Deserialization / Parsing](deserialization.md) — Related concept: Deserialization / Parsing.
- [SOAP & XML-RPC (legacy)](../level_10/soap_xml_rpc.md) — Related concept: SOAP & XML-RPC (legacy).

---

## 8. Key Takeaways
- **XML** is a data format that uses HTML-like tags (`<data></data>`) to structure information.
- It was the industry standard for APIs before JSON took over.
- It is highly verbose (wordy), making files larger and harder to parse in JavaScript.
- It is still heavily used in Enterprise banking, healthcare, and legacy systems.
