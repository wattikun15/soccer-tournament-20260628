export const initialTeams = [
  { id: 't2', name: 'GA', emoji: '🦁' },
  { id: 't3', name: 'ケンFC', emoji: '🦅' },
  { id: 't1', name: '百式', emoji: '⚡' },
  { id: 't4', name: '囲町FC', emoji: '🟥' },
];

export const initialMembers = [
  // 百式 (t1)
  { id: 't1_p1', teamId: 't1', name: '出本 篤', number: 16 },
  { id: 't1_p2', teamId: 't1', name: '駒澤 和弥', number: 15 },
  { id: 't1_p3', teamId: 't1', name: '阿久津 蒔温', number: 10 },
  { id: 't1_p4', teamId: 't1', name: '山田 貴之', number: 7 },
  { id: 't1_p5', teamId: 't1', name: '勝又 裕基', number: 87 },
  { id: 't1_p6', teamId: 't1', name: '桑原 政俊', number: 21 },
  { id: 't1_p7', teamId: 't1', name: '渡辺 燎太', number: 17 },
  { id: 't1_p8', teamId: 't1', name: '阿久津 ユウリ', number: 19 },
  { id: 't1_p9', teamId: 't1', name: '内田 貴一', number: 30 },

  // GA (t2)
  { id: 't2_p1', teamId: 't2', name: '松尾 航', number: 15 },
  { id: 't2_p2', teamId: 't2', name: '竹井 素宣', number: 6 },
  { id: 't2_p3', teamId: 't2', name: '小山 弘剛', number: 32 },
  { id: 't2_p4', teamId: 't2', name: '坂中 賢二', number: 13 },
  { id: 't2_p5', teamId: 't2', name: '小峰 隆弘', number: 5 },
  { id: 't2_p6', teamId: 't2', name: '田中 大祐', number: 21 },
  { id: 't2_p7', teamId: 't2', name: '栗原 孝明', number: 7 },
  { id: 't2_p8', teamId: 't2', name: '吉村 洋一', number: 74 },
  { id: 't2_p9', teamId: 't2', name: '西部 暁', number: 8 },
  { id: 't2_p10', teamId: 't2', name: '阿部 順一', number: 4 },
  { id: 't2_p11', teamId: 't2', name: '日辻 大樹', number: 9 },
  { id: 't2_p12', teamId: 't2', name: '石井 雄太', number: '' },

  // ケンFC (t3)
  { id: 't3_p1', teamId: 't3', name: '郡司 剛教', number: 13 },
  { id: 't3_p2', teamId: 't3', name: '黒羽 拓明', number: 40 },
  { id: 't3_p3', teamId: 't3', name: '山口 光輝', number: 4 },
  { id: 't3_p4', teamId: 't3', name: '鈴木 皓成', number: 17 },
  { id: 't3_p5', teamId: 't3', name: '杉本 桃之介', number: 22 },
  { id: 't3_p6', teamId: 't3', name: '和田 健也', number: 33 },
  { id: 't3_p7', teamId: 't3', name: '小松 凛太朗', number: 71 },
  { id: 't3_p8', teamId: 't3', name: '般林 郁也', number: 92 },
  { id: 't3_p9', teamId: 't3', name: '木村 証', number: 21 },
  { id: 't3_p10', teamId: 't3', name: '後藤 裕保', number: 14 },
  { id: 't3_p11', teamId: 't3', name: '金沢 仁', number: '' }
];


export const initialMatches = [
  { id: 'm1',  stage: 'league',      date: '9:15',  homeId: 't4', awayId: 't1', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第1試合', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm2',  stage: 'league',      date: '9:35',  homeId: 't2', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第2試合', refereeTeamId: 't4', refereePlayerId: null, goals: [] },
  { id: 'm3',  stage: 'league',      date: '9:55',  homeId: 't1', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第3試合', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm4',  stage: 'league',      date: '10:15', homeId: 't4', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第4試合', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm5',  stage: 'league',      date: '10:35', homeId: 't4', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第5試合', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm6',  stage: 'league',      date: '10:55', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', label: '予選 第6試合', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm7',  stage: 'semifinal',   date: '11:15', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '準決勝 第1試合', refereeTeamId: null, refereePlayerId: null, goals: [] },
  { id: 'm8',  stage: 'semifinal',   date: '11:39', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '準決勝 第2試合', refereeTeamId: null, refereePlayerId: null, goals: [] },
  { id: 'm9',  stage: 'third_place', date: '12:03', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '三位決定戦',     refereeTeamId: null, refereePlayerId: null, goals: [] },
  { id: 'm10', stage: 'final',       date: '12:27', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝戦',         refereeTeamId: null, refereePlayerId: null, goals: [] },
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
  { time: '8:45',          label: '集合（代表の方）',        detail: 'メンバー表の提出、背番号、ユニフォームの確認' },
  { time: '9:00 - 9:05',  label: '開場・準備・アップ',      duration: '5m' },
  { time: '9:05 - 9:10',  label: '開会式',                  duration: '5m' },
  { time: '9:10 - 9:15',  label: '予選 第1試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '9:15 - 9:30',  label: '予選 第1試合',            duration: '15m', detail: '囲町FC vs 百式　審判：GA' },
  { time: '9:30 - 9:35',  label: '予選 第2試合【準備】',    duration: '5m', detail: 'メンバーチェック含む' },
  { time: '9:35 - 9:50',  label: '予選 第2試合',            duration: '15m', detail: 'GA vs ケンFC　審判：囲町FC' },
  { time: '9:50 - 9:55',  label: '予選 第3試合【準備】',    duration: '5m' },
  { time: '9:55 - 10:10', label: '予選 第3試合',            duration: '15m', detail: '百式 vs ケンFC　審判：GA' },
  { time: '10:10 - 10:15',label: '予選 第4試合【準備】',    duration: '5m' },
  { time: '10:15 - 10:30',label: '予選 第4試合',            duration: '15m', detail: '囲町FC vs GA　審判：ケンFC' },
  { time: '10:30 - 10:35',label: '予選 第5試合【準備】',    duration: '5m' },
  { time: '10:35 - 10:50',label: '予選 第5試合',            duration: '15m', detail: '囲町FC vs ケンFC　審判：百式' },
  { time: '10:50 - 10:55',label: '予選 第6試合【準備】',    duration: '5m' },
  { time: '10:55 - 11:10',label: '予選 第6試合',            duration: '15m', detail: '百式 vs GA　審判：ケンFC' },
  { time: '11:10 - 11:12',label: '写真撮影',                duration: '2m', detail: '区・協会への報告、HP用' },
  { time: '11:12 - 11:15',label: '準決勝 第1試合【準備】',  duration: '3m' },
  { time: '11:15 - 11:36',label: '準決勝 第1試合',          duration: '21m', detail: '予選2位 vs 予選3位　審判：予選4位　(前半10分-HT1分-後半10分)' },
  { time: '11:36 - 11:39',label: '準決勝 第2試合【準備】',  duration: '3m' },
  { time: '11:39 - 12:00',label: '準決勝 第2試合',          duration: '21m', detail: '予選1位 vs 予選4位　審判：予選3位　(前半10分-HT1分-後半10分)' },
  { time: '12:00 - 12:03',label: '三位決定戦【準備】',      duration: '3m' },
  { time: '12:03 - 12:24',label: '三位決定戦',              duration: '21m', detail: '準決1敗者 vs 準決2敗者　(前半10分-HT1分-後半10分)' },
  { time: '12:24 - 12:27',label: '決勝戦【準備】',          duration: '3m' },
  { time: '12:27 - 12:48',label: '決勝戦',                  duration: '21m', detail: '準決1勝者 vs 準決2勝者　(前半10分-HT1分-後半10分)' },
  { time: '12:48 - 12:50',label: '予備時間',                duration: '2m' },
  { time: '12:50 - 13:00',label: '片づけ・撤収',            duration: '10m' },
];
