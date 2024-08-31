console.clear();
const express = require("express");
const fs = require("fs");
const { Server } = require("http");
const path = require("path");
const { buffer } = require("stream/consumers");
const WebSocket = require("ws");
const logFile = "./sample.log";
const app = express();
const server = Server(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

let fileSize = 0;
let lines = [];
const getLast10Lines = (fileName) => {
  const fd = fs.openSync(fileName, "r");
  fileSize = fs.fstatSync(fd).size;

  let position = fileSize;
  let toRead = 0;
  const bufferSize = 1024;
  const buffer = Buffer.alloc(bufferSize);
  while (lines.length <= 10 && position >= 0) {
    toRead = Math.min(bufferSize, position);
    position -= toRead;

    fs.readSync(fd, buffer, 0, toRead, position);
    const chunk = buffer.toString("utf-8");
    lines = chunk.split("\n").concat(lines);
    console.log(`Length: ${lines.length}`);
  }

  fs.closeSync(fd);
  lines = lines.filter((line) => line.trim().length > 0);
  lines = lines.slice(-10);
  console.log(lines);

  return lines.join("\n");
};

wss.on("connection", (ws) => {
  console.log(`Client connected`);

  const last10Lines = getLast10Lines(logFile);
  ws.send(last10Lines);

  ws.on("close", () => {
    console.log("Connection closed");
  });

  ws.on("error", (ws) => {
    console.error("Error!");
  });
});

const getNewLines = (start, end) => {
  const readStream = fs.createReadStream(logFile, { start, end });

  readStream.on("data", (data) => {
    const newData = data.toString("utf-8");
    console.log(newData);
    const newLines = newData
      .split("\n")
      .filter((line) => line.trim().length > 0);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN)
        client.send(newLines.join("\n"));
    });
  });
};

fs.watch(logFile, (event, fileName) => {
  if (fileName) {
    const currentSize = fs.statSync(fileName).size;
    if (currentSize > fileSize) {
      getNewLines(fileSize, currentSize);
      fileSize = currentSize;
    }
  }
});

server.listen(3000, () => {
  console.log(`Server is running!`);
});
