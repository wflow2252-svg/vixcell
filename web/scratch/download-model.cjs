const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_DIR = path.join(__dirname, '..', 'public', 'models', 'onnx-community', 'Qwen2.5-0.5B-Instruct');
const ONNX_DIR = path.join(MODEL_DIR, 'onnx');

const FILES_TO_DOWNLOAD = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'vocab.json',
  'merges.txt',
  'special_tokens_map.json',
  'onnx/model_quantized.onnx'
];

const BASE_URL = 'https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct/resolve/main/';

// Ensure directories exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}
if (!fs.existsSync(ONNX_DIR)) {
  fs.mkdirSync(ONNX_DIR, { recursive: true });
}

function downloadFile(file) {
  return new Promise((resolve, reject) => {
    const fileUrl = `${BASE_URL}${file}`;
    const destPath = path.join(MODEL_DIR, file);

    console.log(`Starting download: ${fileUrl} -> ${destPath}`);

    const fileStream = fs.createWriteStream(destPath);

    function getRequest(url) {
      https.get(url, (response) => {
        // Handle redirects
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          let redirectUrl = response.headers.location;
          if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
            redirectUrl = new URL(redirectUrl, 'https://huggingface.co').href;
          }
          console.log(`Redirecting for ${file} to ${redirectUrl}`);
          getRequest(redirectUrl);
        } else {
          pipeResponse(response, fileStream, file, resolve, reject);
        }
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    getRequest(fileUrl);
  });
}

function pipeResponse(response, fileStream, file, resolve, reject) {
  if (response.statusCode !== 200) {
    fs.unlink(fileStream.path, () => {});
    reject(new Error(`Failed to download ${file}: HTTP status ${response.statusCode}`));
    return;
  }

  const totalBytes = parseInt(response.headers['content-length'], 10);
  let downloadedBytes = 0;
  let lastProgress = 0;

  response.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    
    // Log progress every 10%
    if (totalBytes) {
      const percentage = Math.round((downloadedBytes / totalBytes) * 100);
      if (percentage - lastProgress >= 10) {
        console.log(`${file}: ${percentage}% downloaded (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
        lastProgress = percentage;
      }
    }
  });

  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`✓ Completed: ${file}`);
    resolve();
  });

  fileStream.on('error', (err) => {
    fs.unlink(fileStream.path, () => {});
    reject(err);
  });
}

async function start() {
  console.log('Starting downloading of Qwen2.5 0.5B ONNX model for 100% offline local-first bundle...');
  for (const file of FILES_TO_DOWNLOAD) {
    try {
      await downloadFile(file);
    } catch (err) {
      console.error(`Error downloading ${file}:`, err.message);
      process.exit(1);
    }
  }
  console.log('🎉 All model files downloaded successfully in web/public/models/!');
}

start();
