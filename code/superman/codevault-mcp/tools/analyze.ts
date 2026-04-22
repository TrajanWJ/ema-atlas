import { getSession } from '../session.ts';
import { scanInfrastructure } from '../../src/intelligence/infrastructure-scanner.ts';
import { scanRoutes } from '../../src/intelligence/route-scanner.ts';

export async function analyzeRepo(repoPath: string) {
  const session = await getSession(repoPath);
  const graph = session.graph;

  // Build summary
  const fileNodes = graph.findByType('file');
  const functionNodes = graph.findByType('function');
  const classNodes = graph.findByType('class');
  const routeNodes = graph.findByType('route');

  // Get fresh infrastructure and route data
  const infra = session.infrastructure ?? await scanInfrastructure(repoPath);
  const routes = session.routes ?? await scanRoutes(repoPath);

  const techStack = {
    framework: infra.runtime.framework,
    packageManager: infra.runtime.packageManager,
    database: infra.database ? {
      provider: infra.database.provider,
      orm: infra.database.orm,
      models: infra.database.models.length,
      isRunning: infra.database.isRunning,
    } : null,
    services: infra.services.map(s => ({
      name: s.name,
      configured: s.missingEnvVars.length === 0,
    })),
    nodeVersion: infra.runtime.nodeVersion,
  };

  const summary = {
    files: fileNodes.length,
    functions: functionNodes.length,
    classes: classNodes.length,
    routes: routeNodes.length,
    apiRoutes: routes.totalRoutes,
    protectedRoutes: routes.protectedRoutes,
    unprotectedRoutes: routes.unprotectedRoutes,
    techStack,
    missingEnvVars: infra.envVars.filter(v => v.required && !v.hasValue).map(v => v.name),
    servicesDown: infra.ports.filter(p => !p.isListening).map(p => `${p.service}:${p.port}`),
    routeMap: routes.routes.slice(0, 30).map(r => ({
      method: r.method,
      path: r.path,
      auth: r.auth.required ? `${r.auth.type}${r.auth.roles ? ` [${r.auth.roles.join(',')}]` : ''}` : 'none',
    })),
  };

  return summary;
}
