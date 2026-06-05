const crypto = require('crypto');
const readline = require('readline');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');
let { BB_SEASON, FE_SEASON } = require('./season.json');

const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
}

const BLITZ_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/blitz.json';
const RAID_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/raid.json';
const CHARACTERID_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/characterid.json';

const Activity_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/CN/bin/Activity.json';
const POTENTIAL_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/CN/bin/CharPotential.json';
const SCOREBOSSCONTROL_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/CN/bin/ScoreBossControl.json';
const STARTOWERBUILDRANK_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/CN/bin/StarTowerBuildRank.json';

const VERSION = '727.727.727.7272727';

const SDK_URL_CN = 'https://sdk-api.yostar.cn';
const SERVER_URL_CN = 'https://nova.yostar.cn';
const SERVER_GARBLE_KEY_CN = Buffer.from('QW*Wi7fKjLk!T82Qf2nEGZA%nSC!D9qV', 'ascii');

const DEVICE_CN = process.env.DEVICE_CN;
const TOKEN_CN = process.env.TOKEN_CN;
const UID_CN = process.env.UID_CN;

const regionData = {};
const removedData = {};

const protoText = `
syntax = "proto2";
package proto;

message IKEReq {
    optional int64 ClientTs = 2;
    optional int32 ProtoVersion = 1;
    optional bytes PubKey = 3;
}

message IKEResp {
    optional int64 ServerTs = 3;
    optional int32 Cipher = 2;
    optional bytes PubKey = 4;
    optional string Token = 1;
}

message HonorInfo {
    optional uint32 Id = 1;
    optional uint32 AffinityLV = 2;
}

message ItemTpl {
    optional uint32 Tid = 1;
    optional int32 Qty = 2;
}

message BuildPotential {
    optional uint32 PotentialId = 1;
    optional uint32 Level = 2;
}

message ScoreBossRankChar {
    optional uint32 Id = 1;
    optional uint32 Level = 2;
}

message ScoreBossRankTeam {
    optional uint32 BuildScore = 1;
    repeated ScoreBossRankChar Chars = 2;
    optional uint32 LevelScore = 3;
    optional uint32 LevelId = 4;
    repeated uint32 Discs = 5;
    repeated BuildPotential Potentials = 6;
    repeated ItemTpl Notes = 7;
    repeated uint32 ActiveSecondaryIds = 8;
}

message ScoreBossRankData {
    optional uint64 Id = 1;
    optional string NickName = 2;
    optional uint32 HeadIcon = 4;
    optional uint32 Score = 5;
    optional uint32 Rank = 6;
    optional uint32 TitlePrefix = 7;
    optional uint32 TitleSuffix = 8;
    repeated ScoreBossRankTeam Teams = 9;
    repeated HonorInfo Honors = 15;
}

message ScoreBossRankInfo {
    optional int64 LastRefreshTime = 1;
    optional ScoreBossRankData Self = 2;
    repeated ScoreBossRankData Rank = 3;
    repeated uint64 Border = 4;
    optional uint32 Total = 5;
}

message JointDrillRankChar {
    optional uint32 Id = 1;
    optional uint32 Level = 2;
    optional bytes NextPackage = 2047;
}

message JointDrillRankTeam {
    repeated JointDrillRankChar Chars = 1;
    optional uint32 BuildScore = 2;
    optional uint32 Damage = 3;
    optional uint32 Time = 4;
    repeated uint32 Discs = 5;
    repeated BuildPotential Potentials = 6;
    repeated ItemTpl Notes = 7;
    repeated uint32 ActiveSecondaryIds = 8;
    optional bytes NextPackage = 2047;
}

message JointDrillRankData {
    optional uint64 Id = 1;
    optional string NickName = 2;
    optional uint32 WorldClass = 3;
    optional uint32 HeadIcon = 4;
    optional uint32 Score = 5;
    optional uint32 Rank = 6;
    optional uint32 TitlePrefix = 7;
    optional uint32 TitleSuffix = 8;
    repeated HonorInfo Honors = 9;
    repeated JointDrillRankTeam Teams = 10;
    optional bytes NextPackage = 2047;
}

message JointDrillRankInfo {
    optional int64 LastRefreshTime = 1;
    optional JointDrillRankData Self = 2;
    repeated JointDrillRankData Rank = 3;
    optional uint32 Total = 4;
    optional bytes NextPackage = 2047;
}

message Res {
    optional uint32 Tid = 1;
    optional int32 Qty = 2;
    optional bytes NextPackage = 2047;
}

message Item {
    optional uint64 Id = 1;
    optional uint32 Tid = 2;
    optional int32 Qty = 3;
    optional int64 Expire = 4;
    optional bytes NextPackage = 2047;
}

message PlayerInfo {
    repeated Res Res = 2;
    repeated Item Items = 3;
    optional bytes NextPackage = 2047;
}

message OfficialOverseas {
    optional string Uid = 1;
    optional string Token = 2;
}

message Regular {
    optional string Name = 1;
    optional string Pass = 2;
    optional bytes NextPackage = 2047;
}

message Official {
    optional uint64 Uid = 1;
    optional string Token = 2;
    optional bytes NextPackage = 2047;
}

message LoginReq {
    optional Regular Account = 1;
    optional Official Official = 2;
    optional OfficialOverseas OfficialOverseas = 3;
    optional string Token = 4;
    optional int32 Platform = 11;
    optional string Language = 12;
    optional string Channel = 13;
    optional string Device = 14;
    optional string Version = 15;
}

message LoginResp {
    optional string Token = 1;
}

message Error {
    optional uint32 Code = 1;
    repeated string Arguments = 2;
    optional uint64 TraceId = 3;
    optional int32 Action = 4;
}
`;

const root = protobuf.parse(protoText).root;
const IKEReq = root.lookupType('proto.IKEReq');
const IKEResp = root.lookupType('proto.IKEResp');
const ScoreBossRankInfo = root.lookupType('proto.ScoreBossRankInfo');
const JointDrillRankInfo = root.lookupType('proto.JointDrillRankInfo');
const PlayerInfoType = root.lookupType('proto.PlayerInfo');
const LoginReq = root.lookupType('proto.LoginReq');
const LoginResp = root.lookupType('proto.LoginResp');

function encryptGCM(plaintext, key) {
    const args = Array.prototype.slice.call(arguments);
    const useAad = args.length >= 3 ? !!args[2] : true;
    const iv = (args.length >= 4 && args[3]) ? args[3] : crypto.randomBytes(12);
    const algo = key.length === 32 ? 'aes-256-gcm' : (key.length === 24 ? 'aes-192-gcm' : 'aes-128-gcm');
    const cipher = crypto.createCipheriv(algo, key, iv, { authTagLength: 16 });
    if (useAad) cipher.setAAD(iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, ciphertext, tag]);
}

function decryptGCM(data, key) {
    const args = Array.prototype.slice.call(arguments);
    const useAad = args.length >= 3 ? !!args[2] : true;
    const iv = data.slice(0, 12);
    const enc = data.slice(12);
    if (enc.length < 16) throw new Error('Invalid GCM payload');
    const tag = enc.slice(enc.length - 16);
    const ciphertext = enc.slice(0, enc.length - 16);
    const algo = key.length === 32 ? 'aes-256-gcm' : (key.length === 24 ? 'aes-192-gcm' : 'aes-128-gcm');
    const decipher = crypto.createDecipheriv(algo, key, iv, { authTagLength: 16 });
    if (useAad) decipher.setAAD(iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext;
}

function encryptChaCha(plaintext, key) {
    const args = Array.prototype.slice.call(arguments);
    const useAad = args.length >= 3 ? !!args[2] : true;
    const iv = (args.length >= 4 && args[3]) ? args[3] : crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('chacha20-poly1305', key, iv, { authTagLength: 16 });
    if (useAad) cipher.setAAD(iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, ciphertext, tag]);
}

function decryptChaCha(data, key) {
    const args = Array.prototype.slice.call(arguments);
    const useAad = args.length >= 3 ? !!args[2] : true;
    const iv = data.slice(0, 12);
    const enc = data.slice(12);
    if (enc.length < 16) throw new Error('Invalid ChaCha payload');
    const tag = enc.slice(enc.length - 16);
    const ciphertext = enc.slice(0, enc.length - 16);
    const decipher = crypto.createDecipheriv('chacha20-poly1305', key, iv, { authTagLength: 16 });
    if (useAad) decipher.setAAD(iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext;
}

function encryptBasic(buf, key) {
    const out = Buffer.from(buf);
    for (let i = 0; i < out.length; i++) {
        out[i] = out[i] ^ key[i % key.length];
        const b = out[i] & 0xff;
        const v7 = (b << 1) & 0xff;
        const v1 = ((b >> 7) & 0x01);
        out[i] = (v1 | v7) & 0xff;
        out[i] = out[i] ^ out.length;
    }
    return out;
}

function decryptBasic(buf, key) {
    const out = Buffer.from(buf);
    for (let i = 0; i < out.length; i++) {
        out[i] = out[i] ^ out.length;
        const b = out[i] & 0xff;
        const v1 = (b << 7) & 0xff;
        const v7 = ((b >> 1) & 0x7f) & 0xff;
        out[i] = (v7 | v1) & 0xff;
        out[i] = out[i] ^ key[i % key.length];
    }
    return out;
}

function hkdfSha256(ikm, salt, info, length) {
    const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
    const hashLen = 32;
    const n = Math.ceil(length / hashLen);
    let prev = Buffer.alloc(0);
    const outParts = [];
    for (let i = 1; i <= n; i++) {
        const hmac = crypto.createHmac('sha256', prk);
        hmac.update(prev);
        if (info) hmac.update(info);
        hmac.update(Buffer.from([i]));
        prev = hmac.digest();
        outParts.push(prev);
    }
    return Buffer.concat(outParts).slice(0, length);
}

function generateSessionKey(sharedKey, serverPub, clientPub) {
    const ikm = Buffer.alloc(32);
    const count = Math.min(sharedKey.length, 32);
    sharedKey.copy(ikm, 32 - count, 0, count);

    const salt = Buffer.from(serverPub || []);
    const srvLen = salt.length || 1;
    const clientBuf = Buffer.from(clientPub || []);
    const info = Buffer.alloc(clientBuf.length);
    for (let i = 0; i < clientBuf.length; i++) {
        const c = clientBuf[i] & 0xff;
        let s = salt[i % srvLen] & 0xff;
        if (c > s) {
            s = (s << 1) & 0xff;
        } else {
            s = (s >> 1) & 0xff;
        }
        info[i] = (s ^ c) & 0xff;
    }

    return hkdfSha256(ikm, salt, info, 32);
}

function postBuffer(urlString, buf, headers = {}) {
    return fetch(urlString, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/octet-stream' }, headers),
        body: Buffer.isBuffer(buf) ? buf : Buffer.from(buf),
    }).then(async (res) => {
        if (!res.ok) {
            const bodyText = await res.text().catch(() => '');
            throw new Error(`POST ${urlString} failed with ${res.status} ${res.statusText}${bodyText ? ': ' + bodyText : ''}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    });
}

let _cachedServerTimeStamp = null;
let _cachedClientSyncTimeSinceStartup = 0;
let _httpSeq = 0;
let _useAad = true;

function markServerTimeStamp(serverTimeStamp) {
    _cachedServerTimeStamp = BigInt(serverTimeStamp.toNumber());
    _cachedClientSyncTimeSinceStartup = Math.floor(process.uptime());
}

async function doIkeHandshake(serverUrl = SERVER_URL_CN, serverGarbleKey = SERVER_GARBLE_KEY_CN) {
    const ecdh = crypto.createECDH('prime256v1');
    const clientPub = ecdh.generateKeys();
    const reqMsg = IKEReq.create({ ClientTs: Math.floor(Date.now() / 1000), ProtoVersion: 1, PubKey: clientPub });
    const reqBufProto = IKEReq.encode(reqMsg).finish();
    const packet = Buffer.alloc(2 + reqBufProto.length);
    packet.writeUInt16BE(1, 0);
    reqBufProto.copy(packet, 2);

    const gcm = encryptGCM(packet, serverGarbleKey, _useAad);
    const basic = encryptBasic(gcm, serverGarbleKey);

    const url = serverUrl + '/agent-zone-1/';
    const respBuf = await postBuffer(url, basic);

    const dec1 = decryptBasic(respBuf, serverGarbleKey);
    const dec2 = decryptGCM(dec1, serverGarbleKey, _useAad);

    const respMsgId = dec2.readUInt16BE(0);
    if (respMsgId !== 2) throw new Error('Unexpected IKE response msgId: ' + respMsgId);

    const respProto = dec2.slice(2);
    const resp = IKEResp.decode(respProto);
    if (resp && resp.ServerTs !== undefined && resp.ServerTs !== null) {
        markServerTimeStamp(resp.ServerTs);
    }
    const token = resp.Token;
    const cipher = resp.Cipher;
    const serverPub = resp.PubKey;
    if (!serverPub || serverPub.length === 0) throw new Error('No server public key received');

    const shared = ecdh.computeSecret(Buffer.from(serverPub));
    const sessionKey = generateSessionKey(shared, Buffer.from(serverPub), clientPub);

    return { token, cipher, sessionKey };
}

const PRIVATE_KEY_CN = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQDBdHUbBS5ZEnYbmLzUagVUD+WnG3h7vtPIb6lxLsIONtE35JEI
PY3Q6+Klv+mMAR2f8yoxp/OAD2QGwOhpMVT7HK8HyDN6W4mjx6D61/5k3FhHRfok
Fk4pyJWxCiccqO6tzMgbyqNB8W2vH9qryGdKKmjoeKfyhCKjfI5mI5QSrQIDAQAB
AoGBALUUrn0xV1X26ukgCjkGWKB8FOpb02Z5lEG9C60vKGQnuaUI5R0CiRmzgz7F
KfZsIO/UrH04ibwoK+gKcEHu9GxL0+qjqoq1KgNRhy3nqSqk1EhPmLxfUaaCdGBB
I5p4Bb8RAvtCwRABzkYobeZBQcOwSa/az0lpx4+IJu1wZAsdAkEA7RVtp6ia/QAO
JWg2ikQpYDAWB7XtVb8Q/kpGodkLCDbJbxS9+6iXHpnjoGQicwR/AnIqWyp8liPC
6agU4hoGowJBANDj4sQj+F8l24KjM04aTf0V+NCXr0rhjvKNm1GEIhz56iNxlq5O
dMcsv9B88puwvDMN7pvjm/4O3Pgt6tVlJm8CQHa9L7EzoYQq3ergOcigALT7AF2W
QSqbyfAB1UREBuFzRwmKMuhydFVQL4/p9tLyIoZgFVSZf9JWUM1jcCoZbM8CQBc+
A/FG/0+26qGyfvblvl+2niS3e+2dA0bBstJzHUiUFhUzgkyKtjujIwSTonroQ0h6
+F2oCadPCA8lLMfppUkCQQCAUYlW1Ys3DgUi+3gDZbhWqQajojfYU5PbhxhlZwc5
2TnwB+07yrrBu1yzzb0LbDWSrJUlNL2UZ438GGqrWJ0l
-----END RSA PRIVATE KEY-----`;

function generateYostarAuthHeader_CN(head = {}, body = {}, privateKeyPem = PRIVATE_KEY_CN) {
    const rid = crypto.randomUUID();

    const HEAD = {
        Channel: head.Channel ?? 'official',
        Platform: head.Platform ?? 'pc',
        Lang: head.Lang ?? 'ChineseSimplified',
        DeviceID: head.DeviceID ?? DEVICE_CN,
        Version: head.Version ?? '1.14.4',
        GVersionNo: head.GVersionNo ?? VERSION,
        GBuildNo: head.GBuildNo ?? '',
        PID: head.PID ?? 'CN-NOVA',
        DeviceModel: head.DeviceModel ?? 'MakoStar',
        Time: head.Time ?? Math.floor(Date.now() / 1000),
        UID: head.UID ?? Number(UID_CN),
        Token: head.Token ?? TOKEN_CN,
        RID: head.Rid ?? rid
    };

    const headerJson = JSON.stringify(HEAD);
    const bodyJson = JSON.stringify(body);
    const toSign = headerJson + bodyJson;

    const sign = crypto.createSign('RSA-SHA256').update(toSign, 'utf8').end();
    const signStr = sign.sign(privateKeyPem).toString('base64');
    const authObj = { Head: HEAD, Sign: signStr };
    return JSON.stringify(authObj);
}

async function quickLogin_CN(savedToken, sdkUrl = SDK_URL_CN, headOverrides = {}) {
    const url = sdkUrl + '/user/quick-login';
    const authHeader = generateYostarAuthHeader_CN(Object.assign({}), {});
    const respBuf = await postBuffer(url, Buffer.from('{}'), { 'Content-Type': 'application/json', 'Authorization': authHeader});
    let txt = '';
    txt = respBuf.toString('utf8');
    let obj = null;
    obj = JSON.parse(txt);
    if (!obj || obj.Code !== 200 || !obj.Data || !obj.Data?.User || !obj.Data.User?.Token) {
        throw new Error('/user/quick-login failed');
    }

    return { accountLoginToken: obj.Data.User.Token, accountUid: obj.Data.User.ID };
}

function makeHeader10() {
    const buf = Buffer.alloc(10, 0);

    if (_cachedServerTimeStamp === null) {
        const now = BigInt(Math.floor(Date.now() / 1000));
        let v = now;
        for (let i = 0; i < 8; i++) {
            buf[7 - i] = Number(v & BigInt(0xff));
            v >>= BigInt(8);
        }
    } else {
        const nowSinceStartup = BigInt(Math.floor(process.uptime()));
        let currentServerTs = _cachedServerTimeStamp + nowSinceStartup - BigInt(_cachedClientSyncTimeSinceStartup);
        if (currentServerTs < 0) currentServerTs = (BigInt(1) << BigInt(64)) + currentServerTs;
        let v = currentServerTs;
        for (let i = 0; i < 8; i++) {
            buf[7 - i] = Number(v & BigInt(0xff));
            v >>= BigInt(8);
        }
    }

    const seq = _httpSeq & 0xffff;
    buf.writeUInt16BE(seq, 8);
    _httpSeq = (_httpSeq + 1) & 0xffff;
    return buf;
}

function buildNovaMessage(msgId, bodyBuf, cipher, sessionKey, useServerGarble = false, serverGarbleKey = SERVER_GARBLE_KEY_CN) {
    if (!Buffer.isBuffer(bodyBuf)) bodyBuf = Buffer.from(bodyBuf || []);
    const pkt = Buffer.alloc(2 + bodyBuf.length);
    pkt.writeUInt16BE(msgId, 0);
    if (bodyBuf.length) bodyBuf.copy(pkt, 2);

    const header10 = makeHeader10();
    const plaintext = Buffer.concat([header10, pkt]);

    const useGarble = useServerGarble || msgId === 1;
    const aeadKey = useGarble ? serverGarbleKey : sessionKey;

    let enc = cipher === 1 ? encryptChaCha(plaintext, aeadKey, _useAad) : encryptGCM(plaintext, aeadKey, _useAad);

    if (useGarble) {
        enc = encryptBasic(enc, serverGarbleKey);
    }

    return enc;
}

async function doPlayerLogin_CN(sessionToken, cipher, sessionKey, accountLoginToken, accountUid, serverUrl = SERVER_URL_CN, serverGarbleKey = SERVER_GARBLE_KEY_CN, options = {}) {
    const player_login_req = 4;
    const player_login_succeed_ack = 5;
    const player_login_failed_ack = 6;
    const system_failed_ack = 10000;

    const opts = Object.assign({}, options);
    if (!opts.language) opts.language = 'zh_CN';
    if (!opts.version) opts.version = VERSION;
    if (!opts.device) opts.device = DEVICE_CN;
    if (!opts.channel) opts.channel = 'Official';

    const language = opts.language;
    const version = opts.version;
    const deviceId = opts.device;
    const channel = opts.channel;

    const reqMsg = LoginReq.create({
        Official: { Uid: accountUid, Token: accountLoginToken },
        Platform: 3,
        Language: language,
        Channel: channel,
        Device: deviceId,
        Version: version
    });
    const reqBufProto = LoginReq.encode(reqMsg).finish();

    const payload = buildNovaMessage(player_login_req, reqBufProto, cipher, sessionKey, false, serverGarbleKey);
    const url = serverUrl + '/agent-zone-1/';
    const respBuf = await postBuffer(url, payload, { 'X-Token': sessionToken });

    let decPlain;
    if (cipher === 1) {
        decPlain = decryptChaCha(respBuf, sessionKey, _useAad);
    } else {
        decPlain = decryptGCM(respBuf, sessionKey, _useAad);
    }

    let respMsgId = null;
    respMsgId = decPlain.readUInt16BE(0);

    if (respMsgId === player_login_succeed_ack) {
        const protoBuf = decPlain.slice(2);
        const info = LoginResp.decode(protoBuf);
        return info;
    } else {
        if (respMsgId === system_failed_ack) {
            const ErrType = root.lookupType('proto.Error');
            const errObj = ErrType.decode(decPlain.slice(2));
            throw new Error('Server returned system_failed_ack (10000): ' + JSON.stringify(errObj));
        } else if (respMsgId === player_login_failed_ack) {
            const ErrType = root.lookupType('proto.Error');
            const errObj = ErrType.decode(decPlain.slice(2));
            throw new Error('Server returned player_login_failed_ack (6): ' + JSON.stringify(errObj));
        } else {
            throw new Error('Unexpected player_login response msgId: ' + respMsgId);
        }
    }
}

async function getScoreBossRank(token, cipher, sessionKey, serverUrl = SERVER_URL_CN, serverGarbleKey = SERVER_GARBLE_KEY_CN) {
    const score_boss_rank_req = 11107;
    const score_boss_rank_succeed_ack = 11108;

    const payload = buildNovaMessage(score_boss_rank_req, Buffer.alloc(0), cipher, sessionKey, false, serverGarbleKey);
    const url = serverUrl + '/agent-zone-1/';
    const respBuf = await postBuffer(url, payload, { 'X-Token': token });
    let decPlain;
    if (cipher === 1) {
        decPlain = decryptChaCha(respBuf, sessionKey, _useAad);
    } else {
        decPlain = decryptGCM(respBuf, sessionKey, _useAad);
    }

    let respMsgId = null;
    respMsgId = decPlain.readUInt16BE(0);

    if (respMsgId === score_boss_rank_succeed_ack) {
        const protoBuf = decPlain.slice(2);
        const info = ScoreBossRankInfo.decode(protoBuf);
        return info;
    } else {
        throw new Error('Unexpected score_boss_rank response msgId: ' + respMsgId);
    }
}

function storeScoreBossRank_CN(info, region) {
    const obj = ScoreBossRankInfo.toObject(info, { longs: String, enums: String, bytes: 'base64' });
    if (!obj || Object.keys(obj).length === 0) {
        console.warn('ScoreBossRank info is empty; skipping');
        return;
    }

    let oldRank = [];
    const lbFile = path.join(__dirname, `${BB_SEASON}_cn.json`);
    if (fs.existsSync(lbFile)) {
        const prevSeason = JSON.parse(fs.readFileSync(lbFile, 'utf8'));
        const prevRegion = prevSeason?.region?.[region];
        if (prevRegion && Array.isArray(prevRegion.Rank)) oldRank = prevRegion.Rank;
    }

    const newRank = obj.Rank || [];
    const newIds = new Set(newRank.map(r => r.Id));
    const lastNewScore = newRank.length ? newRank[newRank.length - 1].Score : 0;

    const removed = [];
    for (const oldEntry of oldRank || []) {
        const oldId = oldEntry.Id;
        if (!newIds.has(oldId)) {
            const oldScore = oldEntry.Score;
            if (oldScore > lastNewScore) {
                const rankNum = oldEntry.Rank;
                const nick = oldEntry.NickName;
                removed.push(`${oldId} #${rankNum} ${nick} ${oldScore.toLocaleString('en-US')}`);
            }
        }
    }

    removedData[`bb${region}`] = Array.from(new Set(removed));
    regionData[`bb${region}`] = obj;
    console.log(`ScoreBossRank info stored (${region.toUpperCase()})`);
}

async function getJointDrillRank(token, cipher, sessionKey, serverUrl = SERVER_URL_CN, serverGarbleKey = SERVER_GARBLE_KEY_CN) {
    const joint_drill_rank_req = 6225;
    const joint_drill_rank_succeed_ack = 6226;

    const payload = buildNovaMessage(joint_drill_rank_req, Buffer.alloc(0), cipher, sessionKey, false, serverGarbleKey);
    const url = serverUrl + '/agent-zone-1/';
    const respBuf = await postBuffer(url, payload, { 'X-Token': token });
    let decPlain;
    if (cipher === 1) {
        decPlain = decryptChaCha(respBuf, sessionKey, _useAad);
    } else {
        decPlain = decryptGCM(respBuf, sessionKey, _useAad);
    }

    let respMsgId = null;
    respMsgId = decPlain.readUInt16BE(0);

    if (respMsgId === joint_drill_rank_succeed_ack) {
        const protoBuf = decPlain.slice(2);
        const info = JointDrillRankInfo.decode(protoBuf);
        return info;
    } else {
        throw new Error('Unexpected response msgId: ' + respMsgId);
    }
}

function storeJointDrillRank_CN(info, region) {
    const obj = JointDrillRankInfo.toObject(info, { longs: String, enums: String, bytes: 'base64' });
    if (!obj || Object.keys(obj).length === 0) {
        console.warn('JointDrillRank info is empty; skipping');
        return;
    }

    let oldRank = [];
    const lbFile = path.join(__dirname, `${FE_SEASON}_cn.json`);
    if (fs.existsSync(lbFile)) {
        const prevSeason = JSON.parse(fs.readFileSync(lbFile, 'utf8'));
        const prevRegion = prevSeason?.region?.[region];
        if (prevRegion && Array.isArray(prevRegion.Rank)) oldRank = prevRegion.Rank;
    }

    const newRank = obj.Rank || [];
    const newIds = new Set(newRank.map(r => r.Id));
    const lastNewScore = newRank.length ? newRank[newRank.length - 1].Score : 0;

    const removed = [];
    for (const oldEntry of oldRank || []) {
        const oldId = oldEntry.Id;
        if (!newIds.has(oldId)) {
            const oldScore = oldEntry.Score;
            if (oldScore > lastNewScore) {
                const rankNum = oldEntry.Rank;
                const nick = oldEntry.NickName;
                removed.push(`${oldId} #${rankNum} ${nick} ${oldScore.toLocaleString('en-US')}`);
            }
        }
    }

    removedData[`fe${region}`] = Array.from(new Set(removed));
    regionData[`fe${region}`] = obj;
    console.log(`JointDrillRank info stored (${region.toUpperCase()})`);
}

async function genLatestSeasonNameConfig_CN(params) {
    const now = new Date();
    const JointDrillActivityType = 7

    const [activityData, scoreBossControlData] = await Promise.all([
        fetch(Activity_URL).then(res => res.json()),
        fetch(SCOREBOSSCONTROL_URL).then(res => res.json())
    ]);
    
    const curSeasonBBId = Object.values(scoreBossControlData).find(item =>
        now >= new Date(item.StartTime) && now < new Date(item.EndTime)
    )?.Id ?? 0;
    
    const latestSeasonFEId = Object.values(activityData).reduce((maxId, item) => {
        if (item.ActivityType !== JointDrillActivityType) return maxId;
        return item.Id > maxId ? item.Id : maxId;
    }, 0) % 51000 || 0;

    const data = { "BB_SEASON": `bb${curSeasonBBId}`, "FE_SEASON": `fe${latestSeasonFEId}` }
    fs.writeFileSync(path.join(__dirname, 'season.json'), JSON.stringify(data, null, 4), { encoding: 'utf8' });
    return data
}

(async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const { BB_SEASON: BB_SEASON_NAME, FE_SEASON: FE_SEASON_NAME } = await genLatestSeasonNameConfig_CN();

    if (TOKEN_CN) {
        console.log('Starting IKE handshake (CN)...');
        const { token: tokenCNIke, cipher: cipherCN, sessionKey: sessionKeyCN } = await doIkeHandshake(SERVER_URL_CN, SERVER_GARBLE_KEY_CN);
        console.log('Cipher:', cipherCN === 1 ? 'ChaCha20-Poly1305' : 'AES-GCM');

        let accountLoginTokenCn = null;
        let accountUidTw = null;

        if (TOKEN_CN) {
            console.log('Found saved Yostar token; attempting quick-login (CN)...');
            const quickLoginObjCn = await quickLogin_CN(TOKEN_CN, SDK_URL_CN);
            accountLoginTokenCn = quickLoginObjCn.accountLoginToken;
            accountUidCn = quickLoginObjCn.accountUid;
            console.log('quick-login succeeded (CN)');
        }

        console.log('Sending player login request (CN)...');
        const loginRespCn = await doPlayerLogin_CN(tokenCNIke, cipherCN, sessionKeyCN, accountLoginTokenCn, accountUidCn, SERVER_URL_CN, SERVER_GARBLE_KEY_CN, { version: VERSION, language: 'zh_CN', device: DEVICE_CN });
  
        const newTokenCN = loginRespCn.Token;

        console.log('Requesting ScoreBossRank (CN)...');
        const bbCN = await getScoreBossRank(newTokenCN, cipherCN, sessionKeyCN, SERVER_URL_CN, SERVER_GARBLE_KEY_CN);
        storeScoreBossRank_CN(bbCN, 'cn');

        console.log('Requesting JointDrillRank (CN)...');
        const feCN = await getJointDrillRank(newTokenCN, cipherCN, sessionKeyCN, SERVER_URL_CN, SERVER_GARBLE_KEY_CN);
        storeJointDrillRank_CN(feCN, 'cn');
    }

    fs.writeFileSync(path.join(__dirname, `${BB_SEASON_NAME}_cn.json`), JSON.stringify(regionData.bbcn), { encoding: 'utf8' });
    fs.writeFileSync(path.join(__dirname, `${FE_SEASON_NAME}_cn.json`), JSON.stringify(regionData.fecn), { encoding: 'utf8' });
})();
