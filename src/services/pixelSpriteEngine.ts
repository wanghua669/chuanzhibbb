// ============================================================================
// CyberTwin Cozy Studio — 32-Bit 像素精灵切片与边缘漫水抠图引擎 (Sprite Pipeline)
// 核心算法：从每个精灵网格的四周边框向内执行 BFS 漫水填充 (Exterior Flood-Fill)，
// 遇到像素黑/深色描边即停止，从而 100% 剔除外部白底，同时完美保留人物衣服、云朵床、
// 气泡和眼白内部的白色像素！
// ============================================================================

export interface LoadedPixelAssets {
  roomBg: HTMLImageElement | null;
  characterSprites: {
    idleWave: HTMLCanvasElement | null;   // 左上：猫耳耳机蓝发待机挥手
    workCoding: HTMLCanvasElement | null; // 右上：双屏木桌敲代码打工
    drinkSoda: HTMLCanvasElement | null;  // 左下：手持草莓汽水快乐吨吨吨
    sleepCloud: HTMLCanvasElement | null; // 右下：云朵垫安睡冒 Zzz
  };
  furnitureSprites: {
    desk: HTMLCanvasElement | null;       // (0,0) 双屏原木极客桌
    bed: HTMLCanvasElement | null;        // (1,0) 星星云朵睡眠床
    vending: HTMLCanvasElement | null;    // (2,0) 薄荷粉红汽水售货机
    music: HTMLCanvasElement | null;      // (0,1) 复古留声机八音盒
    arcade: HTMLCanvasElement | null;     // (1,1) 马卡龙复古街机
    plant: HTMLCanvasElement | null;      // (2,1) 龟背竹盆栽与熟睡橘猫
  };
  ready: boolean;
}

/**
 * 从单张切片四周边缘发起 BFS 漫水透明化处理，去除外部純白背景并保留内部白色细节
 */
function sliceAndFloodTransparent(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  whiteThreshold = 234
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;
  const visited = new Uint8Array(sw * sh);
  const queue = new Int32Array(sw * sh);
  let head = 0;
  let tail = 0;

  const isBgWhite = (idx: number) => {
    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
  };

  const enqueueIfBg = (x: number, y: number) => {
    if (x < 0 || x >= sw || y < 0 || y >= sh) return;
    const idx = y * sw + x;
    if (visited[idx]) return;
    if (isBgWhite(idx)) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  // 将四条边界上的白色像素加入种子队列
  for (let x = 0; x < sw; x++) {
    enqueueIfBg(x, 0);
    enqueueIfBg(x, sh - 1);
  }
  for (let y = 0; y < sh; y++) {
    enqueueIfBg(0, y);
    enqueueIfBg(sw - 1, y);
  }

  // BFS 漫水遍历外部背景
  while (head < tail) {
    const curr = queue[head++];
    const p = curr * 4;
    data[p + 3] = 0; // 设为完全透明

    const cx = curr % sw;
    const cy = (curr / sw) | 0;

    enqueueIfBg(cx + 1, cy);
    enqueueIfBg(cx - 1, cy);
    enqueueIfBg(cx, cy + 1);
    enqueueIfBg(cx, cy - 1);
  }

  // 对紧邻透明区域的浅灰抗锯齿边缘做柔和羽化
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const idx = y * sw + x;
      if (visited[idx]) continue;
      const hasTransparentNeighbor =
        visited[idx - 1] || visited[idx + 1] || visited[idx - sw] || visited[idx + sw];
      if (hasTransparentNeighbor) {
        const p = idx * 4;
        if (data[p] > 215 && data[p + 1] > 215 && data[p + 2] > 215) {
          data[p + 3] = 90;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

let cachedAssets: LoadedPixelAssets | null = null;

export async function loadCozyPixelAssets(): Promise<LoadedPixelAssets> {
  if (cachedAssets && cachedAssets.ready) {
    return cachedAssets;
  }

  try {
    const [roomBg, charSheet, furnSheet] = await Promise.all([
      loadImage('/assets/pixel/cozy_room_bg.jpg'),
      loadImage('/assets/pixel/chibi_characters_sheet.jpg'),
      loadImage('/assets/pixel/furniture_sheet.jpg'),
    ]);

    const cw = Math.floor(charSheet.width / 2);
    const ch = Math.floor(charSheet.height / 2);

    const fw = Math.floor(furnSheet.width / 3);
    const fh = Math.floor(furnSheet.height / 2);

    cachedAssets = {
      roomBg,
      characterSprites: {
        idleWave: sliceAndFloodTransparent(charSheet, 0, 0, cw, ch),
        workCoding: sliceAndFloodTransparent(charSheet, cw, 0, cw, ch),
        drinkSoda: sliceAndFloodTransparent(charSheet, 0, ch, cw, ch),
        sleepCloud: sliceAndFloodTransparent(charSheet, cw, ch, cw, ch),
      },
      furnitureSprites: {
        desk: sliceAndFloodTransparent(furnSheet, 0, 0, fw, fh),
        bed: sliceAndFloodTransparent(furnSheet, fw, 0, fw, fh),
        vending: sliceAndFloodTransparent(furnSheet, fw * 2, 0, fw, fh),
        music: sliceAndFloodTransparent(furnSheet, 0, fh, fw, fh),
        arcade: sliceAndFloodTransparent(furnSheet, fw, fh, fw, fh),
        plant: sliceAndFloodTransparent(furnSheet, fw * 2, fh, fw, fh),
      },
      ready: true,
    };

    return cachedAssets;
  } catch (err) {
    console.warn('[PixelSpriteEngine] Asset load warning:', err);
    return {
      roomBg: null,
      characterSprites: {
        idleWave: null,
        workCoding: null,
        drinkSoda: null,
        sleepCloud: null,
      },
      furnitureSprites: {
        desk: null,
        bed: null,
        vending: null,
        music: null,
        arcade: null,
        plant: null,
      },
      ready: false,
    };
  }
}
