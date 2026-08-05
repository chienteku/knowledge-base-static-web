# Client-Server Model

> **Level 1 — The Foundations of the Web**
> The fundamental architecture of the internet where one computer requests data or services (the Client), and another computer provides it (the Server).

---

## 1. Prerequisites
- None!

---

## 2. Term Category
- **Web Architecture / Core Concept**

---

## 3. Environment Context
- **Universal Standard** (The foundation of the entire World Wide Web).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before the internet, computers were isolated. If you wanted a file, you needed to physically carry a floppy disk from one computer to another. 
When computers started networking together, computer scientists needed a standardized hierarchy for how these machines should talk. Instead of every computer blindly shouting data at every other computer (a peer-to-peer mess), they created the **Client-Server Model**. 
It established a clear separation of concerns: one machine specializes in asking for things, and the other specializes in storing and providing things.

### (2) Reality Metaphor
Imagine going to a restaurant. 
You are the **Client**. You sit at the table and ask the waiter for a menu and a burger. You don't know how to cook the burger, and you don't have the ingredients. You just consume it.
The Kitchen is the **Server**. It has all the ingredients (the database) and the recipes (the backend code). It receives your request, cooks the burger, and sends it back to your table. 
The Web works exactly the same way. Your web browser (Chrome) is the Client, and it orders data from massive warehouse computers (Servers) owned by companies like Google or Amazon.

### (3) Technical Roles
- **The Client (Frontend):** Usually a web browser or a mobile app. Its job is to display information beautifully to the user, capture user clicks, and send requests.
- **The Server (Backend):** A powerful computer sitting in a data center (like AWS). Its job is to listen for requests 24/7, check if the Client has permission to view the data, query the database, and send the data back.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trusting the Client

**The mistake:** A developer writes code on the Frontend (Client) that says `if (user.isAdmin) { showAdminPanel(); }` but forgets to also secure the database on the Backend (Server).

**Why it's wrong:** The Client is running on the user's personal laptop. Therefore, the user can easily open Chrome DevTools, edit the code, and maliciously change `user.isAdmin` to `true`. 
**Golden Rule of APIs:** *Never trust the Client.* The Server is the single source of truth and must always independently verify if a user is allowed to do something before sending data.

---

### Mistake 2: Assuming Client-Side Business Logic is Tamper-Proof

**The mistake:** Relying on frontend JavaScript to validate user privileges without backend authorization checks.

**Why it's wrong:** Clients execute on untrusted user hardware. Anyone can modify JS variables or replay HTTP requests using tools like Postman or DevTools.

*Incorrect:*
```javascript
// Frontend code
if (user.role === 'admin') {
  deleteDatabaseRecord(id); // ❌ Server executes deletion without re-verifying session/role!
}
```

*Fix:*
```javascript
// Backend express handler
app.delete('/api/records/:id', authenticateToken, requireAdminRole, (req, res) => {
  // Server independently verifies JWT permissions before deletion
});
```

---

### Mistake 3: Confusing Peer-to-Peer (P2P) Architecture with Client-Server Architecture

**The mistake:** Designing a centralized REST API where clients attempt to query other end-user client devices directly.

**Why it's wrong:** Clients are frequently behind NAT firewalls and dynamic IP addresses. Direct client-to-client queries fail without a signaling server or STUN/TURN server setup.

*Incorrect:*
```http
// Client trying to fetch private data directly from another user's home IP address
fetch('http://192.168.1.45:8080/user-data'); // ❌ Unreachable over WAN NAT!
```

*Fix:*
```javascript
// Clients must communicate via a centralized Server endpoint
fetch('https://api.example.com/users/45/data');
```


---

## 6. Practice Exercises

### Exercise 1: Identify the Role

**Problem:** You are building a weather app. 
1. Where does the code live that actually knows the temperature in Tokyo?
2. Where does the code live that displays a picture of a sun on the screen?

**Expected output:**
> [!check]- Answer
> ```text
> 1. The Server. It holds the actual data and the connection to weather satellites.
> 2. The Client. It is responsible for the UI (User Interface) and drawing the sun based on the data the Server provided.
> ```
> - Who stores data vs who displays data?

---

### Exercise 2: Client-Server Responsibility Separation

**Problem:** Categorize the following tasks as either Client (C) or Server (S) responsibilities:
1. Hashing and verifying user passwords.
2. Rendering animated loading spinners.
3. Querying the SQL database for orders.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Server (S)
> 2. Client (C)
> 3. Server (S)
> ```
> ```text
> 1. Server (S) - Password cryptography must occur on the secure backend.
> 2. Client (C) - UI visual rendering occurs on the browser/app client.
> 3. Server (S) - Direct database queries must remain behind the server firewall.
> ```
> - **Explanation:** Security and data integrity tasks belong on the Server; UI rendering belongs on the Client.
---

### Exercise 3: Identifying Client-Side Security Bypasses

**Problem:** A client sends `{ price: 0.01 }` in an order payload to `/checkout`. How should the server respond?

**Expected output:**
> [!check]- Answer
> ```text
> The server must ignore client-provided prices and fetch the canonical price from its own database before charging the user.
> ```
> ```text
> The server must ignore client-provided prices and fetch the canonical price from its own database before charging the user.
> ```
> - **Explanation:** Never trust client payload values for financial transactions or pricing calculations.
---

## 7. Related Terms
- [HTTP / HTTPS](http_https.md) — The specific language the Client and Server use to talk to each other.
- [API (Application Programming Interface)](../level_03/api.md) — The waiter in the restaurant metaphor.
- [Request & Response Lifecycle](request_response.md) — Request/Response model.
- [DNS (Domain Name System)](dns.md) — DNS resolution.

---

## 8. Key Takeaways
- The **Client** requests data and displays it to the user.
- The **Server** listens for requests, processes logic, and returns data.
- The Client and Server are completely separate entities (often physically located thousands of miles apart).
- **Never trust the Client** for security or data validation; always verify on the Server.
