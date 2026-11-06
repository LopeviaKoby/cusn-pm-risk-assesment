import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from 'vitest';
function files(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() && !['references', 'assets'].includes(item.name) ? files(join(dir, item.name)) : item.isFile() && /\.tsx?$/.test(item.name) ? [join(dir, item.name)] : []); }
test('el grafo frontend no importa DTO/provider legacy, backend ni funcionalidades IA retiradas', () => {
  const root = resolve('app/src'), violations: string[] = [], graph = new Map<string, string[]>();
  for (const file of files(root)) {
    const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
    if (/\b(Bootstrap|DataProvider|useData|SuggestionReview|usuarioActualId|avancePlanificadoPct|spiRatio)\b/.test(source)) violations.push(`${file}: contrato antiguo`);
    if (/\/api\/v1\/(datos|controles-cambio|compras|riesgos|facturacion|planificacion)(?:[/'"`]|$)/.test(source)) violations.push(`${file}: endpoint retirado`);
    const edges: string[] = [];
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)) {
      const name = match[1]!;
      if (name.includes('/api/')) violations.push(`${file}: ${name}`);
      if ((name.startsWith('@/') || name.startsWith('.')) && !/\.(css|png|jpe?g|woff2)$/.test(name)) {
        const target = name.startsWith('@/') ? resolve(root, name.slice(2)) : resolve(dirname(file), name);
        const found = [target + '.ts', target + '.tsx', join(target, 'index.ts'), join(target, 'index.tsx')].find(existsSync);
        if (!found) violations.push(`${file}: import no resuelto ${name}`); else edges.push(found);
      }
    }
    graph.set(file, edges);
  }
  const reachable = new Set<string>(), pending = [resolve(root, 'main.tsx')];
  while (pending.length) { const file = pending.pop()!; if (reachable.has(file)) continue; reachable.add(file); pending.push(...(graph.get(file) ?? [])); }
  expect(violations).toEqual([]);
  expect(reachable.has(resolve(root, 'pages/Project.tsx'))).toBe(true);
  expect(reachable.has(resolve(root, 'pages/Projects.tsx'))).toBe(true);
  expect(reachable.has(resolve(root, 'data/business.ts'))).toBe(false);
});
