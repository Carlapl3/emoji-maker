import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from '@clerk/nextjs/server';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function waitForPrediction(predictionId: string) {
    let prediction = await replicate.predictions.get(predictionId);
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        prediction = await replicate.predictions.get(predictionId);
    }
    if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
    }
    return prediction;
}

export async function POST(request: NextRequest) {
    try {
        // Get user ID from Clerk
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { prompt } = await request.json();
        console.log('Generating emoji with prompt:', prompt);

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

        const completedPrediction = await waitForPrediction(prediction.id);
        const output = completedPrediction.output;

        if (!output || !Array.isArray(output) || output.length === 0) {
            throw new Error('No output from Replicate API');
        }

        const imageUrl = output[0];
        if (typeof imageUrl !== 'string') {
            throw new Error('Invalid image URL from Replicate API');
        }

        // 1. Fetch the image data
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from Replicate: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        const imageArrayBuffer = await imageBlob.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        // 2. Upload to Supabase Storage
        const fileName = `${uuidv4()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('emojis')
            .upload(fileName, imageBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading to Supabase Storage:', uploadError);
            throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
        }

        // 3. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('emojis')
            .getPublicUrl(fileName);

        // 4. Save to database
        const { data, error } = await supabase
            .from('emojis')
            .insert({
                image_url: publicUrl,
                prompt: prompt,
                likes: 0,
                storage_path: uploadData.path,
                creator_user_id: userId
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
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
export const maxDuration = 60;