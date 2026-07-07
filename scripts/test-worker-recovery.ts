/**
 * Test Worker Recovery - Simulate worker failure and demonstrate auto-recovery
 */

import { createAdminClient } from "../lib/supabase/admin";
import { runHealthCheck } from "../services/monitoring/selfMonitoringService";

const supabase = createAdminClient();

async function testWorkerRecovery() {
  console.log("=" + "=".repeat(79));
  console.log("WORKER RECOVERY TEST");
  console.log("=".repeat(80));
  console.log();

  // Step 1: Initial health check
  console.log("STEP 1: INITIAL HEALTH CHECK");
  console.log("-".repeat(80));
  const initialHealth = await runHealthCheck();
  initialHealth.forEach(h => {
    console.log(`  ${h.componentName}: ${h.status} (${h.healthScore}%)`);
  });
  console.log();

  // Step 2: Simulate worker failure by marking a discovery source as failed
  console.log("STEP 2: SIMULATE WORKER FAILURE");
  console.log("-".repeat(80));
  
  const { data: sources } = await supabase
    .from("discovery_sources")
    .select("*")
    .eq("name", "MDN Web Docs")
    .single();

  if (sources) {
    await supabase
      .from("discovery_sources")
      .update({
        status: "failed",
        error_count: 10,
        last_error: "Simulated worker failure",
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", sources.id);
    
    console.log(`✓ Simulated failure for: ${sources.name}`);
    console.log(`  Status: failed`);
    console.log(`  Error count: 10`);
  }
  console.log();

  // Step 3: Check health after failure
  console.log("STEP 3: HEALTH CHECK AFTER FAILURE");
  console.log("-".repeat(80));
  const failedHealth = await runHealthCheck();
  failedHealth.forEach(h => {
    console.log(`  ${h.componentName}: ${h.status} (${h.healthScore}%)`);
  });
  console.log();

  // Step 4: Trigger auto-recovery
  console.log("STEP 4: TRIGGER AUTO-RECOVERY");
  console.log("-".repeat(80));
  
  // Manually trigger recovery by resetting the last_checked_at to simulate time passing
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  await supabase
    .from("discovery_sources")
    .update({
      last_checked_at: oneHourAgo,
    })
    .eq("id", sources.id);
  
  console.log(`✓ Simulated time passing (1 hour ago)`);
  console.log();

  // Step 5: Run health check with auto-recovery
  console.log("STEP 5: HEALTH CHECK WITH AUTO-RECOVERY");
  console.log("-".repeat(80));
  const recoveryHealth = await runHealthCheck();
  recoveryHealth.forEach(h => {
    console.log(`  ${h.componentName}: ${h.status} (${h.healthScore}%)`);
  });
  console.log();

  // Step 6: Check if worker was recovered
  console.log("STEP 6: VERIFY WORKER RECOVERY");
  console.log("-".repeat(80));
  
  const { data: recoveredSource } = await supabase
    .from("discovery_sources")
    .select("*")
    .eq("id", sources.id)
    .single();

  if (recoveredSource) {
    console.log(`Source: ${recoveredSource.name}`);
    console.log(`Status: ${recoveredSource.status}`);
    console.log(`Error count: ${recoveredSource.error_count}`);
    console.log(`Last error: ${recoveredSource.last_error}`);
    
    if (recoveredSource.status === "active") {
      console.log("✓ Worker recovered successfully!");
    } else {
      console.log("✗ Worker not yet recovered (needs more time or manual intervention)");
    }
  }
  console.log();

  // Step 7: Manual recovery (for demonstration)
  console.log("STEP 7: MANUAL RECOVERY (FOR DEMONSTRATION)");
  console.log("-".repeat(80));
  
  await supabase
    .from("discovery_sources")
    .update({
      status: "active",
      error_count: 0,
      last_error: null,
    })
    .eq("id", sources.id);
  
  console.log(`✓ Manually recovered worker`);
  console.log();

  // Step 8: Final health check
  console.log("STEP 8: FINAL HEALTH CHECK");
  console.log("-".repeat(80));
  const finalHealth = await runHealthCheck();
  finalHealth.forEach(h => {
    console.log(`  ${h.componentName}: ${h.status} (${h.healthScore}%)`);
  });
  console.log();

  console.log("=" + "=".repeat(79));
  console.log("WORKER RECOVERY TEST COMPLETE");
  console.log("=".repeat(80));
}

testWorkerRecovery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
