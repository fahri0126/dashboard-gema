const API_URL =
  "https://script.google.com/macros/s/AKfycbyB-JsUF8T3GTjOmcI4pmdyr__NYGA_H8UmyyU5MuTuv6c6c9tNiKuQi8jurzTrsMxH/exec";

// Warna palette
const COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#ff6d00",
  "#46bdc6",
  "#7986cb",
  "#f06292",
  "#aed581",
  "#ffca28",
];

// Urutan PENTING: dari paling spesifik ke paling umum
const KEYWORD_RULES = [
  // Program Studi
  {
    keywords: [
      "teknik informatika",
      "Program Studi S1 Jurusan Teknik Informatika",
    ],
    result: "Teknik Informatika",
  },
  { keywords: ["informatika"], result: "Teknik Informatika" },
  { keywords: [" it ", "^it$"], result: "Teknik Informatika" },
  { keywords: ["teknik geofisika", "geofisika"], result: "Teknik Geofisika" },
  { keywords: ["teknik geologi", "geologi"], result: "Teknik Geologi" },
  { keywords: ["teknik sipil", "sipil"], result: "Teknik Sipil" },
  { keywords: ["teknik elektro", "elektro"], result: "Teknik Elektro" },
  {
    keywords: ["teknik arsitektur", "arsitektur"],
    result: "Teknik Arsitektur",
  },
  {
    keywords: ["pendidikan matematika", "pend. mat"],
    result: "Pendidikan Matematika",
  },
  {
    keywords: ["pendidikan bahasa", "bhs dan sastra", "bahasa dan sastra"],
    result: "Pendidikan Bahasa & Sastra",
  },
  { keywords: ["kedokteran"], result: "Kedokteran" },
  { keywords: ["kebidanan"], result: "Kebidanan" },
  { keywords: ["peternakan"], result: "Peternakan" },
  { keywords: ["manajemen"], result: "Manajemen" },
  { keywords: ["pgsd", "keguruan"], result: "PGSD" },
  {
    keywords: ["ilmu administrasi", "adm negara"],
    result: "Ilmu Administrasi",
  },
  { keywords: ["ilmu hukum", "hukum"], result: "Ilmu Hukum" },
  { keywords: ["gizi"], result: "Gizi" },

  // Semester
  { keywords: ["semester 2", "sem 2", "dua (2)", "^2$"], result: "2" },
  { keywords: ["semester 4", "sem 4", "^4$"], result: "4" },
  { keywords: ["semester 6", "sem 6", "^6$"], result: "6" },
  { keywords: ["semester 8", "sem 8", "^8$"], result: "8" },

  // Ketertarikan Platform Kuis
  {
    keywords: [
      "sangat tertarik",
      "saya tertarik",
      "ya tertarik",
      "ya, sangat",
      "iya..sangat",
      "iyaa..sangat",
      "iya saya sangat",
      "iya saya tertarik",
      "yes, contoh",
      "yah cukup tertarik",
      "iya tentu saja",
      "tentu",
      "tertarik",
      "iyaw",
      "iyaa",
      "iya",
      "^ya$",
      "^yes$",
      "Ya Sangat",
      "Ya.",
      "Ya Sangat",
      "very interest",
      "Very Interest",
      "Iy",
      "Saya belum pernah mencobanya, dan sepertinya menarik.",
      "iyh",
    ],
    result: "Ya",
  },

  {
    keywords: ["jujur tidak", "^tidak$", "^no$", "tidak tertarik", "Jujur Ga"],
    result: "Tidak",
  },

  {
    keywords: ["lumayan", "mungkin", "belum tahu", "ragu", "kurang tahu"],
    result: "Mungkin",
  },
];

function normalize(val) {
  if (val === null || val === undefined) return "";
  const input = String(val).trim().toLowerCase();
  if (!input) return "";

  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      const isRegex = kw.startsWith("^") || kw.endsWith("$");
      if (isRegex) {
        if (new RegExp(kw).test(input)) return rule.result;
      } else {
        if (input.includes(kw)) return rule.result;
      }
    }
  }

  // Tidak cocok → kembalikan asli tapi dengan kapitalisasi standar
  return String(val)
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function countFreq(arr) {
  return arr.reduce((acc, val) => {
    const key = normalize(val);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function countMultiAnswer(arr) {
  const freq = {};
  arr.forEach((val) => {
    if (!val) return;
    String(val)
      .split(",")
      .forEach((item) => {
        const key = normalize(item);
        if (!key || key === "-") return;
        freq[key] = (freq[key] || 0) + 1;
      });
  });
  return freq;
}

function makeChart(id, type, labels, values, options = {}) {
  new Chart(document.getElementById(id), {
    type,
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: COLORS.slice(0, labels.length),
          borderRadius: type === "bar" ? 6 : 0,
          borderWidth: type === "pie" || type === "doughnut" ? 2 : 0,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: type === "pie" || type === "doughnut" ? "right" : "none",
        },
        ...options.plugins,
      },
      indexAxis: options.horizontal ? "y" : "x",
      scales:
        type === "pie" || type === "doughnut"
          ? {}
          : {
              x: { ticks: { font: { size: 11 } } },
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
            },
    },
  });
}

fetch(API_URL, { redirect: "follow", method: "GET" })
  .then((res) => {
    if (!res.ok) throw new Error("HTTP error: " + res.status);
    return res.json();
  })
  .then((data) => {
    document.getElementById("loading").style.display = "none";

    if (!data.length) {
      document.getElementById("error").style.display = "block";
      document.getElementById("error").textContent = "Data kosong.";
      return;
    }

    // --- Kartu Ringkasan ---
    const totalResponden = data.length;
    const rataLatihan = (
      data.reduce(
        (s, r) =>
          s +
          (parseFloat(
            r[
              "Seberapa sering kamu mengerjakan latihan soal secara mandiri di luar kelas?"
            ],
          ) || 0),
        0,
      ) / totalResponden
    ).toFixed(1);
    const rataKesulitan = (
      data.reduce(
        (s, r) =>
          s +
          (parseFloat(
            r["Seberapa sering kamu merasa kesulitan memahami materi kuliah?"],
          ) || 0),
        0,
      ) / totalResponden
    ).toFixed(1);
    const rataKemungkinan = (
      data.reduce(
        (s, r) =>
          s +
          (parseFloat(
            r[
              "Seberapa besar kemungkinan kamu menggunakan platform seperti ini?"
            ],
          ) || 0),
        0,
      ) / totalResponden
    ).toFixed(1);

    const cards = [
      { value: totalResponden, label: "Total Responden" },
      { value: rataLatihan + "/5", label: "Rata-rata Frekuensi Latihan" },
      { value: rataKesulitan + "/5", label: "Rata-rata Tingkat Kesulitan" },
      { value: rataKemungkinan + "/5", label: "Rata-rata Minat Platform" },
    ];

    document.getElementById("summary-cards").innerHTML = cards
      .map(
        (c) => `
      <div class="summary-card">
        <div class="value">${c.value}</div>
        <div class="label">${c.label}</div>
      </div>
    `,
      )
      .join("");

    // Helper ambil kolom
    const col = (key) => data.map((r) => r[key]);

    // --- 1. Program Studi ---
    const freqProdi = countFreq(col("Program Studi/jurusan"));
    makeChart(
      "chartProdi",
      "pie",
      Object.keys(freqProdi),
      Object.values(freqProdi),
    );

    // --- 2. Semester ---
    const freqSemester = countFreq(col("Semester saat ini"));
    const semKeys = Object.keys(freqSemester).sort((a, b) => a - b);
    makeChart(
      "chartSemester",
      "bar",
      semKeys,
      semKeys.map((k) => freqSemester[k]),
    );

    // --- 3. Metode Belajar (multi-answer) ---
    const freqMetode = countMultiAnswer(
      col("Metode belajar apa yang biasa kamu gunakan di luar jam kuliah?"),
    );
    makeChart(
      "chartMetode",
      "bar",
      Object.keys(freqMetode),
      Object.values(freqMetode),
      { horizontal: true },
    );

    // --- 4. Sumber Materi (multi-answer) ---
    const freqSumber = countMultiAnswer(
      col("Dari mana biasanya kamu mendapatkan materi kuliah?"),
    );
    makeChart(
      "chartSumber",
      "bar",
      Object.keys(freqSumber),
      Object.values(freqSumber),
      { horizontal: true },
    );

    // --- 5. Frekuensi Latihan Soal (skala 1-5) ---
    const freqLatihan = countFreq(
      col(
        "Seberapa sering kamu mengerjakan latihan soal secara mandiri di luar kelas?",
      ),
    );
    const latihanKeys = ["1", "2", "3", "4", "5"];
    makeChart(
      "chartLatihan",
      "bar",
      latihanKeys,
      latihanKeys.map((k) => freqLatihan[k] || 0),
    );

    // --- 6. Frekuensi Kesulitan (skala 1-5) ---
    const freqKesulitan = countFreq(
      col("Seberapa sering kamu merasa kesulitan memahami materi kuliah?"),
    );
    makeChart(
      "chartKesulitan",
      "bar",
      latihanKeys,
      latihanKeys.map((k) => freqKesulitan[k] || 0),
    );

    // --- 7. Ketertarikan Platform Kuis ---
    const freqTertarik = countFreq(
      col(
        "Apakah kamu tertarik dengan platform yang bisa generate kuis dari materi yang kamu upload?",
      ),
    );
    makeChart(
      "chartTertarik",
      "doughnut",
      Object.keys(freqTertarik),
      Object.values(freqTertarik),
    );

    // --- 8. Format Kuis ---
    const freqFormat = countFreq(
      col("Format kuis seperti apa yang kamu sukai?"),
    );
    makeChart(
      "chartFormat",
      "pie",
      Object.keys(freqFormat),
      Object.values(freqFormat),
    );

    // --- 9. Fitur Gamifikasi (multi-answer) ---
    const freqGamifikasi = countMultiAnswer(
      col("Fitur gamifikasi apa yang paling memotivasimu dalam belajar?"),
    );
    makeChart(
      "chartGamifikasi",
      "bar",
      Object.keys(freqGamifikasi),
      Object.values(freqGamifikasi),
      { horizontal: true },
    );

    // --- 10. Kemungkinan Menggunakan Platform (skala 1-5) ---
    const freqKemungkinan = countFreq(
      col("Seberapa besar kemungkinan kamu menggunakan platform seperti ini?"),
    );
    makeChart(
      "chartKemungkinan",
      "bar",
      latihanKeys,
      latihanKeys.map((k) => freqKemungkinan[k] || 0),
    );
  })
  .catch((err) => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("error").textContent = "Error: " + err.message;
    console.error(err);
  });
