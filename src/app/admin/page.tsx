'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ProgressChart from '@/components/metrics/ProgressChart';
import { 
  FileText, 
  Upload, 
  Database, 
  Lock, 
  LogOut, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  MessageSquare,
  Users,
  Send,
  Settings,
  Terminal,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Award,
  Utensils,
  Menu,
  X
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  gender: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal_type: string | null;
  activity_level?: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'playground' | 'users' | 'details'>('docs');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // STATS
  const [totalChunks, setTotalChunks] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // TAB 4: USER DETAILS & LOGS
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [userTargets, setUserTargets] = useState<any[]>([]);
  const [userWorkouts, setUserWorkouts] = useState<any[]>([]);
  const [userFoodLogs, setUserFoodLogs] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const [aiReviewText, setAiReviewText] = useState('');
  const [coachFeedbackInput, setCoachFeedbackInput] = useState('');
  const [reviewWeekNumber, setReviewWeekNumber] = useState('');
  const [reviewStartDate, setReviewStartDate] = useState('');
  const [reviewEndDate, setReviewEndDate] = useState('');
  const [reviewWeightChange, setReviewWeightChange] = useState('');
  const [reviewComplianceScore, setReviewComplianceScore] = useState('');

  const [isGeneratingAiReview, setIsGeneratingAiReview] = useState(false);
  const [isSavingWeeklyReview, setIsSavingWeeklyReview] = useState(false);

  // TAB 1: KNOWLEDGE BASE / DOCS
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Nutrition Guideline');
  const [docContent, setDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // PDF Upload state
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'pdf'>('text');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfChapter, setPdfChapter] = useState('');
  const [pdfType, setPdfType] = useState('Nutrition Guideline');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  
  useEffect(() => {
    setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }, []);
  
  // Dummy docs list for visual representation of upload history
  const [documents, setDocuments] = useState([
    { id: '1', title: 'Buku Gizi Olahraga Gizi Kebugaran', type: 'Nutrition Guideline', size: '4.8 MB', status: 'processed', date: '2026-07-24' },
    { id: '2', title: 'Panduan Asupan Makro User Lari', type: 'Nutrition Guideline', size: '1.2 MB', status: 'processed', date: '2026-07-23' },
    { id: '3', title: 'Meal Plan Fat Loss Kategori Obesitas', type: 'Meal Plan', size: '920 KB', status: 'processed', date: '2026-07-20' },
  ]);

  // DOCUMENT TABLE SEARCH & PAGINATION
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const DOCS_PER_PAGE = 5;

  // Filter documents by search query
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    doc.date.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalDocPages = Math.ceil(filteredDocuments.length / DOCS_PER_PAGE) || 1;
  const currentDocPage = Math.min(docCurrentPage, totalDocPages);
  const startDocIdx = (currentDocPage - 1) * DOCS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startDocIdx, startDocIdx + DOCS_PER_PAGE);

  // TAB 2: SYSTEM PROMPT & PLAYGROUND
  const [promptPersonality, setPromptPersonality] = useState('');
  const [promptNutrition, setPromptNutrition] = useState('');
  const [promptGuardrails, setPromptGuardrails] = useState('');
  const [promptFormat, setPromptFormat] = useState('');

  const [testPromptPersonality, setTestPromptPersonality] = useState('');
  const [testPromptNutrition, setTestPromptNutrition] = useState('');
  const [testPromptGuardrails, setTestPromptGuardrails] = useState('');
  const [testPromptFormat, setTestPromptFormat] = useState('');

  const [activePromptSubTab, setActivePromptSubTab] = useState<'personality' | 'nutrition' | 'guardrails' | 'format'>('personality');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptSaveStatus, setPromptSaveStatus] = useState<string | null>(null);
  
  // Playground Chat State
  const [focusChapter, setFocusChapter] = useState('__all__');
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'bot', text: 'Halo! Saya asisten AI Gizi Kebugaran. Di playground ini, Anda bisa mengetik pertanyaan untuk menguji kepribadian AI dan instruksi prompt yang sedang Anda tulis di sebelah kiri.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [isPlaygroundTyping, setIsPlaygroundTyping] = useState(false);
  const [lastCitations, setLastCitations] = useState<Array<{ title: string; page: number }>>([]);
  const playgroundEndRef = useRef<HTMLDivElement>(null);

  // TAB 3: USER MANAGER & INTERVENSI CHAT
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Chat History Per User
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userChatMessages, setUserChatMessages] = useState<ChatMessage[]>([]);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const [interventionInput, setInterventionInput] = useState('');
  const [isSendingIntervention, setIsSendingIntervention] = useState(false);
  const userChatEndRef = useRef<HTMLDivElement>(null);

  // AUTH PROTECT EFFECT
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        const timer = setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading]);

  // LOAD DB STATS, USERS & SYSTEM SETTINGS
  const fetchDbStats = async () => {
    if (!authorized) return;
    setIsStatsLoading(true);
    try {
      // 1. Hitung total chunks di pgvector
      const { count: chunkCount, error: chunkErr } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });
      if (!chunkErr && chunkCount !== null) {
        setTotalChunks(chunkCount);
      }

      // 2. Hitung total users terdaftar
      const { count: userCount, error: userErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (!userErr && userCount !== null) {
        setTotalUsersCount(userCount);
      }

      // 3. Fetch unique chapters for Playground filter and Document list
      const { data: chaptersData, error: chaptersErr } = await supabase
        .from('document_chunks')
        .select('chapter_title, created_at');
      if (!chaptersErr && chaptersData) {
        const uniqueChapters = Array.from(new Set(chaptersData.map((d: any) => d.chapter_title).filter(Boolean)));
        setAvailableChapters(uniqueChapters as string[]);

        // Group by chapter_title to get latest upload dates
        const map = new Map<string, string>();
        chaptersData.forEach((item: any) => {
          if (item.chapter_title) {
            const dateStr = item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            if (!map.has(item.chapter_title) || dateStr > map.get(item.chapter_title)!) {
              map.set(item.chapter_title, dateStr);
            }
          }
        });

        // Convert to document list format
        const docList = Array.from(map.entries()).map(([title, date], index) => ({
          id: String(index + 1),
          title: title,
          type: 'Nutrition Guideline',
          size: 'Saved to DB',
          status: 'processed',
          date: date
        }));

        if (docList.length > 0) {
          setDocuments(docList);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat statistik database:', e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!authorized) return;
    setIsUsersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/admin?action=users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
        setTotalUsersCount(data.users.length);
      }
    } catch (e) {
      console.error('Gagal mengambil daftar pengguna:', e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchSystemPrompt = async () => {
    if (!authorized) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/admin?action=settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.settings) {
        const findVal = (key: string) => data.settings.find((s: any) => s.key === key)?.value || '';
        
        const personality = findVal('prompt_personality');
        const nutrition = findVal('prompt_nutrition');
        const guardrails = findVal('prompt_guardrails');
        const format = findVal('prompt_format');

        setPromptPersonality(personality);
        setPromptNutrition(nutrition);
        setPromptGuardrails(guardrails);
        setPromptFormat(format);

        setTestPromptPersonality(personality);
        setTestPromptNutrition(nutrition);
        setTestPromptGuardrails(guardrails);
        setTestPromptFormat(format);
      }
    } catch (e) {
      console.warn('Gagal memuat modular prompts:', e);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchDbStats();
      fetchUsers();
      fetchSystemPrompt();
    }
  }, [authorized]);

  // TAB 4: FETCH USER PROGRESS LOGS (INBODY)
  useEffect(() => {
    if (!selectedUser || activeTab !== 'details' || !authorized) return;

    const fetchWeeklyData = async () => {
      setIsLogsLoading(true);
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token;

        const res = await fetch(`/api/admin?action=weekly_data&userId=${selectedUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.logs) {
          setUserLogs(data.logs.map((item: any) => ({
            id: item.id,
            date: item.date,
            weight: parseFloat(item.weight),
            muscle: parseFloat(item.muscle),
            fat: parseFloat(item.fat),
            calories: item.calories || undefined,
            protein: item.protein || undefined
          })));
        }

        if (data.targets) setUserTargets(data.targets);
        if (data.workouts) setUserWorkouts(data.workouts);
        if (data.foodLogs) setUserFoodLogs(data.foodLogs);
        if (data.reviews) {
          setUserReviews(data.reviews);
          const today = new Date();
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          setReviewStartDate(lastWeek.toISOString().split('T')[0]);
          setReviewEndDate(today.toISOString().split('T')[0]);
          setReviewWeekNumber((data.reviews.length + 1).toString());
        } else {
          setUserReviews([]);
          const today = new Date();
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          setReviewStartDate(lastWeek.toISOString().split('T')[0]);
          setReviewEndDate(today.toISOString().split('T')[0]);
          setReviewWeekNumber('1');
        }
      } catch (err) {
        console.warn('Gagal memuat log timbangan user:', err);
      } finally {
        setIsLogsLoading(false);
      }
    };

    fetchWeeklyData();
  }, [selectedUser, activeTab, authorized]);

  // TAB 4 ACTIONS
  const handleGenerateWeeklyAiFeedback = async () => {
    if (!selectedUser || !reviewStartDate || !reviewEndDate) return;
    setIsGeneratingAiReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'generate_weekly_ai_feedback',
          userId: selectedUser.id,
          startDate: reviewStartDate,
          endDate: reviewEndDate
        })
      });
      const data = await res.json();
      if (data.aiFeedback) {
        setAiReviewText(data.aiFeedback);
      } else {
        throw new Error(data.error || 'Gagal generate AI review');
      }
    } catch (err: any) {
      alert(`Error generate AI review: ${err.message}`);
    } finally {
      setIsGeneratingAiReview(false);
    }
  };

  const handleSaveWeeklyReview = async () => {
    if (!selectedUser) return;
    setIsSavingWeeklyReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'save_review',
          userId: selectedUser.id,
          weekNumber: parseInt(reviewWeekNumber),
          startDate: reviewStartDate,
          endDate: reviewEndDate,
          weightChange: parseFloat(reviewWeightChange || '0'),
          complianceScore: parseFloat(reviewComplianceScore || '0'),
          aiFeedback: aiReviewText,
          coachFeedback: coachFeedbackInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiReviewText('');
        setCoachFeedbackInput('');
        setReviewWeightChange('');
        setReviewComplianceScore('');
        
        const refreshRes = await fetch(`/api/admin?action=weekly_data&userId=${selectedUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshData.reviews) {
          setUserReviews(refreshData.reviews);
          setReviewWeekNumber((refreshData.reviews.length + 1).toString());
        }
      } else {
        throw new Error(data.error || 'Gagal save review');
      }
    } catch (err: any) {
      alert(`Error save review: ${err.message}`);
    } finally {
      setIsSavingWeeklyReview(false);
    }
  };

  // SCROLL REFS
  const scrollPlaygroundToBottom = () => {
    playgroundEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    userChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userChatMessages]);

  // TAB 3: POLLING FOR ACTIVE USER CHAT HISTORY
  useEffect(() => {
    if (!selectedUser || activeTab !== 'users' || !authorized) return;

    const fetchUserChat = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token;

        const res = await fetch(`/api/admin?action=chat&userId=${selectedUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.session) {
          setActiveSessionId(data.session.id);
        }
        if (data.messages) {
          // Hanya update jika jumlah pesan bertambah untuk menjaga kelancaran scroll
          setUserChatMessages((prev) => {
            if (prev.length !== data.messages.length) {
              return data.messages;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Gagal memuat riwayat chat user:', err);
      }
    };

    fetchUserChat(); // Initial load
    const interval = setInterval(fetchUserChat, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [selectedUser, activeTab, authorized]);

  // UPLOAD DOKUMEN MANUAL ACTION (TAB 1)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // Ingest document chunks to database Supabase
      // Pecah tulisan menjadi beberapa bagian paragraf (chunking sederhana)
      const paragraphs = docContent.split(/\n\n+/).filter(p => p.trim().length > 10);
      
      const chunksToInsert = paragraphs.map((p, index) => ({
        chapter_title: docTitle,
        content: p.trim(),
        page_start: index + 1,
      }));

      // Kirim chunking teks ke Supabase
      const { error } = await supabase
        .from('document_chunks')
        .insert(chunksToInsert);

      if (error) throw error;

      const newDoc = {
        id: String(Date.now()),
        title: docTitle,
        type: docType,
        size: `${(docContent.length / 1024).toFixed(1)} KB`,
        status: 'processed',
        date: new Date().toISOString().split('T')[0]
      };

      setDocuments([newDoc, ...documents]);
      setUploadStatus({ type: 'success', message: `Dokumen "${docTitle}" berhasil diproses dan disimpan ke Supabase database!` });
      setDocTitle('');
      setDocContent('');
      fetchDbStats(); // Refresh stats count
    } catch (err: any) {
      console.error(err);
      setUploadStatus({ type: 'error', message: `Gagal mengunggah dokumen: ${err.message || 'Terjadi error database.'}` });
    } finally {
      setIsUploading(false);
    }
  };

  // UPLOAD BATCH PDF ACTION (TAB 1)
  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const filesToUpload = pdfFiles.length > 0 ? pdfFiles : (pdfFile ? [pdfFile] : []);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadStatus(null);
    setBatchProgress(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let successCount = 0;
      const totalCount = filesToUpload.length;

      for (let i = 0; i < totalCount; i++) {
        const file = filesToUpload[i];
        const chapterName = pdfChapter 
          ? (totalCount > 1 ? `${pdfChapter} - ${file.name.replace(/\.pdf$/i, '')}` : pdfChapter)
          : file.name.replace(/\.pdf$/i, '');

        setBatchProgress({ current: i + 1, total: totalCount, fileName: file.name });

        const formData = new FormData();
        formData.append('action', 'upload_pdf');
        formData.append('file', file);
        formData.append('chapter', chapterName);
        formData.append('type', pdfType);

        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Gagal upload PDF ${file.name}`);
        }

        const newDoc = {
          id: String(Date.now() + i),
          title: chapterName,
          type: pdfType,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          status: 'processed',
          date: new Date().toISOString().split('T')[0]
        };
        setDocuments(prev => [newDoc, ...prev]);
        successCount++;
      }

      setUploadStatus({ 
        type: 'success', 
        message: `Berhasil memproses ${successCount} file PDF! Seluruh teks telah dipotong (chunking) dan disimpan ke database.` 
      });
      setPdfFile(null);
      setPdfFiles([]);
      setPdfChapter('');
      fetchDbStats(); // Refresh stats count
    } catch (err: any) {
      console.error(err);
      setUploadStatus({ type: 'error', message: `Gagal mengunggah PDF: ${err.message}` });
    } finally {
      setIsUploading(false);
      setBatchProgress(null);
    }
  };

  // SAVE PROMPT GLOBAL ACTION (TAB 2)
  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    setPromptSaveStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'save_prompt',
          prompt_personality: testPromptPersonality,
          prompt_nutrition: testPromptNutrition,
          prompt_guardrails: testPromptGuardrails,
          prompt_format: testPromptFormat
        })
      });

      const data = await res.json();
      if (data.success) {
        setPromptPersonality(testPromptPersonality);
        setPromptNutrition(testPromptNutrition);
        setPromptGuardrails(testPromptGuardrails);
        setPromptFormat(testPromptFormat);
        setPromptSaveStatus('Semua instruksi AI modular berhasil disimpan secara global untuk seluruh user!');
        setTimeout(() => setPromptSaveStatus(null), 4000);
      } else {
        throw new Error(data.error || 'Gagal menyimpan prompt');
      }
    } catch (err: any) {
      alert(`Error menyimpan prompt: ${err.message}`);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // PLAYGROUND CHAT SEND ACTION (TAB 2)
  const handlePlaygroundSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundInput.trim()) return;

    const userText = playgroundInput;
    const userMsg = { 
      sender: 'user' as const, 
      text: userText, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setPlaygroundMessages((prev) => [...prev, userMsg]);
    setPlaygroundInput('');
    setIsPlaygroundTyping(true);
    setTimeout(scrollPlaygroundToBottom, 50);
    setLastCitations([]);

    try {
      // Panggil API chat biasa, kirim override prompt modular
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          history: playgroundMessages.map(m => ({ sender: m.sender === 'bot' ? 'assistant' : 'user', text: m.text })),
          prompt_personality_override: testPromptPersonality,
          prompt_nutrition_override: testPromptNutrition,
          prompt_guardrails_override: testPromptGuardrails,
          prompt_format_override: testPromptFormat,
          focus_chapter: focusChapter
        }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi AI Server');

      const data = await response.json();
      
      const botMsg = {
        sender: 'bot' as const,
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setPlaygroundMessages((prev) => [...prev, botMsg]);
      if (data.citations) {
        setLastCitations(data.citations);
      }

    } catch (err: any) {
      setPlaygroundMessages((prev) => [...prev, {
        sender: 'bot',
        text: `Playground Error: ${err.message || 'Koneksi gagal'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsPlaygroundTyping(false);
    }
  };

  // INTERVENSI CHAT SUBMIT ACTION (TAB 3)
  const handleSendIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionInput.trim() || !activeSessionId || !selectedUser) return;

    const messageText = interventionInput;
    setInterventionInput('');
    setIsSendingIntervention(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Kirim intervensi sebagai assistant
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'intervene',
          sessionId: activeSessionId,
          content: messageText
        })
      });

      const data = await res.json();
      if (data.success) {
        setUserChatMessages((prev) => [...prev, data.data]);
      } else {
        throw new Error(data.error || 'Gagal mengirim intervensi');
      }
    } catch (err: any) {
      alert(`Gagal intervensi chat: ${err.message}`);
    } finally {
      setIsSendingIntervention(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Memuat sistem autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center border border-red-100 dark:border-red-950/30">
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Akses Ditolak</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
            Halaman ini hanya dapat diakses oleh Administrator Gizi Kebugaran. Anda akan dialihkan ke halaman Login dalam beberapa saat.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mengalihkan...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-gk.jpg" alt="Logo Gizi Kebugaran" className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shadow-sm" />
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                <span>Console Admin Gizi Kebugaran</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
                  SUPABASE ACTIVE
                </span>
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">Panel Kontrol & Intervensi Gizi Kebugaran AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{user?.name}</p>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold uppercase">
                Coach
              </span>
            </div>
            <Link
              href="/chat"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/50 hover:bg-emerald-100/70 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-450 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke Chat</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-semibold text-zinc-500 hover:text-red-650 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-2 flex-shrink-0 z-30 shadow-xl">
          <button
            onClick={() => { setActiveTab('docs'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'docs'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Knowledge Base (Dokumen Rujukan)</span>
          </button>

          <button
            onClick={() => { setActiveTab('playground'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'playground'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span>AI Prompt & Playground</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'users'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>User Manager & Intervensi</span>
          </button>

          <button
            onClick={() => { setActiveTab('details'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${
              activeTab === 'details'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Detail & Metrik User</span>
          </button>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <Link
              href="/chat"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ke Chat Client</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs Subheader */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8 flex-shrink-0 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-2 sm:gap-4 h-12 min-w-max">
          <button
            onClick={() => setActiveTab('docs')}
            className={`h-full px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'docs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Knowledge Base</span>
          </button>
          
          <button
            onClick={() => setActiveTab('playground')}
            className={`h-full px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'playground'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>AI Prompt & Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`h-full px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Manager & Intervensi</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`h-full px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Detail & Metrik User</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        
        {/* STATS HEADER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Chunks Buku</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : `${totalChunks} Vektor`}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">User Terdaftar</p>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : `${totalUsersCount} Pengguna`}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Koneksi Supabase</p>
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Terhubung</span>
              </h3>
            </div>
          </div>
        </div>

        {/* TAB 1: KNOWLEDGE BASE CONTROLLER */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            {/* Form Ingestion (Kiri) */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Upload Teks Rujukan</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUploadMethod('text')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${uploadMethod === 'text' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  📝 Input Teks
                </button>
                <button
                  onClick={() => setUploadMethod('pdf')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${uploadMethod === 'pdf' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  📁 Upload PDF (Lokal)
                </button>
              </div>

              {uploadMethod === 'text' ? (
                <form onSubmit={handleUpload} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Judul Dokumen / Bab</label>
                      <input
                        type="text"
                        required
                        placeholder="Buku Gizi Olahraga Bab 3..."
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Kategori</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option>Nutrition Guideline</option>
                        <option>Meal Plan</option>
                        <option>Fitness Protocol</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Konten Teks Rujukan</label>
                      <textarea
                        required
                        rows={8}
                        placeholder="Tulis atau paste isi bab di sini. Sistem akan otomatis memotong teks dan membuat data pencarian RAG di Supabase..."
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    {uploadStatus && (
                      <div className={`p-3.5 rounded-xl border text-xs flex gap-2.5 items-start mb-4 ${
                        uploadStatus.type === 'success' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400' 
                          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400'
                      }`}>
                        {uploadStatus.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span>{uploadStatus.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Membuat Chunk RAG...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Simpan & Chunking</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                isLocalhost ? (
                  <form onSubmit={handlePdfUpload} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold uppercase text-zinc-400">File PDF (Bisa Pilih Beberapa)</label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Multi-Upload Support
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          required={pdfFiles.length === 0}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setPdfFiles(files);
                            setPdfFile(files[0] || null);
                          }}
                          className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>

                      {/* Selected Files Preview */}
                      {pdfFiles.length > 0 && (
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 max-h-36 overflow-y-auto">
                          <div className="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <span>📁 Terpilih ({pdfFiles.length} File PDF)</span>
                            <button
                              type="button"
                              onClick={() => { setPdfFiles([]); setPdfFile(null); }}
                              className="text-[10px] text-red-500 hover:underline font-semibold"
                            >
                              Hapus Semua
                            </button>
                          </div>
                          {pdfFiles.map((f, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                              <span className="truncate max-w-[200px] font-medium">📄 {f.name}</span>
                              <span className="text-zinc-400 text-[10px]">{(f.size / 1024).toFixed(0)} KB</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">
                          Judul Dokumen / Bab {pdfFiles.length > 1 && <span className="text-zinc-500 text-[10px] font-normal">(Opsional jika upload banyak)</span>}
                        </label>
                        <input
                          type="text"
                          required={pdfFiles.length <= 1}
                          placeholder={pdfFiles.length > 1 ? "Judul prefiks (opsional)..." : "Bab 2: Kebugaran..."}
                          value={pdfChapter}
                          onChange={(e) => setPdfChapter(e.target.value)}
                          className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Kategori</label>
                        <select
                          value={pdfType}
                          onChange={(e) => setPdfType(e.target.value)}
                          className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option>Nutrition Guideline</option>
                          <option>Meal Plan</option>
                          <option>Fitness Protocol</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto">
                      {/* Batch Progress Bar Indicator */}
                      {batchProgress && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5 mb-3">
                          <div className="flex justify-between font-bold">
                            <span>Memproses File {batchProgress.current} dari {batchProgress.total}</span>
                            <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                          </div>
                          <p className="truncate text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">📄 {batchProgress.fileName}</p>
                          <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                          </div>
                        </div>
                      )}

                      {uploadStatus && (
                        <div className={`p-3.5 rounded-xl border text-xs flex gap-2.5 items-start mb-4 ${
                          uploadStatus.type === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400' 
                            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400'
                        }`}>
                          {uploadStatus.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span>{uploadStatus.message}</span>
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={isUploading || (pdfFiles.length === 0 && !pdfFile)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memproses Batch PDF...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            <span>{pdfFiles.length > 1 ? `Proses ${pdfFiles.length} File PDF Sekaligus` : 'Proses PDF (OCR & Chunking)'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mt-4">
                    <p className="text-sm text-amber-800 dark:text-amber-400 flex gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>⚠️ Fitur upload file PDF langsung hanya aktif saat dijalankan di server lokal (localhost). Untuk server hosting, silakan gunakan script <code>ingest_ocr.py</code> dari komputer Anda.</span>
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Documents List (Kanan) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Upload Log History</h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari dokumen..."
                    value={docSearchQuery}
                    onChange={(e) => {
                      setDocSearchQuery(e.target.value);
                      setDocCurrentPage(1);
                    }}
                    className="w-52 pl-9 pr-4 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-x-auto flex flex-col justify-between">
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase text-zinc-400">
                      <th className="px-6 py-3.5">Judul Buku / Bab</th>
                      <th className="px-6 py-3.5">Kategori</th>
                      <th className="px-6 py-3.5">Ukuran</th>
                      <th className="px-6 py-3.5">Tanggal</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                    {paginatedDocuments.length > 0 ? (
                      paginatedDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{doc.title}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">{doc.type}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">{doc.size}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">{doc.date}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Saved to DB
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-xs font-medium">
                          {docSearchQuery ? `Tidak ada dokumen yang cocok dengan "${docSearchQuery}"` : 'Belum ada dokumen terdaftar.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Table Footer with Pagination Controls */}
                <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-950/50 mt-auto">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    Menampilkan <span className="font-semibold text-zinc-900 dark:text-zinc-100">{filteredDocuments.length > 0 ? startDocIdx + 1 : 0}</span> sampai <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.min(startDocIdx + DOCS_PER_PAGE, filteredDocuments.length)}</span> dari <span className="font-semibold text-zinc-900 dark:text-zinc-100">{filteredDocuments.length}</span> dokumen
                  </div>

                  {totalDocPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentDocPage === 1}
                        onClick={() => setDocCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Sebelumnya
                      </button>

                      {Array.from({ length: totalDocPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setDocCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            currentDocPage === page
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentDocPage === totalDocPages}
                        onClick={() => setDocCurrentPage(prev => Math.min(prev + 1, totalDocPages))}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM PROMPT & PLAYGROUND */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            {/* Prompt Editor (Kiri) */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Instruksi AI Terstruktur</h2>
              </div>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Pilih kategori instruksi di bawah ini untuk mengatur cara berpikir, gaya bicara, rumus, dan batasan respon AI secara modular.
              </p>

              {/* Sub-tab untuk kategori prompt */}
              <div className="flex flex-wrap gap-1 mb-4 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl flex-shrink-0">
                <button
                  onClick={() => setActivePromptSubTab('personality')}
                  className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all ${
                    activePromptSubTab === 'personality'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-450 shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                      : 'text-zinc-550 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  🎭 Bahasa
                </button>
                <button
                  onClick={() => setActivePromptSubTab('nutrition')}
                  className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all ${
                    activePromptSubTab === 'nutrition'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-450 shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                      : 'text-zinc-550 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  🍏 Gizi
                </button>
                <button
                  onClick={() => setActivePromptSubTab('guardrails')}
                  className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all ${
                    activePromptSubTab === 'guardrails'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-450 shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                      : 'text-zinc-550 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  🛡️ Proteksi
                </button>
                <button
                  onClick={() => setActivePromptSubTab('format')}
                  className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all ${
                    activePromptSubTab === 'format'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-450 shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                      : 'text-zinc-550 dark:text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-250'
                  }`}
                >
                  📝 Format
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {activePromptSubTab === 'personality' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Gaya Bicara & Kepribadian</label>
                      <textarea
                        rows={10}
                        value={testPromptPersonality}
                        onChange={(e) => setTestPromptPersonality(e.target.value)}
                        placeholder="Gaya bicara Coach (energik, menyapa 'User', kesantunan, dsb)..."
                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {activePromptSubTab === 'nutrition' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Protokol Gizi & Rumus Sains</label>
                      <textarea
                        rows={10}
                        value={testPromptNutrition}
                        onChange={(e) => setTestPromptNutrition(e.target.value)}
                        placeholder="Aturan sains gizi, rumus kalori, asupan protein, dsb..."
                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {activePromptSubTab === 'guardrails' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Batasan Topik & Proteksi (Guardrails)</label>
                      <textarea
                        rows={10}
                        value={testPromptGuardrails}
                        onChange={(e) => setTestPromptGuardrails(e.target.value)}
                        placeholder="Hal-hal yang dilarang (saran medis klinis keras, topik politik, dsb)..."
                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {activePromptSubTab === 'format' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Format Jawaban & Tampilan</label>
                      <textarea
                        rows={10}
                        value={testPromptFormat}
                        onChange={(e) => setTestPromptFormat(e.target.value)}
                        placeholder="Aturan tampilan (tanda tebal, emoji, panjang paragraf, poin, dsb)..."
                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  <div className="mt-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      💡 Ubah teks di atas, lalu tes secara langsung di **Playground (Kanan)** sebelum menyimpannya ke publik.
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                  {promptSaveStatus && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs mb-3 font-semibold animate-pulse">
                      {promptSaveStatus}
                    </div>
                  )}

                  <button
                    onClick={handleSavePrompt}
                    disabled={isSavingPrompt}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Simpan & Terapkan Global</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Playground Simulator (Kanan) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Playground AI Simulator</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fokus Dokumen:</label>
                    <select
                      value={focusChapter}
                      onChange={(e) => setFocusChapter(e.target.value)}
                      className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="__all__">Semua Dokumen (Default)</option>
                      {availableChapters.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] bg-sky-100 text-sky-850 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200 dark:border-sky-900/30 px-2 py-1 rounded-full uppercase font-bold tracking-wider">
                    Test Sandbox
                  </span>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/20">
                {playgroundMessages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3.5 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase ${
                      msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white border border-zinc-800'
                    }`}>
                      {msg.sender === 'user' ? 'AD' : 'AI'}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm text-sm border ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white border-transparent rounded-tr-none'
                        : 'bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 rounded-tl-none'
                    }`}>
                      {renderMessageText(msg.text)}
                      <span className={`block text-[10px] mt-2.5 ${msg.sender === 'user' ? 'text-emerald-100' : 'text-zinc-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isPlaygroundTyping && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center border border-zinc-800 font-bold text-xs uppercase animate-pulse">
                      AI
                    </div>
                    <div className="bg-white dark:bg-zinc-850 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm rounded-tl-none flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>AI sedang mengetik respon...</span>
                    </div>
                  </div>
                )}
                
                <div ref={playgroundEndRef} />
              </div>

              {/* RAG Context details visualizer */}
              {lastCitations.length > 0 && (
                <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-amber-500/5 flex items-start gap-2">
                  <Database className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-800 dark:text-amber-400 leading-normal">
                    <span className="font-bold">Database Rujukan pgvector:</span> Jawaban di atas berhasil menyerap rujukan dari{' '}
                    {lastCitations.map((c, i) => (
                      <span key={i} className="underline font-semibold mx-0.5">
                        "{c.title}" (Hal. {c.page})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handlePlaygroundSend} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
                <input
                  type="text"
                  value={playgroundInput}
                  onChange={(e) => setPlaygroundInput(e.target.value)}
                  placeholder="Ketik pertanyaan uji coba AI di sini..."
                  className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGER & LIVE INTERVENTION */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px] lg:h-[650px]">
            {/* User List Panel (Kiri) */}
            <div className={`${selectedUser ? 'hidden lg:flex' : 'flex'} lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex-col h-full overflow-hidden`}>
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Daftar Pengguna / User</h2>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari user..."
                    className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Users List Container */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850">
                {isUsersLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Memuat daftar user...</p>
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Belum ada user yang terdaftar di database.
                  </div>
                ) : (
                  usersList.map((userItem) => (
                    <button
                      key={userItem.id}
                      onClick={() => setSelectedUser(userItem)}
                      className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 flex items-center gap-3 transition-colors ${
                        selectedUser?.id === userItem.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-r-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm uppercase">
                        {(userItem.full_name || 'User').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                          {userItem.full_name || 'User Tanpa Nama'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">
                            {userItem.gender || 'N/A'}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-800">•</span>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            {(userItem.goal_type || 'maintenance').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Intervention Window (Tengah & Kanan) */}
            <div className={`${selectedUser ? 'flex' : 'hidden lg:flex'} lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex-col h-full overflow-hidden`}>
              {selectedUser ? (
                <>
                  {/* Active Header */}
                  <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedUser(null)} 
                        className="lg:hidden text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50"
                      >
                        ← User List
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          Memantau Chat: {selectedUser.full_name || 'User'}
                        </h3>
                        <p className="text-[10px] text-zinc-400">
                          Sesi aktif: {activeSessionId || <Loader2 className="w-3 h-3 animate-spin inline ml-1" />} (Perbarui otomatis setiap 3 detik)
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40 px-2.5 py-1 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      LIVE FEED
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/10">
                    {userChatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-8 text-zinc-400">
                        <div>
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                          <p className="text-xs">Sesi chat aktif kosong atau belum ada pesan terkirim.</p>
                        </div>
                      </div>
                    ) : (
                      userChatMessages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3.5 max-w-3xl ${msg.sender === 'user' ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase ${
                            msg.sender === 'user' ? 'bg-sky-600 text-white' : 'bg-zinc-900 text-white border border-zinc-800 ring-2 ring-emerald-500/20'
                          }`}>
                            {msg.sender === 'user' ? 'AT' : 'AI'}
                          </div>
                          <div className={`p-4 rounded-2xl shadow-sm text-sm border ${
                            msg.sender === 'user'
                              ? 'bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 rounded-tl-none'
                              : 'bg-emerald-600 text-white border-transparent rounded-tr-none'
                          }`}>
                            {renderMessageText(msg.content)}
                            <span className={`block text-[9px] mt-2 ${msg.sender === 'user' ? 'text-zinc-400' : 'text-emerald-100'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={userChatEndRef} />
                  </div>

                  {/* Intervene Input Form */}
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                      <span className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider">
                        Intervensi Coach: mengetik pesan di bawah ini akan memotong AI dan mengirim pesan Anda sebagai "Coach"
                      </span>
                    </div>

                    <form onSubmit={handleSendIntervention} className="flex gap-2">
                      <input
                        type="text"
                        value={interventionInput}
                        onChange={(e) => setInterventionInput(e.target.value)}
                        placeholder="Ketik pesan balasan pelatih untuk intervensi di sini..."
                        className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={isSendingIntervention || !interventionInput.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-50"
                      >
                        {isSendingIntervention ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Kirim Intervensi</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8 text-zinc-400">
                  <div>
                    <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300 animate-pulse" />
                    <h3 className="text-sm font-bold mb-1 text-zinc-700 dark:text-zinc-300">Pantau Riwayat & Intervensi</h3>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      Silakan pilih salah satu user dari daftar sebelah kiri untuk memantau percakapan aktif mereka dengan AI dan mengirim pesan intervensi jika diperlukan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: USER DETAILS & INBODY LOGS PROGRESS */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px] lg:h-[650px]">
            {/* User List Panel (Kiri) */}
            <div className={`${selectedUser ? 'hidden lg:flex' : 'flex'} lg:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex-col h-full overflow-hidden`}>
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Daftar Pengguna / User</h2>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari user..."
                    className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Users List Container */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850">
                {isUsersLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Memuat daftar user...</p>
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Belum ada user yang terdaftar di database.
                  </div>
                ) : (
                  usersList.map((userItem) => (
                    <button
                      key={userItem.id}
                      onClick={() => setSelectedUser(userItem)}
                      className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 flex items-center gap-3 transition-colors ${
                        selectedUser?.id === userItem.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-r-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm uppercase">
                        {(userItem.full_name || 'User').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                          {userItem.full_name || 'User Tanpa Nama'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">
                            {userItem.gender || 'N/A'}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-800">•</span>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            {(userItem.goal_type || 'maintenance').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* User Details & InBody Logs Panel (Kanan) */}
            <div className={`${selectedUser ? 'flex' : 'hidden lg:flex'} lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex-col h-full overflow-y-auto p-6`}>
              {selectedUser ? (
                <div className="space-y-6">
                  {/* Mobile Back Button */}
                  <button 
                    onClick={() => setSelectedUser(null)} 
                    className="lg:hidden text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 mb-2 self-start"
                  >
                    ← Kembali ke Daftar User
                  </button>

                  {/* Title */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Profil & Progress Metrik: {selectedUser.full_name || 'User'}
                    </h3>
                    <p className="text-[10px] text-zinc-400">ID User: {selectedUser.id}</p>
                  </div>

                  {/* Profile info cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Tinggi Badan</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1">{selectedUser.height_cm || 175} cm</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Jenis Kelamin</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1 capitalize">{selectedUser.gender || 'pria'}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Program Target</p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 uppercase text-xs truncate">
                        {(selectedUser.goal_type || 'maintenance').replace('_', ' ')}
                      </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Level Aktivitas</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1 capitalize text-xs truncate">{selectedUser.activity_level || 'aktif'}</p>
                    </div>
                  </div>

                  {/* InBody Progress Chart */}
                  <div className="bg-white dark:bg-zinc-950 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Grafik Komposisi Tubuh (InBody Progress)</span>
                    </h4>

                    {isLogsLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      </div>
                    ) : userLogs.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        Belum ada catatan timbangan tersimpan untuk user ini.
                      </div>
                    ) : (
                      <div className="w-full">
                        <ProgressChart data={userLogs} />
                      </div>
                    )}
                  </div>

                  {/* Weight Logs Table */}
                  <div className="bg-white dark:bg-zinc-955 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Riwayat Catatan Timbangan</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
                            <th className="px-5 py-3">Tanggal</th>
                            <th className="px-5 py-3">Berat</th>
                            <th className="px-5 py-3">Otot (SMM)</th>
                            <th className="px-5 py-3">Lemak (BFM)</th>
                            <th className="px-5 py-3">Kalori</th>
                            <th className="px-5 py-3">Protein</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
                          {userLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                              <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                                {new Date(log.date).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="px-5 py-3 text-sky-600 dark:text-sky-400 font-bold">{log.weight} kg</td>
                              <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-bold">{log.muscle} kg</td>
                              <td className="px-5 py-3 text-rose-600 dark:text-rose-400 font-bold">{log.fat} kg</td>
                              <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                                {log.calories ? `${log.calories} kcal` : '-'}
                              </td>
                              <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                                {log.protein ? `${log.protein} g` : '-'}
                              </td>
                            </tr>
                          ))}
                          {userLogs.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                                Tidak ada log tersimpan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Target Card */}
                  {userTargets && userTargets.length > 0 && (
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-5">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Target User</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Berat Awal</p>
                          <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1">{userTargets[0].start_weight_kg} kg</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Target Berat</p>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">{userTargets[0].target_weight_kg} kg</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Target Kalori</p>
                          <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1">{userTargets[0].target_calories} kcal</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Target Protein</p>
                          <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 mt-1">{userTargets[0].target_protein_g} g</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Workouts */}
                  {userWorkouts && userWorkouts.length > 0 && (
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Latihan Diselesaikan
                        </h4>
                      </div>
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userWorkouts.map((workout: any) => (
                          <div key={workout.id} className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{new Date(workout.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{workout.intensity}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-1 font-semibold">Durasi: {workout.duration_minutes} mnt</p>
                            {workout.notes && <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">"{workout.notes}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food Logs Section */}
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        Riwayat Asupan Makanan User
                      </h4>
                      <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded-full text-zinc-500">
                        {userFoodLogs.length} Menu Terdaftar
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {userFoodLogs && userFoodLogs.length > 0 ? (
                        userFoodLogs.map((food: any) => (
                          <div key={food.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">
                                {food.meal_type === 'sarapan' ? '🌅' : food.meal_type === 'makan_siang' ? '☀️' : food.meal_type === 'makan_malam' ? '🌙' : '🍿'}
                              </span>
                              <div>
                                <h5 className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{food.food_name}</h5>
                                <p className="text-[10px] text-zinc-400 capitalize">{food.date} • {food.meal_type?.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-zinc-800 dark:text-zinc-200">{food.calories} kcal</p>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{food.protein}g protein</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 py-4 text-center">Belum ada catatan asupan makanan dari user ini.</p>
                      )}
                    </div>
                  </div>

                  {/* Review Creator */}
                  <div className="bg-white dark:bg-zinc-950 rounded-xl border border-emerald-200 dark:border-emerald-900/50 overflow-hidden shadow-sm">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4 border-b border-emerald-100 dark:border-emerald-900/50">
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Weekly Progress Review Creator
                      </h4>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Minggu Ke</label>
                          <input type="number" value={reviewWeekNumber} onChange={(e) => setReviewWeekNumber(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Mulai</label>
                          <input type="date" value={reviewStartDate} onChange={(e) => setReviewStartDate(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Selesai</label>
                          <input type="date" value={reviewEndDate} onChange={(e) => setReviewEndDate(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Perubahan Berat (kg)</label>
                          <input type="number" step="0.1" value={reviewWeightChange} onChange={(e) => setReviewWeightChange(e.target.value)} placeholder="Contoh: -1.5" className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Kepatuhan (%)</label>
                          <input type="number" value={reviewComplianceScore} onChange={(e) => setReviewComplianceScore(e.target.value)} placeholder="Contoh: 85" className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                      </div>

                      <button onClick={handleGenerateWeeklyAiFeedback} disabled={isGeneratingAiReview} className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-zinc-200 dark:border-zinc-700">
                        {isGeneratingAiReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
                        Generate AI Weekly Feedback
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">AI Review Text (Draft)</label>
                          <textarea rows={5} value={aiReviewText} onChange={(e) => setAiReviewText(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed" placeholder="Teks review dari AI..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Coach Feedback / Notes</label>
                          <textarea rows={5} value={coachFeedbackInput} onChange={(e) => setCoachFeedbackInput(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed" placeholder="Catatan manual dari Coach..." />
                        </div>
                      </div>

                      <button onClick={handleSaveWeeklyReview} disabled={isSavingWeeklyReview} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all">
                        {isSavingWeeklyReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Publish Weekly Review Card
                      </button>
                    </div>
                  </div>

                  {/* Past Reviews List */}
                  {userReviews && userReviews.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Riwayat Review Mingguan
                      </h4>
                      {userReviews.map((review: any) => (
                        <div key={review.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                          <div className="flex justify-between items-center mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Minggu {review.week_number}</span>
                            <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded text-zinc-500">
                              {new Date(review.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(review.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Perubahan Berat</p>
                              <p className={`text-sm font-black mt-1 ${review.weight_change < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{review.weight_change > 0 ? '+' : ''}{review.weight_change} kg</p>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Kepatuhan Target</p>
                              <p className="text-sm font-black text-sky-600 dark:text-sky-400 mt-1">{review.compliance_score}%</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {review.ai_feedback && (
                              <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">AI Review</p>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap border border-zinc-100 dark:border-zinc-800">
                                  {review.ai_feedback}
                                </div>
                              </div>
                            )}
                            {review.coach_feedback && (
                              <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1.5">
                                  <Award className="w-3 h-3 text-emerald-600" />
                                  Coach Notes
                                </p>
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap border border-emerald-100 dark:border-emerald-800/30 font-medium">
                                  {review.coach_feedback}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-zinc-400 p-8">
                  <div>
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-zinc-300 animate-pulse" />
                    <h3 className="text-sm font-bold mb-1 text-zinc-755 dark:text-zinc-300">Pantau Progress Metrik</h3>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      Silakan pilih salah satu user dari daftar sebelah kiri untuk memantau grafik timbangan InBody, profil latihan, dan asupan gizi mereka.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Fungsi pembantu untuk memparsing markdown sederhana (bold, list item, subheaders)
const renderMessageText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('###')) {
          return (
            <h3 key={idx} className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 mt-4 mb-2 tracking-tight">
              {parseBold(trimmed.replace(/^###\s*/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('##')) {
          return (
            <h2 key={idx} className="text-base font-black text-zinc-950 dark:text-zinc-50 mt-5 mb-2.5 tracking-tight">
              {parseBold(trimmed.replace(/^##\s*/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('#')) {
          return (
            <h1 key={idx} className="text-lg font-black text-zinc-950 dark:text-zinc-50 mt-6 mb-3 tracking-tight">
              {parseBold(trimmed.replace(/^#\s*/, ''))}
            </h1>
          );
        }
        
        // Bullet points
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          return (
            <ul key={idx} className="list-disc pl-5 my-0.5 text-zinc-800 dark:text-zinc-200">
              <li className="leading-relaxed">
                {parseBold(trimmed.replace(/^[*|-]\s*/, ''))}
              </li>
            </ul>
          );
        }
        
        // Empty lines
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }
        
        // Normal paragraph
        return (
          <p key={idx} className="leading-relaxed text-zinc-850 dark:text-zinc-150">
            {parseBold(line)}
          </p>
        );
      })}
    </div>
  );
};

const parseBold = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-zinc-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};
