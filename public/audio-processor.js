/**
 * AudioWorklet Processor for capturing microphone input
 * Runs off the main thread for better performance
 */

class AudioInputProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.shouldSend = true;

    // Listen for messages from the main thread
    this.port.onmessage = (event) => {
      if (event.data.type === "setShouldSend") {
        this.shouldSend = event.data.value;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // If we have input audio and should send it
    if (input && input.length > 0 && this.shouldSend) {
      const inputData = input[0]; // First channel

      if (inputData && inputData.length > 0) {
        // Copy the Float32Array data (required for cross-context messaging)
        const dataCopy = new Float32Array(inputData);

        // Send the audio data to the main thread
        // Note: We copy the data instead of transferring to avoid ownership issues
        this.port.postMessage({
          type: "audioData",
          data: dataCopy,
        });
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor("audio-input-processor", AudioInputProcessor);
