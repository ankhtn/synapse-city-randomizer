const SynapseMobileViewer = (() => {
  const ImageSize = 600;
  const WhiteWashout = 0.0;
  const BACKGROUND = '#888';
  const BUILDING = '#8EE';
  const POLLUTION = '#FA0';
  const DEVICE = '#3F3';
  const TERM1 = '#EFE';
  const TERM2 = '#BEB';
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
  const PolutionRR = Math.hypot(ObjW, ObjH) * 2.2;
  const HP2 = 2 * hPitch;

  const LEVELS = [
    { id: 'explorer', name: 'Explorer' },
    { id: 'creator', name: 'Creator' },
    { id: 'innovator', name: 'Innovator' },
    { id: 'master', name: 'Master' },
  ];

  const SAMPLE_RANDOM = 'A3R.D2Y.E2G.H1B..A1B.D4G.E3P.F2Y.H2R..A4-.B1-.';

  const COLOR_CODES = {
    B: { name: 'Blue', fill: '#11F', css: 'color-blue' },
    G: { name: 'Green', fill: '#0E0', css: 'color-green' },
    M: { name: 'Mystery', fill: '#FFF', css: 'color-mystery' },
    P: { name: 'Purple', fill: '#71F', css: 'color-purple' },
    R: { name: 'Red', fill: '#E00', css: 'color-red' },
    Y: { name: 'Yellow', fill: '#EE0', css: 'color-yellow' },
    '-': { name: '?', fill: '#FFF', css: 'color-unknown' },
  };

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const sweepFlag = '0';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y,
    ].join(' ');
  }

  function drawGrid(draw, lineStroke) {
    const hLength = WHITESTRIPE.width / 2;
    const fixup = lineStroke.width / 2;
    const HP = hPitch;
    const RR = ((HP * 2) / 3) * 1;
    const DD = HP * 3;
    const DR = DD - RR;
    const DRfix = DR + (RR === 0 ? fixup : 0);
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
      .stroke({ width: ObjWidth, color });
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
    const text = draw.text(label);
    const fontSize = 21;
    const dd = BuildingSize / 2 / Math.sqrt(2) - fontSize + 14;
    formatText(text, dd * cx, dd * cy, fontSize, color, -0.095);
  }

  function drawCellText(draw, label, cx, cy, rotation = 0) {
    const g1 = draw.group().translate(hPitch * cx, hPitch * cy);
    g1.rotate(rotation);
    const text = g1.text(label);
    formatText(text, 0, 0, 36, '#000', -0.095);

    if (cx === +2 && cy === +2) return;
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

  function visualizePollutions(draw, entries) {
    for (const entry of entries) {
      const g1 = draw.group();
      g1.transform(siteXY(entry.site));
      const dd = PolutionRR * 2;
      const rr = PolutionRR;
      g1.circle(dd, dd).translate(-rr, -rr)
        .fill(entry.fill)
        .stroke(PollutionMarker);
    }
  }

  function drawBaseField(draw) {
    draw.fill('none');
    draw.stroke({ color: '#000', width: 0, linecap: 'square' });

    const x = 1200 / 2;
    draw.polygon([[x, x], [x, -x], [-x, -x], [-x, x]])
      .stroke(MARKER).fill(BACKGROUND);

    for (let xx = -2; xx <= +2; xx += 2) {
      for (let yy = -2; yy <= +2; yy += 2) {
        const g1 = draw.group();
        g1.translate(xx * hPitch, yy * hPitch);
        const HP = hPitch - WHITESTRIPE.width / 2;
        const HP2Local = HP * 2;
        g1.rect(HP2Local, HP2Local).move(-HP, -HP).fill(BACKGROUND);
      }
    }

    drawGrid(draw, WHITESTRIPE);

    const termSize = hPitch * 2;
    const disp = hPitch * 2 - termSize / 2;
    draw.rect(termSize, termSize).move(disp, disp).fill(TERM1);

    const g1 = draw.group();
    g1.translate(2 * hPitch, 2 * hPitch);
    const clipShape = g1.rect(termSize, termSize).move(-termSize / 2, -termSize / 2);
    g1.clipWith(clipShape);
    const group = g1.group().rotate(45);
    const ddTerm = (termSize - BLACKLINE.width) / 7 / Math.sqrt(2);
    for (let xx = -7; xx <= +7; xx++) {
      for (let yy = -7; yy <= +7; yy++) {
        if ((xx + yy) % 2 !== 0) continue;
        group.rect(ddTerm, ddTerm).move(xx * ddTerm - ddTerm / 2, yy * ddTerm - ddTerm / 2).fill(TERM2);
      }
    }

    drawGrid(draw, BLACKLINE);
  }

  function drawFieldObjects(draw) {
    for (let x = -2; x <= +2; x += 2) {
      for (let y = -2; y <= +2; y += 2) {
        const groupObj = draw.group();
        groupObj.translate(x * hPitch, y * hPitch);

        for (let angle = 0; angle < 360; angle += 90) {
          const hLength = WHITESTRIPE.width / 2;
          const t1 = hPitch - hLength;
          const t2 = hPitch + hLength;
          const g2 = groupObj.group().rotate(angle);
          g2.line(0, +t1, 0, +t2).stroke(BLACKLINE);
        }

        if (x === 2 && y === 2) continue;

        const buildGroup = groupObj.group().rotate(45);
        buildGroup.rect(BuildingSize, BuildingSize).radius(10)
          .move(-BuildingSize / 2, -BuildingSize / 2)
          .fill(BUILDING)
          .stroke(ContainmentMarker);

        for (let angle = 0; angle < 360; angle += 90) {
          const g2 = buildGroup.group().rotate(angle).group().translate(0, ObjD);
          drawObject(g2, POLLUTION);
        }
      }
    }

    const storageGroup = draw.group();
    storageGroup.translate(2 * hPitch, 2 * hPitch);
    for (let angle = 0; angle < 180; angle += 90) {
      const s1 = storageGroup.group().rotate(angle);
      const shift = angle === 0 ? -2 : +2;
      for (let i = -1; i <= +1; i++) {
        const tt = hPitch * 1 + 60;
        const s2 = s1.group().translate(tt, ((i + shift) * hPitch) / 2);
        drawObject(s2, DEVICE);

        const idx = angle !== 0 ? 7 - (i + 2) * 2 : 0 + (i + 2) * 2;
        const s3 = s2.group().rotate(-90);
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

    const frameHalf = 1200 / 2;
    draw.polygon([[frameHalf, frameHalf], [frameHalf, -frameHalf], [-frameHalf, -frameHalf], [-frameHalf, frameHalf]])
      .fill('#FFF').opacity(WhiteWashout);
  }

  function renderField(containerId, entries) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (typeof SVG === 'undefined') {
      container.innerHTML = '<div class="map-error">SVG renderer unavailable.</div>';
      return;
    }

    const draw0 = SVG().addTo('#' + containerId);
    const draw = draw0.size('100%', '100%')
      .attr({ viewBox: '0 0 ' + ImageSize + ' ' + ImageSize })
      .group();

    draw.translate(ImageSize / 2, ImageSize / 2);
    draw.scale(ImageSize / 1200);

    drawBaseField(draw);
    visualizePollutions(draw, entries);
    drawFieldObjects(draw);
  }

  function parseRandomParam(rawValue) {
    const levels = LEVELS.map(() => []);
    const errors = [];

    if (!rawValue || !rawValue.trim()) {
      errors.push('Missing random URL parameter.');
      return { levels, errors, missing: true };
    }

    const levelGroups = rawValue.trim().split('..');
    if (levelGroups.length > LEVELS.length) {
      errors.push('Random contains more than 4 level groups. Extra groups were ignored.');
    }

    levelGroups.slice(0, LEVELS.length).forEach((group, levelIndex) => {
      const tokens = group.split('.').map((token) => token.trim()).filter(Boolean);
      for (const token of tokens) {
        const normalized = token.toUpperCase();
        if (!/^[A-H][1-4][BGMPRY-]$/.test(normalized)) {
          errors.push(`${LEVELS[levelIndex].name}: invalid token "${token}".`);
          continue;
        }

        const colorCode = normalized.charAt(2);
        const color = COLOR_CODES[colorCode];
        levels[levelIndex].push({
          token: normalized,
          site: normalized.slice(0, 2),
          code: colorCode,
          colorName: color.name,
          fill: color.fill,
          css: color.css,
        });
      }
    });

    return { levels, errors, missing: false };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sortedEntries(entries) {
    return [...entries].sort((a, b) => a.site.localeCompare(b.site));
  }

  function renderTable(containerId, entries) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No random data</div>';
      return;
    }

    const rows = sortedEntries(entries).map((entry) => {
      return `
        <tr class="${entry.css}">
          <td>${escapeHtml(entry.site)}</td>
          <td>
            <div class="color-cell">
              <span class="color-swatch" style="background: ${escapeHtml(entry.fill)}"></span>
              <span>${escapeHtml(entry.colorName)}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `<table class="random-table"><tbody>${rows}</tbody></table>`;
  }

  function renderStatus(result) {
    const status = document.getElementById('status');
    if (!status) return;

    if (result.errors.length === 0) {
      status.hidden = true;
      status.innerHTML = '';
      return;
    }

    const title = result.missing ? 'Missing random data' : 'Random data warning';
    const messages = result.errors.map((error) => `<div>${escapeHtml(error)}</div>`).join('');
    status.hidden = false;
    status.innerHTML = `
      <strong>${title}</strong>
      ${messages}
      <div>Expected format: <code>?random=${escapeHtml(SAMPLE_RANDOM)}</code></div>
    `;
  }

  function renderLevels(levels) {
    const container = document.getElementById('levels');
    if (!container) return;

    container.innerHTML = LEVELS.map((level, index) => {
      const count = levels[index].length;
      return `
        <section class="level-section" aria-labelledby="level-${level.id}-title">
          <div class="level-header">
            <h2 id="level-${level.id}-title" class="level-name">${level.name}</h2>
            <div class="level-count">${count}</div>
          </div>
          <div id="map-${level.id}" class="map-slot"></div>
          <div id="table-${level.id}" class="table-wrap"></div>
        </section>
      `;
    }).join('');

    LEVELS.forEach((level, index) => {
      renderField(`map-${level.id}`, levels[index]);
      renderTable(`table-${level.id}`, levels[index]);
    });
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const result = parseRandomParam(params.get('random'));
    renderStatus(result);
    renderLevels(result.levels);
  }

  return {
    COLOR_CODES,
    LEVELS,
    SAMPLE_RANDOM,
    parseRandomParam,
    init,
  };
})();

if (typeof window !== 'undefined') {
  window.SynapseMobileViewer = SynapseMobileViewer;
  window.addEventListener('DOMContentLoaded', SynapseMobileViewer.init);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SynapseMobileViewer;
}
