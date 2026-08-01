# FastFlag Editor — Testing Guide

## Testing Stack (to be configured)

- **Vitest** — test runner (Vite-native, fast)
- **Testing Library** — React component tests
- **@playwright/test** — E2E tests (future)

## How to Run

```bash
# (after vitest is installed)
npm run test           # unit tests
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

---

## Test Structure

```
src/
├── __tests__/
│   ├── stores/
│   │   ├── flag-store.test.ts
│   │   └── ui-store.test.ts
│   ├── adapters/
│   │   └── roblox.test.ts
│   ├── utils/
│   │   ├── auto-tag.test.ts
│   │   └── id.test.ts
│   ├── shared/
│   │   ├── errors.test.ts
│   │   └── validators.test.ts
│   └── components/
│       └── ui-kit.test.tsx
```

---

## What to Test

### Unit Tests (Pure Logic)

- [ ] `Flag Store` — CRUD operations, duplicate detection, import/export
- [ ] `UI Store` — selection, context menu, dialog state
- [ ] `Roblox Adapter` — format detection, parsing, serialization
- [ ] `Auto-Tag` — tag suggestions for known flag patterns
- [ ] `Validator` — Zod schemas validation (FastFlag, ExportData, RobloxFormat)
- [ ] `Error System` — Result<T,E> construction and handling
- [ ] `Event Bus` — emit/on/off/unsubscribe

### Components

- [ ] `Button` — variants, sizes, disabled states
- [ ] `Input` — error states, placeholder
- [ ] `Dialog` — open/close, backdrop click, title
- [ ] `Badge` — variants, removable
- [ ] `Select` — options, onChange
- [ ] `FlagTable` — render with no/some/many flags (future)
- [ ] `Toolbar` — search/filter integration (future)

### Integration

- [ ] Auto-save cycle (mock IPC)
- [ ] Theme toggle (dark ↔ light)
- [ ] Undo/Redo flow (create flag, undo, redo, verify state)

---

## Test Patterns

### Testing a Pure Store (No React)

```ts
import { useFlagStore } from '@/stores/flag-store';

test('adds a flag with auto-tags', () => {
  const store = useFlagStore.getState();
  const id = store.addFlag('FIntRenderShadowQuality', '3');
  const flag = store.getFlag(id);
  expect(flag?.name).toBe('FIntRenderShadowQuality');
  expect(flag?.tags.length).toBeGreaterThan(0); // auto-tagged
});
```

### Testing with zundo Undo

```ts
test('undo restores previous state', () => {
  const store = useFlagStore.getState();
  store.removeAll(); // helper for clean slate
  store.addFlag('TestFlag1', 'true');

  const before = useFlagStore.getState().flags.length;
  useFlagStore.temporal?.getState().undo();
  const after = useFlagStore.getState().flags.length;
  expect(after).toBe(before - 1);
});
```

### Testing Validation

```ts
test('validates FastFlag schema', () => {
  const result = validate(FastFlagSchema, {
    id: 'not-a-uuid',
    name: '',
    value: '',
    tags: [],
    preset: false,
    createdAt: 0,
    updatedAt: 0,
  });
  expect(result.ok).toBe(false);
});
```

---

## Future

### Playwright E2E

- Launch Electron app and interact with it via CDP
- Test full flows: create flag → edit → export → import → delete
- Screenshot regression testing

### CI/CD (GitHub Actions)

```yaml
- name: Test
  run: npm run test:coverage
- name: Build
  run: npm run build
```
