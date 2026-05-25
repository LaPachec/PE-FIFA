export enum TournamentFormat {
  League = 'LEAGUE',
  Knockout = 'KNOCKOUT',
  LeagueKnockout = 'LEAGUE_KNOCKOUT',
}

export enum TournamentStatus {
  Draft = 'DRAFT',
  InProgress = 'IN_PROGRESS',
  KnockoutStage = 'KNOCKOUT_STAGE',
  Finished = 'FINISHED',
}

export enum ParticipantStatus {
  Active = 'ACTIVE',
  Eliminated = 'ELIMINATED',
  Champion = 'CHAMPION',
}

export enum MatchStatus {
  Pending = 'PENDING',
  Finished = 'FINISHED',
}

export enum MatchPhase {
  League = 'LEAGUE',
  RoundOf16 = 'ROUND_OF_16',
  QuarterFinal = 'QUARTER_FINAL',
  SemiFinal = 'SEMI_FINAL',
  ThirdPlace = 'THIRD_PLACE',
  Final = 'FINAL',
}
