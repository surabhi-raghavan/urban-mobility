# backend/urban_resilience/ml_routes.py

from __future__ import annotations

from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from .ml_service import (
    get_feature_importances,
    get_city_features,
    predict_resilience_for_city_scenario,
    ml_is_ready,
    SCENARIO_NAMES,
)

from .resilience_stats import compute_city_resilience_summary


router = APIRouter(prefix="/ml", tags=["ml"])


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class CityFeaturesResponse(BaseModel):
    city: str
    features: Dict[str, float]


class PredictResponse(BaseModel):
    city: str
    scenario: str
    severity: float
    predicted_resilience: float


@router.get("/importances", response_model=List[FeatureImportanceItem])
def api_get_importances():
    """
    Return global feature importances from the trained model.
    """
    try:
        items = get_feature_importances()
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/features", response_model=CityFeaturesResponse)
def api_get_city_features(
    city: str = Query(..., description="City name as used for OSM, e.g. 'Pittsburgh, Pennsylvania, USA'"),
):
    """
    Compute structural graph features (feat_*) for a given city,
    using the same schema as the ML training dataset.
    """
    if not ml_is_ready():
        raise HTTPException(
            status_code=503,
            detail="ML model is not ready. Make sure training has been run.",
        )
    try:
        feats = get_city_features(city)
        return CityFeaturesResponse(city=city, features=feats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict", response_model=PredictResponse)
def api_predict_resilience(
    city: str = Query(..., description="City name for OSM"),
    scenario: str = Query(..., description="Disruption scenario label (must match training)"),
    severity: float = Query(
        ...,
        description="Severity in the same scale used during training (e.g. 0.05–0.4)",
    ),
):
    """
    Predict resilience score for a city+scenario+severity without running
    the full path-sampling simulation.
    """
    if not ml_is_ready():
        raise HTTPException(
            status_code=503,
            detail="ML model is not ready. Make sure training has been run.",
        )

    if scenario not in SCENARIO_NAMES:
        raise HTTPException(
            status_code=400,
            detail=f"Scenario '{scenario}' not seen in training. "
                   f"Valid scenarios: {SCENARIO_NAMES}",
        )

    try:
        pred = predict_resilience_for_city_scenario(city, scenario, severity)
        return PredictResponse(
            city=city,
            scenario=scenario,
            severity=severity,
            predicted_resilience=pred,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

