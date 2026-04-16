const PollutionCount = 4

let OneColor = null
let random1  = null

// random1 = ['D1', 'G2', 'B2', 'H4', 'A1', 'F4', 'C3', 'E3']
// OneColor = '#FFF'

if ( random1 == null )
// while (random1[0] != 'A3') {
  random1 = generateRandomPollutions()
// }

random1 = random1.slice(0, PollutionCount)
console.log( random1 )

let random2 = shuffleArray(random1)


const WhiteWashout = 0.0


// initialize SVG.js
const ImageSize = 600 * 1;
var draw0 = SVG().addTo('body');
var draw = draw0.size(ImageSize, ImageSize).group();
draw.translate(ImageSize / 2, ImageSize / 2);

draw.scale(ImageSize / 1200);

draw.fill('none');
draw.stroke({
  color: '#000', // black line for Leanbot sensor
  width: 0,
  linecap: 'square',
});




const BACKGROUND = '#888';
// const BACKGROUND = '#999';
const BUILDING = '#8EE';
// const POLLUTION = '#F88'; // Light Red
const POLLUTION = '#FA0'; // Light Red
// const POLLUTION = '#F00'; // Light Red
const DEVICE = '#3F3'; // Light Green
const TERM1 = '#EFE';
const TERM2 = '#BEB';

const PollutionColors = [
  ['RED'    , '#E00'],
  ['YELLOW' , '#EE0'],    // yellow 1
  ['GREEN'  , '#0E0'],
  ['BLUE'   , '#11F'],
  ['PURPLE' , '#71F'],
  ['YELLOW' , '#EE0'],    // yellow 2
  ['MYSTERY', '#222'],
  [''       , 'none'],
]

const BLACKLINE = { width: 50 / 3, linecap: 'butt' }; // black line for Leanbot sensor
const MARKER = { width: 2, color: '#000' };
const WHITESTRIPE = { width: 50, color: '#FFF', linecap: 'butt' }; // black line for Leanbot sensor
const PollutionMarker = { width: 1.5, color: '#000' }
const ContainmentMarker = { width: 1.5, color: '#444' }


// const hPitch = 325 / 2
const hPitch = 1000 / 3 / 2;

const ObjD = (hPitch * 2) / 3 / Math.sqrt(2);

const ObjW = 25 - 0.5;
const ObjH = 15 - 0.5;
const ObjWidth = 3;
const ObjGap = ObjH;

// const BuildingSize = 100 + 20
const BuildingSize = 2 * (ObjD - ObjGap);
console.log({ BuildingSize });

const PolutionRR = Math.hypot(ObjW, ObjH) * 1.5
// const PolutionRR = BuildingSize / 4

const HP2 = 2 * hPitch;


// Border Frame
let x = 1200 / 2;
draw
  .polygon([
    [x, x],
    [x, -x],
    [-x, -x],
    [-x, x],
  ])
  .stroke(MARKER)
  .fill(BACKGROUND);

{
  // Gray testing
  for (let x = -2; x <= +2; x += 2) {
    for (let y = -2; y <= +2; y += 2) {
      let g1 = draw.group();
      g1.translate(x * hPitch, y * hPitch);

      const HP = hPitch - WHITESTRIPE.width / 2;
      const HP2 = HP * 2;
      // const Shades = [
      //   ['000', '222', '555'],
      //   ['111', '444', '777'],
      //   ['333', '666', 'FFF'],
      // ];
      const Shades = [
        [BACKGROUND, BACKGROUND, BACKGROUND],
        [BACKGROUND, BACKGROUND, BACKGROUND],
        [BACKGROUND, BACKGROUND, BACKGROUND],
      ];
      g1.rect(HP2, HP2)
        .move(-HP, -HP)
        .fill('#' + Shades[y / 2 + 1][x / 2 + 1]);
    }
  }
}

drawGrid(WHITESTRIPE);

let termSize = hPitch * 2;
let disp = hPitch * 2 - termSize / 2;
draw.rect(termSize, termSize).move(disp, disp).fill(TERM1);

{
  // Checkered Terminal
  let g1 = draw.group();
  g1.translate(2 * hPitch, 2 * hPitch);

  let clipShape = g1
    .rect(termSize, termSize)
    .move(-termSize / 2, -termSize / 2);
  g1.clipWith(clipShape);

  let group = g1.group().rotate(45);

  let dd = (termSize - BLACKLINE.width) / 7 / Math.sqrt(2);
  for (let x = -7; x <= +7; x++) {
    for (let y = -7; y <= +7; y++) {
      if ((x + y) % 2 != 0) continue;
      group
        .rect(dd, dd)
        .move(x * dd - dd / 2, y * dd - dd / 2)
        .fill(TERM2);
    }
  }
}

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
  // SVG y-axis is inverted, so sweep flag logic might need adjustment depending on desired direction
  var sweepFlag = '0';

  var d = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(' ');

  return d;
}

// Black line grid
function drawGrid(lineStroke) {
  const hLength = WHITESTRIPE.width / 2;

  // let fixup = (lineStroke.width < 40) ? 0 : lineStroke.width/2
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

drawGrid(BLACKLINE);


function drawObject(gg, color) {
  gg.rect(ObjW, ObjH)
    .move(-ObjW / 2, -ObjH / 2)
    // .fill(color)
    .stroke({ width: ObjWidth, color: color });
}


visualizePollutions(random2, PollutionCount, OneColor)
// visualizePollutions(random1, PollutionCount, PollutionColors[6][1])
// random2 = shuffleArray(random1)

for (let x = -2; x <= +2; x += 2) {
  for (let y = -2; y <= +2; y += 2) {
    let group = draw.group();
    group.translate(x * hPitch, y * hPitch);

    // group.rect(hPitch*2,hPitch*2)
    //   .move(-hPitch,-hPitch)
    //   .stroke(BLACKLINE)
    for (let angle = 0; angle < 360; angle += 90) {
      // const hLength = 40 / 2
      // const hLength = (WHITESTRIPE.width - BLACKLINE.width) / 2
      const hLength = WHITESTRIPE.width / 2;
      const t1 = hPitch - hLength;
      const t2 = hPitch + hLength;

      let g2 = group.group().rotate(angle);
      //      g2.line(-t2, +hPitch, +t2, +hPitch).stroke(BLACKLINE)

      // mid segment marker
      g2.line(0, +t1, 0, +t2).stroke(BLACKLINE);
    }

    if (x == 2 && y == 2) continue;

    let dd = BuildingSize;

    let g1 = group.group().rotate(45);

    g1.rect(dd, dd)
      .radius(10)
      .move(-dd / 2, -dd / 2)
      .fill(BUILDING)
      .stroke(ContainmentMarker)

    for (let angle = 0; angle < 360; angle += 90) {
      let g2 = g1.group().rotate(angle).group().translate(0, ObjD);

      // let objD = ObjGap + BuildingSize/2
      // g2.rect(ObjW, ObjH)
      //   .move(-ObjW/2,ObjD-ObjH/2)
      //   .fill(POLLUTION)
      drawObject(g2, POLLUTION);
    }
  }
}


{
  // Device Storage Sites
  let x = 2;
  let y = 2;
  let group = draw.group();
  group.translate(x * hPitch, y * hPitch);
  for (let angle = 0; angle < 180; angle += 90) {
    let g1 = group.group().rotate(angle);

    let shift = angle == 0 ? -2 : +2;

    for (let i = -1; i <= +1; i++) {
      let tt = hPitch * 1 + 60;

      let g2 = g1.group().translate(tt, ((i + shift) * hPitch) / 2);
      // g2.rotate(-90)
      // let tt = hPitch*2 - ObjGap - BuildingSize/2

      // if (angle != 0) g2.rotate(180)

      // g2.rect(ObjH, ObjW).move(-ObjH/2, -ObjW/2)
      //   .fill(DEVICE)
      drawObject(g2, DEVICE);

      const idx = ( angle != 0 ) 
        ?  7 - (i + 2) * 2 
        :  0 + (i + 2) * 2

      let g3 = g2.group().rotate(-90);
      let label = 'S' + idx;
      drawSubText(g3, label, 0, 0.777, DEVICE);
    }
  }
}

drawCellText('A', -2, -2);

drawCellText('B', -2, 0);
drawCellText('C', 0, -2);

drawCellText('D', -2, +2);
drawCellText('E', 0, 0);
drawCellText('F', +2, -2);

drawCellText('G', 0, +2);
drawCellText('H', +2, 0);

drawCellText('TERMINAL', +2, +2, -45);

function siteXY(siteId) {
  const zoneId = siteId.charAt(0);
  const subzId = siteId.charAt(1);

  const ZoneMap = {
    A: [-1, -1],

    B: [-1, 0],
    C: [0, -1],

    D: [-1, +1],
    E: [0, 0],
    F: [+1, -1],

    G: [0, +1],
    H: [+1, 0],
  };
  const zone = ZoneMap[zoneId];
  const zx = zone[0] * HP2;
  const zy = zone[1] * HP2;

  const SubZMap = {
    0: [0, 0],
    1: [-1, -1],
    2: [-1, +1],
    3: [+1, -1],
    4: [+1, +1],
  };
  const subz = SubZMap[subzId];
  const dd = ObjD / Math.sqrt(2);
  const sx = subz[0] * dd;
  const sy = subz[1] * dd;

  return {
    translate: {
      x: zx + sx,
      y: zy + sy,
    },
  };
}

function drawCellText(label, cx, cy, rotation = 0) {
  let g1 = draw.group().translate(hPitch * cx, hPitch * cy);
  // Create the text element
  g1.rotate(rotation);

  let text = g1.text(label);
  formatText(text, 0, 0, 36, '#000', -0.095);

  if (cx == +2 && cy == +2) return;

  drawSubText(g1, '1', -1, -1);
  drawSubText(g1, '2', -1, +1);
  drawSubText(g1, '4', +1, +1);
  drawSubText(g1, '3', +1, -1);
}

function drawSubText(draw, label, cx, cy, color = '#C88') {
  // function drawSubText(draw, label, cx, cy, color = POLLUTION) {
  // Create the text element
  let text = draw.text(label);
  let fontSize = 21;
  let dd = BuildingSize / 2 / Math.sqrt(2) - fontSize + 14;
  formatText(text, dd * cx, dd * cy, fontSize, color, -0.095);
}

function formatText(text, x, y, fontSize, color, yOffset) {
  text.amove(x, y - fontSize * yOffset);
  text.fill(color);

  // Apply alignment properties
  text.font({
    anchor: 'middle', // Horizontal centering
    size: fontSize,
    family: 'Helvetica',
    weight: 'bold',
    // Note: 'dominant-baseline' can be set via the general attr() method if needed,
    // as the font() method might not have a direct alias for it in all versions.
  });

  // Setting dominant-baseline via attr()
  text.attr({
    'dominant-baseline': 'middle', // Vertical centering
  });
}

// Fisher-Yates Shuffle  https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
function shuffleArray(arraySrc) {
  const array = [...arraySrc]; 
  for (let i = array.length - 1; i >= 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


function generateRandomPollutions() {
  const originalArray = ['A','B','C','D','E','F','G','H'];
  const originalSubZ  = ['1','2','3','4','1','2','3','4'];

  const randomPermutation = shuffleArray(originalArray);
  const randomSubZ = shuffleArray(originalSubZ);

  let randomSites = []
  for (let i = 0; i < randomPermutation.length; i++) {
    // const subz = 1 + Math.floor(Math.random() * 4)       // 1 2 3 4
    randomSites[i] = randomPermutation[i] + randomSubZ[i]
  }

  // console.log("Original array:", originalArray);
  // console.log("Random permutation:", randomPermutation);
  // console.log("Random Pollution sites:", randomSites);
  return randomSites
}

function visualizePollutions(randomSites, siteCount, oneColor = null) {
  let configuration = ''
  for (let i = 0; i < siteCount; i++) {
    let site = randomSites[i]

    let color = ( ! oneColor )
      ? PollutionColors[i][1]
      : oneColor
     
    configuration += site + ' - ' + PollutionColors[i][0] + '\n'

    let g1 = draw.group();
    g1.transform(siteXY(site));
    const dd = PolutionRR * 2
    const rr = PolutionRR * 1
    g1.circle(dd,dd).translate(-rr,-rr)
      .fill(color)
      .stroke(PollutionMarker)
  }
  console.log( configuration )
}

// Border Frame
x = 1200 / 2;
draw
  .polygon([
    [x, x],
    [x, -x],
    [-x, -x],
    [-x, x],
  ])
  // .stroke(MARKER)
  .fill('#FFF')
  .opacity(WhiteWashout)


if (ImageSize >= 1200) {
  console.log(draw0.svg());
}
console.log('Finish');
