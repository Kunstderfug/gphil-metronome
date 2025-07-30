import { handleFileInput, writeJsonFiles } from "./opus_parser.js";

const buttonWrite = document.getElementById("write_json_files");
const fileInput = document.getElementById("file-input");
const fileInputLabel = document.getElementById("file-input-label");
const selectionNote = document.getElementById("selection-note");

// Handle file input change
fileInput.addEventListener("change", (event) => handleFileInput(event));
buttonWrite.addEventListener("click", () => writeJsonFiles());

// Handle selection mode toggle
document.querySelectorAll('input[name="selection-mode"]').forEach((radio) => {
  radio.addEventListener("change", (event) => {
    const mode = event.target.value;

    if (mode === "folder") {
      fileInput.setAttribute("webkitdirectory", "");
      fileInput.setAttribute("multiple", "");
      fileInputLabel.textContent = "Select folder containing opus files:";
      selectionNote.innerHTML =
        "<small>Note: This will select all files in the chosen folder and its subfolders</small>";
    } else {
      fileInput.removeAttribute("webkitdirectory");
      fileInput.setAttribute("multiple", "");
      fileInputLabel.textContent = "Select opus files:";
      selectionNote.innerHTML = "<small>Note: You can select multiple files by holding Ctrl (or Cmd on Mac)</small>";
    }

    // Clear the current selection
    fileInput.value = "";
  });
});
