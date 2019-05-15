import * as React from 'react';
import * as fs from 'fs-extra';
import { Component } from 'react';
import * as path from 'path';
const { dialog, getCurrentWindow } = require('electron').remote;

import { IMediaRecorder, MediaRecorder, register } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';
import { BrowserWindow, SaveDialogOptions } from 'electron';
import { getMicrophoneStream } from '../audio/AudioHelpers';

interface IState {
  mediaRecorder: IMediaRecorder | undefined;
}

export default class HomePage extends Component<{}, IState> {

  state: IState = {
    mediaRecorder: undefined,
  };

  toggleRecording = () => {
    if (this.state.mediaRecorder) {
      this.state.mediaRecorder.stop();
      this.setState({
        mediaRecorder: undefined,
      });
    } else {
      this.startRecording();
    }
  }

  startRecording = async () => {
    const mediaRecorder = await setupMediaRecorder();

    mediaRecorder.start();

    this.setState({
      mediaRecorder,
    });
  }

  render() {
    const { mediaRecorder } = this.state;

    const isRecording = mediaRecorder !== undefined;

    return (
      <div>
          <div onClick={this.toggleRecording} style={{cursor: 'pointer'}}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </div>
      </div>
    )
  }
}

async function setupMediaRecorder(): Promise<IMediaRecorder> {
  const port = await connect();
  await register(port);

  const stream = await getMicrophoneStream();

  const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/wav',
  });

// @ts-ignore
  mediaRecorder.addEventListener('dataavailable', async ({ data }) => {
    const destination = await promptForSaveFilename('recording', '.wav');
    writeBlobToFile(data, destination);
  });

  return mediaRecorder;
}

function promptForSaveFilename(
  suggestedFilename: string,
  extension: string,
): string | undefined {
  const defaultPath = path.format({
      name: suggestedFilename,
      ext: extension,
  });

  const window: BrowserWindow = getCurrentWindow();
  const saveOptions: SaveDialogOptions = {
      title: `Save file`,
      defaultPath,
      filters: [{ name, extensions: [extension.replace('.', '')] }],
  };

  return dialog.showSaveDialog(window, saveOptions);
}

async function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve: (data: ArrayBuffer) => void, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
          // We call reader.readAsArrayBuffer, so it's safe to cast reader.result to ArrayBuffer
          resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = (err) => {
          reject(err);
      };
      reader.readAsArrayBuffer(blob);
  });
}

async function writeBlobToFile(blob: Blob, destinationPath: string) {
  const arrayBuffer = await blobToBuffer(blob);
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(destinationPath, buffer);
}
