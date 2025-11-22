export const processColormap = (canvas, ctx) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple grayscale
        const avg = (r + g + b) / 3;

        // Apply a heatmap-like effect
        // Map grayscale value to color
        // Low (dark) -> Blue
        // Mid -> Green
        // High (bright) -> Red

        if (avg < 128) {
            data[i] = 0; // R
            data[i + 1] = avg * 2; // G
            data[i + 2] = 255 - avg * 2; // B
        } else {
            data[i] = (avg - 128) * 2; // R
            data[i + 1] = 255 - (avg - 128) * 2; // G
            data[i + 2] = 0; // B
        }
    }

    ctx.putImageData(imageData, 0, 0);
};
