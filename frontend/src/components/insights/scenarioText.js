// frontend/src/insights/scenarioText.js

export const SCENARIO_INFO = {
  "Random Failure": {
    short: "Random roads go down, like scattered accidents or utility works.",
    long: "Random failures mimic everyday chaos: crashes, minor works, or localized weather. No one is targeting key roads, but enough small hits add up.",
  },
  "Targeted Attack (Top k%)": {
    short: "The most important roads are deliberately taken out.",
    long: "Targeted attacks remove roads that carry lots of flow or connect many neighborhoods, similar to coordinated sabotage or systemic infrastructure failures.",
  },
  "Bridge Collapse": {
    short: "Bridges fail, cutting cross-river or gap-spanning links.",
    long: "Bridge collapses isolate parts of the city separated by rivers, valleys, or highways. Detours are often long and limited.",
  },
  "Tunnel Closure": {
    short: "Key tunnels close, forcing traffic onto surface routes.",
    long: "Tunnel closures push traffic onto surface streets and alternative crossings, often overloading a few remaining corridors.",
  },
  "Highway Flood": {
    short: "Flooding removes segments of major highways.",
    long: "Highway floods take out the main fast corridors, forcing trips onto slower local streets and increasing vulnerability near flood-prone zones.",
  },
};