# XML

> **Level 7 — Data Formats & Serialization**
> The predecessor to JSON. A data formatting language that uses tags (like HTML) to structure information.

---

## 1. Prerequisites
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The modern format that replaced XML.
- [Serialization & Deserialization](serialization.md) — XML is just another format used to serialize data.

---

## 2. Term Category

**Data Format (Legacy Systems / Enterprise Architecture)**: XML is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: XML Document to JSON Converter Parser

**Scenario:** A legacy API integration module converts simple XML response text strings into JavaScript JSON objects.

**Requirements:**
1. Write simpleXmlToJson(xmlString).
2. Extract tags and inner text content.
3. Return object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function simpleXmlToJson(xmlString) {
>   if (!xmlString || typeof xmlString !== "string") return null;
>
>   const result = {};
>   const tagRegex = /<([^>]+)>([^<]*)<\/>/g;
>   let match;
>
>   while ((match = tagRegex.exec(xmlString)) !== null) {
>     const [, tagName, tagValue] = match;
>     result[tagName] = tagValue.trim();
>   }
>
>   return result;
> }
>
> // Verification tests
> const xml = "<user><name>Alice</name><role>Admin</role></user>";
> const json = simpleXmlToJson(xml);
>
> console.assert(json.name === "Alice" && json.role === "Admin", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **XML (Extensible Markup Language)**: Legacy markup language for structured data exchange, predating JSON.
> 2. **XML vs JSON Verbosity**: XML requires closing tags (<name>Alice</name>), making payloads significantly larger than JSON.
> 3. **Legacy API Integration**: SOAP web services and enterprise systems still require XML request/response handling.
> 
---

### Exercise 2: XML External Entity (XXE) Injection Security Filter

**Scenario:** An API gateway sanitizes incoming XML payloads to block dangerous `<!DOCTYPE` and `<!ENTITY` declarations that trigger XXE attacks.

**Requirements:**
1. Write sanitizeXmlPayload(xmlString).
2. Check for <!DOCTYPE and <!ENTITY.
3. Reject or strip dangerous declarations.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function sanitizeXmlPayload(xmlString) {
>   if (typeof xmlString !== "string") return { valid: false };
>
>   const hasXxe = /<!DOCTYPE|<!ENTITY/i.test(xmlString);
>   if (hasXxe) {
>     return {
>       valid: false,
>       error: "Security Alert: XXE (XML External Entity) injection detected!"
>     };
>   }
>
>   return { valid: true, cleanXml: xmlString };
> }
>
> // Verification tests
> const maliciousXml = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><user>&xxe;</user>';
> console.assert(sanitizeXmlPayload(maliciousXml).valid === false, "Test 1 Failed: Must block XXE payload");
>
> const safeXml = "<user><name>Alice</name></user>";
> console.assert(sanitizeXmlPayload(safeXml).valid === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **XXE Attack Vulnerability**: Attacker injects external entity references into XML to read local server files or scan internal networks.
> 2. **Disabling DTD Processing**: Disabling Document Type Definitions (DTDs) in XML parsers prevents XXE execution.
> 3. **Legacy Security Defense**: Critical security check when supporting XML endpoints in Node.js or Java backends.
> 
---

### Exercise 3: REST XML Request Payload Builder

**Scenario:** Constructs a structured XML payload string for sending to legacy SOAP/XML REST endpoints.

**Requirements:**
1. Write buildXmlPayload(rootTag, dataObj).
2. Wrap key-values in XML tags.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildXmlPayload(rootTag, dataObj = {}) {
>   const tags = Object.entries(dataObj)
>     .map(([k, v]) => `<${k}>${v}</${k}>`)
>     .join("");
>
>   return `<?xml version="1.0" encoding="UTF-8"?><${rootTag}>${tags}</${rootTag}>`;
> }
>
> // Verification tests
> const xml = buildXmlPayload("request", { id: 101, action: "sync" });
>
> console.assert(xml.startsWith('<?xml version="1.0"'), "Test 1 Failed");
> console.assert(xml.includes("<id>101</id><action>sync</action>"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **XML Declaration Header**: <?xml version='1.0' encoding='UTF-8'?> specifies XML spec version and character encoding.
> 2. **Content-Type: application/xml**: XML API requests require Content-Type: application/xml or text/xml headers.
> 3. **Strict Syntax Rules**: XML mandates closing tags, quote attributes, and case-sensitive matching.
---

## 6. Related Terms
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The lightweight successor to XML.
- [REST (Representational State Transfer)](../level_03/rest.md) — REST APIs typically use JSON, while SOAP APIs typically use XML.
- [Deserialization / Parsing](deserialization.md) — Related concept: Deserialization / Parsing.
- [SOAP & XML-RPC (legacy)](../level_10/soap_xml_rpc.md) — Related concept: SOAP & XML-RPC (legacy).

---

## 7. Key Takeaways
- **XML** is a data format that uses HTML-like tags (`<data></data>`) to structure information.
- It was the industry standard for APIs before JSON took over.
- It is highly verbose (wordy), making files larger and harder to parse in JavaScript.
- It is still heavily used in Enterprise banking, healthcare, and legacy systems.
