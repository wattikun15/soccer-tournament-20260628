const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Remove downloadCSV function
const funcStart = content.indexOf('  // CSVダウンロード関数');
const funcEnd = content.indexOf('  return (', funcStart);

if (funcStart !== -1 && funcEnd !== -1) {
    content = content.substring(0, funcStart) + content.substring(funcEnd);
} else {
    console.log("Could not find downloadCSV function");
}

// Remove CSV button div
const btnStart = content.indexOf('      {/* CSVダウンロードボタン */}');
const btnEnd = content.indexOf('    </div>\n  );\n}\n\nfunction TeamsView');

if (btnStart !== -1 && btnEnd !== -1) {
    content = content.substring(0, btnStart) + content.substring(btnEnd);
} else {
    console.log("Could not find CSV button div");
}

fs.writeFileSync('src/App.jsx', content);
console.log("Removed CSV download feature.");
