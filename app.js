// ------------------ Weights ------------------
const WEIGHTS = {
  k1: 11, k2: 12, k3: 11, k4: 12, k5: 10, bil: 2, ihu: 2, final: 40
};
const YEAR_IN_TOTAL = 60;

// Rounding rules / targets
const PASS_TARGET_YEAR_END = 59.51; // 59,51 -> 60'a yuvarlanır (geçer)
const FINAL_FIXED_FOR_50MODE = 50;   // "Finali 50'ye bırakma" modu

const FINALLESS_TARGET_NORM = 79.51; // 79,51 -> 80'e yuvarlanır (finalsiz)

// ------------------ Helpers ------------------
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function fmtTR(n, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d).replace(".", ",");
}

function getInputs(prefix) {
  return {
    k1: document.getElementById(`${prefix}_k1`),
    k2: document.getElementById(`${prefix}_k2`),
    k3: document.getElementById(`${prefix}_k3`),
    k4: document.getElementById(`${prefix}_k4`),
    k5: document.getElementById(`${prefix}_k5`),
    bil: document.getElementById(`${prefix}_bil`),
    ihu: document.getElementById(`${prefix}_ihu`),
    final: document.getElementById(`${prefix}_final`) // may be null
  };
}

function readScore(inputEl) {
  if (!inputEl) return NaN;
  const n = toNum(inputEl.value);
  if (!Number.isFinite(n)) return NaN;
  return clamp(n, 0, 100);
}

// year-in weighted sum on 0..60 scale
function weightedYearIn60(scores) {
  const sum =
    (WEIGHTS.k1 * scores.k1) +
    (WEIGHTS.k2 * scores.k2) +
    (WEIGHTS.k3 * scores.k3) +
    (WEIGHTS.k4 * scores.k4) +
    (WEIGHTS.k5 * scores.k5) +
    (WEIGHTS.bil * scores.bil) +
    (WEIGHTS.ihu * scores.ihu);

  return sum / 100; // 0..60
}

function normalizeYearIn100(yearIn60) {
  return (yearIn60 / YEAR_IN_TOTAL) * 100;
}

function yearEnd100(yearIn60, finalScore) {
  return yearIn60 + (WEIGHTS.final * finalScore) / 100; // 0..100
}

function letter(score100) {
  if (score100 >= 90) return "AA";
  if (score100 >= 85) return "BA";
  if (score100 >= 80) return "BB";
  if (score100 >= 70) return "CB";
  if (score100 >= 60) return "CC";
  if (score100 >= 55) return "DC";
  if (score100 >= 50) return "DD";
  return "FF";
}

function show(el, html) {
  el.classList.remove("hidden");
  el.innerHTML = html;
}
function hide(el) {
  el.classList.add("hidden");
  el.innerHTML = "";
}

function resetInputs(prefix, includeFinal = false) {
  const ids = ["k1","k2","k3","k4","k5","bil","ihu"];
  for (const id of ids) {
    const el = document.getElementById(`${prefix}_${id}`);
    if (el) el.value = "";
  }
  if (includeFinal) {
    const f = document.getElementById(`${prefix}_final`);
    if (f) f.value = "";
  }
}

// ------------------ Navigation ------------------
const views = ["view-menu","view-calc1","view-calc2","view-calc3"];

function openView(id) {
  for (const v of views) {
    const el = document.getElementById(v);
    el.classList.toggle("active", v === id);
  }
  const hashMap = {
    "view-menu": "#",
    "view-calc1": "#calc1",
    "view-calc2": "#calc2",
    "view-calc3": "#calc3"
  };
  history.replaceState(null, "", hashMap[id] ?? "#");
}

document.querySelectorAll("[data-go]").forEach(btn => {
  btn.addEventListener("click", () => openView(btn.getAttribute("data-go")));
});
document.querySelectorAll("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => openView("view-menu"));
});

function openFromHash() {
  const h = (location.hash || "#").toLowerCase();
  if (h === "#calc1") return openView("view-calc1");
  if (h === "#calc2") return openView("view-calc2");
  if (h === "#calc3") return openView("view-calc3");
  return openView("view-menu");
}
window.addEventListener("hashchange", openFromHash);
openFromHash();

// ------------------ CALC 1 ------------------
const out1 = document.getElementById("out1");

document.getElementById("btn_calc1").addEventListener("click", () => {
  const in1 = getInputs("c1");
  const scores = {
    k1: readScore(in1.k1),
    k2: readScore(in1.k2),
    k3: readScore(in1.k3),
    k4: readScore(in1.k4),
    k5: readScore(in1.k5),
    bil: readScore(in1.bil),
    ihu: readScore(in1.ihu),
    final: readScore(in1.final)
  };

  const ok = Object.values(scores).every(v => Number.isFinite(v));
  if (!ok) {
    return show(out1, `<span class="badge warn">Uyarı</span> Lütfen tüm alanlara 0–100 arası sayı gir.`);
  }

  const yi60 = weightedYearIn60(scores);
  const ys = yearEnd100(yi60, scores.final);
  const harf = letter(ys);

  // Status logic:
  // - Final < 50 => fail
  // - If ys >= 60 => pass
  // - Else if 59.51 <= ys < 60 and final >= 50 => pass by rounding (show message)
  // - Else fail (ys < 59.51 OR ys < 60)
  let badge = "";
  let extra = "";

  if (scores.final < 50) {
    badge = `<span class="badge bad">KALDI</span><span class="muted-inline">Final 50'nin altında.</span>`;
  } else if (ys >= 60) {
    badge = `<span class="badge good">GEÇTİ</span>`;
  } else if (ys >= 59.51 && ys < 60) {
    badge = `<span class="badge good">GEÇTİ</span><span class="muted-inline">Yıl sonu notu 60’a yuvarlandı.</span>`;
  } else {
    badge = `<span class="badge bad">KALDI</span><span class="muted-inline">Yıl sonu notu 60'ın altında.</span>`;
  }

  const html = `
    ${badge}
    <hr class="hr" />
    <div class="kv">
      <div class="row"><span class="key">Yıl Sonu Notu:</span><span class="val">${fmtTR(ys, 2)}</span></div>
      <div class="row"><span class="key">Harf Notu:</span><span class="val">${harf}</span></div>
    </div>
  `;
  show(out1, html);
});

document.getElementById("btn_reset1").addEventListener("click", () => {
  resetInputs("c1", true);
  hide(out1);
});

// ------------------ CALC 2 ------------------
const out2 = document.getElementById("out2");

document.getElementById("btn_calc2").addEventListener("click", () => {
  const in2 = getInputs("c2");
  const raw = {
    k1: readScore(in2.k1),
    k2: readScore(in2.k2),
    k3: readScore(in2.k3),
    k4: readScore(in2.k4),
    k5: readScore(in2.k5),
    bil: readScore(in2.bil),
    ihu: readScore(in2.ihu)
  };

  const ok = Object.values(raw).every(v => Number.isFinite(v));
  if (!ok) {
    return show(out2, `<span class="badge warn">Uyarı</span> Lütfen tüm alanlara sayı gir. Girmediğin kurul varsa 0 yaz.`);
  }

  const hasZero = Object.values(raw).some(v => v === 0);

  // Info line requested (always show)
  const info = `<div class="muted info-line">Hesaplama, yıl sonu notu 59,51 (60’a yuvarlanır) hedeflenerek yapılmıştır.</div>`;

  if (!hasZero) {
    // Mode A: all entered -> compute min final needed, targeting 59.51 (not 60)
    const yi60 = weightedYearIn60(raw);
    const rawNeed = (PASS_TARGET_YEAR_END - yi60) / 0.40;

    if (rawNeed > 100) {
      const html = `
        <span class="badge bad">SIÇTIN</span>
        Kurul notları çok düşük. Finalde 100 alsan bile geçemezsin.
        <hr class="hr" />
        ${info}
      `;
      return show(out2, html);
    }

    if (rawNeed <= 50) {
      const html = `
        <span class="badge good">RAHAT</span>
        Finalden 50 alman yeter.
        <hr class="hr" />
        ${info}
      `;
      return show(out2, html);
    }

    const minFinal = Math.max(50, rawNeed);
    const html = `
      <span class="badge warn">SIKINTI</span>
      Geçmek için finalden minimum <strong>${fmtTR(minFinal, 2)}</strong> alman lazım.
      <hr class="hr" />
      ${info}
    `;
    return show(out2, html);
  }

  // Mode B: some zeros => "finali 50'ye bırakmak için kalanlardan kaç lazım?"
  // Target year-end = 59.51, final fixed = 50 => need yearIn60 = 59.51 - 20 = 39.51
  const targetYearIn60 = PASS_TARGET_YEAR_END - (WEIGHTS.final * FINAL_FIXED_FOR_50MODE) / 100; // 39.51

  const items = [
    { key: "k1", w: WEIGHTS.k1 },
    { key: "k2", w: WEIGHTS.k2 },
    { key: "k3", w: WEIGHTS.k3 },
    { key: "k4", w: WEIGHTS.k4 },
    { key: "k5", w: WEIGHTS.k5 },
    { key: "bil", w: WEIGHTS.bil },
    { key: "ihu", w: WEIGHTS.ihu }
  ];

  let S_done = 0; // 0..60
  let W_left = 0;

  for (const it of items) {
    const v = raw[it.key];
    if (v === 0) {
      W_left += it.w;
    } else {
      S_done += (it.w * v) / 100;
    }
  }

  // If W_left is 0 here, mode would be A, but keep safe:
  if (W_left === 0) {
    const html = `
      <span class="badge warn">Uyarı</span>
      Tüm kurullar girilmiş görünüyor. Bu sayfada 0 girersen kalan kurulları hesaplar.
      <hr class="hr" />
      ${info}
    `;
    return show(out2, html);
  }

  const needed60 = targetYearIn60 - S_done;
  const neededAvg = (needed60 * 100) / W_left;

  if (neededAvg > 100) {
    const html = `
      <span class="badge bad">OLMAZ</span>
      Kalan kurullarda 100 alsan bile finali 50'ye bırakamıyorsun.
      <hr class="hr" />
      ${info}
    `;
    return show(out2, html);
  }

  const avgToShow = Math.max(0, neededAvg);
  const html = `
    <span class="badge good">OLUR</span>
    Finali 50'ye bırakmak için kalan kurullarda en az <strong>${fmtTR(avgToShow, 2)}</strong> almalısın.
    <hr class="hr" />
    ${info}
  `;
  return show(out2, html);
});

document.getElementById("btn_reset2").addEventListener("click", () => {
  resetInputs("c2", false);
  hide(out2);
});

// ------------------ CALC 3 ------------------
const out3 = document.getElementById("out3");

document.getElementById("btn_calc3").addEventListener("click", () => {
  const in3 = getInputs("c3");
  const raw = {
    k1: readScore(in3.k1),
    k2: readScore(in3.k2),
    k3: readScore(in3.k3),
    k4: readScore(in3.k4),
    k5: readScore(in3.k5),
    bil: readScore(in3.bil),
    ihu: readScore(in3.ihu)
  };

  const ok = Object.values(raw).every(v => Number.isFinite(v));
  if (!ok) {
    return show(out3, `<span class="badge warn">Uyarı</span> Lütfen tüm alanlara sayı gir. Girmediğin kurul varsa 0 yaz.`);
  }

  const hasZero = Object.values(raw).some(v => v === 0);

  const info = `<div class="muted info-line">Hesaplama, yıl sonu notu 79,51 (80’e yuvarlanır) hedeflenerek yapılmıştır.</div>`;

  if (!hasZero) {
    // Mode A: finalsiz olur mu?
    const yi60 = weightedYearIn60(raw);
    const yiNorm = normalizeYearIn100(yi60);

    if (yiNorm >= FINALSESS_TARGET_NORM) {
      const html = `
        <span class="badge good">OLUR</span>
        Kurul not ortalaması <strong>${fmtTR(yiNorm, 2)}</strong>. Finalsiz geçtin.
        <hr class="hr" />
        ${info}
      `;
      return show(out3, html);
    }

    const html = `
      <span class="badge bad">OLMAZ</span>
      Kurul not ortalaması <strong>${fmtTR(yiNorm, 2)}</strong>. Finale gireceksin.
      <hr class="hr" />
      ${info}
    `;
    return show(out3, html);
  }

  // Mode B: some zeros -> remaining avg needed to reach 79.51 normalized
  const target60 = (FINALLESS_TARGET_NORM / 100) * YEAR_IN_TOTAL; // 47.706...

  const items = [
    { key: "k1", w: WEIGHTS.k1 },
    { key: "k2", w: WEIGHTS.k2 },
    { key: "k3", w: WEIGHTS.k3 },
    { key: "k4", w: WEIGHTS.k4 },
    { key: "k5", w: WEIGHTS.k5 },
    { key: "bil", w: WEIGHTS.bil },
    { key: "ihu", w: WEIGHTS.ihu }
  ];

  let S_done = 0;
  let W_left = 0;

  for (const it of items) {
    const v = raw[it.key];
    if (v === 0) {
      W_left += it.w;
    } else {
      S_done += (it.w * v) / 100;
    }
  }

  if (W_left === 0) {
    // Shouldn't happen here, but safe
    const html = `
      <span class="badge warn">Uyarı</span>
      Tüm kurullar girilmiş görünüyor. Finalsiz için durum üstteki hesapla çıkıyor.
      <hr class="hr" />
      ${info}
    `;
    return show(out3, html);
  }

  const needed60 = target60 - S_done;
  const neededAvg = (needed60 * 100) / W_left;

  if (neededAvg > 100) {
    const html = `
      <span class="badge bad">OLMAZ</span>
      Kalan kurullardan 100 alsan bile finalsiz için yetmiyor.
      <hr class="hr" />
      ${info}
    `;
    return show(out3, html);
  }

  const avgToShow = Math.max(0, neededAvg);
  const html = `
    <span class="badge good">OLUR</span>
    Kalan kurullardan <strong>${fmtTR(avgToShow, 2)}</strong> alırsan finalsiz geçebilirsin.
    <hr class="hr" />
    ${info}
  `;
  return show(out3, html);
});

document.getElementById("btn_reset3").addEventListener("click", () => {
  resetInputs("c3", false);
  hide(out3);
});

// Inline small style for muted inline text (badge yanında)
(function injectMinorStyles(){
  const style = document.createElement("style");
  style.textContent = `
    .muted-inline{ color: rgba(148,163,184,.92); font-weight: 700; }
    .info-line{ margin-top: 2px; }
  `;
  document.head.appendChild(style);
})();
