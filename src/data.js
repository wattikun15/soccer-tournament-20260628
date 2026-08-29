// 8/30(日)中野区ミニサッカー シニア大会@平和の森公園
// チーム構成・試合スケジュールは決定次第、PDF/スプレッドシートを元に反映します。
export const initialTeams = [];

export const initialMembers = [];

export const initialMatches = [];

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

// 8/30大会のタイムスケジュールも決定次第反映します。
export const initialTimetable = [];
