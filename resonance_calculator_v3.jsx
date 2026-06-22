import { useState, useCallback, useRef, useEffect } from "react";

// ─── ALGORITHM ────────────────────────────────────────────────────────────────

function parseEdgeText(text) {
  const edges = [], nodeSet = new Set();
  for (const raw of text.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const parts = line.split(/[\t,;|]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      edges.push([parts[0], parts[1]]);
      nodeSet.add(parts[0]);
      nodeSet.add(parts[1]);
    }
  }
  return { nodes: [...nodeSet], edges };
}

function parseGraphML(text) {
  const edges = [], nodeSet = new Set();
  const nodeMatches = [...text.matchAll(/node id="([^"]+)"/g)];
  nodeMatches.forEach(m => nodeSet.add(m[1]));
  const edgeMatches = [...text.matchAll(/edge source="([^"]+)" target="([^"]+)"/g)];
  edgeMatches.forEach(m => { edges.push([m[1], m[2]]); nodeSet.add(m[1]); nodeSet.add(m[2]); });
  return { nodes: [...nodeSet], edges };
}

function buildAdj(nodes, edges) {
  const adj = {};
  nodes.forEach(n => adj[n] = []);
  for (const [a, b] of edges) {
    if (adj[a] && !adj[a].includes(b)) adj[a].push(b);
    if (adj[b] && !adj[b].includes(a)) adj[b].push(a);
  }
  return adj;
}

function brandes(nodes, adj) {
  const btw = {};
  nodes.forEach(v => btw[v] = 0);
  for (const s of nodes) {
    const stack = [], pred = {}, sigma = {}, dist = {};
    nodes.forEach(v => { pred[v] = []; sigma[v] = 0; dist[v] = -1; });
    sigma[s] = 1; dist[s] = 0;
    const q = [s];
    while (q.length) {
      const v = q.shift(); stack.push(v);
      for (const w of adj[v] || []) {
        if (dist[w] < 0) { q.push(w); dist[w] = dist[v] + 1; }
        if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); }
      }
    }
    const delta = {};
    nodes.forEach(v => delta[v] = 0);
    while (stack.length) {
      const w = stack.pop();
      for (const v of pred[w]) delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      if (w !== s) btw[w] += delta[w];
    }
  }
  const n = nodes.length;
  const norm = n <= 2 ? 1 : ((n - 1) * (n - 2)) / 2;
  nodes.forEach(v => btw[v] /= norm);
  return btw;
}

function coherence(node, adj) {
  const nb = adj[node] || [];
  if (nb.length < 2) return 0;
  const nbSet = new Set(nb);
  let ct = 0;
  for (const u of nb) for (const w of adj[u] || []) if (nbSet.has(w) && w !== node) ct++;
  ct /= 2;
  const poss = (nb.length * (nb.length - 1)) / 2;
  return poss > 0 ? ct / poss : 0;
}

function darkMatterScan(nodes, adj, btw) {
  const n = nodes.length;
  const findings = [];
  for (const node of nodes) {
    const deg = (adj[node] || []).length;
    const degRatio = deg / (n - 1);
    const b = btw[node];
    if (deg === 0) findings.push({ type: "Evidence Void", node, desc: "No recorded connections — solitary, peripheral, or under-observed.", mass: 1.0 });
    else if (deg === 1) findings.push({ type: "Weak Signal", node, desc: "Only 1 connection — new arrival, peripheral, or data gap.", mass: 0.5 });
    if (b > 0.05 && degRatio < 0.15) findings.push({ type: "Phantom Connector", node, desc: `High bridging (${b.toFixed(3)}) but few direct bonds. Invisible social glue.`, mass: +(b * 3).toFixed(3) });
    if (b > 0.15) findings.push({ type: "Magic Gravity", node, desc: `Network routes through this node unusually often (${b.toFixed(3)}). Biology? Personality? Position?`, mass: +(b * 2).toFixed(3) });
  }
  return findings;
}

function analyze(nodes, edges) {
  if (nodes.length < 2) return null;
  const adj = buildAdj(nodes, edges);
  const btw = brandes(nodes, adj);
  const results = nodes.map(node => {
    const degree = (adj[node] || []).length;
    const rhythm = degree / (nodes.length - 1);
    const coh = coherence(node, adj);
    const bridging = btw[node];
    return { node, degree, rhythm, coherence: coh, bridging, resonance: rhythm * 0.4 + coh * 0.4 + bridging * 0.2 };
  }).sort((a, b) => b.resonance - a.resonance);
  const grin = [...results].sort((a, b) => b.bridging - a.bridging)[0];
  const beescratch = results[0];
  const trueGrin = grin.node === beescratch.node;
  const darkMatter = darkMatterScan(nodes, adj, btw);
  const networkRC = results.reduce((s, r) => s + r.resonance, 0) / results.length;
  return { results, grin, beescratch, trueGrin, darkMatter, nodeCount: nodes.length, edgeCount: edges.length, networkRC };
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

function exportCSV(results) {
  const header = "rank,node,resonance,coherence,rhythm,bridging,degree";
  const rows = results.map((r, i) =>
    `${i + 1},${r.node},${r.resonance.toFixed(4)},${r.coherence.toFixed(4)},${r.rhythm.toFixed(4)},${r.bridging.toFixed(4)},${r.degree}`
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "resonance_centrality.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "resonance_centrality.json"; a.click();
  URL.revokeObjectURL(url);
}

// ─── SAMPLE ───────────────────────────────────────────────────────────────────

const SAMPLE = `# Doubtful Sound Dolphins (Lusseau et al. 2003)
# Format: NodeA, NodeB  — one edge per line. Comments with #
Beescratch, Kringel
Beescratch, MN83
Beescratch, SN4
Kringel, MN83
Kringel, SN4
Kringel, Hook
Kringel, Fork
MN83, SN4
MN83, Hook
SN4, Hook
SN4, Fork
Hook, Quasi
Hook, Shmuddel
Fork, Quasi
Fork, Shmuddel
Quasi, Ripplefluke
Quasi, Mus
Ripplefluke, Scabs
Ripplefluke, Shmuddel
Scabs, Shmuddel
Grin, Jet
Grin, Patchback
Grin, Trigger
Grin, Fish
Jet, Trigger
Jet, Zipfel
Trigger, Zipfel
Trigger, Cross
Fish, Gallatin
Fish, MN105
Gallatin, MN105
Gallatin, Oscar
Gallatin, Patchback
MN105, Oscar
MN105, Patchback`;

// ─── UI ───────────────────────────────────────────────────────────────────────

const C = {
  bg: "#0d1117", surface: "#161b22", border: "#21262d", borderDim: "#161b22",
  text: "#e6edf3", textMuted: "#8b949e", textDim: "#484f58",
  gold: "#f59e0b", goldBg: "#160e00", goldBorder: "#3d2c00",
  green: "#34d399", greenBg: "#081410", greenBorder: "#00402a",
  purple: "#c4b5fd", purpleBg: "#140d2e", purpleBorder: "#2d1b69",
  blue: "#60a5fa", red: "#f85149", redBg: "#21060a",
};

const fmt = n => n.toFixed(3);

const DARK_MATTER_COLORS = {
  "Evidence Void": { text: "#f85149", bg: "#21060a" },
  "Weak Signal": { text: "#fb923c", bg: "#1a0e00" },
  "Phantom Connector": { text: "#60a5fa", bg: "#0a1628" },
  "Magic Gravity": { text: "#a78bfa", bg: "#12082a" },
};

function Badge({ node, grin, beescratch, trueGrin }) {
  if (!node) return null;
  if (trueGrin && node === grin.node)
    return <span style={{ background: C.purpleBg, color: C.purple, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>⭐ TRUE GRIN</span>;
  if (node === grin.node)
    return <span style={{ background: C.goldBg, color: C.gold, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>⇌ GRIN</span>;
  if (node === beescratch.node)
    return <span style={{ background: C.greenBg, color: C.green, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>◉ BEESCRATCH</span>;
  return null;
}

function Bar({ val, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(val * 100, 100)}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.textMuted }}>{fmt(val)}</span>
    </div>
  );
}

function Label({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{children}</p>;
}

function ChartPanel({ analysis }) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !analysis) return;
    const { results, grin, beescratch, trueGrin, networkRC } = analysis;

    if (instanceRef.current) { instanceRef.current.destroy(); instanceRef.current = null; }

    const sorted = [...results].sort((a, b) => b.resonance - a.resonance);
    const labels = sorted.map(r => r.node);
    const data = sorted.map(r => parseFloat(r.resonance.toFixed(4)));

    const colors = sorted.map(r => {
      if (trueGrin && r.node === grin.node) return "#c4b5fd";
      if (r.node === grin.node) return "#f59e0b";
      if (r.node === beescratch.node) return "#34d399";
      return "#30363d";
    });

    const ctx = canvasRef.current.getContext("2d");
    instanceRef.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Resonance",
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const r = sorted[ctx.dataIndex];
                const role = (trueGrin && r.node === grin.node) ? "True Grin ⭐" : r.node === grin.node ? "Grin" : r.node === beescratch.node ? "Beescratch" : "";
                return ` RC: ${ctx.raw.toFixed(4)}${role ? "  ·  " + role : ""}`;
              }
            },
            backgroundColor: "#161b22",
            borderColor: "#30363d",
            borderWidth: 1,
            titleColor: "#e6edf3",
            bodyColor: "#8b949e",
          }
        },
        scales: {
          x: {
            min: 0, max: 1,
            ticks: { color: "#484f58", font: { size: 10 }, callback: v => v.toFixed(1) },
            grid: { color: "#161b22" },
          },
          y: {
            ticks: { color: "#8b949e", font: { size: 11, family: "'IBM Plex Mono', monospace" } },
            grid: { display: false },
          }
        }
      }
    });
    return () => { if (instanceRef.current) instanceRef.current.destroy(); };
  }, [analysis]);

  const n = analysis.results.length;
  const chartHeight = Math.max(280, n * 28 + 60);

  return (
    <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { color: "#c4b5fd", label: "True Grin" },
            { color: "#f59e0b", label: "Grin (routing hub)" },
            { color: "#34d399", label: "Beescratch (quality anchor)" },
            { color: "#30363d", label: "Member" },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8b949e" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#484f58", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>
          Network RC: <span style={{ color: "#60a5fa" }}>{analysis.networkRC.toFixed(4)}</span>
        </span>
      </div>
      <div style={{ position: "relative", width: "100%", height: chartHeight }}>
        <canvas ref={canvasRef} role="img" aria-label={`Horizontal bar chart of resonance centrality scores for ${n} nodes, sorted by score.`} />
      </div>
    </div>
  );
}

export default function RC() {
  const [input, setInput] = useState(SAMPLE);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [tab, setTab] = useState("results"); // results | dark | chart
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!window.Chart) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      document.head.appendChild(s);
    }
  }, []);

  const run = useCallback(() => {
    setError("");
    try {
      const text = input;
      let parsed;
      if (text.includes("<graphml") || text.includes("<graph")) {
        parsed = parseGraphML(text);
      } else {
        parsed = parseEdgeText(text);
      }
      const { nodes, edges } = parsed;
      if (nodes.length < 3) { setError("Need at least 3 nodes."); return; }
      if (edges.length < 2) { setError("Need at least 2 edges."); return; }
      const result = analyze(nodes, edges);
      if (!result) { setError("Analysis failed — check edge format."); return; }
      setAnalysis(result);
      setShowAll(false);
      setTab("results");
    } catch (e) {
      setError("Parse error: " + e.message);
    }
  }, [input]);

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => { setInput(ev.target.result); setAnalysis(null); };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => { setInput(ev.target.result); setAnalysis(null); };
    reader.readAsText(file);
  }, []);

  const visible = analysis ? (showAll ? analysis.results : analysis.results.slice(0, 15)) : [];

  const Btn = ({ children, onClick, style = {}, small }) => (
    <button onClick={onClick} style={{
      background: "#21262d", border: "1px solid #30363d", borderRadius: 6,
      color: C.textMuted, fontSize: small ? 11 : 12, padding: small ? "4px 10px" : "7px 14px",
      cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, ...style
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = "#58a6ff"}
      onMouseOut={e => e.currentTarget.style.borderColor = "#30363d"}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", padding: "28px 20px" }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        textarea:focus { outline: none; border-color: #388bfd !important; }
        .tr:hover { background: #161b22 !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>Resonance Centrality</h1>
            <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>v1.0 · Keiser 2026</span>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, maxWidth: 620 }}>
            Identifies <strong style={{ color: C.gold }}>Grins</strong> (routing hubs) and <strong style={{ color: C.green }}>Beescratches</strong> (quality anchors) in animal social networks.
            Accepts edge lists (.csv, .txt) or GraphML. <span style={{ color: C.textDim }}>Your data never leaves your browser.</span>
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT: Input */}
          <div>
            {/* Upload zone */}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: "1px dashed #30363d", borderRadius: 8, padding: "14px 16px", marginBottom: 10,
                cursor: "pointer", textAlign: "center", background: "#0d1117",
                transition: "border-color 0.2s",
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = "#58a6ff"}
              onMouseOut={e => e.currentTarget.style.borderColor = "#30363d"}
            >
              <p style={{ fontSize: 13, color: C.textMuted }}>
                {fileName ? <span style={{ color: C.text }}>📄 {fileName}</span> : <>Upload edge list or GraphML</>}
              </p>
              <p style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>CSV, TXT, GraphML · or drag & drop</p>
              <input ref={fileRef} type="file" accept=".csv,.txt,.graphml,.xml" onChange={handleFile} style={{ display: "none" }} />
            </div>

            {/* Textarea */}
            <div style={{ marginBottom: 6 }}>
              <Label>Edge List</Label>
            </div>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setFileName(""); }}
              style={{
                width: "100%", height: 280, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.9,
              }}
              spellCheck={false}
            />

            <button
              onClick={run}
              style={{
                marginTop: 10, width: "100%", padding: "10px 0", background: "#1f6feb",
                border: "none", borderRadius: 7, color: "#fff", fontSize: 14, fontWeight: 600,
              }}
              onMouseOver={e => e.currentTarget.style.background = "#388bfd"}
              onMouseOut={e => e.currentTarget.style.background = "#1f6feb"}
            >
              Analyze Network
            </button>

            {error && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: C.redBg, border: `1px solid #6e1a1a`, borderRadius: 6 }}>
                <p style={{ fontSize: 12, color: C.red }}>{error}</p>
              </div>
            )}

            {/* Privacy note */}
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#0a1628", border: "1px solid #0d2142", borderRadius: 6 }}>
              <p style={{ fontSize: 11, color: "#3b82f6", lineHeight: 1.6 }}>
                🔒 <strong>Data privacy:</strong> All computation runs locally in your browser. No data is transmitted or stored. Session ends when you close this tab.
              </p>
            </div>

            {/* Formula */}
            <div style={{ marginTop: 14, padding: "14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <Label>Formula</Label>
              {[["Rhythm", "0.4", "degree / (n−1)", C.gold], ["Coherence", "0.4", "neighbor density", C.green], ["Bridging", "0.2", "norm. betweenness", C.blue]].map(([name, w, desc, col]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ fontFamily: "mono", fontSize: 12, color: col, minWidth: 72 }}>{name}</span>
                  <span style={{ fontSize: 10, color: C.textDim, background: "#0d1117", padding: "1px 6px", borderRadius: 3, fontFamily: "mono" }}>×{w}</span>
                  <span style={{ fontSize: 11, color: C.textDim }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Results */}
          <div>
            {!analysis ? (
              <div style={{ height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
                <p style={{ color: C.textDim, fontSize: 14 }}>Upload an edge list or paste data to begin</p>
                <p style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>Supports CSV, TXT, GraphML</p>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    ["Nodes", analysis.nodeCount, C.text],
                    ["Edges", analysis.edgeCount, C.text],
                    ["Network RC", analysis.networkRC.toFixed(3), C.blue],
                    ["Distinct roles", analysis.trueGrin ? "No — True Grin" : "Yes", analysis.trueGrin ? C.purple : C.green],
                    ["Dark matter", analysis.darkMatter.length + " patterns", analysis.darkMatter.length > 3 ? C.red : C.textMuted],
                  ].map(([label, val, col]) => (
                    <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px" }}>
                      <p style={{ fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: col, fontFamily: "'IBM Plex Mono', monospace" }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Role cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: "#78500a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>⇌ Grin — Routing Hub</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: C.gold, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>{analysis.grin.node}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div><p style={{ fontSize: 10, color: C.textDim }}>Betweenness</p><p style={{ fontSize: 12, color: C.gold, fontFamily: "mono" }}>{fmt(analysis.grin.bridging)}</p></div>
                      <div><p style={{ fontSize: 10, color: C.textDim }}>Resonance</p><p style={{ fontSize: 12, color: C.textMuted, fontFamily: "mono" }}>{fmt(analysis.grin.resonance)}</p></div>
                    </div>
                  </div>
                  <div style={{ background: analysis.trueGrin ? C.purpleBg : C.greenBg, border: `1px solid ${analysis.trueGrin ? C.purpleBorder : C.greenBorder}`, borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ fontSize: 10, color: analysis.trueGrin ? "#6b4fa8" : "#1a6b47", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                      {analysis.trueGrin ? "⭐ True Grin" : "◉ Beescratch — Quality Anchor"}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: analysis.trueGrin ? C.purple : C.green, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>{analysis.beescratch.node}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div><p style={{ fontSize: 10, color: C.textDim }}>Resonance</p><p style={{ fontSize: 12, color: analysis.trueGrin ? C.purple : C.green, fontFamily: "mono" }}>{fmt(analysis.beescratch.resonance)}</p></div>
                      <div><p style={{ fontSize: 10, color: C.textDim }}>Coherence</p><p style={{ fontSize: 12, color: C.textMuted, fontFamily: "mono" }}>{fmt(analysis.beescratch.coherence)}</p></div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {["results", "dark", "chart"].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                      padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: tab === t ? "#21262d" : "transparent",
                      border: tab === t ? `1px solid ${C.border}` : "1px solid transparent",
                      color: tab === t ? C.text : C.textMuted,
                    }}>
                      {t === "results" ? "All Nodes" : t === "dark" ? `Dark Matter (${analysis.darkMatter.length})` : "Chart"}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <Btn small onClick={() => exportCSV(analysis.results)}>↓ CSV</Btn>
                  <Btn small onClick={() => exportJSON({ metadata: { nodeCount: analysis.nodeCount, edgeCount: analysis.edgeCount, grin: analysis.grin.node, beescratch: analysis.beescratch.node, trueGrin: analysis.trueGrin }, nodes: analysis.results, darkMatter: analysis.darkMatter })}>↓ JSON</Btn>
                </div>

                {/* Results table */}
                {tab === "results" && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#0d1117", borderBottom: `1px solid ${C.border}` }}>
                          {["#", "Node", "Resonance", "Coherence", "Rhythm", "Bridging", ""].map((h, i) => (
                            <th key={i} style={{ padding: "8px 10px", textAlign: i === 1 ? "left" : "right", color: C.textDim, fontWeight: 600, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((r, i) => {
                          const isG = r.node === analysis.grin.node;
                          const isB = r.node === analysis.beescratch.node;
                          const bg = analysis.trueGrin && isG ? C.purpleBg : isG ? C.goldBg : isB ? C.greenBg : "transparent";
                          return (
                            <tr key={r.node} className="tr" style={{ background: bg, borderBottom: `1px solid ${C.borderDim}` }}>
                              <td style={{ padding: "6px 10px", color: C.textDim, fontFamily: "mono", textAlign: "right", fontSize: 11 }}>{i + 1}</td>
                              <td style={{ padding: "6px 10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color: isG || isB ? C.text : C.textMuted, fontSize: 12 }}>{r.node}</td>
                              <td style={{ padding: "6px 10px", textAlign: "right" }}><Bar val={r.resonance} color={isB ? C.green : "#444"} /></td>
                              <td style={{ padding: "6px 10px", textAlign: "right" }}><Bar val={r.coherence} color="#2d6a4f" /></td>
                              <td style={{ padding: "6px 10px", textAlign: "right" }}><Bar val={r.rhythm} color="#1a3a5c" /></td>
                              <td style={{ padding: "6px 10px", textAlign: "right" }}><Bar val={r.bridging} color={isG ? "#78500a" : "#2a2a1a"} /></td>
                              <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                                <Badge node={r.node} grin={analysis.grin} beescratch={analysis.beescratch} trueGrin={analysis.trueGrin} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {analysis.results.length > 15 && (
                      <div style={{ padding: "10px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
                        <Btn small onClick={() => setShowAll(!showAll)}>
                          {showAll ? "Show top 15" : `Show all ${analysis.results.length} nodes`}
                        </Btn>
                      </div>
                    )}
                  </div>
                )}

                {/* Dark matter panel */}
                {tab === "dark" && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                    {analysis.darkMatter.length === 0 ? (
                      <p style={{ padding: 24, color: C.textMuted, textAlign: "center", fontSize: 13 }}>No dark matter patterns detected.</p>
                    ) : (
                      analysis.darkMatter.map((f, i) => {
                        const colors = DARK_MATTER_COLORS[f.type] || { text: C.textMuted, bg: C.surface };
                        return (
                          <div key={i} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.borderDim}`, background: i % 2 === 0 ? "#0d1117" : "transparent" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                              <span style={{ background: colors.bg, color: colors.text, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{f.type}</span>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.text, fontWeight: 600 }}>{f.node}</span>
                              <span style={{ marginLeft: "auto", fontSize: 10, color: C.textDim, fontFamily: "mono" }}>mass: {f.mass}</span>
                            </div>
                            <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{f.desc}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                {/* Chart panel */}
                {tab === "chart" && (
                  <ChartPanel analysis={analysis} />
                )}
              </>
            )}
          </div>
        </div>

        <p style={{ marginTop: 24, fontSize: 11, color: "#21262d", textAlign: "center" }}>
          Resonance = (Rhythm × 0.4) + (Coherence × 0.4) + (Bridging × 0.2) · Keiser 2026 · DOI: 10.5281/zenodo.19009607
        </p>
      </div>
    </div>
  );
}
