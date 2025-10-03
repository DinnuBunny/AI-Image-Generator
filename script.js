// --- IMPORTANT: PASTE YOUR API KEY HERE ---
// This key will be used for all API calls (Image Gen, Improve, Surprise Me, Image-to-Prompt)
const API_KEY = "AIzaSyCHb4vCqbJXKmtZ7JQ3yjCfUHOgX1MDBL4";

// --- UI Elements ---
const settingsFieldset = document.getElementById("settingsFieldset");
const promptTextarea = document.getElementById("prompt");
const watermarkNameInput = document.getElementById("watermarkName");
const watermarkToggle = document.getElementById("watermarkToggle");
const autoDownloadToggle = document.getElementById("autoDownloadToggle");
const clearPromptBtn = document.getElementById("clearPromptBtn");
const errorMessage = document.getElementById("errorMessage");
const mainLoader = document.getElementById("mainLoader");

// --- Page Switching ---
const createTabBtn = document.getElementById("createTabBtn");
const imageToPromptTabBtn = document.getElementById("imageToPromptTabBtn");
const createPage = document.getElementById("createPage");
const imageToPromptPage = document.getElementById("imageToPromptPage");

// --- Create Page Elements ---
const generateBtn = document.getElementById("generateBtn");
const generateBtnContent = document.getElementById("generateBtnContent");
const resultsGrid = document.getElementById("resultsGrid");
const imageUpload = document.getElementById("imageUpload");
const referenceImageContainer = document.getElementById(
  "referenceImageContainer"
);
const referenceImage = document.getElementById("referenceImage");
const fileNameSpan = document.getElementById("fileName");
const cancelImageBtn = document.getElementById("cancelImageBtn");
const imageCountDisplay = document.getElementById("imageCountDisplay");
const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const loopCountDisplay = document.getElementById("loopCountDisplay");
const loopMinusBtn = document.getElementById("loopMinusBtn");
const loopPlusBtn = document.getElementById("loopPlusBtn");
const loopStatus = document.getElementById("loopStatus");
const historyBtn = document.getElementById("historyBtn");
const improveBtn = document.getElementById("improveBtn");
const surpriseBtn = document.getElementById("surpriseBtn");

// --- Image to Prompt Page Elements ---
const i2pUploadInput = document.getElementById("i2pUploadInput");
const i2pPreview = document.getElementById("i2pPreview");
const i2pUploadPlaceholder = document.getElementById("i2pUploadPlaceholder");
const i2pGenerateBtn = document.getElementById("i2pGenerateBtn");
const i2pResultContainer = document.getElementById("i2pResultContainer");
const i2pResultText = document.getElementById("i2pResultText");
const i2pCopyBtn = document.getElementById("i2pCopyBtn");
const i2pAdditionalText = document.getElementById("i2pAdditionalText");
const i2pCustomStyle = document.getElementById("i2pCustomStyle");
let i2pImageData = null;

// --- History Modal Elements ---
const historyModal = document.getElementById("historyModal");
const closeHistoryModalBtn = document.getElementById("closeHistoryModalBtn");
const historyTabBtn = document.getElementById("historyTabBtn");
const favoritesTabBtn = document.getElementById("favoritesTabBtn");
const historyContent = document.getElementById("historyContent");
const favoritesContent = document.getElementById("favoritesContent");

// --- State variables ---
let referenceImageData = null;
let currentImageCount = 1;
let currentLoopCount = 1;
let isLooping = false;
const MAX_IMAGES = 4;
let promptHistory = [];
let promptFavorites = [];

// --- Initialization ---
function initializeApp() {
  watermarkNameInput.value = "DinnuPixel";
  loadFromLocalStorage();
  renderHistory();
  renderFavorites();
  setupEventListeners();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  clearPromptBtn.addEventListener("click", () => {
    promptTextarea.value = "";
  });
  plusBtn.addEventListener("click", () => {
    if (currentImageCount < MAX_IMAGES)
      imageCountDisplay.textContent = ++currentImageCount;
  });
  minusBtn.addEventListener("click", () => {
    if (currentImageCount > 1)
      imageCountDisplay.textContent = --currentImageCount;
  });
  loopPlusBtn.addEventListener("click", () => {
    loopCountDisplay.textContent = ++currentLoopCount;
  });
  loopMinusBtn.addEventListener("click", () => {
    if (currentLoopCount > 1) loopCountDisplay.textContent = --currentLoopCount;
  });

  // Page switching
  createTabBtn.addEventListener("click", () => switchTab("create"));
  imageToPromptTabBtn.addEventListener("click", () => switchTab("i2p"));

  // History Modal
  historyBtn.addEventListener("click", () => {
    historyModal.style.display = "flex";
  });
  closeHistoryModalBtn.addEventListener("click", () => {
    historyModal.style.display = "none";
  });
  historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) historyModal.style.display = "none";
  });
  historyTabBtn.addEventListener("click", () => switchHistoryTab("history"));
  favoritesTabBtn.addEventListener("click", () =>
    switchHistoryTab("favorites")
  );

  // Image Upload (Create Page)
  imageUpload.addEventListener("change", handleReferenceImageUpload);
  cancelImageBtn.addEventListener("click", removeReferenceImage);

  // Image Upload (Image to Prompt Page)
  i2pUploadInput.addEventListener("change", handleI2PImageUpload);
  i2pGenerateBtn.addEventListener("click", handleI2PGenerate);
  i2pCopyBtn.addEventListener("click", copyI2PResult);
  i2pCustomStyle.addEventListener("focus", () => {
    document.querySelector(
      'input[name="i2pStyle"][value="custom"]'
    ).checked = true;
  });

  // LLM Buttons
  improveBtn.addEventListener("click", improvePrompt);
  surpriseBtn.addEventListener("click", surpriseMe);

  // Generate Button
  generateBtn.addEventListener("click", () => {
    if (isLooping) {
      isLooping = false;
    } else {
      startGenerationLoop().catch((err) => {
        console.error("Caught unhandled error in event listener:", err);
        errorMessage.textContent = "An unexpected error occurred.";
        errorMessage.style.display = "block";
        isLooping = false;
        setUiState(false);
      });
    }
  });
}

// --- HELPER FUNCTION ---
function toggleButtonLoading(button, isLoading) {
  const text = button.querySelector(".btn-text");
  const loader = button.querySelector(".loader");
  if (isLoading) {
    text.style.display = "none";
    loader.style.display = "inline-block";
    button.disabled = true;
  } else {
    text.style.display = "inline-block";
    loader.style.display = "none";
    button.disabled = false;
  }
}

// --- TAB SWITCHING LOGIC ---
function switchTab(tab) {
  errorMessage.style.display = "none";
  if (tab === "create") {
    createPage.style.display = "block";
    imageToPromptPage.style.display = "none";
    createTabBtn.classList.add("border-blue-500", "text-white");
    createTabBtn.classList.remove("border-transparent", "text-gray-400");
    imageToPromptTabBtn.classList.add("border-transparent", "text-gray-400");
    imageToPromptTabBtn.classList.remove("border-blue-500", "text-white");
  } else {
    createPage.style.display = "none";
    imageToPromptPage.style.display = "block";
    imageToPromptTabBtn.classList.add("border-blue-500", "text-white");
    imageToPromptTabBtn.classList.remove("border-transparent", "text-gray-400");
    createTabBtn.classList.add("border-transparent", "text-gray-400");
    createTabBtn.classList.remove("border-blue-500", "text-white");
  }
}

// --- IMAGE-TO-PROMPT LOGIC ---
function handleI2PImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    i2pImageData = { mimeType: file.type, data: e.target.result.split(",")[1] };
    i2pPreview.src = e.target.result;
    i2pPreview.style.display = "block";
    i2pUploadPlaceholder.style.display = "none";
    i2pGenerateBtn.disabled = false;
    i2pGenerateBtn.classList.remove("opacity-50");
    i2pResultContainer.style.display = "none";
  };
  reader.readAsDataURL(file);
}

async function handleI2PGenerate() {
  if (!i2pImageData) return;
  toggleButtonLoading(i2pGenerateBtn, true);

  const additionalText = i2pAdditionalText.value.trim();
  let style = document.querySelector('input[name="i2pStyle"]:checked').value;
  if (style === "custom") {
    style = i2pCustomStyle.value.trim();
  }

  let userPrompt =
    "Describe this image in detail for an AI image generator. Focus on the subject, style, composition, colors, and lighting. Craft a concise, single-paragraph prompt, around 4-5 lines long.";
  if (style) {
    userPrompt += ` Infuse the description with a '${style}' artistic style.`;
  }
  if (additionalText) {
    userPrompt += ` Also, incorporate these modifications: '${additionalText}'.`;
  }

  const generatedPrompt = await callGeminiVisionAPI(userPrompt, i2pImageData);

  if (generatedPrompt) {
    i2pResultText.value = generatedPrompt.trim();
    i2pResultContainer.style.display = "block";
  }
  toggleButtonLoading(i2pGenerateBtn, false);
}

function copyI2PResult() {
  i2pResultText.select();
  document.execCommand("copy");
}

// --- Local Storage & History/Favorites ---
function saveToLocalStorage() {
  localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
  localStorage.setItem("promptFavorites", JSON.stringify(promptFavorites));
}
function loadFromLocalStorage() {
  promptHistory = JSON.parse(localStorage.getItem("promptHistory")) || [];
  promptFavorites = JSON.parse(localStorage.getItem("promptFavorites")) || [];
}
function renderHistory() {
  historyContent.innerHTML = "";
  if (promptHistory.length === 0) {
    historyContent.innerHTML =
      '<p class="text-gray-400">No recent prompts.</p>';
    return;
  }
  promptHistory.forEach((prompt) =>
    historyContent.appendChild(createPromptItem(prompt))
  );
}
function renderFavorites() {
  favoritesContent.innerHTML = "";
  if (promptFavorites.length === 0) {
    favoritesContent.innerHTML =
      '<p class="text-gray-400">No favorite prompts yet.</p>';
    return;
  }
  promptFavorites.forEach((prompt) =>
    favoritesContent.appendChild(createPromptItem(prompt))
  );
}
function createPromptItem(prompt) {
  const item = document.createElement("div");
  item.className =
    "bg-gray-700 p-3 rounded-lg mb-2 flex items-center justify-between";
  const text = document.createElement("p");
  text.textContent = prompt;
  text.className = "text-sm text-gray-300 flex-1 mr-4 truncate";
  const actions = document.createElement("div");
  actions.className = "flex items-center space-x-2";

  const useBtn = document.createElement("button");
  useBtn.textContent = "Use";
  useBtn.className =
    "text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded-md";
  useBtn.onclick = () => {
    promptTextarea.value = prompt;
    historyModal.style.display = "none";
  };

  const favBtn = document.createElement("button");
  favBtn.className = "p-1 favorite-btn";
  const isFav = promptFavorites.includes(prompt);
  if (isFav) favBtn.classList.add("favorited");
  favBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  favBtn.onclick = () => {
    toggleFavorite(prompt);
    favBtn.classList.toggle("favorited");
    renderHistory();
    renderFavorites();
  };

  actions.appendChild(useBtn);
  actions.appendChild(favBtn);
  item.appendChild(text);
  item.appendChild(actions);
  return item;
}

function addPromptToHistory(prompt) {
  const index = promptHistory.indexOf(prompt);
  if (index > -1) promptHistory.splice(index, 1);
  promptHistory.unshift(prompt);
  if (promptHistory.length > 20) promptHistory.pop();
  saveToLocalStorage();
  renderHistory();
}

function toggleFavorite(prompt) {
  const index = promptFavorites.indexOf(prompt);
  if (index > -1) {
    promptFavorites.splice(index, 1);
  } else {
    promptFavorites.unshift(prompt);
  }
  saveToLocalStorage();
}

function removeReferenceImage() {
  imageUpload.value = null;
  referenceImageData = null;
  referenceImage.src = "";
  referenceImageContainer.style.display = "none";
  fileNameSpan.textContent = "No file chosen";
  cancelImageBtn.style.display = "none";
}

function handleReferenceImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    referenceImageData = {
      mimeType: file.type,
      data: e.target.result.split(",")[1],
    };
    referenceImage.src = e.target.result;
    referenceImageContainer.style.display = "block";
    fileNameSpan.textContent = file.name;
    cancelImageBtn.style.display = "inline-block";
  };
  reader.readAsDataURL(file);
}

function switchHistoryTab(tab) {
  if (tab === "history") {
    historyContent.style.display = "block";
    favoritesContent.style.display = "none";
    historyTabBtn.classList.add("bg-blue-600", "text-white");
    historyTabBtn.classList.remove("bg-gray-700", "text-gray-300");
    favoritesTabBtn.classList.add("bg-gray-700", "text-gray-300");
    favoritesTabBtn.classList.remove("bg-blue-600", "text-white");
  } else {
    favoritesContent.style.display = "block";
    historyContent.style.display = "none";
    favoritesTabBtn.classList.add("bg-blue-600", "text-white");
    favoritesTabBtn.classList.remove("bg-gray-700", "text-gray-300");
    historyTabBtn.classList.add("bg-gray-700", "text-gray-300");
    historyTabBtn.classList.remove("bg-blue-600", "text-white");
  }
}

// --- LLM Logic ---
async function improvePrompt() {
  const currentPrompt = promptTextarea.value.trim();
  if (!currentPrompt) {
    errorMessage.textContent = "Please enter a prompt to improve.";
    errorMessage.style.display = "block";
    return;
  }
  toggleButtonLoading(improveBtn, true);
  const systemInstruction = `You are an expert prompt engineer. Take the user's idea and expand it into a rich, detailed, and visually descriptive prompt for an AI image generator. Focus on composition, lighting, style, and mood.`;
  const userQuery = `The idea is: "${currentPrompt}"`;
  const improvedPrompt = await callGeminiTextAPI(userQuery, systemInstruction);
  if (improvedPrompt) {
    promptTextarea.value = improvedPrompt.trim();
  }
  toggleButtonLoading(improveBtn, false);
}

async function surpriseMe() {
  toggleButtonLoading(surpriseBtn, true);
  const userQuery =
    "Generate a single, random, creative, and visually detailed prompt for an advanced AI image generator. The prompt should describe a unique scene, character, or concept.";
  const randomPrompt = await callGeminiTextAPI(userQuery);
  if (randomPrompt) {
    promptTextarea.value = randomPrompt.trim();
  }
  toggleButtonLoading(surpriseBtn, false);
}

// --- Main Generation Logic ---
function setUiState(isGenerating) {
  settingsFieldset.disabled = isGenerating;
  if (isGenerating) {
    generateBtn.classList.remove("bg-blue-600");
    generateBtn.classList.add("bg-red-600");
    generateBtnContent.innerHTML = "Stop";
    mainLoader.style.display = "flex";
  } else {
    generateBtn.classList.add("bg-blue-600");
    generateBtn.classList.remove("bg-red-600");
    generateBtnContent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2 inline-block"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg> Generate Image`;
    mainLoader.style.display = "none";
    loopStatus.style.display = "none";
  }
}

async function startGenerationLoop() {
  isLooping = true;
  if (currentLoopCount > 1) {
    setUiState(true);
  } else {
    generateBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    generateBtn.classList.add("bg-red-600", "hover:bg-red-700");
    generateBtnContent.innerHTML = "Stop";
    mainLoader.style.display = "flex";
  }

  const mainPrompt = promptTextarea.value.trim();
  if (!mainPrompt) {
    errorMessage.textContent = "Please enter a prompt.";
    errorMessage.style.display = "block";
    isLooping = false;
    setUiState(false);
    return;
  }
  addPromptToHistory(mainPrompt);
  resultsGrid.innerHTML = "";
  errorMessage.style.display = "none";

  for (let i = 1; i <= currentLoopCount; i++) {
    if (!isLooping) {
      loopStatus.textContent = "Loop stopped by user.";
      break;
    }
    loopStatus.style.display = "block";
    loopStatus.textContent = `Running Cycle ${i} of ${currentLoopCount}...`;

    try {
      const results = await generateImages(mainPrompt);
      if (results && results.length > 0) {
        results.forEach((base64Data) => {
          if (base64Data) {
            const imageUrl = `data:image/png;base64,${base64Data}`;
            createImageCard(imageUrl);
            if (autoDownloadToggle.checked) {
              triggerDownload(imageUrl);
            }
          }
        });
      } else {
        throw new Error("Image generation failed in this cycle.");
      }
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = "block";
      break;
    }
  }
  if (isLooping) loopStatus.textContent = "Loop finished.";
  isLooping = false;
  setUiState(false);
}

function triggerDownload(imageUrl) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `generated-image-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function createImageCard(imageUrl) {
  const card = document.createElement("div");
  card.className = "bg-gray-700 rounded-lg p-2 text-center";
  const img = document.createElement("img");
  img.src = imageUrl;
  img.className = "w-full h-auto rounded-md object-contain";
  const downloadBtn = document.createElement("button");
  downloadBtn.innerHTML = `Download`;
  downloadBtn.className =
    "mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full";
  downloadBtn.addEventListener("click", () => triggerDownload(imageUrl));
  card.appendChild(img);
  card.appendChild(downloadBtn);
  resultsGrid.appendChild(card);
}

// --- API Call Logic ---
async function callGeminiTextAPI(userPrompt, systemInstruction = "") {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
  };
  if (systemInstruction)
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  return makeApiCall(apiUrl, payload, "text");
}

async function callGeminiVisionAPI(prompt, imageData) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: { mimeType: imageData.mimeType, data: imageData.data },
          },
        ],
      },
    ],
  };
  return makeApiCall(apiUrl, payload, "vision");
}

async function generateImages(prompt) {
  const aspectRatio = document.querySelector(
    'input[name="aspectRatio"]:checked'
  ).value;
  let combinedPrompt = prompt;
  if (watermarkToggle.checked) {
    const watermarkName = watermarkNameInput.value.trim();
    if (watermarkName) {
      combinedPrompt = `${prompt} and a small elegant text watermark reading "${watermarkName}" placed in the bottom right corner, subtle, semi-transparent, blending harmoniously with the background.`;
    }
  }

  if (referenceImageData) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${API_KEY}`;
    const promises = Array.from({ length: currentImageCount }, () => {
      const payload = {
        contents: [
          {
            parts: [
              { text: combinedPrompt },
              {
                inlineData: {
                  mimeType: referenceImageData.mimeType,
                  data: referenceImageData.data,
                },
              },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      };
      return makeApiCall(apiUrl, payload, "gemini-2.0");
    });
    return Promise.all(promises);
  }

  // Smart Fallback Logic
  try {
    loopStatus.textContent += " (Using Gemini 2.5 Flash)";
    const flashApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
    const flashPayload = {
      contents: [{ parts: [{ text: combinedPrompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        candidateCount: currentImageCount,
      },
    };
    const flashResults = await makeApiCall(
      flashApiUrl,
      flashPayload,
      "gemini-2.5"
    );
    if (
      !flashResults ||
      flashResults.length === 0 ||
      flashResults.some((r) => !r)
    ) {
      throw new Error("Gemini 2.5 Flash returned no valid images.");
    }
    return flashResults;
  } catch (error) {
    console.warn(
      "Gemini 2.5 Flash failed:",
      error.message,
      ". Falling back to Imagen 3.0."
    );
    loopStatus.textContent += " (Fallback to Imagen 3.0)";
    const imagenApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;
    const imagenPayload = {
      instances: [{ prompt: combinedPrompt }],
      parameters: {
        sampleCount: currentImageCount,
        aspectRatio: aspectRatio,
      },
    };
    return makeApiCall(imagenApiUrl, imagenPayload, "imagen-3.0");
  }
}

async function makeApiCall(apiUrl, payload, modelType) {
  let delay = 1000;
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const result = await response.json();
        switch (modelType) {
          case "text":
          case "vision":
            return result.candidates[0].content.parts[0].text;
          case "gemini-2.0":
            return result.candidates[0].content.parts.find((p) => p.inlineData)
              .inlineData.data;
          case "imagen-3.0":
            return result.predictions.map((p) => p.bytesBase64Encoded);
          case "gemini-2.5":
            return result.candidates.map(
              (c) => c.content.parts.find((p) => p.inlineData).inlineData.data
            );
        }
        throw new Error("Invalid model type specified.");
      } else if (response.status === 429 || response.status >= 500) {
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, (delay *= 2)));
        } else {
          throw new Error(`API is busy. Please try again later.`);
        }
      } else {
        const errorText = await response.text();
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, (delay *= 2)));
    }
  }
}

// --- Run on page load ---
initializeApp();
