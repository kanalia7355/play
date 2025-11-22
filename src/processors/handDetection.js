import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let handLandmarker = null;

// Load MediaPipe Hands model
export const loadHandDetection = async () => {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        console.log('MediaPipe Hands loaded successfully');
        return handLandmarker;
    } catch (error) {
        console.error('Failed to load MediaPipe Hands:', error);
        throw error;
    }
};

// Hand landmark connections for drawing skeleton
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],        // Index finger
    [0, 9], [9, 10], [10, 11], [11, 12],   // Middle finger
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17]              // Palm
];

// Detect hands and draw landmarks
export const detectHands = async (model, video, ctx) => {
    if (!model) {
        console.error('Hand detection model not loaded');
        return;
    }

    try {
        const startTimeMs = performance.now();
        const results = await model.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
            // Draw each detected hand
            results.landmarks.forEach((landmarks, handIndex) => {
                const handedness = results.handednesses[handIndex]?.[0];
                const isRightHand = handedness?.categoryName === 'Right';

                // Choose color based on left/right hand
                const landmarkColor = isRightHand ? '#00FF00' : '#FF00FF';
                const connectionColor = isRightHand ? '#00CC00' : '#CC00CC';

                // Draw connections (skeleton)
                ctx.strokeStyle = connectionColor;
                ctx.lineWidth = 2;
                HAND_CONNECTIONS.forEach(([start, end]) => {
                    const startPoint = landmarks[start];
                    const endPoint = landmarks[end];

                    ctx.beginPath();
                    ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
                    ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
                    ctx.stroke();
                });

                // Draw landmarks (points)
                ctx.fillStyle = landmarkColor;
                landmarks.forEach((landmark, index) => {
                    const x = landmark.x * ctx.canvas.width;
                    const y = landmark.y * ctx.canvas.height;

                    // Draw larger circle for wrist (index 0)
                    const radius = index === 0 ? 8 : 5;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.fill();

                    // Draw white border
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });

                // Draw hand label
                if (handedness) {
                    const wrist = landmarks[0];
                    const x = wrist.x * ctx.canvas.width;
                    const y = wrist.y * ctx.canvas.height;

                    ctx.fillStyle = landmarkColor;
                    ctx.font = 'bold 16px Arial';
                    const label = `${handedness.categoryName} Hand`;
                    const textWidth = ctx.measureText(label).width;

                    // Draw background
                    ctx.fillRect(x - textWidth / 2 - 5, y - 30, textWidth + 10, 20);

                    // Draw text
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(label, x - textWidth / 2, y - 15);
                }
            });
        }
    } catch (error) {
        console.error('Hand detection error:', error);
    }
};
