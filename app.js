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

const NORMALISASI = {
  // Program Studi
  informatika: "Informatika",
  "teknik informatika": "Informatika",
  it: "Informatika",
  "ilmu komputer": "Informatika",
  "program stusi s1 jurusan teknik inf": "Informatika",
  "teknik geofisika": "Teknik Geofisika",
  "teknik geologi": "Teknik Geologi",
  kebidanan: "Kebidanan",
  peternakan: "Peternakan",
  "pendidikan bahasa dan sastra": "Pendidikan Bahasa & Sastra",
  "pendidikan matematika": "Pendidikan Matematika",
  "teknik sipil": "Teknik Sipil",
  "s1 teknik sipil": "Teknik Sipil",
  "teknik elektro": "Teknik Elektro",
  manajemen: "Manajemen",
  "keguruan/pgsd": "PGSD",
  "ilmu administrasi": "Ilmu Administrasi",
  kedokteran: "Kedokteran",
  gizi: "Gizi",
  "ilmu hukum": "Ilmu Hukum",
  "teknik arsitektur": "Teknik Arsitektur",

  // Semester — normalisasi ke angka string
  "semester 2": "2",
  "semester 4": "4",
  "semester 6": "6",
  "semester 8": "8",
  semester2: "2",
  semester4: "4",
  semester6: "6",
  semester8: "8",
  "dua (2)": "2",
  dua: "2",
  "semester 2 ": "2",
  "semester 4 ": "4",

  // Ketertarikan platform kuis
  ya: "Ya",
  yes: "Ya",
  tidak: "Tidak",
  no: "Tidak",
  mungkin: "Mungkin",
  "belum tahu": "Mungkin",
};

function normalize(val) {
  const key = String(val).trim().toLowerCase();
  return NORMALISASI[key] || String(val).trim();
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
