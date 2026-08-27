// Regenerates the app icon set. Run with: npm run icons
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const COLOR = {
  background: [15, 23, 42, 255],
  transparent: [0, 0, 0, 0],
  white: [255, 255, 255, 255],
  side: [56, 189, 248, 255],
  center: [52, 211, 153, 255],
  sideOnLight: [14, 165, 233, 255],
  centerOnLight: [5, 150, 105, 255],
};

const SUBSAMPLES = 4;

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);

  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function roundedRect(x0, y0, width, height, topRadius, bottomRadius) {
  const x1 = x0 + width;
  const y1 = y0 + height;

  return (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) {
      return false;
    }

    if (y < y0 + topRadius) {
      if (x < x0 + topRadius) return (x - (x0 + topRadius)) ** 2 + (y - (y0 + topRadius)) ** 2 <= topRadius ** 2;
      if (x > x1 - topRadius) return (x - (x1 - topRadius)) ** 2 + (y - (y0 + topRadius)) ** 2 <= topRadius ** 2;
    }

    if (y > y1 - bottomRadius) {
      if (x < x0 + bottomRadius)
        return (x - (x0 + bottomRadius)) ** 2 + (y - (y1 - bottomRadius)) ** 2 <= bottomRadius ** 2;
      if (x > x1 - bottomRadius)
        return (x - (x1 - bottomRadius)) ** 2 + (y - (y1 - bottomRadius)) ** 2 <= bottomRadius ** 2;
    }

    return true;
  };
}

function figure({ cx, headCy, headR, bodyWidth, bodyHeight, grow = 0 }, color) {
  const bodyTop = headCy + headR * 0.58;
  const grownWidth = bodyWidth + grow * 2;

  return [
    { test: circle(cx, headCy, headR + grow), color },
    {
      test: roundedRect(
        cx - grownWidth / 2,
        bodyTop - grow,
        grownWidth,
        bodyHeight + grow * 2,
        grownWidth / 2,
        bodyHeight * 0.3 + grow
      ),
      color,
    },
  ];
}

const SIDE_FIGURE = { headR: 0.082, bodyWidth: 0.225, bodyHeight: 0.185 };
const CENTER_FIGURE = { cx: 0.5, headCy: 0.375, headR: 0.104, bodyWidth: 0.285, bodyHeight: 0.225 };

function buildCommunityShapes({ sideColor, centerColor, separatorColor }) {
  return [
    ...figure({ cx: 0.295, headCy: 0.45, ...SIDE_FIGURE }, sideColor),
    ...figure({ cx: 0.705, headCy: 0.45, ...SIDE_FIGURE }, sideColor),
    ...figure({ ...CENTER_FIGURE, grow: 0.028 }, separatorColor),
    ...figure(CENTER_FIGURE, centerColor),
  ];
}

function render({ size, scale, backgroundColor, shapes }) {
  const rgba = Buffer.alloc(size * size * 4);
  const step = 1 / (SUBSAMPLES + 1);
  // Nudges the group so its bounding box is centered on the canvas.
  const contentOffsetY = 0.016;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;

      for (let sy = 1; sy <= SUBSAMPLES; sy += 1) {
        for (let sx = 1; sx <= SUBSAMPLES; sx += 1) {
          const nx = 0.5 + ((px + sx * step) / size - 0.5) / scale;
          const ny = 0.5 + ((py + sy * step) / size - 0.5) / scale - contentOffsetY;

          let color = backgroundColor;
          for (const shape of shapes) {
            if (shape.test(nx, ny)) {
              color = shape.color;
            }
          }

          const alpha = color[3] / 255;
          sumR += color[0] * alpha;
          sumG += color[1] * alpha;
          sumB += color[2] * alpha;
          sumA += alpha;
        }
      }

      const sampleCount = SUBSAMPLES * SUBSAMPLES;
      const alpha = sumA / sampleCount;
      const offset = (py * size + px) * 4;

      rgba[offset] = alpha > 0 ? Math.round(sumR / sampleCount / alpha) : 0;
      rgba[offset + 1] = alpha > 0 ? Math.round(sumG / sampleCount / alpha) : 0;
      rgba[offset + 2] = alpha > 0 ? Math.round(sumB / sampleCount / alpha) : 0;
      rgba[offset + 3] = Math.round(alpha * 255);
    }
  }

  return encodePng(size, rgba);
}

const targets = [
  {
    file: 'icon.png',
    size: 1024,
    scale: 1.12,
    backgroundColor: COLOR.background,
    shapes: buildCommunityShapes({
      sideColor: COLOR.side,
      centerColor: COLOR.center,
      separatorColor: COLOR.background,
    }),
  },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    scale: 0.92,
    backgroundColor: COLOR.transparent,
    shapes: buildCommunityShapes({
      sideColor: COLOR.side,
      centerColor: COLOR.center,
      separatorColor: COLOR.transparent,
    }),
  },
  {
    file: 'android-icon-background.png',
    size: 1024,
    scale: 1,
    backgroundColor: COLOR.background,
    shapes: [],
  },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    scale: 0.92,
    backgroundColor: COLOR.transparent,
    shapes: buildCommunityShapes({
      sideColor: COLOR.white,
      centerColor: COLOR.white,
      separatorColor: COLOR.transparent,
    }),
  },
  {
    file: 'splash-icon.png',
    size: 1024,
    scale: 0.8,
    backgroundColor: COLOR.transparent,
    shapes: buildCommunityShapes({
      sideColor: COLOR.sideOnLight,
      centerColor: COLOR.centerOnLight,
      separatorColor: COLOR.transparent,
    }),
  },
  {
    file: 'favicon.png',
    size: 64,
    scale: 1.12,
    backgroundColor: COLOR.background,
    shapes: buildCommunityShapes({
      sideColor: COLOR.side,
      centerColor: COLOR.center,
      separatorColor: COLOR.background,
    }),
  },
];

for (const target of targets) {
  const png = render(target);
  fs.writeFileSync(path.join(ASSETS_DIR, target.file), png);
  console.log(`wrote assets/${target.file} (${target.size}x${target.size})`);
}
