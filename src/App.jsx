import React, { useState, useEffect } from 'react';
import CameraCanvas from './components/CameraCanvas';
import { Camera, Scan, Hand, Smile, Palette, Sparkles, User } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';

// Import processors
import { loadYOLO, detectYOLO } from './processors/yoloDetection';
import { loadHandDetection, detectHands } from './processors/handDetection';
import { loadFaceMesh, detectFaceMesh } from './processors/faceMesh';
import { loadHolistic, detectHolistic } from './processors/holisticTracking';
import { processColormap } from './processors/colormap';
import { analyzeImage } from './processors/geminiVision';

// AI Vision Lab - Updated version
function App() {
  const [mode, setMode] = useState('none'); // none, yolo, hands, face, holistic, colormap, gemini
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load models when mode changes
  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      setModel(null);
      try {
        await tf.ready();
        if (mode === 'yolo') {
          const loadedModel = await loadYOLO();
          setModel(loadedModel);
        } else if (mode === 'hands') {
          const loadedModel = await loadHandDetection();
          setModel(loadedModel);
        } else if (mode === 'face') {
          const loadedModel = await loadFaceMesh();
          setModel(loadedModel);
        } else if (mode === 'holistic') {
          const loadedModel = await loadHolistic();
          setModel(loadedModel);
        }
      } catch (err) {
        console.error("Failed to load model:", err);
      }
      setIsLoading(false);
    };

    if (mode !== 'none' && mode !== 'colormap' && mode !== 'gemini') {
      loadModel();
    } else {
      setModel(null);
    }
  }, [mode]);

  // Use refs to store latest values for frame processing
  const modeRef = React.useRef(mode);
  const modelRef = React.useRef(model);
  const isLoadingRef = React.useRef(isLoading);

  React.useEffect(() => {
    modeRef.current = mode;
    modelRef.current = model;
    isLoadingRef.current = isLoading;
  }, [mode, model, isLoading]);

  const handleProcessFrame = async (video, canvas, ctx) => {
    const currentMode = modeRef.current;
    const currentModel = modelRef.current;
    const currentIsLoading = isLoadingRef.current;

    console.log('Frame:', { mode: currentMode, hasModel: !!currentModel, modelType: currentModel?.constructor?.name, isLoading: currentIsLoading });

    if (currentIsLoading) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Loading Model...', 20, 40);
      return;
    }

    if (currentMode === 'yolo' && currentModel && typeof currentModel.detect === 'function') {
      await detectYOLO(currentModel, video, ctx);
    } else if (currentMode === 'hands' && currentModel && typeof currentModel.detectForVideo === 'function') {
      await detectHands(currentModel, video, ctx);
    } else if (currentMode === 'face' && currentModel && typeof currentModel.detectForVideo === 'function') {
      await detectFaceMesh(currentModel, video, ctx);
    } else if (currentMode === 'holistic' && currentModel) {
      await detectHolistic(currentModel, video, ctx);
    } else if (currentMode === 'colormap') {
      processColormap(canvas, ctx);
    }
    // Gemini mode doesn't process every frame automatically
  };

  const handleGeminiAnalysis = async () => {
    setIsAnalyzing(true);
    setGeminiResult("Analyzing...");

    try {
      const canvas = document.querySelector('canvas');
      const video = document.querySelector('video');

      if (canvas && video) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const result = await analyzeImage(video, canvas, ctx, 'analysis');
        setGeminiResult(result.text || "No description available.");
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setGeminiResult("Error: " + error.message);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      <header className="mb-4 md:mb-8 text-center">
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
          AI Vision Lab
        </h1>
        <p className="text-sm md:text-base text-gray-400">Real-time Browser Computer Vision</p>
      </header>

      <main className="flex flex-col items-center gap-4 md:gap-8">
        <div className="relative w-full flex justify-center">
          <CameraCanvas mode={mode} onProcessFrame={handleProcessFrame} />

          {mode === 'gemini' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleGeminiAnalysis}
                disabled={isAnalyzing}
                className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-full font-bold shadow-lg transition-all ${isAnalyzing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:scale-105'
                  }`}
              >
                {isAnalyzing ? 'Processing...' : 'Analyze Frame'}
              </button>
            </div>
          )}
        </div>

        {mode === 'gemini' && geminiResult && (
          <div className="w-full bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800 shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-pink-400">Gemini Analysis</h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap">{geminiResult}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
          <ModeButton
            active={mode === 'none'}
            onClick={() => setMode('none')}
            icon={<Camera />}
            label="Normal"
          />
          <ModeButton
            active={mode === 'yolo'}
            onClick={() => setMode('yolo')}
            icon={<Scan />}
            label="YOLO Detection"
          />
          <ModeButton
            active={mode === 'hands'}
            onClick={() => setMode('hands')}
            icon={<Hand />}
            label="Hand Tracking"
          />
          <ModeButton
            active={mode === 'face'}
            onClick={() => setMode('face')}
            icon={<Smile />}
            label="Face Mesh"
          />
          <ModeButton
            active={mode === 'holistic'}
            onClick={() => setMode('holistic')}
            icon={<User />}
            label="Holistic Tracking"
          />
          <ModeButton
            active={mode === 'colormap'}
            onClick={() => setMode('colormap')}
            icon={<Palette />}
            label="Colormap"
          />
          <ModeButton
            active={mode === 'gemini'}
            onClick={() => setMode('gemini')}
            icon={<Sparkles />}
            label="Gemini Vision"
          />
        </div>
      </main>
    </div>
  );
}

const ModeButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full transition-all duration-300 ${active
      ? 'bg-blue-600 shadow-lg shadow-blue-500/30 scale-105'
      : 'bg-gray-800 hover:bg-gray-700'
      }`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="text-sm md:text-base">{label}</span>
  </button>
);

export default App;
