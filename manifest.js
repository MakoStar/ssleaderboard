const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { resourceFetcherRelease = 'v0.4.1' } = require('./config.json').STATUS;

const REPO = 'MakoStar/ss-resource-fetcher';
const TOOL_DIR = path.join(__dirname, 'Tool');
const WORK_DIR = path.join(TOOL_DIR, 'work');
const isWin = process.platform === 'win32';

function findBinary(dir) {
  const name = isWin ? 'ResourceFetcher.exe' : 'ResourceFetcher';
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === name) return p;
    if (entry.isDirectory() && entry.name !== 'work') {
      const hit = findBinary(p);
      if (hit) return hit;
    }
  }
  return null;
}

async function ensureBinary() {
  if (process.env.RESOURCE_FETCHER) return process.env.RESOURCE_FETCHER;

  fs.mkdirSync(TOOL_DIR, { recursive: true });
  const cached = findBinary(TOOL_DIR);
  if (cached) return cached;

  const asset = isWin
    ? `ResourceFetcher-${resourceFetcherRelease}-win-x64.zip`
    : `ResourceFetcher-${resourceFetcherRelease}-linux-x64.tar.gz`;
  const url = `https://github.com/${REPO}/releases/download/${resourceFetcherRelease}/${asset}`;
  const archive = path.join(TOOL_DIR, asset);

  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`release download HTTP ${res.status}`);
  fs.writeFileSync(archive, Buffer.from(await res.arrayBuffer()));

  if (asset.endsWith('.zip')) {
    execFileSync('powershell', ['-NoProfile', '-Command',
      `Expand-Archive -LiteralPath '${archive}' -DestinationPath '${TOOL_DIR}' -Force`],
      { stdio: 'ignore' });
  } else {
    execFileSync('tar', ['-xzf', archive, '-C', TOOL_DIR], { stdio: 'ignore' });
  }

  const bin = findBinary(TOOL_DIR);
  if (!bin) throw new Error('ResourceFetcher missing after extract');
  if (!isWin) fs.chmodSync(bin, 0o755);
  console.log(`manifest: installed ${asset}`);
  return bin;
}

function buildArgs(region) {
  return [
    '-s', `DEFAULT_REGION=${region}`,
    '-s', 'DEFAULT_PLATFORM=win',
    '-s', 'TASK.CLIENT.REGISTRY.FETCH_FILES=[ss_win.mani]',
    '-s', 'TASK.CLIENT.REGISTRY.RES_PATTERNS=[^ss_win\\.mani$]',
  ];
}

function readGameVersion(cwd, region) {
  const mani = path.join(cwd, 'output', 'Metadata', region, 'win', 'ss_win.mani');
  const match = fs.readFileSync(mani, 'utf8').match(/^\$GAME_VER:(.+)$/m);
  return match ? match[1].trim() : null;
}

async function fetchGameVersions(regions) {
  const versions = {};
  let bin;
  try {
    bin = await ensureBinary();
  } catch (err) {
    console.warn('manifest: ResourceFetcher unavailable -', err.message);
    return versions;
  }

  for (const region of regions) {
    const cwd = path.join(WORK_DIR, region);
    try {
      fs.mkdirSync(cwd, { recursive: true });
      fs.rmSync(path.join(cwd, 'output'), { recursive: true, force: true });
      execFileSync(bin, ['client', '-r', ...buildArgs(region)], {
        cwd,
        stdio: 'pipe',
        timeout: 120000,
      });
      versions[region] = readGameVersion(cwd, region);
    } catch (err) {
      console.warn(`manifest: ${region} failed -`, err.message.slice(0, 200));
    }
  }
  return versions;
}

module.exports = { buildArgs, fetchGameVersions, readGameVersion };

if (require.main === module) {
  if (process.argv.includes('--args')) {
    console.log(JSON.stringify(buildArgs(process.env.REGION || 'CN'), null, 2));
  } else {
    const regions = process.argv.slice(2);
    fetchGameVersions(regions.length ? regions : Object.keys(require('./config.json').STATUS.regions))
      .then(v => console.log(JSON.stringify(v, null, 2)));
  }
}
