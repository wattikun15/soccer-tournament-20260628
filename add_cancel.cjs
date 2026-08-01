const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add cancelEdit function
const saveEditFunc = `  const saveEdit = (id) => {
    setMembers(members.map(m => m.id === id ? { ...m, name: editName, number: editNumber, age: editAge, referee: editReferee, isNakano: editIsNakano, isResident: false, isWorker: false } : m));
    setEditingMember(null);
  };`;

const cancelEditFunc = `  const cancelEdit = (id) => {
    const original = members.find(m => m.id === id);
    if (original && original.name === '新規選手') {
      setMembers(members.filter(m => m.id !== id));
    }
    setEditingMember(null);
  };`;

if (content.includes(saveEditFunc)) {
  content = content.replace(saveEditFunc, saveEditFunc + '\n\n' + cancelEditFunc);
}

// 2. Widen the select box
const oldSelect = `<select 
                      value={editReferee} 
                      onChange={e => setEditReferee(e.target.value)}
                      className="edit-input"
                      style={{width: 90, flexShrink: 0}}
                    >`;
                    
const newSelect = `<select 
                      value={editReferee} 
                      onChange={e => setEditReferee(e.target.value)}
                      className="edit-input"
                      style={{flex: '1 1 120px', minWidth: 100}}
                    >`;

if (content.includes(oldSelect)) {
  content = content.replace(oldSelect, newSelect);
}

// 3. Add Cancel button to UI
const oldButtons = `<button onClick={() => saveEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', padding: 8, cursor: 'pointer', marginLeft: 'auto'}}>
                      <Save size={20} />
                    </button>`;

const newButtons = `<div style={{marginLeft: 'auto', display: 'flex', gap: 4}}>
                      <button onClick={() => cancelEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                        <X size={20} />
                      </button>
                      <button onClick={() => saveEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', padding: 8, cursor: 'pointer'}}>
                        <Save size={20} />
                      </button>
                    </div>`;

if (content.includes(oldButtons)) {
  content = content.replace(oldButtons, newButtons);
}

fs.writeFileSync('src/App.jsx', content);
console.log('Added cancel button and widened select box.');
