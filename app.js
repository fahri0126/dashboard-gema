const API_URL =
  "https://script.google.com/macros/s/AKfycbyyuv05qCcyz5BPNQeH_gVj_IPe0uKsV0iLz5V_bVI/dev";

fetch(API_URL, {
  redirect: "follow",
  method: "GET",
})
  .then((res) => {
    if (!res.ok) throw new Error("Gagal fetch: " + res.status);
    return res.json();
  })
  .then((data) => {
    document.getElementById("loading").style.display = "none";

    if (!data.length) {
      document.getElementById("error").style.display = "block";
      document.getElementById("error").textContent = "Data kosong.";
      return;
    }

    // --- Render Tabel ---
    const headers = Object.keys(data[0]);

    document.getElementById("thead").innerHTML =
      "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";

    document.getElementById("tbody").innerHTML = data
      .map(
        (row) =>
          "<tr>" +
          headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("") +
          "</tr>",
      )
      .join("");

    // --- Render Chart ---
    // Asumsi: kolom pertama = label, kolom kedua = angka
    const labelKey = headers[0];
    const valueKey = headers[1];

    const labels = data.map((row) => row[labelKey]);
    const values = data.map((row) => parseFloat(row[valueKey]) || 0);

    new Chart(document.getElementById("myChart"), {
      type: "bar", // bisa diganti: 'line', 'pie', 'doughnut'
      data: {
        labels,
        datasets: [
          {
            label: valueKey,
            data: values,
            backgroundColor: "#4285f4",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
      },
    });
  })
  .catch((err) => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("error").textContent = "Error: " + err.message;
  });
