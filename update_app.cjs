const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add BookOpen
content = content.replace(
  "import { Calendar, Trophy, Users, Plus, Minus, X, Check, Edit2, Save, Trash2, Lock, Unlock } from 'lucide-react';",
  "import { Calendar, Trophy, Users, Plus, Minus, X, Check, Edit2, Save, Trash2, Lock, Unlock, BookOpen } from 'lucide-react';"
);

// 2. Remove rule button from Schedule tab
const ruleBtnRegex = /<button\s+onClick=\{\(\) => handlePrint\('rules'\)\}.*?📜 ルール\(PDF\)\s+<\/button>/s;
content = content.replace(ruleBtnRegex, '');

// 3. Add RulesView inside main
content = content.replace(
  /(\s*)\{\s*activeTab === 'teams'.*?<\/TeamsView>\s*\)\s*\}\s*<\/main>/s,
  `$&
        {activeTab === 'rules' && (
          <RulesView handlePrint={handlePrint} />
        )}
      </main>`.replace('$&', `$&`.replace('</main>', '')) // remove </main> from original match, put it after
);
// Wait, the regex trick might be flaky. Let's do string replacement instead.
content = content.replace(
  `        {activeTab === 'teams' && (
          <TeamsView 
            teams={teams}
            members={members}
            setMembers={handleSetMembers}
            isAdmin={isAdmin}
          />
        )}
      </main>`,
  `        {activeTab === 'teams' && (
          <TeamsView 
            teams={teams}
            members={members}
            setMembers={handleSetMembers}
            isAdmin={isAdmin}
          />
        )}
        
        {activeTab === 'rules' && (
          <RulesView handlePrint={handlePrint} />
        )}
      </main>`
);

// 4. Add nav item
content = content.replace(
  `        <div 
          className={\`nav-item \${activeTab === 'teams' ? 'active' : ''}\`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={24} />
          <span>チーム</span>
        </div>
      </nav>`,
  `        <div 
          className={\`nav-item \${activeTab === 'teams' ? 'active' : ''}\`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={24} />
          <span>チーム</span>
        </div>
        <div 
          className={\`nav-item \${activeTab === 'rules' ? 'active' : ''}\`}
          onClick={() => setActiveTab('rules')}
        >
          <BookOpen size={24} />
          <span>ルール</span>
        </div>
      </nav>`
);

// 5. Append RulesView
const rulesViewCode = `
function RulesView({ handlePrint }) {
  return (
    <div className="glass-card" style={{padding: 24, paddingBottom: 64}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <h2 style={{margin: 0}}>大会ルール</h2>
        <button
          onClick={() => handlePrint('rules')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent-color)', color: '#fff',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.opacity = '0.8'; }}
          onMouseLeave={e => { e.target.style.opacity = '1'; }}
        >
          📄 PDFで開く
        </button>
      </div>

      <div style={{fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-primary)'}}>
        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■基本情報</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・形式：8人制(8対8)</li>
          <li>・交代：自由交代制</li>
          <li>・ボール：5号球</li>
          <li>・ルール：通常のサッカーに準拠(オフサイドあり)</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■ルール概要(通常サッカーとの差異)</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・フリーキック時は、壁の人数に関わらず攻撃側は壁から1m離れる(キック時に離れていなければファールとして笛を吹く)</li>
          <li>・フリーキック時の距離は7m</li>
          <li>・キックオフシュートは禁止</li>
          <li>・禁止事項(イエローまたは、レッドカードを提示する)</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>①スライディングでの接触(キーパーを含む)</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>②後ろからの接触</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>③相手が激しく倒れるくらいのショルダーチャージは後ろからでなくてもファールとする</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>④キーパーへの激しい接触</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>⑤暴言、遅延行為</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■試合開始前</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・審判、相手をリスペクトするため、全員と握手してから試合を開始する</li>
          <li>・各チーム1つ試合球を出し、4つで大会を運営する</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■選手交代(流れ)</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・入場選手は四審に交代を宣告</li>
          <li>・退場選手への呼びかけは、審判でなくチームで行う</li>
          <li>・退場選手は近くのタッチラインより退場する（位置は不問）</li>
          <li>・入場選手は交代エリアより入場する</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■選手交代(注意点)</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・交代は試合を止めずに交代する</li>
          <li>・交代者INは交代者OUTがコートから出てからコートへ入ること</li>
          <li>・ゲーム中のキーパーの交代はなし(怪我の場合は除く)</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■審判体制（資格不問）</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・主審 1名</li>
          <li>・副審 2名</li>
          <li>・四審 1名以上</li>
          <li>・ＢＰ 2～3名</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■四審の役割</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・得点、アシスト、警告、退場、試合結果　※交代者のメモは不要</li>
          <li>・交代のOUTとINの管理</li>
          <li>・途中参加者の服装チェック</li>
          <li>・本部側でのボールだし</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■試合終了後</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・代表者は本部にて試合結果をチェック(得点、アシスト、警告、退場)</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■予選で同順位の場合</h3>
        <div style={{paddingLeft: 0, marginBottom: 24}}>
          <div>①勝ち点(勝ち3点、引分1点、負け0点)</div>
          <div>②得失点</div>
          <div>③直接対決の結果</div>
          <div>④ファール数(イエロー：-5、レッド：-10)</div>
          <div>⑤ジャンケン</div>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8}}>※①から順番に判断する</div>
        </div>
      </div>
    </div>
  );
}
`;

content = content.replace('export default App;', rulesViewCode + '\nexport default App;');

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated with RulesView.');
