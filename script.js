const ImageSize = 600 * 1;
const WhiteWashout = 0.0;
const BACKGROUND = '#888';
const BUILDING = '#8EE';
const POLLUTION = '#FA0';
const DEVICE = '#3F3';
const TERM1 = '#EFE';
const TERM2 = '#BEB';

const PollutionColors = [
  ['Red', '#E00'],
  ['Yellow', '#EE0'],    // yellow 1
  ['Green', '#0E0'],
  ['Blue', '#11F'],
  ['Purple', '#71F'],
  ['Yellow', '#EE0'],    // yellow 2
  ['Mystery', '#222'],
  ['', 'none'],
];

const BLACKLINE = { width: 50 / 3, linecap: 'butt' };
const MARKER = { width: 2, color: '#000' };
const WHITESTRIPE = { width: 50, color: '#FFF', linecap: 'butt' };
const PollutionMarker = { width: 1.5, color: '#000' };
const ContainmentMarker = { width: 1.5, color: '#444' };

const hPitch = 1000 / 3 / 2;
const ObjD = (hPitch * 2) / 3 / Math.sqrt(2);
const ObjW = 25 - 0.5;
const ObjH = 15 - 0.5;
const ObjWidth = 3;
const ObjGap = ObjH;
const BuildingSize = 2 * (ObjD - ObjGap);
const PolutionRR = Math.hypot(ObjW, ObjH) * 1.5;
const HP2 = 2 * hPitch;

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  var start = polarToCartesian(x, y, radius, endAngle);
  var end = polarToCartesian(x, y, radius, startAngle);
  var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  var sweepFlag = '0';
  var d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y,
  ].join(' ');
  return d;
}

function drawGrid(draw, lineStroke) {
  const hLength = WHITESTRIPE.width / 2;
  let fixup = lineStroke.width / 2;
  const HP = hPitch;
  let RR = ((HP * 2) / 3) * 1;
  let DD = HP * 3;
  let DR = DD - RR;
  let DRfix = DR + (RR == 0 ? fixup : 0);
  const DDh = DD + hLength;

  for (const t of [-1, +1]) {
    draw.line(t * HP, -DDh, t * HP, +DDh).stroke(lineStroke);
    draw.line(-DDh, t * HP, +DDh, t * HP).stroke(lineStroke);
  }

  draw.path(describeArc(-DR, -DR, RR, 270, 0)).stroke(lineStroke);
  draw.line(-DRfix, -DD, +DRfix, -DD).stroke(lineStroke);
  draw.path(describeArc(+DR, -DR, RR, 0, 90)).stroke(lineStroke);
  draw.line(+DD, -DRfix, +DD, +DD + fixup).stroke(lineStroke);
  draw.line(+DD + fixup, +DD, -DR, +DD).stroke(lineStroke);
  draw.path(describeArc(-DR, +DR, RR, 180, 270)).stroke(lineStroke);
  draw.line(-DD, +DRfix, -DD, -DRfix).stroke(lineStroke);
}

function drawObject(gg, color) {
  gg.rect(ObjW, ObjH)
    .move(-ObjW / 2, -ObjH / 2)
    .stroke({ width: ObjWidth, color: color });
}

function formatText(text, x, y, fontSize, color, yOffset) {
  text.amove(x, y - fontSize * yOffset);
  text.fill(color);
  text.font({
    anchor: 'middle',
    size: fontSize,
    family: 'Helvetica',
    weight: 'bold',
  });
  text.attr({
    'dominant-baseline': 'middle',
  });
}

function drawSubText(draw, label, cx, cy, color = '#C88') {
  let text = draw.text(label);
  let fontSize = 21;
  let dd = BuildingSize / 2 / Math.sqrt(2) - fontSize + 14;
  formatText(text, dd * cx, dd * cy, fontSize, color, -0.095);
}

function drawCellText(draw, label, cx, cy, rotation = 0) {
  let g1 = draw.group().translate(hPitch * cx, hPitch * cy);
  g1.rotate(rotation);
  let text = g1.text(label);
  formatText(text, 0, 0, 36, '#000', -0.095);

  if (cx == +2 && cy == +2) return;
  drawSubText(g1, '1', -1, -1);
  drawSubText(g1, '2', -1, +1);
  drawSubText(g1, '4', +1, +1);
  drawSubText(g1, '3', +1, -1);
}

function siteXY(siteId) {
  const zoneId = siteId.charAt(0);
  const subzId = siteId.charAt(1);

  const ZoneMap = {
    A: [-1, -1], B: [-1, 0], C: [0, -1], D: [-1, +1],
    E: [0, 0], F: [+1, -1], G: [0, +1], H: [+1, 0],
  };
  const zone = ZoneMap[zoneId];
  const zx = zone[0] * HP2;
  const zy = zone[1] * HP2;

  const SubZMap = {
    0: [0, 0], 1: [-1, -1], 2: [-1, +1], 3: [+1, -1], 4: [+1, +1],
  };
  const subz = SubZMap[subzId];
  const dd = ObjD / Math.sqrt(2);
  const sx = subz[0] * dd;
  const sy = subz[1] * dd;

  return {
    translate: { x: zx + sx, y: zy + sy },
  };
}

function shuffleArray(arraySrc) {
  const array = [...arraySrc];
  for (let i = array.length - 1; i >= 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateRandomPollutions() {
  const originalArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const originalSubZ = ['1', '2', '3', '4', '1', '2', '3', '4'];

  const randomPermutation = shuffleArray(originalArray);
  const randomSubZ = shuffleArray(originalSubZ);

  let randomSites = []
  for (let i = 0; i < randomPermutation.length; i++) {
    randomSites[i] = randomPermutation[i] + randomSubZ[i]
  }
  return randomSites;
}

function visualizePollutions(draw, randomSites, siteCount, oneColor = null) {
  let configuration = ''
  for (let i = 0; i < siteCount; i++) {
    let site = randomSites[i]
    let color = (!oneColor) ? PollutionColors[i][1] : oneColor;

    configuration += site + ' - ' + PollutionColors[i][0] + '\n'

    let g1 = draw.group();
    g1.transform(siteXY(site));
    const dd = PolutionRR * 2
    const rr = PolutionRR * 1
    g1.circle(dd, dd).translate(-rr, -rr)
      .fill(color)
      .stroke(PollutionMarker)
  }
  console.log(configuration)
}

let levelStates = {
  4: { sites: null },
  5: { sites: null },
  6: { sites: null },
  7: { sites: null }
};

function generateMap(PollutionCount, stage = 0, mapContainerId, tableContainerId) {
  if (stage === 2) {
    if (!levelStates[PollutionCount].sites) {
      alert("Please generate Random (Locations) first!");
      return;
    }
  }

  // Clear map container
  const container = document.getElementById(mapContainerId);
  if (container) container.innerHTML = '';

  let OneColor = null;
  let random2;

  if (stage === 2) {
    random2 = levelStates[PollutionCount].sites;
  } else {
    let random1 = generateRandomPollutions();
    random1 = random1.slice(0, PollutionCount);
    console.log('Pollutions Level ' + PollutionCount + ':', random1);
    random2 = shuffleArray(random1);

    levelStates[PollutionCount].sites = random2;

    if (stage === 1) {
      OneColor = '#FFF';
    }
  }

  var draw0 = SVG().addTo('#' + mapContainerId);
  var draw = draw0.size('100%', '100%').attr({ viewBox: '0 0 ' + ImageSize + ' ' + ImageSize }).group();
  draw.translate(ImageSize / 2, ImageSize / 2);
  draw.scale(ImageSize / 1200);

  draw.fill('none');
  draw.stroke({ color: '#000', width: 0, linecap: 'square' });

  // Border Frame
  let x = 1200 / 2;
  draw.polygon([[x, x], [x, -x], [-x, -x], [-x, x]])
    .stroke(MARKER).fill(BACKGROUND);

  // Gray testing
  for (let x = -2; x <= +2; x += 2) {
    for (let y = -2; y <= +2; y += 2) {
      let g1 = draw.group();
      g1.translate(x * hPitch, y * hPitch);
      const HP = hPitch - WHITESTRIPE.width / 2;
      const HP2 = HP * 2;
      const Shades = [
        [BACKGROUND, BACKGROUND, BACKGROUND],
        [BACKGROUND, BACKGROUND, BACKGROUND],
        [BACKGROUND, BACKGROUND, BACKGROUND],
      ];
      g1.rect(HP2, HP2).move(-HP, -HP).fill(Shades[y / 2 + 1][x / 2 + 1]);
    }
  }

  drawGrid(draw, WHITESTRIPE);

  let termSize = hPitch * 2;
  let disp = hPitch * 2 - termSize / 2;
  draw.rect(termSize, termSize).move(disp, disp).fill(TERM1);

  // Checkered Terminal
  let g1 = draw.group();
  g1.translate(2 * hPitch, 2 * hPitch);
  let clipShape = g1.rect(termSize, termSize).move(-termSize / 2, -termSize / 2);
  g1.clipWith(clipShape);
  let group = g1.group().rotate(45);
  let dd_term = (termSize - BLACKLINE.width) / 7 / Math.sqrt(2);
  for (let x = -7; x <= +7; x++) {
    for (let y = -7; y <= +7; y++) {
      if ((x + y) % 2 != 0) continue;
      group.rect(dd_term, dd_term).move(x * dd_term - dd_term / 2, y * dd_term - dd_term / 2).fill(TERM2);
    }
  }

  drawGrid(draw, BLACKLINE);

  visualizePollutions(draw, random2, PollutionCount, OneColor);

  for (let x = -2; x <= +2; x += 2) {
    for (let y = -2; y <= +2; y += 2) {
      let groupObj = draw.group();
      groupObj.translate(x * hPitch, y * hPitch);

      for (let angle = 0; angle < 360; angle += 90) {
        const hLength = WHITESTRIPE.width / 2;
        const t1 = hPitch - hLength;
        const t2 = hPitch + hLength;
        let g2 = groupObj.group().rotate(angle);
        g2.line(0, +t1, 0, +t2).stroke(BLACKLINE);
      }

      if (x == 2 && y == 2) continue;

      let dd_build = BuildingSize;
      let buildGroup = groupObj.group().rotate(45);
      buildGroup.rect(dd_build, dd_build).radius(10).move(-dd_build / 2, -dd_build / 2).fill(BUILDING).stroke(ContainmentMarker);

      for (let angle = 0; angle < 360; angle += 90) {
        let g2 = buildGroup.group().rotate(angle).group().translate(0, ObjD);
        drawObject(g2, POLLUTION);
      }
    }
  }

  // Device Storage Sites
  let storageGroup = draw.group();
  storageGroup.translate(2 * hPitch, 2 * hPitch);
  for (let angle = 0; angle < 180; angle += 90) {
    let s1 = storageGroup.group().rotate(angle);
    let shift = angle == 0 ? -2 : +2;
    for (let i = -1; i <= +1; i++) {
      let tt = hPitch * 1 + 60;
      let s2 = s1.group().translate(tt, ((i + shift) * hPitch) / 2);
      drawObject(s2, DEVICE);

      const idx = (angle != 0) ? 7 - (i + 2) * 2 : 0 + (i + 2) * 2;
      let s3 = s2.group().rotate(-90);
      drawSubText(s3, 'S' + idx, 0, 0.777, DEVICE);
    }
  }

  drawCellText(draw, 'A', -2, -2);
  drawCellText(draw, 'B', -2, 0);
  drawCellText(draw, 'C', 0, -2);
  drawCellText(draw, 'D', -2, +2);
  drawCellText(draw, 'E', 0, 0);
  drawCellText(draw, 'F', +2, -2);
  drawCellText(draw, 'G', 0, +2);
  drawCellText(draw, 'H', +2, 0);
  drawCellText(draw, 'CRL', +2, +2, -45);

  // Border Frame washout
  draw.polygon([[x, x], [x, -x], [-x, -x], [-x, x]])
    .fill('#FFF').opacity(WhiteWashout);

  renderTable(random2, PollutionCount, stage, tableContainerId);
}

function renderTable(randomSites, siteCount, stage, tableContainerId) {
  let entries = [];
  for (let i = 0; i < siteCount; i++) {
    let colorName = (stage === 1) ? '?' : (PollutionColors[i][0] || 'NONE');
    entries.push({ site: randomSites[i], colorName: colorName });
  }

  // Sort ABC
  entries.sort((a, b) => a.site.localeCompare(b.site));

  let tableHtml = '<table class="info-table">';
  for (let entry of entries) {
    tableHtml += `<tr><td>${entry.site}</td><td>${entry.colorName}</td></tr>`;
  }
  tableHtml += '</table>';

  const tbContainer = document.getElementById(tableContainerId);
  if (tbContainer) {
    tbContainer.innerHTML = tableHtml;
  }
}

function globalRandom1() {
  generateMap(4, 0, 'map-explorer', 'table-explorer');
  generateMap(5, 0, 'map-creator', 'table-creator');
  generateMap(6, 1, 'map-innovator', 'table-innovator');
  generateMap(7, 1, 'map-master', 'table-master');
}

function globalRandom2() {
  generateMap(6, 2, 'map-innovator', 'table-innovator');
  generateMap(7, 2, 'map-master', 'table-master');
}

window.onload = () => {
  globalRandom1();
};
