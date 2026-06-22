#!/usr/bin/env python3
"""
RC Differential Pipeline: B+ vs B- Decay Networks
Barbara Keiser / Claude collaboration — June 2026

PURPOSE:
Run Resonance Centrality (RC) differentially on B+ and B- meson decay networks
from real LHCb data to test whether CP violation has a structural/coherence 
signature detectable by RC — beyond the simple count asymmetry (N+ vs N-).

NOVEL CLAIM:
Standard CP violation analysis asks: "Do more B- than B+ decay?"
RC asks: "Do B+ and B- decay network topologies differ in coherence structure?"
These are orthogonal questions. A positive RC differential result would be new.

REQUIRED FILES:
- B2HHH_MagnetDown.root (download: http://opendata.cern.ch/eos/opendata/lhcb/AntimatterMatters2017/data/B2HHH_MagnetDown.root)
- B2HHH_MagnetUp.root   (download: http://opendata.cern.ch/eos/opendata/lhcb/AntimatterMatters2017/data/B2HHH_MagnetUp.root)

INSTALL:
pip install uproot awkward networkx numpy pandas scipy
"""

import uproot
import numpy as np
import pandas as pd
import networkx as nx
from itertools import combinations
import json, sys

KAON_MASS = 493.677  # MeV/c^2

# ============================================================
# STEP 1: LOAD AND PRESELECT
# ============================================================

def load_data(paths):
    dfs = []
    for path in paths:
        print(f"Loading {path}...")
        f = uproot.open(path)
        tree_key = [k for k in f.keys() if 'Decay' in k or 'Tree' in k][0]
        df = f[tree_key].arrays(library='pd')
        dfs.append(df)
    return pd.concat(dfs, ignore_index=True)

def apply_cuts(df):
    """Standard kaon selection from LHCb open data notebook."""
    mask = (
        (df['H1_ProbK'] > 0.5) & (df['H1_ProbPi'] < 0.5) & (df['H1_isMuon'] == 0) &
        (df['H2_ProbK'] > 0.5) & (df['H2_ProbPi'] < 0.5) & (df['H2_isMuon'] == 0) &
        (df['H3_ProbK'] > 0.5) & (df['H3_ProbPi'] < 0.5) & (df['H3_isMuon'] == 0)
    )
    return df[mask].copy()

# ============================================================
# STEP 2: PHYSICS CALCULATIONS
# ============================================================

def add_physics(df):
    for i in [1,2,3]:
        p2 = df[f'H{i}_PX']**2 + df[f'H{i}_PY']**2 + df[f'H{i}_PZ']**2
        df[f'H{i}_E'] = np.sqrt(p2 + KAON_MASS**2)
    
    df['B_E']  = df['H1_E']  + df['H2_E']  + df['H3_E']
    df['B_PX'] = df['H1_PX'] + df['H2_PX'] + df['H3_PX']
    df['B_PY'] = df['H1_PY'] + df['H2_PY'] + df['H3_PY']
    df['B_PZ'] = df['H1_PZ'] + df['H2_PZ'] + df['H3_PZ']
    df['B_M']  = np.sqrt(np.maximum(
        df['B_E']**2 - df['B_PX']**2 - df['B_PY']**2 - df['B_PZ']**2, 0))
    df['B_Charge'] = df['H1_Charge'] + df['H2_Charge'] + df['H3_Charge']
    
    # B mass window cut (remove background)
    df = df[(df['B_M'] > 5200) & (df['B_M'] < 5350)].copy()
    
    # Remove charm background (D0 veto)
    for i,j in [(1,2),(1,3),(2,3)]:
        E = df[f'H{i}_E'] + df[f'H{j}_E']
        PX = df[f'H{i}_PX'] + df[f'H{j}_PX']
        PY = df[f'H{i}_PY'] + df[f'H{j}_PY']
        PZ = df[f'H{i}_PZ'] + df[f'H{j}_PZ']
        m2 = np.maximum(E**2 - PX**2 - PY**2 - PZ**2, 0)
        df[f'm{i}{j}'] = np.sqrt(m2)
    
    # D0 veto: remove events where any pair mass is near 1865 MeV
    d0_veto = ((df['m12'] < 1830) | (df['m12'] > 1900)) & \
              ((df['m13'] < 1830) | (df['m13'] > 1900)) & \
              ((df['m23'] < 1830) | (df['m23'] > 1900))
    df = df[d0_veto].copy()
    
    return df

# ============================================================
# STEP 3: BUILD POPULATION NETWORKS
# ============================================================

def build_network(subset, bin_size=200):
    """
    Nodes = invariant mass bins (resonance regions in KK phase space)
    Edges = co-occurrence of mass bins within same decay event
    Weights = number of events sharing that edge configuration
    """
    G = nx.Graph()
    bin_edges = np.arange(0, 5500, bin_size)
    
    for col in ['m12','m13','m23']:
        subset = subset.copy()
        subset[f'{col}_bin'] = pd.cut(subset[col], bins=bin_edges, labels=False)
    
    for _, row in subset.iterrows():
        bins = [row[f'm{p}_bin'] for p in ['12','13','23']]
        nodes = [f'KK_{int(b)}' for b in bins if not (isinstance(b, float) and np.isnan(b))]
        
        for n in nodes:
            if not G.has_node(n):
                G.add_node(n)
        
        for i in range(len(nodes)):
            for j in range(i+1, len(nodes)):
                if G.has_edge(nodes[i], nodes[j]):
                    G[nodes[i]][nodes[j]]['weight'] += 1
                else:
                    G.add_edge(nodes[i], nodes[j], weight=1)
    return G

# ============================================================
# STEP 4: RC COMPUTATION
# ============================================================

def compute_rc(G):
    """
    Resonance Centrality: for each node u,
    average triangle coherence score across all triangles containing u.
    Triangle score = min(edge weights) / max(edge weights)
    """
    rc_scores = {}
    for u in G.nodes():
        neighbors = list(G.neighbors(u))
        if len(neighbors) < 2:
            rc_scores[u] = 0.0
            continue
        triangle_scores = []
        for v, w in combinations(neighbors, 2):
            if G.has_edge(v, w) and v != u and w != u:
                weights = [
                    G[u][v].get('weight', 1),
                    G[u][w].get('weight', 1),
                    G[v][w].get('weight', 1)
                ]
                score = min(weights) / max(weights) if max(weights) > 0 else 0
                triangle_scores.append(score)
        rc_scores[u] = np.mean(triangle_scores) if triangle_scores else 0.0
    return rc_scores

# ============================================================
# STEP 5: DIFFERENTIAL RC + NULL MODEL
# ============================================================

def run_differential_rc(df, n_null=100, bin_size=200):
    bplus  = df[df['B_Charge'] ==  1]
    bminus = df[df['B_Charge'] == -1]
    
    print(f"B+ events: {len(bplus)}, B- events: {len(bminus)}")
    
    # Standard count asymmetry (existing method)
    N_plus = len(bplus)
    N_minus = len(bminus)
    A_count = (N_plus - N_minus) / (N_plus + N_minus)
    A_count_err = np.sqrt(4 * N_plus * N_minus / (N_plus + N_minus)**3)
    print(f"\nCount asymmetry A = {A_count:.4f} ± {A_count_err:.4f}")
    print(f"Significance: {abs(A_count)/A_count_err:.2f} sigma")
    
    # RC differential (novel method)
    print("\nBuilding B+ network...")
    G_plus  = build_network(bplus,  bin_size)
    print("Building B- network...")
    G_minus = build_network(bminus, bin_size)
    
    rc_plus  = compute_rc(G_plus)
    rc_minus = compute_rc(G_minus)
    
    mean_rc_plus  = np.mean(list(rc_plus.values()))
    mean_rc_minus = np.mean(list(rc_minus.values()))
    observed_diff = mean_rc_plus - mean_rc_minus
    
    print(f"\nMean RC B+: {mean_rc_plus:.6f}")
    print(f"Mean RC B-: {mean_rc_minus:.6f}")
    print(f"RC differential (B+ - B-): {observed_diff:.6f}")
    
    # Null model: shuffle charges
    print(f"\nRunning {n_null} null shuffles...")
    null_diffs = []
    for i in range(n_null):
        if i % 10 == 0: print(f"  Null {i}/{n_null}...")
        sh = df.copy()
        sh['B_Charge'] = np.random.choice([-1, 1], size=len(sh))
        Gn1 = build_network(sh[sh['B_Charge']==1],  bin_size)
        Gn2 = build_network(sh[sh['B_Charge']==-1], bin_size)
        rc1 = compute_rc(Gn1)
        rc2 = compute_rc(Gn2)
        null_diffs.append(np.mean(list(rc1.values())) - np.mean(list(rc2.values())))
    
    null_mean = np.mean(null_diffs)
    null_std  = np.std(null_diffs)
    z_score   = (observed_diff - null_mean) / null_std if null_std > 0 else 0
    percentile = np.mean([d < observed_diff for d in null_diffs]) * 100
    
    print(f"\n{'='*50}")
    print("RC DIFFERENTIAL RESULT")
    print(f"{'='*50}")
    print(f"Observed RC differential: {observed_diff:.6f}")
    print(f"Null mean: {null_mean:.6f} ± {null_std:.6f}")
    print(f"Z-score: {z_score:.3f}")
    print(f"Percentile vs null: {percentile:.1f}th")
    
    if abs(z_score) >= 5:
        print("★ OBSERVATION-LEVEL: RC coherence asymmetry detected at ≥5 sigma")
        print("  CP violation has structural signature in decay network topology")
    elif abs(z_score) >= 3:
        print("◆ EVIDENCE-LEVEL: RC coherence asymmetry at ≥3 sigma")
    elif abs(z_score) >= 2:
        print("◇ SUGGESTIVE: RC differential at ≥2 sigma — needs more data")
    else:
        print("○ NULL RESULT: RC finds no structural asymmetry beyond chance")
        print("  This is itself meaningful: CP violation may be purely quantitative")
        print("  (N+ ≠ N-) without structural/coherence signature")
    
    return {
        'mean_rc_plus': mean_rc_plus,
        'mean_rc_minus': mean_rc_minus,
        'observed_diff': observed_diff,
        'null_mean': null_mean,
        'null_std': null_std,
        'z_score': z_score,
        'percentile': percentile,
        'count_asymmetry': A_count,
        'count_asymmetry_sigma': abs(A_count)/A_count_err,
        'N_plus': N_plus,
        'N_minus': N_minus
    }

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    # Update these paths when you have the files:
    DATA_PATHS = [
        'B2HHH_MagnetDown.root',
        'B2HHH_MagnetUp.root'
    ]
    
    df = load_data(DATA_PATHS)
    df = apply_cuts(df)
    df = add_physics(df)
    
    print(f"\nEvents after cuts: {len(df)}")
    print(f"B+ count: {(df['B_Charge']==1).sum()}")
    print(f"B- count: {(df['B_Charge']==-1).sum()}")
    
    results = run_differential_rc(df, n_null=100, bin_size=200)
    
    with open('rc_differential_results.json', 'w') as f_out:
        json.dump(results, f_out, indent=2)
    print("\nResults saved to rc_differential_results.json")
