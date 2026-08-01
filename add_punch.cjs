const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Helper function to inject
const diffFunc = `
function calculateTimeDiff(scheduled, actual) {
  if (!scheduled || !actual) return '';
  const sParts = scheduled.split(':').map(Number);
  const aParts = actual.split(':').map(Number);
  if (sParts.length !== 2 || aParts.length !== 2 || isNaN(sParts[0]) || isNaN(aParts[0])) return '';
  const diff = (aParts[0] * 60 + aParts[1]) - (sParts[0] * 60 + sParts[1]);
  if (diff > 0) return \`(\${diff}分遅れ)\`;
  if (diff < 0) return \`(\${Math.abs(diff)}分前倒し)\`;
  return '(定刻)';
}
`;

// Inject diffFunc before MatchCard
content = content.replace('function MatchCard({', diffFunc + '\nfunction MatchCard({');

// Update MatchCard UI to show actualStartTime
const matchCardHeaderOriginal = `      <div className="match-header">
        <span>{match.label || 'リーグ戦'}</span>
        <span className="match-time" style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{match.date}</span>
      </div>`;

const matchCardHeaderNew = `      <div className="match-header">
        <span>{match.label || 'リーグ戦'}</span>
        <span className="match-time" style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
          {match.date}
          {match.actualStartTime && (
            <span style={{marginLeft: 8, color: 'var(--accent-color)'}}>
              {match.actualStartTime} {calculateTimeDiff(match.date, match.actualStartTime)}
            </span>
          )}
        </span>
      </div>`;

content = content.replace(matchCardHeaderOriginal, matchCardHeaderNew);

// Update Modal UI
const modalEditSectionOriginal = `                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>時間/日程</span>
                    <input 
                      type="text" 
                      value={selectedMatch.date || ''} 
                      onChange={e => setSelectedMatch({ ...selectedMatch, date: e.target.value })}
                      placeholder="例: 13:00"
                      className="edit-input"
                      style={{width: '100%'}}
                    />
                  </div>
                </div>
              </div>`;

const modalEditSectionNew = `                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>時間/日程</span>
                    <input 
                      type="text" 
                      value={selectedMatch.date || ''} 
                      onChange={e => setSelectedMatch({ ...selectedMatch, date: e.target.value })}
                      placeholder="例: 13:00"
                      className="edit-input"
                      style={{width: '100%'}}
                    />
                  </div>
                </div>
                
                <div style={{display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 12}}>
                  <button 
                    onClick={() => {
                      const now = new Date();
                      const hh = String(now.getHours()).padStart(2, '0');
                      const mm = String(now.getMinutes()).padStart(2, '0');
                      setSelectedMatch({...selectedMatch, actualStartTime: \`\${hh}:\${mm}\`});
                    }}
                    className="btn btn-secondary" 
                    style={{padding: '6px 12px', fontSize: '0.8rem'}}
                  >
                    ⏱ 開始時間を打刻
                  </button>
                  {selectedMatch.actualStartTime && (
                    <>
                      <span style={{fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 'bold'}}>
                        打刻: {selectedMatch.actualStartTime} {
                          selectedMatch.date ? (
                            (() => {
                              const sParts = selectedMatch.date.split(':').map(Number);
                              const aParts = selectedMatch.actualStartTime.split(':').map(Number);
                              if (sParts.length !== 2 || aParts.length !== 2 || isNaN(sParts[0]) || isNaN(aParts[0])) return '';
                              const diff = (aParts[0] * 60 + aParts[1]) - (sParts[0] * 60 + sParts[1]);
                              if (diff > 0) return \`(\${diff}分遅れ)\`;
                              if (diff < 0) return \`(\${Math.abs(diff)}分前倒し)\`;
                              return '(定刻)';
                            })()
                          ) : ''
                        }
                      </span>
                      <button 
                        onClick={() => setSelectedMatch({...selectedMatch, actualStartTime: null})}
                        style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}}
                      >
                        取消
                      </button>
                    </>
                  )}
                </div>
              </div>`;

content = content.replace(modalEditSectionOriginal, modalEditSectionNew);

fs.writeFileSync('src/App.jsx', content);
console.log('Added start time punch feature.');
