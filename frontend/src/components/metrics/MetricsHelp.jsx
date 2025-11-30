// frontend/src/components/metrics/MetricsHelp.jsx
import React from "react";

const MetricsHelp = () => {
  return (
    <div className="card metrics-help">
      <h3>How to read these numbers</h3>
      <ul>
        <li>
          <strong>Average delay (avg_ratio)</strong> – how much slower trips get:
          <ul>
            <li><code>1.0</code> = no change</li>
            <li><code>1.2</code> ≈ 20% slower (20 min → ~24 min)</li>
            <li><code>1.5</code> ≈ 50% slower (20 min → ~30 min)</li>
            <li><code>2.0+</code> = “this is bad” territory</li>
          </ul>
        </li>
        <li>
          <strong>OD disconnection (%)</strong> – share of random origin–destination
          pairs that can’t reach each other anymore:
          <ul>
            <li><code>&lt; 10%</code> – annoying, but city still functions</li>
            <li><code>10–40%</code> – serious fragmentation</li>
            <li><code>&gt; 40%</code> – catastrophic for everyday movement</li>
          </ul>
        </li>
        <li>
          <strong>Resilience score (0–100)</strong> – combines delay + disconnection:
          <ul>
            <li><code>80–100</code> – robust</li>
            <li><code>60–80</code> – manageable</li>
            <li><code>40–60</code> – fragile</li>
            <li><code>&lt; 40</code> – critical</li>
          </ul>
        </li>
      </ul>
      <p className="footnote">
        All values come from sampled trips across the city. We’re not modeling
        exact traffic counts, just how much harder it gets to move around.
      </p>
    </div>
  );
};

export default MetricsHelp;