import { profiles } from "./profiles";

export function calculateRisk(data: any, profileKey: keyof typeof profiles) {
  const profile = profiles[profileKey];

  let score = 0;

  if (data.failedLogins > 5) score += profile.weights.failedLogins;
  if (data.locationChange) score += profile.weights.locationChange;
  if (data.deviceUnknown) score += profile.weights.deviceUnknown;
  if (data.impossibleTravel) score += profile.weights.impossibleTravel;

  return Math.min(score, 100);
}
