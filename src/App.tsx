/* 全体のレイアウト */
.tree-container {
  display: flex;
  flex-direction: column;
  padding: 100px 50px 100px 120px;
  position: relative;
  min-height: 100vh;
}

/* 1本目のメイン縦線（最左端） */
.tree-container::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 60px;
  width: 4px;
  background: #ffffff;
  z-index: 0;
}

.node-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
}

/* 2本目の階層縦線 */
.children-container {
  display: flex;
  flex-direction: column;
  position: relative;
  border-left: 3px solid #ffffff;
  margin-left: 10px;
  padding-left: 60px;
  margin-top: -5px;
  margin-bottom: 20px;
}

/* 大見出し直下は、2本目の線を引かない（中見出しへ直接繋ぐため） */
.depth-0 > .children-container {
  border-left: none;
  margin-left: 0;
  padding-left: 0;
}

/* 見出しボックス本体 */
.node-content {
  padding: 16px 24px;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: visible;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(8px);
  z-index: 2;
  width: fit-content;
  min-width: 220px;
  transition: all 0.2s ease;
}

/* 接続用の横線 */
.node-content::before {
  content: "";
  position: absolute;
  top: 50%;
  left: -63px;
  width: 63px;
  height: 3px;
  background: #ffffff;
  transform: translateY(-50%);
  z-index: 1;
}

/* --- 大見出し（D） --- */
.type-section {
  margin-left: -62px;
  z-index: 10;
  background: #000 !important;
  border: 4px solid #ffffff !important;
}
.type-section::before {
  left: -20px;
  width: 20px;
}
.type-section .node-label {
  font-size: 4.5rem !important;
  color: #ffff00 !important;
  line-height: 1.1;
}

/* --- 中見出し（T） --- */
.type-mid {
  margin-left: 0px;
}
.type-mid::before {
  left: -63px;
  width: 63px;
}
.type-mid .node-label {
  font-size: 2.2rem !important;
  color: #ff1493 !important;
}

/* --- 小見出し（S） --- */
.type-small, .type-tiny {
  margin-left: 0px;
}
.type-small::before {
  left: -63px;
  width: 63px;
}
.type-small .node-label {
  font-size: 1.0rem !important;
  color: #ffffff !important;
}

/* 選択中（フォーカス時）の枠線 */
.node-content.focused {
  background: rgba(0, 212, 255, 0.2) !important;
  border: 5px solid #00d4ff !important;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.8) !important;
  z-index: 100;
}
