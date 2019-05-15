async function listAudioInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = [];
  for (const device of devices) {
      if (device.kind === 'audioinput') {
          audioInputs.push(device);
      }
  }
  return audioInputs;
}

async function getDefaultInput() {
  const audioInputs = await listAudioInputs();
  for (const device of audioInputs) {
      if (device.deviceId === 'default') {
          return device;
      }
  }
}

export async function getMicrophoneStream() {
  const input = await getDefaultInput();
  try {
      const constraints = {
          audio: {
              deviceId: input.deviceId,
          },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      return stream;
  } catch (e) {
      throw e;
      console.error(e);
  }
}
