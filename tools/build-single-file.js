const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function assemble(template, manifest, read) {
  const placeholders = [...template.matchAll(/\{\{([A-Z_]+)\}\}/g)].map(match => match[1]);
  if (new Set(placeholders).size !== placeholders.length) {
    throw new Error('Duplicate template placeholder');
  }
  const keys = Object.keys(manifest);
  if (keys.length !== placeholders.length || keys.some(key => !placeholders.includes(key))) {
    throw new Error('Template placeholders and manifest keys must match exactly');
  }
  const seen = new Set();
  const fragments = {};
  for (const key of keys) {
    if (!Array.isArray(manifest[key]) || !manifest[key].length) {
      throw new Error(`Empty or invalid manifest section: ${key}`);
    }
    fragments[key] = manifest[key].map(file => {
      if (typeof file !== 'string' || !/^src\/[a-zA-Z0-9_./-]+$/.test(file) || file.split('/').includes('..')) {
        throw new Error(`Invalid source path: ${file}`);
      }
      if (seen.has(file)) throw new Error(`Duplicate source file: ${file}`);
      seen.add(file);
      const content = read(file).replace(/\r\n/g, '\n');
      if (file.endsWith('.js')) {
        if (/<\/script\s*>/i.test(content)) throw new Error(`Inline script closing tag in ${file}`);
        new vm.Script(content, { filename: file });
      }
      return content;
    }).join('');
  }
  // One pass: placeholder-looking text inside game content is never substituted.
  const output = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => fragments[key]);
  for (const [index, match] of [...output.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
    new vm.Script(match[1], { filename: `index.html:script-${index}` });
  }
  return output;
}

function build(projectRoot = root) {
  const read = file => fs.readFileSync(path.join(projectRoot, file), 'utf8');
  const template = read('src/index.template.html').replace(/\r\n/g, '\n');
  const manifest = JSON.parse(read('src/build-manifest.json'));
  // Catch newly added source files that would otherwise be silently omitted.
  const included = new Set(Object.values(manifest).flat());
  function visit(directory) {
    for (const entry of fs.readdirSync(path.join(projectRoot, directory), { withFileTypes: true })) {
      const relative = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(relative);
      else if (/\.(js|css|html)$/.test(entry.name) && relative !== 'src/index.template.html' && !included.has(relative)) {
        throw new Error(`Source file is missing from build manifest: ${relative}`);
      }
    }
  }
  visit('src');
  return assemble(template, manifest, read);
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--check') || args.length > 1) throw new Error('Usage: node tools/build-single-file.js [--check]');
    const output = build();
    const target = path.join(root, 'index.html');
    if (args.includes('--check')) {
      const existing = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
      if (existing !== output) throw new Error('index.html is stale. Run npm run build and commit the result.');
      console.log('index.html matches the source; all inline JavaScript parses.');
    } else {
      fs.writeFileSync(target, output, 'utf8');
      console.log(`Built index.html (${Buffer.byteLength(output)} bytes).`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { assemble, build };
