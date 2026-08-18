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
        // Upload regular data
        await fetch("/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folder: file.folder,
            filename: file.filename,
            fullPath: file.fullPath,
            composer: file.composer,
            concerto: file.concerto,
            movement: file.movement,
            data: file.data,
          }),
        });
        updateStatus(`✓ Uploaded: ${file.filename}`, "success");

        // Upload debug data
        if (file.debugInfo) {
          try {
            const response = await fetch("/uploads-debug", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                folder: file.folder,
                filename: file.filename,
                fullPath: file.fullPath,
                composer: file.composer,
                concerto: file.concerto,
                movement: file.movement,
                debugInfo: file.debugInfo,
              }),
            });

            if (!response.ok) {
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            updateStatus(`✓ Uploaded debug: ${file.filename}_debug`, "success");
          } catch (debugError) {
            console.error("Debug upload failed:", debugError);
            updateStatus(`✗ Debug upload failed: ${file.filename}_debug - ${debugError.message}`, "error");
          }
        }
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

function parseFilePath(filename) {
  const parts = filename.split("_");

  if (parts.length < 3) {
    // Not enough parts to parse, use fallback structure
    console.log(`Insufficient parts in "${filename}", using fallback structure`);
    return {
      composer: "UNKNOWN",
      concerto: "UNKNOWN",
      movement: "1",
      directoryPath: "UNKNOWN_UNKNOWN/1/CLICKDATA/",
      fullPath: `UNKNOWN_UNKNOWN/1/CLICKDATA/${filename}.json`,
    };
  }

  const composer = parts[0];
  const concerto = parts[1];
  const movement = parts[2];

  const composerConcerto = `${composer}_${concerto}`;
  const directoryPath = `${composerConcerto}/${movement}/`;
  const fullPath = `${directoryPath}${filename}.json`;

  console.log(`Parsed "${filename}": composer="${composer}", concerto="${concerto}", movement="${movement}"`);
  console.log(`Full path: "${fullPath}"`);

  return {
    composer,
    concerto,
    movement,
    directoryPath,
    fullPath,
  };
}

function clearFileArray() {
  fileArray.length = 0;
}

export async function createParsedFiles() {
  //create a for loop to iterate through the fileArray array and create a json file for each object
  const parsedFiles = [];
  for await (const file of fileArray) {
    const pathInfo = parseFilePath(file.fileName);
    const result = await parseOpusFile(file.data);
    console.log("parseOpusFile result for", file.fileName, ":", {
      hasClicks: !!result.clicks,
      clicksLength: result.clicks?.length,
      hasDebugInfo: !!result.debugInfo,
      debugInfoAnalysisLength: result.debugInfo?.analysis?.length,
    });
    parsedFiles.push({
      folder: pathInfo.directoryPath,
      filename: file.fileName,
      fullPath: pathInfo.fullPath,
      composer: pathInfo.composer,
      concerto: pathInfo.concerto,
      movement: pathInfo.movement,
      data: result.clicks,
      debugInfo: result.debugInfo,
    });
    // await createJsonOutput(clickTimes.fileName, clickTimesArray)
  }
  console.log(parsedFiles);
  return parsedFiles;
}

async function parseOpusFile(opusFileData) {
  const opusDecoder = decoder;
  await opusDecoder.ready;

  let clickTimes = [];
  let debugAnalysis = [];

  const { sampleRate, channelData } = await opusDecoder.decodeFile(new Uint8Array(opusFileData));

  console.log("=== parseOpusFile Analysis ===");
  console.log("Sample Rate:", sampleRate);
  console.log("Channel Data Length:", channelData.length);
  console.log("Left Channel Length:", channelData[0].length);
  console.log("First 20 samples:", channelData[0].slice(0, 20));

  // Collect every 5000th sample throughout the entire file
  const every5000thSample = [];
  for (let i = 0; i < channelData[0].length; i += 5000) {
    every5000thSample.push({
      sampleNumber: i,
      value: channelData[0][i],
      timeMs: Math.round((i * 1000) / sampleRate),
      timeSeconds: (i / sampleRate).toFixed(3),
    });
  }
  console.log("Collected", every5000thSample.length, "samples (every 5000th sample)");

  const clickTimeThreshold = sampleRate / 5;
  console.log("Click Time Threshold (samples):", clickTimeThreshold);
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
      console.log(`Sample ${i}: Value = ${leftChannel[i].toFixed(6)}`);

      const isDownbeat = leftChannel[i] > 0.4;
      const isBeat = leftChannel[i] > 0.07;
      let samplesSinceLastClick;

      // 0.4 volume is a good volume threshold for downbeats.
      if (isDownbeat) {
        beatNumber = 1;
        console.log(`  -> Downbeat detected! Beat reset to ${beatNumber}`);
        // 0.2 volume is a good volume threshold for other beats.
      } else if (isBeat) {
        beatNumber++;
        console.log(`  -> Beat detected! Beat incremented to ${beatNumber}`);
      }

      const timeMs = Math.round((i * 1000) / sampleRate);
      console.log(`  -> Time: ${timeMs}ms (${(i / sampleRate).toFixed(3)}s)`);

      if (clickTimes.length > 0) {
        samplesSinceLastClick = i - clickTimes[clickTimes.length - 1].sampleNumber;
        console.log(`  -> Samples since last click: ${samplesSinceLastClick}`);
      }

      const clickData = {
        sampleNumber: i,
        time: timeMs,
        beat: beatNumber,
      };

      debugAnalysis.push({
        sampleNumber: i,
        value: leftChannel[i],
        isDownbeat,
        isBeat,
        timeMs,
        timeSeconds: i / sampleRate,
        samplesSinceLastClick,
        beatNumber,
      });

      clickTimes.push(clickData);
    }
  }

  const debugInfo = {
    sampleRate,
    channelDataLength: channelData.length,
    leftChannelLength: channelData[0].length,
    firstSamples: Array.from(channelData[0].slice(0, 20)),
    every5000thSample,
    clickTimeThreshold,
    analysis: debugAnalysis,
    totalClicks: clickTimes.length,
    clickTimes,
  };

  console.log(`\nTotal clicks detected: ${clickTimes.length}`);
  console.log("All click times:", clickTimes);
  console.log("Click times summary:");
  clickTimes.forEach((click, index) => {
    console.log(`  ${index + 1}: Sample ${click.sampleNumber}, Time ${click.time}ms, Beat ${click.beat}`);
  });
  console.log("=== End parseOpusFile Analysis ===\n");
  console.log("parseOpusFile returning debugInfo with", debugInfo.analysis.length, "analysis entries");

  opusDecoder.reset();
  return { clicks: clickTimes, debugInfo };
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
  updateStatus(`Starting to upload ${totalFiles} JSON files to server...`, "processing");

  try {
    // Get parsed files first since parsedFiles variable is not in scope
    const parsed = await createParsedFiles();
    processedFiles = 0;

    // Upload files to server
    for await (const file of parsed) {
      console.log("Uploading file:", file.filename);
      console.log("Debug info available:", !!file.debugInfo);

      try {
        updateStatus(`Uploading: ${file.filename}`, "success");

        // Upload regular data
        await fetch("/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folder: file.folder,
            filename: file.filename,
            fullPath: file.fullPath,
            composer: file.composer,
            concerto: file.concerto,
            movement: file.movement,
            data: file.data,
          }),
        });
        updateStatus(`✓ Uploaded: ${file.filename}`, "success");

        // Upload debug data
        if (file.debugInfo) {
          await fetch("/uploads-debug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folder: file.folder,
              filename: file.filename,
              fullPath: file.fullPath,
              composer: file.composer,
              concerto: file.concerto,
              movement: file.movement,
              debugInfo: file.debugInfo,
            }),
          });
          updateStatus(`✓ Uploaded debug: ${file.filename}_debug`, "success");
        }
        successCount++;
      } catch (error) {
        updateStatus(`✗ Failed to upload: ${file.filename} - ${error.message}`, "error");
        errorCount++;
      }

      processedFiles++;
      updateProgress(processedFiles, totalFiles, "Uploading JSON files to server...");
    }

    showFinalResults();
  } catch (error) {
    updateStatus(`✗ Failed to upload JSON files: ${error.message}`, "error");
    showError(`Failed to upload JSON files: ${error.message}`);
  } finally {
    hideProgress();
  }
}

// Test function to verify parseFilePath works correctly
function testParseFilePath() {
  console.log("Testing parseFilePath function:");

  // Test case 1: RACHMANINOFF_4_2_CODA_50
  const test1 = parseFilePath("RACHMANINOFF_4_2_CODA_50");
  console.log(`Test 1 - Expected path: "RACHMANINOFF_4/2/CLICKDATA/RACHMANINOFF_4_2_CODA_50.json"`);
  console.log(`Got: "${test1.fullPath}"`);

  // Test case 2: COUPERIN_TICTOC_1_EXPO_100
  const test2 = parseFilePath("COUPERIN_TICTOC_1_EXPO_100");
  console.log(`Test 2 - Expected path: "COUPERIN_TICTOC/1/CLICKDATA/COUPERIN_TICTOC_1_EXPO_100.json"`);
  console.log(`Got: "${test2.fullPath}"`);

  // Test case 3: BACH_F_3_DEV_120 (concerto name "F")
  const test3 = parseFilePath("BACH_F_3_DEV_120");
  console.log(`Test 3 - Expected path: "BACH_F/3/CLICKDATA/BACH_F_3_DEV_120.json"`);
  console.log(`Got: "${test3.fullPath}"`);

  // Test case 4: MOZART_Rhapsody_1_EXPO_140 (concerto name "Rhapsody")
  const test4 = parseFilePath("MOZART_Rhapsody_1_EXPO_140");
  console.log(`Test 4 - Expected path: "MOZART_Rhapsody/1/CLICKDATA/MOZART_Rhapsody_1_EXPO_140.json"`);
  console.log(`Got: "${test4.fullPath}"`);

  // Test case 5: Insufficient parts
  const test5 = parseFilePath("SHORT_FILE");
  console.log(`Test 5 - Expected fallback, Got: "${test5.fullPath}"`);
}

// Uncomment the line below to run tests
// testParseFilePath();

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
