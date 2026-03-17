import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { parseLyricsToDynamicTree, type Node, type NodeType } from './utils/parser';
import { NodeView } from './components/NodeView';
import { AnimatePresence, motion } from 'framer-motion';
import { loadDefaultJapaneseParser } from 'budoux';

const jpParser = loadDefaultJapaneseParser();

const INITIAL_LYRICS = `①セールスライティングライカ滑り台
抱いた関心コピー書いたらオール読み
②ポイント3商品を売りたいコンセプト
説得力と魅力を視聴す人いつの間に
③最後までリードしてすっかりはまっとるさ
パソナの法則はそう頭6個から
yo問題プロブレムアフィニティは親近感に
解決策ソリューション＆提案 オファーよ
ナロー絞り込もう　最後アクションis行動`;

function App() {
  const getSaved = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try { return JSON.parse(saved); } catch { return defaultValue; }
  };

  const [hideMarkers, setHideMarkers] = useState(false);

  const [treeData, setTreeData] = useState<Node[]>(() => {
    const saved = getSaved('rap-map-tree-v11', null); // v11に更新してリセット
    return saved || parseLyricsToDynamicTree(INITIAL_LYRICS);
  });
  
  const [lyrics, setLyrics] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showControls] = useState(true);
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rippleIntensity, setRippleIntensity] = useState(() => getSaved('rap-map-ripple', 1.0));
  const [switchInterval, setSwitchInterval] = useState(() => getSaved('rap-map-interval', 30));
  const [typingSpeed] = useState(0.04);
  
  const [mapY, setMapY] = useState(0);
  const isUpdatingFromMap = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapWindowRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const rebuildLyricsText = useCallback((nodes: Node[]): string => {
    let result: string[] = [];
    const flatten = (items: Node[]) => {
      items.forEach(item => {
        if (item.type === 'section') {
          // すでに ① で始まっている場合はそのまま、そうでない空でないラベルは [] で囲む
          if (item.label.startsWith('①')) result.push(item.label);
          else if (item.label.trim()) result.push(`[${item.label}]`);
        }
        else result.push(item.label);
        if (item.children) flatten(item.children);
      });
    };
    flatten(nodes);
    return result.join('\n').trim();
  }, []);

  useEffect(() => {
    localStorage.setItem('rap-map-tree-v11', JSON.stringify(treeData));
    localStorage.setItem('rap-map-ripple', JSON.stringify(rippleIntensity));
    localStorage.setItem('rap-map-interval', JSON.stringify(switchInterval));
    const newText = rebuildLyricsText(treeData);
    if (!isUpdatingFromMap.current) setLyrics(newText);
    isUpdatingFromMap.current = false;
  }, [treeData, rippleIntensity, switchInterval, rebuildLyricsText]);

  useEffect(() => {
    if (bgImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bgImages.length);
    }, switchInterval * 1000);
    return () => clearInterval(timer);
  }, [bgImages.length, switchInterval]);

  useEffect(() => {
    if (focusedId && mapWindowRef.current && treeContainerRef.current) {
      const element = document.getElementById(focusedId);
      if (element) {
        const windowRect = mapWindowRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const windowCenterY = windowRect.top + (windowRect.height / 2);
        const elementCenterY = elementRect.top + (elementRect.height / 2);
        const diff = windowCenterY - elementCenterY;
        setMapY(prev => prev + diff);
      }
    }
  }, [focusedId]);

  const handleTextareaChange = (val: string) => {
    setLyrics(val);
    setTreeData(parseLyricsToDynamicTree(val));
  };

  const handleLabelChange = useCallback((id: string, newLabel: string) => {
    isUpdatingFromMap.current = true;
    const update = (nodes: Node[]): Node[] => nodes.map(node => {
      if (node.id === id) return { ...node, label: newLabel };
      if (node.children) return { ...node, children: update(node.children) };
      return node;
    });
    setTreeData(prev => update(prev));
  }, []);

  const handleTypeChange = useCallback((id: string, newType: NodeType) => {
    isUpdatingFromMap.current = true;
    const update = (nodes: Node[]): Node[] => nodes.map(node => {
      if (node.id === id) return { ...node, type: newType };
      if (node.children) return { ...node, children: update(node.children) };
      return node;
    });
    setTreeData(prev => update(prev));
  }, []);

  const formatAllNodes = useCallback(() => {
    isUpdatingFromMap.current = true;
    const splitNode = (node: Node): Node[] => {
      const text = node.label.replace(/\n/g, ''); 
      if (text.length < 15) return [{ ...node, children: updateList(node.children) }];
      const chunks = jpParser.parse(text);
      let currentLen = 0;
      let breakIdx = -1;
      for (let i = 0; i < chunks.length; i++) {
        currentLen += chunks[i].length;
        if (currentLen >= 7 && i < chunks.length - 1) { breakIdx = i; break; }
      }
      if (breakIdx !== -1) {
        return [
          { ...node, label: chunks.slice(0, breakIdx + 1).join(''), children: [] },
          { id: `split-${Date.now()}-${Math.random()}`, type: node.type, label: chunks.slice(breakIdx + 1).join(''), children: updateList(node.children) }
        ];
      }
      return [{ ...node, children: updateList(node.children) }];
    };
    const updateList = (nodes: Node[]): Node[] => {
      let res: Node[] = [];
      nodes.forEach(n => { res = [...res, ...splitNode(n)]; });
      return res;
    };
    setTreeData(prev => updateList(prev));
  }, []);

  const getAllIds = useCallback((nodes: Node[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) ids = [...ids, ...getAllIds(node.children)];
    });
    return ids;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
      const ids = getAllIds(treeData);
      const idx = focusedId ? ids.indexOf(focusedId) : -1;
      if (e.key === 'ArrowDown') { setFocusedId(ids[(idx + 1) % ids.length]); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { setFocusedId(ids[(idx - 1 + ids.length) % ids.length]); e.preventDefault(); }
      else if (focusedId) {
        const k = e.key.toLowerCase();
        if (k === 'd') handleTypeChange(focusedId, 'section');
        else if (k === 't') handleTypeChange(focusedId, 'mid');
        else if (k === 's' && !e.shiftKey) handleTypeChange(focusedId, 'small');
        else if (k === 's' && e.shiftKey) handleTypeChange(focusedId, 'tiny');
        else if (k === 'k') formatAllNodes();
        else if (k === 'l') setHideMarkers(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [treeData, focusedId, getAllIds, handleTypeChange, formatAllNodes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 15);
    if (files.length > 0) {
      setBgImages(files.map(f => URL.createObjectURL(f)));
      setCurrentIndex(0);
    }
  };

  return (
    <div className="app-container">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="liquid-ripple">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.015" numOctaves="3" seed="1">
            <animate attributeName="baseFrequency" values="0.01 0.015; 0.015 0.02; 0.01 0.015" dur="10s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale={40 * rippleIntensity}>
            <animate attributeName="scale" values={`${30*rippleIntensity};${60*rippleIntensity};${30*rippleIntensity}`} dur="6s" repeatCount="indefinite" />
          </feDisplacementMap>
        </filter>
      </svg>

      <header className="app-header">
        <h1>RAP FLOW <span className="highlight">MAP</span></h1>
        <div className="global-controls">
          <div className="control-group">
            <label>切替:</label>
            <input type="range" min="5" max="120" step="5" value={switchInterval} onChange={(e) => setSwitchInterval(parseInt(e.target.value))} />
            <span className="val-display">{switchInterval}s</span>
          </div>
          <div className="control-group">
            <label>波紋:</label>
            <input type="range" min="0" max="3.0" step="0.1" value={rippleIntensity} onChange={(e) => setRippleIntensity(parseFloat(e.target.value))} />
            <span className="val-display">{rippleIntensity}</span>
          </div>
          <button className="toggle-ui-btn" onClick={() => fileInputRef.current?.click()}>写真追加</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple style={{ display: 'none' }} />
        </div>
      </header>
      
      <main className="main-content">
        <div className="panel editor-panel">
          <textarea value={lyrics} onChange={(e) => handleTextareaChange(e.target.value)} spellCheck={false} placeholder="Lyrics..." />
          <div className="shortcut-guide">
            <h3>SHORTCUT KEYS</h3>
            <div className="guide-grid">
              <div className="guide-item"><span className="key">D</span> 大見出し</div>
              <div className="guide-item"><span className="key">T</span> 中見出し</div>
              <div className="guide-item"><span className="key">S</span> 小見出し</div>
              <div className="guide-item"><span className="key">Shift+S</span> 最小見出し</div>
              <div className="guide-item"><span className="key">K</span> 一括整形</div>
              <div className="guide-item"><span className="key">L</span> マーカー切替</div>
              <div className="guide-item"><span className="key">↑ / ↓</span> フォーカス移動</div>
            </div>
          </div>
        </div>
        <div className="panel visualizer-panel">
          <div className="viz-monitor">
            <div className="bg-viewport">
              <AnimatePresence initial={false}>
                {bgImages.length > 0 && (
                  <motion.div key={bgImages[currentIndex]} className="bg-ripple-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }}>
                    <div className="bg-layer has-image" style={{ backgroundImage: `url("${bgImages[currentIndex]}")`, filter: 'url(#liquid-ripple)' }} />
                  </motion.div>                )}
              </AnimatePresence>
            </div>
            <div className="bg-overlay" />

            <div className="map-window" ref={mapWindowRef}>
              <motion.div ref={treeContainerRef} className="tree-container" animate={{ y: mapY }} transition={{ type: "spring", stiffness: 100, damping: 20 }}>
                {treeData.map(section => (
                  <NodeView key={section.id} node={section} focusedId={focusedId} onFocus={setFocusedId} onChangeType={handleTypeChange} onLabelChange={handleLabelChange} showControls={showControls} typingSpeed={typingSpeed} hideMarkers={hideMarkers} />
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
