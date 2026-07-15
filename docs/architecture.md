# Miracle Ball Lab architecture

## Direction

The application is being migrated from a single browser script to explicit feature boundaries without breaking save data or gameplay. `src/run.ts` remains the composition root during this migration; new domain rules, presentation builders, controllers, and optional renderers belong in `src/miracle`.

## Boundaries

- **Domain/services** contain deterministic rules and must not access the DOM or storage directly.
- **Presentation** produces display data or HTML and must escape user-controlled content.
- **Controllers** coordinate a feature through injected ports instead of importing the application root.
- **Rendering** draws a frame but does not own persisted state.
- **Infrastructure** owns browser storage, remote assets, audio, and optional third-party engines.
- **Composition root (`run.ts`)** creates browser elements, wires dependencies, and owns the transitional runtime loop.

## Migration rules

1. Preserve storage keys and pass loaded data through `saveMigration` before changing schemas.
2. Extract one coherent responsibility at a time and add tests for deterministic behavior.
3. Inject time and randomness into extracted modules.
4. Load optional heavy renderers with dynamic imports.
5. A change is complete only after `npm run validate` passes.

## Target structure

```text
src/
  run.ts                    # thin composition root
  miracle/
    *Service.ts             # domain/application rules
    *Controller.ts          # feature orchestration through ports
    *Presentation.ts        # display mapping and safe HTML
    *Rendering.ts           # canvas/graphics adapters
    storage.ts              # persistence boundary
```

The immediate priority is shrinking `run.ts` by moving optional integrations and feature clusters behind these boundaries. The long-term target is a composition root that contains wiring and lifecycle code only.

## Transitional debt

Lint currently enforces correctness and security rules while legacy unused hooks and compatibility fallbacks are allowed. As feature clusters leave `run.ts`, unused-variable and empty-block rules should be enabled directory by directory instead of suppressing new violations indefinitely.
