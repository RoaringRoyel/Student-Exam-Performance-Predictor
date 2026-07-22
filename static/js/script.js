// ---------------------------------------------------------------------------
// Student Exam Performance Predictor — interactive front end
// Draws a live semicircular gauge from the writing/reading scores as the
// student types, and reveals a rubber-stamp style result once the server
// returns a prediction (rendered server-side into #result-data).
// ---------------------------------------------------------------------------

(function () {
  const GAUGE_SIZE = 240;
  const STROKE = 16;
  const RADIUS = (GAUGE_SIZE - STROKE) / 2;
  const CENTER = GAUGE_SIZE / 2;

  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = ((angleDeg - 180) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function gradeFromScore(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  function buildGauge(container) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${GAUGE_SIZE} ${GAUGE_SIZE / 2 + STROKE}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Estimated score gauge');

    const track = document.createElementNS(svgNS, 'path');
    track.setAttribute('d', describeArc(CENTER, CENTER, RADIUS, 0, 180));
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', '#d8cba0');
    track.setAttribute('stroke-width', STROKE);
    track.setAttribute('stroke-linecap', 'round');
    svg.appendChild(track);

    const fill = document.createElementNS(svgNS, 'path');
    fill.setAttribute('fill', 'none');
    fill.setAttribute('stroke', '#e0a530');
    fill.setAttribute('stroke-width', STROKE);
    fill.setAttribute('stroke-linecap', 'round');
    fill.setAttribute('d', describeArc(CENTER, CENTER, RADIUS, 0, 0.001));
    fill.style.transition = 'd 0.4s ease';
    svg.appendChild(fill);

    container.appendChild(svg);
    return fill;
  }

  function setGauge(fillEl, value /* 0-100 */) {
    const clamped = Math.max(0, Math.min(100, value));
    const angle = (clamped / 100) * 180;
    fillEl.setAttribute('d', describeArc(CENTER, CENTER, RADIUS, 0, Math.max(angle, 0.001)));
  }

  document.addEventListener('DOMContentLoaded', function () {
    const gaugeWrap = document.getElementById('gauge-wrap');
    const gaugeNumber = document.getElementById('gauge-number');
    const gaugeLabel = document.getElementById('gauge-label');
    const writingInput = document.querySelector('input[name="writing_score"]');
    const readingInput = document.querySelector('input[name="reading_score"]');

    if (gaugeWrap) {
      const fillPath = buildGauge(gaugeWrap);

      function updateGauge() {
        const w = parseFloat(writingInput && writingInput.value);
        const r = parseFloat(readingInput && readingInput.value);
        const values = [w, r].filter((v) => !Number.isNaN(v));

        if (values.length === 0) {
          setGauge(fillPath, 0);
          if (gaugeNumber) gaugeNumber.textContent = '--';
          if (gaugeLabel) gaugeLabel.textContent = 'Awaiting scores';
          return;
        }

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        setGauge(fillPath, avg);
        if (gaugeNumber) gaugeNumber.textContent = Math.round(avg);
        if (gaugeLabel) {
          gaugeLabel.textContent =
            values.length === 2 ? 'Rough estimate' : 'Partial estimate';
        }
      }

      [writingInput, readingInput].forEach((el) => {
        if (el) el.addEventListener('input', updateGauge);
      });

      updateGauge();
    }

    // Reveal the graded stamp if the server rendered a result.
    const resultData = document.getElementById('result-data');
    if (resultData && resultData.textContent.trim() !== '') {
      const rawScore = parseFloat(resultData.textContent.trim());
      const resultBlock = document.getElementById('result-block');

      if (resultBlock && !Number.isNaN(rawScore)) {
        const grade = gradeFromScore(rawScore);
        resultBlock.innerHTML = `
          <div class="stamp">
            <span class="stamp-score">${Math.round(rawScore)}</span>
            <span class="stamp-grade">GRADE ${grade}</span>
          </div>
        `;
      } else if (resultBlock) {
        resultBlock.innerHTML = `<div class="stamp"><span class="stamp-score">${resultData.textContent.trim()}</span></div>`;
      }
    }

    // Disable the submit button briefly on click to avoid double posts,
    // and swap its label for a small "grading" affordance.
    const form = document.querySelector('form[action]');
    const submitBtn = document.querySelector('.btn-primary');
    if (form && submitBtn) {
      form.addEventListener('submit', function () {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Grading…';
      });
    }
  });
})();
