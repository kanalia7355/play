import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker = null;

// Load MediaPipe Face Mesh model
export const loadFaceMesh = async () => {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false
        });

        console.log('MediaPipe Face Mesh loaded successfully');
        return faceLandmarker;
    } catch (error) {
        console.error('Failed to load MediaPipe Face Mesh:', error);
        throw error;
    }
};

// Key face landmark indices for drawing
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

// Detect face and draw mesh
export const detectFaceMesh = async (model, video, ctx) => {
    if (!model) {
        console.error('Face mesh model not loaded');
        return;
    }

    try {
        const startTimeMs = performance.now();
        const results = await model.detectForVideo(video, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            results.faceLandmarks.forEach((landmarks) => {
                // Draw face oval
                drawPath(ctx, landmarks, FACE_OVAL, '#00FFFF', 2, true);

                // Draw eyes
                drawPath(ctx, landmarks, LEFT_EYE, '#FF00FF', 2, true);
                drawPath(ctx, landmarks, RIGHT_EYE, '#FF00FF', 2, true);

                // Draw eyebrows
                drawPath(ctx, landmarks, LEFT_EYEBROW, '#FFFF00', 2, false);
                drawPath(ctx, landmarks, RIGHT_EYEBROW, '#FFFF00', 2, false);

                // Draw lips
                drawPath(ctx, landmarks, LIPS_OUTER, '#FF0000', 2, true);

                // Draw all landmarks as small dots (optional, can be commented out for cleaner look)
                ctx.fillStyle = '#00FF00';
                landmarks.forEach((landmark) => {
                    const x = landmark.x * ctx.canvas.width;
                    const y = landmark.y * ctx.canvas.height;

                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, 2 * Math.PI);
                    ctx.fill();
                });
            });
        }
    } catch (error) {
        console.error('Face mesh detection error:', error);
    }
};

// Helper function to draw a path connecting landmarks
const drawPath = (ctx, landmarks, indices, color, lineWidth, closePath) => {
    if (indices.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    const firstPoint = landmarks[indices[0]];
    ctx.moveTo(firstPoint.x * ctx.canvas.width, firstPoint.y * ctx.canvas.height);

    for (let i = 1; i < indices.length; i++) {
        const point = landmarks[indices[i]];
        ctx.lineTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
    }

    if (closePath) {
        ctx.closePath();
    }

    ctx.stroke();
};
