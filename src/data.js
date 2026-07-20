export const initialTeams = [
  { id: 't3', name: 'GA', emoji: '🦁' },
  { id: 't4', name: 'ミナミダイFC', emoji: '🔴' },
  { id: 't1', name: 'CISCO', emoji: '🟦' },
  { id: 't2', name: 'One Kameido', emoji: '🐢' }
];

export const initialMembers = [];

export const initialMatches = [
  { id: 'm1', stage: 'league', date: '13:10', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第1試合', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm2', stage: 'league', date: '13:37', homeId: 't3', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第2試合', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm3', stage: 'league', date: '14:04', homeId: 't2', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第3試合', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm4', stage: 'league', date: '14:31', homeId: 't1', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第4試合', refereeTeamId: 't4', refereePlayerId: null, goals: [] },
  { id: 'm5', stage: 'league', date: '14:58', homeId: 't1', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第5試合', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm6', stage: 'league', date: '15:25', homeId: 't2', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第6試合', refereeTeamId: 't4', refereePlayerId: null, goals: [] },
  { id: 'm7', stage: 'third_place', date: '15:54', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '三位決定戦', refereeTeamId: null, refereePlayerId: null, goals: [] },
  { id: 'm8', stage: 'final', date: '16:21', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝戦', refereeTeamId: null, refereePlayerId: null, goals: [] }
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
  { time: '12:55 - 13:00',  label: '開場・準備・アップ',      duration: '5m' },
  { time: '13:00 - 13:05',  label: '開会式',                  duration: '5m' },
  { time: '13:05 - 13:10',  label: '予選 第1試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '13:10 - 13:32',  label: '予選 第1試合',            duration: '22m', detail: 'CISCO vs One Kameido　審判：GA (前半10分-HT2分-後半10分)' },
  { time: '13:32 - 13:37',  label: '予選 第2試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '13:37 - 13:59',  label: '予選 第2試合',            duration: '22m', detail: 'GA vs ミナミダイFC　審判：CISCO' },
  { time: '13:59 - 14:04',  label: '予選 第3試合【準備】',    duration: '5m' },
  { time: '14:04 - 14:26',  label: '予選 第3試合',            duration: '22m', detail: 'One Kameido vs ミナミダイFC　審判：GA' },
  { time: '14:26 - 14:31',  label: '予選 第4試合【準備】',    duration: '5m' },
  { time: '14:31 - 14:53',  label: '予選 第4試合',            duration: '22m', detail: 'CISCO vs GA　審判：ミナミダイFC' },
  { time: '14:53 - 14:58',  label: '予選 第5試合【準備】',    duration: '5m' },
  { time: '14:58 - 15:20',  label: '予選 第5試合',            duration: '22m', detail: 'CISCO vs ミナミダイFC　審判：One Kameido' },
  { time: '15:20 - 15:25',  label: '予選 第6試合【準備】',    duration: '5m' },
  { time: '15:25 - 15:47',  label: '予選 第6試合',            duration: '22m', detail: 'One Kameido vs GA　審判：ミナミダイFC' },
  { time: '15:47 - 15:49',  label: '写真撮影',                duration: '2m', detail: '区・協会への報告、HP用' },
  { time: '15:49 - 15:54',  label: '三位決定戦【準備】',      duration: '5m' },
  { time: '15:54 - 16:16',  label: '三位決定戦',              duration: '22m', detail: '予選3位 vs 予選4位　審判：予選2位' },
  { time: '16:16 - 16:21',  label: '決勝戦【準備】',          duration: '5m' },
  { time: '16:21 - 16:43',  label: '決勝戦',                  duration: '22m', detail: '予選1位 vs 予選2位　審判：予選4位' },
  { time: '16:43 - 16:45',  label: '予備時間',                duration: '2m' },
  { time: '16:45 - 17:00',  label: '片づけ・撤収',            duration: '15m' },
];
