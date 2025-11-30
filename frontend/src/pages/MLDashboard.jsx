// src/pages/MLDashboard.jsx
import { useEffect, useState } from "react";
import { fetchFeatureImportances, fetchCityFeatures } from "../api/client";

import FeatureImportanceChart from "../components/ml/FeatureImportanceChart";
import CityFeatureTable from "../components/ml/CityFeatureTable";
import ResiliencePredictionBox from "../components/ml/ResiliencePredictionBox";

export default function MLDashboard({ city }) {
  const [importances, setImportances] = useState([]);
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    fetchFeatureImportances().then((d) => setImportances(d));
  }, []);

  useEffect(() => {
    if (city) {
      fetchCityFeatures(city).then((f) => setFeatures(f));
    }
  }, [city]);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <FeatureImportanceChart data={importances} />

      {city && (
        <>
          <CityFeatureTable features={features} />
          <ResiliencePredictionBox city={city} />
        </>
      )}
    </div>
  );
}
