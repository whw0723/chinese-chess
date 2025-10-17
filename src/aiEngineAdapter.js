// AI 引擎适配器 - 将新实现的搜索引擎适配到现有的游戏逻辑

import { Position, COORD_XY, SRC, DST, RANK_TOP, FILE_LEFT, PIECE_KING, PIECE_ADVISOR, PIECE_BISHOP, PIECE_KNIGHT, PIECE_ROOK, PIECE_CANNON, PIECE_PAWN } from './position.js';
import { Search, LIMIT_DEPTH } from './search.js';

// 棋子类型映射（从旧格式到新格式）
const PIECE_TYPE_MAP = {
  'king': PIECE_KING,
  'advisor': PIECE_ADVISOR,
  'bishop': PIECE_BISHOP,
  'knight': PIECE_KNIGHT,
  'rook': PIECE_ROOK,
  'cannon': PIECE_CANNON,
  'pawn': PIECE_PAWN
};

// 将 10x9 棋盘转换为 256 元素数组
function convertBoardToPosition(board, currentPlayer) {
  const pos = new Position();
  pos.clearBoard();
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        // 转换坐标 (row, col) -> sq
        const sq = COORD_XY(FILE_LEFT + col, RANK_TOP + row);
        // 转换棋子类型
        const pcType = PIECE_TYPE_MAP[piece.type];
        // 棋子编码: 红方 8-14, 黑方 16-22
        const pc = (piece.color === 'red' ? 8 : 16) + pcType;
        pos.addPiece(sq, pc, false);
      }
    }
  }
  
  // 设置走棋方
  pos.sdPlayer = currentPlayer === 'red' ? 0 : 1;
  pos.setIrrev();
  
  return pos;
}

// 将走法从 256 格式转换为 10x9 格式
function convertMoveToOldFormat(mv) {
  if (!mv || mv === 0) return null;
  
  const sqSrc = SRC(mv);
  const sqDst = DST(mv);
  
  // 提取行列
  const srcRow = (sqSrc >> 4) - RANK_TOP;
  const srcCol = (sqSrc & 15) - FILE_LEFT;
  const dstRow = (sqDst >> 4) - RANK_TOP;
  const dstCol = (sqDst & 15) - FILE_LEFT;
  
  return {
    from: [srcRow, srcCol],
    to: [dstRow, dstCol]
  };
}

// 主函数：计算最佳走法
export function calculateBestMove(board, aiColor, difficulty = 'medium') {
  // 难度设置（重新调整）
  const settingsMap = {
    easy: { depth: 3, millis: 500, hashLevel: 14 },      // 简单：0.5秒，深度3（更简单）
    medium: { depth: 5, millis: 800, hashLevel: 16 },   // 中等：0.8秒，深度5（原简单）
    hard: { depth: 8, millis: 2000, hashLevel: 18 }     // 困难：2秒，深度8（原中等）
  };
  
  const settings = settingsMap[difficulty] || settingsMap.medium;
  
  // 转换棋盘
  const pos = convertBoardToPosition(board, aiColor);
  
  // 创建搜索引擎
  const search = new Search(pos, settings.hashLevel);
  
  // 搜索
  const startTime = Date.now();
  const mv = search.searchMain(settings.depth, settings.millis);
  const endTime = Date.now();
  
  // 统计信息
  const stats = {
    nodes: search.allNodes,
    time: endTime - startTime,
    knps: search.getKNPS().toFixed(2),
    depth: settings.depth
  };
  
  console.log(`AI搜索完成: 深度=${stats.depth}, 节点数=${stats.nodes}, 用时=${stats.time}ms, 速度=${stats.knps}K节点/秒`);
  
  // 转换走法格式
  const move = convertMoveToOldFormat(mv);
  
  if (!move) {
    console.warn('AI 未找到合法走法');
    return null;
  }
  
  // 获取移动的棋子信息
  const [fromRow, fromCol] = move.from;
  const piece = board[fromRow][fromCol];
  
  return {
    from: move.from,
    to: move.to,
    piece: piece
  };
}
