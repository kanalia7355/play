const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Please provide an API key as argument");
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (!response.ok) {
            console.error("Error:", data);
            return;
        }

        console.log("Available models:");
        data.models.forEach(model => {
            console.log(`- ${model.name}`);
            console.log(`  Supported methods: ${model.supportedGenerationMethods.join(", ")}`);
        });
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
