export type NodeType = 'section' | 'mid' | 'small' | 'tiny';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  children: Node[];
}

export function parseLyricsToDynamicTree(text: string): Node[] {
  const normalizedText = text.replace(/\r\n/g, '\n').trim();
  if (!normalizedText) return [];

  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l);
  const root: Node[] = [];
  let currentSection: Node | null = null;
  let currentMid: Node | null = null;

  lines.forEach((line, idx) => {
    const id = `node-${idx}-${Date.now()}`;
    
    // ① または [ ] で始まる場合は大見出し
    if (line.startsWith('①') || (line.startsWith('[') && line.endsWith(']'))) {
      const label = line.startsWith('①') ? line : line.replace(/[\[\]]/g, '');
      currentSection = { id, type: 'section', label, children: [] };
      root.push(currentSection);
      currentMid = null;
    } 
    // ② で始まる場合は中見出し
    else if (line.startsWith('②')) {
      currentMid = { id, type: 'mid', label: line, children: [] };
      if (currentSection) {
        currentSection.children.push(currentMid);
      } else {
        root.push(currentMid);
      }
    } 
    // ③ で始まる場合は小見出し
    else if (line.startsWith('③')) {
      const smallNode: Node = { id, type: 'small', label: line, children: [] };
      if (currentMid) {
        currentMid.children.push(smallNode);
      } else if (currentSection) {
        currentSection.children.push(smallNode);
      } else {
        root.push(smallNode);
      }
    } 
    // マーカーがない場合は、直近の階層の下に自動で追加
    else {
      const node: Node = { id, type: 'small', label: line, children: [] };
      if (currentMid) {
        currentMid.children.push(node);
      } else if (currentSection) {
        currentSection.children.push(node);
      } else {
        root.push(node);
      }
    }
  });

  return root;
}
