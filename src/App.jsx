import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Users, Plus, Minus, X, Check, Edit2, Save, Trash2 } from 'lucide-react';
import { initialTeams, initialMatches, initialMembers, calculateStandings } from './data';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('soccer_matches');
    return saved ? JSON.parse(saved) : initialMatches;
  });
  const [teams, setTeams] = useState(initialTeams);
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('soccer_members');
    return saved ? JSON.parse(saved) : initialMembers;
  });
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Save to localStorage when matches/members change
  useEffect(() => {
    localStorage.setItem('soccer_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('soccer_members', JSON.stringify(members));
  }, [members]);
  
  // Calculate standings whenever matches change
  const standings = calculateStandings(teams, matches);

  const handleMatchClick = (match) => {
    setSelectedMatch({ 
      ...match,
      goals: match.goals ? [...match.goals] : []
    });
  };

  const closeModal = () => {
    setSelectedMatch(null);
  };

  const addGoal = (teamId) => {
    if (!selectedMatch) return;
    const newGoal = {
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      teamId,
      scorerId: null,
      assistId: null
    };
    const updatedGoals = [...selectedMatch.goals, newGoal];
    const homeScore = updatedGoals.filter(g => g.teamId === selectedMatch.homeId).length;
    const awayScore = updatedGoals.filter(g => g.teamId === selectedMatch.awayId).length;

    setSelectedMatch({
      ...selectedMatch,
      goals: updatedGoals,
      homeScore,
      awayScore
    });
  };

  const removeGoal = (goalId) => {
    if (!selectedMatch) return;
    const updatedGoals = selectedMatch.goals.filter(g => g.id !== goalId);
    const homeScore = updatedGoals.filter(g => g.teamId === selectedMatch.homeId).length;
    const awayScore = updatedGoals.filter(g => g.teamId === selectedMatch.awayId).length;

    setSelectedMatch({
      ...selectedMatch,
      goals: updatedGoals,
      homeScore,
      awayScore
    });
  };

  const updateGoalDetail = (goalId, field, val) => {
    if (!selectedMatch) return;
    const updatedGoals = selectedMatch.goals.map(g => 
      g.id === goalId ? { ...g, [field]: val || null } : g
    );
    setSelectedMatch({
      ...selectedMatch,
      goals: updatedGoals
    });
  };

  const updateMatchTeams = (homeId, awayId) => {
    if (!selectedMatch) return;
    // reset goals if teams change
    setSelectedMatch({
      ...selectedMatch,
      homeId: homeId || null,
      awayId: awayId || null,
      goals: [],
      homeScore: 0,
      awayScore: 0
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
      refereePlayerId: null
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
        <h1>一般ミニサッカー大会@平和の森公園</h1>
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
          <StandingsView 
            standings={standings} 
            matches={matches}
            members={members}
            getTeam={getTeam}
          />
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
          <span>順位・個人</span>
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

              {/* Goal Scoring Panel */}
              <div className="glass-card" style={{padding: '16px', marginBottom: 24, cursor: 'default'}}>
                <h4 style={{marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>得点・アシストの入力</h4>
                
                <div style={{display: 'flex', gap: 16, marginBottom: 16}}>
                  <button className="btn btn-primary" style={{flex: 1, padding: '12px', fontSize: '0.85rem', marginBottom: 0}} onClick={() => addGoal(selectedMatch.homeId)} disabled={!selectedMatch.homeId}>
                    + 左チーム得点
                  </button>
                  <button className="btn btn-primary" style={{flex: 1, padding: '12px', fontSize: '0.85rem', marginBottom: 0}} onClick={() => addGoal(selectedMatch.awayId)} disabled={!selectedMatch.awayId}>
                    + 右チーム得点
                  </button>
                </div>

                {/* Goals list */}
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  {selectedMatch.goals.map((goal, idx) => {
                    const goalTeam = getTeam(goal.teamId);
                    const teamMembers = members.filter(m => m.teamId === goal.teamId);
                    return (
                      <div key={goal.id} style={{display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem'}}>
                        <span style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>{goalTeam?.emoji}</span>
                        <select 
                          value={goal.scorerId || ''} 
                          onChange={e => updateGoalDetail(goal.id, 'scorerId', e.target.value)}
                          className="edit-input"
                          style={{padding: '4px 8px', fontSize: '0.8rem', flex: 1, width: '45%'}}
                        >
                          <option value="">得点者: 未設定</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.number ? `[${m.number}] ` : ''}{m.name}</option>
                          ))}
                        </select>

                        <select 
                          value={goal.assistId || ''} 
                          onChange={e => updateGoalDetail(goal.id, 'assistId', e.target.value)}
                          className="edit-input"
                          style={{padding: '4px 8px', fontSize: '0.8rem', flex: 1, width: '45%'}}
                        >
                          <option value="">アシスト: なし</option>
                          {teamMembers.filter(m => m.id !== goal.scorerId).map(m => (
                            <option key={m.id} value={m.id}>{m.number ? `[${m.number}] ` : ''}{m.name}</option>
                          ))}
                        </select>

                        <button onClick={() => removeGoal(goal.id)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4}}>
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {selectedMatch.goals.length === 0 && (
                    <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.8rem'}}>得点データはありません</p>
                  )}
                </div>
              </div>

              {/* Referee Selection */}
              <div className="glass-card" style={{padding: '16px', marginBottom: 24, cursor: 'default'}}>
                <h4 style={{marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>審判の設定</h4>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
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
  const [stage, setStage] = useState('league');

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
            getPlayer={getPlayer}
            onClick={() => onMatchClick(match)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, homeTeam, awayTeam, refereeTeam, refereePlayer, getPlayer, onClick }) {
  const getStatusText = (status) => {
    switch(status) {
      case 'live': return 'LIVE';
      case 'finished': return '試合終了';
      default: return match.date;
    }
  };

  const getGoalsText = (teamId) => {
    if (!match.goals) return '';
    return match.goals
      .filter(g => g.teamId === teamId && g.scorerId)
      .map(g => {
        const scorer = getPlayer(g.scorerId);
        const assist = g.assistId ? getPlayer(g.assistId) : null;
        return `${scorer?.name}${assist ? `(A:${assist.name})` : ''}`;
      })
      .join(', ');
  };

  const homeGoalsText = getGoalsText(match.homeId);
  const awayGoalsText = getGoalsText(match.awayId);

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

      {/* Scorers display */}
      {(homeGoalsText || awayGoalsText) && (
        <div style={{
          marginTop: 4,
          padding: '6px 8px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6,
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {homeGoalsText && <div>⚽ {homeTeam?.name}: {homeGoalsText}</div>}
          {awayGoalsText && <div>⚽ {awayTeam?.name}: {awayGoalsText}</div>}
        </div>
      )}

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

function StandingsView({ standings, matches, members, getTeam }) {
  const [subTab, setSubTab] = useState('team'); // 'team', 'goals', 'assists'

  // Calculate personal stats
  const getPersonalStats = () => {
    const stats = {};
    matches.forEach(m => {
      if (m.goals) {
        m.goals.forEach(g => {
          if (g.scorerId) {
            if (!stats[g.scorerId]) stats[g.scorerId] = { goals: 0, assists: 0 };
            stats[g.scorerId].goals += 1;
          }
          if (g.assistId) {
            if (!stats[g.assistId]) stats[g.assistId] = { goals: 0, assists: 0 };
            stats[g.assistId].assists += 1;
          }
        });
      }
    });

    return Object.keys(stats).map(playerId => {
      const player = members.find(m => m.id === playerId);
      const team = player ? getTeam(player.teamId) : null;
      return {
        id: playerId,
        name: player ? player.name : '不明',
        number: player ? player.number : '',
        teamName: team ? team.name : '',
        teamEmoji: team ? team.emoji : '',
        goals: stats[playerId].goals,
        assists: stats[playerId].assists
      };
    });
  };

  const personalList = getPersonalStats();
  const goalRankings = [...personalList].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const assistRankings = [...personalList].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists);

  return (
    <div>
      <div className="tabs" style={{marginBottom: 16}}>
        <div className={`tab ${subTab === 'team' ? 'active' : ''}`} onClick={() => setSubTab('team')}>順位表</div>
        <div className={`tab ${subTab === 'goals' ? 'active' : ''}`} onClick={() => setSubTab('goals')}>得点王</div>
        <div className={`tab ${subTab === 'assists' ? 'active' : ''}`} onClick={() => setSubTab('assists')}>アシスト</div>
      </div>

      {subTab === 'team' && (
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
                    {team.emoji} {team.name}
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
      )}

      {subTab === 'goals' && (
        <div className="table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{paddingLeft: '16px'}}>選手</th>
                <th>クラブ</th>
                <th style={{paddingRight: '16px'}}>得点数</th>
              </tr>
            </thead>
            <tbody>
              {goalRankings.map((player, idx) => (
                <tr key={player.id}>
                  <td style={{paddingLeft: '16px', textAlign: 'left'}}>
                    <span style={{color: 'var(--text-secondary)', marginRight: 8, fontSize: '0.8rem'}}>{idx + 1}</span>
                    {player.number ? `[${player.number}] ` : ''}{player.name}
                  </td>
                  <td>{player.teamEmoji} {player.teamName}</td>
                  <td style={{fontWeight: 'bold', color: 'var(--accent-color)', paddingRight: '16px'}}>{player.goals}</td>
                </tr>
              ))}
              {goalRankings.length === 0 && (
                <tr>
                  <td colSpan="3" style={{color: 'var(--text-secondary)', padding: '20px 0'}}>得点データがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'assists' && (
        <div className="table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{paddingLeft: '16px'}}>選手</th>
                <th>クラブ</th>
                <th style={{paddingRight: '16px'}}>アシスト数</th>
              </tr>
            </thead>
            <tbody>
              {assistRankings.map((player, idx) => (
                <tr key={player.id}>
                  <td style={{paddingLeft: '16px', textAlign: 'left'}}>
                    <span style={{color: 'var(--text-secondary)', marginRight: 8, fontSize: '0.8rem'}}>{idx + 1}</span>
                    {player.number ? `[${player.number}] ` : ''}{player.name}
                  </td>
                  <td>{player.teamEmoji} {player.teamName}</td>
                  <td style={{fontWeight: 'bold', color: 'var(--accent-color)', paddingRight: '16px'}}>{player.assists}</td>
                </tr>
              ))}
              {assistRankings.length === 0 && (
                <tr>
                  <td colSpan="3" style={{color: 'var(--text-secondary)', padding: '20px 0'}}>アシストデータがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TeamsView({ teams, members, setMembers }) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id);
  const [editingMember, setEditingMember] = useState(null);
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
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
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
