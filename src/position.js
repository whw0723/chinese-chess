// 象棋局面表示 - 参考 XQlightweight 实现
// 使用 256 元素一维数组表示 16x16 棋盘（包含边界）

// 常量定义
export const MATE_VALUE = 10000;
export const BAN_VALUE = MATE_VALUE - 100;
export const WIN_VALUE = MATE_VALUE - 200;
export const NULL_SAFE_MARGIN = 400;
export const NULL_OKAY_MARGIN = 200;
export const DRAW_VALUE = 20;
export const ADVANCED_VALUE = 3;

// 棋子类型
export const PIECE_KING = 0;    // 帅/将
export const PIECE_ADVISOR = 1; // 仕/士
export const PIECE_BISHOP = 2;  // 相/象
export const PIECE_KNIGHT = 3;  // 马
export const PIECE_ROOK = 4;    // 车
export const PIECE_CANNON = 5;  // 炮
export const PIECE_PAWN = 6;    // 兵/卒

// 棋盘边界
export const RANK_TOP = 3;
export const RANK_BOTTOM = 12;
export const FILE_LEFT = 3;
export const FILE_RIGHT = 11;

// 棋盘内位置判断表
const IN_BOARD = new Array(256).fill(0);
for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
  for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
    IN_BOARD[x + (y << 4)] = 1;
  }
}

// 九宫格判断表
const IN_FORT = new Array(256).fill(0);
for (let y of [RANK_TOP, RANK_TOP + 1, RANK_TOP + 2, RANK_BOTTOM - 2, RANK_BOTTOM - 1, RANK_BOTTOM]) {
  for (let x of [FILE_LEFT + 3, FILE_LEFT + 4, FILE_LEFT + 5]) {
    IN_FORT[x + (y << 4)] = 1;
  }
}

// 走法合法跨度表
const LEGAL_SPAN = new Array(512).fill(0);
LEGAL_SPAN[256 + 1] = LEGAL_SPAN[256 - 1] = LEGAL_SPAN[256 + 16] = LEGAL_SPAN[256 - 16] = 1;
LEGAL_SPAN[256 + 17] = LEGAL_SPAN[256 - 17] = LEGAL_SPAN[256 + 15] = LEGAL_SPAN[256 - 15] = 2;
LEGAL_SPAN[256 + 33] = LEGAL_SPAN[256 - 33] = LEGAL_SPAN[256 + 31] = LEGAL_SPAN[256 - 31] = 3;
LEGAL_SPAN[256 + 18] = LEGAL_SPAN[256 - 18] = LEGAL_SPAN[256 + 14] = LEGAL_SPAN[256 - 14] = 3;

// 马腿位置表
const KNIGHT_PIN = new Array(512).fill(0);
KNIGHT_PIN[256 - 33] = -16; KNIGHT_PIN[256 - 31] = -16;
KNIGHT_PIN[256 - 18] = -1;  KNIGHT_PIN[256 + 14] = -1;
KNIGHT_PIN[256 - 14] = 1;   KNIGHT_PIN[256 + 18] = 1;
KNIGHT_PIN[256 + 31] = 16;  KNIGHT_PIN[256 + 33] = 16;

// 帅/将的走法增量
const KING_DELTA = [-16, -1, 1, 16];

// 仕/士的走法增量
const ADVISOR_DELTA = [-17, -15, 15, 17];

// 马的走法增量
const KNIGHT_DELTA = [[-33, -31], [-18, 14], [-14, 18], [31, 33]];

// 马将军检查增量
const KNIGHT_CHECK_DELTA = [[-33, -18], [-31, -14], [14, 31], [18, 33]];

// MVV/LVA 价值表（用于吃子排序）
const MVV_VALUE = [50, 10, 10, 30, 40, 30, 20, 0];

// 棋子位置价值表（兵/卒）
const PIECE_VALUE_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 9, 9, 9, 11, 13, 11, 9, 9, 9, 0, 0, 0, 0,
  0, 0, 0, 19, 24, 34, 42, 44, 42, 34, 24, 19, 0, 0, 0, 0,
  0, 0, 0, 19, 24, 32, 37, 37, 37, 32, 24, 19, 0, 0, 0, 0,
  0, 0, 0, 19, 23, 27, 29, 30, 29, 27, 23, 19, 0, 0, 0, 0,
  0, 0, 0, 14, 18, 20, 27, 29, 27, 20, 18, 14, 0, 0, 0, 0,
  0, 0, 0, 7, 0, 13, 0, 16, 0, 13, 0, 7, 0, 0, 0, 0,
  0, 0, 0, 7, 0, 7, 0, 15, 0, 7, 0, 7, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 11, 15, 11, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// 棋子位置价值表（士/仕 和 象/相）
const PIECE_VALUE_ADVISOR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 20, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 18, 0, 0, 20, 23, 20, 0, 0, 18, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 20, 20, 0, 20, 20, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// 棋子位置价值表（马）
const PIECE_VALUE_KNIGHT = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 90, 90, 90, 96, 90, 96, 90, 90, 90, 0, 0, 0, 0,
  0, 0, 0, 90, 96, 103, 97, 94, 97, 103, 96, 90, 0, 0, 0, 0,
  0, 0, 0, 92, 98, 99, 103, 99, 103, 99, 98, 92, 0, 0, 0, 0,
  0, 0, 0, 93, 108, 100, 107, 100, 107, 100, 108, 93, 0, 0, 0, 0,
  0, 0, 0, 90, 100, 99, 103, 104, 103, 99, 100, 90, 0, 0, 0, 0,
  0, 0, 0, 90, 98, 101, 102, 103, 102, 101, 98, 90, 0, 0, 0, 0,
  0, 0, 0, 92, 94, 98, 95, 98, 95, 98, 94, 92, 0, 0, 0, 0,
  0, 0, 0, 93, 92, 94, 95, 92, 95, 94, 92, 93, 0, 0, 0, 0,
  0, 0, 0, 85, 90, 92, 93, 78, 93, 92, 90, 85, 0, 0, 0, 0,
  0, 0, 0, 88, 85, 90, 88, 90, 88, 90, 85, 88, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// 棋子位置价值表（车）
const PIECE_VALUE_ROOK = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 206, 208, 207, 213, 214, 213, 207, 208, 206, 0, 0, 0, 0,
  0, 0, 0, 206, 212, 209, 216, 233, 216, 209, 212, 206, 0, 0, 0, 0,
  0, 0, 0, 206, 208, 207, 214, 216, 214, 207, 208, 206, 0, 0, 0, 0,
  0, 0, 0, 206, 213, 213, 216, 216, 216, 213, 213, 206, 0, 0, 0, 0,
  0, 0, 0, 208, 211, 211, 214, 215, 214, 211, 211, 208, 0, 0, 0, 0,
  0, 0, 0, 208, 212, 212, 214, 215, 214, 212, 212, 208, 0, 0, 0, 0,
  0, 0, 0, 204, 209, 204, 212, 214, 212, 204, 209, 204, 0, 0, 0, 0,
  0, 0, 0, 198, 208, 204, 212, 212, 212, 204, 208, 198, 0, 0, 0, 0,
  0, 0, 0, 200, 208, 206, 212, 200, 212, 206, 208, 200, 0, 0, 0, 0,
  0, 0, 0, 194, 206, 204, 212, 200, 212, 204, 206, 194, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// 棋子位置价值表（炮）
const PIECE_VALUE_CANNON = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 100, 100, 96, 91, 90, 91, 96, 100, 100, 0, 0, 0, 0,
  0, 0, 0, 98, 98, 96, 92, 89, 92, 96, 98, 98, 0, 0, 0, 0,
  0, 0, 0, 97, 97, 96, 91, 92, 91, 96, 97, 97, 0, 0, 0, 0,
  0, 0, 0, 96, 99, 99, 98, 100, 98, 99, 99, 96, 0, 0, 0, 0,
  0, 0, 0, 96, 96, 96, 96, 100, 96, 96, 96, 96, 0, 0, 0, 0,
  0, 0, 0, 95, 96, 99, 96, 100, 96, 99, 96, 95, 0, 0, 0, 0,
  0, 0, 0, 96, 96, 96, 96, 96, 96, 96, 96, 96, 0, 0, 0, 0,
  0, 0, 0, 97, 96, 100, 99, 101, 99, 100, 96, 97, 0, 0, 0, 0,
  0, 0, 0, 96, 97, 98, 98, 98, 98, 98, 97, 96, 0, 0, 0, 0,
  0, 0, 0, 96, 96, 97, 99, 99, 99, 97, 96, 96, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// 所有棋子的价值表
const PIECE_VALUE = [
  PIECE_VALUE_PAWN,
  PIECE_VALUE_ADVISOR,
  PIECE_VALUE_ADVISOR, // BISHOP 使用相同的表
  PIECE_VALUE_KNIGHT,
  PIECE_VALUE_ROOK,
  PIECE_VALUE_CANNON,
  PIECE_VALUE_PAWN
];

// Zobrist 哈希表（简化实现，用于置换表）
class RC4 {
  constructor(key) {
    this.x = this.y = 0;
    this.state = Array.from(Array(256).keys());
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i] + key[i % key.length]) & 0xff;
      this.swap(i, j);
    }
  }

  swap(i, j) {
    const t = this.state[i];
    this.state[i] = this.state[j];
    this.state[j] = t;
  }

  nextByte() {
    this.x = (this.x + 1) & 0xff;
    this.y = (this.y + this.state[this.x]) & 0xff;
    this.swap(this.x, this.y);
    const t = (this.state[this.x] + this.state[this.y]) & 0xff;
    return this.state[t];
  }

  nextLong() {
    const n0 = this.nextByte();
    const n1 = this.nextByte();
    const n2 = this.nextByte();
    const n3 = this.nextByte();
    return n0 + (n1 << 8) + (n2 << 16) + (n3 << 24);
  }
}

// 生成 Zobrist 哈希表
const rc4 = new RC4([0]);
const zobristKeyPlayer = rc4.nextLong();
rc4.nextLong();
const zobristLockPlayer = rc4.nextLong();
const zobristKeyTable = [];
const zobristLockTable = [];
for (let i = 0; i < 14; i++) {
  const keys = [];
  const locks = [];
  for (let j = 0; j < 256; j++) {
    keys.push(rc4.nextLong());
    rc4.nextLong();
    locks.push(rc4.nextLong());
  }
  zobristKeyTable.push(keys);
  zobristLockTable.push(locks);
}

// 辅助函数
export const SQUARE_FLIP = (sq) => 254 - sq;
export const FILE_X = (sq) => sq & 15;
export const RANK_Y = (sq) => sq >> 4;
export const COORD_XY = (x, y) => x + (y << 4);
export const SRC = (mv) => mv & 255;
export const DST = (mv) => mv >> 8;
export const MOVE = (sqSrc, sqDst) => sqSrc + (sqDst << 8);
export const HOME_HALF = (sq, sd) => (sq & 0x80) !== (sd << 7);
export const SAME_HALF = (sqSrc, sqDst) => ((sqSrc ^ sqDst) & 0x80) === 0;
export const SAME_RANK = (sqSrc, sqDst) => ((sqSrc ^ sqDst) & 0xf0) === 0;
export const SAME_FILE = (sqSrc, sqDst) => ((sqSrc ^ sqDst) & 0x0f) === 0;
export const KING_SPAN = (sqSrc, sqDst) => LEGAL_SPAN[sqDst - sqSrc + 256] === 1;
export const ADVISOR_SPAN = (sqSrc, sqDst) => LEGAL_SPAN[sqDst - sqSrc + 256] === 2;
export const BISHOP_SPAN = (sqSrc, sqDst) => LEGAL_SPAN[sqDst - sqSrc + 256] === 3;
export const BISHOP_PIN = (sqSrc, sqDst) => (sqSrc + sqDst) >> 1;
export const KNIGHT_PIN_SQ = (sqSrc, sqDst) => sqSrc + KNIGHT_PIN[sqDst - sqSrc + 256];

// Position 类 - 棋盘局面表示
export class Position {
  constructor() {
    this.sdPlayer = 0; // 0=红方，1=黑方
    this.squares = new Array(256).fill(0);
    this.zobristKey = 0;
    this.zobristLock = 0;
    this.vlWhite = 0;
    this.vlBlack = 0;
    this.distance = 0;
    this.mvList = [0];
    this.pcList = [0];
    this.keyList = [0];
    this.chkList = [false];
  }

  clearBoard() {
    this.sdPlayer = 0;
    this.squares.fill(0);
    this.zobristKey = this.zobristLock = 0;
    this.vlWhite = this.vlBlack = 0;
  }

  setIrrev() {
    this.mvList = [0];
    this.pcList = [0];
    this.keyList = [0];
    this.chkList = [this.checked()];
    this.distance = 0;
  }

  addPiece(sq, pc, bDel = false) {
    this.squares[sq] = bDel ? 0 : pc;
    let pcAdjust;
    if (pc < 16) {
      pcAdjust = pc - 8;
      this.vlWhite += bDel ? -PIECE_VALUE[pcAdjust][sq] : PIECE_VALUE[pcAdjust][sq];
    } else {
      pcAdjust = pc - 16;
      this.vlBlack += bDel ? -PIECE_VALUE[pcAdjust][SQUARE_FLIP(sq)] : PIECE_VALUE[pcAdjust][SQUARE_FLIP(sq)];
      pcAdjust += 7;
    }
    this.zobristKey ^= zobristKeyTable[pcAdjust][sq];
    this.zobristLock ^= zobristLockTable[pcAdjust][sq];
  }

  movePiece(mv) {
    const sqSrc = SRC(mv);
    const sqDst = DST(mv);
    let pc = this.squares[sqDst];
    this.pcList.push(pc);
    if (pc > 0) {
      this.addPiece(sqDst, pc, true);
    }
    pc = this.squares[sqSrc];
    this.addPiece(sqSrc, pc, true);
    this.addPiece(sqDst, pc, false);
    this.mvList.push(mv);
  }

  undoMovePiece() {
    const mv = this.mvList.pop();
    const sqSrc = SRC(mv);
    const sqDst = DST(mv);
    let pc = this.squares[sqDst];
    this.addPiece(sqDst, pc, true);
    this.addPiece(sqSrc, pc, false);
    pc = this.pcList.pop();
    if (pc > 0) {
      this.addPiece(sqDst, pc, false);
    }
  }

  changeSide() {
    this.sdPlayer = 1 - this.sdPlayer;
    this.zobristKey ^= zobristKeyPlayer;
    this.zobristLock ^= zobristLockPlayer;
  }

  makeMove(mv) {
    const zobristKey = this.zobristKey;
    this.movePiece(mv);
    if (this.checked()) {
      this.undoMovePiece();
      return false;
    }
    this.keyList.push(zobristKey);
    this.changeSide();
    this.chkList.push(this.checked());
    this.distance++;
    return true;
  }

  undoMakeMove() {
    this.distance--;
    this.chkList.pop();
    this.changeSide();
    this.keyList.pop();
    this.undoMovePiece();
  }

  nullMove() {
    this.mvList.push(0);
    this.pcList.push(0);
    this.keyList.push(this.zobristKey);
    this.changeSide();
    this.chkList.push(false);
    this.distance++;
  }

  undoNullMove() {
    this.distance--;
    this.chkList.pop();
    this.changeSide();
    this.keyList.pop();
    this.pcList.pop();
    this.mvList.pop();
  }

  // 生成走法
  generateMoves(vls) {
    const mvs = [];
    const pcSelfSide = 8 + (this.sdPlayer << 3);
    const pcOppSide = 16 - (this.sdPlayer << 3);

    for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
      const pcSrc = this.squares[sqSrc];
      if ((pcSrc & pcSelfSide) === 0) continue;

      switch (pcSrc - pcSelfSide) {
        case PIECE_KING:
          for (const delta of KING_DELTA) {
            const sqDst = sqSrc + delta;
            if (!IN_FORT[sqDst]) continue;
            const pcDst = this.squares[sqDst];
            if (vls === null) {
              if ((pcDst & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst));
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_VALUE[pcDst & 7]);
            }
          }
          break;

        case PIECE_ADVISOR:
          for (const delta of ADVISOR_DELTA) {
            const sqDst = sqSrc + delta;
            if (!IN_FORT[sqDst]) continue;
            const pcDst = this.squares[sqDst];
            if (vls === null) {
              if ((pcDst & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst));
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_VALUE[pcDst & 7]);
            }
          }
          break;

        case PIECE_BISHOP:
          for (const delta of ADVISOR_DELTA) {
            let sqDst = sqSrc + delta;
            if (!(IN_BOARD[sqDst] && HOME_HALF(sqDst, this.sdPlayer) && this.squares[sqDst] === 0)) continue;
            sqDst += delta;
            const pcDst = this.squares[sqDst];
            if (vls === null) {
              if ((pcDst & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst));
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_VALUE[pcDst & 7]);
            }
          }
          break;

        case PIECE_KNIGHT:
          for (let i = 0; i < 4; i++) {
            let sqDst = sqSrc + KING_DELTA[i];
            if (this.squares[sqDst] > 0) continue;
            for (let j = 0; j < 2; j++) {
              sqDst = sqSrc + KNIGHT_DELTA[i][j];
              if (!IN_BOARD[sqDst]) continue;
              const pcDst = this.squares[sqDst];
              if (vls === null) {
                if ((pcDst & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst));
              } else if ((pcDst & pcOppSide) !== 0) {
                mvs.push(MOVE(sqSrc, sqDst));
                vls.push(MVV_VALUE[pcDst & 7]);
              }
            }
          }
          break;

        case PIECE_ROOK:
          for (const delta of KING_DELTA) {
            let sqDst = sqSrc + delta;
            while (IN_BOARD[sqDst]) {
              const pcDst = this.squares[sqDst];
              if (pcDst === 0) {
                if (vls === null) mvs.push(MOVE(sqSrc, sqDst));
              } else {
                if ((pcDst & pcOppSide) !== 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                  if (vls !== null) vls.push(MVV_VALUE[pcDst & 7]);
                }
                break;
              }
              sqDst += delta;
            }
          }
          break;

        case PIECE_CANNON:
          for (const delta of KING_DELTA) {
            let sqDst = sqSrc + delta;
            while (IN_BOARD[sqDst]) {
              const pcDst = this.squares[sqDst];
              if (pcDst === 0) {
                if (vls === null) mvs.push(MOVE(sqSrc, sqDst));
              } else {
                break;
              }
              sqDst += delta;
            }
            sqDst += delta;
            while (IN_BOARD[sqDst]) {
              const pcDst = this.squares[sqDst];
              if (pcDst > 0) {
                if ((pcDst & pcOppSide) !== 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                  if (vls !== null) vls.push(MVV_VALUE[pcDst & 7]);
                }
                break;
              }
              sqDst += delta;
            }
          }
          break;

        case PIECE_PAWN: {
          let sqDst = sqSrc + (this.sdPlayer === 0 ? -16 : 16);
          if (IN_BOARD[sqDst]) {
            const pcDst = this.squares[sqDst];
            if (vls === null) {
              if ((pcDst & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst));
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_VALUE[pcDst & 7]);
            }
          }
          if (!HOME_HALF(sqSrc, this.sdPlayer)) {
            for (const delta of [-1, 1]) {
              sqDst = sqSrc + delta;
              if (IN_BOARD[sqDst]) {
                const pcDst = this.squares[sqDst];
                if (vls === null) {
                  if ((pcDst & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst));
                } else if ((pcDst & pcOppSide) !== 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                  vls.push(MVV_VALUE[pcDst & 7]);
                }
              }
            }
          }
          break;
        }
      }
    }
    return mvs;
  }

  // 检查走法是否合法
  legalMove(mv) {
    const sqSrc = SRC(mv);
    const pcSrc = this.squares[sqSrc];
    const pcSelfSide = 8 + (this.sdPlayer << 3);
    if ((pcSrc & pcSelfSide) === 0) return false;

    const sqDst = DST(mv);
    const pcDst = this.squares[sqDst];
    if ((pcDst & pcSelfSide) !== 0) return false;

    switch (pcSrc - pcSelfSide) {
      case PIECE_KING:
        return IN_FORT[sqDst] && KING_SPAN(sqSrc, sqDst);
      case PIECE_ADVISOR:
        return IN_FORT[sqDst] && ADVISOR_SPAN(sqSrc, sqDst);
      case PIECE_BISHOP:
        return SAME_HALF(sqSrc, sqDst) && BISHOP_SPAN(sqSrc, sqDst) &&
               this.squares[BISHOP_PIN(sqSrc, sqDst)] === 0;
      case PIECE_KNIGHT: {
        const sqPin = KNIGHT_PIN_SQ(sqSrc, sqDst);
        return sqPin !== sqSrc && this.squares[sqPin] === 0;
      }
      case PIECE_ROOK:
      case PIECE_CANNON: {
        let delta;
        if (SAME_RANK(sqSrc, sqDst)) {
          delta = (sqDst < sqSrc ? -1 : 1);
        } else if (SAME_FILE(sqSrc, sqDst)) {
          delta = (sqDst < sqSrc ? -16 : 16);
        } else {
          return false;
        }
        let sqPin = sqSrc + delta;
        while (sqPin !== sqDst && this.squares[sqPin] === 0) {
          sqPin += delta;
        }
        if (sqPin === sqDst) {
          return pcDst === 0 || pcSrc - pcSelfSide === PIECE_ROOK;
        }
        if (pcDst === 0 || pcSrc - pcSelfSide !== PIECE_CANNON) {
          return false;
        }
        sqPin += delta;
        while (sqPin !== sqDst && this.squares[sqPin] === 0) {
          sqPin += delta;
        }
        return sqPin === sqDst;
      }
      case PIECE_PAWN:
        if (!HOME_HALF(sqDst, this.sdPlayer) && (sqDst === sqSrc - 1 || sqDst === sqSrc + 1)) {
          return true;
        }
        return sqDst === sqSrc + (this.sdPlayer === 0 ? -16 : 16);
      default:
        return false;
    }
  }

  // 检查是否被将军
  checked() {
    const pcSelfSide = 8 + (this.sdPlayer << 3);
    const pcOppSide = 16 - (this.sdPlayer << 3);
    
    for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
      if (this.squares[sqSrc] !== pcSelfSide + PIECE_KING) continue;

      // 检查兵
      if (this.squares[sqSrc + (this.sdPlayer === 0 ? -16 : 16)] === pcOppSide + PIECE_PAWN) {
        return true;
      }
      for (const delta of [-1, 1]) {
        if (this.squares[sqSrc + delta] === pcOppSide + PIECE_PAWN) {
          return true;
        }
      }

      // 检查马
      for (let i = 0; i < 4; i++) {
        if (this.squares[sqSrc + ADVISOR_DELTA[i]] !== 0) continue;
        for (let j = 0; j < 2; j++) {
          if (this.squares[sqSrc + KNIGHT_CHECK_DELTA[i][j]] === pcOppSide + PIECE_KNIGHT) {
            return true;
          }
        }
      }

      // 检查车和帅
      for (const delta of KING_DELTA) {
        let sqDst = sqSrc + delta;
        while (IN_BOARD[sqDst]) {
          const pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if (pcDst === pcOppSide + PIECE_ROOK || pcDst === pcOppSide + PIECE_KING) {
              return true;
            }
            break;
          }
          sqDst += delta;
        }
        // 检查炮
        sqDst += delta;
        while (IN_BOARD[sqDst]) {
          const pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if (pcDst === pcOppSide + PIECE_CANNON) {
              return true;
            }
            break;
          }
          sqDst += delta;
        }
      }
      return false;
    }
    return false;
  }

  isMate() {
    const mvs = this.generateMoves(null);
    for (const mv of mvs) {
      if (this.makeMove(mv)) {
        this.undoMakeMove();
        return false;
      }
    }
    return true;
  }

  mateValue() {
    return this.distance - MATE_VALUE;
  }

  drawValue() {
    return (this.distance & 1) === 0 ? -DRAW_VALUE : DRAW_VALUE;
  }

  evaluate() {
    const vl = (this.sdPlayer === 0 ? this.vlWhite - this.vlBlack : this.vlBlack - this.vlWhite) + ADVANCED_VALUE;
    return vl === this.drawValue() ? vl - 1 : vl;
  }

  nullOkay() {
    return (this.sdPlayer === 0 ? this.vlWhite : this.vlBlack) > NULL_OKAY_MARGIN;
  }

  nullSafe() {
    return (this.sdPlayer === 0 ? this.vlWhite : this.vlBlack) > NULL_SAFE_MARGIN;
  }

  inCheck() {
    return this.chkList[this.chkList.length - 1];
  }

  captured() {
    return this.pcList[this.pcList.length - 1] > 0;
  }

  repValue(vlRep) {
    const vlReturn = ((vlRep & 2) === 0 ? 0 : this.distance - BAN_VALUE) +
                     ((vlRep & 4) === 0 ? 0 : -(this.distance - BAN_VALUE));
    return vlReturn === 0 ? this.drawValue() : vlReturn;
  }

  repStatus(recur) {
    let selfSide = false;
    let perpCheck = true;
    let oppPerpCheck = true;
    let index = this.mvList.length - 1;
    while (this.mvList[index] > 0 && this.pcList[index] === 0) {
      if (selfSide) {
        perpCheck = perpCheck && this.chkList[index];
        if (this.keyList[index] === this.zobristKey) {
          recur--;
          if (recur === 0) {
            return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0);
          }
        }
      } else {
        oppPerpCheck = oppPerpCheck && this.chkList[index];
      }
      selfSide = !selfSide;
      index--;
    }
    return 0;
  }

  historyIndex(mv) {
    return ((this.squares[SRC(mv)] - 8) << 8) + DST(mv);
  }
}
