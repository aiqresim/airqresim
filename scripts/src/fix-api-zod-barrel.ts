/**
 * Post-codegen repair for lib/api-zod/src/index.ts.
 *
 * orval regenerates that barrel with a trailing
 *   export * from "./generated/types";
 * which collides with zod schemas in ./generated/api (both export names like
 * `GetOrderParams`) and makes the workspace fail with TS2308.
 *
 * Run automatically after `pnpm codegen` in lib/api-spec.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// This file lives at <root>/scripts/src, so the workspace root is two levels up.
const barrelPath = path.resolve(here, "..", "..", "lib", "api-zod", "src", "index.ts");

const WILDCARD = "export * from './generated/types';";
const WILDCARD_ALT = 'export * from "./generated/types";';

const original = readFileSync(barrelPath, "utf8");

if (!original.includes(WILDCARD) && !original.includes(WILDCARD_ALT)) {
  console.info("api-zod barrel already clean.");
  process.exit(0);
}

const fixed = original
  .split(/\r?\n/)
  .filter((line) => {
    const trimmed = line.trim();
    return trimmed !== WILDCARD && trimmed !== WILDCARD_ALT;
  })
  .join("\n");

writeFileSync(barrelPath, fixed, "utf8");
console.info("Removed ambiguous wildcard re-export from lib/api-zod/src/index.ts");