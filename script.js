const targetFile = "./sample.log";
const fs = require("fs");
const logStuff = () => {
  for (let i = 0; i < 100; i++) {
    setTimeout(
      () => fs.appendFileSync(targetFile, `${Date()}\n`, "utf-8"),
      (i + Math.random()) * 2000
    );
  }
};

logStuff();
