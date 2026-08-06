export const initialTeams = [
  { id: 't1', name: 'GA', emoji: '🦁' },
  { id: 't2', name: 'ケンFC', emoji: '🦅' },
  { id: 't3', name: 'TMG FC', emoji: '🐺' },
  { id: 't4', name: 'OFC', emoji: '🦉' }
];

export const initialMembers = [];

export const initialMatches = [
  { id: 'm1', stage: 'league', date: '13:15', homeId: 't4', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第1試合', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm2', stage: 'league', date: '13:42', homeId: 't1', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第2試合', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm3', stage: 'league', date: '14:09', homeId: 't4', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第3試合', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm4', stage: 'league', date: '14:34', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第4試合', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm5', stage: 'league', date: '15:01', homeId: 't4', awayId: 't1', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第5試合', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm6', stage: 'league', date: '15:26', homeId: 't2', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第6試合', refereeTeamId: 't4', refereePlayerId: null, goals: [] },
  { id: 'm7', stage: 'third_place', date: '15:55', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '三位決定戦', refereeTeamId: null, refereePlayerId: null, goals: [] },
  { id: 'm8', stage: 'final', date: '16:22', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝戦', refereeTeamId: null, refereePlayerId: null, goals: [] }
];

// Helper to calculate standings
export const calculateStandings = (teams, matches) => {
  const standings = teams.map(team => ({
    ...team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));

  matches.filter(m => m.stage === 'league' && m.status === 'finished').forEach(match => {
    const home = standings.find(t => t.id === match.homeId);
    const away = standings.find(t => t.id === match.awayId);

    if (home && away) {
      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        home.points += 1;
        away.drawn += 1;
        away.points += 1;
      }
    }
  });

  return standings.map(t => ({
    ...t,
    goalDifference: t.goalsFor - t.goalsAgainst
  })).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
};

export const initialTimetable = [
  { time: '12:45',          label: '集合（代表の方）',        detail: 'メンバー表の提出、背番号、ユニフォームの確認' },
  { time: '13:00 - 13:05',  label: '開場・準備・アップ',      duration: '5m' },
  { time: '13:05 - 13:10',  label: '開会式',                  duration: '5m' },
  { time: '13:10 - 13:15',  label: '予選 第1試合【準備】',    duration: '5m', detail: 'メンバーチェック・挨拶含む' },
  { time: '13:15 - 13:37',  label: '予選 第1試合',            duration: '22m', detail: 'OFC vs ケンFC　審判：GA (前半10分-HT2分-後半10分)' },
  { time: '13:37 - 13:42',  label: '予選 第2試合【準備】',    duration: '5m', detail: 'メンバーチェック・挨拶含む' },
  { time: '13:42 - 14:04',  label: '予選 第2試合',            duration: '22m', detail: 'GA vs TMG FC（連戦）　審判：ケンFC' },
  { time: '14:04 - 14:09',  label: '予選 第3試合【準備】',    duration: '5m', detail: '挨拶含む' },
  { time: '14:09 - 14:31',  label: '予選 第3試合',            duration: '22m', detail: 'OFC vs TMG FC（連戦）　審判：GA' },
  { time: '14:31 - 14:34',  label: '予選 第4試合【準備】',    duration: '3m', detail: '挨拶含む' },
  { time: '14:34 - 14:56',  label: '予選 第4試合',            duration: '22m', detail: 'GA（連戦） vs ケンFC　審判：TMG FC' },
  { time: '14:56 - 15:01',  label: '予選 第5試合【準備】',    duration: '5m', detail: '挨拶含む' },
  { time: '15:01 - 15:23',  label: '予選 第5試合',            duration: '22m', detail: 'OFC vs GA（連戦）　審判：ケンFC' },
  { time: '15:23 - 15:26',  label: '予選 第6試合【準備】',    duration: '3m', detail: '挨拶含む' },
  { time: '15:26 - 15:48',  label: '予選 第6試合',            duration: '22m', detail: 'ケンFC vs TMG FC　審判：OFC' },
  { time: '15:48 - 15:50',  label: '写真撮影',                duration: '2m', detail: '区・協会への報告、HP用' },
  { time: '15:50 - 15:55',  label: '三位決定戦【準備】',      duration: '5m' },
  { time: '15:55 - 16:17',  label: '三位決定戦',              duration: '22m', detail: '予選3位 vs 予選4位　審判：予選2位' },
  { time: '16:17 - 16:22',  label: '決勝戦【準備】',          duration: '5m' },
  { time: '16:22 - 16:44',  label: '決勝戦',                  duration: '22m', detail: '予選1位 vs 予選2位　審判：予選4位' },
  { time: '16:44 - 16:46',  label: '閉会式',                  duration: '2m' },
  { time: '16:46 - 16:50',  label: '予備時間',                duration: '4m' },
  { time: '16:50 - 17:00',  label: '片づけ・撤収',            duration: '10m' },
];
