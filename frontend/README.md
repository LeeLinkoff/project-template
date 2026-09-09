# Generic React App Template

Reusable frontend shell extracted from the existing React/Vite card-and-tabs pattern.

```text
frontend/
├── src/
│   ├── api/
│   │   └── client.js              (Central API boundary, including /health)
│   │
│   ├── components/
│   │   ├── AppHeaderCard.jsx      (Generic application header/card)
│   │   ├── BackendHealthCard.jsx  (Backend health check, status, and refresh)
│   │   ├── ErrorMessage.jsx       (Reusable user-facing error/details display)
│   │   ├── GenericTabs.jsx        (Generic Radix-based tab component)
│   │   └── MainContentCard.jsx    (Container for primary application content)
│   │
│   ├── logging/
│   │   └── logger.js              (Centralized configurable frontend logging)
│   │
│   ├── App.jsx                    (Top-level application composition and identity)
│   ├── App.css                    (Shared application styling)
│   └── main.jsx                   (React application entry point)
│
├── index.html                     (HTML entry point used by Vite)
├── package.json                   (Project metadata, scripts, and dependencies)
├── package-lock.json              (Locked npm dependency versions)
├── README.md                      (Frontend documentation)
└── vite.config.js                 (Vite development and build configuration)
```

## JavaScript vs. TypeScript

This template intentionally uses JavaScript by default. That choice is not a recommendation that JavaScript is universally preferable to TypeScript, nor does it imply that TypeScript should be avoided for production applications.

JavaScript and TypeScript involve a real engineering tradeoff. The appropriate choice depends on the size, complexity, expected lifetime, team structure, and risk profile of the application.

### What TypeScript provides

TypeScript adds static type checking on top of JavaScript. Its primary benefits include:

- Catching many type-related errors during development rather than at runtime.
- Making data structures, function contracts, component props, and application models explicit.
- Providing stronger IDE navigation, autocomplete, and refactoring support.
- Making changes across a large codebase safer because the compiler can identify many affected call sites.
- Improving communication between developers by making expected types part of the code.
- Providing additional value as applications and development teams grow.

These benefits can be substantial in large, complex, long-lived applications.

They are not free, however. TypeScript also introduces:

- Type definitions that must be created and maintained.
- Additional compiler and project configuration.
- Generic types and other type-system concepts that can increase code complexity.
- Type declarations for external or dynamically shaped data.
- Occasional friction between runtime JavaScript behavior and the compile-time type model.
- Additional migration and maintenance considerations when libraries or APIs change.

For applications where those costs are outweighed by improved safety and maintainability, TypeScript is an appropriate choice.

### What JavaScript provides

JavaScript removes the additional static type layer and therefore provides a smaller and more direct development baseline.

It can be appropriate when:

- The frontend is small or relatively straightforward.
- Most business rules reside in backend services rather than the browser.
- Component state and data structures are uncomplicated.
- The development team is small.
- Rapid iteration is important.
- The application's expected size or lifetime does not justify additional type infrastructure.
- Existing testing, validation, linting, API boundaries, and coding practices provide sufficient confidence for the application's requirements.

Using JavaScript does not eliminate the need for engineering discipline. Runtime input still needs validation, APIs still need clear contracts, components still need sensible boundaries, and important behavior still needs testing.

Likewise, TypeScript does not eliminate those responsibilities. Static typing can prevent an important class of errors, but it does not prove that application logic is correct, that an API returned semantically valid data, or that the software satisfies its requirements.

### JavaScript vs. TypeScript at a Glance

| Consideration | JavaScript | TypeScript |
|---|---|---|
| **Initial simplicity** | Simpler starting point with less configuration and type infrastructure. | Adds a type system, compiler configuration, and associated conventions. |
| **Type safety** | Type-related issues are generally discovered through runtime behavior, testing, validation, and tooling. | Static checking catches many type-related issues during development and compilation. |
| **Development speed** | Can allow faster initial development when the application and data structures are straightforward. | May require more upfront work but can reduce certain errors and make later changes safer. |
| **Code verbosity** | Usually requires less supporting type information. | Type annotations, interfaces, generics, and other definitions can add code and complexity. |
| **Refactoring** | Refactoring relies more heavily on tests, IDE analysis, conventions, and developer understanding. | Compiler-assisted analysis can make large or cross-cutting refactors safer. |
| **IDE/tooling** | Modern JavaScript provides strong IDE support, autocomplete, linting, and navigation. | Typically provides stronger type-aware autocomplete, navigation, and compile-time feedback. |
| **API/data contracts** | Contracts are established through API design, documentation, runtime validation, tests, and conventions. | Types can explicitly model expected API and application data structures at development time. |
| **Runtime validation** | Required for untrusted or external data. | Still required. TypeScript types do not validate runtime data by themselves. |
| **Testing** | Testing remains essential for application behavior and correctness. | Testing remains essential; static typing does not prove business logic is correct. |
| **Small applications** | Often a reasonable choice when the frontend is simple and the additional type layer provides limited benefit. | Can still be used, but the additional structure may provide less return for a small application. |
| **Large applications** | Can work, but maintaining contracts and safely coordinating changes generally becomes more dependent on discipline and tooling as complexity grows. | Often increasingly valuable as codebases, shared models, dependencies, and teams grow. |
| **Team size** | Often easier to manage with a small team that understands the application's conventions and boundaries. | Explicit contracts can provide additional value when many developers or teams share a codebase. |
| **Complex client-side logic** | Appropriate when complexity remains manageable through clear design, testing, and validation. | Often preferable when the frontend contains substantial state, domain models, or business logic. |
| **Maintenance cost** | Avoids maintaining a separate static type layer. | Types themselves become part of the codebase and must evolve with the application. |
| **Best fit** | Favors **simplicity and minimal upfront complexity** when requirements do not justify more. | Favors **additional compile-time safety and stronger contracts** when application complexity justifies the cost. |
| **Thin-client architecture** | Consistent with this template's intentionally thin presentation/API-client model. With little client-side domain logic and relatively simple state, the incremental value of an additional static type layer may be smaller. | Still provides useful compile-time checking and explicit contracts, with its value generally increasing as client-side state, domain models, business logic, and shared contracts become more complex. |
| **Template default** | **Yes.** Provides the least-complex generic baseline and can be expanded when requirements are known. | **No.** Should be introduced when a specific project's requirements make its benefits worthwhile. |

### Why this template defaults to JavaScript

This repository is intended to be a **generic starting point**, not a prescription for the technology choices of every application built from it.

At the template stage, there is no concrete application domain, team size, expected lifetime, client-side complexity, or risk profile from which to conclude that TypeScript's additional static type layer is required.

The template therefore follows a deliberate engineering principle:

**Start with the simplest implementation that adequately addresses the known requirements, and introduce additional complexity when the requirements provide a reason for it.**

For this template, that means starting with JavaScript.

This is not an argument against TypeScript. TypeScript provides meaningful benefits, including stronger compile-time checking, explicit contracts, safer large-scale refactoring, and richer type-aware development tooling. Those benefits can become increasingly valuable as an application grows in size and complexity.

The tradeoff is that TypeScript also introduces another layer that must be designed and maintained: types, interfaces, compiler configuration, type-system conventions, and potentially more complex representations of application and external data.

For a generic template whose eventual requirements are unknown, imposing that additional layer by default would mean making an architectural decision **before there is a demonstrated requirement for it**.

JavaScript therefore represents the intentionally lower-complexity baseline. TypeScript remains a project-level architectural decision that should be introduced when its additional guarantees provide meaningful value to the application being built.

If a project grows to include substantial client-side business logic, complex state, shared domain models, extensive API contracts, multiple contributing teams, or significant refactoring risk, the balance may shift strongly toward TypeScript.

Conversely, if the frontend remains small, thin, and primarily concerned with presentation and API interaction, JavaScript may remain entirely appropriate.

The question is therefore not whether a modern frontend *should* use TypeScript as a matter of convention. The engineering question is:

**Does the additional static type layer provide enough value for this application's actual complexity, risk, and maintenance requirements to justify introducing and maintaining it?**

For this generic template, before those requirements are known, the deliberate answer is to **err on the side of simplicity**.

### Thin-Client Architectural Assumption

The JavaScript default is also directly related to the architecture this template is designed to demonstrate.

This template assumes a deliberately **thin client**. The frontend is primarily responsible for:

- presentation,
- user interaction,
- basic UI state,
- communication with backend APIs, and
- displaying success, error, and application state to the user.

It intentionally assumes that **business rules and domain logic belong primarily behind the API boundary rather than in the browser**.

Under that architecture, the frontend contains relatively little complex domain behavior for an additional static type layer to protect. The value proposition of TypeScript is therefore different from what it would be in a rich client containing substantial business logic, complex state transitions, large shared models, or deeply interconnected component contracts.

That does **not** mean thin clients do not benefit from TypeScript. TypeScript can still catch type-related errors, document contracts, and improve development tooling in a small application.

Rather, it means that for this particular starting architecture, those benefits are being weighed against an intentionally small and simple client surface. The template does not introduce an additional architectural layer merely because a future application *might* eventually need it.

If an application built from this template evolves into a richer client, the assumption should be revisited. Increasing client-side business logic, state complexity, shared models, API-contract complexity, team size, or refactoring risk are all legitimate reasons to reconsider TypeScript.

Importantly, the choice is also not strictly binary. JavaScript projects can adopt additional static checking incrementally through tooling such as JSDoc and TypeScript's `checkJs` / `@ts-check` support without immediately converting the entire frontend to `.ts` and `.tsx`.

The intended progression is therefore:

**Start simple → evaluate actual complexity → add stronger typing where it provides measurable engineering value.**

## Dependency

The tab component uses `@radix-ui/react-tabs`, matching the existing app pattern.

```bash
npm install @radix-ui/react-tabs
```

## API routing

Production can use same-origin `/api/*` routing. For local development, optionally set:

```env
VITE_API_BASE=http://localhost:3001
```

The health endpoint is:

```text
GET /api/health
```

## Logging

Frontend logging is centralized in:

```text
src/logging/logger.js
```

Supported levels:

```text
none
summary
verbose
```

Logging defaults to `none`. If `VITE_LOG_LEVEL` is missing or invalid, no application logging is produced.

Configure the level in the frontend Vite environment:

```env
VITE_LOG_LEVEL=none
```

To enable summary logging:

```env
VITE_LOG_LEVEL=summary
```

To enable verbose diagnostic logging:

```env
VITE_LOG_LEVEL=verbose
```

The logger exports:

```javascript
logSummary()
logVerbose()
logError()
```

- `logSummary()` writes important application events when the level is `summary` or `verbose`.
- `logVerbose()` writes additional diagnostic information only when the level is `verbose`.
- `logError()` writes diagnostic errors when the level is `summary` or `verbose`.

Frontend modules should use the centralized logger instead of scattering direct `console.log()` and `console.error()` calls throughout components and API code.

The API client is a natural place to log request results or diagnostics when needed.

Logging and user-facing error handling remain separate concerns. `ErrorMessage.jsx` displays errors to the user; `logger.js` provides diagnostic output.

Because Vite exposes `VITE_*` environment variables to browser code, never store passwords, API keys, access tokens, or other secrets in `VITE_*` variables.

