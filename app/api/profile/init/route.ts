import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (existingProfile) {
            return NextResponse.json(
                { message: "Profile already exists" },
                { status: 200 }
            );
        }

        // Create new profile
        const { error } = await supabaseAdmin
            .from('profiles')
            .insert([
                {
                    id: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('Error creating profile:', error);
            return NextResponse.json(
                { error: "Failed to create profile" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Profile initialized successfully" },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error in profile initialization:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
