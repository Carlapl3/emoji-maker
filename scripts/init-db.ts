import { createClient } from '@supabase/supabase-js';

async function initDatabase() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing required environment variables');
        process.exit(1);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking for profiles table...');

    // Check if profiles table exists
    const { data: tableExists } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'profiles')
        .single();

    if (!tableExists) {
        console.log('Creating profiles table...');
        const { error } = await supabase.rpc('create_profiles_table');

        if (error) {
            console.error('Error creating profiles table:', error);
            // Fallback to direct SQL if RPC fails
            console.log('Trying direct SQL...');
            const { error: sqlError } = await supabase.rpc('pg_temp.create_profiles_table');

            if (sqlError) {
                console.error('SQL Error:', sqlError);
                process.exit(1);
            }
        }
        console.log('Profiles table created successfully');
    } else {
        console.log('Profiles table already exists');
    }

    console.log('Database initialization complete');
    process.exit(0);
}

initDatabase().catch(console.error);
