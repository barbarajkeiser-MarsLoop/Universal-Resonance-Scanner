# The Coherence Layer: One Measurement Framework Across Four Substrates

**Barbara J. Keiser**  
Independent Researcher · Gravois Mills, Missouri  
barbara.j.keiser@gmail.com · @KJ_Barbara · ORCID: 0009-0004-3991-419X  
github.com/barbarajkeiser-MarsLoop

---

## The Problem

Standard network analysis asks who is most connected, or who sits on the most paths between others. These are useful questions. But they leave a third structural role undetected: the individual whose immediate neighbors are tightly connected to one another — the local center of gravity who holds a neighborhood together without routing traffic across the whole group.

For forty years, betweenness centrality has been the dominant tool for identifying important individuals in animal social networks. It finds routing hubs well. It cannot find quality anchors at all.

This gap matters because removing a routing hub fragments long-distance communication. Removing a quality anchor does something different: it quietly destabilizes local cohesion. The group still connects across distance. But the neighborhood deteriorates. These are two distinct failure modes, and until recently we had a metric for only one of them.

---

## The Measurement

Resonance Centrality (RC) is a composite metric designed to detect both structural roles simultaneously.

**RC = (0.4 × connectedness) + (0.4 × neighborhood density) + (0.2 × betweenness)**

For each individual in a network, three quantities are calculated and scaled from 0 to 1:

- **Connectedness** — how many social connections does this individual have, relative to the maximum possible?
- **Neighborhood density** — how tightly connected are this individual's direct neighbors to one another?
- **Betweenness** — how often does the network route shortest paths through this individual?

The network-level RC score is the average across all individuals. A high network RC score means the network has both kinds of important individuals present and active. A low score means one or both roles are absent or structurally weak.

RC has been validated across nine networks spanning six species: bottlenose dolphins, sociable weavers, vampire bats, killer whales, carpenter ants, and olive baboons. In every primary dataset, real networks scored at the 100th percentile against 100 randomly constructed null networks. Effect sizes ranged from 5.76σ to 29.88σ.

These results are not subtle. They suggest RC is detecting something real and consistent about how stable animal social networks are organized.

---

## The Generalization

RC is substrate-agnostic. The formula does not require that nodes be animals or that edges be social bonds. It requires only that nodes communicate and that connections carry meaning.

This is not a metaphor. It is a structural claim: any system in which entities form weighted connections, and in which those connections aggregate into networks, can in principle be analyzed for the presence or absence of routing hubs and quality anchors.

Three additional substrates have been identified where this claim can be tested empirically:

**1. Acoustic frequency compatibility as a prior architecture for social bond formation.**  
Before animals form social bonds, they interact acoustically. The hypothesis — developed in a companion paper, *Before the Bond* — is that acoustic frequency compatibility is not a consequence of existing bonds but a prior condition determining which bonds can form at all. RC scores may reflect historical acoustic compatibility, not only current network position. If true, RC becomes predictive rather than merely descriptive: high scores indicate individuals whose acoustic signatures were compatible with many others before any bond existed.

**2. Human-AI collaboration networks.**  
Extended human-AI interactions produce networks with identifiable structure: some exchanges function as routing hubs (bridging topics, connecting prior context to new questions), others as quality anchors (deepening local coherence within a thread without ranging widely). RC applied to these interaction networks may detect drift from coherent collaboration toward fragmented or repetitive exchange — a potential diagnostic tool for the quality of extended AI-assisted research.

**3. Particle physics decay networks.**  
B-meson decays produce three-body final states in which daughter particles carry kinematic signatures that can be represented as networks: invariant mass bins as nodes, co-occurrence within decay events as edges. Standard CP violation analysis asks whether B+ and B- mesons decay with different frequencies. RC asks a structurally different question: do B+ and B- decay networks have different coherence structure? If CP violation has a topological signature — not just a numerical one — RC is positioned to detect it. A differential RC result above null would be orthogonal to existing CP violation measurements and would constitute a genuinely novel finding.

---

## What Connects Them

The same structural question recurs across all four substrates:

*Does this system have the internal organization necessary to remain stable under perturbation?*

In animal social networks, the answer is encoded in who holds the neighborhood together when routing hubs are removed. In acoustic architecture, it is encoded in which frequency signatures were compatible before any bond existed. In human-AI collaboration, it is encoded in whether exchanges deepen locally or merely branch outward. In particle decay networks, it may be encoded in whether matter and antimatter produce structurally different coherence patterns when their decay products are treated as a network.

The measurement tool is the same in each case. The substrate changes. The question does not.

---

## Current Status

- **Resonance Centrality** — preprint live (Zenodo DOI: 10.5281/zenodo.19009606); under review at *Social Networks*
- **Before the Bond** — preprint live (Zenodo DOI: 10.5281/zenodo.20469572); active outreach
- **Human-AI network application** — methodology developed; longitudinal data available
- **Particle physics application** — RC differential pipeline built and validated on LHCb phase-space simulation data; awaiting run on B2HHH real data (CERN Open Data record 4900)

---

*Correspondence welcome. This framework is open-source and the RC calculator is publicly available.*

