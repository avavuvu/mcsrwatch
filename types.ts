export interface MatchPlayerData {
      uuid: string;
      nickname: string;
      roleType: number;
      eloRate: number;
      eloRank: number;
      country: string;
    }

export interface MatchResponseData {
  status: string;
  data: {
    id: number;
    type: number;
    seed: {
      id: string;
      overworld: string;
      nether: string;
      endTowers: number[];
      variations: string[];
    };
    category: string;
    gameMode: string;
    players: {
        0: MatchPlayerData,
        1: MatchPlayerData
    };
    spectators: string[];
    result: {
      uuid: string;
      time: number;
    };
    forfeited: boolean;
    decayed: boolean;
    rank: {
      season: string | null;
      allTime: string | null;
    };
    vod: Array<{
      uuid: string;
      url: string;
      startsAt: number;
    }>;
    changes: Array<{
      uuid: string;
      change: number;
      eloRate: number;
    }>;
    completions: Array<{
      uuid: string;
      time: number;
    }>;
    timelines: Array<{
      uuid: string;
      time: number;
      type: string;
    }>;
    beginner: boolean;
    botSource: string | null;
    season: number;
    date: number;
    seedType: string;
    bastionType: string;
    tag: string | null;
    replayExist: boolean;
  };
}



export interface VersusMatch {
  id: number;
  type: number;
  seed: {
    id: string;
    overworld: string;
    nether: string;
    endTowers: number[];
    variations: string[];
  };
  category: string;
  gameMode: string;
  players: MatchPlayerData[];
  spectators: MatchPlayerData[];
  result: {
    uuid: string;
    time: number;
  };
  forfeited: boolean;
  decayed: boolean;
  rank: {
    season: string | null;
    allTime: string | null;
  };
  changes: Array<{
    uuid: string;
    change: number;
    eloRate: number;
  }>;
  season: number;
  date: number;
  botSource: string | null;
  beginner: boolean;
  seedType: string;
  bastionType: string;
  tag: string | null;
}