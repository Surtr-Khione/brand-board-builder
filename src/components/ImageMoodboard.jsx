import { useState, useRef } from "react";
import { analyzeImages } from "../lib/ai";

function hexToRgb(hex) {
  const h = (hex || "").replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "128,128,128" : `${r},${g},${b}`;
}

function luma(hex) {
  const [r, g, b] = hexToRgb(hex).split(",").map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: reader.result.split(",")[1], mediaType: file.type });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageMoodboard({ onApply }) {
  const [images, setImages] = useState([]); // [{id, src, label, base64?, mediaType?, url?}]
  const [urlInput, setUrlInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef(null);
  const idRef = useRef(0);

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    const id = ++idRef.current;
    const label = u.split("/").pop()?.slice(0, 30) || "image";
    setImages(prev => [...prev, { id, src: u.startsWith("http") ? u : `https://${u}`, label, url: u.startsWith("http") ? u : `https://${u}` }]);
    setUrlInput("");
    setResult(null);
    setApplied(false);
  };

  const addFiles = async (files) => {
    const newImgs = [];
    for (const file of Array.from(files).slice(0, 8 - images.length)) {
      if (!file.type.startsWith("image/")) continue;
      const { base64, mediaType } = await fileToBase64(file);
      const id = ++idRef.current;
      const src = URL.createObjectURL(file);
      newImgs.push({ id, src, label: file.name, base64, mediaType });
    }
    setImages(prev => [...prev, ...newImgs].slice(0, 8));
    setResult(null);
    setApplied(false);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(i => i.id !== id));
    setResult(null);
    setApplied(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) addFiles(files);
  };

  const handleAnalyze = async () => {
    if (!images.length) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setApplied(false);
    try {
      const payload = images.map(img =>
        img.base64
          ? { base64: img.base64, mediaType: img.mediaType }
          : { url: img.url || img.src }
      );
      const data = await analyzeImages(payload);
      setResult(data.analysis);
    } catch (err) {
      setError(err.message || "Analysis failed");
    }
    setAnalyzing(false);
  };

  const handleApply = () => {
    if (!result) return;
    const updates = {};
    if (result.photoStyle) updates.photoStyle = result.photoStyle;
    if (result.photoMood) updates.photoMood = result.photoMood;
    if (result.aestheticKeywords?.some(Boolean)) updates.moodboardKeywords = result.aestheticKeywords;
    if (result.subjectMatter) updates.photoSubjects = result.subjectMatter;
    if (result.suggestedPrimaryColor) updates.primaryColor = result.suggestedPrimaryColor;
    if (result.suggestedSecondaryColor) updates.secondaryColor = result.suggestedSecondaryColor;
    if (result.suggestedAccentColor) updates.accentColor = result.suggestedAccentColor;
    onApply(updates);
    setApplied(true);
  };

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.012)", overflow: "hidden", marginBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🖼</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7" }}>Visual Moodboard Analysis</div>
          <div style={{ fontSize: 11, color: "#444" }}>Add brand images or product shots — Claude reads your visual DNA</div>
        </div>
        {images.length > 0 && (
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#555" }}>{images.length}/8 images</div>
        )}
      </div>

      <div style={{ padding: 18 }}>
        {/* URL input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addUrl()}
            placeholder="Paste an image URL and press Enter…"
            style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <button
            onClick={addUrl}
            disabled={!urlInput.trim()}
            style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: urlInput.trim() ? "#e0e0e0" : "#333", cursor: urlInput.trim() ? "pointer" : "default", fontSize: 13, fontFamily: "inherit", whiteSpace: "nowrap" }}
          >
            Add URL
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={images.length >= 8}
            style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(0,113,227,0.25)", background: "rgba(0,113,227,0.06)", color: "#0071E3", cursor: images.length >= 8 ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "inherit", whiteSpace: "nowrap" }}
          >
            Upload
          </button>
          <input type="file" ref={fileRef} accept="image/*" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
        </div>

        {/* Drop zone + image grid */}
        {images.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{ border: "1.5px dashed rgba(255,255,255,0.08)", borderRadius: 10, padding: "32px 20px", textAlign: "center", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 13, color: "#555" }}>Drop images here, paste URLs above, or upload files</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>Product shots, Instagram posts, ads, website hero images — up to 8</div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 14 }}
          >
            {images.map(img => (
              <div key={img.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0c0c0c" }}>
                <img
                  src={img.src}
                  alt={img.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  crossOrigin="anonymous"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                >×</button>
              </div>
            ))}
            {images.length < 8 && (
              <div
                onClick={() => fileRef.current?.click()}
                style={{ aspectRatio: "1", borderRadius: 8, border: "1.5px dashed rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#333", fontSize: 22 }}
              >+</div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {images.length > 0 && !result && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", cursor: analyzing ? "wait" : "pointer", background: analyzing ? "rgba(0,113,227,0.25)" : "linear-gradient(135deg,#0071E3,#005BB8)", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}
          >
            {analyzing ? `Analyzing ${images.length} image${images.length > 1 ? "s" : ""}…` : `✦ Analyze Visual Brand (${images.length} image${images.length > 1 ? "s" : ""})`}
          </button>
        )}
        {error && <div style={{ fontSize: 12, color: "#FF453A", marginTop: 8 }}>{error}</div>}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 2 }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
              {/* Color palette */}
              <div>
                <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Visual Color Palette</div>
                {result.dominantColors?.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: c.hex, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 0.4 }}>{c.role}</div>
                      <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{c.hex}</div>
                    </div>
                  </div>
                ))}
                {/* Suggested brand palette */}
                {(result.suggestedPrimaryColor || result.suggestedAccentColor) && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Suggested Brand Palette</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[result.suggestedPrimaryColor, result.suggestedSecondaryColor, result.suggestedAccentColor].filter(Boolean).map((hex, i) => (
                        <div key={i} title={hex} style={{ flex: 1, height: 32, borderRadius: 6, background: hex, border: "1px solid rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      {[result.suggestedPrimaryColor, result.suggestedSecondaryColor, result.suggestedAccentColor].filter(Boolean).map((hex, i) => (
                        <div key={i} style={{ flex: 1, fontSize: 8, color: "#333", fontFamily: "monospace", textAlign: "center" }}>{hex}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Visual style */}
              <div>
                <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Visual Identity</div>
                {result.photoStyle && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Photo Style</div>
                    <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{result.photoStyle}</div>
                  </div>
                )}
                {result.photoMood && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Mood</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{result.photoMood}</div>
                  </div>
                )}
                {result.lightingStyle && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Lighting</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{result.lightingStyle}</div>
                  </div>
                )}
                {result.aestheticKeywords?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Aesthetic</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {result.aestheticKeywords.map((k, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {applied ? (
              <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(50,215,75,0.2)", background: "rgba(50,215,75,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#32D74B", fontWeight: 600 }}>✓ Visual identity applied to your brand board</span>
                <button onClick={() => setApplied(false)} style={{ fontSize: 11, color: "#555", background: "transparent", border: "none", cursor: "pointer" }}>Undo</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleApply} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0071E3,#005BB8)", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                  Apply Visual Identity to Board
                </button>
                <button onClick={() => { setResult(null); setImages([]); }} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
