# Contributing

Thanks for helping. The most wanted contributions:

1. **Floss palettes** — DMC, Anchor and other real floss palettes as
   `{ code, name, rgb }` arrays under `palettes/`. Please note the source
   of the color data in the file header.
2. **Symbol sets** — alternative chart symbol sets that stay legible in
   small black-and-white print (no ambiguous pairs like 0/O or 1/l).
3. **Bug reports** — include a small test image (or its pixel dimensions)
   and the options you used.
4. **Features** — keep the zero-dependency rule for `src/`. Dev-only
   tooling is fine.

Run tests before sending a PR:

```bash
npm test
```

Keep functions pure and exported individually so they stay testable.
