const fs = require('fs');

// 1. Fix index.html translation popup
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace('<html lang="en">', '<html lang="ja" translate="no">');
if (!indexHtml.includes('notranslate')) {
    indexHtml = indexHtml.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="google" content="notranslate" />');
}
fs.writeFileSync('index.html', indexHtml);
console.log('Fixed index.html');

// 2. Fix App.jsx password popup
let appJsx = fs.readFileSync('src/App.jsx', 'utf8');
const oldInput = `            <input
              type="password"
              inputMode="numeric"`;

const newInput = `            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              name="pin-code-dummy"
              data-lpignore="true"`;

appJsx = appJsx.replace(oldInput, newInput);
fs.writeFileSync('src/App.jsx', appJsx);
console.log('Fixed App.jsx');
