/**
 * Roads & Boats - CLI Test Suite Runner
 * Usage: npx tsx scripts/run-simulation-test.ts
 */

import { runAllGameSimulations } from '../src/game/simulationTest';

console.log('\n======================================================');
console.log('   ROADS & BOATS - AUTOMATED GAMEPLAY TEST SIMULATOR   ');
console.log('======================================================\n');

const suite = runAllGameSimulations();

suite.tests.forEach((t, i) => {
  const icon = t.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${i + 1}/${suite.total}] ${icon}  ${t.name} (${t.durationMs}ms)`);
  t.details.forEach(d => console.log(`      ${d}`));
  if (t.error) {
    console.error(`      ❌ Error: ${t.error}`);
  }
  console.log('');
});

console.log('------------------------------------------------------');
console.log(`Summary: ${suite.passed}/${suite.total} passed in ${suite.durationMs}ms`);
if (suite.failed > 0) {
  console.error(`❌ ${suite.failed} tests failed!`);
  process.exit(1);
} else {
  console.log('🎉 ALL GAME ACTIONS, INFRASTRUCTURE & FACTORIES VERIFIED!\n');
  process.exit(0);
}
