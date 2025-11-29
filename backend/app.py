# backend/app.py

from __future__ import annotations
from typing import List, Tuple, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from shapely.geometry import mapping

from urban_resilience.config import DEFAULT_CITIES, SCENARIOS
from urban_resilience.graph_loader import load_city_graph
from urban_resilience.edge_selection import select_edges_for_scenario, graph_to_edges_gdf
from urban_resilience.simulation import simulate_single_shock
from urban_resilience.usgs_flood import download_usgs_flood_features_for_city
from urban_resilience.ml_routes import router as ml_router

import os
import pandas as pd

EdgeId = Tuple[int, int, int]

app = FastAPI(
    title="Urban Mobility Resilience API",
    version="0.2.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ml_router)

# ------------------------ DATA MODELS ------------------------

class SimRequest(BaseModel):
    city: str
    scenario: str
    severity: float
    n_pairs: int = 40
    use_usgs_flood: bool = False


class SimResponse(BaseModel):
    city: str
    scenario: str
    severity: float
    avg_ratio: float
    median_ratio: float
    pct_disconnected: float
    n_removed_edges: int
    n_pairs: int
    edges_geojson: Dict[str, Any]
    removed_edges_geojson: Dict[str, Any]


# ------------------------ SIMULATION HELPERS ------------------------

def build_edges_geojson(city_graph, removed_edges: List[EdgeId]):
    gdf_edges = graph_to_edges_gdf(city_graph)
    removed_set = {(int(u), int(v), int(k)) for (u, v, k) in removed_edges}

    all_features = []
    removed_features = []

    for _, row in gdf_edges.iterrows():
        geom = row.get("geometry")
        if geom is None:
            continue

        u = int(row["u"])
        v = int(row["v"])
        k = int(row.get("key", 0))

        props = {
            "u": u,
            "v": v,
            "key": k,
            "bridge": bool(row.get("bridge", False)),
            "tunnel": bool(row.get("tunnel", False)),
            "highway": row.get("highway", None),
        }

        feat = {
            "type": "Feature",
            "geometry": mapping(geom),
            "properties": props,
        }
        all_features.append(feat)

        if (u, v, k) in removed_set:
            removed_features.append(feat)

    return (
        {"type": "FeatureCollection", "features": all_features},
        {"type": "FeatureCollection", "features": removed_features},
    )


# ------------------------ MAIN ROUTES ------------------------

@app.get("/scenarios")
def list_scenarios():
    return {"scenarios": SCENARIOS}


@app.post("/simulate", response_model=SimResponse)
def simulate(req: SimRequest):
    G = load_city_graph(req.city, cache_dir="graphs")

    flood_polys = None
    if req.use_usgs_flood and req.scenario == "Highway Flood":
        flood_polys = download_usgs_flood_features_for_city(req.city)

    edge_ids = select_edges_for_scenario(
        G, req.scenario, severity=req.severity, usgs_flood_polygons=flood_polys
    )

    metrics = simulate_single_shock(G, edge_ids, n_pairs=req.n_pairs)

    edges_geo, removed_geo = build_edges_geojson(G, edge_ids)

    return SimResponse(
        city=req.city,
        scenario=req.scenario,
        severity=req.severity,
        avg_ratio=metrics["avg_ratio"],
        median_ratio=metrics["median_ratio"],
        pct_disconnected=metrics["pct_disconnected"],
        n_removed_edges=metrics["n_removed_edges"],
        n_pairs=metrics["n_pairs"],
        edges_geojson=edges_geo,
        removed_edges_geojson=removed_geo,
    )


# ------------------------ ML EVALUATION ROUTES (OPTION A) ------------------------

EVAL_DIR = "evaluation_outputs"
@app.get("/ml/eval/metrics")
def get_ml_global_metrics():
    df = pd.read_csv(f"{EVAL_DIR}/metrics_summary.csv")
    return df.to_dict(orient="records")[0]


@app.get("/ml/eval/predictions")
def get_ml_predictions():
    df = pd.read_csv(f"{EVAL_DIR}/model_predictions.csv")
    return df.to_dict(orient="records")


@app.get("/ml/eval/scenario_mae")
def get_ml_scenario_mae():
    df = pd.read_csv(f"{EVAL_DIR}/scenario_wise_mae.csv")
    return df.to_dict(orient="records")

@app.get("/ml/eval/feature_importances")
def get_ml_feature_importances():
    import pandas as pd
    df = pd.read_csv("evaluation_outputs/feature_importances.csv")
    return df.to_dict(orient="records")
# ------------------------ SERVE PNG IMAGES ------------------------

@app.get("/ml/eval/image/{name}")
def get_evaluation_image(name: str):
    """
    Serves any of these image files:

    - pred_vs_actual.png
    - residual_distribution.png
    - feature_importances.png
    - scenario_wise_mae.png
    - severity_vs_error.png
    """
    img_path = os.path.join(EVAL_DIR, name)

    if not img_path.endswith(".png"):
        return {"error": "Only PNG images allowed"}

    if not os.path.exists(img_path):
        return {"error": f"Image not found: {name}"}

    return FileResponse(img_path)

from fastapi.responses import FileResponse

# Feature importances IMAGE
@app.get("/ml/eval/feature_importances")
def feature_importances_image():
    return FileResponse("evaluation_outputs/feature_importances.png")