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

const CN_BB_URL = null;
const CN_FE_URL = null;

const BLITZ_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/blitz.json';
const RAID_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/raid.json';
const CHARACTERID_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/characterid.json';
const STARTOWERBUILDRANK_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/EN/bin/StarTowerBuildRank.json';
const POTENTIAL_URL = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/refs/heads/main/EN/bin/CharPotential.json';

const VERSION = '727.727.727.7272727';

const SDK_URL_CN = 'https://sdk-api.yostar.cn';
// const SDK_URL_EN = 'https://en-sdk-api.yostarplat.com';
// const SDK_URL_JP = 'https://jp-sdk-api.yostarplat.com';
// const SDK_URL_KR = 'https://jp-sdk-api.yostarplat.com';
// const SDK_URL_TW = 'https://jp-sdk-api.yostarplat.com';
const SERVER_URL_CN = 'https://nova.yostar.cn';
// const SERVER_URL_EN = 'https://nova.stellasora.global';
// const SERVER_URL_JP = 'https://nova.stellasora.jp';
// const SERVER_URL_KR = 'https://nova.stellasora.kr';
// const SERVER_URL_TW = 'https://nova.stargazer-games.com';
const SERVER_GARBLE_KEY_CN = Buffer.from('QW*Wi7fKjLk!T82Qf2nEGZA%nSC!D9qV', 'ascii');
// const SERVER_GARBLE_KEY_EN = Buffer.from('xNdVF^XTa6T3HCUATMQ@sKMLzAw&%L!3', 'ascii');
// const SERVER_GARBLE_KEY_JP = Buffer.from('yX5Gt64PVvVH6$qwBXaPJC*LZKoK5mYh', 'ascii');
// const SERVER_GARBLE_KEY_KR = Buffer.from('25hdume9H#*6hHn@d9hSF7tekTwN#JYj', 'ascii');
// const SERVER_GARBLE_KEY_TW = Buffer.from('N&mfco452ZH5!nE3s&o5uxB57UGPENVo', 'ascii');

// const DEVICE = crypto.randomBytes(20).toString('hex');
const DEVICE_CN = process.env.DEVICE_CN;
const TOKEN_CN = process.env.TOKEN_CN;
const UID_CN = process.env.UID_CN;

// const DEVICE = process.env.DEVICE;
// const EMAIL_EN = process.env.EMAIL_EN;
// const EMAIL_JP = process.env.EMAIL_JP;
// const EMAIL_KR = process.env.EMAIL_KR;
// const EMAIL_TW = process.env.EMAIL_TW;
// const TOKEN_EN = process.env.TOKEN_EN;
// const TOKEN_JP = process.env.TOKEN_JP;
// const TOKEN_KR = process.env.TOKEN_KR;
// const TOKEN_TW = process.env.TOKEN_TW;
// const UID_EN = process.env.UID_EN;
// const UID_JP = process.env.UID_JP;
// const UID_KR = process.env.UID_KR;
// const UID_TW = process.env.UID_TW;

const SEASONS = [BB_SEASON, FE_SEASON];
const REGIONS = ['en', 'jp', 'kr', 'tw', 'cn'];

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

async function isAutumnPlayingStellaSoraRightNow() {
    const lanyard = await fetch('https://api.lanyard.rest/v1/users/393694671383166998').then(res => res.json());
    return lanyard.data?.activities?.some(activity => activity.name === 'Stella Sora');
}

async function doIkeHandshake(serverUrl = SERVER_URL_EN, serverGarbleKey = SERVER_GARBLE_KEY_EN) {
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

function buildNovaMessage(msgId, bodyBuf, cipher, sessionKey, useServerGarble = false, serverGarbleKey = SERVER_GARBLE_KEY_EN) {
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

async function getPlayerData(token, cipher, sessionKey, serverUrl = SERVER_URL_EN, serverGarbleKey = SERVER_GARBLE_KEY_EN) {
    const player_data_req = 1001;
    const player_data_succeed_ack = 1002;

    const payload = buildNovaMessage(player_data_req, Buffer.alloc(0), cipher, sessionKey, false, serverGarbleKey);
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

    if (respMsgId === player_data_succeed_ack) {
        const protoBuf = decPlain.slice(2);
        const info = PlayerInfoType.decode(protoBuf);
        return info;
    } else {
        throw new Error('Unexpected player_data response msgId: ' + respMsgId);
    }
}

function saveInventoryToFile(info, filename) {
    const obj = PlayerInfoType.toObject(info, { longs: String, enums: String, bytes: 'base64' });
    const items = (obj.Items || []).slice();
    const res = (obj.Res || []).slice();

    items.sort((a, b) => {
        const ta = Number(a.Tid ?? a.tid ?? 0);
        const tb = Number(b.Tid ?? b.tid ?? 0);
        return ta - tb;
    });

    res.sort((a, b) => {
        const ta = Number(a.Tid ?? 0);
        const tb = Number(b.Tid ?? 0);
        return ta - tb;
    });

    fs.writeFileSync(filename, JSON.stringify({ Items: items, Res: res }), { encoding: 'utf8' });
    console.log('Inventory saved to', filename);
}

async function getScoreBossRank(token, cipher, sessionKey, serverUrl = SERVER_URL_EN, serverGarbleKey = SERVER_GARBLE_KEY_EN) {
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

function storeScoreBossRank(info, region) {
    const obj = ScoreBossRankInfo.toObject(info, { longs: String, enums: String, bytes: 'base64' });
    if (!obj || Object.keys(obj).length === 0) {
        console.warn('ScoreBossRank info is empty; skipping');
        return;
    }

    let oldRank = [];
    const lbFile = path.join(__dirname, `${BB_SEASON}.json`);
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

async function getJointDrillRank(token, cipher, sessionKey, serverUrl = SERVER_URL_EN, serverGarbleKey = SERVER_GARBLE_KEY_EN) {
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

function storeJointDrillRank(info, region) {
    const obj = JointDrillRankInfo.toObject(info, { longs: String, enums: String, bytes: 'base64' });
    if (!obj || Object.keys(obj).length === 0) {
        console.warn('JointDrillRank info is empty; skipping');
        return;
    }

    let oldRank = [];
    const lbFile = path.join(__dirname, `${FE_SEASON}.json`);
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

function getSeasonPrefix(season) {
    return String(season).replace(/\d+/g, '');
}

function getSeasonRegionKey(season, region) {
    return `${getSeasonPrefix(season)}${region}`;
}

function combineLeaderboard(season) {
    const prefix = getSeasonPrefix(season);
    const combined = [];
    let sumTotal = 0;
    let maxRefresh = 0;

    for (const region of REGIONS) {
        const json = regionData[getSeasonRegionKey(season, region)];
        if (!json) continue;
        sumTotal += Number(json.Total) || 0;
        const lr = Number(json.LastRefreshTime) || 0;
        if (lr > maxRefresh) maxRefresh = lr;
        const rankArr = json.Rank || [];
        for (const r of rankArr) {
            const copy = Object.assign({}, r);
            const nick = copy.NickName;
            copy.NickName = `${nick} (${region.toUpperCase()})`;
            combined.push(copy);
        }
    }

    combined.sort((a, b) => {
        const sa = a.Score;
        const sb = b.Score;
        if (sa === sb) return 0;
        return sb - sa;
    });

    let lastScore = null;
    let lastRank = 0;
    for (let i = 0; i < combined.length; i++) {
        const s = combined[i].Score;
        if (i === 0) {
            lastRank = 1;
            combined[i].Rank = lastRank;
            lastScore = s;
        } else if (s === lastScore) {
            combined[i].Rank = lastRank;
        } else {
            const rank = i + 1;
            combined[i].Rank = rank;
            lastRank = rank;
            lastScore = s;
        }
    }

    if (!Array.isArray(combined) || combined.length === 0 || combined.every(r => !r || Object.keys(r).length === 0)) {
        console.warn(`Combined leaderboard for ${season} is empty; skipping`);
        return;
    }

    const out = { Rank: combined, Total: sumTotal, LastRefreshTime: String(maxRefresh) };
    const combinedKey = `${prefix}all`;
    regionData[combinedKey] = out;
    removedData[combinedKey] = [...REGIONS.map(r => removedData[getSeasonRegionKey(season, r)] || []).flat()];
    console.log(`Combined leaderboard for ${season} stored`);
}

async function processSeason(season) {
    const regionKeys = [...REGIONS, 'all'];
    const regionMap = {};
    for (const rk of regionKeys) {
        const fname = getSeasonRegionKey(season, rk);
        regionMap[rk] = regionData[fname] || null;
    }
    const missingRegions = REGIONS.filter((rk) => {
        if (rk === 'cn') return false;
        const region = regionMap[rk];
        return !region || !Array.isArray(region.Rank) || region.Rank.length === 0;
    });
    if (missingRegions.length > 0) {
        console.warn(`Skipping processing ${season}; missing region data: ${missingRegions.join(', ')}`);
        return;
    }

    const [characterIdData, starTowerBuildRankData, potentialData, blitzData, raidData] = await Promise.all([
        fetch(CHARACTERID_URL).then(res => res.json()),
        fetch(STARTOWERBUILDRANK_URL).then(res => res.json()),
        fetch(POTENTIAL_URL).then(res => res.json()),
        fetch(BLITZ_URL).then(res => res.json()),
        fetch(RAID_URL).then(res => res.json()),
    ]);

    const region = {};
    const globalNeededCharIds = new Set();

    for (const rk of regionKeys) {
        const rd = regionMap[rk];
        if (!rd) continue;

        if (rd.Rank) {
            for (const entry of rd.Rank) {
                for (const team of entry.Teams || []) {
                    team.RecordRank = computeRecordRank(team.BuildScore, starTowerBuildRankData || {});
                }
            }
        }

        if (rd.Self?.Teams) {
            for (const team of rd.Self.Teams) {
                team.RecordRank = computeRecordRank(team.BuildScore, starTowerBuildRankData || {});
            }
        }

        const charCountsAll = {};
        const charUsersAll = {};
        const charCountsByFloor = {};
        const charUsersByFloor = {};
        if (rd.Rank) {
            for (const entry of rd.Rank) {
                const perFloorCharSets = {};
                for (const team of entry.Teams || []) {
                    const fid = String(team.LevelId ?? '');
                    if (!fid) continue;
                    if (!perFloorCharSets[fid]) perFloorCharSets[fid] = new Set();
                    for (const c of team.Chars || []) perFloorCharSets[fid].add(+c.Id);
                }

                for (const fid of Object.keys(perFloorCharSets)) {
                    if (!charCountsByFloor[fid]) charCountsByFloor[fid] = {};
                    if (!charUsersByFloor[fid]) charUsersByFloor[fid] = {};
                    for (const cid of perFloorCharSets[fid]) {
                        charCountsByFloor[fid][cid] = (charCountsByFloor[fid][cid] || 0) + 1;
                        charUsersByFloor[fid][cid] = charUsersByFloor[fid][cid] || [];
                        charUsersByFloor[fid][cid].push({ id: entry.Id, name: entry.NickName, rank: entry.Rank });
                    }
                }

                const playerChars = new Set();
                for (const team of entry.Teams || []) {
                    for (const c of team.Chars || []) playerChars.add(+c.Id);
                }
                for (const cid of playerChars) {
                    charCountsAll[cid] = (charCountsAll[cid] || 0) + 1;
                    charUsersAll[cid] = charUsersAll[cid] || [];
                    charUsersAll[cid].push({ id: entry.Id, name: entry.NickName, rank: entry.Rank });
                }
            }
        }

        const usageByFloor = {};
        for (const fid of Object.keys(charCountsByFloor)) {
            const counts = charCountsByFloor[fid] || {};
            const users = charUsersByFloor[fid] || {};
            const list = Object.keys(counts)
                .map((k) => {
                    const idNum = +k;
                    const name = (characterIdData && characterIdData[idNum]) || undefined;
                    const us = (users[k] || []).map((u) => ({ id: u.id, name: u.name, rank: u.rank }));
                    return { id: idNum, count: counts[k], name, users: us };
                })
                .sort((a, b) => b.count - a.count);
            let prevCountLocal = null;
            let currentRankLocal = 0;
            for (let i = 0; i < list.length; i++) {
                if (list[i].count !== prevCountLocal) currentRankLocal = i + 1;
                list[i].rank = currentRankLocal;
                prevCountLocal = list[i].count;
            }
            usageByFloor[fid] = list;
        }

        const usageAll = Object.keys(charCountsAll)
            .map((k) => {
                const idNum = +k;
                const name = (characterIdData && characterIdData[idNum]) || undefined;
                const users = (charUsersAll[k] || []).map((u) => ({ id: u.id, name: u.name, rank: u.rank }));
                return { id: idNum, count: charCountsAll[k], name, users };
            })
            .sort((a, b) => b.count - a.count);
        let prevCountLocal = null;
        let currentRankLocal = 0;
        for (let i = 0; i < usageAll.length; i++) {
            if (usageAll[i].count !== prevCountLocal) currentRankLocal = i + 1;
            usageAll[i].rank = currentRankLocal;
            prevCountLocal = usageAll[i].count;
        }
        usageByFloor['all'] = usageAll;

        const teamCountsAll = {};
        const teamUsersAll = {};
        const teamCountsByFloor = {};
        const teamUsersByFloor = {};
        if (rd.Rank) {
            for (const entry of rd.Rank) {
                const perFloorTeamSets = {};
                for (const team of entry.Teams || []) {
                    const fid = String(team.LevelId ?? '');
                    if (!fid) continue;
                    const ids = [(team.Chars[0] || {}).Id, (team.Chars[1] || {}).Id, (team.Chars[2] || {}).Id];
                    const main = ids[0];
                    const support = [ids[1], ids[2]].sort((a, b) => a - b);
                    const key = `${main}-${support[0]}-${support[1]}`;
                    if (!perFloorTeamSets[fid]) perFloorTeamSets[fid] = new Set();
                    if (perFloorTeamSets[fid].has(key)) continue;
                    perFloorTeamSets[fid].add(key);

                    if (!teamCountsByFloor[fid]) teamCountsByFloor[fid] = {};
                    if (!teamUsersByFloor[fid]) teamUsersByFloor[fid] = {};
                    teamCountsByFloor[fid][key] = (teamCountsByFloor[fid][key] || 0) + 1;
                    teamUsersByFloor[fid][key] = teamUsersByFloor[fid][key] || [];
                    teamUsersByFloor[fid][key].push({ id: entry.Id, name: entry.NickName, rank: entry.Rank, chars: ids, teamScore: getTeamScoreForSeason(team, season) });
                }

                const playerTeams = new Set();
                for (const team of entry.Teams || []) {
                    const ids = [(team.Chars[0] || {}).Id, (team.Chars[1] || {}).Id, (team.Chars[2] || {}).Id];
                    const main = ids[0];
                    const support = [ids[1], ids[2]].sort((a, b) => a - b);
                    const key = `${main}-${support[0]}-${support[1]}`;
                    if (playerTeams.has(key)) continue;
                    playerTeams.add(key);
                    teamCountsAll[key] = (teamCountsAll[key] || 0) + 1;
                    teamUsersAll[key] = teamUsersAll[key] || [];
                    teamUsersAll[key].push({ id: entry.Id, name: entry.NickName, rank: entry.Rank, chars: ids, teamScore: getTeamScoreForSeason(team, season) });
                }
            }
        }

        const usageTeamByFloor = {};
        for (const fid of Object.keys(teamCountsByFloor)) {
            const counts = teamCountsByFloor[fid] || {};
            const users = teamUsersByFloor[fid] || {};
            const list = Object.keys(counts).map((k) => {
                const parts = k.split('-').map((n) => Number(n));
                const mainId = parts[0];
                const support0 = parts[1];
                const support1 = parts[2];
                const us = (users[k] || []).map((u) => ({ id: u.id, name: u.name, rank: u.rank, teamScore: u.teamScore }));
                const topUser = us.length ? us.reduce((best, u) => (!best || (u.teamScore || 0) > (best.teamScore || 0) ? u : best), null) : null;
                const mainName = (characterIdData && characterIdData[mainId]) || undefined;
                const supportName0 = (characterIdData && characterIdData[support0]) || undefined;
                const supportName1 = (characterIdData && characterIdData[support1]) || undefined;
                const displayName = `${mainName || mainId} • ${supportName0 || support0}, ${supportName1 || support1}`;
                return { key: k, main: mainId, members: [mainId, support0, support1], count: counts[k], name: displayName, users: us, topUser };
            });
            list.sort((a, b) => b.count - a.count);
            let prev = null;
            let rank = 0;
            for (let i = 0; i < list.length; i++) {
                if (list[i].count !== prev) rank = i + 1;
                list[i].rank = rank;
                prev = list[i].count;
            }
            usageTeamByFloor[fid] = list;
        }

        const usageTeamAll = Object.keys(teamCountsAll).map((k) => {
            const parts = k.split('-').map((n) => Number(n));
            const mainId = parts[0];
            const support0 = parts[1];
            const support1 = parts[2];
            const users = (teamUsersAll[k] || []).map((u) => ({ id: u.id, name: u.name, rank: u.rank, teamScore: u.teamScore }));
            const topUser = users.length ? users.reduce((best, u) => (!best || (u.teamScore || 0) > (best.teamScore || 0) ? u : best), null) : null;
            const mainName = (characterIdData && characterIdData[mainId]) || undefined;
            const supportName0 = (characterIdData && characterIdData[support0]) || undefined;
            const supportName1 = (characterIdData && characterIdData[support1]) || undefined;
            const displayName = `${mainName || mainId} • ${supportName0 || support0}, ${supportName1 || support1}`;
            return { key: k, main: mainId, members: [mainId, support0, support1], count: teamCountsAll[k], name: displayName, users: users, topUser };
        });
        usageTeamAll.sort((a, b) => b.count - a.count);
        prev = null;
        rank = 0;
        for (let i = 0; i < usageTeamAll.length; i++) {
            if (usageTeamAll[i].count !== prev) rank = i + 1;
            usageTeamAll[i].rank = rank;
            prev = usageTeamAll[i].count;
        }
        usageTeamByFloor['all'] = usageTeamAll;

        rd.UsageByFloor = usageByFloor;
        rd.UsageTeamByFloor = usageTeamByFloor;

        const neededCharIds = new Set();
        if (rd.Rank) {
            for (const entry of rd.Rank) {
                for (const team of entry.Teams || []) {
                    for (const c of team.Chars || []) {
                        neededCharIds.add(+c.Id);
                    }
                }
            }
        }
        if (rd.Self?.Teams) {
            for (const team of rd.Self.Teams) {
                for (const c of team.Chars || []) {
                    neededCharIds.add(+c.Id);
                }
            }
        }
        for (const n of neededCharIds) globalNeededCharIds.add(n);

        region[rk] = rd;
    }

    const potentialDataSubset = {};
    for (const idNum of globalNeededCharIds) {
        if (potentialData && potentialData[idNum]) potentialDataSubset[idNum] = potentialData[idNum];
    }

    for (const rk2 of Object.keys(region)) {
        const rd2 = region[rk2];
        if (!rd2) continue;
        if (Array.isArray(rd2.Rank)) {
            for (const entry of rd2.Rank) {
                for (const team of entry.Teams || []) {
                    const tb = mapTeamPotentials(team);
                    team.BuildCode = packPotentialData(tb, potentialDataSubset) || null;
                }
            }
        }
        if (rd2.Self && Array.isArray(rd2.Self.Teams)) {
            for (const team of rd2.Self.Teams) {
                const tb = mapTeamPotentials(team);
                team.BuildCode = packPotentialData(tb, potentialDataSubset) || null;
            }
        }
    }

    const hasContent = Object.keys(region).some((k) => {
        const rd = region[k];
        if (!rd) return false;
        if (Array.isArray(rd.Rank) && rd.Rank.length > 0) return true;
        if (rd.Self && Object.keys(rd.Self).length > 0) return true;
        return false;
    });

    if (!hasContent) {
        console.log(`No data for ${season}; skipping`);
    } else {
        const out = { region };
        const outName = `${season}.json`;
        fs.writeFileSync(path.join(__dirname, outName), JSON.stringify(out), { encoding: 'utf8' });
        console.log(`Processed leaderboard written to ${outName}`);
    }
}

function isMetaEmpty(m) {
    if (!m) return true;
    if (m.floor && typeof m.floor === 'object' && Object.keys(m.floor).length > 0) return false;
    const rem = m.removed || {};
    for (const k of ['all', 'en', 'jp', 'kr', 'tw', 'cn']) {
        if (Array.isArray(rem[k]) && rem[k].length > 0) return false;
    }
    return true;
}

function computeRecordRank(buildScore, rankData) {
    if (!rankData) return null;
    let best = null;
    Object.keys(rankData).forEach((k) => {
        const cfg = rankData[k];
        const min = cfg.MinGrade || 0;
        if (buildScore >= min) best = k;
    });
    return best;
}

function getTeamScoreForSeason(team, seasonName) {
    if (!team) return 0;

    if (seasonName === FE_SEASON) {
        return -Number(team.Time);
    }
    return Number(team.LevelScore);
}

function packPotentialData(tbCharPotential, charCfgMap = {}) {
    if (!Array.isArray(tbCharPotential) || tbCharPotential.length !== 3) return null;
    const bitBuffer = [];
    const addBit = (b) => bitBuffer.push(b ? 1 : 0);
    const writeBits = (value, numBits) => {
        for (let i = numBits - 1; i >= 0; i--) addBit((value >>> i) & 1);
    };
    const toUint32 = (num) => {
        num = Math.floor(num || 0);
        if (num < 0) num = 0;
        if (num > 0xffffffff) num = 0xffffffff;
        return num >>> 0;
    };
    const getLevelFromPotentials = (tbPotential, nId) => {
        if (!Array.isArray(tbPotential)) return 0;
        for (const p of tbPotential) {
            if ((p.nId ?? p.Id ?? p.id) === nId) {
                return (p.nLevel ?? p.Level ?? p.level ?? 0) | 0;
            }
        }
        return 0;
    };
    const pack_potential = (tbAll, tbPotential, bSpecial) => {
        for (const nId of tbAll) {
            const nLevel = getLevelFromPotentials(tbPotential, nId);
            if (bSpecial) writeBits(nLevel > 0 ? 1 : 0, 1);
            else writeBits(nLevel, 3);
        }
    };

    for (const v of tbCharPotential) {
        const nCharId = v.nCharId ?? v.CharId ?? v.charId;
        if (!nCharId || nCharId === 0) return null;
        writeBits(toUint32(nCharId), 32);
    }

    tbCharPotential.forEach((v, idx) => {
        const nCharId = v.nCharId ?? v.CharId ?? v.charId;
        const potentials = v.tbPotential ?? v.Potentials ?? v.potentials ?? [];
        const cfg = charCfgMap[nCharId];
        if (!cfg) return null;
        if (idx === 0) {
            pack_potential(cfg.MasterSpecificPotentialIds || [], potentials, true);
            pack_potential(cfg.MasterNormalPotentialIds || [], potentials, false);
            pack_potential(cfg.CommonPotentialIds || [], potentials, false);
        } else {
            pack_potential(cfg.AssistSpecificPotentialIds || [], potentials, true);
            pack_potential(cfg.AssistNormalPotentialIds || [], potentials, false);
            pack_potential(cfg.CommonPotentialIds || [], potentials, false);
        }
    });

    const bytes = [];
    for (let i = 0; i < bitBuffer.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | (bitBuffer[i + j] || 0);
        bytes.push(byte & 0xff);
    }
    return Buffer.from(bytes).toString('base64');
}

function mapTeamPotentials(team) {
    const teamPots = team.Potentials || [];
    const mappedPots = teamPots.map((p) => ({ Id: p.PotentialId ?? p.Id ?? p.id, Level: p.Level ?? p.nLevel ?? p.level }));
    const chars = team.Chars || [];
    const tb = [];
    for (let i = 0; i < 3; i++) {
        const c = chars[i] || { Id: 0 };
        tb.push({ CharId: c.Id, Potentials: mappedPots });
    }
    return tb;
}

(async () => {
    // if (await isAutumnPlayingStellaSoraRightNow()) {
    //     console.log('Autumn is playing Stella Sora; skipping');
    //     return;
    // }

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
        console.log(bbCN)
        storeScoreBossRank(bbCN, 'cn');

        console.log('Requesting JointDrillRank (CN)...');
        const feCN = await getJointDrillRank(newTokenCN, cipherCN, sessionKeyCN, SERVER_URL_CN, SERVER_GARBLE_KEY_CN);
        console.log(feCN)
        storeJointDrillRank(feCN, 'cn');
    }

    combineLeaderboard(BB_SEASON);
    combineLeaderboard(FE_SEASON);

    const metaFile = path.join(__dirname, 'meta.json');
    let oldMeta = {};
    if (fs.existsSync(metaFile)) {
        const oldContent = fs.readFileSync(metaFile, 'utf8');
        oldMeta = JSON.parse(oldContent);
    }

    let seasonChanged = false;

    const seasonMeta = {};
    for (let season of SEASONS) {
        const meta = { floor: {}, removed: { all: [], en: [], jp: [], kr: [], tw: [], cn: [] } };
        const seasonPrefix = getSeasonPrefix(season);

        let enJson = null;
        const enKey = `${seasonPrefix}en`;
        if (regionData[enKey]) {
            enJson = regionData[enKey];
        } else {
            const lbFile = path.join(__dirname, `${season}.json`);
            if (fs.existsSync(lbFile)) {
                const prevSeason = JSON.parse(fs.readFileSync(lbFile, 'utf8'));
                enJson = prevSeason && prevSeason.region && prevSeason.region.en ? prevSeason.region.en : null;
            }
        }
        if (enJson) {
            const rankArr = Array.isArray(enJson.Rank) ? enJson.Rank : [];
            const levelSet = new Set();
            if (rankArr.length > 0) {
                const topTeams = Array.isArray(rankArr[0].Teams) ? rankArr[0].Teams : [];
                const lastTeams = Array.isArray(rankArr[rankArr.length - 1].Teams) ? rankArr[rankArr.length - 1].Teams : [];
                for (const t of topTeams) {
                    if (t && typeof t.LevelId !== 'undefined') levelSet.add(Number(t.LevelId));
                }
                for (const t of lastTeams) {
                    if (t && typeof t.LevelId !== 'undefined') levelSet.add(Number(t.LevelId));
                }
            }

            const isBBSeason = /^bb/.test(season);
            const [blitzDataRemote, raidDataRemote] = await Promise.all([fetch(BLITZ_URL).then(res => res.json()), fetch(RAID_URL).then(res => res.json())]);
            const remoteMap = isBBSeason ? (blitzDataRemote || {}) : (raidDataRemote || {});

            meta.floor = Array.from(levelSet).sort((a, b) => a - b).reduce((m, lid) => {
                const fd = remoteMap[lid] || remoteMap[String(lid)] || {};
                m[String(lid)] = { name: fd.name || fd.Name || String(lid), icon: fd.icon || fd.Icon || null };
                return m;
            }, {});
        }

        const regions = ['all', ...REGIONS];
        for (const r of regions) {
            const key = r === 'all' ? `${seasonPrefix}all` : getSeasonRegionKey(season, r);
            meta.removed[r] = Array.isArray(removedData[key]) ? removedData[key] : [];
        }

        let oldFloorIds = '';
        const currentFloorIds = Object.keys(meta.floor).sort().join(',');
        const lbFile = path.join(__dirname, `${season}.json`);
        if (fs.existsSync(lbFile)) {
            const prevSeasonData = JSON.parse(fs.readFileSync(lbFile, 'utf8'));
            const enFloorData = prevSeasonData?.region?.en?.UsageByFloor || {};
            oldFloorIds = Object.keys(enFloorData).filter(k => k !== 'all').sort().join(',');
        }

        if (oldFloorIds && currentFloorIds && oldFloorIds !== currentFloorIds) {
            console.log(`Floor changed from ${oldFloorIds} to ${currentFloorIds}. Incrementing season...`);
            let oldSeason = season;
            season = season.replace(/\d+/, (n) => String(Number(n) + 1));
            seasonChanged = true;

            const isBBSeason = /^bb/.test(season);
            if (isBBSeason) {
                BB_SEASON = season;
            } else {
                FE_SEASON = season;
            }

            for (const r of regions) {
                delete removedData[getSeasonRegionKey(season, r)];
            }
        }

        seasonMeta[season] = meta;
    }

    if (seasonChanged) {
        fs.writeFileSync(path.join(__dirname, 'season.json'), JSON.stringify({ BB_SEASON, FE_SEASON }, null, 4), { encoding: 'utf8' });
        console.log('Updated season.json file:', BB_SEASON, FE_SEASON);
    }

    SEASONS[0] = BB_SEASON;
    SEASONS[1] = FE_SEASON;

    for (const season of SEASONS) {
        const present = new Set();
        const seasonPrefix = getSeasonPrefix(season);
        for (const fname of Object.keys(regionData)) {
            let base = fname;
            if (base.endsWith('.json')) base = path.basename(base, '.json');
            if (!(base.startsWith(season) || base.startsWith(seasonPrefix))) continue;
            const obj = regionData[fname] || regionData[base] || regionData[season + base.slice(season.length)];
            if (!obj) continue;
            if (Array.isArray(obj.Rank)) {
                for (const r of obj.Rank) {
                    if (!r) continue;
                    const id = Number(r.Id || r.id || 0) || 0;
                    if (id) present.add(id);
                }
            } else if (obj.region && typeof obj.region === 'object') {
                for (const rk of Object.keys(obj.region)) {
                    const rr = obj.region[rk];
                    if (!rr || !Array.isArray(rr.Rank)) continue;
                    for (const r of rr.Rank) {
                        if (!r) continue;
                        const id = Number(r.Id || r.id || 0) || 0;
                        if (id) present.add(id);
                    }
                }
            }
        }

        const prevSeason = oldMeta && oldMeta[season] && oldMeta[season].removed ? oldMeta[season].removed : null;
        if (!seasonMeta[season]) seasonMeta[season] = { floor: {}, removed: { all: [], en: [], jp: [], kr: [], tw: [], cn: [] } };
        if (prevSeason) {
            for (const r of ['all', 'en', 'jp', 'kr', 'tw', 'cn']) {
                const rawNewList = Array.isArray(seasonMeta[season].removed[r]) ? seasonMeta[season].removed[r] : [];
                const newList = rawNewList.filter((entry) => {
                    const m2 = String(entry).match(/^(\d+)/);
                    if (!m2) return true;
                    const idNum2 = Number(m2[1]);
                    return !present.has(idNum2);
                });
                const oldList = Array.isArray(prevSeason[r]) ? prevSeason[r] : [];
                const prevFiltered = oldList.filter((entry) => {
                    const m = String(entry).match(/^(\d+)/);
                    if (!m) return true;
                    const idNum = Number(m[1]);
                    return !present.has(idNum);
                });
                seasonMeta[season].removed[r] = Array.from(new Set([...prevFiltered, ...newList]));
            }
        }
    }

    const finalMeta = {};
    for (const season of SEASONS) {
        const m = seasonMeta[season];
        const seasonFile = path.join(__dirname, `${season}.json`);
        const hasProcessedFile = fs.existsSync(seasonFile);
        if ((!oldMeta[season]) && (!isMetaEmpty(m) || hasProcessedFile)) {
            finalMeta[season] = m;
        }
    }

    for (const key of Object.keys(oldMeta)) {
        if (finalMeta.hasOwnProperty(key)) continue;
        const m = seasonMeta[key];
        const seasonFile = path.join(__dirname, `${key}.json`);
        const hasProcessedFile = fs.existsSync(seasonFile);
        if (m) {
            if (!isMetaEmpty(m) || hasProcessedFile) {
                finalMeta[key] = m;
            }
        } else {
            finalMeta[key] = oldMeta[key];
        }
    }

    for (const key of Object.keys(finalMeta)) {
        const meta = finalMeta[key];
        if (meta && meta.removed && !Array.isArray(meta.removed.cn)) {
            meta.removed.cn = [];
        }
    }

    fs.writeFileSync(metaFile, JSON.stringify(finalMeta), { encoding: 'utf8' });

    await processSeason(BB_SEASON);
    await processSeason(FE_SEASON);
})();
