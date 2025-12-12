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

async function checkAndDecrementCredits(userId: string, supabase: any) {
    const { data, error: fetchError } = await supabase.rpc('decrement_user_credits', {
        p_user_id: userId  // FIXED: Changed from user_id to p_user_id
    });

    if (fetchError) {
        console.error('Error managing credits:', fetchError);
        throw new Error(fetchError.message);
    }

    if (!data || data.length === 0) {
        throw new Error('User not found');
    }

    const result = data[0];
    if (result.credits_before <= 0) {
        throw new Error('Insufficient credits');
    }

    return result.credits_after;
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { prompt } = await request.json();
        console.log('Generating emoji with prompt:', prompt);

        // Check and decrement credits
        try {
            await checkAndDecrementCredits(userId, supabase);
        } catch (error) {
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Insufficient credits' },
                { status: 400 }
            );
        }

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

        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from Replicate: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        const imageArrayBuffer = await imageBlob.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

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

        const { data: { publicUrl } } = supabase.storage
            .from('emojis')
            .getPublicUrl(fileName);

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

        return NextResponse.json({
            ...data,
            remainingCredits: await getRemainingCredits(userId, supabase)
        });
    } catch (error) {
        console.error('Error generating emoji:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate emoji',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: error instanceof Error && error.message === 'Insufficient credits' ? 400 : 500 }
        );
    }
}

async function getRemainingCredits(userId: string, supabase: any): Promise<number> {
    const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)  // FIXED: Changed from id to user_id
        .single();

    if (error || !data) {
        console.error('Error fetching remaining credits:', error);
        return 0;
    }

    return data.credits;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;