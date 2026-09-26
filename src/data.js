// 9/27(日)中野区ミニサッカー シニア大会@本五ふれあい公園
export const initialTeams = [
  { id: 't1', name: 'GA', emoji: '🦁' },
  { id: 't2', name: 'ケンFC', emoji: '🦅' },
  { id: 't3', name: '百式', emoji: '🏯' },
  { id: 't4', name: 'かきっぱち', emoji: '🐿️' }
];

export const initialMembers = [
  // GA (t1)
  { id: 'ga_01', teamId: 't1', number: '15', name: '松尾 航', birth: '1979/01', age: '47', isNakano: true, referee: '4級', checked: false },
  { id: 'ga_02', teamId: 't1', number: '16', name: '出本 篤', birth: '1979/04', age: '47', isNakano: true, referee: '4級', checked: false },
  { id: 'ga_03', teamId: 't1', number: '09', name: '熊崎 拓', birth: '1983/05', age: '43', isNakano: false, referee: '4級', notes: '12時まで', checked: false },
  { id: 'ga_04', teamId: 't1', number: '08', name: '西部 暁', birth: '1980/05', age: '46', isNakano: false, referee: '', checked: false },
  { id: 'ga_05', teamId: 't1', number: '04', name: '小嶋 勝也', birth: '1979/10', age: '46', isNakano: false, referee: '', notes: '12時まで', checked: false },
  { id: 'ga_06', teamId: 't1', number: '05', name: '小峰 隆弘', birth: '1980/09', age: '46', isNakano: false, referee: '', checked: false },
  { id: 'ga_07', teamId: 't1', number: '18', name: '馬場 浩平', birth: '1985/06', age: '41', isNakano: true, referee: '', checked: false },
  { id: 'ga_08', teamId: 't1', number: '03', name: '大門 唯', birth: '1979/04', age: '47', isNakano: false, referee: '', checked: false },
  { id: 'ga_09', teamId: 't1', number: '19', name: '七瀬 篤人', birth: '1974/11', age: '51', isNakano: false, referee: '4級', checked: false },
  { id: 'ga_10', teamId: 't1', number: '13', name: '坂中 賢二', birth: '1978/06', age: '48', isNakano: true, referee: '4級', checked: false },

  // かきっぱち (t4)
  { id: 'kaki_01', teamId: 't4', number: '2', name: '石井 雄太', birth: '1983/07/22', age: '43', isNakano: false, referee: '', checked: false },
  { id: 'kaki_02', teamId: 't4', number: '4', name: '浅利 定栄', birth: '1982/10/03', age: '43', isNakano: true, referee: '', checked: false },
  { id: 'kaki_03', teamId: 't4', number: '7', name: '吉村 洋一', birth: '1980/08/20', age: '46', isNakano: false, referee: '', checked: false },
  { id: 'kaki_04', teamId: 't4', number: '8', name: '田中 大祐', birth: '1979/01/16', age: '47', isNakano: true, referee: '', checked: false },
  { id: 'kaki_05', teamId: 't4', number: '10', name: '鈴木 文也', birth: '1985/11/20', age: '40', isNakano: false, referee: '', checked: false },
  { id: 'kaki_06', teamId: 't4', number: '3', name: '横塚 三雄', birth: '1978/04/01', age: '48', isNakano: false, referee: '4級', checked: false },
  { id: 'kaki_07', teamId: 't4', number: '5', name: '川田 剛徳', birth: '1983/11/01', age: '42', isNakano: false, referee: '', checked: false },
  { id: 'kaki_08', teamId: 't4', number: '6', name: '田井 康裕', birth: '1983/04/01', age: '43', isNakano: false, referee: '', checked: false },
  { id: 'kaki_09', teamId: 't4', number: '11', name: '名嘉原 盛治', birth: '1978/12/30', age: '47', isNakano: false, referee: '', checked: false }
];

export const initialMatches = [
  { id: 'm1', stage: 'league', date: '09:15', homeId: 't3', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第1試合', refereeTeamId: 't1', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm2', stage: 'league', date: '09:42', homeId: 't1', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第2試合', refereeTeamId: 't2', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm3', stage: 'league', date: '10:09', homeId: 't3', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第3試合', refereeTeamId: 't1', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm4', stage: 'league', date: '10:36', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第4試合', refereeTeamId: 't4', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm5', stage: 'league', date: '11:03', homeId: 't3', awayId: 't1', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第5試合', refereeTeamId: 't2', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm6', stage: 'league', date: '11:30', homeId: 't2', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第6試合', refereeTeamId: 't3', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm7', stage: 'third_place', date: '11:59', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '三位決定戦', refereeTeamId: null, refereePlayerId: null, goals: [], cards: [] },
  { id: 'm8', stage: 'final', date: '12:26', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝戦', refereeTeamId: null, refereePlayerId: null, goals: [], cards: [] }
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
            team.foulPoints += 2;
          } else {
            team.yellowCards += 1;
            team.foulPoints += 1;
          }
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
  { time: '09:15 - 09:37',  label: '予選 第1試合',            duration: '22m', detail: '百式 vs ケンFC　審判：GA (前半10分-HT2分-後半10分)' },
  { time: '09:37 - 09:42',  label: '予選 第2試合【準備】',    duration: '5m', detail: '※メンバーチェック含む' },
  { time: '09:42 - 10:04',  label: '予選 第2試合',            duration: '22m', detail: 'GA vs かきっぱち（連戦）　審判：ケンFC' },
  { time: '10:04 - 10:09',  label: '予選 第3試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '10:09 - 10:31',  label: '予選 第3試合',            duration: '22m', detail: '百式 vs かきっぱち（連戦）　審判：GA' },
  { time: '10:31 - 10:36',  label: '予選 第4試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '10:36 - 10:58',  label: '予選 第4試合',            duration: '22m', detail: 'GA（連戦） vs ケンFC　審判：かきっぱち' },
  { time: '10:58 - 11:03',  label: '予選 第5試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '11:03 - 11:25',  label: '予選 第5試合',            duration: '22m', detail: '百式 vs GA（連戦）　審判：ケンFC' },
  { time: '11:25 - 11:30',  label: '予選 第6試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '11:30 - 11:52',  label: '予選 第6試合',            duration: '22m', detail: 'ケンFC vs かきっぱち　審判：百式' },
  { time: '11:52 - 11:54',  label: '写真撮影',                duration: '2m', detail: '※区、協会への報告、HP用' },
  { time: '11:54 - 11:59',  label: '三位決定戦【準備】',      duration: '5m', detail: '※挨拶含む' },
  { time: '11:59 - 12:21',  label: '三位決定戦',              duration: '22m', detail: '予選3位 vs 予選4位　審判：予選2位' },
  { time: '12:21 - 12:26',  label: '決勝戦【準備】',          duration: '5m', detail: '※挨拶含む' },
  { time: '12:26 - 12:48',  label: '決勝戦',                  duration: '22m', detail: '予選1位 vs 予選2位　審判：予選4位' },
  { time: '12:48 - 12:50',  label: '予備時間',                duration: '2m' },
  { time: '12:50 - 13:00',  label: '片づけ・撤収',            duration: '10m' },
];

export const teamSummary = [
  { team: 'GA', matches: 4, matchTime: '80分', referee: '2〜3回', firstMatch: '09:37' },
  { team: 'ケンFC', matches: 4, matchTime: '80分', referee: '2〜3回', firstMatch: '09:10' },
  { team: '百式', matches: 4, matchTime: '80分', referee: '1〜2回', firstMatch: '09:10' },
  { team: 'かきっぱち', matches: 4, matchTime: '80分', referee: '1〜2回', firstMatch: '09:37' }
];
