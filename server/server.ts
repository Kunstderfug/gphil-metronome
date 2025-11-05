import fs from "fs";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

const Fs = fs.promises;
const port = 3001;
const server = express();

interface UploadFile {
  outputFolder: string;
  filename: string;
  data: any[];
}

// Make static folders
server.use(express.static("public"));
server.use(express.static("dist/public"));
server.use(express.static("json"));
server.use(express.json());
server.use(bodyParser.json());
server.use(cors());
server.set("view engine", "ejs");

server.listen(port, (err?: Error) => {
  console.log(err || `Server listening on port ${port}`);
});

server.get("/", async (req, res) => {
  // res.send('Hello World!')
  res.render("index");
});

server.post("/uploads", async (req: express.Request<{}, {}, UploadFile>, res: express.Response) => {
  const file = req.body;
  console.log(`=== FILE UPLOAD REQUEST ===`);
  console.log(`Requested output folder: ${file.outputFolder}`);
  console.log(`Filename: ${file.filename}`);
  console.log(`Server current working directory: ${process.cwd()}`);

  await writeFile(file, file.outputFolder);
  res.send("Uploaded!");
});

async function writeFile(file: UploadFile, outputFolder: string): Promise<void> {
  // Use selected output folder, or default to 'json' if not provided
  const outputPath = outputFolder && outputFolder.trim() ? outputFolder : "json";
  const serverPath = process.cwd();
  const fullServerPath = path.join(serverPath, outputPath);

  console.log(`=== FILE WRITE DETAILS ===`);
  console.log(`Server working directory: ${serverPath}`);
  console.log(`Requested output path: ${outputPath}`);
  console.log(`Full server path: ${fullServerPath}`);
  console.log(`Target filename: ${file.filename}_CLICKDATA.json`);

  try {
    // Ensure output folder exists - create if it doesn't
    if (!fs.existsSync(outputPath)) {
      console.log(`Creating directory: ${outputPath}`);
      await Fs.mkdir(outputPath, {
        recursive: true,
      });
    }

    // Save file directly in the output folder without subfolder structure
    const filePath = path.join(outputPath, `${file.filename}_CLICKDATA.json`);
    const fullFilePath = path.join(serverPath, filePath);

    await Fs.writeFile(filePath, JSON.stringify(file.data));
    console.log(`✅ Successfully saved to: ${fullFilePath}`);
    console.log(`File size: ${JSON.stringify(file.data).length} bytes`);
  } catch (error) {
    console.error(`❌ Error writing file:`, error);
    throw error;
  }
}
