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