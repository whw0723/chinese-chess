// 中国象棋游戏逻辑

// 棋子类型
export const PIECE_TYPES = {
  ROOK: 'rook',       // 车
  KNIGHT: 'knight',   // 马
  BISHOP: 'bishop',   // 象/相
  ADVISOR: 'advisor', // 士/仕
  KING: 'king',       // 将/帅
  CANNON: 'cannon',   // 炮
  PAWN: 'pawn'        // 兵/卒
};

// 棋子名称映射
export const PIECE_NAMES = {
  red: {
    rook: '车', knight: '马', bishop: '相', advisor: '仕', 
    king: '帅', cannon: '炮', pawn: '兵'
  },
  black: {
    rook: '车', knight: '马', bishop: '象', advisor: '士', 
    king: '将', cannon: '炮', pawn: '卒'
  }
};

// 初始化棋盘
export function createInitialBoard() {
  const board = Array(10).fill(null).map(() => Array(9).fill(null));
  
  // 黑方棋子 (上方, 0-4行)
  board[0][0] = { type: PIECE_TYPES.ROOK, color: 'black' };
  board[0][1] = { type: PIECE_TYPES.KNIGHT, color: 'black' };
  board[0][2] = { type: PIECE_TYPES.BISHOP, color: 'black' };
  board[0][3] = { type: PIECE_TYPES.ADVISOR, color: 'black' };
  board[0][4] = { type: PIECE_TYPES.KING, color: 'black' };
  board[0][5] = { type: PIECE_TYPES.ADVISOR, color: 'black' };
  board[0][6] = { type: PIECE_TYPES.BISHOP, color: 'black' };
  board[0][7] = { type: PIECE_TYPES.KNIGHT, color: 'black' };
  board[0][8] = { type: PIECE_TYPES.ROOK, color: 'black' };
  board[2][1] = { type: PIECE_TYPES.CANNON, color: 'black' };
  board[2][7] = { type: PIECE_TYPES.CANNON, color: 'black' };
  board[3][0] = { type: PIECE_TYPES.PAWN, color: 'black' };
  board[3][2] = { type: PIECE_TYPES.PAWN, color: 'black' };
  board[3][4] = { type: PIECE_TYPES.PAWN, color: 'black' };
  board[3][6] = { type: PIECE_TYPES.PAWN, color: 'black' };
  board[3][8] = { type: PIECE_TYPES.PAWN, color: 'black' };
  
  // 红方棋子 (下方, 5-9行)
  board[9][0] = { type: PIECE_TYPES.ROOK, color: 'red' };
  board[9][1] = { type: PIECE_TYPES.KNIGHT, color: 'red' };
  board[9][2] = { type: PIECE_TYPES.BISHOP, color: 'red' };
  board[9][3] = { type: PIECE_TYPES.ADVISOR, color: 'red' };
  board[9][4] = { type: PIECE_TYPES.KING, color: 'red' };
  board[9][5] = { type: PIECE_TYPES.ADVISOR, color: 'red' };
  board[9][6] = { type: PIECE_TYPES.BISHOP, color: 'red' };
  board[9][7] = { type: PIECE_TYPES.KNIGHT, color: 'red' };
  board[9][8] = { type: PIECE_TYPES.ROOK, color: 'red' };
  board[7][1] = { type: PIECE_TYPES.CANNON, color: 'red' };
  board[7][7] = { type: PIECE_TYPES.CANNON, color: 'red' };
  board[6][0] = { type: PIECE_TYPES.PAWN, color: 'red' };
  board[6][2] = { type: PIECE_TYPES.PAWN, color: 'red' };
  board[6][4] = { type: PIECE_TYPES.PAWN, color: 'red' };
  board[6][6] = { type: PIECE_TYPES.PAWN, color: 'red' };
  board[6][8] = { type: PIECE_TYPES.PAWN, color: 'red' };
  
  return board;
}

// 检查位置是否在棋盘内
function isInBoard(row, col) {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
}

// 检查位置是否在九宫格内
function isInPalace(row, col, color) {
  if (color === 'red') {
    return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  } else {
    return row >= 0 && row <= 2 && col >= 3 && col <= 5;
  }
}

// 检查相/象是否过河
function isValidBishopSide(row, color) {
  if (color === 'red') {
    return row >= 5;
  } else {
    return row <= 4;
  }
}

// 获取车的合法走法
function getRookMoves(board, row, col) {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  directions.forEach(([dr, dc]) => {
    let r = row + dr;
    let c = col + dc;
    while (isInBoard(r, c)) {
      if (board[r][c] === null) {
        moves.push([r, c]);
      } else {
        if (board[r][c].color !== board[row][col].color) {
          moves.push([r, c]);
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });
  
  return moves;
}

// 获取马的合法走法
function getKnightMoves(board, row, col) {
  const moves = [];
  const knightMoves = [
    [-2, -1, -1, 0], [-2, 1, -1, 0],
    [2, -1, 1, 0], [2, 1, 1, 0],
    [-1, -2, 0, -1], [1, -2, 0, -1],
    [-1, 2, 0, 1], [1, 2, 0, 1]
  ];
  
  knightMoves.forEach(([dr, dc, blockR, blockC]) => {
    const r = row + dr;
    const c = col + dc;
    const bR = row + blockR;
    const bC = col + blockC;
    
    if (isInBoard(r, c) && board[bR][bC] === null) {
      if (board[r][c] === null || board[r][c].color !== board[row][col].color) {
        moves.push([r, c]);
      }
    }
  });
  
  return moves;
}

// 获取象/相的合法走法
function getBishopMoves(board, row, col) {
  const moves = [];
  const color = board[row][col].color;
  const bishopMoves = [
    [-2, -2, -1, -1], [-2, 2, -1, 1],
    [2, -2, 1, -1], [2, 2, 1, 1]
  ];
  
  bishopMoves.forEach(([dr, dc, blockR, blockC]) => {
    const r = row + dr;
    const c = col + dc;
    const bR = row + blockR;
    const bC = col + blockC;
    
    if (isInBoard(r, c) && isValidBishopSide(r, color) && board[bR][bC] === null) {
      if (board[r][c] === null || board[r][c].color !== color) {
        moves.push([r, c]);
      }
    }
  });
  
  return moves;
}

// 获取士/仕的合法走法
function getAdvisorMoves(board, row, col) {
  const moves = [];
  const color = board[row][col].color;
  const advisorMoves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  advisorMoves.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    
    if (isInPalace(r, c, color)) {
      if (board[r][c] === null || board[r][c].color !== color) {
        moves.push([r, c]);
      }
    }
  });
  
  return moves;
}

// 检查两个将/帅是否照面
function areKingsFacing(board) {
  // 找到双方的将/帅位置
  let redKingPos = null;
  let blackKingPos = null;
  
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] && board[r][c].type === PIECE_TYPES.KING) {
        if (board[r][c].color === 'red') {
          redKingPos = [r, c];
        } else {
          blackKingPos = [r, c];
        }
      }
    }
  }
  
  if (!redKingPos || !blackKingPos) return false;
  
  // 检查是否在同一列
  if (redKingPos[1] !== blackKingPos[1]) return false;
  
  // 检查中间是否有棋子
  const col = redKingPos[1];
  const startRow = Math.min(redKingPos[0], blackKingPos[0]) + 1;
  const endRow = Math.max(redKingPos[0], blackKingPos[0]);
  
  for (let r = startRow; r < endRow; r++) {
    if (board[r][col] !== null) {
      return false; // 中间有棋子，不照面
    }
  }
  
  return true; // 同一列且中间无子，照面了
}

// 获取将/帅的合法走法
function getKingMoves(board, row, col) {
  const moves = [];
  const color = board[row][col].color;
  const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  kingMoves.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    
    if (isInPalace(r, c, color)) {
      if (board[r][c] === null || board[r][c].color !== color) {
        // 模拟移动后检查是否会导致将帅照面
        const newBoard = movePiece(board, row, col, r, c);
        if (!areKingsFacing(newBoard)) {
          moves.push([r, c]);
        }
      }
    }
  });
  
  return moves;
}

// 获取炮的合法走法
function getCannonMoves(board, row, col) {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  directions.forEach(([dr, dc]) => {
    let r = row + dr;
    let c = col + dc;
    let jumped = false;
    
    while (isInBoard(r, c)) {
      if (board[r][c] === null) {
        if (!jumped) {
          moves.push([r, c]);
        }
      } else {
        if (!jumped) {
          jumped = true;
        } else {
          if (board[r][c].color !== board[row][col].color) {
            moves.push([r, c]);
          }
          break;
        }
      }
      r += dr;
      c += dc;
    }
  });
  
  return moves;
}

// 获取兵/卒的合法走法
function getPawnMoves(board, row, col) {
  const moves = [];
  const color = board[row][col].color;
  const crossedRiver = color === 'red' ? row < 5 : row > 4;
  
  // 向前走
  const forwardRow = color === 'red' ? row - 1 : row + 1;
  if (isInBoard(forwardRow, col)) {
    if (board[forwardRow][col] === null || board[forwardRow][col].color !== color) {
      moves.push([forwardRow, col]);
    }
  }
  
  // 过河后可以左右走
  if (crossedRiver) {
    [[0, -1], [0, 1]].forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (isInBoard(r, c)) {
        if (board[r][c] === null || board[r][c].color !== color) {
          moves.push([r, c]);
        }
      }
    });
  }
  
  return moves;
}

// 获取指定棋子的所有合法走法
export function getLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  
  let moves = [];
  
  switch (piece.type) {
    case PIECE_TYPES.ROOK:
      moves = getRookMoves(board, row, col);
      break;
    case PIECE_TYPES.KNIGHT:
      moves = getKnightMoves(board, row, col);
      break;
    case PIECE_TYPES.BISHOP:
      moves = getBishopMoves(board, row, col);
      break;
    case PIECE_TYPES.ADVISOR:
      moves = getAdvisorMoves(board, row, col);
      break;
    case PIECE_TYPES.KING:
      moves = getKingMoves(board, row, col);
      break;
    case PIECE_TYPES.CANNON:
      moves = getCannonMoves(board, row, col);
      break;
    case PIECE_TYPES.PAWN:
      moves = getPawnMoves(board, row, col);
      break;
  }
  
  return moves;
}

// 检查是否被将军
export function isInCheck(board, color) {
  // 检查是否将帅照面
  if (areKingsFacing(board)) {
    return true;
  }
  
  // 找到己方的将/帅
  let kingPos = null;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] && board[r][c].type === PIECE_TYPES.KING && board[r][c].color === color) {
        kingPos = [r, c];
        break;
      }
    }
    if (kingPos) break;
  }
  
  if (!kingPos) return false;
  
  // 检查对方所有棋子是否能吃掉己方将/帅
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] && board[r][c].color !== color) {
        const moves = getLegalMoves(board, r, c);
        if (moves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1])) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 移动棋子
export function movePiece(board, fromRow, fromCol, toRow, toCol) {
  const newBoard = board.map(row => [...row]);
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  return newBoard;
}

// 检查是否将死
export function isCheckmate(board, color) {
  if (!isInCheck(board, color)) return false;
  
  // 尝试所有可能的移动，看是否能解除将军
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] && board[r][c].color === color) {
        const moves = getLegalMoves(board, r, c);
        for (const [mr, mc] of moves) {
          const newBoard = movePiece(board, r, c, mr, mc);
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
}
