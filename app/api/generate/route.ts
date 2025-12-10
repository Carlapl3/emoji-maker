import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to wait for prediction to complete
async function waitForPrediction(predictionId: string) {
    let prediction = await replicate.predictions.get(predictionId);

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        // Wait for 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        prediction = await replicate.predictions.get(predictionId);
    }

    if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
    }

    return prediction;
}

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();
        console.log('Generating emoji with prompt:', prompt);

        // First, create the prediction
        const prediction = await replicate.predictions.create({
            version: "dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
            input: {
                width: 1024,
                height: 1024,
                prompt: `A TOK emoji of ${prompt}`,
                refine: "no_refiner",
                scheduler: "K_EULER",
                lora_scale: 0.6,
                num_outputs: 1,
                guidance_scale: 7.5,
                apply_watermark: false,
                high_noise_frac: 0.8,
                negative_prompt: "",
                prompt_strength: 0.8,
                num_inference_steps: 50
            },
        });

        console.log('Prediction created:', prediction.id);

        // Wait for the prediction to complete
        const completedPrediction = await waitForPrediction(prediction.id);
        console.log('Prediction completed:', completedPrediction);

        // Get the output URL
        const output = completedPrediction.output;
        if (!output || !Array.isArray(output) || output.length === 0) {
            throw new Error('No output from Replicate API');
        }

        const imageUrl = output[0];
        if (typeof imageUrl !== 'string') {
            throw new Error('Invalid image URL from Replicate API');
        }

        // In a real app, you would save this to a database
        const emoji = {
            id: prediction.id,
            url: imageUrl,
            prompt,
            likes: 0,
            createdAt: new Date().toISOString(),
        };

        console.log('Generated emoji:', emoji);

        return NextResponse.json(emoji);
    } catch (error) {
        console.error('Error generating emoji:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate emoji',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
