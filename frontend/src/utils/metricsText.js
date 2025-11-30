// frontend/src/utils/metricsText.js

export function computeResilienceScore(avgRatio, pctDisconnected) {
  if (avgRatio == null || pctDisconnected == null) return null;

  // Cap crazy outliers so 1 awful run doesn't nuke the scale
  const cappedRatio = Math.min(avgRatio, 3); // 3x slower is "max pain" for this score
  const travelScore = 1 / cappedRatio;       // 1 = no delay, ~0.33 = 3x slower
  const connectivityScore = 1 - pctDisconnected; // 1 = fully connected, 0 = totally broken

  const raw = 0.6 * connectivityScore + 0.4 * travelScore;
  return Number((raw * 100).toFixed(1)); // 0–100
}

export function categorizeResilience(score) {
  if (score == null) {
    return {
      label: "Unknown",
      severity: "neutral",
      hint: "Run a simulation to see how this city holds up.",
    };
  }
  if (score >= 80) {
    return {
      label: "Robust",
      severity: "good",
      hint: "Most trips still work and delays are minor.",
    };
  }
  if (score >= 60) {
    return {
      label: "Manageable",
      severity: "medium",
      hint: "Network is stressed, but the city can still function.",
    };
  }
  if (score >= 40) {
    return {
      label: "Fragile",
      severity: "bad",
      hint: "Many trips are disrupted; detours become the norm.",
    };
  }
  return {
    label: "Critical",
    severity: "critical",
    hint: "Large parts of the city stop talking to each other.",
  };
}

export function classifyShock(avgRatio, pctDisconnected) {
  if (avgRatio == null || pctDisconnected == null) {
    return {
      level: "Unknown",
      description: "Run a scenario to see how strong the shock is.",
    };
  }

  const d = pctDisconnected * 100;

  if (d > 40 || avgRatio >= 2.0) {
    return {
      level: "Catastrophic",
      description: ">40% origin–destination pairs are cut off or trips take 2× longer.",
    };
  }
  if (d > 20 || avgRatio >= 1.5) {
    return {
      level: "Severe",
      description: "A big chunk of the city feels the disruption.",
    };
  }
  if (d > 10 || avgRatio >= 1.2) {
    return {
      level: "Moderate",
      description: "Annoying but survivable delays and detours.",
    };
  }
  return {
    level: "Mild",
    description: "Mostly minor slowdowns; network stays connected.",
  };
}

export function commuterStory(avgRatio, pctDisconnected, baseMinutes = 20) {
  if (avgRatio == null) return null;

  const base = baseMinutes;
  const minTrip = Math.round(base * avgRatio * 0.9);
  const maxTrip = Math.round(base * avgRatio * 1.1);
  const disconnectedShare = pctDisconnected != null
    ? Math.round(pctDisconnected * 100)
    : null;

  let reachabilitySentence = "";
  if (disconnectedShare == null || disconnectedShare === 0) {
    reachabilitySentence = "Most trips still complete, just a bit slower.";
  } else if (disconnectedShare < 15) {
    reachabilitySentence = `${disconnectedShare}% of random start–end pairs are fully cut off.`;
  } else if (disconnectedShare < 35) {
    reachabilitySentence = `Roughly 1 in ${Math.round(100 / disconnectedShare)} cross-town pairs can no longer reach each other.`;
  } else {
    reachabilitySentence = `Around ${disconnectedShare}% of random pairs can’t reach each other at all.`;
  }

  return `A typical ${base}-minute cross-town trip would feel like about ${minTrip}–${maxTrip} minutes after this shock. ${reachabilitySentence}`;
}
