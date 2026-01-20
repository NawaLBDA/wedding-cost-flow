const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWin;

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  mainWin.loadFile("index.html");
}

/* ================================
   GENERATE PDF REPORT
================================ */
ipcMain.on("generate-report", async (event, data) => {
  try {
    // 🔹 CHOOSE REPORT FILE BY LANGUAGE
    const reportFile =
      data.lang === "ar" ? "report-ar.html" : "report.html";

    const reportWin = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true
      }
    });

    // 🔹 LOAD REPORT WITH QUERY PARAMS
    await reportWin.loadFile(
      path.join(__dirname, reportFile),
      { query: data }
    );

    // 🔹 GENERATE PDF
    const pdf = await reportWin.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      marginsType: 1
    });

    // 🔹 SAVE TO DESKTOP
    const fileName =
      data.lang === "ar"
        ? `Wedding_Report_AR_${Date.now()}.pdf`
        : `Wedding_Report_EN_${Date.now()}.pdf`;

    const pdfPath = path.join(app.getPath("desktop"), fileName);
    fs.writeFileSync(pdfPath, pdf);

    // 🔹 NOTIFICATION
    new Notification({
      title: "Wedding Cost Flow",
      body: `PDF exported successfully:\n${fileName}`
    }).show();

    reportWin.close();
  } catch (err) {
    console.error("PDF error:", err);
  }
});

app.whenReady().then(createWindow);
