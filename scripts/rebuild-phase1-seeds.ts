/**
 * @deprecated Use scripts/run-phase1-seed-brain.ts — same brain-only pipeline.
 */
import { execSync } from "child_process";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ?? "--limit=10";
execSync(`npx tsx scripts/run-phase1-seed-brain.ts ${limit}`, {
  stdio: "inherit",
  cwd: process.cwd(),
});
