export const SAGE_INSTITUTES = [
  "Institute of Advanced Computing",
  "Institute of Architecture",
  "Institute of Agriculture Sciences",
  "Institute of Arts, Humanities",
  "Institute of Commerce",
  "Institute of Computer Application",
  "Institute of Design",
  "Institute of Engineering and Technology",
  "Institute of Journalism and Mass Communication",
  "Institute of Management Studies",
  "Institute of Sciences",
  "Institute of Law & Legal Studies",
  "Institute of Pharmaceutical Sciences",
  "Institute of pharmacy",
  "Institute of Performing Arts",
  "SAGE Centre for Liberal and Advanced Studies",
] as const;

export type SageInstitute = (typeof SAGE_INSTITUTES)[number];

export const SAGE_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
] as const;

export type SageYear = (typeof SAGE_YEARS)[number];

export const YEAR_TO_SEMESTER_MAP: Record<SageYear, string> = {
  "1st Year": "1st Semester",
  "2nd Year": "3rd Semester",
  "3rd Year": "5th Semester",
  "4th Year": "7th Semester",
  "5th Year": "9th Semester",
};

export function getSemesterFromYear(year?: string | null): string | null {
  if (!year) return null;
  return (YEAR_TO_SEMESTER_MAP as Record<string, string>)[year] || null;
}

export function isValidSageInstitute(institute?: string | null): institute is SageInstitute {
  if (!institute) return false;
  return (SAGE_INSTITUTES as readonly string[]).includes(institute.trim());
}

export function isValidSageYear(year?: string | null): year is SageYear {
  if (!year) return false;
  return (SAGE_YEARS as readonly string[]).includes(year.trim());
}
