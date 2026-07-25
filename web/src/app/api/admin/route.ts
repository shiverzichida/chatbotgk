import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Buat client dengan service role untuk bypass RLS (khusus di server-side)
const adminClient = createClient(supabaseUrl, supabaseServiceRole);
// Client biasa untuk memverifikasi session user
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper untuk validasi hak akses admin
async function checkAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonClient.auth.getUser(token);

    if (error || !user) return false;

    const isAdminEmail = user.email === 'admin@gizikebugaran.com';
    const isAdminRole = user.user_metadata?.role === 'admin';

    return isAdminEmail || isAdminRole;
  } catch (e) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Verifikasi Admin
    const isAuthorized = await checkAdmin(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Khusus akses administrator.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Action A: Mengambil daftar semua user
    if (action === 'users') {
      const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ users: profiles || [] });
    }

    // Action B: Mengambil riwayat chat & sesi aktif per user
    if (action === 'chat') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'userId diperlukan' }, { status: 400 });
      }

      // Cari sesi chat aktif terakhir
      let { data: session, error: sessionError } = await adminClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;

      // Jika belum ada sesi, buat sesi default baru
      if (!session) {
        const { data: newSession, error: createError } = await adminClient
          .from('chat_sessions')
          .insert({
            user_id: userId,
            title: 'Percakapan Gizi Kebugaran'
          })
          .select()
          .single();

        if (createError) throw createError;
        session = newSession;
      }

      // Ambil pesan dalam sesi ini
      const { data: messages, error: messagesError } = await adminClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return NextResponse.json({
        session,
        messages: messages || []
      });
    }

    // Action E: Mengambil log progress (InBody) per user
    if (action === 'logs') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'userId diperlukan' }, { status: 400 });
      }

      const { data: logs, error } = await adminClient
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ logs: logs || [] });
    }

    // Action F: Mengambil semua system settings (modular prompts)
    if (action === 'settings') {
      const { data: settings, error } = await adminClient
        .from('system_settings')
        .select('*');

      if (error) throw error;
      return NextResponse.json({ settings: settings || [] });
    }

    // Action G: Mengambil data mingguan user (targets, workouts, reviews)
    if (action === 'weekly_data') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'userId diperlukan' }, { status: 400 });
      }

      // Ambil target user
      const { data: targets, error: targetsError } = await adminClient
        .from('user_targets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (targetsError) throw targetsError;

      // Ambil workout logs
      const { data: workouts, error: workoutsError } = await adminClient
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (workoutsError) throw workoutsError;

      // Ambil weekly reviews
      const { data: reviews, error: reviewsError } = await adminClient
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Ambil progress logs
      const { data: logs, error: logsError } = await adminClient
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (logsError) throw logsError;

      return NextResponse.json({ 
        targets: targets || [],
        workouts: workouts || [],
        reviews: reviews || [],
        logs: logs || []
      });
    }

    return NextResponse.json({ error: 'Action GET tidak valid' }, { status: 400 });

  } catch (err: any) {
    console.error('Error GET /api/admin:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let action = '';
    let body: any = {};
    let formData: FormData | null = null;

    if (contentType.includes('multipart/form-data')) {
      formData = await req.formData();
      action = formData.get('action') as string;
    } else {
      body = await req.json();
      action = body.action;
    }

    // Action Y: Create user dengan email auto-confirmed (bypass konfirmasi email) - AKSES PUBLIK
    if (action === 'create_user') {
      const { email, password, name, goalType } = body;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email dan password diperlukan' }, { status: 400 });
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // <--- AUTO CONFIRM EMAIL!
        user_metadata: {
          name: name,
          role: 'user', // Selalu set role ke 'user' demi keamanan
          goal_type: goalType
        }
      });

      if (error) throw error;
      return NextResponse.json({ success: true, user: data.user });
    }

    // 1. Verifikasi Admin untuk seluruh tindakan admin/intervensi lainnya
    const isAuthorized = await checkAdmin(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Khusus akses administrator.' }, { status: 401 });
    }

    // Action X: Upload PDF & process local OCR (hanya di localhost)
    if (action === 'upload_pdf' && formData) {
      const host = req.headers.get('host') || '';
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      if (!isLocal) {
        return NextResponse.json({ error: 'Upload PDF langsung dari dashboard hanya diizinkan saat web dijalankan di server lokal (localhost).' }, { status: 403 });
      }

      const file = formData.get('file') as File;
      const chapter = formData.get('chapter') as string || '';

      if (!file) {
        return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      const tempFilePath = path.join(tempDir, file.name);
      await fs.promises.writeFile(tempFilePath, buffer);

      // Jalankan script python ingest_ocr.py
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execPromise = promisify(exec);

      try {
        const scriptPath = path.join(process.cwd(), 'ingest_ocr.py');
        const command = `python "${scriptPath}" --pdf "${tempFilePath}" --chapter "${chapter}"`;
        
        const { stdout } = await execPromise(command);
        
        // Hapus file temp
        await fs.promises.unlink(tempFilePath);

        return NextResponse.json({ 
          success: true, 
          message: 'Berkas PDF berhasil diproses dan disimpan ke Supabase!',
          output: stdout 
        });
      } catch (err: any) {
        // Hapus file temp jika ada
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
        console.error('Gagal menjalankan script OCR:', err);
        return NextResponse.json({ error: `Gagal memproses OCR: ${err.message}` }, { status: 500 });
      }
    }

    // Action C: Menyimpan custom system prompt ke database (mendukung format modular)
    if (action === 'save_prompt') {
      const { prompt_personality, prompt_nutrition, prompt_guardrails, prompt_format } = body;
      
      const updates = [
        { key: 'prompt_personality', value: prompt_personality },
        { key: 'prompt_nutrition', value: prompt_nutrition },
        { key: 'prompt_guardrails', value: prompt_guardrails },
        { key: 'prompt_format', value: prompt_format }
      ];

      for (const update of updates) {
        if (update.value !== undefined) {
          const { error } = await adminClient
            .from('system_settings')
            .upsert({
              key: update.key,
              value: update.value,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });
          if (error) throw error;
        }
      }

      return NextResponse.json({ success: true, message: 'Semua instruksi AI modular berhasil diperbarui secara global' });
    }

    // Action D: Kirim pesan intervensi Admin/Coach ke dalam percakapan user
    if (action === 'intervene') {
      const { sessionId, content } = body;
      if (!sessionId || !content) {
        return NextResponse.json({ error: 'sessionId dan content diperlukan' }, { status: 400 });
      }

      const { data: newMessage, error } = await adminClient
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender: 'assistant', // muncul sebagai asisten/coach di layar user
          content: content
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Pesan intervensi berhasil dikirim', data: newMessage });
    }

    // Action H: Simpan Weekly Review
    if (action === 'save_review') {
      const { id, userId, weekNumber, startDate, endDate, weightChange, complianceScore, aiFeedback, coachFeedback } = body;
      
      if (!userId || !startDate || !endDate) {
        return NextResponse.json({ error: 'userId, startDate, endDate diperlukan' }, { status: 400 });
      }

      const reviewData = {
        user_id: userId,
        week_number: weekNumber,
        start_date: startDate,
        end_date: endDate,
        weight_change: weightChange,
        compliance_score: complianceScore,
        ai_feedback: aiFeedback,
        coach_feedback: coachFeedback
      };

      let query = adminClient.from('weekly_reviews');
      let result;

      if (id) {
        result = await query.update(reviewData).eq('id', id).select().single();
      } else {
        result = await query.insert(reviewData).select().single();
      }

      if (result.error) throw result.error;
      return NextResponse.json({ success: true, message: 'Weekly review berhasil disimpan', data: result.data });
    }

    // Action I: Generate AI Feedback untuk Weekly Review
    if (action === 'generate_weekly_ai_feedback') {
      const { userId, startDate, endDate } = body;
      if (!userId || !startDate || !endDate) {
        return NextResponse.json({ error: 'userId, startDate, endDate diperlukan' }, { status: 400 });
      }

      // Ambil progress logs dalam rentang waktu
      const { data: progressLogs } = await adminClient
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      // Ambil workout logs dalam rentang waktu
      const { data: workoutLogs } = await adminClient
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      // Siapkan prompt
      const prompt = `Anda adalah asisten AI Coach Gizi Kebugaran. Buatkan ringkasan evaluasi mingguan untuk pengguna berdasarkan data log berikut:
Progress Logs (Berat/Kalori/Protein): ${JSON.stringify(progressLogs || [])}
Workout Logs (Latihan): ${JSON.stringify(workoutLogs || [])}

Buatlah teks feedback yang suportif, analitis, dan ringkas. Evaluasi kepatuhan kalori/protein, dan kepatuhan latihan olahraga mereka. Beri apresiasi pada kemajuan, dan saran perbaikan jika ada kekurangan. Format dalam paragraf atau poin-poin yang mudah dibaca.`;

      const groqApiKey = process.env.GROQ_API_KEY || '';
      if (!groqApiKey) {
        return NextResponse.json({ error: 'GROQ_API_KEY belum di-set.' }, { status: 500 });
      }

      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json();
        throw new Error(errorData.error?.message || 'Gagal memanggil API Groq');
      }

      const groqData = await groqResponse.json();
      const aiFeedbackText = groqData.choices[0]?.message?.content || 'Gagal menghasilkan feedback.';

      return NextResponse.json({ success: true, aiFeedback: aiFeedbackText });
    }

    return NextResponse.json({ error: 'Action POST tidak valid' }, { status: 400 });

  } catch (err: any) {
    console.error('Error POST /api/admin:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
