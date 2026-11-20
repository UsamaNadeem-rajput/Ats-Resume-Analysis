// tests/paths.js
// Tumhare project mein folders `server/controllers`, `server/services` hain, mere sandbox mein `server/src/...`.
// Yeh helper dono shaklon mein sahi jagah dhoond leta hai, taake tests mein paths haath se na badalne paren.
const path = require('path');
const fs = require('fs');

const ROOT = fs.existsSync(path.join(__dirname, '..', 'src'))
  ? path.join(__dirname, '..', 'src')
  : path.join(__dirname, '..');

module.exports = {
  load: (relative) => require(path.join(ROOT, relative)),
  resolve: (relative) => require.resolve(path.join(ROOT, relative)),
  ROOT,
};