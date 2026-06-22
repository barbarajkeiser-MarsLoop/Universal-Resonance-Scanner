# Resonance Centrality

**A network metric that finds two structural roles simultaneously — the one everyone already knew about, and the one nobody was measuring.**

Barbara J. Keiser · Independent Researcher · Gravois Mills, Missouri  
ORCID: [0009-0004-3991-419X](https://orcid.org/0009-0004-3991-419X) · [@KJ_Barbara](https://twitter.com/KJ_Barbara)

[![Preprint](https://img.shields.io/badge/Preprint-Zenodo-blue)](https://zenodo.org/records/20682415)
[![Before the Bond](https://img.shields.io/badge/BTB_Preprint-Zenodo-purple)](https://zenodo.org/records/20684802)
[![Calculator](https://img.shields.io/badge/Live_Calculator-GitHub_Pages-green)](https://barbarajkeiser-MarsLoop.github.io/Resonance-Centrality)

---

## The problem

Freeman (1979) gave social network analysis betweenness centrality — a precise instrument for finding the **routing hub**: the individual who sits on the most paths between others. Remove a routing hub and long-distance communication in the group collapses.

For forty years, this has been the primary lens for identifying structurally important individuals in animal social networks. It was not designed to ask a second question that turns out to matter equally:

**Which individual makes their immediate neighbourhood most richly interconnected?**

This is the **quality anchor** — locally dense, globally quiet. Remove a quality anchor and the group's long-distance communication is fine. But local cohesion quietly deteriorates. Standard betweenness analysis has been blind to this role for forty years. Not because it does not exist. Because no metric was designed to find it.

Resonance Centrality finds both roles simultaneously.

---

## The formula

```
RC = (Rhythm × 0.4) + (Coherence × 0.4) + (Bridging × 0.2)
```

For each individual in a network:

| Component | Weight | What it measures |
|-----------|--------|-----------------|
| **Rhythm** | 0.4 | Degree centrality — how many connections? |
| **Coherence** | 0.4 | Local clustering coefficient — how tightly connected are this individual's neighbours to each other? |
| **Bridging** | 0.2 | Normalised betweenness — how often does the network route shortest paths through this individual? |

The network-level RC score is the mean across all individuals.

**Why these weights?** Degree and local clustering are local measures, robust to unobserved interactions at the periphery. Betweenness is a global measure, sensitive to missing edges — particularly in field datasets where not all interactions are observed. Bridging therefore receives lower weight to reduce the influence of the most noise-sensitive component.

---

## Validation

Validated across **9 networks spanning 6 species**: bottlenose dolphins, sociable weavers, vampire bats, killer whales, carpenter ants, and olive baboons.

| Dataset | Species | σ | %ile | Routing Hub | Quality Anchor |
|---------|---------|---|------|-------------|----------------|
| Doubtful Sound | Dolphin | 17.72 | 100th | SN100 | Ceet |
| Network_639 | Sociable weaver | 29.88 | 100th | REMWHEG | YEREEGM |
| Network_658 | Sociable weaver | 9.73 | 100th | DBMREBK | DBMREBK ⭐ |
| Network_505 | Vampire bat | 5.76 | 100th | mya | dot / mina |
| Network_1071 | Killer whale | 26.90 | 100th | True Grin ⭐ | True Grin ⭐ |
| Baboon grooming (×2) | Olive baboon | — | 100th | — | — |
| Baboon dominance (×2) | Olive baboon | — | 100th | — | — |

⭐ = True Grin: one individual holds both roles simultaneously (only in dense networks)

All primary datasets reach the **100th percentile** against 100 randomly constructed null networks. Effect sizes range from **5.76σ to 29.88σ**. For reference: 5σ is the conventional threshold for discovery claims in particle physics.

**Sensitivity analysis:** Routing hub identity is stable across 9/9 networks under five alternative weight schemes. Quality anchor identity is stable in 7/9 (instability occurs only where two candidates score within 3% of each other — itself a finding about distributed structural resilience).

---

## Three node classes

| Class | Betweenness | Resonance | Role | Detectable by betweenness alone? |
|-------|-------------|-----------|------|----------------------------------|
| **Routing Hub** | Highest | Mid-range | Controls long-distance information flow | ✓ Yes |
| **Quality Anchor** | Near zero | Highest | Anchors local neighbourhood cohesion | ✗ No — invisible |
| **True Grin** | Highest | Highest | Both roles simultaneously | Partially only |

---

## Live calculator

**[→ Open the RC Calculator](https://barbarajkeiser-MarsLoop.github.io/Resonance-Centrality)**

Paste any edge list or upload a CSV/GraphML file. The calculator finds routing hubs and quality anchors in your network, shows a Dark Matter scan for structural anomalies, and exports results as CSV or JSON. All computation runs locally — no data leaves your browser.

Sample networks included: Doubtful Sound dolphins, vampire bats, sociable weavers, and a human-AI research thread.

**Edge list format:**
```
# One edge per line: NodeA, NodeB
Beescratch, Kringel
Kringel, Hook
Hook, Quasi
...
```
Accepts CSV, TXT, or GraphML. Lines starting with `#` are ignored.

---

## Four substrates — one question

RC is substrate-agnostic. The formula requires only that entities form connections and that connections carry meaning. The same question recurs across every application:

*Does this system have the internal organization necessary to remain stable under perturbation?*

| Substrate | Status |
|-----------|--------|
| Animal social networks | ✓ Validated — 9 networks, 6 species |
| Acoustic frequency compatibility ([Before the Bond](https://zenodo.org/records/20684802)) | Theoretical — preprint live |
| Human-AI collaboration networks | In development |
| Particle physics decay networks (LHCb B→KKK) | Pipeline ready — CERN Open Data record 4900 |

The particle physics application asks whether CP violation — the asymmetry between matter and antimatter — has a *structural* signature in B-meson decay network topology, not just a numerical one (count asymmetry). This is a question nobody has asked before. The pipeline is validated on simulation data; the real-data run is pending.

---

## Preprints

- **Resonance Centrality** — [zenodo.org/records/20682415](https://zenodo.org/records/20682415) · DOI: 10.5281/zenodo.19009607
- **Before the Bond** — [zenodo.org/records/20684802](https://zenodo.org/records/20684802) · DOI: 10.5281/zenodo.20469572

---

## Data and code

All datasets used in validation are publicly available:

- **Dolphins:** [networks.skewed.de/net/dolphins](http://networks.skewed.de/net/dolphins) — Lusseau et al. 2003
- **Weavers & bats:** [github.com/bansallab/asnr](https://github.com/bansallab/asnr)
- **Killer whales:** ASNR Network_1071, Weiss et al. 2020
- **Baboons:** Franz et al. (public data)
- **CERN particle data:** [opendata.cern.ch/record/4900](http://opendata.cern.ch/record/4900)

The RC calculator (`resonance_calculator_v3.jsx`) and the CERN differential pipeline (`rc_differential_pipeline.py`) are both in this repository.

---

## Citation

```bibtex
@misc{keiser2026resonance,
  author = {Keiser, Barbara J.},
  title = {Resonance Centrality: Animal Social Networks},
  year = {2026},
  doi = {10.5281/zenodo.19009607},
  url = {https://zenodo.org/records/20682415}
}
```

---

## Contact

barbara.j.keiser@gmail.com · [@KJ_Barbara](https://twitter.com/KJ_Barbara) · [ORCID](https://orcid.org/0009-0004-3991-419X)

Correspondence welcome. If you work with animal social networks and want to run RC on your data, reach out.

---

*The quality anchor has been structurally invisible for forty years. It does not need to remain so.*
