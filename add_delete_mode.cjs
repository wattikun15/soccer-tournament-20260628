const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add deleteMode state
const statePattern = `  const [checkBackup, setCheckBackup] = useState(null);`;
if (content.includes(statePattern) && !content.includes('const [deleteMode, setDeleteMode] = useState(false);')) {
  content = content.replace(statePattern, statePattern + `\n  const [deleteMode, setDeleteMode] = useState(false);`);
}

// 2. Update Header buttons
const oldHeader = `{isAdmin && !checkMode && (
              <button className="btn btn-primary" style={{padding: '8px 16px', width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4}} onClick={addNewMember}>
                <Plus size={16} /> 追加
              </button>
            )}
            {isAdmin && (
              <>
                {checkMode && (`;

const newHeader = `{isAdmin && !checkMode && !deleteMode && (
              <button className="btn btn-primary" style={{padding: '8px 16px', width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4}} onClick={addNewMember}>
                <Plus size={16} /> 追加
              </button>
            )}
            {isAdmin && !checkMode && (
              <button
                onClick={() => { setDeleteMode(!deleteMode); setEditingMember(null); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  background: deleteMode ? 'var(--danger)' : 'rgba(255,255,255,0.1)',
                  color: deleteMode ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                {deleteMode ? '✅ 完了' : <><Trash2 size={16} /> 削除</>}
              </button>
            )}
            {isAdmin && !deleteMode && (
              <>
                {checkMode && (`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
}

// 3. Update member list icons
const oldIcons = `{isAdmin && (
                        <>
                          <button onClick={() => startEdit(member)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteMember(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', padding: 8, cursor: 'pointer'}}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}`;

const newIcons = `{isAdmin && (
                        <>
                          {!deleteMode && (
                            <button onClick={() => startEdit(member)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                              <Edit2 size={18} />
                            </button>
                          )}
                          {deleteMode && (
                            <button onClick={() => deleteMember(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', padding: 8, cursor: 'pointer'}}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      )}`;

if (content.includes(oldIcons)) {
  content = content.replace(oldIcons, newIcons);
}

fs.writeFileSync('src/App.jsx', content);
console.log('Added deleteMode UI.');
