/**
 * Catalog audit CLI — reports variant/matrix issues across the catalogue.
 * Run from backend/: node scripts/catalogAudit.js [--fix]
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  runCatalogAudit,
  applyAllCatalogFixes,
} from "../utils/catalogAudit.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const shouldFix = process.argv.includes("--fix");

  const { issues, summary } = await runCatalogAudit();

  console.log("\n=== Catalog audit ===");
  console.log(`Products: ${summary.products} · Styles: ${summary.styles}`);
  console.log(`Issues: ${summary.total} (${summary.errors} errors, ${summary.warnings} warnings)`);
  console.log(`Auto-fixable: ${summary.fixable}\n`);

  if (!issues.length) {
    console.log("No issues found.");
  } else {
    for (const issue of issues) {
      console.log(`[${issue.severity}] ${issue.type}: ${issue.message}`);
    }
  }

  if (shouldFix && summary.fixable) {
    console.log("\nApplying auto-fixes...");
    const results = await applyAllCatalogFixes(issues);
    console.log(`Fixed ${results.filter((r) => r.ok).length} issue group(s).`);
    for (const r of results) {
      console.log(r.ok ? `  ✓ ${r.fix?.type}` : `  ✗ ${r.message}`);
    }

    const after = await runCatalogAudit();
    console.log(`\nRemaining issues: ${after.summary.total}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
