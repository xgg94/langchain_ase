const fs = require("fs");
const path = require("path");

const folderPath = path.join(__dirname, "../../../../../vectorStore");

export default async function handler(req, res) {
  let embeddingFiles = [];
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(files);
    embeddingFiles = files;
    return res.status(200).json(embeddingFiles);
  });
}
