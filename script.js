const ImageSize = 600 * 1;

let audioCtx = null;
let lastBeepStartTime = 0;
let beepCount = 0;

function playBeep(frequency = 880, duration = 100, times = 1, type = 'sine') {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const callTimePerf = performance.now();

  for (let i = 0; i < times; i++) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const startTimeCtx = audioCtx.currentTime + i * 0.12; // 120ms interval between beeps
    const endTimeCtx = startTimeCtx + duration / 1000;

    const expectedStartPerf = callTimePerf + (startTimeCtx - audioCtx.currentTime) * 1000;

    let intervalFromLast = 0;
    if (lastBeepStartTime > 0) {
      intervalFromLast = expectedStartPerf - lastBeepStartTime;
    }
    lastBeepStartTime = expectedStartPerf;
    beepCount++;

    const currentBeepIdx = beepCount;
    const jsExecutionTime = performance.now();

    oscillator.start(startTimeCtx);
    gainNode.gain.setValueAtTime(1, startTimeCtx);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTimeCtx);

    oscillator.stop(endTimeCtx);

    oscillator.onended = () => {
      const actualEndPerf = performance.now();
      const actualDuration = actualEndPerf - expectedStartPerf;

      console.log(`Beep #${currentBeepIdx} (${frequency}Hz, ${type})`);
      if (intervalFromLast > 0) {
        console.log(` ├─ Interval from previous beep: ${intervalFromLast.toFixed(1)}ms`);
      } else {
        console.log(` ├─ Interval from previous beep: First beep`);
      }
      console.log(` ├─ JS execution of start(): ${jsExecutionTime.toFixed(1)}ms (Code runs here)`);
      console.log(` ├─ Hardware actual start: ${expectedStartPerf.toFixed(1)}ms (Speaker sounds here)`);
      console.log(` ├─ Hardware actual end: ${actualEndPerf.toFixed(1)}ms`);
      console.log(` └─ Audio Duration: ${actualDuration.toFixed(1)}ms`);
    };
  }
}

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
  ['Mystery', '#FFF'],
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
// const PolutionRR = Math.hypot(ObjW, ObjH) * 1.5;
const PolutionRR = Math.hypot(ObjW, ObjH) * 2.2;
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

function countIntersect(sites, letters) {
  let count = 0;
  for (let site of sites) {
    if (letters.includes(site[0])) {
      count++;
    }
  }
  return count;
}

function generateMap(PollutionCount, stage = 0, mapContainerId, tableContainerId) {
  if (stage === 2) {
    if (!levelStates[PollutionCount].sites) {
      return;
    }
  }

  // Clear map container
  const container = document.getElementById(mapContainerId);
  if (container) container.innerHTML = '';

  let OneColor = null;
  let random2 = [];

  if (stage === 2) {
    random2 = shuffleArray(levelStates[PollutionCount].sites);
    levelStates[PollutionCount].sites = random2;
  } else if (stage === -1) {
    random2 = [];
    levelStates[PollutionCount].sites = null;
  } else {
    const IntersectRules = [
      [1, 'ABC'],
      [1, 'BDG'],
      [1, 'CFH'],
      [1, 'ABD'],
      [1, 'ACF'],
      //[1, 'CEG'],
      //[1, 'BEH'],
      [1, 'GEH'],
      [1, 'DGHF'],
      [2, 'ABCDF']
    ];

    let random1;
    while (true) {
      random1 = generateRandomPollutions().slice(0, PollutionCount);

      let valid = true;
      for (let rule of IntersectRules) {
        if (countIntersect(random1, rule[1]) < rule[0]) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      break;
    }
    console.log('Pollutions Level ' + PollutionCount + ':', random1);
    random2 = shuffleArray(random1);

    if (levelStates[PollutionCount]) {
      levelStates[PollutionCount].sites = random2;
    }

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

  const drawSiteCount = (stage === -1) ? 0 : PollutionCount;
  visualizePollutions(draw, random2, drawSiteCount, OneColor);

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
  if (stage === -1) {
    for (let i = 0; i < siteCount; i++) {
      entries.push({ site: '?', colorName: '?' });
    }
  } else {
    for (let i = 0; i < siteCount; i++) {
      let colorName = (stage === 1) ? '?' : (PollutionColors[i][0] || 'NONE');
      entries.push({ site: randomSites[i], colorName: colorName });
    }

    // Sort ABC
    entries.sort((a, b) => a.site.localeCompare(b.site));
  }

  const LightColorMap = {
    'Red': '#ffcccc',
    'Yellow': '#ffffcc',
    'Green': '#ccffcc',
    'Blue': '#ccccff',
    'Purple': '#e6ccff',
    'Mystery': '#e6e6e6',
    '-': 'transparent'
  };

  let tableHtml = '<table class="info-table">';
  for (let entry of entries) {
    let bgColor = LightColorMap[entry.colorName] || 'transparent';
    let siteColor = entry.site === '?' ? '#aeb6bf' : '#333';
    let labelColor = entry.colorName === '?' ? '#aeb6bf' : '#333';
    let displayName = entry.colorName;

    if (entry.colorName === 'Mystery') {
      bgColor = '#ffffff';
      displayName = 'Mystery';
      labelColor = '#e74c3c'; // Red
    }

    // Site column always center, color column changes based on "?" state
    let colorTextAlign = displayName === '?' ? 'center' : 'left';
    let paddingLeft = displayName === '?' ? '0' : '15px';

    tableHtml += `<tr style="background-color: ${bgColor};"><td style="color: ${siteColor}; text-align: center; font-weight: bold;">${entry.site}</td><td style="text-align: ${colorTextAlign}; padding-left: ${paddingLeft}; color: ${labelColor}; font-weight: bold;">${displayName}</td></tr>`;
  }
  tableHtml += '</table>';

  const tbContainer = document.getElementById(tableContainerId);
  if (tbContainer) {
    tbContainer.innerHTML = tableHtml;
  }
}

let isCompetitionMode = false;
let timerInterval = null;
let preTimerInterval = null;
let compRoundActive = false;
let compCountdownFinished = false;
let timerRunning = false;
let currentGameNumber = 1;
let currentRemainingSeconds = 0;
let currentRoundNumber = 1;
let pendingRoundDelta = 1;
let completedTeams = [];
let activeTeam = null;
let anyTeamCompleted = false;

function updateTeamButtonsUI() {
  const boxSelectTeam = document.getElementById('box-select-team');
  const isBoxActive = boxSelectTeam && (boxSelectTeam.classList.contains('state-active') || boxSelectTeam.classList.contains('state-completed'));

  for (let i = 1; i <= 12; i++) {
    const btn = document.getElementById(`btn-team-${i}`);
    if (!btn) continue;

    btn.classList.remove('team-active', 'team-completed', 'team-enabled', 'team-disabled');

    if (completedTeams.includes(i)) {
      btn.classList.add('team-completed');
      btn.disabled = true;
    } else if (activeTeam === i) {
      btn.classList.add('team-active');
      btn.disabled = false;
    } else {
      let isBtnDisabled = !isBoxActive;
      btn.disabled = isBtnDisabled;
      if (isBtnDisabled) {
        btn.classList.add('team-disabled');
      } else {
        btn.classList.add('team-enabled');
      }
    }
  }
}

function updateResetButtonLabel() {
  const btnNext = document.getElementById('btn-next-round');
  if (!btnNext) return;
  if (isCompetitionMode) {
    btnNext.disabled = !anyTeamCompleted;
  } else {
    btnNext.disabled = false;
  }
}

function updateRoundLabel() {
  const lbl = document.getElementById('round-label');
  if (lbl) lbl.innerText = `Round ${currentRoundNumber}`;

  const btnReset = document.getElementById('btn-reset');
  if (btnReset && btnReset._tippy) btnReset._tippy.setContent(`Reset Round ${currentRoundNumber}`);

  const btnNext = document.getElementById('btn-next-round');
  if (btnNext && btnNext._tippy) btnNext._tippy.setContent(`Begin Round ${currentRoundNumber + 1}`);
}

function setBoxState(boxId, stateClass) {
  const box = document.getElementById(boxId);
  if (box) box.className = `comp-box state-${stateClass}`;
}

function applyModeState() {
  const btnReset = document.getElementById('btn-reset');
  const btnRand1 = document.getElementById('btn-random1');
  const btnRand2 = document.getElementById('btn-random2');
  const btnPrac = document.getElementById('btn-practice');
  const btnQuar = document.getElementById('btn-quarantine');
  const btnStart = document.getElementById('btn-start');

  if (isCompetitionMode) {
    globalClear();
    btnReset.disabled = false;
    btnRand1.disabled = false;
    btnRand2.disabled = true;
    btnPrac.disabled = true;
    btnQuar.disabled = true;
    btnStart.disabled = true;

    currentGameNumber = 1;
    btnStart.innerText = `Complete`;
    const titleEl1 = document.getElementById('box-slot-title');
    if (titleEl1) titleEl1.innerText = `Setup Field Track`;

    compRoundActive = false;
    compCountdownFinished = false;
    timerRunning = false;

    if (timerInterval) clearInterval(timerInterval);
    updateClock(120);

    setBoxState('box-random1', 'active');
    setBoxState('box-practice', 'inactive');
    setBoxState('box-quarantine', 'inactive');
    setBoxState('box-random2', 'inactive');
    setBoxState('box-select-team', 'inactive');
    setBoxState('box-slot', 'inactive');
  } else {
    globalClear();
    btnReset.disabled = false;
    btnRand1.disabled = false;
    btnRand2.disabled = true;
    btnPrac.disabled = true;
    btnQuar.disabled = true;
    btnStart.disabled = true;

    currentGameNumber = 1;
    btnStart.innerText = `Complete`;
    const titleEl2 = document.getElementById('box-slot-title');
    if (titleEl2) titleEl2.innerText = `Setup Field Track`;

    compRoundActive = false;
    compCountdownFinished = false;
    timerRunning = false;

    if (timerInterval) clearInterval(timerInterval);
    updateClock(120);

    setBoxState('box-random1', 'active');
    setBoxState('box-practice', 'inactive');
    setBoxState('box-quarantine', 'inactive');
    setBoxState('box-random2', 'inactive');
    setBoxState('box-select-team', 'inactive');
    setBoxState('box-slot', 'inactive');
  }

  completedTeams = [];
  activeTeam = null;
  anyTeamCompleted = false;
  updateResetButtonLabel();
  const teamTitle = document.getElementById('box-team-title');
  if (teamTitle) teamTitle.innerText = 'Select Team';
  updateTeamButtonsUI();
}

function setMode(isComp) {
  const toggle = document.getElementById('mode-toggle');
  toggle.checked = !isComp;
  handleSingleModeToggle();
}

let pendingModeToggle = false;

function handleSingleModeToggle() {
  const toggle = document.getElementById('mode-toggle');
  if (!toggle) return;

  if (isCompetitionMode && toggle.checked && compRoundActive && !anyTeamCompleted) {
    toggle.checked = false; // Revert visual switch
    const popup = document.getElementById('confirm-popup');
    const textEl = document.getElementById('confirm-popup-text');
    if (popup && textEl) {
      textEl.innerHTML = `A competition round is already in progress. <b>Switching to Free Play</b> will clear the current setup and any countdown progress.<br><br>Do you want to continue?`;
      popup.style.display = 'flex';
      pendingModeToggle = true;
    }
    return;
  }

  isCompetitionMode = !toggle.checked;
  executeModeToggleLogic();
}

function executeModeToggleLogic() {
  const labelFree = document.getElementById('label-free');
  const labelComp = document.getElementById('label-comp');

  if (isCompetitionMode) {
    labelFree.className = 'inactive';
    labelComp.className = 'active';
  } else {
    labelFree.className = 'active';
    labelComp.className = 'inactive';
  }

  currentRoundNumber = 1;
  updateRoundLabel();
  applyModeState();
}

function handleConfirmYes() {
  const popup = document.getElementById('confirm-popup');
  if (popup) popup.style.display = 'none';

  if (pendingModeToggle) {
    pendingModeToggle = false;
    const toggle = document.getElementById('mode-toggle');
    toggle.checked = true;
    isCompetitionMode = false;
    executeModeToggleLogic();
  } else {
    executeReset();
  }
}

function handleConfirmNo() {
  const popup = document.getElementById('confirm-popup');
  if (popup) popup.style.display = 'none';
  if (pendingModeToggle) {
    pendingModeToggle = false;
  }
}

function handleReset() {
  pendingRoundDelta = 0;
  promptReset();
}

function handleNextRound() {
  pendingRoundDelta = 1;
  promptReset();
}

function promptReset() {
  if (isCompetitionMode) {
    if (pendingRoundDelta === 0 && compRoundActive && !anyTeamCompleted) {
      const popup = document.getElementById('confirm-popup');
      const textEl = document.getElementById('confirm-popup-text');
      if (popup) {
        if (textEl) {
          textEl.innerHTML = `A competition round is already in progress. <b>Resetting</b> will clear the current setup and any countdown progress.<br><br>Do you want to continue?`;
        }
        popup.style.display = 'flex';
        return;
      }
    }
  }
  executeReset();
}

function executeReset() {
  currentRoundNumber += pendingRoundDelta;
  if (currentRoundNumber < 1) currentRoundNumber = 1;
  updateRoundLabel();

  if (isCompetitionMode) {
    compResetRound();
  } else {
    applyModeState();
  }
}

function handleRandom1() {
  document.getElementById('btn-random1').disabled = true;
  setBoxState('box-random1', 'generating');

  setTimeout(() => {
    if (isCompetitionMode) {
      compRandom1();
    } else {
      globalRandom1();
      document.getElementById('btn-random2').disabled = false;
      document.getElementById('btn-random1').disabled = false;
      setBoxState('box-random1', 'completed');
      setBoxState('box-random2', 'active');

      // Reset Random 2 and Start Game visual/functional states
      document.getElementById('btn-start').disabled = true;
      setBoxState('box-slot', 'inactive');
    }
  }, 100);
}

function handleRandom2() {
  if (!isCompetitionMode && (!levelStates[6].sites || !levelStates[7].sites || levelStates[6].sites.length === 0)) {
    alert("Please generate Random 1 first!");
    return;
  }

  document.getElementById('btn-random2').disabled = true;
  setBoxState('box-random2', 'generating');

  setTimeout(() => {
    if (isCompetitionMode) {
      compRandom2();
    } else {
      if (globalRandom2()) {
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-random2').disabled = false;
        setBoxState('box-random2', 'completed');
        setBoxState('box-slot', 'active');

        if (timerInterval) clearInterval(timerInterval);
        timerRunning = false;
        compCountdownFinished = false;
        currentRemainingSeconds = 0;

        const btnStart = document.getElementById('btn-start');
        btnStart.innerText = `Complete`;
        const titleEl = document.getElementById('box-slot-title');
        if (titleEl) titleEl.innerText = `Setup Field Track`;
      } else {
        document.getElementById('btn-random2').disabled = false;
        setBoxState('box-random2', 'active');
      }
    }
  }, 100);
}

function handleBtnPractice() {
  if (isCompetitionMode) {
    compBtnPractice();
  }
}

function handleBtnQuarantine() {
  if (isCompetitionMode) {
    compBtnQuarantine();
  }
}

function handleStartTimer() {
  compStartTimer();
}

function globalRandom1() {
  generateMap(4, 0, 'map-explorer', 'table-explorer');
  generateMap(5, 0, 'map-creator', 'table-creator');
  generateMap(6, 1, 'map-innovator', 'table-innovator');
  generateMap(7, 1, 'map-master', 'table-master');
  updateLinkCodeDisplay();
}

function globalRandom2() {
  if (!levelStates[6].sites || !levelStates[7].sites || levelStates[6].sites.length === 0) {
    alert("Please generate Random 1 first!");
    return false;
  }
  generateMap(6, 2, 'map-innovator', 'table-innovator');
  generateMap(7, 2, 'map-master', 'table-master');
  updateLinkCodeDisplay();
  return true;
}

function globalClear() {
  generateMap(4, -1, 'map-explorer', 'table-explorer');
  generateMap(5, -1, 'map-creator', 'table-creator');
  generateMap(6, -1, 'map-innovator', 'table-innovator');
  generateMap(7, -1, 'map-master', 'table-master');
  updateLinkCodeDisplay();
}

function compResetRound() {
  globalClear();

  document.getElementById('btn-random1').disabled = false;

  const btnPrac = document.getElementById('btn-practice');
  btnPrac.disabled = true;

  const btnQuar = document.getElementById('btn-quarantine');
  btnQuar.disabled = true;

  document.getElementById('btn-random2').disabled = true;
  document.getElementById('btn-start').disabled = true;

  currentGameNumber = 1;
  document.getElementById('btn-start').innerText = `Complete`;
  const titleEl = document.getElementById('box-slot-title');
  if (titleEl) titleEl.innerText = `Setup Field Track`;

  if (timerInterval) clearInterval(timerInterval);
  const clock = document.getElementById('countdown-clock');
  updateClock(120);
  clock.style.color = '#95a5a6';
  document.getElementById('countdown-progress-bg').style.background = '#95a5a6';

  setBoxState('box-random1', 'active');
  setBoxState('box-practice', 'inactive');
  setBoxState('box-quarantine', 'inactive');
  setBoxState('box-random2', 'inactive');
  setBoxState('box-select-team', 'inactive');
  setBoxState('box-slot', 'inactive');

  completedTeams = [];
  activeTeam = null;
  anyTeamCompleted = false;
  updateResetButtonLabel();
  const teamTitle = document.getElementById('box-team-title');
  if (teamTitle) teamTitle.innerText = 'Select Team';
  updateTeamButtonsUI();

  compRoundActive = false;
  compCountdownFinished = false;
  timerRunning = false;
}

function compRandom1() {
  globalRandom1();
  document.getElementById('btn-random1').disabled = true;
  document.getElementById('btn-practice').disabled = false;

  setBoxState('box-random1', 'completed');
  setBoxState('box-practice', 'active');

  compRoundActive = true;
}

function compBtnPractice() {
  document.getElementById('btn-practice').disabled = true;
  document.getElementById('btn-quarantine').disabled = false;
  setBoxState('box-practice', 'completed');
  setBoxState('box-quarantine', 'active');
}

function compBtnQuarantine() {
  document.getElementById('btn-quarantine').disabled = true;
  document.getElementById('btn-random2').disabled = false;
  setBoxState('box-quarantine', 'completed');
  setBoxState('box-random2', 'active');
}

function compRandom2() {
  globalRandom2();
  document.getElementById('btn-random2').disabled = true;
  document.getElementById('btn-quarantine').disabled = true;
  document.getElementById('btn-start').disabled = true;

  setBoxState('box-random2', 'completed');
  setBoxState('box-select-team', 'active');
  const teamTitle = document.getElementById('box-team-title');
  if (teamTitle) teamTitle.innerText = 'Select Team';
  updateTeamButtonsUI();
}

function handleSelectTeam(teamId) {
  activeTeam = teamId;
  updateTeamButtonsUI();

  const teamTitle = document.getElementById('box-team-title');
  if (teamTitle) teamTitle.innerText = `Team ${teamId}`;

  setBoxState('box-select-team', 'completed');

  document.getElementById('btn-start').disabled = false;
  setBoxState('box-slot', 'active');
}

function compStartTimer() {
  document.getElementById('timer-popup').style.display = 'flex';
  if (isCompetitionMode && activeTeam !== null) {
    document.getElementById('popup-game-label').innerText = `Team ${activeTeam}`;
  } else {
    document.getElementById('popup-game-label').innerText = `Team 1`;
  }

  if (timerInterval) clearInterval(timerInterval);
  if (preTimerInterval) clearInterval(preTimerInterval);
  timerRunning = false;
  compCountdownFinished = false;

  currentRemainingSeconds = 120;

  const popupClock = document.getElementById('popup-clock');
  if (popupClock) popupClock.style.color = '#95a5a6';

  const ring = document.getElementById('popup-ring');
  if (ring) {
    ring.style.stroke = '#95a5a6';
  }

  const btn = document.getElementById('popup-action-btn');
  btn.innerHTML = `3&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;&nbsp;GO`;
  btn.disabled = false;
  btn.style.cursor = 'pointer';
  btn.style.backgroundColor = '#007bff';
  btn.style.color = 'white';

  const skipBtn = document.getElementById('popup-skip-btn');
  if (skipBtn) skipBtn.disabled = true;

  updateClock(currentRemainingSeconds);
}

async function handlePopupAction() {
  const btn = document.getElementById('popup-action-btn');
  const action = btn.innerText.trim();

  if ((action.includes('3') && action.includes('GO')) || action === 'Start') {
    btn.disabled = true;
    btn.style.cursor = 'default';

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    btn.style.backgroundColor = '#ffcccc';
    btn.style.color = '#000';
    let count = 3;
    btn.innerText = count;
    playBeep();
    //let lastBeepTime = performance.now();
    //console.log(`[Countdown] Beep 3 at ${lastBeepTime.toFixed(1)}ms`);

    if (preTimerInterval) clearInterval(preTimerInterval);
    preTimerInterval = setInterval(() => {
      count--;
      if (count > 0) {
        btn.innerText = count;
        playBeep();
        //const now = performance.now();
        //console.log(`[Countdown] Beep ${count} at ${now.toFixed(1)}ms (Delta: ${(now - lastBeepTime).toFixed(1)}ms)`);
        //lastBeepTime = now;
      } else if (count === 0) {
        clearInterval(preTimerInterval);
        btn.innerText = 'GO';
        playBeep(1320, 1000, 1, 'sine');
        ///const now = performance.now();
        //console.log(`[Countdown] Beep GO at ${now.toFixed(1)}ms (Delta: ${(now - lastBeepTime).toFixed(1)}ms)`);
        //lastBeepTime = now;
        btn.style.backgroundColor = '#d4edda';
        btn.style.color = '#333';

        const skipBtn = document.getElementById('popup-skip-btn');
        if (skipBtn) skipBtn.disabled = false;

        timerRunning = true;
        const popupClock = document.getElementById('popup-clock');
        if (popupClock) popupClock.style.color = '#029456';
        const ring = document.getElementById('popup-ring');
        if (ring) ring.style.stroke = '#029456';
        updateClock(currentRemainingSeconds);

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          currentRemainingSeconds--;
          if (currentRemainingSeconds <= 0) {
            clearInterval(timerInterval);
            currentRemainingSeconds = 0;
            if (popupClock) popupClock.style.color = '#e74c3c';
            btn.innerText = `Complete`;
            playBeep(1320, 1000, 1, 'sine');
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = '#007bff';
            btn.style.color = 'white';
            const skipBtn = document.getElementById('popup-skip-btn');
            if (skipBtn) skipBtn.disabled = true;
            compCountdownFinished = true;
            timerRunning = false;
          }
          updateClock(currentRemainingSeconds);
        }, 1000);
      }
    }, 1000);

  } else if (action === 'Complete') {
    document.getElementById('timer-popup').style.display = 'none';
    currentGameNumber++;

    anyTeamCompleted = true;
    updateResetButtonLabel();

    completedTeams.push(activeTeam);
    activeTeam = null;

    const titleEl = document.getElementById('box-slot-title');
    if (titleEl) titleEl.innerText = `Setup Field Track`;

    if (isCompetitionMode) {
      const btnStart = document.getElementById('btn-start');
      if (btnStart) {
        btnStart.innerText = `Complete`;
        btnStart.disabled = true;
      }
      setBoxState('box-slot', 'inactive');

      setBoxState('box-select-team', 'active');
      const teamTitle = document.getElementById('box-team-title');
      if (teamTitle) teamTitle.innerText = 'Select Team';
      updateTeamButtonsUI();
    } else {
      const btnStart = document.getElementById('btn-start');
      if (btnStart) {
        btnStart.innerText = `Complete`;
        btnStart.disabled = false;
      }
      setBoxState('box-slot', 'active');
    }
  }
}

function handleSkipAction() {
  if (timerRunning && !compCountdownFinished) {
    currentRemainingSeconds = Math.floor(currentRemainingSeconds / 2);
    updateClock(currentRemainingSeconds, true);

    if (currentRemainingSeconds <= 0) {
      clearInterval(timerInterval);
      currentRemainingSeconds = 0;
      const popupClock = document.getElementById('popup-clock');
      if (popupClock) popupClock.style.color = '#e74c3c';

      const btn = document.getElementById('popup-action-btn');
      if (btn) {
        btn.innerText = `Complete`;
        btn.disabled = false;
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#007bff';
        btn.style.color = 'white';
      }

      const skipBtn = document.getElementById('popup-skip-btn');
      if (skipBtn) skipBtn.disabled = true;

      compCountdownFinished = true;
      timerRunning = false;
    }
  }
}

function getPopupRingCircumference() {
  const ring = document.getElementById('popup-ring');
  if (!ring) return 0;

  const radius = parseFloat(ring.getAttribute('r'));
  if (!Number.isFinite(radius)) return 0;

  return 2 * Math.PI * radius;
}

function updateClock(seconds, isSkip = false) {
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  let ss = s < 10 ? '0' + s : s;

  const popupClock = document.getElementById('popup-clock');
  if (popupClock) {
    popupClock.innerText = ` ${m}:${ss}`;
  }

  let targetSeconds = timerRunning ? Math.max(0, seconds - 1) : seconds;

  let elapsed = 120 - targetSeconds;
  let percent = elapsed / 120; // 0 to 1
  percent = Math.min(1, Math.max(0, percent));

  const ring = document.getElementById('popup-ring');
  if (ring) {
    const circumference = getPopupRingCircumference();
    ring.style.strokeDasharray = `${circumference}`;

    if (!timerRunning) {
      ring.style.transition = 'none'; // Tắt hiệu ứng nếu timer đang dừng (để snap mượt)
    } else if (isSkip) {
      ring.style.transition = 'stroke-dashoffset 0.2s ease-out'; // Tăng tốc gập CSS khi Skip
    } else {
      ring.style.transition = 'stroke-dashoffset 1s linear';
    }
    ring.style.strokeDashoffset = -(percent * circumference);
  }

  const actionBtn = document.getElementById('popup-action-btn');
  if (actionBtn && timerRunning) {
    if (seconds <= 5 && seconds > 0) {
      if (actionBtn.innerText !== String(seconds)) {
        actionBtn.innerText = seconds;
        playBeep();
      }
      actionBtn.style.backgroundColor = '#fff3cd';
      actionBtn.style.color = '#000';
      if (popupClock) popupClock.style.color = '#d6a100';
      if (ring) ring.style.stroke = '#d6a100';
    } else if (seconds > 5) {
      actionBtn.innerText = 'GO';
      actionBtn.style.backgroundColor = '#d4edda';
      actionBtn.style.color = '#000';
      if (popupClock) popupClock.style.color = '#029456';
      if (ring) ring.style.stroke = '#029456';
    }
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    syncFullscreenMapSize();
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function syncFullscreenMapSize() {
  const mapCells = document.querySelectorAll('.grid-cell.map-left, .grid-cell.map-right');
  const maxMapWidth = Math.max(...Array.from(mapCells, cell => cell.getBoundingClientRect().width), 0);

  if (maxMapWidth > 0) {
    document.body.style.setProperty('--fullscreen-map-max-size', `${Math.round(maxMapWidth)}px`);
  }
}

function updateRealtimeClocks() {
  const smallClock = document.getElementById('small-realtime-clock');
  if (!smallClock) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${h}:${m}:${s}`;

  if (smallClock) smallClock.innerText = timeStr;

  const largeClock = document.getElementById('large-realtime-clock');
  if (largeClock) largeClock.innerText = timeStr;


  const phaseLabel = document.getElementById('realtime-phase-label');
  if (phaseLabel) {
    const activeBox = document.querySelector('.comp-box.state-active:not(#box-qr-code)');
    if (activeBox) {
      const titleEl = activeBox.querySelector('.box-title');
      phaseLabel.innerText = titleEl ? titleEl.innerText : "Free Play";
    } else {
      phaseLabel.innerText = "Free Play";
    }
  }
}

let isRealtimePopupPinned = false;
let realtimeHoverTimeout = null;

function toggleRealtimePopup() {
  if (realtimeHoverTimeout) clearTimeout(realtimeHoverTimeout);
  const popup = document.getElementById('realtime-popup');
  if (!popup) return;

  if (isRealtimePopupPinned) {
    isRealtimePopupPinned = false;
    popup.style.display = 'none';
  } else {
    isRealtimePopupPinned = true;
    popup.style.display = 'flex';
  }
}

function openRealtimePopup() {
  if (realtimeHoverTimeout) clearTimeout(realtimeHoverTimeout);
  realtimeHoverTimeout = setTimeout(() => {
    const popup = document.getElementById('realtime-popup');
    if (popup && !isRealtimePopupPinned) popup.style.display = 'flex';
  }, 500);
}

function closeRealtimePopup() {
  if (realtimeHoverTimeout) clearTimeout(realtimeHoverTimeout);
  const popup = document.getElementById('realtime-popup');
  if (popup && !isRealtimePopupPinned) popup.style.display = 'none';
}

document.addEventListener('click', (e) => {
  if (isRealtimePopupPinned) {
    const isSmallClock = e.target.closest('#small-realtime-clock');
    const isRealtimePopup = e.target.closest('#realtime-popup');
    if (!isSmallClock && !isRealtimePopup) {
      isRealtimePopupPinned = false;
      const popup = document.getElementById('realtime-popup');
      if (popup) popup.style.display = 'none';
    }
  }
});

window.onload = () => {
  tippy('[data-tippy-content]', {
    onShow(instance) {
      if (instance.reference.disabled) {
        return false;
      }
    }
  });
  handleSingleModeToggle();
  updateRealtimeClocks();
  setInterval(updateRealtimeClocks, 1000);
};

document.addEventListener("fullscreenchange", () => {
  const btn = document.getElementById("btn-fullscreen");
  const iconEnter = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
  const iconExit = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`;

  if (document.fullscreenElement) {
    if (btn) btn.innerHTML = iconExit;
    document.body.classList.add("is-fullscreen");
  } else {
    if (btn) btn.innerHTML = iconEnter;
    document.body.classList.remove("is-fullscreen");
  }
});

function generateMobileViewerUrl() {
  const codes = ['R', 'Y', 'G', 'B', 'P', 'Y', 'M', '-'];
  let parts = [];

  const boxRand2 = document.getElementById('box-random2');
  const isRand2Completed = boxRand2 && boxRand2.classList.contains('state-completed');

  for (let count of [4, 5, 6, 7]) {
    let sites = levelStates[count] && levelStates[count].sites;
    if (!sites) {
      parts.push("");
    } else {
      let levelParts = [];
      let isRevealed = (count <= 5) || isRand2Completed;

      for (let i = 0; i < count; i++) {
        let site = sites[i];
        let colorCode = isRevealed ? codes[i] : '-';
        levelParts.push(site + colorCode);
      }
      parts.push(levelParts.join('.'));
    }
  }
  let randomStr = parts.join('..');

  let baseUrl = window.location.href.split('?')[0];
  baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
  return baseUrl + 'mobile-viewer.html?random=' + randomStr;
}

function showQRCode() {
  const popup = document.getElementById('qr-popup');
  const container = document.getElementById('qrcode');
  if (!popup || !container) return;

  setBoxState('box-qr-code', 'completed');

  container.innerHTML = '';
  const url = generateMobileViewerUrl();
  const randomStr = url.split('random=')[1] || '';
  const code = generateLinkCode(randomStr);

  const popupCodeDisplay = document.getElementById('popup-link-code');
  if (popupCodeDisplay) {
    popupCodeDisplay.innerText = code;
  }

  console.log("QR Code URL:", url);

  const size = Math.min(window.innerHeight * 0.60, window.innerWidth * 0.75, 744);

  new QRCode(container, {
    text: url,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L
  });

  // Remove the default title attribute added by QRCode.js
  setTimeout(() => {
    container.removeAttribute('title');
    const childNodes = container.querySelectorAll('*');
    childNodes.forEach(node => node.removeAttribute('title'));
  }, 50);

  container.style.cursor = 'pointer';
  container.onclick = function () {
    window.open(url, '_blank');
  };

  popup.style.display = 'flex';
}

window.handleCopyUrl = function() {
  const url = generateMobileViewerUrl();
  navigator.clipboard.writeText(url).then(() => {
    // Optionally show a tiny tippy or alert
    alert("URL copied to clipboard!");
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
};

window.handleGoToUrl = function() {
  const url = generateMobileViewerUrl();
  window.open(url, '_blank');
};

function generateLinkCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  let code = Math.abs(hash).toString();
  while (code.length < 6) {
    code = '0' + code;
  }
  let code6 = code.substring(0, 6);
  return code6.substring(0, 3) + ' ' + code6.substring(3, 6);
}

function updateLinkCodeDisplay() {
  setTimeout(() => {
    const hasRandom1 = levelStates[4] && levelStates[4].sites && levelStates[4].sites.length > 0;
    const display = document.getElementById('link-code-display');
    const qrBtn = document.getElementById('btn-qr-code');
    const realtimeLinkCode = document.getElementById('realtime-link-code');

    if (!hasRandom1) {
      if (display) display.innerText = '--- ---';
      if (realtimeLinkCode) realtimeLinkCode.innerText = '--- ---';
      if (qrBtn) qrBtn.disabled = true;
      setBoxState('box-qr-code', 'inactive');
      return;
    }

    const url = generateMobileViewerUrl();
    const randomStr = url.split('random=')[1] || '';
    const code = generateLinkCode(randomStr);

    if (display) {
      display.innerText = code;
    }
    if (realtimeLinkCode) {
      realtimeLinkCode.innerText = code;
    }
    if (qrBtn) qrBtn.disabled = false;
    setBoxState('box-qr-code', 'active');
  }, 10);
}
