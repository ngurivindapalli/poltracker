import fs from "fs";
import https from "https";

const FILE_URL =
  "https://raw.githubusercontent.com/QuantStack/congress-trading-data/master/data/congress-trading.csv";

const OUTPUT =
  "./data/investments/trading.csv";

https.get(FILE_URL, res => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: ${res.statusCode}`);
    return;
  }

  const file = fs.createWriteStream(OUTPUT);

  res.pipe(file);

  file.on("finish", () => {
    console.log("Downloaded investment data");
    file.close();
  });

  file.on("error", (err) => {
    console.error("File write error:", err);
    fs.unlink(OUTPUT, () => {});
  });
}).on("error", (err) => {
  console.error("Download error:", err);
});
