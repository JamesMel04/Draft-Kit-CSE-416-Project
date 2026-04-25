import { requiredEnv } from "@/utils/env-reader";
import { LeagueSettings, LeagueState} from "@/types";

export const MLB_API_KEY = requiredEnv('MLB_API_KEY');

export const HITTER_SCORING_CATEGORIES = [
    "r",
    "1b",
    "2b",
    "3b",
    "hr",
    "rbi",
    "bb",
    "k",
    "sb",
    "cs",
    "obp",
    "slg"
] as const;

export const PITCHER_SCORING_CATEGORIES = [
    "w",
    "sv",
    "so",
    "ip",
    "era",
    "whip",
    "avg"
] as const;

export const ROSTER_SLOTS = [
    "C",    // Catcher
    "1B",   // First base
    "2B",   // Second base
    "3B",   // Third base
    "SS",   // Shortstop
    "CI",   // Corner infield
    "MI",   // Middle infield
    "OF",   // Outfield
    "U",    // Utility
    "P",    // Pitcher
] as const;

export const defaultRosterSlotsCounts = {
    C: 2,
    "1B": 1,
    "2B": 1,
    "3B": 1,
    SS: 1,
    CI: 1,
    MI: 1,
    OF: 5,
    U: 1,
    P: 9,
};

export const defaultLeagueSettings: LeagueSettings = {
    budget: 100,
    teamCount: 1,
    rosterSlots: defaultRosterSlotsCounts
};

export const defaultLeagueState: LeagueState = {
    teams: {
        "DefaultTeamName": {
            roster: {}
        }
    }
};