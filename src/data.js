export const initialTeams = [
  { id: 't1', name: 'ミナミダイFC', emoji: '⚽' },
  { id: 't2', name: 'GA', emoji: '🦁' },
  { id: 't3', name: 'ケンFC', emoji: '🦅' },
  { id: 't4', name: 'CISCO', emoji: '🐺' },
];

export const initialMembers = [
  // ミナミダイFC (t1)
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
  { id: 't3_p2', teamId: 't3', name: '山口 光輝', number: 4 },
  { id: 't3_p3', teamId: 't3', name: '郡司 真臣', number: 15 },
  { id: 't3_p4', teamId: 't3', name: '鈴木 皓成', number: 12 },
  { id: 't3_p5', teamId: 't3', name: '杉本 桃之介', number: 33 },
  { id: 't3_p6', teamId: 't3', name: '後藤 裕保', number: 14 },
  { id: 't3_p7', teamId: 't3', name: '江渡 忍夫', number: 27 },
  { id: 't3_p8', teamId: 't3', name: '氣賀澤 淳', number: 23 },
  { id: 't3_p9', teamId: 't3', name: '木村 証', number: 24 },
  { id: 't3_p10', teamId: 't3', name: '西原 壮太', number: 16 }
];


export const initialMatches = [
  { id: 'm1', stage: 'league', date: '6/28 13:00', homeId: 't1', awayId: 't2', homeScore: 0, awayScore: 0, status: 'scheduled', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm2', stage: 'league', date: '6/28 13:30', homeId: 't3', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm3', stage: 'league', date: '6/28 14:00', homeId: 't1', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm4', stage: 'league', date: '6/28 14:30', homeId: 't2', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm5', stage: 'league', date: '6/28 15:00', homeId: 't1', awayId: 't4', homeScore: 0, awayScore: 0, status: 'scheduled', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
  { id: 'm6', stage: 'league', date: '6/28 15:30', homeId: 't2', awayId: 't3', homeScore: 0, awayScore: 0, status: 'scheduled', refereeTeamId: 't4', refereePlayerId: null, goals: [] },
  { id: 'm7', stage: 'semifinal', date: '6/28 16:00', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '準決勝 1', refereeTeamId: 't3', refereePlayerId: null, goals: [] },
  { id: 'm8', stage: 'semifinal', date: '6/28 16:00', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '準決勝 2', refereeTeamId: 't4', refereePlayerId: null, goals: [] },
  { id: 'm9', stage: 'third_place', date: '6/28 16:30', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '3位決定戦', refereeTeamId: 't1', refereePlayerId: null, goals: [] },
  { id: 'm10', stage: 'final', date: '6/28 16:30', homeId: null, awayId: null, homeScore: 0, awayScore: 0, status: 'scheduled', label: '決勝', refereeTeamId: 't2', refereePlayerId: null, goals: [] },
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
