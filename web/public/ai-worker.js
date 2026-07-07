// Web Worker for client-side local AI execution using Transformers.js (v3)
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1";

// Configure local models path served by the Vite dev server
env.localModelPath = '/models/';
env.allowLocalModels = true; // Allow checking local path first

let generator = null;
let currentModelId = null;

// Listen to requests from the React application
self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === "load") {
    const { modelId, device = "webgpu" } = data;
    try {
      self.postMessage({ type: "status", status: "loading", message: `Initializing model ${modelId} on ${device}...` });

      // If the model is already loaded, reuse it
      if (generator && currentModelId === modelId) {
        self.postMessage({ type: "status", status: "ready", message: "Model already loaded and ready!" });
        return;
      }

      // Dynamically toggle allowRemoteModels based on model choice
      if (modelId.includes("Qwen")) {
        env.allowRemoteModels = false;
        console.log("[AI Worker] Loading Qwen from local server, offline mode enabled.");
      } else {
        env.allowRemoteModels = true;
      }

      // Load model with progress callback
      generator = await pipeline("text-generation", modelId, {
        device: device,
        progress_callback: (progressData) => {
          if (progressData.status === "progress") {
            self.postMessage({
              type: "progress",
              data: {
                file: progressData.file,
                progress: progressData.progress,
                loaded: progressData.loaded,
                total: progressData.total,
              }
            });
          }
        }
      });

      currentModelId = modelId;
      self.postMessage({ type: "status", status: "ready", message: "Model loaded successfully!" });
    } catch (err) {
      console.error("[AI Worker] Load Error:", err);
      // Try falling back to WASM if WebGPU failed during initialization
      if (device === "webgpu") {
        self.postMessage({ type: "status", status: "fallback", message: "WebGPU init failed. Retrying with WebAssembly (WASM)..." });
        try {
          generator = await pipeline("text-generation", modelId, {
            device: "wasm",
            progress_callback: (progressData) => {
              if (progressData.status === "progress") {
                self.postMessage({
                  type: "progress",
                  data: {
                    file: progressData.file,
                    progress: progressData.progress,
                    loaded: progressData.loaded,
                    total: progressData.total,
                  }
                });
              }
            }
          });
          currentModelId = modelId;
          self.postMessage({ type: "status", status: "ready", message: "Model loaded successfully on WebAssembly!" });
        } catch (wasmErr) {
          self.postMessage({ type: "status", status: "error", message: `Failed to load model in WASM: ${wasmErr.message}` });
        }
      } else {
        self.postMessage({ type: "status", status: "error", message: `Failed to load model: ${err.message}` });
      }
    }
  }

  else if (type === "generate") {
    const { prompt, systemPrompt = "", maxTokens = 1500, temperature = 0.6 } = data;

    if (!generator) {
      self.postMessage({ type: "status", status: "error", message: "No model loaded. Please load a model first." });
      return;
    }

    try {
      self.postMessage({ type: "status", status: "generating", message: "Thinking..." });

      // Construct a structured prompt for conversational LLMs
      // Using instruction format templates (like Gemma/Qwen style)
      let formattedPrompt = "";
      if (currentModelId.includes("gemma")) {
        formattedPrompt = `<start_of_turn>user\n${systemPrompt ? systemPrompt + "\n\n" : ""}Prompt: ${prompt}\n<end_of_turn>\n<start_of_turn>model\n`;
      } else if (currentModelId.includes("Qwen") || currentModelId.includes("qwen")) {
        formattedPrompt = `<|im_start|>system\n${systemPrompt || "You are a web design assistant."}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
      } else {
        formattedPrompt = `${systemPrompt ? "System: " + systemPrompt + "\n\n" : ""}User: ${prompt}\nAssistant:`;
      }

      // Generate response and stream tokens
      const result = await generator(formattedPrompt, {
        max_new_tokens: maxTokens,
        temperature: temperature,
        do_sample: temperature > 0,
        top_k: 50,
        streamer: (text) => {
          self.postMessage({ type: "chunk", data: text });
        }
      });

      const fullOutput = result[0].generated_text;
      
      // Extract the newly generated part (removing the prompt prefix if present)
      let cleanOutput = fullOutput;
      if (fullOutput.startsWith(formattedPrompt)) {
        cleanOutput = fullOutput.substring(formattedPrompt.length);
      } else if (fullOutput.includes(prompt)) {
        // Fallback for general models
        const index = fullOutput.lastIndexOf(prompt) + prompt.length;
        cleanOutput = fullOutput.substring(index);
      }

      self.postMessage({ type: "done", data: cleanOutput });
    } catch (err) {
      console.error("[AI Worker] Generation Error:", err);
      self.postMessage({ type: "status", status: "error", message: `Generation error: ${err.message}` });
    }
  }

  else if (type === "check_webgpu") {
    const supported = typeof navigator !== "undefined" && !!navigator.gpu;
    self.postMessage({ type: "webgpu_status", data: { supported } });
  }
};
