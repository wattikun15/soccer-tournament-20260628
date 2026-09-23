// 9/22(火)中野区ミニサッカー 一般大会@平和の森公園
export const initialTeams = [
  { id: 't1', name: 'ケンFC', emoji: '🦅' },
  { id: 't2', name: 'ミナミダイFC', emoji: '🦉' },
  { id: 't3', name: 'GA', emoji: '🦁' },
  { id: 't4', name: 'ALL ROUNDER F.C.', emoji: '⚡' }
];

export const initialMembers = [
  { id: 'ga_01', teamId: 't3', number: '15', name: '松尾 航', birth: '1979/01', age: '47', isNakano: true, referee: '4級', checked: false },
  { id: 'ga_02', teamId: 't3', number: '06', name: '竹井 素宣', birth: '1974/11', age: '51', isNakano: false, referee: '', checked: false },
  { id: 'ga_03', teamId: 't3', number: '09', name: '熊崎 拓', birth: '1983/05', age: '43', isNakano: false, referee: '4級', checked: false },
  { id: 'ga_04', teamId: 't3', number: '08', name: '西部 暁', birth: '1980/05', age: '46', isNakano: false, referee: '', checked: false },
  { id: 'ga_05', teamId: 't3', number: '04', name: '小嶋 勝也', birth: '1979/10', age: '46', isNakano: false, referee: '', checked: false },
  { id: 'ga_06', teamId: 't3', number: '03', name: '安野 俊明', birth: '1983/12', age: '42', isNakano: false, referee: '', checked: false },
  { id: 'ga_07', teamId: 't3', number: '22', name: '塚原 利男', birth: '', age: '', isNakano: false, referee: '', checked: false },
  { id: 'ga_08', teamId: 't3', number: '18', name: '日辻 大樹', birth: '2000/07', age: '26', isNakano: true, referee: '', checked: false },
  { id: 'ga_09', teamId: 't3', number: '32', name: '小山 弘剛', birth: '1986/01', age: '40', isNakano: false, referee: '', checked: false },
  // ミナミダイFC
  { id: 'm_minami_01', teamId: 't2', number: '06', name: '駒澤 和弥', birth: '2000/08', age: '26', isNakano: true, referee: '', checked: false },
  { id: 'm_minami_02', teamId: 't2', number: '10', name: '阿久津 蒔温', birth: '2001/05', age: '25', isNakano: true, referee: '', checked: false },
  { id: 'm_minami_03', teamId: 't2', number: '21', name: '桑原 政俊', birth: '1987/06', age: '39', isNakano: false, referee: '4級', checked: false },
  { id: 'm_minami_04', teamId: 't2', number: '17', name: '渡辺 燎太', birth: '2000/10', age: '25', isNakano: true, referee: '', checked: false },
  { id: 'm_minami_05', teamId: 't2', number: '07', name: '山田 貴之', birth: '2001/08', age: '25', isNakano: false, referee: '', checked: false },
  { id: 'm_minami_06', teamId: 't2', number: '87', name: '勝又 裕基', birth: '1995/08', age: '31', isNakano: false, referee: '4級', checked: false },
  { id: 'm_minami_07', teamId: 't2', number: '16', name: '出本 篤', birth: '1979/04', age: '47', isNakano: true, referee: '4級', checked: false },
  { id: 'm_minami_08', teamId: 't2', number: '39', name: '三ノ宮 聖弘', birth: '1997/09', age: '29', isNakano: false, referee: '', checked: false },
  { id: 'm_minami_09', teamId: 't2', number: '08', name: '山田 達大', birth: '1999/05', age: '27', isNakano: false, referee: '', notes: '遅刻参加', checked: false },
  { id: 'm_minami_10', teamId: 't2', number: '04', name: '雨宮 誠', birth: '1987/08', age: '39', isNakano: true, referee: '', checked: false },
  { id: 'm_minami_11', teamId: 't2', number: '09', name: '藤井 輝生', birth: '1995/02', age: '31', isNakano: false, referee: '', checked: false },
  { id: 'm_minami_12', teamId: 't2', number: '14', name: '沼上 雅門', birth: '1995/04', age: '31', isNakano: false, referee: '', checked: false }
];

export const initialMatches = [
  { id: 'm1', stage: 'league', date: '13:15', homeId: 't1', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第1試合', refereeTeamId: 't2', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm2', stage: 'league', date: '13:42', homeId: 't2', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第2試合', refereeTeamId: 't3', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm3', stage: 'league', date: '14:09', homeId: 't1', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第3試合', refereeTeamId: 't2', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm4', stage: 'league', date: '14:36', homeId: 't3', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第4試合', refereeTeamId: 't4', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm5', stage: 'league', date: '15:03', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第5試合', refereeTeamId: 't3', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm6', stage: 'league', date: '15:30', homeId: 't4', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第6試合', refereeTeamId: 't1', refereePlayerId: null, goals: [], cards: [] },
  { id: 'm7', stage: 'third_place', date: '15:59', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '三位決定戦', refereeTeamId: null, refereePlayerId: null, goals: [], cards: [] },
  { id: 'm8', stage: 'final', date: '16:26', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝戦', refereeTeamId: null, refereePlayerId: null, goals: [], cards: [] }
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
  { time: '12:45',          label: '集合（代表の方）',        detail: 'メンバー表の提出、背番号、ユニフォームの確認' },
  { time: '13:00 - 13:05',  label: '開場・準備・アップ',      duration: '5m' },
  { time: '13:05 - 13:10',  label: '開会式',                  duration: '5m' },
  { time: '13:10 - 13:15',  label: '予選 第1試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '13:15 - 13:37',  label: '予選 第1試合',            duration: '22m', detail: 'ケンFC vs GA　審判：ミナミダイ (前半10分-HT2分-後半10分)' },
  { time: '13:37 - 13:42',  label: '予選 第2試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '13:42 - 14:04',  label: '予選 第2試合',            duration: '22m', detail: 'ミナミダイ vs ALL ROUNDER（連戦）　審判：GA' },
  { time: '14:04 - 14:09',  label: '予選 第3試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '14:09 - 14:31',  label: '予選 第3試合',            duration: '22m', detail: 'ケンFC vs ALL ROUNDER（連戦）　審判：ミナミダイ' },
  { time: '14:31 - 14:36',  label: '予選 第4試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '14:36 - 14:58',  label: '予選 第4試合',            duration: '22m', detail: 'GA vs ミナミダイ（連戦）　審判：ALL ROUNDER' },
  { time: '14:58 - 15:03',  label: '予選 第5試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '15:03 - 15:25',  label: '予選 第5試合',            duration: '22m', detail: 'ケンFC vs ミナミダイ（連戦）　審判：GA' },
  { time: '15:25 - 15:30',  label: '予選 第6試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '15:30 - 15:52',  label: '予選 第6試合',            duration: '22m', detail: 'ALL ROUNDER vs GA　審判：ケンFC' },
  { time: '15:52 - 15:54',  label: '写真撮影',                duration: '2m', detail: '※区、協会への報告、HP用' },
  { time: '15:54 - 15:59',  label: '三位決定戦【準備】',      duration: '5m', detail: 'メンバーチェック含む' },
  { time: '15:59 - 16:21',  label: '三位決定戦',              duration: '22m', detail: '予選3位 vs 予選4位　審判：予選2位' },
  { time: '16:21 - 16:26',  label: '決勝戦【準備】',          duration: '5m', detail: 'メンバーチェック含む' },
  { time: '16:26 - 16:48',  label: '決勝戦',                  duration: '22m', detail: '予選1位 vs 予選2位　審判：予選4位' },
  { time: '16:48 - 16:50',  label: '予備時間',                duration: '2m' },
  { time: '16:50 - 17:00',  label: '片づけ・撤収',            duration: '10m' },
];

export const teamSummary = [
  { team: 'ケンFC', matches: 4, matchTime: '80分', referee: '1〜2回', firstMatch: '13:10' },
  { team: 'ミナミダイ', matches: 4, matchTime: '80分', referee: '2〜3回', firstMatch: '13:37' },
  { team: 'ALL ROUNDER', matches: 4, matchTime: '80分', referee: '1〜2回', firstMatch: '13:37' },
  { team: 'GA', matches: 4, matchTime: '80分', referee: '2〜3回', firstMatch: '13:10' }
];
