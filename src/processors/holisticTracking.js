import { Holistic, POSE_CONNECTIONS, HAND_CONNECTIONS, FACEMESH_TESSELATION } from '@mediapipe/holistic';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

let holistic = null;

export const loadHolistic = async () => {
    console.log("Loading MediaPipe Holistic...");

    holistic = new Holistic({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
    });

    holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    await holistic.initialize();
    console.log("MediaPipe Holistic loaded successfully");

    return holistic;
};

export const detectHolistic = async (holisticModel, video, ctx) => {
    if (!holisticModel || !video || !ctx) {
        console.error("Missing required parameters for holistic detection");
        return;
    }

    try {
        // Process the video frame
        await holisticModel.send({ image: video });

        // Get results via callback
        holisticModel.onResults((results) => {
            // Clear canvas
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Draw the video frame
            ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);

            // Draw pose landmarks (body)
            if (results.poseLandmarks) {
                drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                    color: '#00FF00',
                    lineWidth: 4
                });
                drawLandmarks(ctx, results.poseLandmarks, {
                    color: '#FF0000',
                    lineWidth: 2,
                    radius: 6
                });
            }

            // Draw face mesh
            if (results.faceLandmarks) {
                drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
                    color: '#C0C0C070',
                    lineWidth: 1
                });
                drawLandmarks(ctx, results.faceLandmarks, {
                    color: '#00FFFF',
                    lineWidth: 1,
                    radius: 1
                });
            }

            // Draw left hand
            if (results.leftHandLandmarks) {
                drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
                    color: '#CC0000',
                    lineWidth: 5
                });
                drawLandmarks(ctx, results.leftHandLandmarks, {
                    color: '#00FF00',
                    lineWidth: 2,
                    radius: 5
                });
            }

            // Draw right hand
            if (results.rightHandLandmarks) {
                drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
                    color: '#00CC00',
                    lineWidth: 5
                });
                drawLandmarks(ctx, results.rightHandLandmarks, {
                    color: '#FF0000',
                    lineWidth: 2,
                    radius: 5
                });
            }

            // Display info
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 300, 120);
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('Holistic Tracking', 20, 35);
            ctx.font = '14px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`Pose: ${results.poseLandmarks ? '✓ Detected' : '✗ Not detected'}`, 20, 60);
            ctx.fillText(`Face: ${results.faceLandmarks ? '✓ Detected' : '✗ Not detected'}`, 20, 80);
            ctx.fillText(`Left Hand: ${results.leftHandLandmarks ? '✓ Detected' : '✗ Not detected'}`, 20, 100);
            ctx.fillText(`Right Hand: ${results.rightHandLandmarks ? '✓ Detected' : '✗ Not detected'}`, 20, 120);
        });
    } catch (error) {
        console.error("Holistic detection error:", error);
    }
};
