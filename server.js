/**
 * AI鍥剧墖璇嗗埆绠＄悊骞冲彴 - 鍚庣鏈嶅姟鍣?v2
 * 鏀寔 Mock 妯″紡 + 鐪熷疄鐧惧害AI 鍙屾ā寮? */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'records.json');

// 鐧惧害AI閰嶇疆
const BAIDU_CONFIG = {
  apiKey: 'E8lsno3wOTrCBzNNE44Eu4vH',
  secretKey: '27tA3f3Dtwd4C2JAUkLTBxKho5WHOkbY'
};

let cachedToken = null;
let tokenExpiry = 0;
let useMockMode = false; // 榛樿浣跨敤鐪熷疄API妯″紡
let apiAvailable = null; // null=鏈娴? true=鍙敤, false=涓嶅彲鐢?
// ==================== 鍒濆鍖?====================
function initDB() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ records: [] }));
}
initDB();

function readDB() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return { records: [] }; } }
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// ==================== 鐧惧害AI Token ====================
function getBaiduToken() {
  return new Promise((resolve, reject) => {
    if (cachedToken && Date.now() < tokenExpiry) return resolve(cachedToken);
    const postData = `grant_type=client_credentials&client_id=${BAIDU_CONFIG.apiKey}&client_secret=${BAIDU_CONFIG.secretKey}`;
    const req = https.request({
      hostname: 'aip.baidubce.com', path: '/oauth/2.0/token',
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.access_token) { cachedToken = j.access_token; tokenExpiry = Date.now() + (j.expires_in - 300) * 1000; resolve(cachedToken); }
          else reject(new Error(j.error_description || 'Token鑾峰彇澶辫触'));
        } catch(e) { reject(new Error('Token鍝嶅簲瑙ｆ瀽澶辫触')); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ==================== 鐧惧害AI璋冪敤 ====================
function callBaiduAI(apiPath, params) {
  return getBaiduToken().then(token => new Promise((resolve, reject) => {
    const postData = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const req = https.request({
      hostname: 'aip.baidubce.com', path: `${apiPath}?access_token=${token}`,
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ error: true, message: '瑙ｆ瀽澶辫触', raw: data }); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  }));
}

// ==================== Mock 鏁版嵁鐢熸垚鍣?====================
function generateMockResult(type, base64Image) {
  // 鏍规嵁鍥剧墖澶у皬鍜宐ase64鐗瑰緛鍋?浼垎鏋?
  const imgSize = base64Image ? Math.round(base64Image.length / 13737) : 100;
  
  switch(type) {
    case 'general':
      const generalResults = [
        { keyword: '浜虹墿', score: 0.68 + Math.random() * 0.3 },
        { keyword: '鐓х墖', score: 0.55 + Math.random() * 0.35 },
        { keyword: '鎴峰', score: 0.40 + Math.random() * 0.40 },
        { keyword: '鑷劧椋庡厜', score: 0.30 + Math.random() * 0.30 },
        { keyword: '寤虹瓚', score: 0.20 + Math.random() * 0.25 },
        { keyword: '鍔ㄧ墿', score: 0.15 + Math.random() * 0.20 },
        { keyword: '妞嶇墿', score: 0.10 + Math.random() * 0.15 },
        { keyword: '缇庨', score: 0.08 + Math.random() * 0.12 },
      ];
      // 闅忔満鎵撲贡骞舵埅鍙?      generalResults.sort(() => Math.random() - 0.5).slice(0, 6).forEach(r => r.score = Math.min(0.99, r.score));
      return { result: generalResults.sort((a,b) => b.score - a.score), _mock: true };
      
    case 'ocr':
      return {
        words_result: [
          { words: '杩欐槸涓€娈电ず渚嬫枃瀛? },
          { words: 'MOCK MODE - 妯℃嫙鏁版嵁' },
          { words: '鍥剧墖鏂囧瓧璇嗗埆婕旂ず' },
          { words: `鍥惧儚澶у皬绾?${imgSize}KB` },
        ],
        words_result_num: 4,
        _mock: true
      };
      
    case 'object':
      return {
        result: [
          { name: '涓讳綋鐩爣', score: 0.75 + Math.random() * 0.2, location: { left: 10, top: 10, width: 200, height: 150 } },
          { name: '娆¤鐩爣', score: 0.30 + Math.random() * 0.3, location: { left: 50, top: 80, width: 80, height: 60 } },
        ],
        result_num: 2,
        _mock: true
      };
      
    case 'censor':
      return {
        conclusion: '鍚堣',
        conclusionType: 1,
        result: { scenes: { porn: 0.001, terror: 0.000, politic: 0.000, illegal: 0.000, abuse: 0.002, spam: 0.003 } },
        _mock: true
      };
      
    case 'plate':
      return {
        words_result: [
          { number: '浜珹12345', color: 'blue', probability: [0.92] }
        ],
        _mock: true
      };
      
    default:
      return generateMockResult('general', base64Image);
  }
}

// ==================== 璺敱澶勭悊 ====================

// 缁勫悎閫氱敤璇嗗埆 鈥?璋冪敤澶氫釜宸插紑閫氱殑鎺ュ彛鍚堝苟缁撴灉
async function recognizeGeneral(base64Image) {
  const apis = [
    { path: '/rest/2.0/image-classify/v1/animal', name: '鍔ㄧ墿' },
    { path: '/rest/2.0/image-classify/v1/plant', name: '妞嶇墿' },
    { path: '/rest/2.0/image-classify/v2/dish', name: '鑿滃搧' },
    { path: '/rest/2.0/image-classify/v1/car', name: '杞﹁締' },
    { path: '/rest/2.0/image-classify/v1/landmark', name: '鍦版爣' },
    { path: '/rest/2.0/image-classify/v2/logo', name: 'Logo' }
  ];
  
  try {
    const results = await Promise.allSettled(
      apis.map(api => callBaiduAI(api.path, { image: base64Image }).then(r => ({ ...r, _type: api.name })))
    );
    
    const allResults = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        const items = r.value && Array.isArray(r.value.result) ? r.value.result : [];
        items.forEach(item => allResults.push(item));
      }
    });
    
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    return { result: allResults.slice(0, 15) };
  } catch (e) {
    return { error: true, message: e.message };
  }
}

// ==================== 鏈嶅姟鍣?====================
function serveStatic(req, res) {
  let filePath = '.' + (req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
  };
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('404 Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(content);
  });
}

function handleApi(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let params = {};
    try { params = JSON.parse(body); } catch(e) {}
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // CORS preflight
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    
    // ---- /api/mode ----
    if (pathname === '/api/mode' && req.method === 'GET') {
      res.end(JSON.stringify({ mockMode: useMockMode, apiAvailable }));
      return;
    }
    if (pathname === '/api/mode' && req.method === 'POST') {
      useMockMode = params.mockMode !== false;
      apiAvailable = params.apiAvailable !== undefined ? params.apiAvailable : apiAvailable;
      res.end(JSON.stringify({ success: true, mockMode: useMockMode }));
      return;
    }
    
    // ---- /api/token ----
    if (pathname === '/api/token') {
      getBaiduToken()
        .then(token => res.end(JSON.stringify({ success: true, access_token: token })))
        .catch(err => res.end(JSON.stringify({ success: false, error: err.message })));
      return;
    }
    
    // ---- /api/recognize ----
    if (pathname === '/api/recognize') {
      const { base64, type } = params;
      const recType = type || 'general';
      
      let promise;
      if (useMockMode) {
        // Mock妯″紡锛氱洿鎺ヨ繑鍥炴ā鎷熸暟鎹?        promise = Promise.resolve(generateMockResult(recType, base64));
      } else {
        // 鐪熷疄妯″紡锛氳皟鐢ㄧ櫨搴I
        switch(recType) {
          case 'general': promise = recognizeGeneral(base64); break;
          case 'object': promise = callBaiduAI('/rest/2.0/image-classify/v1/object_detect', { image: base64 }); break;
          case 'censor': promise = callBaiduAI('/rest/2.0/solution/v1/img_censor/user_defined', { image: base64 }); break;
          case 'plate': promise = callBaiduAI('/rest/2.0/ocr/v1/license_plate', { image: base64, multi_detect: 'true' }); break;
          case 'ocr': promise = callBaiduAI('/rest/2.0/ocr/v1/general_basic', { image: base64, language_type: 'CHN_ENG' }); break;
          default: promise = recognizeGeneral(base64);
        }
      }
      
      promise.then(result => {
        // 淇濆瓨璁板綍锛堟棤璁烘垚鍔熷け璐ラ兘淇濆瓨锛?        const db = readDB();
        const isOk = !result.error_code && !result.error;
        db.records.unshift({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          type: recType,
          result,
          timestamp: new Date().toISOString(),
          success: isOk,
          mock: !!result._mock
        });
        if (db.records.length > 500) db.records = db.records.slice(0, 500);
        writeDB(db);
        res.end(JSON.stringify({ success: true, result, mock: !!result._mock }));
      }).catch(err => {
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
      return;
    }
    
    // ---- /api/records ----
    if (pathname === '/api/records') {
      const db = readDB();
      const page = parseInt(parsedUrl.query?.match(/page=(\d+)/)?.[1] || '1');
      const pageSize = 20;
      const start = (page - 1) * pageSize;
      res.end(JSON.stringify({ success: true, records: db.records.slice(start, start + pageSize), total: db.records.length, page, pageSize }));
      return;
    }
    
    // ---- DELETE /api/record ----
    if (pathname === '/api/record' && req.method === 'DELETE') {
      const id = parsedUrl.query?.id;
      const db = readDB();
      if (id) { db.records = db.records.filter(r => r.id !== id); writeDB(db); res.end(JSON.stringify({ success: true })); }
      else res.end(JSON.stringify({ success: false, error: '缂哄皯id' }));
      return;
    }
    
    // ---- DELETE /api/records (娓呯┖) ----
    if (pathname === '/api/records' && req.method === 'DELETE') {
      writeDB({ records: [] }); res.end(JSON.stringify({ success: true })); return;
    }
    
    // ---- /api/stats ----
    if (pathname === '/api/stats') {
      const db = readDB();
      const now = new Date(); const todayStr = now.toISOString().slice(0,10);
      const todayRecs = db.records.filter(r => r.timestamp.slice(0,10) === todayStr);
      const okRecs = db.records.filter(r => r.success);
      const types = {};
      db.records.forEach(r => { types[r.type] = (types[r.type]||0)+1; });
      res.end(JSON.stringify({
        success: true, total: db.records.length, today: todayRecs.length,
        success: okRecs.length, types
      }));
      return;
    }
    
    res.writeHead(404); res.end(JSON.stringify({ error: 'Not Found' }));
  });
}

// ==================== 鍚姩鏈嶅姟鍣?====================
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) handleApi(req, res); else serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('   AI 鍥剧墖璇嗗埆绠＄悊骞冲彴 - 鏈嶅姟鍣ㄥ凡鍚姩');
  console.log('========================================');
  console.log('');
  console.log(`  璁块棶鍦板潃锛歨ttp://localhost:${PORT}`);
  console.log('');
  console.log(`  鐧惧害AI API锛氬凡閰嶇疆`);
  console.log(`  褰撳墠妯″紡锛?{useMockMode ? '馃煝 Mock妯℃嫙妯″紡锛堟棤闇€API鏉冮檺锛? : '馃數 鐪熷疄API妯″紡'}`);
  console.log('');
  console.log(`  鎻愮ず锛氬闇€浣跨敤鐪熷疄鐧惧害AI锛岃鍦ㄩ〉闈㈠彸涓婅鍒囨崲涓?鐪熷疄API妯″紡"`);
  console.log(`       骞剁‘淇濆凡鍦ㄧ櫨搴I鎺у埗鍙板紑閫氱浉搴旀潈闄恅);
  console.log('========================================');
  console.log('');
});
