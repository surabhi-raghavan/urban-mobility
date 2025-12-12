import React from "react";
import {
  computeResilienceScore,
  categorizeResilience,
  classifyShock,
} from "../../utils/metricsText";

const WhatIfPanel = ({ city, simResult }) => {
  if (!simResult) {
    return (
      <div className="card muted">
        <h3>What does this mean for the city?</h3>
        <p>Run at least one scenario to see where {city} is vulnerable.</p>
      </div>
    );
  }

  const { avg_ratio, pct_disconnected } = simResult;
  const resilienceScore = computeResilienceScore(avg_ratio, pct_disconnected);
  const resilienceMeta = categorizeResilience(resilienceScore);
  const shock = classifyShock(avg_ratio, pct_disconnected);

  let priority;
  if (resilienceScore == null) {
    priority = "Collect more runs to understand this city’s behavior.";
  } else if (resilienceScore >= 80) {
    priority =
      "Keep critical corridors maintained and monitor for rare extreme events.";
  } else if (resilienceScore >= 60) {
    priority =
      "Strengthen backup routes and add redundancy where detours are currently long.";
  } else if (resilienceScore >= 40) {
    priority =
      "Focus on alternative crossings, extra connectors, and better emergency routing.";
  } else {
    priority =
      "Plan for major investment: new connections, upgraded bridges/tunnels, and clear evacuation routes.";
  }

  return (
    <div className="card what-if-panel">
      <h3>What if this really happened in {city}?</h3>
      <p>
        In this simulation, {city} shows a{" "}
        <strong>{resilienceMeta.label.toLowerCase()}</strong> level of
        resilience under a <strong>{shock.level.toLowerCase()}</strong> shock.
      </p>
      <p>{resilienceMeta.hint}</p>
      <p className="what-if-priority">
        <strong>Priority for planners:</strong> {priority}
      </p>
      <p className="what-if-note">
        These insights come from structure only (road layout and travel times),
        not from actual traffic counts. Think of this as a stress-test of the
        network’s skeleton.
      </p>
    </div>
  );
};

export default WhatIfPanel;
