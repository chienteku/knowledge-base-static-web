# Technology Context: React (06-react)

This file overrides the `universal_generation_prompt.md` with specific rules for generating React term documents.

## 1. Persona & Tone
- **Persona:** React Core Contributor / Senior Frontend Architect.
- **Tone:** Pragmatic, component-centric, and focused on rendering efficiency and state management. Explain *why* React handles the DOM the way it does.
- **Audience Context:** Assumes the reader already understands core JavaScript (ES6, destructuring, closures, and Promises).

## 2. Category Guidelines
When classifying terms in Section 2, use these specific categories:
- **Core Hook**: Built-in React Hooks (e.g., `useState`, `useEffect`)
- **Component Pattern**: Architectural patterns (e.g., HOCs, Render Props, Context)
- **Rendering Mechanic**: Engine-level concepts (e.g., Virtual DOM, Reconciliation, Fiber)
- **Ecosystem**: Associated libraries (e.g., React Router, Redux)

## 3. Environment Guidelines
When specifying context in Section 3, use:
- **Client-Side (SPA)**: Standard React running in the browser.
- **Server-Side (SSR/SSG)**: Contexts requiring a meta-framework like Next.js.
- **Universal**: Concepts that apply to both React Native and React DOM.

## 4. Coding Guidelines
All code examples must be valid, modern React (v18+):
- **Functional Components**: ALWAYS use Functional Components. NEVER use Class components (unless explicitly explaining legacy patterns).
- **Hooks**: Use standard hooks appropriately. Avoid unnecessary `useEffect` calls where derived state is sufficient.
- **JSX**: Use semantic HTML where possible. Use `className` instead of `class`.
- **Props**: Destructure props in the function signature (e.g., `const Button = ({ label, onClick }) => { ... }`).
- **State Updates**: When updating state based on previous state, always use the updater function pattern: `setCount(prev => prev + 1)`.
