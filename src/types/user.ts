export type GameUserStatus = "online" | "offline" | "in-game" | "away";

// only data required to be shown on front end
export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface GameUser {
  id: string;
  username: string;
  email: string;
  image: string;
  avatarUrl?: string;
  level: number;
  experience: number;
  rank?: string;
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
  preferences: {
    theme: "light" | "dark";
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
  friends: string[]; // Array of friend user IDs
  achievements: Achievement[];
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
}

export interface GameSession {
  id: string;
  players: GameUser[];
  startTime: Date;
  endTime?: Date;
  result?: "win" | "loss" | "draw";
  gameType: "casual" | "ranked";
}
