import type { Position, SearchFilterPosition } from "./types";
import { optionalEnv } from "@/utils/env-reader";

export const BACKEND_URL = optionalEnv("NEXT_PUBLIC_BACKEND_URL", "https://draft-kit-cse-416-project-1.onrender.com");

export const allPositions: Position[] = [
	"C",
	"1B",
	"2B",
	"3B",
	"SS",
	"CI",
	"MI",
	"OF1",
	"OF2",
	"OF3",
	"OF4",
	"OF5",
	"UTIL",
	"P1",
	"P2",
	"P3",
	"P4",
	"P5",
	"P6",
	"P7",
	"P8",
	"P9",
];

export const allSearchFilterPositions: SearchFilterPosition[] = [
	"C",
	"1B",
	"2B",
	"3B",
	"SS",
	"OF",
	"P",
	"UTIL",
];
