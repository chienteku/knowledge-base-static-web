# Nuxt.js: Zero to Hero Roadmap (50 Terms)

This document outlines the 50 critical terms for mastering Nuxt.js, broken down into 10 progressive levels.
Each term will be generated as a standardized markdown file in `terms/level_XX/`.

## Level 1: Core Concepts & Architecture
1. **Nuxt 3 Overview** (`nuxt_3_overview.md`)
2. **Vue 3 Composition API Context** (`composition_api_context.md`)
3. **Auto-imports** (`auto_imports.md`)
4. **Universal Rendering (SSR)** (`universal_rendering.md`)
5. **Nitro Engine** (`nitro_engine.md`)
6. **Hydration** (`hydration.md`)
7. **Search Engine Optimization (SEO)** (`seo.md`)

## Level 2: Directory Structure & Routing
8. **File-based Routing** (`file_based_routing.md`)
9. **`app.vue`** (`app_vue.md`)
10. **`pages/` Directory** (`pages_directory.md`)
11. **`<NuxtPage>` & `<NuxtLayout>` Components** (`nuxt_page_layout.md`)
12. **`useRoute` & `useRouter` Hooks** (`use_route_router.md`)
13. **Dynamic Routes** (`dynamic_routes.md`)
14. **`definePageMeta` Compiler Macro** (`define_page_meta.md`)
15. **`layouts/` Directory** (`layouts_directory.md`)

## Level 3: Components & Assets
16. **`components/` Directory** (`components_directory.md`)
17. **Lazy Components** (`lazy_components.md`)
18. **`assets/` vs `public/`** (`assets_vs_public.md`)
19. **ClientOnly Component** (`client_only_component.md`)
20. **NuxtLink Component** (`nuxtlink_component.md`)

## Level 4: Composables & State
21. **`composables/` Directory** (`composables_directory.md`)
22. **`useState` Hook** (`use_state.md`)
23. **Nuxt Payload (SSR State Transfer)** (`nuxt_payload.md`)
24. **`useCookie` Hook** (`use_cookie.md`)
25. **Pinia State Management** (`pinia.md`)
26. **`useNuxtApp` Context** (`use_nuxt_app.md`)

## Level 5: Data Fetching
27. **`$fetch` (ofetch)** (`dollar_fetch.md`)
28. **`useFetch`** (`use_fetch.md`)
29. **`useLazyFetch` & `useLazyAsyncData` Hooks** (`use_lazy_fetch.md`)
30. **`useAsyncData`** (`use_async_data.md`)
31. **Caching Data** (`caching_data.md`)
32. **Fetching Errors & `clearNuxtData`** (`fetching_errors.md`)

## Level 6: SEO & Configuration
33. **`useHead`** (`use_head.md`)
34. **`useSeoMeta`** (`use_seo_meta.md`)
35. **`app.config.ts`** (`app_config.md`)
36. **`nuxt.config.ts`** (`nuxt_config.md`)
37. **Runtime Config (`useRuntimeConfig`)** (`runtime_config.md`)

## Level 7: Server Engine (Nitro)
38. **Express.js (Legacy Node Server Context)** (`express_js.md`)
39. **`server/api/` Routes** (`server_api_routes.md`)
40. **`server/routes/`** (`server_routes.md`)
41. **Server Middleware** (`server_middleware.md`)
42. **H3 Request Handlers (`defineEventHandler`)** (`h3_handlers.md`)
43. **Storage Layer (unstorage)** (`storage_layer.md`)

## Level 8: Middleware & Plugins
44. **Route Middleware** (`route_middleware.md`)
45. **Global vs Named Middleware** (`global_vs_named_middleware.md`)
46. **`abortNavigation` Utility** (`abort_navigation.md`)
47. **Route Rules Configuration** (`route_rules.md`)
48. **`plugins/` Directory** (`plugins_directory.md`)
49. **Vue Plugins vs Nuxt Plugins** (`vue_vs_nuxt_plugins.md`)

## Level 9: Advanced Rendering & Architecture
50. **Static Site Generation (SSG)** (`ssg.md`)
51. **Hybrid Rendering** (`hybrid_rendering.md`)
52. **Edge-Side Rendering (ESR)** (`esr.md`)
53. **Nuxt Server Components (Islands)** (`nuxt_server_components.md`)
54. **Single Page Application (SPA) Mode** (`spa.md`)
55. **Nuxt Modules System** (`nuxt_modules.md`)
56. **Vue Suspense Integration** (`vue_suspense.md`)

## Level 10: Error Handling & Production
57. **`error.vue` & `useError`** (`error_vue.md`)
58. **`createError`, `showError` & `clearError`** (`create_error.md`)
59. **`<NuxtErrorBoundary>` Component** (`nuxt_error_boundary.md`)
60. **Nuxt DevTools** (`nuxt_devtools.md`)
61. **Standalone Build (Node server)** (`standalone_build.md`)
62. **Edge Deployment** (`edge_deployment.md`)
63. **`.output/` Directory** (`output_directory.md`)
64. **Environment Variables (`.env`)** (`env_variables.md`)
