import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Node, NodeType } from '../utils/parser';
import './Tree.css';
import { motion } from 'framer-motion';

interface NodeViewProps {
  node: Node;
  depth?: number;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onChangeType: (id: string, newType: NodeType) => void;
  onLabelChange: (id: string, newLabel: string) => void;
  showControls: boolean;
  typingSpeed: number;
  hideMarkers?: boolean;
}

export const NodeView: React.FC<NodeViewProps> = ({ 
  node, 
  depth = 0, 
  focusedId, 
  onFocus,
  onLabelChange,
  typingSpeed,
  hideMarkers = false
}) => {
  const isFocused = focusedId === node.id;
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(node.label);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // マーカー削除ロジック (①②③とその後の空白を削除)
  const displayLabel = useMemo(() => {
    if (hideMarkers) {
      return node.label.replace(/^[①②③]\s*/, '').trim();
    }
    return node.label;
  }, [node.label, hideMarkers]);

  const characters = useMemo(() => displayLabel.split(''), [displayLabel]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { transition: { staggerChildren: typingSpeed } }
  };

  const charVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9, color: "#ffffff" },
    visible: { opacity: 1, y: 0, scale: 1, color: "#ffffff" }
  };

  const focusedCharVariants = {
    hidden: { opacity: 1, scale: 1, color: "#ffffff" },
    visible: {
      opacity: 1,
      color: "#ffffff",
      x: [0, -2, 2, -2, 2, 0],
      y: [0, 2, -2, 2, -2, 0],
      transition: {
        x: { duration: 0.1, repeat: Infinity, repeatType: "mirror" as const },
        y: { duration: 0.1, repeat: Infinity, repeatType: "mirror" as const },
        opacity: { duration: 0.1 }
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onLabelChange(node.id, tempLabel);
  };

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [tempLabel, isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleBlur();
    }
    e.stopPropagation();
  };

  useEffect(() => {
    setTempLabel(node.label);
  }, [node.label]);

  if (node.type === 'section' && !node.label.trim()) {
    return (
      <div className={`node-wrapper depth-${depth} layout-${node.type}`}>
        {node.children && node.children.length > 0 && (
          <div className="children-container">
            {node.children.map((child) => (
              <NodeView 
                key={child.id} 
                node={child} 
                depth={depth + 1} 
                focusedId={focusedId}
                onFocus={onFocus}
                onChangeType={() => {}} 
                onLabelChange={onLabelChange}
                showControls={false}
                typingSpeed={typingSpeed}
                hideMarkers={hideMarkers}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`node-wrapper depth-${depth} layout-${node.type}`}>
      <motion.div 
        id={node.id}
        className={`node-content type-${node.type} ${isFocused ? 'focused' : ''} ${isEditing ? 'editing' : ''}`}
        onClick={() => onFocus(node.id)}
        initial={{ opacity: 0, x: -50 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          scale: isFocused ? 1.1 : 1
        }}
        layout
      >
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            autoFocus
            className="node-textarea"
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        ) : (
          <motion.div 
            className="node-label"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onDoubleClick={() => setIsEditing(true)}
            onClick={() => isFocused && setIsEditing(true)}
          >
            {characters.map((char, index) => (
              <React.Fragment key={`${node.id}-${index}`}>
                {char === '\n' ? (
                  <div className="line-break" style={{ width: '100%', height: 0 }} />
                ) : (
                  <motion.span 
                    className="char-span" 
                    variants={isFocused ? focusedCharVariants : charVariants}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </motion.div>
      
      {node.children && node.children.length > 0 && (
        <div className="children-container">
          {node.children.map((child) => (
            <NodeView 
              key={child.id} 
              node={child} 
              depth={depth + 1} 
              focusedId={focusedId}
              onFocus={onFocus}
              onChangeType={() => {}} 
              onLabelChange={onLabelChange}
              showControls={false}
              typingSpeed={typingSpeed}
              hideMarkers={hideMarkers}
            />
          ))}
        </div>
      )}
    </div>
  );
};
