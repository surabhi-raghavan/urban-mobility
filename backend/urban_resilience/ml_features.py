from __future__ import annotations

from typing import Dict, Any

import random
import statistics

import networkx as nx
import numpy as np
from community import community_louvain  # from python-louvain

from .edge_selection import graph_to_edges_gdf


def _largest_component_subgraph(G: nx.Graph) -> nx.Graph:
    """
    Return subgraph induced by largest (weakly) connected component.
    Works for DiGraph/MultiDiGraph too by converting to undirected for components.
    """
    if isinstance(G, (nx.DiGraph, nx.MultiDiGraph, nx.MultiDiGraph)):
        H = G.to_undirected()
    else:
        H = G

    if H.number_of_nodes() == 0:
        return H

    largest_cc = max(nx.connected_components(H), key=len)
    return H.subgraph(largest_cc).copy()


def _approx_average_shortest_path_length(G: nx.Graph, k: int = 200) -> float | None:
    """
    Approximate average shortest path length by sampling up to k source nodes
    from the largest connected component. Returns None if graph too small.
    """
    if G.number_of_nodes() < 2:
        return None

    H = _largest_component_subgraph(G)
    nodes = list(H.nodes())
    if len(nodes) < 2:
        return None

    sample_size = min(k, len(nodes))
    sample_nodes = random.sample(nodes, sample_size)

    lengths = []
    for s in sample_nodes:
        sp = nx.shortest_path_length(H, source=s, weight="length")
        # exclude self (distance 0)
        for t, d in sp.items():
            if t != s and d is not None:
                lengths.append(d)

    if not lengths:
        return None
    return float(sum(lengths) / len(lengths))


def compute_city_features(G: nx.MultiDiGraph) -> Dict[str, Any]:
    """
    Compute structural graph features for a city road network.

    Returns a dict with numeric values only (good for ML).
    """
    if isinstance(G, (nx.MultiDiGraph, nx.MultiGraph)):
        Gu = nx.Graph()
        for u, v, data in G.edges(data=True):
            length = data.get("length", 1.0)
            if Gu.has_edge(u, v):
                if length < Gu[u][v].get("length", length):
                    Gu[u][v]["length"] = length
            else:
                Gu.add_edge(u, v, length=length)
    else:
        Gu = G.copy()

    n_nodes = Gu.number_of_nodes()
    n_edges = Gu.number_of_edges()

    if n_nodes > 0:
        avg_degree = 2 * n_edges / n_nodes
    else:
        avg_degree = 0.0

    degrees = [d for _, d in Gu.degree()]
    degree_std = float(statistics.pstdev(degrees)) if len(degrees) > 1 else 0.0
    max_degree = max(degrees) if degrees else 0

    try:
        avg_clustering = float(nx.average_clustering(Gu))
    except Exception:
        avg_clustering = 0.0

    try:
        transitivity = float(nx.transitivity(Gu))
    except Exception:
        transitivity = 0.0

    try:
        assortativity = float(nx.degree_assortativity_coefficient(Gu))
    except Exception:
        assortativity = 0.0

    try:
        density = float(nx.density(Gu))
    except Exception:
        density = 0.0

    if n_nodes > 0:
        H = _largest_component_subgraph(Gu)
        giant_frac = H.number_of_nodes() / n_nodes
    else:
        giant_frac = 0.0

    try:
        approx_aspl = _approx_average_shortest_path_length(Gu, k=200)
    except Exception:
        approx_aspl = None
    if approx_aspl is None:
        approx_aspl = 0.0

    try:
        H = _largest_component_subgraph(Gu)
        if H.number_of_nodes() > 0:
            partition = community_louvain.best_partition(H)
            # compute modularity
            mod_val = community_louvain.modularity(partition, H)
            modularity = float(mod_val)
        else:
            modularity = 0.0
    except Exception:
        modularity = 0.0

    gdf_edges = graph_to_edges_gdf(G)
    n_edges_gdf = len(gdf_edges)

    if n_edges_gdf > 0:
        bridge_frac = float(
            (gdf_edges["bridge"].fillna(False).astype(bool)).sum()
        ) / n_edges_gdf
        tunnel_frac = float(
            (gdf_edges["tunnel"].fillna(False).astype(bool)).sum()
        ) / n_edges_gdf

        hw = gdf_edges["highway"]
        def is_major(x):
            if isinstance(x, str):
                xs = [x]
            elif isinstance(x, (list, tuple, set)):
                xs = list(x)
            else:
                return False
            majors = {
                "motorway",
                "trunk",
                "primary",
                "secondary",
                "motorway_link",
                "trunk_link",
                "primary_link",
                "secondary_link",
            }
            return any(h in majors for h in xs)

        major_highway_frac = float(hw.apply(is_major).sum()) / n_edges_gdf
    else:
        bridge_frac = 0.0
        tunnel_frac = 0.0
        major_highway_frac = 0.0

    # (Optional) approximate betweenness centrality statistics
    try:
        # sample up to 300 nodes
        nodes = list(Gu.nodes())
        if len(nodes) > 300:
            sample_nodes = random.sample(nodes, 300)
        else:
            sample_nodes = nodes
        bc = nx.betweenness_centrality(
            Gu, k=len(sample_nodes), normalized=True, seed=42
        ).values()
        bc_list = list(bc)
        bc_mean = float(np.mean(bc_list)) if bc_list else 0.0
        bc_std = float(np.std(bc_list)) if bc_list else 0.0
    except Exception:
        bc_mean = 0.0
        bc_std = 0.0

    features = {
        "n_nodes": float(n_nodes),
        "n_edges": float(n_edges),
        "avg_degree": float(avg_degree),
        "degree_std": float(degree_std),
        "max_degree": float(max_degree),
        "avg_clustering": float(avg_clustering),
        "transitivity": float(transitivity),
        "assortativity": float(assortativity),
        "density": float(density),
        "giant_component_frac": float(giant_frac),
        "approx_aspl": float(approx_aspl),
        "modularity": float(modularity),
        "bridge_frac": float(bridge_frac),
        "tunnel_frac": float(tunnel_frac),
        "major_highway_frac": float(major_highway_frac),
        "bc_mean": float(bc_mean),
        "bc_std": float(bc_std),
    }

    return features
