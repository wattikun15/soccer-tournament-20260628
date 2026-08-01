const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update calculateTimeDiff
const oldDiffFunc = `function calculateTimeDiff(scheduled, actual) {
  if (!scheduled || !actual) return '';
  const sParts = scheduled.split(':').map(Number);
  const aParts = actual.split(':').map(Number);
  if (sParts.length !== 2 || aParts.length !== 2 || isNaN(sParts[0]) || isNaN(aParts[0])) return '';
  const diff = (aParts[0] * 60 + aParts[1]) - (sParts[0] * 60 + sParts[1]);
  if (diff > 0) return \`(\${diff}分遅れ)\`;
  if (diff < 0) return \`(\${Math.abs(diff)}分前倒し)\`;
  return '(定刻)';
}`;

const newDiffFunc = `function calculateTimeDiff(scheduled, actual) {
  if (!scheduled || !actual) return null;
  const sParts = scheduled.split(':').map(Number);
  const aParts = actual.split(':').map(Number);
  if (sParts.length !== 2 || aParts.length !== 2 || isNaN(sParts[0]) || isNaN(aParts[0])) return null;
  const diff = (aParts[0] * 60 + aParts[1]) - (sParts[0] * 60 + sParts[1]);
  if (diff > 0) return { text: \`(+\${diff}分)\`, color: '#f44336' };
  if (diff < 0) return { text: \`(\${diff}分)\`, color: '#4caf50' };
  return { text: '(±0)', color: 'var(--text-secondary)' };
}`;

content = content.replace(oldDiffFunc, newDiffFunc);

// 2. Update MatchCard Header
const oldMatchCardHeader = `      <div className="match-header">
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

const newMatchCardHeader = `      <div className="match-header">
        <span>{match.label || 'リーグ戦'}</span>
        <span className="match-time" style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
          {match.date}
          {match.actualStartTime && (() => {
            const diffInfo = calculateTimeDiff(match.date, match.actualStartTime);
            return (
              <span style={{marginLeft: 8, color: 'var(--text-primary)'}}>
                {match.actualStartTime}
                {diffInfo && <span style={{marginLeft: 4, color: diffInfo.color}}>{diffInfo.text}</span>}
              </span>
            );
          })()}
        </span>
      </div>`;

content = content.replace(oldMatchCardHeader, newMatchCardHeader);


// 3. Update Modal Button and Layout
// We'll replace a larger chunk from the button to the end of the div
const oldModalBlock = `                  <button 
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
                      <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 'bold'}}>
                        打刻: 
                        <input
                          type="time"
                          value={selectedMatch.actualStartTime || ''}
                          onChange={e => setSelectedMatch({ ...selectedMatch, actualStartTime: e.target.value })}
                          style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                            padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem', outline: 'none', width: '80px'
                          }}
                        />
                        {
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
                      </div>
                      <button 
                        onClick={() => setSelectedMatch({...selectedMatch, actualStartTime: null})}
                        style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}}
                      >
                        取消
                      </button>
                    </>
                  )}`;

const newModalBlock = `                  <button 
                    onClick={() => {
                      const now = new Date();
                      const hh = String(now.getHours()).padStart(2, '0');
                      const mm = String(now.getMinutes()).padStart(2, '0');
                      setSelectedMatch({...selectedMatch, actualStartTime: \`\${hh}:\${mm}\`});
                    }}
                    className="btn btn-secondary" 
                    style={{padding: '6px 12px', fontSize: '0.8rem'}}
                  >
                    ⏱ 開始を打刻
                  </button>
                  {selectedMatch.actualStartTime && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem'}}>
                      <input
                        type="time"
                        value={selectedMatch.actualStartTime || ''}
                        onChange={e => setSelectedMatch({ ...selectedMatch, actualStartTime: e.target.value })}
                        style={{
                          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                          padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem', outline: 'none', width: '80px'
                        }}
                      />
                      {selectedMatch.date ? (() => {
                        const diffInfo = calculateTimeDiff(selectedMatch.date, selectedMatch.actualStartTime);
                        if (!diffInfo) return null;
                        return <span style={{color: diffInfo.color, fontWeight: 'bold'}}>{diffInfo.text}</span>;
                      })() : null}
                      <button 
                        onClick={() => setSelectedMatch({...selectedMatch, actualStartTime: null})}
                        style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', marginLeft: 4}}
                      >
                        取消
                      </button>
                    </div>
                  )}`;

content = content.replace(oldModalBlock, newModalBlock);

fs.writeFileSync('src/App.jsx', content);
console.log('Compacted punch feature.');
