import fs from "fs";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const Fs = fs.promises;
const port = 8080;
const server = express();
//make static folder
server.use(express.static("public"));
server.use(express.static("json"));
server.use(express.json());
server.use(bodyParser.json());
server.use(cors());
server.set("view engine", "ejs");
server.listen(port, (err) => {
  console.log(err || `Server listening on port ${port}`);
});

server.get("/", async (req, res) => {
  // res.send('Hello World!')
  res.render("index");
});

server.post("/uploads", async (req, res) => {
  const file = req.body;
  await writeFile(file);
  res.send("Uploaded!");
});

async function writeFile(file) {
  // create folder based on file name
  if (!fs.existsSync(`json/${file.folder}/CLICKDATA`))
    await Fs.mkdir(`json/${file.folder}/CLICKDATA`, {
      recursive: true,
      force: true,
    });

  Fs.writeFile(
    `json/${file.folder}/CLICKDATA/${file.filename}.json`,
    JSON.stringify(file.data),
    (err) => {
      if (err) throw err;
      console.log("Saved!");
    },
  );
}
