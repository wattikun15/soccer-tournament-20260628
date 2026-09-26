import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Trophy, Users, Plus, X, Check, Edit2, Save, Trash2, BookOpen, Sun, Moon, Database, Search, UserPlus, Filter, Download } from 'lucide-react';
import { initialTeams, initialMatches, initialMembers, calculateStandings, initialTimetable, teamSummary } from './data';
import initialMasterData from './masterData.json';
import { ensureAuth, auth } from './firebase';
import './index.css';

// Firebase Realtime Database URL
const FIREBASE_BASE_URL = 'https://nakanofa-tournament-2026-default-rtdb.asia-southeast1.firebasedatabase.app/nakanofa_20260927';
const FIREBASE_MASTER_URL = 'https://nakanofa-tournament-2026-default-rtdb.asia-southeast1.firebasedatabase.app/team_master_members';

// Sanitize team name for Firebase RTDB keys (prohibits '.', '$', '#', '[', ']', '/')
export function cleanTeamKey(name) {
  if (!name) return 'team';
  return name.replace(/[\.\$#\[\]\/]/g, '').trim();
}

// Calculate age from birth string (supports '1980/05/12', '1980-05-12', '1980/5', '1980年5月12日', etc.)
export function calculateAgeFromBirth(birthStr) {
  if (!birthStr) return '';
  const clean = String(birthStr).replace(/[年月日]/g, '/').replace(/-/g, '/');
  const parts = clean.split('/').map(p => parseInt(p, 10)).filter(n => !isNaN(n));
  if (parts.length === 0) return '';
  const birthYear = parts[0];
  const birthMonth = parts[1] ? parts[1] - 1 : 0;
  const birthDay = parts[2] ? parts[2] : 1;
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age >= 0 && age < 120 ? age : '';
}

// Fetch wrapper that signs in anonymously and attaches the auth token
// required by the Realtime Database rules.
async function authedFetch(url, options) {
  await ensureAuth();
  const token = await auth.currentUser.getIdToken();
  const authedUrl = `${url}${url.includes('?') ? '&' : '?'}auth=${token}`;
  return fetch(authedUrl, options);
}

function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [matches, setMatches] = useState(initialMatches);
  const [teams, setTeams] = useState(initialTeams);
  const [members, setMembers] = useState(initialMembers);
  const [masterMembers, setMasterMembers] = useState(initialMasterData || {});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [printMode, setPrintMode] = useState('blank');
  const isAdmin = true;
  const [rosterTeamId, setRosterTeamId] = useState(null);
  const [showGoalTeamPicker, setShowGoalTeamPicker] = useState(false);
  const [showCardTeamPicker, setShowCardTeamPicker] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const initialMatchSnapshotRef = useRef('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tournament_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tournament_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Helper functions to save data to cloud
  const saveMatchesToCloud = async (updatedMatches) => {
    try {
      const res = await authedFetch(`${FIREBASE_BASE_URL}/matches.json`, {
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
      const res = await authedFetch(`${FIREBASE_BASE_URL}/members.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMembers)
      });
      if (!res.ok) console.error('Failed to save members:', res.statusText);
    } catch (err) {
      console.error('Failed to save members to cloud:', err);
    }
  };

  const saveTeamMasterToCloud = async (teamKey, teamPlayers) => {
    try {
      const res = await authedFetch(`${FIREBASE_MASTER_URL}/${encodeURIComponent(teamKey)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamPlayers)
      });
      if (!res.ok) console.error('Failed to save team master:', res.statusText);
    } catch (err) {
      console.error('Failed to save team master to cloud:', err);
    }
  };

  const handleUpdateTeamMaster = (teamKey, updatedPlayers) => {
    setMasterMembers(prev => ({
      ...prev,
      [teamKey]: updatedPlayers
    }));
    saveTeamMasterToCloud(teamKey, updatedPlayers);
  };

  useEffect(() => {
    window.__reset927Data = async () => {
      await saveMatchesToCloud(initialMatches);
      await saveMembersToCloud(initialMembers);
      await saveTeamMasterToCloud('かきっぱち', initialMasterData['かきっぱち']);
      setMatches(initialMatches);
      setMembers(initialMembers);
      setMasterMembers(prev => ({
        ...prev,
        'かきっぱち': initialMasterData['かきっぱち']
      }));
      return 'OK';
    };
    window.__syncKakippachi = async () => {
      const nonKaki = (members || []).filter(m => m.teamId !== 't4' && m.team !== 'かきっぱち');
      const kakiMembers = initialMembers.filter(m => m.teamId === 't4');
      const allMembers = [...nonKaki, ...kakiMembers];
      await saveMembersToCloud(allMembers);
      await saveTeamMasterToCloud('かきっぱち', initialMasterData['かきっぱち']);
      setMembers(allMembers);
      setMasterMembers(prev => ({
        ...prev,
        'かきっぱち': initialMasterData['かきっぱち']
      }));
      return 'OK';
    };
  }, [members]);

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
        const [resMatches, resMembers, resMaster] = await Promise.all([
          authedFetch(`${FIREBASE_BASE_URL}/matches.json`),
          authedFetch(`${FIREBASE_BASE_URL}/members.json`),
          authedFetch(`${FIREBASE_MASTER_URL}.json`)
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

        if (resMaster.ok) {
          const cloudMaster = await resMaster.json();
          if (cloudMaster && typeof cloudMaster === 'object' && Object.keys(cloudMaster).length > 0) {
            setMasterMembers(cloudMaster);
          } else {
            await authedFetch(`${FIREBASE_MASTER_URL}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialMasterData)
            });
          }
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
        const [resMatches, resMembers, resMaster] = await Promise.all([
          authedFetch(`${FIREBASE_BASE_URL}/matches.json`),
          authedFetch(`${FIREBASE_BASE_URL}/members.json`),
          authedFetch(`${FIREBASE_MASTER_URL}.json`)
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

        if (resMaster.ok) {
          const cloudMaster = await resMaster.json();
          if (cloudMaster && typeof cloudMaster === 'object') {
            setMasterMembers(cloudMaster);
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

  const serializeMatchState = (m) => {
    if (!m) return '';
    return JSON.stringify({
      label: m.label || '',
      date: m.date || '',
      actualStartTime: m.actualStartTime || null,
      refereeTeamId: m.refereeTeamId || null,
      refereePlayerId: m.refereePlayerId || null,
      homeId: m.homeId || null,
      awayId: m.awayId || null,
      goals: (m.goals || []).map(g => ({
        id: g.id,
        teamId: g.teamId,
        scorerId: g.scorerId,
        assistId: g.assistId,
        type: g.type,
        order: g.order
      })),
      cards: (m.cards || []).map(c => ({
        id: c.id,
        teamId: c.teamId,
        playerId: c.playerId,
        type: c.type,
        order: c.order
      }))
    });
  };

  const getNextOrder = (currentMatch) => {
    const goals = currentMatch.goals || [];
    const cards = currentMatch.cards || [];
    const maxOrder = Math.max(
      0,
      ...goals.map(g => (typeof g.order === 'number' ? g.order : 0)),
      ...cards.map(c => (typeof c.order === 'number' ? c.order : 0))
    );
    return maxOrder + 1;
  };

  const handleMatchClick = (match) => {
    let orderCounter = 1;
    const goals = (match.goals ? [...match.goals] : []).map((g, idx) => ({
      ...g,
      id: g.id || `g_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      order: typeof g.order === 'number' ? g.order : orderCounter++
    }));
    const cards = (match.cards ? [...match.cards] : []).map((c, idx) => ({
      ...c,
      id: c.id || `c_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      order: typeof c.order === 'number' ? c.order : orderCounter++
    }));

    const prepared = { 
      ...match,
      goals,
      cards
    };

    initialMatchSnapshotRef.current = serializeMatchState(prepared);
    setSelectedMatch(prepared);
    setShowDiscardConfirm(false);
    setShowGoalTeamPicker(false);
    setShowCardTeamPicker(null);
  };

  const hasUnsavedChanges = selectedMatch 
    ? serializeMatchState(selectedMatch) !== initialMatchSnapshotRef.current 
    : false;

  const forceCloseModal = () => {
    setSelectedMatch(null);
    setShowDiscardConfirm(false);
    setShowGoalTeamPicker(false);
    setShowCardTeamPicker(null);
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      forceCloseModal();
    }
  };

  const closeModal = handleCloseAttempt;

  const closeRosterModal = () => {
    setRosterTeamId(null);
  };

  const addGoal = (teamId) => {
    if (!selectedMatch) return;
    const nextOrder = getNextOrder(selectedMatch);
    const newGoal = {
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      teamId: teamId || selectedMatch.homeId || '',
      scorerId: null,
      assistId: null,
      type: 'normal',
      order: nextOrder
    };
    const updatedGoals = [...(selectedMatch.goals || []), newGoal];
    const homeScore = updatedGoals.filter(g => g.teamId === selectedMatch.homeId).length;
    const awayScore = updatedGoals.filter(g => g.teamId === selectedMatch.awayId).length;

    setSelectedMatch({
      ...selectedMatch,
      goals: updatedGoals,
      homeScore,
      awayScore
    });
  };

  const removeGoal = (goalId, fallbackIndex) => {
    if (!selectedMatch) return;
    const updatedGoals = (selectedMatch.goals || []).filter((g, idx) => {
      if (goalId && g.id) return g.id !== goalId;
      return idx !== fallbackIndex;
    });
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
    const updatedGoals = (selectedMatch.goals || []).map(g => 
      g.id === goalId ? { ...g, [field]: val || null } : g
    );
    setSelectedMatch({
      ...selectedMatch,
      goals: updatedGoals
    });
  };

  const updateGoalTeam = (goalId, newTeamId) => {
    if (!selectedMatch) return;
    const updatedGoals = (selectedMatch.goals || []).map(g =>
      g.id === goalId ? { ...g, teamId: newTeamId, scorerId: null, assistId: null } : g
    );
    const homeScore = updatedGoals.filter(g => g.teamId === selectedMatch.homeId).length;
    const awayScore = updatedGoals.filter(g => g.teamId === selectedMatch.awayId).length;
    setSelectedMatch({
      ...selectedMatch,
      goals: updatedGoals,
      homeScore,
      awayScore
    });
  };

  const addCard = (teamId, type = 'yellow') => {
    if (!selectedMatch) return;
    const nextOrder = getNextOrder(selectedMatch);
    const newCard = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      teamId: teamId || selectedMatch.homeId || '',
      playerId: null,
      type,
      order: nextOrder
    };
    setSelectedMatch({
      ...selectedMatch,
      cards: [...(selectedMatch.cards || []), newCard]
    });
  };

  const removeCard = (cardId, fallbackIndex) => {
    if (!selectedMatch) return;
    const updatedCards = (selectedMatch.cards || []).filter((c, idx) => {
      if (cardId && c.id) return c.id !== cardId;
      return idx !== fallbackIndex;
    });
    setSelectedMatch({
      ...selectedMatch,
      cards: updatedCards
    });
  };

  const updateCardDetail = (cardId, field, val) => {
    if (!selectedMatch) return;
    setSelectedMatch({
      ...selectedMatch,
      cards: (selectedMatch.cards || []).map(c => {
        if (c.id !== cardId) return c;
        if (field === 'teamId') {
          return { ...c, teamId: val, playerId: null };
        }
        return { ...c, [field]: val || null };
      })
    });
  };

  const moveTimelineItem = (timelineIndex, direction) => {
    if (!selectedMatch) return;
    const timeline = [
      ...(selectedMatch.goals || []).map(g => ({ ...g, kind: 'goal' })),
      ...(selectedMatch.cards || []).map(c => ({ ...c, kind: 'card' }))
    ].sort((a, b) => (a.order || 0) - (b.order || 0));

    const targetIndex = timelineIndex + direction;
    if (targetIndex < 0 || targetIndex >= timeline.length) return;

    // Swap adjacent items in timeline
    const temp = timeline[timelineIndex];
    timeline[timelineIndex] = timeline[targetIndex];
    timeline[targetIndex] = temp;

    // Reassign order sequentially 1, 2, 3...
    const newGoals = [];
    const newCards = [];
    timeline.forEach((item, idx) => {
      const updated = { ...item, order: idx + 1 };
      if (item.kind === 'goal') {
        const { kind: _kind, ...rest } = updated;
        newGoals.push(rest);
      } else {
        const { kind: _kind, ...rest } = updated;
        newCards.push(rest);
      }
    });

    setSelectedMatch({
      ...selectedMatch,
      goals: newGoals,
      cards: newCards
    });
  };

  const updateMatchTeams = (homeId, awayId) => {
    if (!selectedMatch) return;
    setSelectedMatch({
      ...selectedMatch,
      homeId: homeId || null,
      awayId: awayId || null,
      goals: [],
      cards: [],
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
    forceCloseModal();
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
        <div style={{flex: 1}}>
          <h1 style={{color: 'var(--text-primary)'}}>9/27(日)中野区ミニサッカー シニア大会@本五ふれあい公園</h1>
          <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}>
              <Users size={14} /> 参加人数合計: <span style={{color: '#4caf50', fontWeight: 'bold'}}>{members.filter(m => m.checked).length}</span>名
            </span>
            <span style={{fontSize: '0.8rem', background: 'var(--pill-bg)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: 12, color: 'var(--pill-text)'}}>
              中野区(在住・在勤): <span style={{color: 'var(--accent-color)', fontWeight: 'bold'}}>{members.filter(m => m.checked && (m.isNakano || m.isResident || m.isWorker)).length}</span>名
            </span>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? '日中屋外モードに切り替え' : 'ダークモードに切り替え'}
          aria-label="テーマ切替"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="var(--theme-btn-icon)" />
              <span>☀️ 日中</span>
            </>
          ) : (
            <>
              <Moon size={15} color="var(--theme-btn-icon)" />
              <span>🌙 ダーク</span>
            </>
          )}
        </button>
      </header>



      {/* チームメンバー表 モーダル（試合管理画面のチーム名タップ用） */}
      {rosterTeamId && (
        <div
          style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16}}
          onClick={closeRosterModal}
        >
          <div
            style={{background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderRadius: 16, padding: 24, width: 400, maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)', position: 'relative'}}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeRosterModal}
              style={{
                position: 'absolute', top: 12, right: 12, background: 'var(--pill-bg)', border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)', cursor: 'pointer', padding: 6, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)'}}>
              {getTeam(rosterTeamId)?.emoji} {getTeam(rosterTeamId)?.name} メンバー表
            </h3>
            {(() => {
              const rosterMembers = members.filter(m => m.teamId === rosterTeamId);
              const rosterCheckedCount = rosterMembers.filter(m => m.checked).length;
              const toggleRosterCheck = (id) => {
                handleSetMembers(members.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
              };
              return (
                <>
                  <p style={{textAlign: 'center', marginBottom: 20, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                    タップして出欠チェック
                    <span style={{marginLeft: 6, fontWeight: 'bold', color: rosterCheckedCount === rosterMembers.length && rosterMembers.length > 0 ? '#4caf50' : 'var(--accent-color)'}}>
                      {rosterCheckedCount} / {rosterMembers.length} 名
                    </span>
                  </p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {rosterMembers.length === 0 && (
                      <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0'}}>メンバーが登録されていません</p>
                    )}
                    {rosterMembers
                      .sort((a, b) => Number(a.number) - Number(b.number))
                      .map(member => (
                        <div
                          key={member.id}
                          onClick={() => toggleRosterCheck(member.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            background: member.checked ? 'var(--checked-bg)' : 'var(--item-sub-bg)',
                            border: member.checked ? '1px solid var(--checked-border)' : '1px solid var(--border-subtle)',
                            padding: '10px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${member.checked ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                            background: member.checked ? 'var(--accent-color)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {member.checked && <Check size={14} color="#fff" />}
                          </div>
                          <div style={{width: 32, color: 'var(--text-secondary)', fontWeight: 'bold'}}>{member.number}</div>
                          <div style={{flex: 1, color: member.checked ? 'var(--checked-text)' : 'var(--text-primary)', fontWeight: member.checked ? '600' : 'normal'}}>
                            {member.name}
                            {member.age && <span style={{marginLeft: 8, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{member.age}歳</span>}
                            {member.referee && <span style={{marginLeft: 8, fontSize: '0.75rem', background: 'var(--pill-bg)', border: '1px solid var(--glass-border)', padding: '2px 6px', borderRadius: 4, color: 'var(--pill-text)'}}>{member.referee}</span>}
                            {(member.isNakano || member.isResident || member.isWorker) && <span style={{marginLeft: 8, fontSize: '0.7rem', background: '#e91e63', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold'}}>中野</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="no-print">
        {activeTab === 'schedule' && (
          <>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap'}}>
              <button
                onClick={() => setActiveTab('rules')}
                className="quick-action-btn"
              >
                <BookOpen size={16} /> ルール
              </button>
              <button
                onClick={() => handlePrint('blank')}
                className="quick-action-btn"
              >
                🖨️ 記録用紙
              </button>
              <button
                onClick={() => handlePrint('result')}
                className="quick-action-btn"
              >
                📊 試合結果
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
            masterMembers={masterMembers}
            onUpdateTeamMaster={handleUpdateTeamMaster}
          />
        )}
        
        {activeTab === 'rules' && (
          <RulesView handlePrint={handlePrint} setActiveTab={setActiveTab} />
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
      <div 
        className={`modal-overlay ${selectedMatch ? 'open' : ''}`}
        onClick={handleCloseAttempt}
      >
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{position: 'relative'}}>
          {/* Header Action Bar */}
          <div style={{
            position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10
          }}>
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={() => saveMatch('finished')}
                className="btn btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)'
                }}
                title="結果を保存"
              >
                <Save size={14} /> 保存
              </button>
            )}
            <button 
              type="button"
              onClick={handleCloseAttempt}
              style={{
                background: 'var(--pill-bg)', border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)', cursor: 'pointer', padding: 6, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="閉じる"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>
          <div className="modal-drag-handle"></div>
          
          {selectedMatch && (() => {
            const homeTeam = getTeam(selectedMatch.homeId);
            const awayTeam = getTeam(selectedMatch.awayId);
            return (
              <>
                <h2 style={{textAlign: 'center', marginBottom: 24}}>
                  {selectedMatch.label || 'リーグ戦'} - 試合管理
                </h2>
                
                <div className="teams-container" style={{marginBottom: 24}}>
                  <div className="team home">
                    <div
                      className="team-logo"
                      style={{width: 64, height: 64, fontSize: '2rem', cursor: selectedMatch.homeId ? 'pointer' : 'default'}}
                      onClick={() => selectedMatch.homeId && setRosterTeamId(selectedMatch.homeId)}
                    >
                      {homeTeam?.emoji || '❓'}
                    </div>
                    <div
                      className="team-name"
                      style={{cursor: selectedMatch.homeId ? 'pointer' : 'default', textDecoration: selectedMatch.homeId ? 'underline dotted' : 'none'}}
                      onClick={() => selectedMatch.homeId && setRosterTeamId(selectedMatch.homeId)}
                    >
                      {homeTeam?.name || '未定'}
                    </div>
                  </div>

                  <div className="score">
                    <span>{selectedMatch.homeScore}</span>
                    <span className="score-dash">-</span>
                    <span>{selectedMatch.awayScore}</span>
                  </div>

                  <div className="team away">
                    <div
                      className="team-logo"
                      style={{width: 64, height: 64, fontSize: '2rem', cursor: selectedMatch.awayId ? 'pointer' : 'default'}}
                      onClick={() => selectedMatch.awayId && setRosterTeamId(selectedMatch.awayId)}
                    >
                      {awayTeam?.emoji || '❓'}
                    </div>
                    <div
                      className="team-name"
                      style={{cursor: selectedMatch.awayId ? 'pointer' : 'default', textDecoration: selectedMatch.awayId ? 'underline dotted' : 'none'}}
                      onClick={() => selectedMatch.awayId && setRosterTeamId(selectedMatch.awayId)}
                    >
                      {awayTeam?.name || '未定'}
                    </div>
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
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 12}}>
                    {!selectedMatch.actualStartTime ? (
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const hh = String(now.getHours()).padStart(2, '0');
                          const mm = String(now.getMinutes()).padStart(2, '0');
                          setSelectedMatch({...selectedMatch, actualStartTime: `${hh}:${mm}`});
                        }}
                        className="btn btn-secondary" 
                        style={{padding: '6px 12px', fontSize: '0.8rem'}}
                      >
                        ⏱ 開始を打刻
                      </button>
                    ) : (
                      <div style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem'}}>
                        <input
                          type="time"
                          value={selectedMatch.actualStartTime || ''}
                          onChange={e => setSelectedMatch({ ...selectedMatch, actualStartTime: e.target.value })}
                          style={{
                            background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)',
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
                    )}
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

                {/* Unified Match Events (Goals & Cards) Timeline Panel */}
                <div className="glass-card" style={{padding: '16px', marginBottom: 24, cursor: 'default'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6}}>
                    <h4 style={{fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6}}>
                      <span>⏱️ 試合イベント（得点・カード）の時系列管理</span>
                    </h4>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                      得点: {(selectedMatch.goals || []).length} / 🟨 {(selectedMatch.cards || []).filter(c => c.type === 'yellow').length} / 🟥 {(selectedMatch.cards || []).filter(c => c.type === 'red').length}
                    </span>
                  </div>

                  {/* Team Picker for Goal */}
                  {showGoalTeamPicker && (
                    <div style={{background: 'var(--item-sub-bg)', border: '1px solid var(--accent-color)', borderRadius: 10, padding: 12, marginBottom: 16}}>
                      <div style={{fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 8, color: 'var(--text-primary)'}}>
                        得点したチームを選択してください:
                      </div>
                      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                        {homeTeam && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{flex: 1, padding: '10px 8px', fontSize: '0.85rem', marginBottom: 0}}
                            onClick={() => { addGoal(selectedMatch.homeId); setShowGoalTeamPicker(false); }}
                          >
                            {homeTeam.emoji} {homeTeam.name}
                          </button>
                        )}
                        {awayTeam && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{flex: 1, padding: '10px 8px', fontSize: '0.85rem', marginBottom: 0}}
                            onClick={() => { addGoal(selectedMatch.awayId); setShowGoalTeamPicker(false); }}
                          >
                            {awayTeam.emoji} {awayTeam.name}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{width: 'auto', padding: '10px 14px', fontSize: '0.85rem', marginBottom: 0}}
                          onClick={() => setShowGoalTeamPicker(false)}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Team Picker for Card */}
                  {showCardTeamPicker && (
                    <div style={{background: 'var(--item-sub-bg)', border: `1px solid ${showCardTeamPicker.type === 'red' ? '#ef4444' : '#f59e0b'}`, borderRadius: 10, padding: 12, marginBottom: 16}}>
                      <div style={{fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 8, color: 'var(--text-primary)'}}>
                        {showCardTeamPicker.type === 'red' ? '🟥 レッドカード' : '🟨 イエローカード'} を受けるチームを選択:
                      </div>
                      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                        {homeTeam && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{flex: 1, padding: '10px 8px', fontSize: '0.85rem', marginBottom: 0, borderColor: showCardTeamPicker.type === 'red' ? '#ef4444' : '#f59e0b'}}
                            onClick={() => { addCard(selectedMatch.homeId, showCardTeamPicker.type); setShowCardTeamPicker(null); }}
                          >
                            {homeTeam.emoji} {homeTeam.name}
                          </button>
                        )}
                        {awayTeam && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{flex: 1, padding: '10px 8px', fontSize: '0.85rem', marginBottom: 0, borderColor: showCardTeamPicker.type === 'red' ? '#ef4444' : '#f59e0b'}}
                            onClick={() => { addCard(selectedMatch.awayId, showCardTeamPicker.type); setShowCardTeamPicker(null); }}
                          >
                            {awayTeam.emoji} {awayTeam.name}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{width: 'auto', padding: '10px 14px', fontSize: '0.85rem', marginBottom: 0}}
                          onClick={() => setShowCardTeamPicker(null)}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Add Goal, Add Yellow, Add Red */}
                  {!showGoalTeamPicker && !showCardTeamPicker && (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 16}}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{padding: '10px 8px', fontSize: '0.85rem', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}
                        onClick={() => setShowGoalTeamPicker(true)}
                        disabled={!selectedMatch.homeId && !selectedMatch.awayId}
                      >
                        <Plus size={16} /> ⚽ 得点を追加
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b',
                          color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setShowCardTeamPicker({ type: 'yellow' })}
                        disabled={!selectedMatch.homeId && !selectedMatch.awayId}
                      >
                        <span>🟨</span> + イエロー
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
                          color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setShowCardTeamPicker({ type: 'red' })}
                        disabled={!selectedMatch.homeId && !selectedMatch.awayId}
                      >
                        <span>🟥</span> + レッド
                      </button>
                    </div>
                  )}

                  {/* Timeline Events List */}
                  {(() => {
                    const timeline = [
                      ...(selectedMatch.goals || []).map((g, origIdx) => ({ ...g, kind: 'goal', origIdx })),
                      ...(selectedMatch.cards || []).map((c, origIdx) => ({ ...c, kind: 'card', origIdx }))
                    ].sort((a, b) => (a.order || 0) - (b.order || 0));

                    if (timeline.length === 0) {
                      return (
                        <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem', padding: '16px 0'}}>
                          得点やカードの記録はありません
                        </p>
                      );
                    }

                    return (
                      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        {timeline.map((item, tIdx) => {
                          const isGoal = item.kind === 'goal';
                          const teamMembers = members
                            .filter(m => m.teamId === item.teamId)
                            .sort((a, b) => Number(a.number) - Number(b.number));

                          return (
                            <div 
                              key={item.id} 
                              style={{
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                background: isGoal 
                                  ? 'var(--item-sub-bg)' 
                                  : item.type === 'red' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                border: `1px solid ${isGoal 
                                  ? 'var(--border-subtle)' 
                                  : item.type === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                padding: '8px 10px', 
                                borderRadius: 8, 
                                fontSize: '0.85rem', 
                                flexWrap: 'wrap'
                              }}
                            >
                              {/* Order & Reorder arrows */}
                              <div style={{display: 'flex', alignItems: 'center', gap: 2, marginRight: 2}}>
                                <span style={{
                                  fontSize: '0.75rem', 
                                  fontWeight: 'bold', 
                                  color: 'var(--text-muted)',
                                  minWidth: '18px',
                                  textAlign: 'center'
                                }}>
                                  #{tIdx + 1}
                                </span>
                                <div style={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                  <button
                                    type="button"
                                    onClick={() => moveTimelineItem(tIdx, -1)}
                                    disabled={tIdx === 0}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: tIdx === 0 ? 'var(--border-subtle)' : 'var(--text-secondary)',
                                      cursor: tIdx === 0 ? 'default' : 'pointer',
                                      fontSize: '9px',
                                      lineHeight: '9px',
                                      padding: '1px 3px'
                                    }}
                                    title="時系列を前へ移動"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveTimelineItem(tIdx, 1)}
                                    disabled={tIdx === timeline.length - 1}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: tIdx === timeline.length - 1 ? 'var(--border-subtle)' : 'var(--text-secondary)',
                                      cursor: tIdx === timeline.length - 1 ? 'default' : 'pointer',
                                      fontSize: '9px',
                                      lineHeight: '9px',
                                      padding: '1px 3px'
                                    }}
                                    title="時系列を後ろへ移動"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>

                              {/* If Goal */}
                              {isGoal ? (
                                <>
                                  <span style={{fontSize: '0.9rem'}}>⚽</span>
                                  {/* Team Selector */}
                                  <select
                                    value={item.teamId}
                                    onChange={e => updateGoalTeam(item.id, e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', minWidth: '95px'}}
                                  >
                                    {homeTeam && <option value={homeTeam.id}>{homeTeam.emoji} {homeTeam.name}</option>}
                                    {awayTeam && <option value={awayTeam.id}>{awayTeam.emoji} {awayTeam.name}</option>}
                                  </select>

                                  <select 
                                    value={item.type || 'normal'} 
                                    onChange={e => updateGoalDetail(item.id, 'type', e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', width: '56px'}}
                                  >
                                    <option value="normal">流れ</option>
                                    <option value="pk">PK</option>
                                    <option value="fk">FK</option>
                                  </select>

                                  <select 
                                    value={item.scorerId || ''} 
                                    onChange={e => updateGoalDetail(item.id, 'scorerId', e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', flex: '1 1 115px'}}
                                  >
                                    <option value="">得点者: 未設定</option>
                                    <option value="own_goal">オウンゴール</option>
                                    {teamMembers.map(m => (
                                      <option key={m.id} value={m.id}>{m.number ? `[${m.number}] ` : ''}{m.name}</option>
                                    ))}
                                  </select>

                                  <select 
                                    value={item.assistId || ''} 
                                    onChange={e => updateGoalDetail(item.id, 'assistId', e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', flex: '1 1 115px'}}
                                  >
                                    <option value="">アシスト: なし</option>
                                    {teamMembers.filter(m => m.id !== item.scorerId).map(m => (
                                      <option key={m.id} value={m.id}>{m.number ? `[${m.number}] ` : ''}{m.name}</option>
                                    ))}
                                  </select>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeGoal(item.id, item.origIdx); }}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: 'var(--danger)',
                                      borderRadius: 6,
                                      width: 30,
                                      height: 30,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      marginLeft: 'auto'
                                    }}
                                    title="得点を削除"
                                    aria-label="得点を削除"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                /* If Card */
                                <>
                                  {/* Card type selector */}
                                  <select
                                    value={item.type || 'yellow'}
                                    onChange={e => updateCardDetail(item.id, 'type', e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', width: '92px'}}
                                  >
                                    <option value="yellow">🟨 イエロー</option>
                                    <option value="red">🟥 レッド</option>
                                  </select>

                                  {/* Team selector */}
                                  <select
                                    value={item.teamId}
                                    onChange={e => updateCardDetail(item.id, 'teamId', e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', minWidth: '95px'}}
                                  >
                                    {homeTeam && <option value={homeTeam.id}>{homeTeam.emoji} {homeTeam.name}</option>}
                                    {awayTeam && <option value={awayTeam.id}>{awayTeam.emoji} {awayTeam.name}</option>}
                                  </select>

                                  {/* Player selector */}
                                  <select
                                    value={item.playerId || ''}
                                    onChange={e => updateCardDetail(item.id, 'playerId', e.target.value)}
                                    className="edit-input"
                                    style={{padding: '4px 6px', fontSize: '0.8rem', flex: '1 1 130px'}}
                                  >
                                    <option value="">対象選手を選択</option>
                                    {teamMembers.map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.number ? `[${m.number}] ` : ''}{m.name}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeCard(item.id, item.origIdx); }}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      color: 'var(--danger)',
                                      borderRadius: 6,
                                      width: 30,
                                      height: 30,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      marginLeft: 'auto'
                                    }}
                                    title="カードを削除"
                                    aria-label="カードを削除"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
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
                            .sort((a, b) => Number(a.number) - Number(b.number))
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

                {/* Sticky Action Footer */}
                {(() => {
                  const isRevertable = 
                    selectedMatch.status === 'finished' && 
                    (!selectedMatch.goals || selectedMatch.goals.length === 0) &&
                    (!selectedMatch.cards || selectedMatch.cards.length === 0) &&
                    !selectedMatch.actualStartTime &&
                    !selectedMatch.refereePlayerId;
                  
                  return (
                    <div className="modal-sticky-footer">
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.82rem'}}>
                        {hasUnsavedChanges ? (
                          <div style={{display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 'bold'}}>
                            <span className="unsaved-pulse-dot"></span>
                            未保存の変更があります
                          </div>
                        ) : (
                          <div style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)'}}>
                            <Check size={14} color="#10b981" /> 最新の状態です
                          </div>
                        )}
                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold'}}>
                          {homeTeam?.name || 'Home'} {selectedMatch.homeScore} - {selectedMatch.awayScore} {awayTeam?.name || 'Away'}
                        </div>
                      </div>

                      <div style={{display: 'flex', gap: 8}}>
                        {isRevertable && (
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            onClick={() => {
                              selectedMatch.homeScore = 0;
                              selectedMatch.awayScore = 0;
                              saveMatch('scheduled');
                            }} 
                            style={{color: '#ff9800', borderColor: '#ff9800', flex: 1, padding: '12px', fontSize: '0.95rem'}}
                          >
                            開始前に戻す
                          </button>
                        )}
                        <button 
                          type="button"
                          className={`btn btn-primary ${hasUnsavedChanges ? 'btn-save-pulse' : ''}`}
                          onClick={() => saveMatch('finished')}
                          style={{
                            flex: 2,
                            padding: '12px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                          }}
                        >
                          <Save size={18} />
                          {hasUnsavedChanges ? '💾 結果を保存する' : '保存完了 (上書き保存)'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {showDiscardConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: 20
          }}
          onClick={(e) => { e.stopPropagation(); setShowDiscardConfirm(false); }}
        >
          <div 
            className="glass-card" 
            style={{
              maxWidth: 380,
              width: '100%',
              padding: 24,
              borderRadius: 20,
              background: 'var(--card-bg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{fontSize: '2.5rem', marginBottom: 12}}>⚠️</div>
            <h3 style={{fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 8, fontWeight: 'bold'}}>
              保存されていない変更があります
            </h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5}}>
              スコアや試合情報の変更がまだ保存されていません。<br />このまま閉じると変更内容が失われます。
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  padding: '12px', fontWeight: 'bold', fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
                onClick={() => {
                  setShowDiscardConfirm(false);
                  saveMatch('finished');
                }}
              >
                <Save size={16} /> 💾 保存して閉じる
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '10px',
                  fontSize: '0.9rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
                onClick={() => {
                  setShowDiscardConfirm(false);
                  forceCloseModal();
                }}
              >
                <Trash2 size={15} /> 🗑️ 変更を破棄して閉じる
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{padding: '8px', fontSize: '0.85rem'}}
                onClick={() => setShowDiscardConfirm(false)}
              >
                編集を続ける
              </button>
            </div>
          </div>
        </div>
      )}
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
      if (pId === 'own_goal') return 'オウンゴール';
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
              <td colSpan="3" style={{fontSize: '7.5pt', verticalAlign: 'middle', padding: '1mm 2mm'}}>
                {match.cards && match.cards.length > 0 ? (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '3mm'}}>
                    {match.cards.map((c, i) => {
                      const cTeam = getTeam(c.teamId);
                      const cPlayer = getPlayer(c.playerId);
                      const cardBadge = c.type === 'yellow' ? '🟨' : '🟥';
                      return (
                        <span key={c.id || i}>
                          {cardBadge} {cTeam ? `[${cTeam.name}] ` : ''}{cPlayer ? `${cPlayer.name}(#${cPlayer.number})` : '未設定'}
                        </span>
                      );
                    })}
                  </div>
                ) : ''}
              </td>
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
          <p>開催日：2026年9月27日（日）　会場：本五ふれあい公園</p>
        </div>
        <div className="print-grid">
          {leagueMatches.slice(0, 4).map(renderMatchCard)}
        </div>
      </div>

      {/* Page 2: League matches 5-6 + Stats */}
      <div className="print-page" style={{pageBreakBefore: 'always'}}>
        <div className="print-title">
          <h1>予選リーグ {printMode === 'result' ? '試合結果' : '記録用紙'}（続き）/ 星取表・集計表 {printMode === 'result' ? '(結果)' : ''}</h1>
          <p>開催日：2026年9月27日（日）　会場：本五ふれあい公園</p>
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
          <p>開催日：2026年9月27日（日）　会場：本五ふれあい公園</p>
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
            <h1>中野区ミニサッカー シニア大会のルール</h1>
            <p>※2026年9月27日更新</p>
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
              <li>・フリーキック時の距離は7m離れる</li>
              <li>・スローイン時の距離は2m離れる</li>
              <li>・キックオフシュートは禁止</li>
              <li>・禁止事項(イエローまたは、レッドカードを提示する)</li>
              <li style={{paddingLeft: '12px'}}>①スライディングでの接触(キーパーを含む)</li>
              <li style={{paddingLeft: '12px'}}>②後ろからの接触</li>
              <li style={{paddingLeft: '12px'}}>③相手が激しく倒れるくらいのショルダーチャージは後ろからでなくてもファールとする</li>
              <li style={{paddingLeft: '12px'}}>④キーパーへの激しい接触</li>
              <li style={{paddingLeft: '12px'}}>⑤暴言、遅延行為</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■間違いやすいルール</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・ゴールキックでは、オフサイドはなし</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■秒数制限</h2>
            <ul style={{listStyle: 'none', paddingLeft: '8px', marginBottom: '12px'}}>
              <li>・GKがペナルティーエリア内でボールを手で保持できる秒数は8秒</li>
              <li style={{paddingLeft: '12px', color: '#666'}}>※反則時：相手コーナーキック</li>
              <li>・ゴールキック、スローインで、遅延行為があった場合、5秒カウントする</li>
              <li style={{paddingLeft: '12px', color: '#666'}}>※反則時：ゴールキック→相手コーナーキック、スローイン→相手スローイン</li>
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
              <li>・代表者は本部にて試合結果をチェック(得点、アシスト、 🟨、 🟥)</li>
            </ul>

            <h2 style={{fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px'}}>■予選で同順位の場合</h2>
            <div style={{paddingLeft: '8px', marginBottom: '12px'}}>
              <div>①勝ち点(勝ち3点、引分1点、負け0点)</div>
              <div>②得失点差</div>
              <div>③反則数(少ない順: 🟨1, 🟥2)</div>
              <div>④総得点</div>
              <div>⑤直接対決の結果</div>
              <div>⑥ジャンケン</div>
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
                    background: 'var(--border-subtle)'
                  }}></div>
                )}
                {/* Dot */}
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: event.label.includes('試合') || event.label.includes('決勝') ? 'var(--accent-color)' : 'var(--text-muted)',
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
                      {event.duration && <span style={{background: 'var(--pill-bg)', border: '1px solid var(--glass-border)', color: 'var(--pill-text)', padding: '1px 5px', borderRadius: 4}}>{event.duration}</span>}
                      {event.detail && <span>{event.detail}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {teamSummary && teamSummary.length > 0 && (
            <div className="glass-card" style={{padding: '16px', cursor: 'default'}}>
              <h4 style={{fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6}}>
                📋 チーム別サマリー
              </h4>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)'}}>
                      <th style={{padding: '6px 8px', textAlign: 'left'}}>チーム</th>
                      <th style={{padding: '6px 8px'}}>試合数</th>
                      <th style={{padding: '6px 8px'}}>試合時間</th>
                      <th style={{padding: '6px 8px'}}>審判</th>
                      <th style={{padding: '6px 8px'}}>初戦</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamSummary.map((ts, idx) => (
                      <tr key={idx} style={{borderBottom: '1px solid var(--table-border)'}}>
                        <td style={{padding: '8px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-primary)'}}>{ts.team}</td>
                        <td style={{padding: '8px'}}>{ts.matches}</td>
                        <td style={{padding: '8px'}}>{ts.matchTime}</td>
                        <td style={{padding: '8px'}}>{ts.referee}</td>
                        <td style={{padding: '8px', color: 'var(--accent-color)', fontWeight: 'bold'}}>{ts.firstMatch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
              getTeam={getTeam}
              onClick={() => onMatchClick(match)}
              style={{cursor: isAdmin ? 'pointer' : 'default', opacity: 1}}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function calculateTimeDiff(scheduled, actual) {
  if (!scheduled || !actual) return null;
  const sParts = scheduled.split(':').map(Number);
  const aParts = actual.split(':').map(Number);
  if (sParts.length !== 2 || aParts.length !== 2 || isNaN(sParts[0]) || isNaN(aParts[0])) return null;
  const diff = (aParts[0] * 60 + aParts[1]) - (sParts[0] * 60 + sParts[1]);
  if (diff > 0) return { text: `(+${diff}分)`, color: '#f44336' };
  if (diff < 0) return { text: `(${diff}分)`, color: '#4caf50' };
  return { text: '(±0)', color: 'var(--text-secondary)' };
}

function MatchCard({ match, homeTeam, awayTeam, refereeTeam, refereePlayer, getPlayer, getTeam, onClick }) {

  // Chronological timeline of goals and cards
  const timelineEvents = [
    ...(match.goals || []).filter(g => g.teamId && g.scorerId).map(g => ({ ...g, kind: 'goal' })),
    ...(match.cards || []).filter(c => c.teamId && c.playerId).map(c => ({ ...c, kind: 'card' }))
  ].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="glass-card match-item" onClick={onClick}>
      <div className="match-header">
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

      {/* Unified Chronological Events Timeline */}
      {timelineEvents.length > 0 && (
        <div style={{
          marginTop: 4,
          padding: '6px 10px',
          background: 'var(--item-sub-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {timelineEvents.map((ev, idx) => {
            const team = ev.teamId === match.homeId ? homeTeam : ev.teamId === match.awayId ? awayTeam : (getTeam ? getTeam(ev.teamId) : null);
            if (ev.kind === 'goal') {
              const scorerName = ev.scorerId === 'own_goal' ? 'オウンゴール' : getPlayer(ev.scorerId)?.name;
              const assist = ev.assistId ? getPlayer(ev.assistId) : null;
              const typeStr = ev.type === 'pk' ? ' (PK)' : ev.type === 'fk' ? ' (FK)' : '';
              return (
                <div key={ev.id || `g_${idx}`} style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <span style={{color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: '14px'}}>#{idx + 1}</span>
                  <span>⚽ [{team?.name || '未定'}] {scorerName}{typeStr}{assist ? ` (A:${assist.name})` : ''}</span>
                </div>
              );
            } else {
              const p = getPlayer(ev.playerId);
              const cardBadge = ev.type === 'yellow' ? '🟨' : '🟥';
              return (
                <div key={ev.id || `c_${idx}`} style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <span style={{color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: '14px'}}>#{idx + 1}</span>
                  <span>{cardBadge} [{team?.name || '未定'}] {p ? p.name : '選手'}</span>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Referee Info Badge */}
      <div style={{
        marginTop: 4, 
        paddingTop: 8, 
        borderTop: '1px solid var(--border-subtle)', 
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
          if (g.scorerId && g.scorerId !== 'own_goal') {
            if (!stats[g.scorerId]) stats[g.scorerId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
            stats[g.scorerId].goals += 1;
          }
          if (g.assistId) {
            if (!stats[g.assistId]) stats[g.assistId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
            stats[g.assistId].assists += 1;
          }
        });
      }
      if (m.cards) {
        m.cards.forEach(c => {
          if (c.playerId) {
            if (!stats[c.playerId]) stats[c.playerId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
            if (c.type === 'yellow') stats[c.playerId].yellowCards += 1;
            if (c.type === 'red') stats[c.playerId].redCards += 1;
          }
        });
      }
    });

    return Object.keys(stats).map(playerId => {
      const player = members.find(m => m.id === playerId);
      const team = player ? getTeam(player.teamId) : null;
      const s = stats[playerId];
      const foulPoints = (s.yellowCards * 1) + (s.redCards * 2);
      return {
        id: playerId,
        name: player ? player.name : '不明',
        number: player ? player.number : '',
        teamId: player ? player.teamId : '',
        teamName: team ? team.name : '',
        teamEmoji: team ? team.emoji : '',
        goals: s.goals || 0,
        assists: s.assists || 0,
        yellowCards: s.yellowCards || 0,
        redCards: s.redCards || 0,
        foulPoints
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
  const cardRankings = [...personalList]
    .filter(p => p.yellowCards > 0 || p.redCards > 0)
    .sort((a, b) => {
      if (b.foulPoints !== a.foulPoints) return b.foulPoints - a.foulPoints;
      if (b.redCards !== a.redCards) return b.redCards - a.redCards;
      if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
      return (Number(a.number) || 9999) - (Number(b.number) || 9999);
    });

  // Calculate final tournament rankings
  const finalMatch = matches.find(m => m.stage === 'final');
  const thirdMatch = matches.find(m => m.stage === 'third_place');
  let first = '', second = '', third = '', fourth = '';
  
  if (finalMatch && finalMatch.status === 'finished') {
    if (finalMatch.homeScore > finalMatch.awayScore) {
      first = getTeam(finalMatch.homeId)?.name || '';
      second = getTeam(finalMatch.awayId)?.name || '';
    } else if (finalMatch.awayScore > finalMatch.homeScore) {
      first = getTeam(finalMatch.awayId)?.name || '';
      second = getTeam(finalMatch.homeId)?.name || '';
    } else {
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

  return (
    <div>
      <div className="tabs" style={{marginBottom: 16}}>
        <div className={`tab ${subTab === 'team' ? 'active' : ''}`} onClick={() => setSubTab('team')}>順位表</div>
        <div className={`tab ${subTab === 'goals' ? 'active' : ''}`} onClick={() => setSubTab('goals')}>得点王</div>
        <div className={`tab ${subTab === 'assists' ? 'active' : ''}`} onClick={() => setSubTab('assists')}>アシスト</div>
        <div className={`tab ${subTab === 'cards' ? 'active' : ''}`} onClick={() => setSubTab('cards')}>カード・反則</div>
      </div>

      {subTab === 'team' && (
        <>
          {(first || second || third || fourth) && (
            <div className="glass-card final-rankings-card">
              <h2 className="final-rankings-title">🏆 最終順位 🏆</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
                {first && (
                  <div className="final-rank-item rank-gold" style={{
                    fontSize: '1.8rem', 
                    fontWeight: '900', 
                    color: '#ffd700',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '400px',
                    border: '2px solid #ffd700',
                    boxShadow: '0 4px 16px rgba(255,215,0,0.2)'
                  }}>
                    🥇 優勝: {first}
                  </div>
                )}
                {second && (
                  <div className="final-rank-item rank-silver" style={{
                    fontSize: '1.4rem', 
                    fontWeight: 'bold', 
                    color: '#e0e0e0',
                    padding: '8px 24px',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '350px',
                    border: '1px solid #c0c0c0'
                  }}>
                    🥈 準優勝: {second}
                  </div>
                )}
                <div style={{display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: '400px'}}>
                  {third && (
                    <div className="final-rank-item rank-bronze" style={{
                      flex: 1,
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: '#cd7f32',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid #cd7f32'
                    }}>
                      🥉 3位: {third}
                    </div>
                  )}
                  {fourth && (
                    <div className="final-rank-item rank-fourth" style={{
                      flex: 1,
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: 'var(--text-secondary)',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      4位: {fourth}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div style={{marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>※予選リーグの成績表</div>
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
                <th>反則</th>
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
                  <td style={{fontSize: '0.82rem', whiteSpace: 'nowrap'}}>
                    {team.foulPoints > 0 ? (
                      <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center'}}>
                        <span style={{fontWeight: 'bold', color: 'var(--text-primary)'}}>{team.foulPoints}</span>
                        <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                          ({team.yellowCards > 0 && `🟨${team.yellowCards}`}{team.yellowCards > 0 && team.redCards > 0 ? ' ' : ''}{team.redCards > 0 && `🟥${team.redCards}`})
                        </span>
                      </span>
                    ) : (
                      <span style={{color: 'var(--text-secondary)'}}>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4}}>
          ※順位決定基準: ①勝点 ②得失点差 ③反則数(少ない順: 🟨1, 🟥2) ④総得点 ⑤直接対決 ⑥ジャンケン
        </div>
        </>
      )}

      {subTab === 'goals' && (
        <>
        <div style={{marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>※決勝・三位決定戦を含む全試合の合計得点</div>
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
        </>
      )}

      {subTab === 'assists' && (
        <>
        <div style={{marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>※決勝・三位決定戦を含む全試合の合計アシスト</div>
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
        </>
      )}

      {subTab === 'cards' && (
        <>
        <div style={{marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
          ※全試合のカード累積記録（反則数: 🟨イエロー 1, 🟥レッド 2）
        </div>
        <div className="table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{paddingLeft: '16px'}}>選手</th>
                <th>クラブ</th>
                <th>🟨 イエロー</th>
                <th>🟥 レッド</th>
                <th style={{paddingRight: '16px'}}>反則数</th>
              </tr>
            </thead>
            <tbody>
              {cardRankings.map((player) => (
                <tr key={player.id}>
                  <td style={{paddingLeft: '16px', textAlign: 'left'}}>
                    {player.number ? `[${player.number}] ` : ''}{player.name}
                  </td>
                  <td>{player.teamEmoji} {player.teamName}</td>
                  <td style={{fontWeight: player.yellowCards > 0 ? 'bold' : 'normal', color: player.yellowCards > 0 ? '#ffb300' : 'var(--text-secondary)'}}>
                    {player.yellowCards}
                  </td>
                  <td style={{fontWeight: player.redCards > 0 ? 'bold' : 'normal', color: player.redCards > 0 ? 'var(--danger)' : 'var(--text-secondary)'}}>
                    {player.redCards}
                  </td>
                  <td style={{fontWeight: 'bold', color: 'var(--danger)', paddingRight: '16px'}}>
                    {player.foulPoints}
                  </td>
                </tr>
              ))}
              {cardRankings.length === 0 && (
                <tr>
                  <td colSpan="5" style={{color: 'var(--text-secondary)', padding: '20px 0'}}>カードの記録はありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

    </div>
  );
}

function MasterPickerModal({ isOpen, onClose, teamName, masterPlayers, currentMembers, onAddPlayers }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const currentNames = new Set(currentMembers.map(m => (m.name || '').trim()));

  const filtered = (masterPlayers || []).filter(p => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || String(p.number || '').includes(q);
  });

  const toggleSelect = (p) => {
    const isRegistered = currentNames.has((p.name || '').trim());
    if (isRegistered) return;
    const pid = p.id || p.name;
    if (selectedIds.includes(pid)) {
      setSelectedIds(selectedIds.filter(id => id !== pid));
    } else {
      setSelectedIds([...selectedIds, pid]);
    }
  };

  const handleConfirm = () => {
    const toAdd = (masterPlayers || []).filter(p => selectedIds.includes(p.id || p.name));
    onAddPlayers(toAdd);
    setSelectedIds([]);
    onClose();
  };

  const handleAddSingle = (p) => {
    onAddPlayers([p]);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
          borderRadius: 16, padding: 24, width: 560, maxWidth: '100%',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'var(--pill-bg)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', cursor: 'pointer', padding: 6,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="閉じる"
        >
          <X size={20} />
        </button>

        <h3 style={{margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '1.15rem'}}>
          📋 過去から追加
        </h3>
        <p style={{margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
          【{teamName}】の過去大会参加メンバー（{masterPlayers.length}名）から選択
        </p>

        {/* Search */}
        <div style={{marginBottom: 14}}>
          <input
            type="text"
            className="search-input-box"
            placeholder="🔍 氏名・背番号で絞り込み..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Players List */}
        <div style={{flex: 1, overflowY: 'auto', minHeight: 180, maxHeight: 380, paddingRight: 4}}>
          {filtered.length === 0 ? (
            <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 0'}}>
              該当するメンバーが見つかりません
            </div>
          ) : (
            filtered.map(p => {
              const pid = p.id || p.name;
              const isRegistered = currentNames.has((p.name || '').trim());
              const isSelected = selectedIds.includes(pid);
              return (
                <div
                  key={pid}
                  className={`picker-player-item ${isSelected ? 'selected' : ''} ${isRegistered ? 'disabled' : ''}`}
                  onClick={() => toggleSelect(p)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected || isRegistered}
                    disabled={isRegistered}
                    onChange={() => {}}
                    style={{width: 18, height: 18, cursor: isRegistered ? 'not-allowed' : 'pointer'}}
                  />
                  <div className="badge-number">
                    {p.number || '-'}
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                      <span style={{fontWeight: 'bold', color: isRegistered ? 'var(--text-muted)' : 'var(--text-primary)'}}>
                        {p.name}
                      </span>
                      {isRegistered && (
                        <span style={{fontSize: '0.72rem', background: 'var(--pill-bg)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4}}>
                          登録済
                        </span>
                      )}
                      {p.isNakano && <span className="badge-nakano">中野区</span>}
                      {p.referee && <span className="badge-referee">{p.referee}</span>}
                    </div>
                    <div style={{fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2}}>
                      {p.age && <span>{p.age}歳</span>}
                      {p.memo && <span style={{marginLeft: 6, opacity: 0.8}}>※{p.memo}</span>}
                    </div>
                  </div>
                  {!isRegistered && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSingle(p);
                      }}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--accent-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}
                    >
                      ＋ 追加
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--glass-border)'}}>
          <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            選択中: <strong style={{color: 'var(--accent-color)'}}>{selectedIds.length}</strong> 名
          </span>
          <div style={{display: 'flex', gap: 8}}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.88rem'
              }}
            >
              閉じる
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="btn btn-primary"
              style={{
                padding: '8px 18px', width: 'auto', marginBottom: 0,
                opacity: selectedIds.length === 0 ? 0.5 : 1,
                cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              選択した選手を追加 ({selectedIds.length}名)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamsView({ teams, members, setMembers, isAdmin, masterMembers = {}, onUpdateTeamMaster }) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editBirth, setEditBirth] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editReferee, setEditReferee] = useState('');
  const [editIsNakano, setEditIsNakano] = useState(false);
  const [checkMode, setCheckMode] = useState(false);
  const [checkBackup, setCheckBackup] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const currTeam = teams.find(t => t.id === selectedTeam);
  const currTeamKey = cleanTeamKey(currTeam?.name);
  const currMasterPlayers = masterMembers[currTeamKey] || [];

  const toDateInputValue = (birthStr) => {
    if (!birthStr) return '';
    const clean = String(birthStr).replace(/[年月日]/g, '-').replace(/\//g, '-');
    const parts = clean.split('-').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const y = parts[0].padStart(4, '0');
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    } else if (parts.length === 2) {
      const y = parts[0].padStart(4, '0');
      const m = parts[1].padStart(2, '0');
      return `${y}-${m}-01`;
    }
    return '';
  };

  const handleCalendarDateChange = (val) => {
    if (!val) {
      setEditBirth('');
      return;
    }
    const formatted = val.replace(/-/g, '/');
    setEditBirth(formatted);
    const calculatedAge = calculateAgeFromBirth(formatted);
    if (calculatedAge !== '') {
      setEditAge(String(calculatedAge));
    }
  };

  const handleClearBirth = () => {
    setEditBirth('');
  };

  const teamMembers = members.filter(m => m.teamId === selectedTeam).sort((a, b) => {
    if (a.id === editingMember) return -1;
    if (b.id === editingMember) return 1;
    return Number(a.number) - Number(b.number);
  });
  const checkedCount = teamMembers.filter(m => m.checked).length;

  const startEdit = (member) => {
    setEditingMember(member.id);
    setEditName(member.name);
    setEditNumber(member.number || '');
    const bStr = member.birth || '';
    setEditBirth(bStr);
    setEditAge(member.age !== undefined && member.age !== null && member.age !== '' ? String(member.age) : (bStr ? String(calculateAgeFromBirth(bStr)) : ''));
    setEditReferee(member.referee || '');
    setEditIsNakano(member.isNakano || member.isResident || member.isWorker || false);
  };

  const handleNameChange = (val) => {
    setEditName(val);
    const matched = currMasterPlayers.find(p => (p.name || '').trim() === val.trim());
    if (matched) {
      if (matched.number && !editNumber) setEditNumber(matched.number);
      if (matched.birth) {
        setEditBirth(matched.birth);
        const a = calculateAgeFromBirth(matched.birth);
        if (a !== '') setEditAge(String(a));
        else if (matched.age) setEditAge(String(matched.age));
      } else if (matched.age && !editAge) {
        setEditAge(String(matched.age));
      }
      if (matched.referee) setEditReferee(matched.referee);
      if (typeof matched.isNakano === 'boolean') setEditIsNakano(matched.isNakano);
    }
  };

  const saveEdit = (id) => {
    const cleanBirth = editBirth.trim();
    const updatedMember = {
      name: editName.trim(),
      number: editNumber.trim(),
      birth: cleanBirth,
      age: editAge ? parseInt(editAge, 10) : (cleanBirth ? calculateAgeFromBirth(cleanBirth) : ''),
      referee: editReferee.trim(),
      isNakano: editIsNakano,
      isResident: false,
      isWorker: false
    };

    setMembers(members.map(m => m.id === id ? { ...m, ...updatedMember } : m));
    setEditingMember(null);

    // Sync back to master database
    if (onUpdateTeamMaster && currTeamKey && editName.trim()) {
      const existingMasterIdx = currMasterPlayers.findIndex(p => (p.name || '').trim() === editName.trim());
      let newMasterList;
      if (existingMasterIdx >= 0) {
        newMasterList = [...currMasterPlayers];
        newMasterList[existingMasterIdx] = {
          ...newMasterList[existingMasterIdx],
          number: editNumber.trim() || newMasterList[existingMasterIdx].number,
          birth: cleanBirth || newMasterList[existingMasterIdx].birth,
          age: editAge ? parseInt(editAge, 10) : newMasterList[existingMasterIdx].age,
          referee: editReferee.trim() || newMasterList[existingMasterIdx].referee,
          isNakano: editIsNakano
        };
      } else {
        newMasterList = [
          ...currMasterPlayers,
          {
            id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            number: editNumber.trim(),
            name: editName.trim(),
            birth: cleanBirth,
            age: editAge ? parseInt(editAge, 10) : '',
            referee: editReferee.trim(),
            isNakano: editIsNakano,
            memo: 'メンバー表から同期'
          }
        ];
      }
      onUpdateTeamMaster(currTeamKey, newMasterList);
    }
  };

  const cancelEdit = (id) => {
    const original = members.find(m => m.id === id);
    if (original && original.name === '新規選手') {
      setMembers(members.filter(m => m.id !== id));
    }
    setEditingMember(null);
  };

  const deleteMember = (id) => {
    if(window.confirm('本当に削除しますか？')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const addNewMember = () => {
    const newId = 'p' + Date.now();
    setMembers([...members, { id: newId, teamId: selectedTeam, name: '新規選手', number: '', birth: '', age: '', referee: '', isNakano: false }]);
    setEditingMember(newId);
    setEditName('');
    setEditNumber('');
    setEditBirthYear('');
    setEditBirthMonth('');
    setEditBirthDay('');
    setEditAge('');
    setEditReferee('');
    setEditIsNakano(false);
  };

  const handleAddFromMaster = (selectedPlayers) => {
    const newMembers = selectedPlayers.map((p, idx) => ({
      id: 'p' + (Date.now() + idx) + '_' + Math.random().toString(36).substr(2, 4),
      teamId: selectedTeam,
      name: p.name,
      number: p.number || '',
      birth: p.birth || '',
      age: p.age || (p.birth ? calculateAgeFromBirth(p.birth) : ''),
      referee: p.referee || '',
      isNakano: Boolean(p.isNakano),
      checked: false
    }));
    setMembers([...members, ...newMembers]);
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
            style={{flex: '0 0 auto', padding: '8px 16px', background: selectedTeam === team.id ? 'var(--accent-color)' : 'var(--tabs-bg)', border: selectedTeam === team.id ? '1px solid transparent' : '1px solid var(--glass-border)', color: selectedTeam === team.id ? '#ffffff' : 'var(--text-secondary)'}}
          >
            {team.emoji} {team.name}
          </div>
        ))}
      </div>

      <div className="glass-card" style={{marginTop: 16}}>
        {/* ヘッダー */}
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16}}>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {!editingMember && isAdmin && !checkMode && !deleteMode && (
              <>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '8px 14px', width: 'auto', marginBottom: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                  onClick={() => setShowPicker(true)}
                  title="過去の大会参加メンバーから選択して追加"
                >
                  <UserPlus size={16} /> 過去から追加
                </button>
                <button
                  className="btn btn-primary"
                  style={{padding: '8px 14px', width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4}}
                  onClick={addNewMember}
                >
                  <Plus size={16} /> 新規追加
                </button>
              </>
            )}
            {!editingMember && isAdmin && !checkMode && (
              <button
                onClick={() => { setDeleteMode(!deleteMode); setEditingMember(null); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  background: deleteMode ? 'transparent' : 'var(--pill-bg)',
                  border: deleteMode ? '1px solid var(--border-subtle)' : '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                {deleteMode ? '❌ キャンセル' : <><Trash2 size={16} /> 削除</>}
              </button>
            )}
            {!editingMember && isAdmin && !deleteMode && (
              <>
                {checkMode && (
                  <button
                    onClick={() => {
                      if (checkBackup) {
                        setMembers(checkBackup);
                      }
                      setCheckMode(false);
                      setCheckBackup(null);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    ❌ キャンセル
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!checkMode) {
                      setCheckBackup(members);
                      setCheckMode(true);
                      setEditingMember(null);
                    } else {
                      setCheckMode(false);
                      setCheckBackup(null);
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    width: 'auto',
                    marginBottom: 0,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    background: checkMode ? 'var(--accent-color)' : 'var(--pill-bg)',
                    color: checkMode ? '#fff' : 'var(--text-primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {checkMode ? '✅ 完了' : '✅ メンバーチェック'}
                </button>
              </>
            )}
            {editingMember && (
              <>
                <button
                  onClick={() => cancelEdit(editingMember)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    background: 'var(--glass-bg)',
                    color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  ❌ キャンセル
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
          </div>
        </div>

        {/* 進捗バー（常時表示） */}
        <div style={{marginBottom: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
            <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>登録メンバー</span>
            <span style={{fontSize: '0.9rem', fontWeight: 'bold', color: checkedCount === teamMembers.length && teamMembers.length > 0 ? '#4caf50' : 'var(--accent-color)'}}>
              {checkedCount} / {teamMembers.length} 名
            </span>
          </div>
          <div style={{background: 'var(--border-subtle)', borderRadius: 99, height: 8, overflow: 'hidden'}}>
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
                  ? 'var(--checked-bg)'
                  : 'var(--item-sub-bg)',
                border: checkMode && member.checked
                  ? '1px solid var(--checked-border)'
                  : '1px solid var(--border-subtle)',
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
                  border: `2px solid ${member.checked ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                  background: member.checked ? 'var(--accent-color)' : 'transparent',
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
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%', alignItems: 'center'}}>
                    <input 
                      type="number" 
                      value={editNumber} 
                      onChange={e => setEditNumber(e.target.value)}
                      placeholder="No"
                      className="edit-input"
                      style={{width: 60, flexShrink: 0}}
                    />
                    <input 
                      type="text" 
                      list="team-master-names"
                      value={editName} 
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder="名前 (過去選手を候補表示)"
                      className="edit-input"
                      style={{flex: '1 1 140px', minWidth: 120}}
                    />
                    <datalist id="team-master-names">
                      {currMasterPlayers.map(p => (
                        <option key={p.id || p.name} value={p.name}>
                          No.{p.number || '-'} {p.age ? `(${p.age}歳)` : ''} {p.referee || ''}
                        </option>
                      ))}
                    </datalist>

                    {/* 生年月日 カレンダーから選択 */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--item-sub-bg)',
                      padding: '3px 8px',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <span style={{fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap'}}>📅 生年月日:</span>
                      <input 
                        type="date" 
                        value={toDateInputValue(editBirth)} 
                        onChange={e => handleCalendarDateChange(e.target.value)}
                        className="edit-input"
                        style={{
                          padding: '4px 6px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          colorScheme: 'dark light'
                        }}
                        title="カレンダーから生年月日を選択（年齢が自動計算されます）"
                      />
                      {editBirth && (
                        <button
                          type="button"
                          onClick={handleClearBirth}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            fontSize: '0.85rem',
                            lineHeight: 1
                          }}
                          title="生年月日をクリアして年齢を手動入力可能にする"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 年齢 (生年月日未入力時のみ手動入力可能) */}
                    <div style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                      <input 
                        type="number" 
                        value={editAge} 
                        onChange={e => setEditAge(e.target.value)}
                        disabled={Boolean(editBirth)}
                        placeholder="年齢"
                        className="edit-input"
                        style={{
                          width: 65,
                          flexShrink: 0,
                          opacity: editBirth ? 0.75 : 1,
                          cursor: editBirth ? 'not-allowed' : 'text',
                          background: editBirth ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)'
                        }}
                        title={editBirth ? '生年月日から自動計算されています（生年月日未入力時のみ手動入力可能）' : '生年月日が未入力のため、手動で年齢を入力できます'}
                      />
                      <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>歳</span>
                      {editBirth && (
                        <span style={{fontSize: '0.72rem', color: 'var(--accent-color)', whiteSpace: 'nowrap'}}>
                          (自動)
                        </span>
                      )}
                    </div>

                    <select 
                      value={editReferee} 
                      onChange={e => setEditReferee(e.target.value)}
                      className="edit-input"
                      style={{flex: '1 1 100px', minWidth: 90}}
                    >
                      <option value="">(審判資格)</option>
                      <option value="4級">4級</option>
                      <option value="3級">3級</option>
                    </select>
                  </div>
                  <div style={{display: 'flex', gap: 16, width: '100%', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'}}>
                      <input type="checkbox" checked={editIsNakano} onChange={e => setEditIsNakano(e.target.checked)} />
                      中野区(在住・在勤)
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{display: 'flex', gap: 16, flex: 1, alignItems: 'center'}}>
                  <div style={{
                    width: 36,
                    color: checkMode && member.checked ? '#4caf50' : 'var(--text-secondary)',
                    fontWeight: 'bold'
                  }}>{member.number || '-'}</div>
                  <div style={{
                    flex: 1,
                    fontWeight: checkMode && member.checked ? 'bold' : 'normal',
                    color: checkMode && member.checked ? 'var(--checked-text)' : 'inherit'
                  }}>
                    {member.name}
                    {member.age && <span style={{marginLeft: 8, fontSize: '0.85rem', color: checkMode && member.checked ? 'inherit' : 'var(--text-secondary)'}}>{member.age}歳</span>}
                    {!checkMode && member.referee && <span style={{marginLeft: 8, fontSize: '0.75rem', background: 'var(--pill-bg)', border: '1px solid var(--glass-border)', padding: '2px 6px', borderRadius: 4, color: 'var(--pill-text)'}}>{member.referee}</span>}
                    {!checkMode && (member.isNakano || member.isResident || member.isWorker) && <span style={{marginLeft: 8, fontSize: '0.7rem', background: '#e91e63', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold'}}>中野</span>}
                  </div>
                  {!checkMode && (
                    <>
                      {/* チェック済みバッジ */}
                      {member.checked && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          background: 'var(--checked-bg)',
                          border: '1px solid var(--checked-border)',
                          borderRadius: 99,
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          color: 'var(--checked-text)',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          <Check size={11} /> 確認済
                        </div>
                      )}
                      {isAdmin && (
                        <>
                          {!deleteMode && !editingMember && (
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
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
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

      {/* 過去メンバーピッカーモーダル */}
      <MasterPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        teamName={currTeam?.name || ''}
        masterPlayers={currMasterPlayers}
        currentMembers={teamMembers}
        onAddPlayers={handleAddFromMaster}
      />
    </div>
  );
}

function RulesView({ handlePrint, setActiveTab }) {
  return (
    <div className="glass-card" style={{padding: 24, paddingBottom: 64}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                background: 'var(--pill-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              ← 戻る
            </button>
          )}
          <h2 style={{margin: 0, color: 'var(--text-primary)'}}>大会ルール</h2>
        </div>
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
        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■基本情報</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・形式：8人制(8対8)</li>
          <li>・交代：自由交代制</li>
          <li>・ボール：5号球</li>
          <li>・ルール：通常のサッカーに準拠(オフサイドあり)</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■ルール概要(通常サッカーとの差異)</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・フリーキック時は、壁の人数に関わらず攻撃側は壁から1m離れる(キック時に離れていなければファールとして笛を吹く)</li>
          <li>・フリーキック時の距離は7m離れる</li>
          <li>・スローイン時の距離は2m離れる</li>
          <li>・キックオフシュートは禁止</li>
          <li>・禁止事項(イエローまたは、レッドカードを提示する)</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>①スライディングでの接触(キーパーを含む)</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>②後ろからの接触</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>③相手が激しく倒れるくらいのショルダーチャージは後ろからでなくてもファールとする</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>④キーパーへの激しい接触</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>⑤暴言、遅延行為</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■間違いやすいルール</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・ゴールキックでは、オフサイドはなし</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■秒数制限</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・GKがペナルティーエリア内でボールを手で保持できる秒数は8秒</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>※反則時：相手コーナーキック</li>
          <li>・ゴールキック、スローインで、遅延行為があった場合、5秒カウントする</li>
          <li style={{paddingLeft: 16, color: 'var(--text-secondary)'}}>※反則時：ゴールキック→相手コーナーキック、スローイン→相手スローイン</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■試合開始前</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・審判、相手をリスペクトするため、全員と握手してから試合を開始する</li>
          <li>・各チーム1つ試合球を出し、4つで大会を運営する</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■選手交代(流れ)</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・入場選手は四審に交代を宣告</li>
          <li>・退場選手への呼びかけは、審判でなくチームで行う</li>
          <li>・退場選手は近くのタッチラインより退場する（位置は不問）</li>
          <li>・入場選手は交代エリアより入場する</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■選手交代(注意点)</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・交代は試合を止めずに交代する</li>
          <li>・交代者INは交代者OUTがコートから出てからコートへ入ること</li>
          <li>・ゲーム中のキーパーの交代はなし(怪我の場合は除く)</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■審判体制（資格不問）</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・主審 1名</li>
          <li>・副審 2名</li>
          <li>・四審 1名以上</li>
          <li>・ＢＰ 2～3名</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■四審の役割</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・得点、アシスト、警告、退場、試合結果　※交代者のメモは不要</li>
          <li>・交代のOUTとINの管理</li>
          <li>・途中参加者の服装チェック</li>
          <li>・本部側でのボールだし</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■試合終了後</h3>
        <ul style={{listStyle: 'none', paddingLeft: 0, marginBottom: 24}}>
          <li>・代表者は本部にて試合結果をチェック(得点、アシスト、 🟨、 🟥)</li>
        </ul>

        <h3 style={{fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12, color: 'var(--accent-color)'}}>■予選で同順位の場合</h3>
        <div style={{paddingLeft: 0, marginBottom: 24}}>
          <div>①勝ち点(勝ち3点、引分1点、負け0点)</div>
          <div>②得失点差</div>
          <div>③反則数(少ない順: 🟨1, 🟥2)</div>
          <div>④総得点</div>
          <div>⑤直接対決の結果</div>
          <div>⑥ジャンケン</div>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8}}>※①から順番に判断する</div>
        </div>
      </div>
    </div>
  );
}

export default App;
