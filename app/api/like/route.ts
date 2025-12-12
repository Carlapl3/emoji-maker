import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { emojiId } = await request.json();

        // Get current likes
        const { data: emoji, error: fetchError } = await supabase
            .from('emojis')
            .select('likes')
            .eq('id', emojiId)
            .single();

        if (fetchError) throw fetchError;

        // Increment likes
        const { error: updateError } = await supabase
            .from('emojis')
            .update({ likes: (emoji.likes || 0) + 1 })
            .eq('id', emojiId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error liking emoji:', error);
        return NextResponse.json({ error: 'Failed to like emoji' }, { status: 500 });
    }
}