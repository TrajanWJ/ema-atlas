import { validateContracts } from '../../src/contract-validator/index.ts';

export async function validateContractsTool(projectPath: string) {
  const mismatches = await validateContracts(projectPath);
  return {
    totalMismatches: mismatches.length,
    critical: mismatches.filter(m => m.severity === 'critical').length,
    high: mismatches.filter(m => m.severity === 'high').length,
    medium: mismatches.filter(m => m.severity === 'medium').length,
    mismatches: mismatches.slice(0, 20), // top 20
  };
}
