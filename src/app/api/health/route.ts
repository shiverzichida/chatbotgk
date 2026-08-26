import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { status: 'error', message: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        service: 'Gizi Kebugaran AI Keep-Alive Health Check',
        database: 'connected',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Internal health check error' },
      { status: 500 }
    );
  }
}
