import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Users, Plus, Minus, X, Check, Edit2, Save, Trash2 } from 'lucide-react';
import { initialTeams, initialMatches, initialMembers, calculateStandings } from './data';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [matches, setMatches] = useState(initialMatches);
  const [teams, setTeams] = useState(initialTeams);
  const [members, setMembers] = useState(initialMembers);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  // Calculate standings whenever matches change
  const standings = calculateStandings(teams, matches);

  const handleMatchClick = (match) => {
    setSelectedMatch({ ...match });
  };

  const closeModal = () => {
    setSelectedMatch(null);
  };

  const updateMatchScore = (homeDelta, awayDelta) => {
    if (!selectedMatch) return;
    const newHomeScore = Math.max(0, selectedMatch.homeScore + homeDelta);
    const newAwayScore = Math.max(0, selectedMatch.awayScore + awayDelta);
    
    setSelectedMatch({
      ...selectedMatch,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
    });
  };

  const updateMatchTeams = (homeId, awayId) => {
    if (!selectedMatch) return;
    setSelectedMatch({
      ...selectedMatch,
      homeId: homeId || null,
      awayId: awayId || null
    });
  };

  const updateMatchReferee = (playerId) => {
    if (!selectedMatch) return;
    setSelectedMatch({
      ...selectedMatch,
      refereePlayerId: playerId || null
    });
  };

  const updateMatchRefereeTeam = (teamId) => {
    if (!selectedMatch) return;
    setSelectedMatch({
      ...selectedMatch,
      refereeTeamId: teamId || null,
      refereePlayerId: null // reset player when team changes
    });
  };

  const saveMatch = (status) => {
    setMatches(matches.map(m => 
      m.id === selectedMatch.id 
        ? { ...selectedMatch, status } 
        : m
    ));
    closeModal();
  };

  const getTeam = (id) => teams.find(t => t.id === id);
  const getPlayer = (id) => members.find(p => p.id === id);

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>Alpha Cup 2026</h1>
        <div className="team-logo" style={{width: 36, height: 36, fontSize: '1.2rem'}}>🏆</div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'schedule' && (
          <ScheduleView 
            matches={matches} 
            getTeam={getTeam} 
            getPlayer={getPlayer}
            onMatchClick={handleMatchClick} 
          />
        )}
        
        {activeTab === 'standings' && (
          <StandingsView standings={standings} />
        )}

        {activeTab === 'teams' && (
          <TeamsView 
            teams={teams}
            members={members}
            setMembers={setMembers}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div 
          className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={24} />
          <span>日程・結果</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          <Trophy size={24} />
          <span>順位表</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={24} />
          <span>チーム</span>
        </div>
      </nav>

      {/* Score & Referee Edit Modal */}
      <div className={`modal-overlay ${selectedMatch ? 'open' : ''}`} onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-drag-handle"></div>
          
          {selectedMatch && (
            <>
              <h2 style={{textAlign: 'center', marginBottom: 24}}>
                {selectedMatch.label || 'リーグ戦'} - 試合管理
              </h2>
              
              <div className="teams-container" style={{marginBottom: 24}}>
                <div className="team home">
                  <div className="team-logo" style={{width: 64, height: 64, fontSize: '2rem'}}>
                    {getTeam(selectedMatch.homeId)?.emoji || '❓'}
                  </div>
                  <div className="team-name">{getTeam(selectedMatch.homeId)?.name || '未定'}</div>
                </div>
                
                <div className="score">
                  <span>{selectedMatch.homeScore}</span>
                  <span className="score-dash">-</span>
                  <span>{selectedMatch.awayScore}</span>
                </div>
                
                <div className="team away">
                  <div className="team-logo" style={{width: 64, height: 64, fontSize: '2rem'}}>
                    {getTeam(selectedMatch.awayId)?.emoji || '❓'}
                  </div>
                  <div className="team-name">{getTeam(selectedMatch.awayId)?.name || '未定'}</div>
                </div>
              </div>

              {/* Tournament Match Team Selector */}
              {selectedMatch.stage !== 'league' && (
                <div className="glass-card" style={{padding: '16px', marginBottom: 24, cursor: 'default'}}>
                  <h4 style={{marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>対戦チームの設定</h4>
                  <div style={{display: 'flex', gap: 16}}>
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
                      <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>ホーム（左）</span>
                      <select 
                        value={selectedMatch.homeId || ''} 
                        onChange={e => updateMatchTeams(e.target.value, selectedMatch.awayId)}
                        className="edit-input"
                        style={{width: '100%'}}
                      >
                        <option value="">未定</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
                      <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>アウェイ（右）</span>
                      <select 
                        value={selectedMatch.awayId || ''} 
                        onChange={e => updateMatchTeams(selectedMatch.homeId, e.target.value)}
                        className="edit-input"
                        style={{width: '100%'}}
                      >
                        <option value="">未定</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Controls */}
              <div style={{display: 'flex', gap: 16, marginBottom: 24}}>
                <div style={{flex: 1}}>
                  <div className="score-control">
                    <button className="score-btn" onClick={() => updateMatchScore(-1, 0)}><Minus size={24} /></button>
                    <div className="score-value">{selectedMatch.homeScore}</div>
                    <button className="score-btn" onClick={() => updateMatchScore(1, 0)}><Plus size={24} /></button>
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <div className="score-control">
                    <button className="score-btn" onClick={() => updateMatchScore(0, -1)}><Minus size={24} /></button>
                    <div className="score-value">{selectedMatch.awayScore}</div>
                    <button className="score-btn" onClick={() => updateMatchScore(0, 1)}><Plus size={24} /></button>
                  </div>
                </div>
              </div>

              {/* Referee Selection */}
              <div className="glass-card" style={{padding: '16px', marginBottom: 24, cursor: 'default'}}>
                <h4 style={{marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>審判の設定</h4>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                  {/* Referee Team Selector */}
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
                    <span style={{fontSize: '0.9rem'}}>担当チーム:</span>
                    <select 
                      value={selectedMatch.refereeTeamId || ''} 
                      onChange={e => updateMatchRefereeTeam(e.target.value)}
                      className="edit-input"
                      style={{flex: 1, maxWidth: '180px'}}
                    >
                      <option value="">設定なし</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Referee Player Selector */}
                  {selectedMatch.refereeTeamId && (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
                      <span style={{fontSize: '0.9rem'}}>主審（個人）:</span>
                      <select 
                        value={selectedMatch.refereePlayerId || ''} 
                        onChange={e => updateMatchReferee(e.target.value)}
                        className="edit-input"
                        style={{flex: 1, maxWidth: '180px'}}
                      >
                        <option value="">未選択</option>
                        {members
                          .filter(m => m.teamId === selectedMatch.refereeTeamId)
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.number ? `[${m.number}] ` : ''}{m.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <button className="btn btn-primary" onClick={() => saveMatch('live')}>
                試合中として保存
              </button>
              <button className="btn btn-secondary" onClick={() => saveMatch('finished')} style={{color: 'var(--accent-color)', borderColor: 'var(--accent-color)'}}>
                <Check size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/>
                試合終了
              </button>
              <button className="btn btn-secondary" onClick={() => saveMatch('scheduled')}>
                予定に戻す (リセット)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleView({ matches, getTeam, getPlayer, onMatchClick }) {
  const [stage, setStage] = useState('league'); // 'league' or 'tournament'

  const displayedMatches = matches.filter(m => 
    stage === 'league' ? m.stage === 'league' : m.stage !== 'league'
  );

  return (
    <div>
      <div className="tabs">
        <div 
          className={`tab ${stage === 'league' ? 'active' : ''}`}
          onClick={() => setStage('league')}
        >
          予選リーグ
        </div>
        <div 
          className={`tab ${stage === 'tournament' ? 'active' : ''}`}
          onClick={() => setStage('tournament')}
        >
          決勝トーナメント
        </div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {displayedMatches.map(match => (
          <MatchCard 
            key={match.id} 
            match={match} 
            homeTeam={getTeam(match.homeId)} 
            awayTeam={getTeam(match.awayId)} 
            refereeTeam={getTeam(match.refereeTeamId)}
            refereePlayer={getPlayer(match.refereePlayerId)}
            onClick={() => onMatchClick(match)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, homeTeam, awayTeam, refereeTeam, refereePlayer, onClick }) {
  const getStatusText = (status) => {
    switch(status) {
      case 'live': return 'LIVE';
      case 'finished': return '試合終了';
      default: return match.date;
    }
  };

  return (
    <div className="glass-card match-item" onClick={onClick}>
      <div className="match-header">
        <span>{match.label || 'リーグ戦'}</span>
        <span className={`match-status ${match.status}`}>{getStatusText(match.status)}</span>
      </div>
      
      <div className="teams-container">
        <div className="team home">
          <div className="team-logo">{homeTeam?.emoji || '❓'}</div>
          <span className="team-name">{homeTeam?.name || '未定'}</span>
        </div>
        
        <div className="score">
          {match.status === 'scheduled' ? (
            <span className="score-dash">-</span>
          ) : (
            <>
              <span>{match.homeScore}</span>
              <span className="score-dash">-</span>
              <span>{match.awayScore}</span>
            </>
          )}
        </div>
        
        <div className="team away">
          <div className="team-logo">{awayTeam?.emoji || '❓'}</div>
          <span className="team-name">{awayTeam?.name || '未定'}</span>
        </div>
      </div>

      {/* Referee Info Badge */}
      <div style={{
        marginTop: 4, 
        paddingTop: 8, 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>審判団: {refereeTeam?.name || '未定'}</span>
        {refereePlayer && (
          <span style={{color: 'var(--accent-color)', fontWeight: '500'}}>
            主審: {refereePlayer.name} {refereePlayer.number ? `[No.${refereePlayer.number}]` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function StandingsView({ standings }) {
  return (
    <div>
      <h2 style={{marginBottom: 16}}>リーグ戦順位表</h2>
      <div className="table-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th>クラブ</th>
              <th>試</th>
              <th>勝</th>
              <th>分</th>
              <th>負</th>
              <th>差</th>
              <th>点</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.id}>
                <td>
                  <span style={{color: 'var(--text-secondary)', marginRight: 8, fontSize: '0.8rem'}}>{index + 1}</span>
                  {team.emoji} <span style={{display: 'none'}}>{team.name}</span>
                </td>
                <td>{team.played}</td>
                <td>{team.won}</td>
                <td>{team.drawn}</td>
                <td>{team.lost}</td>
                <td>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                <td style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamsView({ teams, members, setMembers }) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id);
  const [editingMember, setEditingMember] = useState(null); // id of member being edited
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');

  const teamMembers = members.filter(m => m.teamId === selectedTeam).sort((a, b) => Number(a.number) - Number(b.number));

  const startEdit = (member) => {
    setEditingMember(member.id);
    setEditName(member.name);
    setEditNumber(member.number);
  };

  const saveEdit = (id) => {
    setMembers(members.map(m => m.id === id ? { ...m, name: editName, number: editNumber } : m));
    setEditingMember(null);
  };

  const deleteMember = (id) => {
    if(window.confirm('本当に削除しますか？')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const addNewMember = () => {
    const newId = 'p' + Date.now();
    setMembers([...members, { id: newId, teamId: selectedTeam, name: '新規選手', number: '' }]);
    setEditingMember(newId);
    setEditName('');
    setEditNumber('');
  };

  return (
    <div>
      <div className="tabs" style={{overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', gap: 8, background: 'transparent', padding: 0}}>
        {teams.map(team => (
          <div 
            key={team.id}
            className={`tab ${selectedTeam === team.id ? 'active' : ''}`}
            onClick={() => setSelectedTeam(team.id)}
            style={{flex: '0 0 auto', padding: '8px 16px', background: selectedTeam === team.id ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)'}}
          >
            {team.emoji} {team.name}
          </div>
        ))}
      </div>

      <div className="glass-card" style={{marginTop: 16}}>
        <div style={{display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <h3 style={{margin: 0}}>登録メンバー</h3>
          <button className="btn btn-primary" style={{padding: '8px 16px', width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4}} onClick={addNewMember}>
            <Plus size={16} /> 追加
          </button>
        </div>

        <div className="members-list" style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {teamMembers.length === 0 && <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0'}}>メンバーが登録されていません</p>}
          
          {teamMembers.map(member => (
            <div key={member.id} style={{display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 8}}>
              {editingMember === member.id ? (
                <div style={{display: 'flex', gap: 8, flex: 1, alignItems: 'center'}}>
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
                    style={{flex: 1, width: '100%'}}
                  />
                  <button onClick={() => saveEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', padding: 8, cursor: 'pointer'}}>
                    <Save size={20} />
                  </button>
                </div>
              ) : (
                <div style={{display: 'flex', gap: 16, flex: 1, alignItems: 'center'}}>
                  <div style={{width: 40, color: 'var(--text-secondary)', fontWeight: 'bold'}}>{member.number}</div>
                  <div style={{flex: 1}}>{member.name}</div>
                  <button onClick={() => startEdit(member)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteMember(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', padding: 8, cursor: 'pointer'}}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
