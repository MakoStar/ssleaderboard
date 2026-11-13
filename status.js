const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const protobuf = require('protobufjs');

const { launcherVersion, regions } = require('./config.json').STATUS;
const { fetchGameVersions } = require('./manifest');

const STATUS_FILE = path.join(__dirname, 'status.json');
const MD_FILE = path.join(__dirname, 'STATUS.md');

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

function launcherAuth(cfg) {
  const head = {
    game_tag: cfg.tag,
    time: Math.floor(Date.now() / 1000),
    version: launcherVersion,
  };
  const sign = crypto.createHash('md5')
    .update(JSON.stringify(head) + cfg.salt)
    .digest('hex');
  return JSON.stringify({ head, sign });
}

async function fetchClientVersion(cfg) {
  const res = await fetch(`${cfg.launcher}/api/launcher/game/config`, {
    headers: { Authorization: launcherAuth(cfg), 'User-Agent': 'Mozilla/5.0' },
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
    ...['Region', 'Status', 'Game', 'Patch']
      .map(h => `      <th align="${h === 'Status' ? 'left' : 'center'}">${h}</th>`),
    '    </tr>',
    '  </thead>',
    '  <tbody>',
  ];

  for (const [region, d] of rows) {
    const lang = REGION_LANG[region] ?? { maintained: 'Maintenance', running: 'Online' };
    const dot = d.status === 1 ? STATUS_DOT.down : STATUS_DOT.up;
    lines.push(
      '    <tr align="center">',
      `      <td><b>${region}</b></td>`,
      `      <td align="left"><img src="${dot}" width="16" height="16" alt="●" /> ${d.status === 1 ? lang.maintained : lang.running}</td>`,
      `      <td><code>${d.gameVersion ?? '-'}</code></td>`,
      `      <td><code>${d.patchVersion ?? '-'}</code></td>`,
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

function sameRegion(a, b) {
  return !!a && !!b
    && a.status === b.status
    && a.clientVersion === b.clientVersion
    && a.launcherVersion === b.launcherVersion
    && a.patchVersion === b.patchVersion
    && a.gameVersion === b.gameVersion
    && a.message === b.message;
}

async function fetchRegion(region, cfg, previous, gameVersion) {
  const [client, server] = await Promise.allSettled([
    fetchClientVersion(cfg),
    fetchServerList(cfg),
  ]);
  if (server.status === 'rejected') throw server.reason;
  if (client.status === 'rejected') {
    console.warn(`status: ${region} launcher version unavailable -`, client.reason.message);
  }
  const s = server.value;
  return {
    status: s.status ?? 0,
    launcherVersion,
    clientVersion: client.status === 'fulfilled'
      ? client.value
      : previous?.clientVersion ?? null,
    gameVersion: gameVersion ?? previous?.gameVersion ?? null,
    patchVersion: Number(s.version),
    message: s.message ?? '',
  };
}

async function syncStatus() {
  const previous = readStatus();
  const old = previous.regions ?? {};

  const gameVersions = await fetchGameVersions(Object.keys(regions));

  const entries = await Promise.all(
    Object.entries(regions).map(async ([region, cfg]) => {
      try {
        return [region, await fetchRegion(region, cfg, old[region], gameVersions[region])];
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
    return previous;
  }

  const unchanged = !changed
    && typeof previous.updatedAt === 'string'
    && Object.keys(old).length === Object.keys(nextRegions).length;
  if (unchanged) {
    const current = { updatedAt: previous.updatedAt, regions: nextRegions };
    const md = renderMarkdown(current);
    if (!fs.existsSync(MD_FILE) || fs.readFileSync(MD_FILE, 'utf8') !== md) {
      fs.writeFileSync(MD_FILE, md, 'utf8');
    }
    return current;
  }

  const next = { updatedAt: new Date().toISOString(), regions: nextRegions };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(next, null, 4) + '\n', 'utf8');
  fs.writeFileSync(MD_FILE, renderMarkdown(next), 'utf8');
  console.log('status: wrote status.json',
    Object.entries(nextRegions)
      .map(([r, d]) => `${r}=${d.patchVersion}/${d.status}`)
      .join(' '));
  return next;
}

module.exports = { syncStatus };

if (require.main === module) syncStatus();
