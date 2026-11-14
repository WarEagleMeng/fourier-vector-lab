import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const queue = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).map(
  (name) => ({ from: root, name }),
);
const inventory = [],
  notices = [],
  seen = new Set();
async function resolveDir(from, name) {
  let cursor = from;
  for (;;) {
    const candidate = path.join(cursor, 'node_modules', name);
    try {
      return await fs.realpath(candidate);
    } catch {}
    const parent = path.dirname(cursor);
    if (parent === cursor) return null;
    cursor = parent;
  }
}
while (queue.length) {
  const { from, name } = queue.shift(),
    pkgDir = await resolveDir(from, name);
  if (!pkgDir) continue;
  const json = await fs
    .readFile(path.join(pkgDir, 'package.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => null);
  if (!json || seen.has(json.name + '@' + json.version)) continue;
  seen.add(json.name + '@' + json.version);
  const license =
    typeof json.license === 'object'
      ? json.license.type
      : json.license || json.licenses?.map((l) => l.type).join(' OR ') || 'UNDECLARED';
  inventory.push({
    name: json.name,
    version: json.version,
    license,
    repository:
      typeof json.repository === 'string' ? json.repository : json.repository?.url || null,
  });
  const files = (await fs.readdir(pkgDir).catch(() => [])).filter((f) =>
    /^(licen[sc]e|copying|notice)(\.|$)/i.test(f),
  );
  for (const file of files) {
    const data = await fs.readFile(path.join(pkgDir, file), 'utf8').catch(() => null);
    if (data)
      notices.push(
        `\n${'='.repeat(70)}\n${json.name}@${json.version} / ${file}\n${'='.repeat(70)}\n${data}`,
      );
  }
  for (const child of Object.keys({
    ...json.dependencies,
    ...json.optionalDependencies,
    ...json.peerDependencies,
  })) {
    if (json.name === 'vite' && child === 'lightningcss') continue; // Same optional-peer omission as .pnpmfile.cjs.
    queue.push({ from: pkgDir, name: child });
  }
}
inventory.sort((a, b) => a.name.localeCompare(b.name));
await fs.writeFile(
  path.join(root, 'DEPENDENCY_LICENSES.json'),
  JSON.stringify(inventory, null, 2) + '\n',
);
await fs.writeFile(
  path.join(root, 'THIRD_PARTY_NOTICES.txt'),
  'Active installed dependency license notices. Instructor reference materials are not included.\n' +
    notices.join('\n'),
);
console.log(
  JSON.stringify(
    {
      packages: inventory.length,
      licenses: [...new Set(inventory.map((p) => p.license))],
      nonPermissiveSoftware: inventory.filter(
        (p) =>
          ![
            'MIT',
            'MIT-0',
            'Apache-2.0',
            'ISC',
            'BSD-2-Clause',
            'BSD-3-Clause',
            'BlueOak-1.0.0',
            'CC-BY-4.0',
          ].includes(p.license),
      ),
    },
    null,
    2,
  ),
);

// Include notices in the published static distribution as well as in source.
await fs.mkdir(path.join(root,'public'),{recursive:true});
await fs.copyFile(path.join(root,'THIRD_PARTY_NOTICES.txt'),path.join(root,'public','THIRD_PARTY_NOTICES.txt'));
await fs.copyFile(path.join(root,'LICENSE'),path.join(root,'public','LICENSE.txt'));
