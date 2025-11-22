import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { SwitchCamera } from 'lucide-react';

const CameraCanvas = ({ mode, onProcessFrame }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('user'); // 'user' = 内カメ, 'environment' = 外カメ
    const requestRef = useRef();

    useEffect(() => {
        const setupCamera = async () => {
            try {
                // 既存のストリームを停止
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }

                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: facingMode
                    },
                    audio: false,
                });
                setStream(newStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        // Start processing loop once video is ready
                        requestRef.current = requestAnimationFrame(processFrame);
                    };
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };

        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cancelAnimationFrame(requestRef.current);
        };
    }, [facingMode]); // facingModeが変わったら再セットアップ

    const processFrame = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (video.readyState === 4) {
                // Set canvas dimensions to match video (only if changed)
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                // Draw current video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Call the processing function if provided
                // Test drawing to verify canvas
                ctx.fillStyle = 'red';
                ctx.fillRect(10, 10, 50, 50);
                // End test drawing
                if (onProcessFrame) {
                    onProcessFrame(video, canvas, ctx);
                }
            }
        }
        requestRef.current = requestAnimationFrame(processFrame);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="relative w-full mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-xl" style={{ maxHeight: '70vh' }}>
            <video
                ref={videoRef}
                className="hidden" // Hide the raw video element
                width="640"
                height="480"
                playsInline
                muted
            />
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
            />
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    Loading Camera...
                </div>
            )}

            {/* カメラ切り替えボタン */}
            <button
                onClick={toggleCamera}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700/80 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                aria-label="カメラ切り替え"
            >
                <SwitchCamera size={24} />
            </button>
        </div>
    );
};

export default CameraCanvas;
