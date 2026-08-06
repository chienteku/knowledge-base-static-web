# Prop Drilling

> **Level 6 — Context & Global State**
> The frustrating anti-pattern of passing data through multiple layers of intermediate components that don't actually need the data, just to get it to a deeply nested child component that does.

---

## 1. Prerequisites
- [Props (Properties)](../level_01/props.md) — The vehicle being drilled.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — The strict rule that forces Prop Drilling to exist in the first place.

---

## 2. Term Category
- **React Anti-Pattern / Architectural Issue**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
We didn't design it on purpose! Prop Drilling is the natural, painful consequence of strict Unidirectional Data Flow.
Because data can only flow straight down, if the top-level `<App />` component holds the `currentUser` state, and a deeply nested `<Avatar />` component needs that user's profile picture, the data MUST travel through every single component in between them.

### (2) The Problem
```javascript
function App() {
  const [user] = useState({ name: "Alice", avatar: "url" });
  return <Layout user={user} />;
}

function Layout({ user }) {
  // Layout doesn't care about 'user', it just passes it down.
  return <Header user={user} />;
}

function Header({ user }) {
  // Header doesn't care either!
  return <UserProfile user={user} />;
}

function UserProfile({ user }) {
  // FINALLY! The component that actually needs it!
  return <Avatar src={user.avatar} />;
}
```
In this example, `Layout` and `Header` are acting as completely useless middlemen. They are forced to accept the `user` prop and pass it down. 
If you decide to rename `user` to `currentUser`, you have to open 5 different files and rename the prop 5 times. This makes refactoring a nightmare.

### (3) When does it become a problem?
Prop drilling 1 or 2 levels deep is perfectly fine and is standard React code. 
It becomes an anti-pattern when you are drilling 4, 5, or 10 levels deep. At that point, you need to transition to a **Global State** solution (like the Context API).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Reaching for Global State too early

**The mistake:** A developer hates typing props, so they put *every single variable* into a massive Global State manager (like Redux) just to avoid passing a prop down 1 level.

**Why it's wrong:** Global state is difficult to track and can cause unnecessary re-renders across the entire application. Props are simple, fast, and highly predictable. 
**Golden Rule:** Don't be afraid of shallow prop drilling. Only reach for Global State when the drilling becomes genuinely painful to maintain (usually 3+ levels deep for data used by many different components).

---



### Mistake 2: Passing Props Through 10 Intermediate Container Components That Never Use the Props

**The mistake:** Passing `user` prop through `<App>` -> `<Layout>` -> `<Page>` -> `<Sidebar>` -> `<Widget>` -> `<UserProfile>`.

**Why it's wrong:** Prop drilling tightly couples intermediate layout components to data requirements of distant children. Use Component Composition (passing `<UserProfile />` as `children`) or Context API.

*Incorrect:*
```javascript
// Passing user prop down 6 component layers manually
```

*Fix:*
```javascript
Use Component Composition: <Layout sidebar={<UserProfile user={user} />} />
```

### Mistake 3: Over-Using Global State Stores to Solve 2-Level Prop Drilling

**The mistake:** Replacing a 2-level prop pass from Parent to Child with Redux global store.

**Why it's wrong:** Prop drilling 1 or 2 levels down is completely normal and idiomatic in React! Replacing local prop passing with global stores adds unnecessary architectural complexity.

*Incorrect:*
```javascript
// Adding global Redux store for 2-level parent-child prop pass
```

*Fix:*
```javascript
Pass props directly for 1-2 component levels
```

## 6. Practice Exercises

### Exercise 1: Identifying the Middleman

**Problem:** You have a `Theme` state in `<Main />`. You pass it to `<ArticleList />`. `<ArticleList />` maps over data and passes `Theme` to `<ArticleCard />`. `<ArticleCard />` passes it to `<CardButton />`. 
Which components are the "middlemen" suffering from prop drilling?

**Expected output:**
> [!check]- Answer
> ```text
> `<ArticleList />` and `<ArticleCard />`. 
> They probably don't use the Theme themselves; they are just passing it down so the `<CardButton />` can change its color.
> ```
> - Which components accept the prop but never actually use it in their own JSX?
> 
---



### Exercise 2: Solving Prop Drilling via Composition

**Problem:** Refactor `<Page user={user} />` passing `user` down to `<Header>` by passing `<Header user={user} />` as a `children` prop.

**Expected output:**
> [!check]- Answer
> ```text
> function Page({ header }) { return <main>{header}<Content /></main>; } // In parent: <Page header={<Header user={user} />} />
> ```
> ```javascript
> function Page({ header }) {
>   return (
>     <main>
>       {header}
>       <Content />
>     </main>
>   );
> }
> // Usage in parent:
> <Page header={<Header user={user} />} />
> ```
>
> **Explanation:** Component Composition solves prop drilling without adding global state overhead.
> 
---

### Exercise 3: Identifying Prop Drilling Threshold

**Problem:** When does prop passing become problematic 'prop drilling'? (When 4+ intermediate components pass props without using them).

**Expected output:**
> [!check]- Answer
> ```text
> When 4+ intermediate container components pass props without using them
> ```
> ```text
> When 4+ intermediate container components pass props without using them
> ```
>
> **Explanation:** Deep prop chains complicate refactoring and pollute intermediate component APIs.
> 
## 7. Related Terms
- [The Context API](context_api.md) — The official React feature designed to bypass Prop Drilling.
- [State Management (Redux / Zustand)](state_management.md) — Third-party libraries (Zustand/Redux) designed to solve this exact problem at scale.
- [Lifting State Up](../level_02/lifting_state_up.md) — Related concept: Lifting State Up.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — Related concept: Unidirectional Data Flow.
- [`useContext` Hook](use_context.md) — Related concept: `useContext` Hook.

---

## 8. Key Takeaways
- **Prop Drilling** is passing props through components that don't need them, just to reach a component further down the tree.
- It is a natural byproduct of Unidirectional Data Flow.
- Shallow prop drilling (1-2 levels) is totally fine.
- Deep prop drilling (4+ levels) makes code brittle and hard to refactor.
- When prop drilling gets out of hand, you solve it using Global State.
