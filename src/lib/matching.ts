import type { Profile } from "./schema";

export interface ScoredMatch {
  profile: Profile;
  score: number;
  breakdown: Record<string, number>;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ---------------------------------------------------------------------------
// Male client → matched with female pool profiles
// Logic: woman is younger, earns less/equal, shorter, kids-compatible
// ---------------------------------------------------------------------------
function scoreMaleClient(client: Profile, candidate: Profile): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let score = 0;

  const clientAge = getAge(client.dateOfBirth);
  const candidateAge = getAge(candidate.dateOfBirth);
  const ageDiff = clientAge - candidateAge;

  // Age: woman should be 0-7 years younger (sweet spot 2-5)
  if (ageDiff >= 2 && ageDiff <= 5) {
    breakdown.age = 20;
  } else if (ageDiff >= 0 && ageDiff <= 7) {
    breakdown.age = 12;
  } else if (ageDiff >= -1 && ageDiff < 0) {
    breakdown.age = 6; // slightly older woman, acceptable
  } else {
    breakdown.age = 0;
  }
  score += breakdown.age;

  // Height: woman should be shorter (realistic Indian expectation)
  const heightDiff = (client.height ?? 170) - (candidate.height ?? 160);
  if (heightDiff >= 5 && heightDiff <= 20) {
    breakdown.height = 10;
  } else if (heightDiff > 0) {
    breakdown.height = 6;
  } else {
    breakdown.height = 0;
  }
  score += breakdown.height;

  // Income: woman earns less or equal
  const clientIncome = client.income ?? 0;
  const candidateIncome = candidate.income ?? 0;
  if (candidateIncome <= clientIncome) {
    breakdown.income = 15;
  } else if (candidateIncome <= clientIncome * 1.2) {
    breakdown.income = 8; // slightly higher income, still okay
  } else {
    breakdown.income = 0;
  }
  score += breakdown.income;

  // Kids preference compatibility
  breakdown.kids = scoreKidsCompatibility(client.wantKids, candidate.wantKids);
  score += breakdown.kids;

  // Religion match (important in Indian matrimonials)
  breakdown.religion = scoreReligion(client.religion, candidate.religion);
  score += breakdown.religion;

  // Diet compatibility
  breakdown.diet = scoreDiet(client.diet, candidate.diet);
  score += breakdown.diet;

  // Relocation alignment
  breakdown.relocation = scoreRelocation(client.openToRelocate, candidate.openToRelocate);
  score += breakdown.relocation;

  // Language overlap
  breakdown.language = scoreLanguages(client.languagesKnown, candidate.languagesKnown);
  score += breakdown.language;

  // Marital status compatibility
  breakdown.maritalStatus = scoreMaritalStatus(client.maritalStatus, candidate.maritalStatus);
  score += breakdown.maritalStatus;

  return { score, breakdown };
}

// ---------------------------------------------------------------------------
// Female client → matched with male pool profiles
// Logic: profession/values/relocation compatibility, age/income realistic
// ---------------------------------------------------------------------------
function scoreFemaleClient(client: Profile, candidate: Profile): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let score = 0;

  const clientAge = getAge(client.dateOfBirth);
  const candidateAge = getAge(candidate.dateOfBirth);
  const ageDiff = candidateAge - clientAge; // man should be older

  // Age: man 2-10 years older
  if (ageDiff >= 2 && ageDiff <= 6) {
    breakdown.age = 20;
  } else if (ageDiff >= 0 && ageDiff <= 10) {
    breakdown.age = 12;
  } else if (ageDiff >= -1 && ageDiff < 0) {
    breakdown.age = 5;
  } else {
    breakdown.age = 0;
  }
  score += breakdown.age;

  // Income: man earns equal or more (Indian matrimonial expectation)
  const clientIncome = client.income ?? 0;
  const candidateIncome = candidate.income ?? 0;
  if (candidateIncome >= clientIncome) {
    breakdown.income = 15;
  } else if (candidateIncome >= clientIncome * 0.8) {
    breakdown.income = 8;
  } else {
    breakdown.income = 2;
  }
  score += breakdown.income;

  // Education parity (woman may prefer equal or higher educated man)
  breakdown.education = scoreEducation(client.degree, candidate.degree);
  score += breakdown.education;

  // Relocation: man willing to relocate, or both in same city
  if (client.city === candidate.city) {
    breakdown.relocation = 12;
  } else if (candidate.openToRelocate === "yes") {
    breakdown.relocation = 10;
  } else if (candidate.openToRelocate === "maybe" && client.openToRelocate === "yes") {
    breakdown.relocation = 6;
  } else {
    breakdown.relocation = 0;
  }
  score += breakdown.relocation;

  // Family type preference
  if (client.familyType === candidate.familyType) {
    breakdown.familyType = 8;
  } else if (
    (client.familyType === "nuclear" && candidate.familyType === "extended") ||
    (client.familyType === "extended" && candidate.familyType === "nuclear")
  ) {
    breakdown.familyType = 2;
  } else {
    breakdown.familyType = 5;
  }
  score += breakdown.familyType;

  // Kids preference compatibility
  breakdown.kids = scoreKidsCompatibility(client.wantKids, candidate.wantKids);
  score += breakdown.kids;

  // Religion match
  breakdown.religion = scoreReligion(client.religion, candidate.religion);
  score += breakdown.religion;

  // Diet compatibility
  breakdown.diet = scoreDiet(client.diet, candidate.diet);
  score += breakdown.diet;

  // Language overlap
  breakdown.language = scoreLanguages(client.languagesKnown, candidate.languagesKnown);
  score += breakdown.language;

  // Marital status compatibility
  breakdown.maritalStatus = scoreMaritalStatus(client.maritalStatus, candidate.maritalStatus);
  score += breakdown.maritalStatus;

  return { score, breakdown };
}

// ---------------------------------------------------------------------------
// Sub-scorers
// ---------------------------------------------------------------------------
function scoreKidsCompatibility(a: string | null, b: string | null): number {
  if (!a || !b) return 5;
  if (a === b) return 15;
  if ((a === "yes" && b === "maybe") || (a === "maybe" && b === "yes")) return 10;
  if (a === "no" && b === "no") return 15;
  if (a === "no" || b === "no") return 0; // one wants, one doesn't
  return 5;
}

function scoreReligion(a: string | null, b: string | null): number {
  if (!a || !b) return 5;
  if (a.toLowerCase() === b.toLowerCase()) return 12;
  return 3; // inter-religion matches can still happen
}

function scoreDiet(a: string | null, b: string | null): number {
  if (!a || !b) return 3;
  if (a === b) return 8;
  // Vegetarian with eggetarian is okay
  if (
    (a === "vegetarian" && b === "eggetarian") ||
    (a === "eggetarian" && b === "vegetarian")
  )
    return 5;
  // Vegetarian with non-veg is often a dealbreaker
  if (a === "vegetarian" && b === "non_vegetarian") return 0;
  if (a === "non_vegetarian" && b === "vegetarian") return 0;
  return 4;
}

function scoreRelocation(a: string | null, b: string | null): number {
  if (!a || !b) return 4;
  if (a === "yes" && b === "yes") return 8;
  if (a === "yes" || b === "yes") return 6;
  if (a === "maybe" && b === "maybe") return 5;
  return 2;
}

function scoreLanguages(a: string[] | null, b: string[] | null): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 3;
  const setA = new Set(a.map((l) => l.toLowerCase()));
  const overlap = b.filter((l) => setA.has(l.toLowerCase())).length;
  if (overlap >= 2) return 8;
  if (overlap === 1) return 5;
  return 0;
}

function scoreMaritalStatus(a: string | null, b: string | null): number {
  if (!a || !b) return 5;
  if (a === "never_married" && b === "never_married") return 10;
  if (a === b) return 8;
  if (a === "never_married" || b === "never_married") return 4; // one is first-time, other isn't
  return 6; // both divorced/widowed etc.
}

function scoreEducation(clientDegree: string | null, candidateDegree: string | null): number {
  if (!clientDegree || !candidateDegree) return 4;
  const tier = (d: string) => {
    const dl = d.toLowerCase();
    if (dl.includes("phd") || dl.includes("doctorate")) return 4;
    if (dl.includes("mba") || dl.includes("master") || dl.includes("pg")) return 3;
    if (dl.includes("be") || dl.includes("btech") || dl.includes("bsc") || dl.includes("ba") || dl.includes("bachelor")) return 2;
    return 1;
  };
  const diff = tier(candidateDegree) - tier(clientDegree);
  if (diff >= 0) return 8; // man has equal or higher education
  if (diff === -1) return 5;
  return 2;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function scoreMatches(client: Profile, pool: Profile[]): ScoredMatch[] {
  const scoreFn = client.gender === "male" ? scoreMaleClient : scoreFemaleClient;
  const targetGender = client.gender === "male" ? "female" : "male";

  return pool
    .filter((p) => p.gender === targetGender)
    .map((candidate) => {
      const { score, breakdown } = scoreFn(client, candidate);
      return { profile: candidate, score, breakdown };
    })
    .sort((a, b) => b.score - a.score);
}

export function getAiScoreLabel(score: number): string {
  if (score >= 80) return "High Potential";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Moderate";
  return "Low";
}
