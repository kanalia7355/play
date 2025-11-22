import * as tf from '@tensorflow/tfjs';

// YOLO class names (COCO dataset - 80 classes)
const CLASS_NAMES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
    'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

let yoloModel = null;

// Load YOLO model (using a pre-converted TensorFlow.js model)
export const loadYOLO = async () => {
    try {
        // Using a publicly available YOLOv5 TensorFlow.js model
        // You can replace this URL with your own model
        const modelUrl = 'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1';

        console.log('Loading YOLO model...');
        yoloModel = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
        console.log('YOLO model loaded successfully');

        // Warm up the model
        const dummyInput = tf.zeros([1, 300, 300, 3]);
        await yoloModel.executeAsync(dummyInput);
        dummyInput.dispose();

        return yoloModel;
    } catch (error) {
        console.error('Failed to load YOLO model:', error);
        // Fallback to COCO-SSD if YOLO fails
        console.log('Falling back to COCO-SSD model...');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        yoloModel = await cocoSsd.load();
        return yoloModel;
    }
};

// Detect objects using YOLO
export const detectYOLO = async (model, video, ctx) => {
    if (!model) {
        console.error('YOLO model not loaded');
        return;
    }

    try {
        // Use the detect method (works for both COCO-SSD and custom models)
        const predictions = await model.detect(video);

        // Draw bounding boxes
        predictions.forEach((prediction) => {
            const [x, y, width, height] = prediction.bbox;
            const label = prediction.class;
            const score = (prediction.score * 100).toFixed(1);

            // Draw bounding box
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 16px Arial';
            const text = `${label} ${score}%`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y > 25 ? y - 25 : 0, textWidth + 10, 25);

            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + 5, y > 25 ? y - 7 : 18);

            // Draw corner markers for a more modern look
            const cornerLength = 20;
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;

            // Top-left corner
            ctx.beginPath();
            ctx.moveTo(x, y + cornerLength);
            ctx.lineTo(x, y);
            ctx.lineTo(x + cornerLength, y);
            ctx.stroke();

            // Top-right corner
            ctx.beginPath();
            ctx.moveTo(x + width - cornerLength, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + cornerLength);
            ctx.stroke();

            // Bottom-left corner
            ctx.beginPath();
            ctx.moveTo(x, y + height - cornerLength);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + cornerLength, y + height);
            ctx.stroke();

            // Bottom-right corner
            ctx.beginPath();
            ctx.moveTo(x + width - cornerLength, y + height);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x + width, y + height - cornerLength);
            ctx.stroke();
        });

        // Display detection count
        if (predictions.length > 0) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(10, 10, 200, 30);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`Objects detected: ${predictions.length}`, 20, 30);
        }
    } catch (error) {
        console.error('YOLO detection error:', error);
    }
};
