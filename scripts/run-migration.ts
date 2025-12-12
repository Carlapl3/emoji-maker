import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

async function runMigration() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing required environment variables');
        process.exit(1);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Read the SQL file
        const migrationPath = path.join(__dirname, 'migrations/20231211_create_profiles_table.sql');
        const sql = readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        const { data, error } = await supabase.rpc('pg_temp.execute_sql', { sql });

        if (error) {
            // If RPC fails, try direct SQL execution
            console.log('RPC failed, trying direct SQL execution...');
            const { error: sqlError } = await supabase.rpc('pg_temp.execute_sql', { sql });

            if (sqlError) {
                throw sqlError;
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}

runMigration().catch(console.error);
