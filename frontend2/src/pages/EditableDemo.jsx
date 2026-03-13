import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { componentService } from "../services/api";

const EditableDemo = () => {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [originalHTML, setOriginalHTML] = useState("");
  const [activeTab, setActiveTab] = useState("colors");
  const iframeRef = useRef(null);

  // Auto-detected colors from the demo code
  const [detectedColors, setDetectedColors] = useState([]);
  const [customColors, setCustomColors] = useState({});

  // Advanced customization states
  const [fontFamily, setFontFamily] = useState("system-ui, -apple-system, sans-serif");
  const [borderRadius, setBorderRadius] = useState("6px");
  const [spacing, setSpacing] = useState("16px");
  const [customCSS, setCustomCSS] = useState("");
  
  // Effects
  const [shadowStrength, setShadowStrength] = useState("normal");
  const [animationSpeed, setAnimationSpeed] = useState("normal");
  const [opacity, setOpacity] = useState("1");
  
  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Presets
  const [selectedPreset, setSelectedPreset] = useState("default");

  useEffect(() => {
    loadComponent();
  }, [id]);

  const loadComponent = async () => {
    try {
      setLoading(true);
      const data = await componentService.getComponent(id);
      setComponent(data);
      
      // Load the demo HTML content
      const demoUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/demo/${data.id}`;
      const response = await fetch(demoUrl);
      const html = await response.text();
      setOriginalHTML(html);
      
      // Extract and analyze colors from the code
      const colors = extractColorsFromCode(html);
      setDetectedColors(colors);
      
      // Initialize custom colors with detected values
      const initialCustomColors = {};
      colors.forEach((color, index) => {
        initialCustomColors[`color-${index}`] = color.value;
      });
      setCustomColors(initialCustomColors);
      
      // Initialize history with initial colors
      setHistory([initialCustomColors]);
      setHistoryIndex(0);
      
      // Load saved customization from localStorage
      loadSavedCustomization();
      
    } catch (error) {
      setError("Failed to load component demo");
      console.error("Error loading component:", error);
    } finally {
      setLoading(false);
    }
  };

  // Smart color extraction from HTML/CSS
  const extractColorsFromCode = (html) => {
    const colors = [];
    const seenColors = new Set();
    
    // Match hex colors
    const hexRegex = /#([a-fA-F0-9]{3,8})/g;
    let match;
    while ((match = hexRegex.exec(html)) !== null) {
      const hex = `#${match[1]}`;
      if (!seenColors.has(hex)) {
        seenColors.add(hex);
        colors.push({
          id: colors.length,
          name: `Color ${colors.length + 1}`,
          value: hex,
          type: 'hex',
          context: getColorContext(html, match.index)
        });
      }
    }

    // Match rgb/rgba colors
    const rgbRegex = /rgba?\s*\(\s*(\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?)\s*\)/g;
    while ((match = rgbRegex.exec(html)) !== null) {
      const rgb = `rgb(${match[1]})`;
      if (!seenColors.has(rgb)) {
        seenColors.add(rgb);
        colors.push({
          id: colors.length,
          name: `RGB Color ${colors.length + 1}`,
          value: rgb,
          type: 'rgb',
          context: getColorContext(html, match.index)
        });
      }
    }

    // Match CSS variables with colors
    const cssVarRegex = /--([\w-]+):\s*([^;]+)/g;
    while ((match = cssVarRegex.exec(html)) !== null) {
      if (match[2].includes('#') || match[2].includes('rgb')) {
        const value = match[2].trim();
        colors.push({
          id: colors.length,
          name: `--${match[1]}`,
          value: value,
          type: 'css-var',
          cssVar: `--${match[1]}`,
          context: getColorContext(html, match.index)
        });
      }
    }

    return colors.slice(0, 20); // Limit to 20 colors
  };

  const getColorContext = (html, index) => {
    const start = Math.max(0, index - 50);
    const end = Math.min(html.length, index + 50);
    return html.substring(start, end);
  };

  // Update iframe with current customizations
  const updatePreview = useCallback(() => {
    if (!originalHTML || !iframeRef.current) return;

    let updatedHTML = originalHTML;

    // Directly replace color values in the HTML (most reliable method)
    detectedColors.forEach((color, index) => {
      const customValue = customColors[`color-${index}`];
      if (customValue && customValue !== color.value) {
        // Replace all occurrences of this color
        const escapedColor = color.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedColor, 'g');
        updatedHTML = updatedHTML.replace(regex, customValue);
      }
    });

    // Create CSS injection for other customizations
    const cssInjections = [];

    // Add CSS variables for reference
    let colorVars = detectedColors.map((color, index) => {
      const val = customColors[`color-${index}`] || color.value;
      return `  --demo-color-${index}: ${val};`;
    }).join('\n');

    cssInjections.push(`
:root {
${colorVars}
  --custom-font-family: ${fontFamily};
  --custom-border-radius: ${borderRadius};
  --custom-spacing: ${spacing};
}`);

    // Add custom CSS
    if (customCSS.trim()) {
      cssInjections.push(customCSS);
    }

    // Add shadow effects
    const shadows = {
      none: 'none',
      light: '0 1px 3px rgba(0,0,0,0.1)',
      normal: '0 4px 6px rgba(0,0,0,0.15)',
      heavy: '0 10px 20px rgba(0,0,0,0.25)',
      glow: '0 0 20px rgba(59,130,246,0.5)'
    };
    cssInjections.push(`
.card, .component-card, .btn, button, .panel, .box {
  box-shadow: ${shadows[shadowStrength]} !important;
}`);

    // Add animation speed control
    const animSpeed = {
      none: '0s',
      slow: '2s',
      normal: '1s',
      fast: '0.5s'
    };
    if (animationSpeed !== 'normal') {
      cssInjections.push(`
* {
  animation-duration: ${animSpeed[animationSpeed]} !important;
  transition-duration: ${animSpeed[animationSpeed]} !important;
}`);
    }

    // Add global opacity
    if (opacity !== '1') {
      cssInjections.push(`
body, .container, .wrapper {
  opacity: ${opacity} !important;
}`);
    }

    // Add font family override
    cssInjections.push(`
* { font-family: ${fontFamily} !important; }`);

    // Add border radius override
    cssInjections.push(`
button, .btn, input, select, textarea, .card, .component-card, [class*="card"], [class*="button"], [class*="btn"] {
  border-radius: ${borderRadius} !important;
}`);

    // Inject CSS into HTML
    const styleBlock = `<style>\n/* Editable Demo Customizations */\n${cssInjections.join('\n')}\n</style>`;
    
    if (updatedHTML.includes('<head>')) {
      updatedHTML = updatedHTML.replace('<head>', `<head>\n    ${styleBlock}`);
    } else if (updatedHTML.includes('<html>')) {
      updatedHTML = updatedHTML.replace('<html>', `<html>\n  <head>\n    ${styleBlock}\n  </head>`);
    } else {
      updatedHTML = `${styleBlock}\n${updatedHTML}`;
    }

    // Write to iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(updatedHTML);
      iframeDoc.close();
    }
  }, [originalHTML, customColors, detectedColors, fontFamily, borderRadius, spacing, customCSS, shadowStrength, animationSpeed, opacity]);

  // Undo/Redo functions - MUST be defined before useEffect that uses them
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCustomColors(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCustomColors(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // Auto-update preview when any customization changes
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Keyboard shortcuts for undo/redo - Now defined AFTER undo/redo functions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleColorChange = (key, value) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    addToHistory(newColors);
  };

  // Undo/Redo history management
  const addToHistory = (colors) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(colors);
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Export CSS functionality
  const exportCSS = () => {
    let cssContent = `/* Custom Theme CSS for ${component.title} */\n\n:root {\n`;
    
    detectedColors.forEach((color, index) => {
      const customValue = customColors[`color-${index}`];
      if (customValue && customValue !== color.value) {
        cssContent += `  /* ${color.name}: ${color.value} → ${customValue} */\n`;
      }
    });
    
    cssContent += `\n  /* Custom Properties */\n  --custom-font-family: ${fontFamily};\n  --custom-border-radius: ${borderRadius};\n  --custom-spacing: ${spacing};\n}\n\n`;
    
    // Add color replacements
    detectedColors.forEach((color, index) => {
      const customValue = customColors[`color-${index}`];
      if (customValue && customValue !== color.value) {
        cssContent += `/* Replace ${color.value} with ${customValue} */\n* [style*="${color.value}"],\n[style*="${color.value}"] {\n  /* Color override */\n}\n\n`;
      }
    });
    
    cssContent += `/* Global Styles */\n* {\n  font-family: ${fontFamily} !important;\n}\n\nbutton, .btn, input, select, textarea, .card {\n  border-radius: ${borderRadius} !important;\n}`;

    if (customCSS.trim()) {
      cssContent += `\n\n/* Custom CSS */\n${customCSS}`;
    }

    // Download file
    const blob = new Blob([cssContent], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-theme-${id}.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = '✓ CSS exported successfully!';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-btn-primary-bg, #1f883d);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const resetAll = () => {
    const initialCustomColors = {};
    detectedColors.forEach((color, index) => {
      initialCustomColors[`color-${index}`] = color.value;
    });
    setCustomColors(initialCustomColors);
    setFontFamily("system-ui, -apple-system, sans-serif");
    setBorderRadius("6px");
    setSpacing("16px");
    setCustomCSS("");
    setSelectedPreset("default");
  };

  const saveCustomization = () => {
    const customization = {
      componentId: id,
      customColors,
      fontFamily,
      borderRadius,
      spacing,
      customCSS,
      selectedPreset,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`demo-customization-${id}`, JSON.stringify(customization));
    
    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = '✓ Customization saved successfully!';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-btn-primary-bg, #1f883d);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const loadSavedCustomization = () => {
    const saved = localStorage.getItem(`demo-customization-${id}`);
    if (saved) {
      try {
        const customization = JSON.parse(saved);
        setCustomColors(customization.customColors || {});
        setFontFamily(customization.fontFamily || "system-ui, -apple-system, sans-serif");
        setBorderRadius(customization.borderRadius || "6px");
        setSpacing(customization.spacing || "16px");
        setCustomCSS(customization.customCSS || "");
        setSelectedPreset(customization.selectedPreset || "default");
      } catch (e) {
        console.error("Failed to load saved customization", e);
      }
    }
  };

  const applyPreset = (presetName) => {
    setSelectedPreset(presetName);
    
    const colorKeys = Object.keys(customColors).sort();
    const newColors = {};
    
    // Define preset color mappings
    const presets = {
      default: detectedColors.map(c => c.value),
      dark: ["#58a6ff", "#8b949e", "#0d1117", "#c9d1d9", "#238636", "#161b22", "#30363d", "#484f58"],
      light: ["#0969da", "#656d76", "#ffffff", "#1f2328", "#1a7f37", "#f6f8fa", "#d0d7de", "#eaeef2"],
      purple: ["#8257e5", "#9d8ec4", "#f5f3ff", "#2e1065", "#7c3aed", "#ede9fe", "#ddd6fe", "#c4b5fd"],
      ocean: ["#0ea5e9", "#38bdf8", "#f0f9ff", "#0c4a6e", "#0284c7", "#e0f2fe", "#bae6fd", "#7dd3fc"],
      forest: ["#22c55e", "#4ade80", "#f0fdf4", "#14532d", "#16a34a", "#dcfce7", "#bbf7d0", "#86efac"],
      sunset: ["#f97316", "#fb923c", "#fff7ed", "#7c2d12", "#ea580c", "#ffedd5", "#fed7aa", "#fdba74"]
    };
    
    const presetColors = presets[presetName] || presets.default;
    
    colorKeys.forEach((key, index) => {
      newColors[key] = presetColors[index % presetColors.length];
    });
    
    setCustomColors(newColors);
    addToHistory(newColors);
  };

  if (loading) {
    return (
      <div className="loading" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--color-canvas-default, #ffffff)'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="container" style={{ paddingTop: "40px" }}>
        <div className="alert alert-danger">{error || "Component not found"}</div>
      </div>
    );
  }

  return (
    <div className="editable-demo-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--color-canvas-default, #ffffff)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'var(--color-canvas-default, #ffffff)', 
        borderBottom: '1px solid var(--color-border-default, #d0d7de)', 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link 
            to={`/components/${id}`} 
            className="btn btn-secondary"
            style={{ 
              textDecoration: 'none',
              fontSize: '14px',
              padding: '6px 12px'
            }}
          >
            ← Back to Component
          </Link>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 600,
            color: 'var(--color-fg-default, #1f2328)'
          }}>
            {component.title}
          </h1>
          <span style={{ 
            fontSize: '12px', 
            color: 'var(--color-fg-muted, #656d76)',
            backgroundColor: 'var(--color-canvas-subtle, #f6f8fa)',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            Editable Demo
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={undo}
            disabled={historyIndex <= 0}
            className="btn btn-secondary"
            style={{ fontSize: '14px', opacity: historyIndex <= 0 ? 0.5 : 1 }}
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="btn btn-secondary"
            style={{ fontSize: '14px', opacity: historyIndex >= history.length - 1 ? 0.5 : 1 }}
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border-default, #d0d7de)', margin: '0 8px' }} />
          <button 
            onClick={exportCSS}
            className="btn btn-secondary"
            style={{ fontSize: '14px' }}
            title="Export CSS"
          >
            ⬇ Export CSS
          </button>
          <button 
            onClick={resetAll}
            className="btn btn-secondary"
            style={{ fontSize: '14px' }}
          >
            Reset All
          </button>
          <button 
            onClick={saveCustomization}
            className="btn btn-primary"
            style={{ fontSize: '14px' }}
          >
            Save Changes
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Editor */}
        <div style={{ 
          width: '400px', 
          backgroundColor: 'var(--color-canvas-subtle, #f6f8fa)', 
          borderRight: '1px solid var(--color-border-default, #d0d7de)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid var(--color-border-default, #d0d7de)',
            backgroundColor: 'var(--color-canvas-default, #ffffff)'
          }}>
            {['colors', 'typography', 'layout', 'effects', 'presets'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 12px',
                  border: 'none',
                  backgroundColor: activeTab === tab 
                    ? 'var(--color-canvas-subtle, #f6f8fa)' 
                    : 'transparent',
                  borderBottom: activeTab === tab 
                    ? '2px solid var(--color-accent-emphasis, #0969da)' 
                    : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab 
                    ? 'var(--color-fg-default, #1f2328)' 
                    : 'var(--color-fg-muted, #656d76)',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '16px'
          }}>
            {activeTab === 'colors' && (
              <div>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  color: 'var(--color-fg-default, #1f2328)'
                }}>
                  Customize Colors
                </h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'var(--color-fg-muted, #656d76)',
                  marginBottom: '16px'
                }}>
                  Changes are applied instantly to the live preview
                </p>
                
                {/* Background Colors */}
                {detectedColors.filter(c => c.context?.toLowerCase().includes('background') || c.name.toLowerCase().includes('background') || c.cssVar?.toLowerCase().includes('background')).length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-fg-default, #1f2328)',
                      margin: '0 0 12px 0',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--color-border-default, #d0d7de)'
                    }}>
                      Background Colors ({detectedColors.filter(c => c.context?.toLowerCase().includes('background') || c.name.toLowerCase().includes('background') || c.cssVar?.toLowerCase().includes('background')).length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detectedColors
                        .map((color, index) => ({ ...color, originalIndex: index }))
                        .filter(c => c.context?.toLowerCase().includes('background') || c.name.toLowerCase().includes('background') || c.cssVar?.toLowerCase().includes('background'))
                        .map((color) => {
                          const index = color.originalIndex;
                          return (
                            <div 
                              key={index}
                              style={{
                                backgroundColor: 'var(--color-canvas-default, #ffffff)',
                                border: '1px solid var(--color-border-default, #d0d7de)',
                                borderRadius: '6px',
                                padding: '12px'
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  backgroundColor: customColors[`color-${index}`] || color.value,
                                  border: '1px solid var(--color-border-default, #d0d7de)',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                                }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    color: 'var(--color-fg-default, #1f2328)'
                                  }}>
                                    {color.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--color-fg-muted, #656d76)'
                                  }}>
                                    {color.type === 'css-var' ? 'CSS Variable' : color.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="color"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    width: '44px', 
                                    height: '32px', 
                                    border: '1px solid var(--color-border-default, #d0d7de)', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    flex: 1,
                                    padding: '6px 12px',
                                    border: '1px solid var(--color-border-default, #d0d7de)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Text Colors */}
                {detectedColors.filter(c => 
                  (c.context?.toLowerCase().includes('color') && !c.context?.toLowerCase().includes('background')) || 
                  c.name.toLowerCase().includes('text') || 
                  c.cssVar?.toLowerCase().includes('text') ||
                  c.cssVar?.toLowerCase().includes('fg-') ||
                  c.cssVar?.toLowerCase().includes('foreground')
                ).length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-fg-default, #1f2328)',
                      margin: '0 0 12px 0',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--color-border-default, #d0d7de)'
                    }}>
                      Text Colors ({detectedColors.filter(c => 
                        (c.context?.toLowerCase().includes('color') && !c.context?.toLowerCase().includes('background')) || 
                        c.name.toLowerCase().includes('text') || 
                        c.cssVar?.toLowerCase().includes('text') ||
                        c.cssVar?.toLowerCase().includes('fg-') ||
                        c.cssVar?.toLowerCase().includes('foreground')
                      ).length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detectedColors
                        .map((color, index) => ({ ...color, originalIndex: index }))
                        .filter(c => 
                          (c.context?.toLowerCase().includes('color') && !c.context?.toLowerCase().includes('background')) || 
                          c.name.toLowerCase().includes('text') || 
                          c.cssVar?.toLowerCase().includes('text') ||
                          c.cssVar?.toLowerCase().includes('fg-') ||
                          c.cssVar?.toLowerCase().includes('foreground')
                        )
                        .map((color) => {
                          const index = color.originalIndex;
                          return (
                            <div 
                              key={index}
                              style={{
                                backgroundColor: 'var(--color-canvas-default, #ffffff)',
                                border: '1px solid var(--color-border-default, #d0d7de)',
                                borderRadius: '6px',
                                padding: '12px'
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  backgroundColor: customColors[`color-${index}`] || color.value,
                                  border: '1px solid var(--color-border-default, #d0d7de)',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                                }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    color: 'var(--color-fg-default, #1f2328)'
                                  }}>
                                    {color.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--color-fg-muted, #656d76)'
                                  }}>
                                    {color.type === 'css-var' ? 'CSS Variable' : color.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="color"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    width: '44px', 
                                    height: '32px', 
                                    border: '1px solid var(--color-border-default, #d0d7de)', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    flex: 1,
                                    padding: '6px 12px',
                                    border: '1px solid var(--color-border-default, #d0d7de)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Border Colors */}
                {detectedColors.filter(c => c.context?.toLowerCase().includes('border') || c.name.toLowerCase().includes('border') || c.cssVar?.toLowerCase().includes('border')).length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-fg-default, #1f2328)',
                      margin: '0 0 12px 0',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--color-border-default, #d0d7de)'
                    }}>
                      Border Colors ({detectedColors.filter(c => c.context?.toLowerCase().includes('border') || c.name.toLowerCase().includes('border') || c.cssVar?.toLowerCase().includes('border')).length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detectedColors
                        .map((color, index) => ({ ...color, originalIndex: index }))
                        .filter(c => c.context?.toLowerCase().includes('border') || c.name.toLowerCase().includes('border') || c.cssVar?.toLowerCase().includes('border'))
                        .map((color) => {
                          const index = color.originalIndex;
                          return (
                            <div 
                              key={index}
                              style={{
                                backgroundColor: 'var(--color-canvas-default, #ffffff)',
                                border: '1px solid var(--color-border-default, #d0d7de)',
                                borderRadius: '6px',
                                padding: '12px'
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  backgroundColor: customColors[`color-${index}`] || color.value,
                                  border: '1px solid var(--color-border-default, #d0d7de)',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                                }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    color: 'var(--color-fg-default, #1f2328)'
                                  }}>
                                    {color.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--color-fg-muted, #656d76)'
                                  }}>
                                    {color.type === 'css-var' ? 'CSS Variable' : color.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="color"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    width: '44px', 
                                    height: '32px', 
                                    border: '1px solid var(--color-border-default, #d0d7de)', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    flex: 1,
                                    padding: '6px 12px',
                                    border: '1px solid var(--color-border-default, #d0d7de)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Other Colors - colors that don't fit above categories */}
                {detectedColors.filter(c => 
                  !(c.context?.toLowerCase().includes('background') || c.name.toLowerCase().includes('background') || c.cssVar?.toLowerCase().includes('background')) &&
                  !(c.context?.toLowerCase().includes('border') || c.name.toLowerCase().includes('border') || c.cssVar?.toLowerCase().includes('border')) &&
                  !((c.context?.toLowerCase().includes('color') && !c.context?.toLowerCase().includes('background')) || 
                    c.name.toLowerCase().includes('text') || 
                    c.cssVar?.toLowerCase().includes('text') ||
                    c.cssVar?.toLowerCase().includes('fg-') ||
                    c.cssVar?.toLowerCase().includes('foreground'))
                ).length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-fg-default, #1f2328)',
                      margin: '0 0 12px 0',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--color-border-default, #d0d7de)'
                    }}>
                      Other Colors ({detectedColors.filter(c => 
                        !(c.context?.toLowerCase().includes('background') || c.name.toLowerCase().includes('background') || c.cssVar?.toLowerCase().includes('background')) &&
                        !(c.context?.toLowerCase().includes('border') || c.name.toLowerCase().includes('border') || c.cssVar?.toLowerCase().includes('border')) &&
                        !((c.context?.toLowerCase().includes('color') && !c.context?.toLowerCase().includes('background')) || 
                          c.name.toLowerCase().includes('text') || 
                          c.cssVar?.toLowerCase().includes('text') ||
                          c.cssVar?.toLowerCase().includes('fg-') ||
                          c.cssVar?.toLowerCase().includes('foreground'))
                      ).length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detectedColors
                        .map((color, index) => ({ ...color, originalIndex: index }))
                        .filter(c => 
                          !(c.context?.toLowerCase().includes('background') || c.name.toLowerCase().includes('background') || c.cssVar?.toLowerCase().includes('background')) &&
                          !(c.context?.toLowerCase().includes('border') || c.name.toLowerCase().includes('border') || c.cssVar?.toLowerCase().includes('border')) &&
                          !((c.context?.toLowerCase().includes('color') && !c.context?.toLowerCase().includes('background')) || 
                            c.name.toLowerCase().includes('text') || 
                            c.cssVar?.toLowerCase().includes('text') ||
                            c.cssVar?.toLowerCase().includes('fg-') ||
                            c.cssVar?.toLowerCase().includes('foreground'))
                        )
                        .map((color) => {
                          const index = color.originalIndex;
                          return (
                            <div 
                              key={index}
                              style={{
                                backgroundColor: 'var(--color-canvas-default, #ffffff)',
                                border: '1px solid var(--color-border-default, #d0d7de)',
                                borderRadius: '6px',
                                padding: '12px'
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  backgroundColor: customColors[`color-${index}`] || color.value,
                                  border: '1px solid var(--color-border-default, #d0d7de)',
                                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                                }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    color: 'var(--color-fg-default, #1f2328)'
                                  }}>
                                    {color.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--color-fg-muted, #656d76)'
                                  }}>
                                    {color.type === 'css-var' ? 'CSS Variable' : color.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="color"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    width: '44px', 
                                    height: '32px', 
                                    border: '1px solid var(--color-border-default, #d0d7de)', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={customColors[`color-${index}`] || color.value}
                                  onChange={(e) => handleColorChange(`color-${index}`, e.target.value)}
                                  style={{ 
                                    flex: 1,
                                    padding: '6px 12px',
                                    border: '1px solid var(--color-border-default, #d0d7de)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {detectedColors.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: 'var(--color-fg-muted, #656d76)'
                  }}>
                    <p>No colors detected in the component code.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'typography' && (
              <div>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: 600 
                }}>
                  Typography
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border-default, #d0d7de)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="system-ui, -apple-system, sans-serif">System Default</option>
                    <option value="Georgia, serif">Georgia (Serif)</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Courier New, monospace">Courier New (Mono)</option>
                    <option value="ui-monospace, SFMono-Regular, monospace">System Mono</option>
                  </select>
                </div>

                <div style={{ 
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: 'var(--color-canvas-default, #ffffff)',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-default, #d0d7de)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Preview</h4>
                  <p style={{ 
                    fontFamily: fontFamily,
                    fontSize: '14px',
                    margin: 0
                  }}>
                    The quick brown fox jumps over the lazy dog.
                  </p>
                  <p style={{ 
                    fontFamily: fontFamily,
                    fontSize: '12px',
                    margin: '8px 0 0 0',
                    color: 'var(--color-fg-muted, #656d76)'
                  }}>
                    Current: {fontFamily.split(',')[0]}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: 600 
                }}>
                  Layout & Spacing
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Border Radius
                  </label>
                  <select
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border-default, #d0d7de)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="0px">None (0px)</option>
                    <option value="4px">Small (4px)</option>
                    <option value="6px">Medium (6px)</option>
                    <option value="8px">Large (8px)</option>
                    <option value="12px">Extra Large (12px)</option>
                    <option value="9999px">Full (Pill)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Base Spacing
                  </label>
                  <select
                    value={spacing}
                    onChange={(e) => setSpacing(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border-default, #d0d7de)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="8px">Compact (8px)</option>
                    <option value="16px">Normal (16px)</option>
                    <option value="24px">Relaxed (24px)</option>
                    <option value="32px">Spacious (32px)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Custom CSS
                  </label>
                  <textarea
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    placeholder="/* Add your custom CSS here */\n.custom-class {\n  color: red;\n}"
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      padding: '12px',
                      border: '1px solid var(--color-border-default, #d0d7de)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'effects' && (
              <div>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: 600 
                }}>
                  Effects & Styling
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Shadow Strength
                  </label>
                  <select
                    value={shadowStrength}
                    onChange={(e) => setShadowStrength(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border-default, #d0d7de)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="none">None</option>
                    <option value="light">Light</option>
                    <option value="normal">Normal</option>
                    <option value="heavy">Heavy</option>
                    <option value="glow">Glow Effect</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Animation Speed
                  </label>
                  <select
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border-default, #d0d7de)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="none">No Animations</option>
                    <option value="slow">Slow (2x)</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast (0.5x)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}>
                    Global Opacity
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-fg-muted, #656d76)', marginTop: '4px' }}>
                    <span>30%</span>
                    <span>{Math.round(opacity * 100)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: 'var(--color-canvas-default, #ffffff)',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-default, #d0d7de)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Quick Tips</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-fg-muted, #656d76)' }}>
                    <li>Use shadows to add depth</li>
                    <li>Adjust opacity for overlays</li>
                    <li>Control animation speed for better UX</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'presets' && (
              <div>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: 600 
                }}>
                  Theme Presets
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'default', label: 'Default (Original)', desc: 'Reset to original colors' },
                    { name: 'dark', label: 'Dark Mode', desc: 'GitHub dark theme style' },
                    { name: 'light', label: 'Clean Light', desc: 'Bright and minimal' },
                    { name: 'purple', label: 'Purple Dream', desc: 'Modern purple gradient' },
                    { name: 'ocean', label: 'Ocean Blue', desc: 'Calm blue tones' },
                    { name: 'forest', label: 'Forest Green', desc: 'Natural green palette' },
                    { name: 'sunset', label: 'Sunset Orange', desc: 'Warm sunset colors' }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset.name)}
                      style={{
                        padding: '16px',
                        border: selectedPreset === preset.name 
                          ? '2px solid var(--color-accent-emphasis, #0969da)' 
                          : '1px solid var(--color-border-default, #d0d7de)',
                        borderRadius: '6px',
                        backgroundColor: selectedPreset === preset.name 
                          ? 'var(--color-canvas-subtle, #f6f8fa)' 
                          : 'var(--color-canvas-default, #ffffff)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: '14px',
                        color: 'var(--color-fg-default, #1f2328)'
                      }}>
                        {preset.label}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--color-fg-muted, #656d76)',
                        marginTop: '4px'
                      }}>
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--color-canvas-subtle, #f6f8fa)'
        }}>
          <div style={{ 
            backgroundColor: 'var(--color-canvas-default, #ffffff)', 
            padding: '12px 24px', 
            borderBottom: '1px solid var(--color-border-default, #d0d7de)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: 600,
                color: 'var(--color-fg-default, #1f2328)'
              }}>
                Live Preview
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--color-fg-muted, #656d76)',
                backgroundColor: 'var(--color-canvas-subtle, #f6f8fa)',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#1a7f37',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></span>
                Real-time
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const iframe = iframeRef.current;
                  if (iframe) {
                    iframe.style.width = '375px';
                  }
                }}
                className="btn btn-sm btn-secondary"
                title="Mobile view"
              >
                Mobile
              </button>
              <button
                onClick={() => {
                  const iframe = iframeRef.current;
                  if (iframe) {
                    iframe.style.width = '768px';
                  }
                }}
                className="btn btn-sm btn-secondary"
                title="Tablet view"
              >
                Tablet
              </button>
              <button
                onClick={() => {
                  const iframe = iframeRef.current;
                  if (iframe) {
                    iframe.style.width = '100%';
                  }
                }}
                className="btn btn-sm btn-secondary"
                title="Desktop view"
              >
                Desktop
              </button>
            </div>
          </div>
          
          <div style={{ 
            flex: 1, 
            padding: '24px',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }}>
              <iframe
                ref={iframeRef}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  transition: 'width 0.3s ease'
                }}
                title="Component Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .editable-demo-container {
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default EditableDemo;
