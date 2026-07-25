import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Gunakan service role client untuk logging history dan bypass RLS secara aman di server-side
const dbClient = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const { 
      message, 
      history, 
      sessionId, 
      prompt_personality_override, 
      prompt_nutrition_override, 
      prompt_guardrails_override, 
      prompt_format_override,
      focus_chapter
    } = await req.json();

    const groqApiKey = process.env.GROQ_API_KEY || '';

    // Jika API Key belum di-set, kirim respons instruktif agar user tahu cara mengaturnya
    if (!groqApiKey) {
      return NextResponse.json({
        text: "Halo! Saya asisten AI Gizi Kebugaran. Saat ini layanan AI asli belum aktif karena **GROQ_API_KEY** belum dimasukkan ke file `.env.local` Anda. Silakan tambahkan API Key Groq Anda agar saya dapat menjawab secara cerdas dan natural! \n\n*(Kredensial simulasi masih aktif di latar belakang)*",
        citations: []
      });
    }

    // 1. Simpan pesan pengguna ke database jika ada sessionId
    if (sessionId) {
      try {
        await dbClient.from('chat_messages').insert({
          session_id: sessionId,
          sender: 'user',
          content: message
        });
      } catch (e) {
        console.error('Gagal mencatat pesan user ke Supabase:', e);
      }
    }

    // 2. Ambil konteks dokumen dari Supabase menggunakan Keyword Search (fallback RAG gratis)
    let contextText = '';
    let citations: any[] = [];

    try {
      const keywords = message
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 3);

      if (keywords.length > 0) {
        let query = dbClient.from('document_chunks').select('content, chapter_title, page_start');
        if (focus_chapter && focus_chapter !== '__all__') {
          query = query.eq('chapter_title', focus_chapter);
        }
        const filterOr = keywords.map((k: string) => `content.ilike.%${k}%`).join(',');
        const { data: chunks, error: dbError } = await query.or(filterOr).limit(3);

        if (!dbError && chunks && chunks.length > 0) {
          contextText = chunks
            .map(c => `[Rujukan Bab: ${c.chapter_title || 'Umum'} (Halaman ${c.page_start || 'N/A'})]: ${c.content}`)
            .join('\n\n');
          
          citations = chunks.map(c => ({
            title: c.chapter_title || 'Buku Panduan',
            page: c.page_start || 0
          }));
        }
      }
    } catch (e) {
      console.warn('Gagal melakukan keyword RAG di Supabase, lanjut tanpa RAG:', e);
    }

    // 3. Ambil system prompt modular dari database (atau gunakan override dari playground admin)
    let prompt_personality = prompt_personality_override;
    let prompt_nutrition = prompt_nutrition_override;
    let prompt_guardrails = prompt_guardrails_override;
    let prompt_format = prompt_format_override;

    try {
      // Ambil seluruh setting prompt dari database
      const { data: settings } = await dbClient
        .from('system_settings')
        .select('key, value');

      if (settings && settings.length > 0) {
        const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

        if (!prompt_personality) prompt_personality = getSetting('prompt_personality');
        if (!prompt_nutrition) prompt_nutrition = getSetting('prompt_nutrition');
        if (!prompt_guardrails) prompt_guardrails = getSetting('prompt_guardrails');
        if (!prompt_format) prompt_format = getSetting('prompt_format');
      }
    } catch (e) {
      console.warn('Gagal mengambil modular prompt dari database, gunakan default:', e);
    }

    // Default Fallbacks jika kosong
    if (!prompt_personality) {
      prompt_personality = `Anda adalah asisten AI Gizi Kebugaran resmi oleh Gizi Kebugaran. Tugas Anda adalah membantu user menjawab pertanyaan seputar olahraga, porsi makan, kebutuhan gizi, rekomposisi tubuh, dan gaya hidup sehat. Gunakan bahasa Indonesia yang santai, bersahabat, memotivasi, dan akrab layaknya coach kebugaran pribadi (hindari kalimat kaku atau robotik). Gunakan sapaan hangat seperti "Halo!", "Semangat!", atau "Keren!".`;
    }
    if (!prompt_nutrition) {
      prompt_nutrition = `Berikan tips praktis gizi olahraga, porsi makan tinggi protein, dan anjuran hidrasi berdasarkan sains kebugaran olahraga modern.`;
    }
    if (!prompt_guardrails) {
      prompt_guardrails = `JANGAN PERNAH memberikan saran obat medis klinis keras. Batasi pembahasan hanya pada nutrisi, olahraga, dan gaya hidup sehat. Tolak dengan sopan pertanyaan di luar topik ini.`;
    }
    if (!prompt_format) {
      prompt_format = `Gunakan susunan jawaban yang rapi, berikan poin-poin penting menggunakan tanda tebal (**), gunakan emoji kebugaran secara wajar, dan buat jawaban ringkas maksimal 3-4 paragraf agar mudah dibaca di mobile.`;
    }

    // Gabungkan menjadi satu prompt terstruktur
    let systemPrompt = `# INSTRUKSI UTAMA ASISTEN AI
    
[PERILAKU & GAYA BAHASA]
${prompt_personality}

[ATURAN SAINS GIZI & NUTRISI]
${prompt_nutrition}

[BATASAN KEAMANAN & TOPIK]
${prompt_guardrails}

[FORMAT JAWABAN]
${prompt_format}`;

    // 3.5 Ambil target user untuk menambah konteks personalisasi
    let userTargetsText = '';
    if (sessionId) {
      try {
        const { data: sessionData } = await dbClient
          .from('chat_sessions')
          .select('user_id')
          .eq('id', sessionId)
          .single();

        if (sessionData && sessionData.user_id) {
          const { data: targetsData } = await dbClient
            .from('user_targets')
            .select('target_weight, weekly_loss_target, daily_calorie_target, daily_protein_target')
            .eq('user_id', sessionData.user_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (targetsData) {
            userTargetsText = `[TARGET USER SAAT INI]
- Target Berat Badan: ${targetsData.target_weight ? targetsData.target_weight + ' kg' : 'Tidak ditentukan'}
- Laju Perubahan Berat: ${targetsData.weekly_loss_target ? (targetsData.weekly_loss_target > 0 ? '+' : '') + targetsData.weekly_loss_target + ' kg/minggu' : 'Tidak ditentukan'}
- Target Kalori Harian: ${targetsData.daily_calorie_target ? targetsData.daily_calorie_target + ' kcal' : 'Tidak ditentukan'}
- Target Protein Harian: ${targetsData.daily_protein_target ? targetsData.daily_protein_target + ' g' : 'Tidak ditentukan'}

Gunakan data target di atas untuk memberikan saran gizi atau olahraga yang lebih personal dan relevan dengan tujuan user.`;
            
            systemPrompt += `\n\n${userTargetsText}`;
          }
        }
      } catch (e) {
        console.warn('Gagal mengambil user_targets untuk konteks AI:', e);
      }
    }

    // Tambahkan konteks rujukan ke system prompt jika ada
    if (contextText) {
      systemPrompt += `\n\nBerikut rujukan tepercaya dari buku panduan Gizi Kebugaran:\n${contextText}\n\nJawablah dengan merujuk pada teks di atas secara mengalir dan alami. Jangan menyebutkan "berdasarkan rujukan di atas" secara tersurat.`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    // 4. Panggil completions API Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      throw new Error(errorData.error?.message || 'Gagal memanggil API Groq');
    }

    const groqData = await groqResponse.json();
    const replyText = groqData.choices[0]?.message?.content || 'Maaf, saya sedang tidak dapat memproses jawaban.';

    // Deteksi jika AI tidak menemukan informasi di rujukan atau tidak tahu
    const lowerReply = replyText.toLowerCase();
    const isNegativeMatch = 
      lowerReply.includes('tidak memiliki informasi') ||
      lowerReply.includes('tidak ada informasi') ||
      lowerReply.includes('tidak ditemukan dalam rujukan') ||
      lowerReply.includes('tidak tercantum') ||
      lowerReply.includes('saya tidak tahu') ||
      lowerReply.includes('maaf, saya tidak dapat menemukan') ||
      lowerReply.includes('tidak disebutkan dalam') ||
      lowerReply.includes('tidak terdapat dalam') ||
      lowerReply.includes('tidak membahas');

    // Susun rujukan teks jika ada & bukan merupakan negative match
    let citationText = '';
    let finalCitations = citations;

    if (isNegativeMatch) {
      finalCitations = [];
    }

    if (finalCitations.length > 0) {
      const uniqueCitations = Array.from(new Set(finalCitations.map(c => `${c.title} Hal. ${c.page}`)));
      citationText = '\n\n' + uniqueCitations.map(c => `[Rujukan: ${c}]`).join(' ');
    }

    const finalReplyText = replyText + citationText;

    // 5. Simpan pesan asisten ke database jika ada sessionId
    if (sessionId) {
      try {
        await dbClient.from('chat_messages').insert({
          session_id: sessionId,
          sender: 'assistant',
          content: finalReplyText
        });
      } catch (e) {
        console.error('Gagal mencatat pesan asisten ke Supabase:', e);
      }
    }

    return NextResponse.json({
      text: replyText,
      citations: finalCitations
    });

  } catch (err: any) {
    console.error('Error di API Chat:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
