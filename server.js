const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Proxy server is running");
});

app.get("/proxy/m3u8", async (req, res) => {
  try {
    const sourceUrl = req.query.url;

    if (!sourceUrl) {
      return res.status(400).send("Missing url parameter");
    }

    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.status}`);
    }

    let text = await response.text();

    const sourceBase = new URL(sourceUrl);
    const basePath = `${sourceBase.origin}${sourceBase.pathname.substring(0, sourceBase.pathname.lastIndexOf("/") + 1)}`;

    const lines = text.split("\n").map(line => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      const absoluteUrl = new URL(trimmed, basePath).toString();
      return `/proxy/segment?url=${encodeURIComponent(absoluteUrl)}`;
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(lines.join("\n"));
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Failed to load m3u8");
  }
});

app.get("/proxy/segment", async (req, res) => {
  try {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).send("Missing url");
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Segment upstream error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "video/mp2t";
    const arrayBuffer = await response.arrayBuffer();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Segment proxy error:", error);
    res.status(500).send("Failed to load segment");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
