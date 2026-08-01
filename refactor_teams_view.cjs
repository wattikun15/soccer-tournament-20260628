const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update sorting logic to put new members at the top
const oldSort = `const teamMembers = members.filter(m => m.teamId === selectedTeam).sort((a, b) => Number(a.number) - Number(b.number));`;
const newSort = `const teamMembers = members.filter(m => m.teamId === selectedTeam).sort((a, b) => {
    if (a.id === editingMember && a.name === '新規選手') return -1;
    if (b.id === editingMember && b.name === '新規選手') return 1;
    return Number(a.number) - Number(b.number);
  });`;

if (content.includes(oldSort)) {
  content = content.replace(oldSort, newSort);
}

// 2. Update Header buttons
const oldHeader = `<div style={{display: 'flex', gap: 8}}>
            {isAdmin && !checkMode && !deleteMode && (
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
                  background: deleteMode ? 'transparent' : 'rgba(255,255,255,0.1)',
                  border: deleteMode ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  color: deleteMode ? 'var(--text-secondary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                {deleteMode ? '❌ キャンセル' : <><Trash2 size={16} /> 削除</>}
              </button>
            )}
            {isAdmin && !deleteMode && (`;

const newHeader = `<div style={{display: 'flex', gap: 8}}>
            {!editingMember && isAdmin && !checkMode && !deleteMode && (
              <button className="btn btn-primary" style={{padding: '8px 16px', width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4}} onClick={addNewMember}>
                <Plus size={16} /> 追加
              </button>
            )}
            {!editingMember && isAdmin && !checkMode && (
              <button
                onClick={() => { setDeleteMode(!deleteMode); setEditingMember(null); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  background: deleteMode ? 'transparent' : 'rgba(255,255,255,0.1)',
                  border: deleteMode ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  color: deleteMode ? 'var(--text-secondary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                {deleteMode ? '❌ キャンセル' : <><Trash2 size={16} /> 削除</>}
              </button>
            )}
            {!editingMember && isAdmin && !deleteMode && (`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
}

// 3. Add Save/Cancel to header
const oldHeaderEnd = `</button>
              </>
            )}
          </div>`;

const newHeaderEnd = `</button>
              </>
            )}
            {editingMember && (
              <>
                <button
                  onClick={() => cancelEdit(editingMember)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <X size={16} /> キャンセル
                </button>
                <button
                  onClick={() => saveEdit(editingMember)}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 14px',
                    width: 'auto',
                    marginBottom: 0,
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <Save size={16} /> 登録
                </button>
              </>
            )}
          </div>`;

if (content.includes(oldHeaderEnd)) {
  content = content.replace(oldHeaderEnd, newHeaderEnd);
}

// 4. Remove row-level Save/Cancel
const oldRowButtons = `<div style={{marginLeft: 'auto', display: 'flex', gap: 4}}>
                      <button onClick={() => cancelEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                        <X size={20} />
                      </button>
                      <button onClick={() => saveEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', padding: 8, cursor: 'pointer'}}>
                        <Save size={20} />
                      </button>
                    </div>`;

if (content.includes(oldRowButtons)) {
  content = content.replace(oldRowButtons, '');
}

// 5. Hide Edit2 icons when editingMember is set
const oldEditIcon = `{!deleteMode && (
                            <button onClick={() => startEdit(member)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                              <Edit2 size={18} />
                            </button>
                          )}`;
const newEditIcon = `{!deleteMode && !editingMember && (
                            <button onClick={() => startEdit(member)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                              <Edit2 size={18} />
                            </button>
                          )}`;

if (content.includes(oldEditIcon)) {
  content = content.replace(oldEditIcon, newEditIcon);
}

fs.writeFileSync('src/App.jsx', content);
console.log('Refactored TeamsView logic.');
