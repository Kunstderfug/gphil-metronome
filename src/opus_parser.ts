import { OggOpusDecoderWebWorker } from "ogg-opus-decoder";
import type { Beat } from "./metronome.ts";

async function getOpusready() {
  await opusDecoder.ready;
}
// await opusDecoder.ready

type ClickTimes = {
  fileName: string;
  data: ArrayBuffer;
};
const fileArray: ClickTimes[] = [];
const parsedFiles: any[] = [];
// wait for the WASM to be compiled

export async function handleFileInput(fileSelectionEvent: any) {
  // await getOpusready()
  console.clear();
  const files = Array.from(fileSelectionEvent.target.files);
  for await (const file of files) {
    if (file instanceof File) {
      fileArray.push({
        fileName: file.name.substring(0, file.name.lastIndexOf(".")),
        data: await file.arrayBuffer(),
      });
    }

    console.log(fileArray);
  }

  await createParsedFiles();
  await fetch("/api", {
    method: "GET",
  });
}

export async function createParsedFiles() {
  for await (const file of fileArray) {
    parsedFiles.push({
      filename: file.fileName,
      data: await parseOpusFile(file.data),
    });
    // await createJsonOutput(clickTimes.fileName, clickTimesArray)
  }
  console.log(parsedFiles);
}

async function parseOpusFile(opusFileData: ArrayBuffer): Promise<Beat[]> {
  const opusDecoder = new OggOpusDecoderWebWorker();
  await opusDecoder.ready;

  let clickTimes: Beat[] = [];

  const { sampleRate, channelData } = await opusDecoder.decodeFile(
    new Uint8Array(opusFileData),
  );

  console.log(channelData[0]);

  const clickTimeThreshold = sampleRate / 5;

  // The two channels are identical so just pick the left channel.
  const leftChannel = channelData[0];
  let beatNumber = 1;

  for (let i = 0; true; ++i) {
    // console.log(leftChannel[i])
    // console.log(leftChannel[i])
    // Anything less than 0.1 in volume is not a click.
    // Find the local maximum of the waveform.
    for (
      ;
      i < leftChannel.length - 1 &&
      (leftChannel[i] < 0.05 || leftChannel[i] < leftChannel[i + 1]);
      ++i
    ) {
      continue;
    }

    // The nested loop above means i could go out of bounds.
    // If we are at the last sample then break from the loop to
    // prevent it from being added to clickTimes.
    if (i == leftChannel.length - 1) {
      break;
    }

    // The local maximum of the waveform is at index i.
    if (
      clickTimes.length == 0 ||
      i - clickTimes[clickTimes.length - 1].sampleNumber > clickTimeThreshold
    ) {
      // 0.4 volume is a good volume threshold for downbeats.
      if (leftChannel[i] > 0.4) {
        beatNumber = 1;
        // 0.2 volume is a good volume threshold for other beats.
      } else if (leftChannel[i] > 0.05) {
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
  //create a for loop to iterate through the parsedFiles array and create a json file for each object
  for await (const file of parsedFiles) {
    await createJsonOutput(file.filename, file.data);
  }
}

async function createJsonOutput(filename: string, clickTimes: Beat[]) {
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
