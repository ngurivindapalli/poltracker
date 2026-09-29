import type { NormalizedCandidate, NormalizedElection } from "./types";

export type ContestValidationIssue = {
  code: string;
  message: string;
};

export function validateContestRecords(input: {
  contests: NormalizedElection[];
  candidates: NormalizedCandidate[];
}): ContestValidationIssue[] {
  const issues: ContestValidationIssue[] = [];
  const contestKeys = new Set<string>();
  const candidateKeys = new Set<string>();
  const candidateIds = new Map<string, string>();

  for (const contest of input.contests) {
    if (contest.recordKind !== "CONTEST" && contest.recordKind !== "MEASURE") {
      issues.push({
        code: "contest_without_kind",
        message: `${contest.sourceKey}: contest record is missing recordKind CONTEST/MEASURE`,
      });
    }
    if (!contest.electionName) {
      issues.push({ code: "contest_without_election", message: `${contest.sourceKey}: contest has no election name` });
    }
    if (!contest.state && contest.office !== "President of the United States") {
      issues.push({
        code: "contest_without_jurisdiction",
        message: `${contest.sourceKey}: contest has no state/jurisdiction`,
      });
    }
    const office = `${contest.office || ""} ${contest.electionName || ""}`;
    if (/\bU\.?S\.?\s+House\b/i.test(office) && (!contest.state || contest.state === "US" || !contest.district)) {
      issues.push({
        code: "house_without_state_district",
        message: `${contest.sourceKey}: House contest is missing state or district`,
      });
    }
    if (/\bU\.?S\.?\s+Senate\b/i.test(office) && (!contest.state || contest.state === "US")) {
      issues.push({
        code: "senate_without_state",
        message: `${contest.sourceKey}: Senate contest is missing state`,
      });
    }
    if (contest.electionDate) {
      const year = contest.electionDate.getUTCFullYear();
      if (year < 2000 || year > 2100) {
        issues.push({
          code: "invalid_election_year",
          message: `${contest.sourceKey}: invalid election year ${year}`,
        });
      }
    }
    if (contest.sourceKey) {
      if (contestKeys.has(contest.sourceKey)) {
        issues.push({ code: "duplicate_contest", message: `duplicate contest sourceKey ${contest.sourceKey}` });
      }
      contestKeys.add(contest.sourceKey);
    }
  }

  for (const candidate of input.candidates) {
    if (!candidate.sourceName) {
      issues.push({
        code: "candidate_without_source",
        message: `${candidate.sourceKey}: candidate has no source`,
      });
    }
    if (!candidate.electionSourceKey || !contestKeys.has(candidate.electionSourceKey)) {
      const known = contestKeys.has(candidate.electionSourceKey);
      if (!known) {
        issues.push({
          code: "candidate_without_contest",
          message: `${candidate.sourceKey}: candidate contest ${candidate.electionSourceKey} was not in this batch`,
        });
      }
    }
    if (candidate.sourceKey) {
      if (candidateKeys.has(candidate.sourceKey)) {
        issues.push({
          code: "duplicate_candidate",
          message: `duplicate candidate sourceKey ${candidate.sourceKey}`,
        });
      }
      candidateKeys.add(candidate.sourceKey);
    }
    if (candidate.candidateId) {
      const prior = candidateIds.get(`${candidate.candidateId}|${candidate.electionSourceKey}`);
      if (prior && prior !== candidate.sourceKey) {
        issues.push({
          code: "duplicate_candidate",
          message: `duplicate candidate id ${candidate.candidateId} on contest ${candidate.electionSourceKey}`,
        });
      }
      candidateIds.set(`${candidate.candidateId}|${candidate.electionSourceKey}`, candidate.sourceKey);
    }
  }

  return issues;
}

export function formatContestValidation(issues: ContestValidationIssue[]): string[] {
  return issues.map((issue) => `${issue.code}: ${issue.message}`);
}

export function contestCoverageLabel(input: {
  implemented: boolean;
  contestCount: number;
  verifiedSource: boolean;
}): "VERIFIED" | "PARTIAL" | "NOT_IMPLEMENTED" {
  if (!input.implemented) return "NOT_IMPLEMENTED";
  if (input.contestCount > 0 && input.verifiedSource) return "VERIFIED";
  if (input.verifiedSource || input.contestCount > 0) return "PARTIAL";
  return "PARTIAL";
}
