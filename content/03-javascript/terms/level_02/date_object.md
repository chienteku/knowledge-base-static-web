# Date object

> **Level 2 — Control Flow & Data Structures**
> Representing and manipulating dates/times.

---

## 1. Prerequisites
- [Object](object.md) — A collection of key-value pairs representing properties and methods.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Date object is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications must frequently work with time: logging when a transaction occurred, setting a deadline for a task, or rendering calendars. To represent specific moments in time, JavaScript provides the built-in **`Date`** object constructor. 

Under the hood, a Date object represents time as a single integer: the number of milliseconds that have elapsed since **January 1, 1970, 00:00:00 UTC** (referred to as the Unix Epoch). When you instantiate a Date object, the engine pulls the current system clock time and creates a set of helper methods to let you easily extract years, months, days, hours, and minutes.

### (2) Reality Metaphor
A Date object is like a smart digital watch. 
- Calling `new Date()` is like buying a new watch that automatically initializes itself to the current moment.
- You can press side buttons on the watch to read the year, month, or current hour (these are getter methods like `.getFullYear()`).
- You can also manually pull out the watch dials to set the hands back to a historical birthday or forward to a future date (these are setter methods like `.setFullYear()`).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Instantiating a new Date object representing the current moment
const now = new Date();
console.log(now.toString()); // String representation of current date

// Getting specific date parts
console.log(now.getFullYear()); // e.g., 2026
console.log(now.getMonth());    // e.g., 6 (representing July; 0-indexed!)
console.log(now.getDate());     // e.g., 17 (day of the month)
```

#### Fuller Example
```javascript
// Scheduling a feature expiration deadline 30 days in the future
const registrationDate = new Date("2026-07-17T12:00:00"); // Parse specific ISO date
console.log("Registered on:", registrationDate.toDateString()); // "Registered on: Fri Jul 17 2026"

// Extract the Epoch timestamp (milliseconds since 1970)
const registrationTimestamp = registrationDate.getTime();
console.log("Timestamp (ms):", registrationTimestamp); 

// Calculate 30 days in milliseconds: days * hours * minutes * seconds * ms
const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

// Create a new Date object representing the deadline by adding milliseconds
const expirationDate = new Date(registrationTimestamp + thirtyDaysInMs);

console.log("Plan Expiration Date:", expirationDate.toDateString()); 
// "Plan Expiration Date: Sun Aug 16 2026"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that Months are Zero-Indexed

**The mistake:** Assuming `getMonth()` returns `1` for January, `2` for February, and so on.

**Why it's wrong:** In JavaScript's Date implementation, months are zero-indexed (starting at `0` for January and ending at `11` for December). Failing to account for this indexing scheme results in calendar math logic bugs.

*Incorrect:*
```javascript
const birthday = new Date("2026-05-10"); // May 10th

// Intent: print "Month of birthday: 5"
console.log("Month of birthday:", birthday.getMonth()); // Logs 4 (May is index 4!)
```

*Fix:*
```javascript
const birthday = new Date("2026-05-10");

// Add 1 to get the standard human-readable calendar month
const humanMonth = birthday.getMonth() + 1;
console.log("Month of birthday:", humanMonth); // 5
```

### Mistake 2: Creating a Date Object without the `new` keyword

**The mistake:** Declaring a Date object variable using `const date = Date();`.

**Why it's wrong:** Calling `Date()` as a regular function (without the `new` keyword) ignores all arguments and returns a plain `String` representation of the current time, rather than a Date object instance. You cannot call methods like `.getFullYear()` on a string.

*Incorrect:*
```javascript
const birthDate = Date("1995-12-17"); // Returns a string of current time!
console.log(typeof birthDate); // "string"

console.log(birthDate.getFullYear()); // TypeError: birthDate.getFullYear is not a function
```

*Fix:*
```javascript
const birthDate = new Date("1995-12-17"); // Correctly instantiates a Date object
console.log(typeof birthDate); // "object"
console.log(birthDate.getFullYear()); // 1995
```

---

### Mistake 3: Unhandled Asynchronous Failures in Date Object Operations

**The mistake:** Executing asynchronous operations within Date Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/date_object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/date_object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in date_object: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Subscription Expiration & Renewal Calculator

**Scenario:** A SaaS billing engine calculates subscription expiration dates by adding billing cycles (30 days) to a start date and determining if an account has expired compared to Date.now().

**Requirements:**
1. Write isSubscriptionExpired(startDateIso, billingDays).
2. Parse startDateIso into a Date instance.
3. Add billingDays * 86400000 milliseconds to start date time.
4. Return object { expirationIso, isExpired }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isSubscriptionExpired(startDateIso, billingDays) {
>   const startDate = new Date(startDateIso);
>   const durationMs = billingDays * 24 * 60 * 60 * 1000;
>   const expirationTime = startDate.getTime() + durationMs;
>   const expirationDate = new Date(expirationTime);
>   const now = Date.now();
>
>   return {
>     expirationIso: expirationDate.toISOString(),
>     isExpired: now > expirationTime
>   };
> }
>
> // Verification tests
> const res = isSubscriptionExpired("2026-01-01T00:00:00.000Z", 30);
> console.assert(res.expirationIso === "2026-01-31T00:00:00.000Z", "Test 1 Failed");
> console.assert(res.isExpired === true, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Epoch Representation**: JavaScript Date objects store time internally as milliseconds since Unix Epoch (Jan 1, 1970 UTC).
> 2. **Date.now() Accessor**: Date.now() returns current timestamp milliseconds directly without instantiating Date objects.
> 3. **ISO Standard Formatting**: The .toISOString() method formats dates as standardized ISO 8601 UTC strings.
> 
---

### Exercise 2: Flight Duration & Timezone Offset Calculator

**Scenario:** An international flight booking service calculates flight duration in hours between departure and arrival UTC ISO timestamps.

**Requirements:**
1. Write calculateFlightDurationHours(departureIso, arrivalIso).
2. Parse ISO strings into Date instances.
3. Calculate time difference using getTime().
4. Return duration formatted in hours.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateFlightDurationHours(departureIso, arrivalIso) {
>   const depDate = new Date(departureIso);
>   const arrDate = new Date(arrivalIso);
>
>   if (Number.isNaN(depDate.getTime()) || Number.isNaN(arrDate.getTime())) {
>     throw new Error("Invalid date input");
>   }
>
>   const diffMs = arrDate.getTime() - depDate.getTime();
>   const hours = diffMs / (1000 * 60 * 60);
>   return Number(hours.toFixed(2));
> }
>
> // Verification tests
> const duration = calculateFlightDurationHours("2026-06-01T10:00:00.000Z", "2026-06-01T15:30:00.000Z");
> console.assert(duration === 5.50, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Timestamp Subtraction**: Subtracting Date instances or getTime() results evaluates total elapsed milliseconds.
> 2. **Date Validation**: Passing invalid strings to Date constructor produces Date instance where getTime() returns NaN.
> 3. **UTC Standardization**: ISO 8601 timestamps eliminate local system timezone ambiguity.
> 
---

### Exercise 3: Audit Log Date Boundary Filter

**Scenario:** A security compliance system filters audit log records falling within a specified start and end Date range.

**Requirements:**
1. Write filterLogsByDateRange(logs, startDate, endDate).
2. Convert log timestamp strings to Date objects.
3. Filter log entries where logDate >= startDate and logDate <= endDate.
4. Return filtered log entries.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function filterLogsByDateRange(logs, startDate, endDate) {
>   const startTime = startDate.getTime();
>   const endTime = endDate.getTime();
>
>   return logs.filter(log => {
>     const logTime = new Date(log.timestamp).getTime();
>     return logTime >= startTime && logTime <= endTime;
>   });
> }
>
> // Verification tests
> const logs = [
>   { id: 1, timestamp: "2026-05-01T10:00:00.000Z" },
>   { id: 2, timestamp: "2026-05-15T10:00:00.000Z" },
>   { id: 3, timestamp: "2026-06-01T10:00:00.000Z" }
> ];
> const filtered = filterLogsByDateRange(logs, new Date("2026-05-01T00:00:00Z"), new Date("2026-05-20T00:00:00Z"));
> console.assert(filtered.length === 2, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Relational Comparisons**: Date objects or numeric timestamps support relational operators (>=, <=).
> 2. **Date Instance Mutability**: Methods like .setDate() or .setHours() mutate the Date instance state in place.
> 3. **Constructor Overloads**: The Date constructor accepts ISO strings, millisecond numbers, or date component integers.
---

## 6. Related Terms
- [Timers (setTimeout / setInterval / clearTimeout)](../level_05/timers.md) — Functions used to execute code after delays or periodically.
- [JSON / JSON.stringify / JSON.parse](../level_07/json.md) — Text data representation (Note: JSON has no date type, so Date objects are serialized to strings).

---

## 7. Key Takeaways
- The `Date` object represents a single moment in time, stored as milliseconds since the Unix Epoch (January 1, 1970 UTC).
- You must instantiate Date objects using the `new` keyword (e.g. `new Date()`) to get a true Date object with access to time manipulation methods.
- Months are zero-indexed (`0` = January, `11` = December); days of the month (`.getDate()`) are 1-indexed.
- Use `.getTime()` to get the raw millisecond Epoch value, which is useful for performing date addition and subtraction calculations.
