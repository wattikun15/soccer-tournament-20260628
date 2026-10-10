// 10/11(日)中野区ミニサッカー 一般大会@白鷺せせらぎ公園
export const initialTeams = [
  { id: 't1', name: 'OneKameido', emoji: '🐢' },
  { id: 't2', name: 'ミナミダイFC', emoji: '🦉' },
  { id: 't3', name: 'GA', emoji: '🦁' },
  { id: 't4', name: 'ケンFC', emoji: '🦅' }
];

export const initialMembers = [];

export const initialMatches = [
  { id: 'm1', stage: 'league', date: '09:15', homeId: 't1', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第1試合', refereeTeamId: 't2', refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm2', stage: 'league', date: '09:42', homeId: 't2', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第2試合', refereeTeamId: 't3', refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm3', stage: 'league', date: '10:09', homeId: 't1', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第3試合', refereeTeamId: 't2', refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm4', stage: 'league', date: '10:36', homeId: 't2', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第4試合', refereeTeamId: 't4', refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm5', stage: 'league', date: '11:03', homeId: 't3', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第5試合', refereeTeamId: 't1', refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm6', stage: 'league', date: '11:30', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第6試合', refereeTeamId: 't3', refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm7', stage: 'third_place', date: '11:59', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '三位決定戦', refereeTeamId: null, refereePlayerId: null, goals: [], cards: [], fouls: [] },
  { id: 'm8', stage: 'final', date: '12:26', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝戦', refereeTeamId: null, refereePlayerId: null, goals: [], cards: [], fouls: [] }
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
    yellowCards: 0,
    redCards: 0,
    foulPoints: 0,
    fouls: 0,
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

    if (match.cards && Array.isArray(match.cards)) {
      match.cards.forEach(c => {
        const team = standings.find(t => t.id === c.teamId);
        if (team) {
          if (c.type === 'red') {
            team.redCards += 1;
            team.foulPoints += 6;
          } else {
            team.yellowCards += 1;
            team.foulPoints += 3;
          }
        }
      });
    }

    if (match.fouls && Array.isArray(match.fouls)) {
      match.fouls.forEach(f => {
        const team = standings.find(t => t.id === f.teamId);
        if (team) {
          team.fouls += 1;
          team.foulPoints += 1;
        }
      });
    }
  });

  return standings.map(t => ({
    ...t,
    goalDifference: t.goalsFor - t.goalsAgainst
  })).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (a.foulPoints !== b.foulPoints) return a.foulPoints - b.foulPoints;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });
};

export const initialTimetable = [
  { time: '08:45',          label: '集合（代表の方）',        detail: 'メンバー表の提出、背番号、ユニフォームの確認' },
  { time: '09:00 - 09:05',  label: '開場・準備・アップ',      duration: '5m' },
  { time: '09:05 - 09:10',  label: '開会式',                  duration: '5m' },
  { time: '09:10 - 09:15',  label: '予選 第1試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '09:15 - 09:37',  label: '予選 第1試合',            duration: '22m', detail: 'OneKameido vs GA　審判：ミナミダイFC (前半10分-HT2分-後半10分)' },
  { time: '09:37 - 09:42',  label: '予選 第2試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '09:42 - 10:04',  label: '予選 第2試合',            duration: '22m', detail: 'ミナミダイFC vs ケンFC（連戦）　審判：GA' },
  { time: '10:04 - 10:09',  label: '予選 第3試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '10:09 - 10:31',  label: '予選 第3試合',            duration: '22m', detail: 'OneKameido vs ケンFC（連戦）　審判：ミナミダイFC' },
  { time: '10:31 - 10:36',  label: '予選 第4試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '10:36 - 10:58',  label: '予選 第4試合',            duration: '22m', detail: 'ミナミダイFC vs GA（連戦）　審判：ケンFC' },
  { time: '10:58 - 11:03',  label: '予選 第5試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '11:03 - 11:25',  label: '予選 第5試合',            duration: '22m', detail: 'GA（連戦） vs ケンFC　審判：OneKameido' },
  { time: '11:25 - 11:30',  label: '予選 第6試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '11:30 - 11:52',  label: '予選 第6試合',            duration: '22m', detail: 'OneKameido vs ミナミダイFC　審判：GA' },
  { time: '11:52 - 11:54',  label: '写真撮影',                duration: '2m', detail: '※区、協会への報告、HP用' },
  { time: '11:54 - 11:59',  label: '三位決定戦【準備】',      duration: '5m', detail: '※メンバーチェック含む' },
  { time: '11:59 - 12:21',  label: '三位決定戦',              duration: '22m', detail: '予選3位 vs 予選4位　審判：予選2位' },
  { time: '12:21 - 12:26',  label: '決勝戦【準備】',          duration: '5m', detail: '※メンバーチェック含む' },
  { time: '12:26 - 12:48',  label: '決勝戦',                  duration: '22m', detail: '予選1位 vs 予選2位　審判：予選4位' },
  { time: '12:48 - 12:50',  label: '予備時間',                duration: '2m' },
  { time: '12:50 - 13:00',  label: '片づけ・撤収',            duration: '10m' },
];

export const teamSummary = [
  { team: 'ミナミダイFC', matches: 4, matchTime: '80分', referee: '2〜3回', firstMatch: '09:37' },
  { team: 'GA', matches: 4, matchTime: '80分', referee: '2〜3回', firstMatch: '09:10' },
  { team: 'ケンFC', matches: 4, matchTime: '80分', referee: '1〜2回', firstMatch: '09:37' },
  { team: 'OneKameido', matches: 4, matchTime: '80分', referee: '1〜2回', firstMatch: '09:10' }
];
