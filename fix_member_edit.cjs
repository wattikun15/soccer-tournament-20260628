const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const oldBlock = `<div style={{display: 'flex', gap: 8, width: '100%', alignItems: 'center'}}>
                    <input 
                      type="number" 
                      value={editNumber} 
                      onChange={e => setEditNumber(e.target.value)}
                      placeholder="背番号"
                      className="edit-input"
                      style={{width: 60}}
                    />
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      placeholder="名前"
                      className="edit-input"
                      style={{flex: 1}}
                    />
                    <input 
                      type="number" 
                      value={editAge} 
                      onChange={e => setEditAge(e.target.value)}
                      placeholder="年齢"
                      className="edit-input"
                      style={{width: 60}}
                    />
                    <select 
                      value={editReferee} 
                      onChange={e => setEditReferee(e.target.value)}
                      className="edit-input"
                      style={{width: 90}}
                    >
                      <option value="">(審判資格)</option>
                      <option value="4級">4級</option>
                      <option value="3級">3級</option>
                    </select>
                  </div>`;

const newBlock = `<div style={{display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%', alignItems: 'center'}}>
                    <input 
                      type="number" 
                      value={editNumber} 
                      onChange={e => setEditNumber(e.target.value)}
                      placeholder="背番号"
                      className="edit-input"
                      style={{width: 60, flexShrink: 0}}
                    />
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)}
                      placeholder="名前"
                      className="edit-input"
                      style={{flex: '1 1 120px', minWidth: 100}}
                    />
                    <input 
                      type="number" 
                      value={editAge} 
                      onChange={e => setEditAge(e.target.value)}
                      placeholder="年齢"
                      className="edit-input"
                      style={{width: 60, flexShrink: 0}}
                    />
                    <select 
                      value={editReferee} 
                      onChange={e => setEditReferee(e.target.value)}
                      className="edit-input"
                      style={{width: 90, flexShrink: 0}}
                    >
                      <option value="">(審判資格)</option>
                      <option value="4級">4級</option>
                      <option value="3級">3級</option>
                    </select>
                  </div>`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync('src/App.jsx', content);
  console.log('Fixed member edit layout.');
} else {
  console.log('Could not find the block to replace. Please check the code.');
}
