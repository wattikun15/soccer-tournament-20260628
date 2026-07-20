import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Users, Plus, Minus, X, Check, Edit2, Save, Trash2, Lock, Unlock } from 'lucide-react';
import { initialTeams, initialMatches, initialMembers, calculateStandings, initialTimetable } from './data';
import './index.css';

// Firebase Realtime Database URL
const FIREBASE_BASE_URL = 'https://nakanofa-tournament-2026-default-rtdb.asia-southeast1.firebasedatabase.app/nakanofa_20260720';

// 管理者PIN（4桁）
const ADMIN_PIN = '1234';

function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [matches, setMatches] = useState(initialMatches);
  const [teams, setTeams] = useState(initialTeams);
  const [members, setMembers] = useState(initialMembers);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [printMode, setPrintMode] = useState('blank');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Helper functions to save data to cloud
  const saveMatchesToCloud = async (updatedMatches) => {
    try {
      const res = await fetch(`${FIREBASE_BASE_URL}/matches.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMatches)
      });
      if (!res.ok) console.error('Failed to save matches:', res.statusText);
    } catch (err) {
      console.error('Failed to save matches to cloud:', err);
    }
  };

  const saveMembersToCloud = async (updatedMembers) => {
    try {
      const res = await fetch(`${FIREBASE_BASE_URL}/members.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMembers)
      });
      if (!res.ok) console.error('Failed to save members:', res.statusText);
    } catch (err) {
      console.error('Failed to save members to cloud:', err);
    }
  };

  // 1. Fetch data from Firebase (single source of truth)
  useEffect(() => {
    const initFromCloud = async () => {
      try {
        // Clear any leftover old localStorage keys (cleanup)
        localStorage.removeItem('soccer_matches');
        localStorage.removeItem('soccer_matches_v2');
        localStorage.removeItem('soccer_members');
        localStorage.removeItem('soccer_members_v2');

        // Fetch from Firebase
        const [resMatches, resMembers] = await Promise.all([
          fetch(`${FIREBASE_BASE_URL}/matches.json`),
          fetch(`${FIREBASE_BASE_URL}/members.json`)
        ]);

        let finalMatches = initialMatches;
        let finalMembers = initialMembers;

        if (resMatches.ok) {
          const cloudMatches = await resMatches.json();
          if (Array.isArray(cloudMatches) && cloudMatches.length > 0) {
            finalMatches = cloudMatches;
          } else {
            await saveMatchesToCloud(initialMatches);
          }
        } else {
          await saveMatchesToCloud(initialMatches);
        }

        if (resMembers.ok) {
          const cloudMembers = await resMembers.json();
          if (Array.isArray(cloudMembers) && cloudMembers.length > 0) {
            finalMembers = cloudMembers;
          } else {
            await saveMembersToCloud(initialMembers);
          }
        } else {
          await saveMembersToCloud(initialMembers);
        }

        setMatches(finalMatches);
        setMembers(finalMembers);
      } catch (err) {
        console.error('Failed to load from Firebase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initFromCloud();
  }, []);

  // 2. Poll the database every 10 seconds to get real-time sync
  useEffect(() => {
    const interval = setInterval(async () => {
      // Don't poll if still loading initial sync
      if (isLoading) return;

      try {
        const [resMatches, resMembers] = await Promise.all([
          fetch(`${FIREBASE_BASE_URL}/matches.json`),
          fetch(`${FIREBASE_BASE_URL}/members.json`)
        ]);

        if (resMatches.ok) {
          const cloudMatches = await resMatches.json();
          if (Array.isArray(cloudMatches) && cloudMatches.length > 0) {
            setMatches(cloudMatches);
          }
        }

        if (resMembers.ok) {
          const cloudMembers = await resMembers.json();
          if (Array.isArray(cloudMembers) && cloudMembers.length > 0) {
            setMembers(cloudMembers);
          }
        }
      } catch (err) {
        console.error('Failed to sync data from cloud:', err);
      }
    }, 10000); // 10 seconds polling

    return () => clearInterval(interval);
  }, [isLoading]);

  // Calculate standings whenever matches change
  const standings = calculateStandings(teams, matches);

  const handleMatchClick = (match) => {
    if (!isAdmin) return;
    setSelectedMatch({ 
      ...match,
      goals: match.goals ? [...match.goals] : []
    });
  };

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    }
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
      assistId: null,
      type: 'normal'
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

  const saveMatch = async (status) => {
    const updated = matches.map(m => 
      m.id === selectedMatch.id 
        ? { ...selectedMatch, status } 
        : m
    );
    setMatches(updated);
    await saveMatchesToCloud(updated);
    closeModal();
  };

  const handleSetMembers = async (updater) => {
    let updatedMembers;
    if (typeof updater === 'function') {
      updatedMembers = updater(members);
    } else {
      updatedMembers = updater;
    }
    setMembers(updatedMembers);
    await saveMembersToCloud(updatedMembers);
  };

  const getTeam = (id) => teams.find(t => t.id === id);
  const getPlayer = (id) => members.find(p => p.id === id);

  if (isLoading) {
    return (
      <div className="container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <div style={{color: 'var(--text-secondary)', fontSize: '1rem'}}>
          クラウドデータベース接続中...
        </div>
      </div>
    );
  }

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header no-print">
        <div>
          <h1>一般ミニサッカー大会@平和の森公園</h1>
          <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}>
              <Users size={14} /> 参加人数合計: <span style={{color: '#4caf50', fontWeight: 'bold'}}>{members.filter(m => m.checked).length}</span>名
            </span>
            <span style={{fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 12}}>
              中野区(在住・在勤): <span style={{color: '#fff', fontWeight: 'bold'}}>{members.filter(m => m.checked && (m.isNakano || m.isResident || m.isWorker)).length}</span>名
            </span>
          </div>
        </div>
        <button
          onClick={handleAdminToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12, border: 'none',
            background: isAdmin ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.08)',
            color: isAdmin ? '#4caf50' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
            transition: 'all 0.2s', flexShrink: 0
          }}
        >
          {isAdmin ? <><Unlock size={16} /> 管理者</> : <><Lock size={16} /> 🔒</>}
        </button>
      </header>

      {/* PIN入力モーダル */}
      {showPinModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}}
          onClick={() => setShowPinModal(false)}
        >
          <div style={{background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderRadius: 16, padding: 32, width: 320, border: '1px solid var(--glass-border)'}}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{textAlign: 'center', marginBottom: 20}}>🔐 管理者PIN入力</h3>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={e => { setPinInput(e.target.value.replace(/[^0-9]/g, '')); setPinError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handlePinSubmit(); }}
              placeholder="4桁のPINを入力"
              autoFocus
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                border: `2px solid ${pinError ? 'var(--danger)' : 'rgba(255,255,255,0.2)'}`,
                background: 'rgba(0,0,0,0.3)', color: '#fff',
                fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5em',
                outline: 'none'
              }}
            />
            {pinError && <p style={{color: 'var(--danger)', textAlign: 'center', marginTop: 8, fontSize: '0.85rem'}}>PINが正しくありません</p>}
            <button
              onClick={handlePinSubmit}
              className="btn btn-primary"
              style={{width: '100%', marginTop: 16, padding: 14}}
            >
              ロック解除
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="no-print">
        {activeTab === 'schedule' && (
          <>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 12}}>
              <button
                onClick={() => handlePrint('rules')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--accent-color)'; e.target.style.color = '#fff'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                📜 ルール(PDF)
              </button>
              <button
                onClick={() => handlePrint('blank')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--accent-color)'; e.target.style.color = '#fff'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                🖨️ 記録用紙(PDF)
              </button>
              <button
                onClick={() => handlePrint('result')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: 'var(--accent-color)', color: '#fff',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.opacity = '0.8'; }}
                onMouseLeave={e => { e.target.style.opacity = '1'; }}
              >
                📊 試合結果(PDF)
              </button>
            </div>
            <ScheduleView 
              matches={matches} 
              getTeam={getTeam} 
              getPlayer={getPlayer}
              onMatchClick={handleMatchClick}
              isAdmin={isAdmin}
            />
          </>
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
            setMembers={handleSetMembers}
            isAdmin={isAdmin}
          />
        )}
      </main>

      {/* Print-only Scorecard */}
      <PrintScorecard matches={matches} getTeam={getTeam} getPlayer={getPlayer} standings={standings} printMode={printMode} />

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

              {/* Match Label & Date Selector */}
              <div className="glass-card" style={{padding: '16px', marginBottom: 24, cursor: 'default'}}>
                <h4 style={{marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>試合情報の編集</h4>
                <div style={{display: 'flex', gap: 16}}>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>試合名 (ラベル)</span>
                    <input 
                      type="text" 
                      value={selectedMatch.label || ''} 
                      onChange={e => setSelectedMatch({ ...selectedMatch, label: e.target.value })}
                      placeholder="例: 第1試合 / 予選A"
                      className="edit-input"
                      style={{width: '100%'}}
                    />
                  </div>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4}}>
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
                          value={goal.type || 'normal'} 
                          onChange={e => updateGoalDetail(goal.id, 'type', e.target.value)}
                          className="edit-input"
                          style={{padding: '4px 6px', fontSize: '0.8rem', width: '56px'}}
                        >
                          <option value="normal">流れ</option>
                          <option value="pk">PK</option>
                          <option value="fk">FK</option>
                        </select>

                        <select 
                          value={goal.scorerId || ''} 
                          onChange={e => updateGoalDetail(goal.id, 'scorerId', e.target.value)}
                          className="edit-input"
                          style={{padding: '4px 6px', fontSize: '0.8rem', flex: 1}}
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
                          style={{padding: '4px 6px', fontSize: '0.8rem', flex: 1}}
                        >
                          <option value="">アシスト: なし</option>
                          {teamMembers.filter(m => m.id !== goal.scorerId).map(m => (
                            <option key={m.id} value={m.id}>{m.number ? `[${m.number}] ` : ''}{m.name}</option>
                          ))}
                        </select>

                        <button onClick={() => removeGoal(goal.id)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2}}>
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
                予定に戻す
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Print Scorecard Component =====
function PrintScorecard({ matches, getTeam, getPlayer, standings, printMode }) {
  const leagueMatches = matches.filter(m => m.stage === 'league');
  const knockoutMatches = matches.filter(m => m.stage !== 'league');
  const teams = initialTeams.filter(t => leagueMatches.some(m => m.homeId === t.id || m.awayId === t.id));

  const getMatrixResult = (team1Id, team2Id) => {
    if (team1Id === team2Id) return '―';
    const match = leagueMatches.find(m => 
      (m.homeId === team1Id && m.awayId === team2Id) || 
      (m.homeId === team2Id && m.awayId === team1Id)
    );
    if (!match || match.status !== 'finished') return '';
    const isHome = match.homeId === team1Id;
    const t1Score = isHome ? match.homeScore : match.awayScore;
    const t2Score = isHome ? match.awayScore : match.homeScore;
    if (t1Score > t2Score) return '○';
    if (t1Score < t2Score) return '×';
    return '△';
  };

  const getTeamStats = (teamId) => {
    return standings.find(s => s.id === teamId) || {
      played: 0, points: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0
    };
  };

  const getTeamRank = (teamId) => {
    const idx = standings.findIndex(s => s.id === teamId);
    if (idx === -1) return '';
    const stats = standings[idx];
    if (stats.played === 0) return '';
    return idx + 1;
  };

  const renderMatchCard = (match) => {
    const home = getTeam(match.homeId);
    const away = getTeam(match.awayId);
    const referee = getTeam(match.refereeTeamId);
    
    const formatPlayer = (pId) => {
      if (!pId) return '';
      const p = getPlayer(pId);
      return p ? `${p.name}(#${p.number})` : '';
    };

    const renderAllGoals = () => {
      if (printMode === 'blank' || !match.goals || match.goals.length === 0) return null;
      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5mm', fontSize: '9pt', justifyContent: 'center', height: '100%', paddingLeft: '4mm'}}>
          {match.goals.map((g, idx) => {
            const team = getTeam(g.teamId);
            const teamName = team ? `[${team.name}] ` : '';
            const scorerStr = g.scorerId ? formatPlayer(g.scorerId) : '未入力';
            const assistStr = g.assistId ? ` [A:${formatPlayer(g.assistId)}]` : '';
            const typeStr = g.type === 'pk' ? ' (PK)' : g.type === 'fk' ? ' (FK)' : '';
            return <div key={g.id}>{idx + 1}. {teamName}{scorerStr}{typeStr}{assistStr}</div>;
          })}
        </div>
      );
    };

    const isFinished = printMode === 'result' && match.status === 'finished';
    const hasGoals = match.goals && match.goals.length > 0;
    return (
      <div key={match.id} className="print-match">
        <div className="print-match-header">
          <span className="print-match-label">{match.label}</span>
          <span className="print-match-time">{match.date}〜</span>
        </div>
        <div className="print-teams-row">
          {home ? <span className="print-team-name">{home.name}</span> : <span className="print-team-name" style={{borderBottom:'1pt solid #000',minWidth:'25mm'}}>&nbsp;</span>}
          <div className="print-score-box">
            <div className="print-score-cell">{isFinished ? match.homeScore : ''}</div>
            <span>−</span>
            <div className="print-score-cell">{isFinished ? match.awayScore : ''}</div>
          </div>
          {away ? <span className="print-team-name">{away.name}</span> : <span className="print-team-name" style={{borderBottom:'1pt solid #000',minWidth:'25mm'}}>&nbsp;</span>}
        </div>
        <table className="print-detail-table">
          <tbody>
            <tr>
              <th rowSpan={printMode === 'blank' ? 9 : (hasGoals ? match.goals.length + 1 : 2)} style={{verticalAlign: 'middle', textAlign: 'center'}}>得点<br/><span style={{fontSize:'6pt',fontWeight:'normal'}}>（ｱｼｽﾄ）</span></th>
              <td style={{padding: '0.5mm 1mm', fontSize: '7pt', fontWeight: 'bold', background: '#f0f0f0', textAlign: 'center', width: '18mm', height: '5mm'}}>チーム</td>
              <td style={{padding: '0.5mm 1mm', fontSize: '7pt', fontWeight: 'bold', background: '#f0f0f0', textAlign: 'center'}}>得点者</td>
              <td style={{padding: '0.5mm 1mm', fontSize: '7pt', fontWeight: 'bold', background: '#f0f0f0', textAlign: 'center'}}>アシスト</td>
            </tr>
            {printMode === 'blank' ? (
              [1,2,3,4,5,6,7,8].map(i => (
                <tr key={i}>
                  <td style={{height: '7mm', width: '18mm'}}></td>
                  <td style={{height: '7mm'}}></td>
                  <td style={{height: '7mm'}}></td>
                </tr>
              ))
            ) : (
              hasGoals ? match.goals.map((g, idx) => {
                const team = getTeam(g.teamId);
                const scorerStr = g.scorerId ? formatPlayer(g.scorerId) : '';
                const assistStr = g.assistId ? formatPlayer(g.assistId) : '';
                return (
                  <tr key={g.id}>
                    <td style={{height: '6mm', fontSize: '8pt', textAlign: 'center'}}>{team?.name || ''}</td>
                    <td style={{height: '6mm', fontSize: '8pt'}}>{scorerStr}</td>
                    <td style={{height: '6mm', fontSize: '8pt'}}>{assistStr}</td>
                  </tr>
                );
              }) : (
                <tr><td style={{height: '7mm'}}></td><td style={{height: '7mm'}}></td><td style={{height: '7mm'}}></td></tr>
              )
            )}
            <tr>
              <th>主審</th>
              <td colSpan="3" className="print-ref-cell">
                {match.refereePlayerId ? formatPlayer(match.refereePlayerId) : (referee ? `${referee.name}：` : '')}
              </td>
            </tr>
            <tr>
              <th>備考</th>
              <td colSpan="3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderFinalRanking = () => {
    if (printMode !== 'result') return null;
    
    const finalMatch = knockoutMatches.find(m => m.stage === 'final');
    const thirdMatch = knockoutMatches.find(m => m.stage === 'third_place');
    
    let first = '', second = '', third = '', fourth = '';
    
    if (finalMatch && finalMatch.status === 'finished') {
      if (finalMatch.homeScore > finalMatch.awayScore) {
        first = getTeam(finalMatch.homeId)?.name || '';
        second = getTeam(finalMatch.awayId)?.name || '';
      } else if (finalMatch.homeScore < finalMatch.awayScore) {
        first = getTeam(finalMatch.awayId)?.name || '';
        second = getTeam(finalMatch.homeId)?.name || '';
      } else {
        // PK logic could be added if needed, fallback to tie
        first = getTeam(finalMatch.homeId)?.name || '';
        second = getTeam(finalMatch.awayId)?.name || '';
      }
    }
    
    if (thirdMatch && thirdMatch.status === 'finished') {
      if (thirdMatch.homeScore > thirdMatch.awayScore) {
        third = getTeam(thirdMatch.homeId)?.name || '';
        fourth = getTeam(thirdMatch.awayId)?.name || '';
      } else if (thirdMatch.homeScore < thirdMatch.awayScore) {
        third = getTeam(thirdMatch.awayId)?.name || '';
        fourth = getTeam(thirdMatch.homeId)?.name || '';
      } else {
        third = getTeam(thirdMatch.homeId)?.name || '';
        fourth = getTeam(thirdMatch.awayId)?.name || '';
      }
    }

    if (!first && !second && !third && !fourth) return null;

    return (
      <div style={{marginTop: '10mm', padding: '4mm', border: '1pt solid #333', borderRadius: '4px', textAlign: 'center'}}>
        <h2 style={{margin: '0 0 3mm 0', fontSize: '1rem'}}>🏆 最終順位 🏆</h2>
        <div style={{display: 'flex', justifyContent: 'space-around', fontSize: '1rem', fontWeight: 'bold'}}>
          <div>優勝: <span style={{fontSize: '1.2rem', color: '#b8860b'}}>{first || '---'}</span></div>
          <div>準優勝: <span style={{fontSize: '1.1rem'}}>{second || '---'}</span></div>
          <div>第3位: <span style={{fontSize: '1rem'}}>{third || '---'}</span></div>
          <div>第4位: <span style={{fontSize: '0.9rem'}}>{fourth || '---'}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="print-only print-scorecard">
      {printMode !== 'rules' && (
        <>
          {/* Page 1: League matches 1-4 */}
          <div className="print-page">
        <div className="print-title">
          <h1>予選リーグ {printMode === 'result' ? '試合結果' : '記録用紙'}</h1>
          <p>開催日：2026年7月20日（日）　会場：平和の森公園</p>
        </div>
        <div className="print-grid">
          {leagueMatches.slice(0, 4).map(renderMatchCard)}
        </div>
      </div>

      {/* Page 2: League matches 5-6 + Stats */}
      <div className="print-page" style={{pageBreakBefore: 'always'}}>
        <div className="print-title">
          <h1>予選リーグ {printMode === 'result' ? '試合結果' : '記録用紙'}（続き）/ 星取表・集計表 {printMode === 'result' ? '(結果)' : ''}</h1>
          <p>開催日：2026年7月20日（日）　会場：平和の森公園</p>
        </div>
        <div className="print-grid">
          {leagueMatches.slice(4).map(renderMatchCard)}
        </div>

        {/* Win/Loss matrix */}
        <div style={{marginTop: '4mm'}}>
          <table className="print-stats-table">
            <thead>
              <tr>
                <th>対戦成績</th>
                {teams.map(t => <th key={t.id}>{t.name}</th>)}
                <th>勝点</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const stats = printMode === 'result' ? getTeamStats(t.id) : {played: 0, points: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0};
                return (
                  <tr key={t.id}>
                    <td style={{fontWeight: 700, textAlign: 'left'}}>{t.name}</td>
                    {teams.map(t2 => (
                      <td key={t2.id} style={t.id === t2.id ? {background: '#d0d0d0'} : {}}>
                        {printMode === 'result' ? getMatrixResult(t.id, t2.id) : (t.id === t2.id ? '―' : '')}
                      </td>
                    ))}
                    <td>{stats.played > 0 ? stats.points : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{fontSize: '7pt', marginTop: '1mm', color: '#666'}}>○勝ち　△引分　×負け　※スコアも記入可</div>
        </div>
        {/* Stats summary table */}
        <div style={{marginTop: '3mm'}}>
          <table className="print-stats-table">
            <thead>
              <tr>
                <th>チーム</th>
                <th>勝</th><th>分</th><th>負</th>
                <th>得点</th><th>失点</th><th>得失差</th>
                <th>赤</th><th>黄</th><th>ファール</th>
                <th>順位</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const stats = printMode === 'result' ? getTeamStats(t.id) : {played: 0, points: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0};
                return (
                  <tr key={t.id}>
                    <td style={{fontWeight: 700, textAlign: 'left'}}>{t.name}</td>
                    <td>{stats.played > 0 ? stats.won : ''}</td>
                    <td>{stats.played > 0 ? stats.drawn : ''}</td>
                    <td>{stats.played > 0 ? stats.lost : ''}</td>
                    <td>{stats.played > 0 ? stats.goalsFor : ''}</td>
                    <td>{stats.played > 0 ? stats.goalsAgainst : ''}</td>
                    <td>{stats.played > 0 ? (stats.goalsFor - stats.goalsAgainst > 0 ? '+' : '') + (stats.goalsFor - stats.goalsAgainst) : ''}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>{printMode === 'result' ? getTeamRank(t.id) : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page 3: Knockout */}
      <div className="print-page" style={{pageBreakBefore: 'always'}}>
        <div className="print-title">
          <h1>決勝トーナメント {printMode === 'result' ? '試合結果' : '記録用紙'}</h1>
          <p>開催日：2026年7月20日（日）　会場：平和の森公園</p>
        </div>
        <div className="print-grid">
          {knockoutMatches.map(renderMatchCard)}
        </div>
        
        {renderFinalRanking()}
      </div>
        </>
      )}

      {printMode === 'rules' && (
        <div className="print-page" style={{padding: '10mm'}}>
          {/* Page 4: Rules */}
          <div className="print-title" style={{marginBottom: '8mm'}}>
            <h1>一般ミニサッカー大会のルール</h1>
            <p>※2026年7月20日更新</p>
          </div>
          <div style={{fontSize: '10pt', lineHeight: '1.6'}}>
            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■基本情報</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・形式：8人制(8対8)</li>
              <li>・交代：自由交代制</li>
              <li>・ボール：5号球</li>
              <li>・ルール：通常のサッカーに準拠(オフサイドあり)</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■ルール概要(通常サッカーとの差異)</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・フリーキック時は、壁の人数に関わらず攻撃側は壁から1m離れる(キック時に離れていなければファールとして笛を吹く)</li>
              <li>・フリーキック時の距離は7m</li>
              <li>・キックオフシュートは禁止</li>
              <li>・禁止事項(イエローまたは、レッドカードを提示する)</li>
              <li style={{paddingLeft: '12px'}}>①スライディングでの接触(キーパーを含む)</li>
              <li style={{paddingLeft: '12px'}}>②後ろからの接触</li>
              <li style={{paddingLeft: '12px'}}>③相手が激しく倒れるくらいのショルダーチャージは後ろからでなくてもファールとする</li>
              <li style={{paddingLeft: '12px'}}>④キーパーへの激しい接触</li>
              <li style={{paddingLeft: '12px'}}>⑤暴言、遅延行為</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■試合開始前</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・審判、相手をリスペクトするため、全員と握手してから試合を開始する</li>
              <li>・各チーム1つ試合球を出し、4つで大会を運営する</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■選手交代(流れ)</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・入場選手は四審に交代を宣告</li>
              <li>・退場選手への呼びかけは、審判でなくチームで行う</li>
              <li>・退場選手は近くのタッチラインより退場する（位置は不問）</li>
              <li>・入場選手は交代エリアより入場する</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■選手交代(注意点)</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・交代は試合を止めずに交代する</li>
              <li>・交代者INは交代者OUTがコートから出てからコートへ入ること</li>
              <li>・ゲーム中のキーパーの交代はなし(怪我の場合は除く)</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■審判体制（資格不問）</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・主審 1名</li>
              <li>・副審 2名</li>
              <li>・四審 1名以上</li>
              <li>・ＢＰ 2～3名</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■四審の役割</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・得点、アシスト、警告、退場、試合結果　※交代者のメモは不要</li>
              <li>・交代のOUTとINの管理</li>
              <li>・途中参加者の服装チェック</li>
              <li>・本部側でのボールだし</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■試合終了後</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・代表者は本部にて試合結果をチェック(得点、アシスト、警告、退場)</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■予選で同順位の場合</h2>
            <div style={{paddingLeft: '8px', marginBottom: '12px'}}>
              <div>①勝ち点(勝ち3点、引分1点、負け0点)</div>
              <div>②得失点</div>
              <div>③直接対決の結果</div>
              <div>④ファール数(イエロー：-5、レッド：-10)</div>
              <div>⑤ジャンケン</div>
              <div style={{color: '#666', fontSize: '9pt', marginTop: '4px'}}>※①から順番に判断する</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ScheduleView({ matches, getTeam, getPlayer, onMatchClick, isAdmin }) {
  const [stage, setStage] = useState('league'); // 'league', 'tournament', 'timetable'

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
        <div 
          className={`tab ${stage === 'timetable' ? 'active' : ''}`}
          onClick={() => setStage('timetable')}
        >
          タイムスケジュール
        </div>
      </div>

      {stage === 'timetable' ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <h3 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center'}}>
            大会当日 タイムスケジュール
          </h3>
          
          <div className="glass-card" style={{padding: '20px 16px', cursor: 'default', display: 'flex', flexDirection: 'column', gap: 20}}>
            {initialTimetable.map((event, index) => (
              <div key={index} style={{display: 'flex', gap: 16, position: 'relative'}}>
                {/* Line */}
                {index !== initialTimetable.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 6,
                    top: 18,
                    bottom: -18,
                    width: 2,
                    background: 'rgba(255,255,255,0.08)'
                  }}></div>
                )}
                {/* Dot */}
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: event.label.includes('試合') || event.label.includes('決勝') ? 'var(--accent-color)' : 'rgba(255,255,255,0.25)',
                  border: '3px solid var(--bg-color)',
                  zIndex: 2,
                  marginTop: 3,
                  flexShrink: 0
                }}></div>
                {/* Content */}
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8}}>
                    <span style={{fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)'}}>{event.label}</span>
                    <span style={{fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold', flexShrink: 0}}>{event.time}</span>
                  </div>
                  {(event.duration || event.detail) && (
                    <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 8, alignItems: 'center'}}>
                      {event.duration && <span style={{background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4}}>{event.duration}</span>}
                      {event.detail && <span>{event.detail}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
              style={{cursor: isAdmin ? 'pointer' : 'default', opacity: 1}}
            />
          ))}
        </div>
      )}
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
  const [subTab, setSubTab] = useState('team');

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
        teamId: player ? player.teamId : '',
        teamName: team ? team.name : '',
        teamEmoji: team ? team.emoji : '',
        goals: stats[playerId].goals,
        assists: stats[playerId].assists
      };
    });
  };

  const getTeamSortValue = (teamId) => {
    const finalMatch = matches.find(m => m.stage === 'final');
    const thirdMatch = matches.find(m => m.stage === 'third_place');
    
    if (finalMatch && finalMatch.status === 'finished') {
      if (finalMatch.homeScore > finalMatch.awayScore) {
        if (teamId === finalMatch.homeId) return 1;
        if (teamId === finalMatch.awayId) return 2;
      } else if (finalMatch.awayScore > finalMatch.homeScore) {
        if (teamId === finalMatch.awayId) return 1;
        if (teamId === finalMatch.homeId) return 2;
      } else {
        if (teamId === finalMatch.homeId || teamId === finalMatch.awayId) return 1.5;
      }
    }
    
    if (thirdMatch && thirdMatch.status === 'finished') {
      if (thirdMatch.homeScore > thirdMatch.awayScore) {
        if (teamId === thirdMatch.homeId) return 3;
        if (teamId === thirdMatch.awayId) return 4;
      } else if (thirdMatch.awayScore > thirdMatch.homeScore) {
        if (teamId === thirdMatch.awayId) return 3;
        if (teamId === thirdMatch.homeId) return 4;
      } else {
        if (teamId === thirdMatch.homeId || teamId === thirdMatch.awayId) return 3.5;
      }
    }
    
    const idx = standings.findIndex(t => t.id === teamId);
    return idx !== -1 ? idx + 10 : 99;
  };

  // 同率時のソート: チーム最終順位(決勝結果優先、未了なら予選順位) → 背番号昇順
  const rankSort = (key) => (a, b) => {
    if (b[key] !== a[key]) return b[key] - a[key];
    const aPos = getTeamSortValue(a.teamId);
    const bPos = getTeamSortValue(b.teamId);
    if (aPos !== bPos) return aPos - bPos;
    const aNum = Number(a.number) || 9999;
    const bNum = Number(b.number) || 9999;
    return aNum - bNum;
  };

  const assignRanks = (list, key) => {
    let currentRank = 1;
    return list.map((item, index) => {
      if (index > 0 && item[key] < list[index - 1][key]) {
        currentRank = index + 1;
      }
      return { ...item, _rank: currentRank };
    });
  };

  const personalList = getPersonalStats();
  const goalRankings = assignRanks([...personalList].filter(p => p.goals > 0).sort(rankSort('goals')), 'goals');
  const assistRankings = assignRanks([...personalList].filter(p => p.assists > 0).sort(rankSort('assists')), 'assists');

  // CSVダウンロード関数
  const downloadCSV = () => {
    const rows = [];

    // ── 試合結果 ──
    rows.push(['【試合結果】']);
    rows.push(['試合名', '時間', 'ホーム', 'スコア', 'アウェイ', '状態']);
    matches.forEach(m => {
      const home = getTeam(m.homeId)?.name || '未定';
      const away = getTeam(m.awayId)?.name || '未定';
      const score = (m.status === 'finished' || m.status === 'live')
        ? `${m.homeScore}-${m.awayScore}` : '-';
      const status = m.status === 'finished' ? '試合終了'
        : m.status === 'live' ? '試合中' : '予定';
      rows.push([m.label, m.date, home, score, away, status]);
    });
    rows.push([]);

    // ── 得点・アシスト詳細 ──
    rows.push(['【得点・アシスト詳細】']);
    rows.push(['試合名', 'チーム', '得点者', '背番号', 'アシスト者', '背番号']);
    matches.forEach(m => {
      if (!m.goals || m.goals.length === 0) return;
      m.goals.forEach(g => {
        const scorer = members.find(p => p.id === g.scorerId);
        const assist = members.find(p => p.id === g.assistId);
        const teamName = getTeam(g.teamId)?.name || '';
        rows.push([
          m.label,
          teamName,
          scorer?.name || '',
          scorer?.number || '',
          assist?.name || '',
          assist?.number || ''
        ]);
      });
    });
    rows.push([]);

    // ── 得点ランキング ──
    rows.push(['【得点ランキング】']);
    rows.push(['順位', 'チーム', '氏名', '背番号', '得点数']);
    goalRankings.forEach((p) => {
      rows.push([p._rank, p.teamName, p.name, p.number, p.goals]);
    });
    rows.push([]);

    // ── アシストランキング ──
    rows.push(['【アシストランキング】']);
    rows.push(['順位', 'チーム', '氏名', '背番号', 'アシスト数']);
    assistRankings.forEach((p) => {
      rows.push([p._rank, p.teamName, p.name, p.number, p.assists]);
    });
    rows.push([]);

    // ── 順位表 ──
    rows.push(['【予選順位表】']);
    rows.push(['順位', 'チーム', '試合', '勝', '分', '負', '得点', '失点', '得失点差', '勝点']);
    standings.forEach((t, i) => {
      rows.push([i + 1, t.name, t.played, t.won, t.drawn, t.lost,
        t.goalsFor, t.goalsAgainst, t.goalDifference, t.points]);
    });

    // CSV文字列を生成（BOM付きでExcel/Sheetsで文字化けしない）
    const csv = '\uFEFF' + rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament_results_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              {goalRankings.map((player) => (
                <tr key={player.id}>
                  <td style={{paddingLeft: '16px', textAlign: 'left'}}>
                    <span style={{color: 'var(--text-secondary)', marginRight: 8, fontSize: '0.8rem'}}>{player._rank}</span>
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
              {assistRankings.map((player) => (
                <tr key={player.id}>
                  <td style={{paddingLeft: '16px', textAlign: 'left'}}>
                    <span style={{color: 'var(--text-secondary)', marginRight: 8, fontSize: '0.8rem'}}>{player._rank}</span>
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

      {/* CSVダウンロードボタン */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          className="btn btn-secondary"
          onClick={downloadCSV}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderColor: 'rgba(255,255,255,0.2)'
          }}
        >
          📥 結果をCSVでダウンロード
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 8 }}>
          ダウンロード後、スプレッドシートで「ファイル → インポート」から読み込めます
        </p>
      </div>
    </div>
  );
}

function TeamsView({ teams, members, setMembers, isAdmin }) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editIsNakano, setEditIsNakano] = useState(false);
  const [checkMode, setCheckMode] = useState(false);

  const teamMembers = members.filter(m => m.teamId === selectedTeam).sort((a, b) => Number(a.number) - Number(b.number));
  const checkedCount = teamMembers.filter(m => m.checked).length;

  const startEdit = (member) => {
    setEditingMember(member.id);
    setEditName(member.name);
    setEditNumber(member.number);
    setEditAge(member.age || '');
    setEditIsNakano(member.isNakano || member.isResident || member.isWorker || false);
  };

  const saveEdit = (id) => {
    setMembers(members.map(m => m.id === id ? { ...m, name: editName, number: editNumber, age: editAge, isNakano: editIsNakano, isResident: false, isWorker: false } : m));
    setEditingMember(null);
  };

  const deleteMember = (id) => {
    if(window.confirm('本当に削除しますか？')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const addNewMember = () => {
    const newId = 'p' + Date.now();
    setMembers([...members, { id: newId, teamId: selectedTeam, name: '新規選手', number: '', age: '', isNakano: false }]);
    setEditingMember(newId);
    setEditName('');
    setEditNumber('');
    setEditAge('');
    setEditIsNakano(false);
  };

  const toggleCheck = (id) => {
    setMembers(members.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
  };

  const resetChecks = () => {
    if (window.confirm('このチームの全チェックをリセットしますか？')) {
      setMembers(members.map(m => m.teamId === selectedTeam ? { ...m, checked: false } : m));
    }
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
        {/* ヘッダー */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <h3 style={{margin: 0}}>
            {checkMode ? '✅ メンバーチェック' : '登録メンバー'}
          </h3>
          <div style={{display: 'flex', gap: 8}}>
            {isAdmin && !checkMode && (
              <button className="btn btn-primary" style={{padding: '8px 16px', width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4}} onClick={addNewMember}>
                <Plus size={16} /> 追加
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { setCheckMode(!checkMode); setEditingMember(null); }}
                style={{
                  padding: '8px 14px',
                  width: 'auto',
                  marginBottom: 0,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  background: checkMode ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                  color: checkMode ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {checkMode ? '✅ 完了' : '✅ チェックモード'}
              </button>
            )}
          </div>
        </div>

        {/* 進捗バー（常時表示） */}
        <div style={{marginBottom: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
            <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>参加確認</span>
            <span style={{fontSize: '0.9rem', fontWeight: 'bold', color: checkedCount === teamMembers.length && teamMembers.length > 0 ? '#4caf50' : 'var(--accent-color)'}}>
              {checkedCount} / {teamMembers.length} 名
            </span>
          </div>
          <div style={{background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 8, overflow: 'hidden'}}>
            <div style={{
              background: checkedCount === teamMembers.length && teamMembers.length > 0 ? '#4caf50' : 'var(--accent-color)',
              height: '100%',
              width: `${teamMembers.length > 0 ? (checkedCount / teamMembers.length) * 100 : 0}%`,
              borderRadius: 99,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* メンバーリスト */}
        <div className="members-list" style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {teamMembers.length === 0 && <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0'}}>メンバーが登録されていません</p>}
          
          {teamMembers.map(member => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: checkMode && member.checked
                  ? 'rgba(76, 175, 80, 0.2)'
                  : 'rgba(0,0,0,0.2)',
                border: checkMode && member.checked
                  ? '1px solid rgba(76, 175, 80, 0.5)'
                  : '1px solid transparent',
                padding: '12px 16px',
                borderRadius: 8,
                transition: 'all 0.2s',
                cursor: checkMode ? 'pointer' : 'default'
              }}
              onClick={checkMode ? () => toggleCheck(member.id) : undefined}
            >
              {/* チェックモード: チェックマーク */}
              {checkMode && (
                <div style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  border: `2px solid ${member.checked ? '#4caf50' : 'rgba(255,255,255,0.3)'}`,
                  background: member.checked ? '#4caf50' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 12, flexShrink: 0,
                  transition: 'all 0.2s'
                }}>
                  {member.checked && <Check size={16} color="#fff" />}
                </div>
              )}

              {/* 編集モード */}
              {!checkMode && editingMember === member.id ? (
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1, alignItems: 'center'}}>
                  <div style={{display: 'flex', gap: 8, width: '100%', alignItems: 'center'}}>
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
                  </div>
                  <div style={{display: 'flex', gap: 16, width: '100%', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'}}>
                      <input type="checkbox" checked={editIsNakano} onChange={e => setEditIsNakano(e.target.checked)} />
                      中野区(在住・在勤)
                    </label>
                    <button onClick={() => saveEdit(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--accent-color)', padding: 8, cursor: 'pointer', marginLeft: 'auto'}}>
                      <Save size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{display: 'flex', gap: 16, flex: 1, alignItems: 'center'}}>
                  <div style={{
                    width: 40,
                    color: checkMode && member.checked ? '#4caf50' : 'var(--text-secondary)',
                    fontWeight: 'bold'
                  }}>{member.number}</div>
                  <div style={{
                    flex: 1,
                    fontWeight: checkMode && member.checked ? 'bold' : 'normal',
                    color: checkMode && member.checked ? '#fff' : 'inherit'
                  }}>
                    {member.name}
                    {member.age && <span style={{marginLeft: 8, fontSize: '0.85rem', color: checkMode && member.checked ? 'inherit' : 'var(--text-secondary)'}}>{member.age}歳</span>}
                    {(member.isNakano || member.isResident || member.isWorker) && <span style={{marginLeft: 8, fontSize: '0.7rem', background: '#e91e63', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold'}}>中野</span>}
                  </div>
                  {!checkMode && (
                    <>
                      {/* チェック済みバッジ */}
                      {member.checked && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          background: 'rgba(76,175,80,0.2)',
                          border: '1px solid rgba(76,175,80,0.5)',
                          borderRadius: 99,
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          color: '#4caf50',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          <Check size={11} /> 確認済
                        </div>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => startEdit(member)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 8, cursor: 'pointer'}}>
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteMember(member.id)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', padding: 8, cursor: 'pointer'}}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* チェックモード: リセットボタン */}
        {isAdmin && checkMode && teamMembers.length > 0 && (
          <button
            onClick={resetChecks}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            🔄 チェックをリセット
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
