const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const protobuf = require('protobufjs');

const { regions } = require('./config.json').STATUS;
const { fetchManifestVersions } = require('./manifest');

const STATUS_FILE = path.join(__dirname, 'status.json');
const MD_FILE = path.join(__dirname, 'STATUS.md');
const README_FILE = path.join(__dirname, 'README.md');

const root = new protobuf.Root();
protobuf.parse(`
syntax = "proto3";
enum Platform { All = 0; Ios = 1; Android = 2; PC = 3; Harmonyos = 4; }
enum OP { Eq = 0; Lt = 1; Gt = 2; Le = 3; Ge = 4; }
enum Action { Redirect = 0; Download = 1; }
message ServerAgent {
  string name = 1;
  string addr = 2;
  int32 status = 3;
  int64 zone = 4;
}
message Rule {
  Platform platform = 1;
  string channel = 2;
  string version = 3;
  OP op = 4;
  Action action = 5;
  string url = 6;
  bool enable = 7;
}
message ServerListMeta {
  int64 version = 1;
  repeated ServerAgent agent = 2;
  int32 status = 3;
  string message = 4;
  string report_endpoint = 6;
  repeated Rule rules = 7;
}
`, root, { keepCase: true });
const ServerListMeta = root.lookupType('ServerListMeta');

function decrypt(buf, key) {
  let data = buf;
  if (data[0] === 0x1f && data[1] === 0x8b) data = zlib.gunzipSync(data);
  const decipher = crypto.createDecipheriv(
    'aes-128-cbc', Buffer.from(key, 'ascii'), data.subarray(0, 16)
  );
  decipher.setAutoPadding(false);
  const plain = Buffer.concat([
    decipher.update(data.subarray(16)),
    decipher.final(),
  ]);
  const pad = plain[plain.length - 1];
  if (pad >= 1 && pad <= 16 && plain.subarray(-pad).every(b => b === pad)) {
    return plain.subarray(0, -pad);
  }
  let end = plain.length;
  while (end > 0 && plain[end - 1] === 0) end--;
  return plain.subarray(0, end);
}

async function fetchServerList(cfg) {
  const res = await fetch(`${cfg.static}/meta/serverlist.html`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`serverlist HTTP ${res.status}`);
  const body = decrypt(Buffer.from(await res.arrayBuffer()), cfg.key);
  return ServerListMeta.toObject(ServerListMeta.decode(body), {
    longs: String,
    enums: String,
    defaults: true,
  });
}

async function fetchLauncherVersion(cfg) {
  const res = await fetch(`${cfg.pkg}/${cfg.tag}/latest.yml`, {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`latest.yml HTTP ${res.status}`);
  const version = (await res.text()).match(/^version:[ \t]*(.+)$/m)?.[1].trim();
  if (!version) throw new Error('latest.yml missing version');
  return version.replace(/^["']|["']$/g, '');
}

function launcherAuth(cfg, version) {
  const head = {
    game_tag: cfg.tag,
    time: Math.floor(Date.now() / 1000),
    version,
  };
  const sign = crypto.createHash('md5')
    .update(JSON.stringify(head) + cfg.salt)
    .digest('hex');
  return JSON.stringify({ head, sign });
}

async function fetchClientVersion(cfg, launcherVersion) {
  const res = await fetch(`${cfg.launcher}/api/launcher/game/config`, {
    headers: { Authorization: launcherAuth(cfg, launcherVersion), 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`launcher HTTP ${res.status}`);
  const version = (await res.json())?.data?.game_latest_version;
  if (!version) throw new Error('game_latest_version missing');
  return version;
}

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const REGION_LANG = {
  CN: { maintained: '维护中', running: '运行中' },
  EN: { maintained: 'Maintenance', running: 'Online' },
  JP: { maintained: 'メンテナンス中', running: '稼働中' },
  KR: { maintained: '점검 중', running: '정상 운영' },
  TW: { maintained: '維護中', running: '運作中' },
};

const STATUS_DOT = {
  down: 'https://github.githubassets.com/images/icons/emoji/unicode/1f534.png',
  up: 'https://github.githubassets.com/images/icons/emoji/unicode/1f7e2.png',
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shield(label, value, color) {
  const v = String(value).replace(/-/g, '--').replace(/_/g, '__').replace(/ /g, '_');
  return `<img src="https://img.shields.io/badge/${label}-${v}-${color}?style=flat-square" alt="${label}" />`;
}

function renderMarkdown(data) {
  const rows = Object.entries(data.regions);
  const down = rows.filter(([, d]) => d.status === 1).length;
  const games = [...new Set(rows.map(([, d]) => d.gameVersion).filter(Boolean))];
  const game = games.length === 1 ? games[0] : 'mixed';

  const lines = [
    '<div align="center">',
    '',
    '<h1>Server Status</h1>',
    '',
    '<p>',
    `  ${shield('regions', rows.length, 'blue')}`,
    `  ${shield('maintenance', down, down ? 'red' : 'brightgreen')}`,
    `  ${shield('game', game, 'blueviolet')}`,
    '</p>',
    '',
    `<sub>Last updated · ${data.updatedAt} (UTC)</sub>`,
    '',
    '</div>',
    '',
    '<table align="center">',
    '  <thead>',
    '    <tr>',
    ...['Region', 'Status', 'Launcher', 'Client', 'Game', 'Patch', 'Hotfix']
      .map(h => `      <th align="center">${h}</th>`),
    '    </tr>',
    '  </thead>',
    '  <tbody>',
  ];

  const prefixed = (prefix, value) => `<td><code>${value == null || value === '' ? '-' : `${prefix}${value}`}</code></td>`;
  for (const [region, d] of rows) {
    const lang = REGION_LANG[region] ?? { maintained: 'Maintenance', running: 'Online' };
    const dot = d.status === 1 ? STATUS_DOT.down : STATUS_DOT.up;
    lines.push(
      '    <tr align="center">',
      `      <td><b>${region}</b></td>`,
      `      <td align="left"><img src="${dot}" width="16" height="16" alt="●" /> ${d.status === 1 ? lang.maintained : lang.running}</td>`,
      `      ${prefixed('v', d.launcherVersion)}`,
      `      ${prefixed('v', d.clientVersion)}`,
      `      ${prefixed('v', d.gameVersion)}`,
      `      ${prefixed('v', d.patchVersion)}`,
      `      ${prefixed('p', d.hotfixVersion)}`,
      '    </tr>',
    );
  }

  lines.push('  </tbody>', '</table>', '');

  const noticeRows = rows.filter(([, d]) => d.status === 1);
  if (noticeRows.length > 0) {
    lines.push(
      '<h2>Notices</h2>',
      '',
      '<table>',
      '  <thead>',
      '    <tr>',
      '      <th align="left">Region</th>',
      '      <th align="left">Notice</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
    );
    for (const [region, d] of noticeRows) {
      const message = escapeHtml(String(d.message ?? '').replace(/\s+/g, ' ')).trim() || '-';
      lines.push(
        '    <tr>',
        `      <td align="left" height="56" valign="middle"><img src="${STATUS_DOT.down}" width="16" height="16" alt="●" /> <b>${region}</b></td>`,
        `      <td align="left" height="56" valign="middle"><code>${message}</code></td>`,
        '    </tr>',
      );
    }
    lines.push('  </tbody>', '</table>', '');
  }
  return lines.join('\n');
}

const norm = s => s.replace(/\r\n/g, '\n');

function writeIfChanged(file, content) {
  if (fs.existsSync(file) && norm(fs.readFileSync(file, 'utf8')) === norm(content)) return;
  fs.writeFileSync(file, content, 'utf8');
}

function writeOutputs(data, writeJson = true) {
  const md = renderMarkdown(data);
  if (writeJson) writeIfChanged(STATUS_FILE, JSON.stringify(data, null, 4) + '\n');
  writeIfChanged(MD_FILE, md);
  updateReadme(md);
}

function updateReadme(statusMd) {
  const START = '<!-- STATUS:START -->';
  const END = '<!-- STATUS:END -->';
  const block = `${START}\n${statusMd}\n${END}`;
  if (fs.existsSync(README_FILE)) {
    const base = fs.readFileSync(README_FILE, 'utf8');
    if (base.includes(START) && base.includes(END)) {
      const next = base.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
      if (norm(next) !== norm(base)) fs.writeFileSync(README_FILE, next, 'utf8');
      return;
    }
    fs.writeFileSync(README_FILE, `${base.replace(/\s+$/, '')}\n\n${block}\n`, 'utf8');
    return;
  }
  fs.writeFileSync(README_FILE, `${block}\n`, 'utf8');
}

function sameRegion(a, b) {
  return !!a && !!b
    && a.status === b.status
    && a.clientVersion === b.clientVersion
    && a.launcherVersion === b.launcherVersion
    && a.patchVersion === b.patchVersion
    && a.gameVersion === b.gameVersion
    && a.hotfixVersion === b.hotfixVersion
    && a.message === b.message;
}

async function fetchRegion(region, cfg, previous, manifest) {
  let launcherVersion = previous?.launcherVersion ?? null;
  try {
    launcherVersion = await fetchLauncherVersion(cfg);
  } catch (err) {
    console.warn(`status: ${region} launcher version unavailable -`, err.message);
  }

  const [client, server] = await Promise.allSettled([
    launcherVersion ? fetchClientVersion(cfg, launcherVersion) : Promise.reject(new Error('no launcher version')),
    fetchServerList(cfg),
  ]);
  if (server.status === 'rejected') throw server.reason;
  if (client.status === 'rejected') {
    console.warn(`status: ${region} client version unavailable -`, client.reason.message);
  }
  const s = server.value;
  return {
    status: s.status ?? 0,
    launcherVersion,
    clientVersion: client.status === 'fulfilled'
      ? client.value
      : previous?.clientVersion ?? null,
    gameVersion: manifest?.gameVersion ?? previous?.gameVersion ?? null,
    patchVersion: Number(s.version),
    hotfixVersion: manifest?.hotfixVersion ?? previous?.hotfixVersion ?? null,
    message: s.message ?? '',
  };
}

async function syncStatus() {
  const previous = readStatus();
  const old = previous.regions ?? {};

  const manifests = await fetchManifestVersions(Object.keys(regions));

  const entries = await Promise.all(
    Object.entries(regions).map(async ([region, cfg]) => {
      try {
        return [region, await fetchRegion(region, cfg, old[region], manifests[region])];
      } catch (err) {
        console.warn(`status: ${region} sync failed, keeping previous -`, err.message);
        return [region, old[region] ?? null];
      }
    })
  );

  const nextRegions = {};
  let changed = false;
  for (const [region, data] of entries) {
    if (!data) continue;
    nextRegions[region] = data;
    if (!sameRegion(old[region], data)) changed = true;
  }

  if (Object.keys(nextRegions).length === 0) {
    console.warn('status: all regions failed, keeping previous status.json');
    if (Object.keys(old).length > 0) writeOutputs(previous, false);
    return previous;
  }

  const unchanged = !changed
    && typeof previous.updatedAt === 'string'
    && Object.keys(old).length === Object.keys(nextRegions).length;
  const current = unchanged
    ? { updatedAt: previous.updatedAt, regions: nextRegions }
    : { updatedAt: new Date().toISOString(), regions: nextRegions };

  writeOutputs(current, !unchanged);
  if (!unchanged) console.log('status: wrote status.json',
    Object.entries(nextRegions)
      .map(([r, d]) => `${r}=${d.patchVersion}/${d.status}`)
      .join(' '));
  return current;
}

module.exports = { syncStatus };

if (require.main === module) syncStatus();
