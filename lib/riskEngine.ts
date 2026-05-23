export function calculateRisk(data: any) {
  let score = 0;

  if (data.failedLogins > 5) score += 30;
  if (data.locationChange) score += 25;
  if (data.deviceUnknown) score += 25;
  if (data.impossibleTravel) score += 40;

  return Math.min(score, 100);
}
