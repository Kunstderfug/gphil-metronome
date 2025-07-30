const fileArray = [];
// wait for the WASM to be compiled

// Visual feedback elements
let progressContainer, progressFill, progressText, fileStatus, resultsSummary;
let totalFiles = 0;
let processedFiles = 0;
let successCount = 0;
let errorCount = 0;

export async function handleFileInput(fileSelectionEvent) {
  // await getOpusready()
  console.clear();
  initializeFeedbackElements();
  resetCounters();

  const files = Array.from(fileSelectionEvent.target.files);

  // Filter for opus files only
  const opusFiles = files.filter((file) => file instanceof File && file.name.toLowerCase().endsWith(".opus"));

  console.log(`Found ${opusFiles.length} opus files out of ${files.length} total files`);

  if (opusFiles.length === 0) {
    showError("No opus files found in the selected folder/files.");
    return;
  }

  totalFiles = opusFiles.length;
  showProgress(true);
  showFileStatus(true);
  updateStatus(`Found ${totalFiles} opus files. Starting processing...`, "processing");

  try {
    for await (const file of opusFiles) {
      console.log(`Processing: ${file.name}`);
      updateStatus(`Processing: ${file.name}`, "processing");

      try {
        fileArray.push({
          fileName: file.name.substring(0, file.name.lastIndexOf(".")),
          data: await file.arrayBuffer(),
        });
        updateStatus(`✓ Loaded: ${file.name}`, "success");
      } catch (error) {
        updateStatus(`✗ Failed to load: ${file.name} - ${error.message}`, "error");
        errorCount++;
      }

      processedFiles++;
      updateProgress(processedFiles, totalFiles, "Loading files...");
    }

    updateStatus("Creating parsed files...", "processing");
    const parsed = await createParsedFiles();

    updateStatus("Uploading to server...", "processing");
    for await (const file of parsed) {
      console.log(file.data);
      try {
        await fetch("/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(file),
        });
        updateStatus(`✓ Uploaded: ${file.filename}`, "success");
        successCount++;
      } catch (error) {
        updateStatus(`✗ Failed to upload: ${file.filename} - ${error.message}`, "error");
        errorCount++;
      }
    }

    showFinalResults();
  } catch (error) {
    updateStatus(`✗ Processing failed: ${error.message}`, "error");
    showError(`Processing failed: ${error.message}`);
  } finally {
    clearFileArray();
    hideProgress();
  }
}

function getFolderName(filename) {
  const parts = filename.split("_");

  if (parts.length < 3) {
    // Not enough parts to parse, return original filename without extension
    console.log(`Folder name for "${filename}": "${filename}" (insufficient parts)`);
    return filename;
  }

  // Remove the last part (tempo - always a number)
  parts.pop();

  // If the last remaining part is a number (optional section index), remove it too
  if (parts.length > 0 && !isNaN(parseInt(parts[parts.length - 1])) && parts[parts.length - 1] !== "") {
    parts.pop();
  }

  // Remove the section name (should be letters/text, not a number)
  if (parts.length > 0 && isNaN(parseInt(parts[parts.length - 1]))) {
    parts.pop();
  }

  // Remove the movement/track number (should be a number)
  if (parts.length > 0 && !isNaN(parseInt(parts[parts.length - 1])) && parts[parts.length - 1] !== "") {
    parts.pop();
  }

  // The remaining parts form the PATH
  const folderName = parts.join("_");
  console.log(`Folder name for "${filename}": "${folderName}"`);
  return folderName || filename; // Fallback to original filename if parsing fails
}

function clearFileArray() {
  fileArray.length = 0;
}

export async function createParsedFiles() {
  const parsedFiles = [];
  for await (const file of fileArray) {
    const folder = getFolderName(file.fileName);
    parsedFiles.push({
      folder: folder,
      filename: file.fileName,
      data: await parseOpusFile(file.data),
    });
    // await createJsonOutput(clickTimes.fileName, clickTimesArray)
  }
  return parsedFiles;
}

async function parseOpusFile(opusFileData) {
  const opusDecoder = decoder;
  await opusDecoder.ready;

  let clickTimes = [];

  const { sampleRate, channelData } = await opusDecoder.decodeFile(new Uint8Array(opusFileData));

  const clickTimeThreshold = sampleRate / 5;
  const leftChannel = channelData[0];
  let beatNumber = 1;

  for (let i = 0; true; ++i) {
    // console.log(leftChannel[i]);
    for (; i < leftChannel.length - 1 && (leftChannel[i] < 0.07 || leftChannel[i] < leftChannel[i + 1]); ++i) {
      continue;
    }
    if (i == leftChannel.length - 1) {
      break;
    }

    // The local maximum of the waveform is at index i.
    if (clickTimes.length == 0 || i - clickTimes[clickTimes.length - 1].sampleNumber > clickTimeThreshold) {
      // 0.4 volume is a good volume threshold for downbeats.
      if (leftChannel[i] > 0.4) {
        beatNumber = 1;
        // 0.2 volume is a good volume threshold for other beats.
      } else if (leftChannel[i] > 0.07) {
        beatNumber++;
      }

      clickTimes.push({
        sampleNumber: i,
        time: Math.round((i * 1000) / sampleRate), // Milliseconds.
        beat: beatNumber,
      });
    }
  }

  // console.log('click times: ' + JSON.stringify(clickTimes))
  opusDecoder.reset();
  return clickTimes;
}

export async function writeJsonFiles() {
  initializeFeedbackElements();
  resetCounters();

  if (fileArray.length === 0) {
    showError("No files loaded. Please select files first.");
    return;
  }

  totalFiles = fileArray.length;
  showProgress(true);
  showFileStatus(true);
  updateStatus(`Starting to create ${totalFiles} JSON files...`, "processing");

  try {
    // Get parsed files first since parsedFiles variable is not in scope
    const parsed = await createParsedFiles();
    processedFiles = 0;

    //create a for loop to iterate through the parsedFiles array and create a json file for each object
    for await (const file of parsed) {
      try {
        updateStatus(`Creating: ${file.filename}.json`, "processing");
        await createJsonOutput(file.filename, file.data);
        updateStatus(`✓ Created: ${file.filename}.json`, "success");
        successCount++;
      } catch (error) {
        updateStatus(`✗ Failed to create: ${file.filename}.json - ${error.message}`, "error");
        errorCount++;
      }

      processedFiles++;
      updateProgress(processedFiles, totalFiles, "Creating JSON files...");
    }

    showFinalResults();
  } catch (error) {
    updateStatus(`✗ Failed to create JSON files: ${error.message}`, "error");
    showError(`Failed to create JSON files: ${error.message}`);
  } finally {
    hideProgress();
  }
}

async function createJsonOutput(filename, clickTimes) {
  // Remove the sample numbers.
  const fileContents = clickTimes.map((entry) =>
    Object({
      time: entry.time,
      beat: entry.beat,
    }),
  );
  console.log(fileContents);

  // Stolen from https://stackoverflow.com/a/35251739
  const blob = new Blob([JSON.stringify(fileContents)], {
    type: "application/json",
  });
  const dlink = document.createElement("a");
  const fileName1 = filename.substring(0, filename.lastIndexOf("."));
  dlink.download = fileName1 + ".json";
  dlink.href = window.URL.createObjectURL(blob);
  dlink.onclick = () => {
    // revokeObjectURL needs a delay to work properly
    setTimeout(function () {
      window.URL.revokeObjectURL(dlink.href);
    }, 2500);
  };
  dlink.click();
  dlink.remove();
}

// Test function to verify getFolderName works correctly
function testGetFolderName() {
  console.log("Testing getFolderName function:");

  // Test case 1: COUPERIN_TICTOC_1_EXPO_1_100
  const test1 = getFolderName("COUPERIN_TICTOC_1_EXPO_1_100");
  console.log(`Test 1 - Expected: "COUPERIN_TICTOC", Got: "${test1}"`);

  // Test case 2: COUPERIN_TICTOC_1_EP_100
  const test2 = getFolderName("COUPERIN_TICTOC_1_EP_100");
  console.log(`Test 2 - Expected: "COUPERIN_TICTOC", Got: "${test2}"`);

  // Test case 3: PATH_INDEX_SECTIONNAME_TEMPO
  const test3 = getFolderName("BACH_INVENTION_2_DEV_120");
  console.log(`Test 3 - Expected: "BACH_INVENTION", Got: "${test3}"`);

  // Test case 4: PATH_INDEX_SECTIONNAME_INDEX_TEMPO
  const test4 = getFolderName("MOZART_SONATA_1_EXPO_2_140");
  console.log(`Test 4 - Expected: "MOZART_SONATA", Got: "${test4}"`);

  // Test case 5: Complex path with multiple underscores
  const test5 = getFolderName("COMPLEX_PATH_NAME_3_SECTION_180");
  console.log(`Test 5 - Expected: "COMPLEX_PATH_NAME", Got: "${test5}"`);
}

// Uncomment the line below to run tests
// testGetFolderName();

// Visual feedback functions
function initializeFeedbackElements() {
  if (!progressContainer) {
    progressContainer = document.getElementById("progress-container");
    progressFill = document.getElementById("progress-fill");
    progressText = document.getElementById("progress-text");
    fileStatus = document.getElementById("file-status");
    resultsSummary = document.getElementById("results-summary");
  }
}

function resetCounters() {
  totalFiles = 0;
  processedFiles = 0;
  successCount = 0;
  errorCount = 0;
}

function showProgress(show) {
  if (progressContainer) {
    progressContainer.style.display = show ? "block" : "none";
  }
}

function hideProgress() {
  showProgress(false);
}

function showFileStatus(show) {
  if (fileStatus) {
    fileStatus.style.display = show ? "block" : "none";
    if (show) {
      fileStatus.innerHTML = "";
    }
  }
}

function updateProgress(current, total, message) {
  const percentage = Math.round((current / total) * 100);

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  if (progressText) {
    progressText.textContent = `${message} (${current}/${total}) - ${percentage}%`;
  }
}

function updateStatus(message, type) {
  if (!fileStatus) return;

  const statusItem = document.createElement("div");
  statusItem.className = "status-item";

  const icon = document.createElement("span");
  icon.className = `status-icon status-${type}`;

  switch (type) {
    case "success":
      icon.textContent = "✓";
      break;
    case "error":
      icon.textContent = "✗";
      break;
    case "processing":
      icon.textContent = "⟳";
      break;
    default:
      icon.textContent = "•";
  }

  const text = document.createElement("span");
  text.textContent = message;

  statusItem.appendChild(icon);
  statusItem.appendChild(text);
  fileStatus.appendChild(statusItem);

  // Auto-scroll to bottom
  fileStatus.scrollTop = fileStatus.scrollHeight;
}

function showFinalResults() {
  if (!resultsSummary) return;

  let summaryClass, summaryMessage;

  if (errorCount === 0) {
    summaryClass = "summary-success";
    summaryMessage = `✓ All ${successCount} files processed successfully!`;
  } else if (successCount === 0) {
    summaryClass = "summary-error";
    summaryMessage = `✗ All ${errorCount} files failed to process.`;
  } else {
    summaryClass = "summary-partial";
    summaryMessage = `⚠ Partial success: ${successCount} succeeded, ${errorCount} failed.`;
  }

  resultsSummary.className = `${summaryClass}`;
  resultsSummary.textContent = summaryMessage;
  resultsSummary.style.display = "block";

  updateStatus(summaryMessage, errorCount === 0 ? "success" : successCount === 0 ? "error" : "processing");
}

function showError(message) {
  if (!resultsSummary) return;

  resultsSummary.className = "summary-error";
  resultsSummary.textContent = `✗ Error: ${message}`;
  resultsSummary.style.display = "block";
}
