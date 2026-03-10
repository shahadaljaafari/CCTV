const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// رابط البث الأصلي
const SOURCE_URL =
  "https://addy.gooick.com/ba/main/output.m3u8?signature=766c107e11766855175407f1bea7849ed39408c2e3eb012a45aec224bc171bda&t=1773138978&no_ad=true";

// تفعيل CORS على سيرفرك أنت
app.use(cors());

// بروكسي لملف m3u8
app.get("/proxy/m3u8", async (req, res) => {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.status}`);
    }

    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

    res.send(text);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Failed to load m3u8 from source");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
