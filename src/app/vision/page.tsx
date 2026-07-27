'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import EditProfileModal from '@/components/profile/EditProfileModal';
import {
  Camera,
  Sparkles,
  Upload,
  RefreshCw,
  Plus,
  CheckCircle2,
  Utensils,
  TrendingUp,
  MessageSquare,
  BookOpen,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Dumbbell,
  Calculator,
  ScanLine,
  Loader2,
  ChevronRight,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface ScannedFoodResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
}

export default function VisionPage() {
  const { user, loading, logout } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Vision scanner states
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedFoodResult | null>(null);
  const [aiCoachAdvice, setAiCoachAdvice] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Webcam states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading]);

  // Start / Stop Camera Stream
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Gagal membuka kamera:', err);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan opsi Upload Foto.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  // Capture photo from camera stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCamera();
      analyzeImage(dataUrl);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setSelectedImage(dataUrl);
        analyzeImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Call API Groq Vision
  const analyzeImage = async (base64Img: string) => {
    setIsScanning(true);
    setScanResult(null);
    setAiCoachAdvice(null);
    setLogSuccessMessage(null);

    try {
      // Call JSON analysis
      const resJson = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Img, mode: 'json' })
      });
      const dataJson = await resJson.json();
      setScanResult(dataJson);

      // Call Coach advice analysis
      const resText = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Img, mode: 'text' })
      });
      const dataText = await resText.json();
      setAiCoachAdvice(dataText.text || null);

    } catch (err) {
      console.error('Error analyzing image:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Log scanned food into Supabase food_logs
  const handleSaveToFoodLog = async () => {
    if (!scanResult) return;
    setIsLogging(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const todayStr = new Date().toISOString().split('T')[0];

      if (userId) {
        await supabase
          .from('food_logs')
          .insert({
            user_id: userId,
            date: todayStr,
            meal_type: 'makan_siang',
            food_name: scanResult.food_name,
            calories: scanResult.calories || 350,
            protein: scanResult.protein || 30
          });
      }

      setLogSuccessMessage(`✅ Menu "${scanResult.food_name}" (${scanResult.calories} kcal) berhasil dicatat ke Jurnal Makanan!`);
      setTimeout(() => setLogSuccessMessage(null), 4000);

    } catch (err) {
      console.error('Gagal mencatat makanan:', err);
    } finally {
      setIsLogging(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-72 w-72 h-screen bg-zinc-900 text-zinc-100 flex-col border-r border-zinc-800 flex-shrink-0 overflow-hidden sticky top-0 z-20">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-900/40">
            GK
          </div>
          <div>
            <h1 className="font-bold text-sm text-zinc-50 tracking-tight">Gizi Kebugaran AI</h1>
            <p className="text-[10px] font-medium text-emerald-400">Coach Mury Platform</p>
          </div>
        </div>

        {/* User Card */}
        <div 
          onClick={() => setShowProfileModal(true)}
          className="p-4 mx-4 my-4 bg-zinc-800/50 hover:bg-zinc-800/80 rounded-2xl border border-zinc-800 flex items-center gap-3 cursor-pointer transition-all group"
          title="Klik untuk ubah profil"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold uppercase flex-shrink-0 border-2 border-emerald-500/50 shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">{user?.name}</p>
              <UserIcon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
          <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Menu Utama</p>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot AI</span>
          </Link>
          <Link href="/vision" className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors">
            <Camera className="w-4 h-4 text-emerald-500" />
            <span>📸 AI Food Scanner</span>
          </Link>
          <Link href="/food-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Makanan</span>
          </Link>
          <Link href="/workout-log" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
            <span>Jurnal Olahraga</span>
          </Link>
          <Link href="/metrics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <TrendingUp className="w-4 h-4" />
            <span>Komposisi Tubuh & Target</span>
          </Link>
          <Link href="/calculator" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span>Kalkulator TDEE & Makro</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800/40 text-sm transition-colors">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Console Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm font-semibold transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex">
          <div className="fixed inset-0" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-80 max-w-[85vw] bg-zinc-900 text-white flex flex-col h-full z-10 shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-sm">GK</div>
                <span className="font-bold text-sm">Gizi Kebugaran AI</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-zinc-400"><X className="w-5 h-5" /></button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>Chatbot AI</span>
              </Link>
              <Link href="/vision" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800 text-white text-sm rounded-xl font-bold">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>📸 AI Food Scanner</span>
              </Link>
              <Link href="/food-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <Utensils className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Makanan</span>
              </Link>
              <Link href="/workout-log" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                <span>Jurnal Olahraga</span>
              </Link>
              <Link href="/metrics" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Komposisi Tubuh & Target</span>
              </Link>
              <Link href="/calculator" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 text-sm">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>Kalkulator TDEE & Makro</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl text-sm font-semibold">
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden bg-emerald-600 p-2 rounded-xl text-white active:scale-95">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Pemindai Makanan AI (Vision Scanner)</h2>
              <p className="text-xs text-zinc-400">Analisis Nutrisi & Kalori Makanan Otomatis Berbasis Gambar</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto pb-24">
          
          {/* Success Toast */}
          {logSuccessMessage && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{logSuccessMessage}</span>
            </div>
          )}

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-zinc-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-emerald-500/30 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>GROQ MULTIMODAL VISION AI</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Scan Foto Makanan & Dapatkan Makronutrisi Seketika!</h3>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Foto makanan Anda via kamera ponsel atau unggah dari galeri. AI Vision Coach Mury akan secara otomatis mengenali nama hidangan, porsi, kalori, serta kadar protein dalam hitungan detik.
            </p>

            {/* Mode Selector */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'upload'
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>📁 Upload dari Galeri</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('camera')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'camera'
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 Kamera Langsung (Webcam)</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Scanner Viewport & Results Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel: Viewport / Camera / Upload Dropzone */}
            <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              
              {/* Viewport Box */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-950 border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex items-center justify-center shadow-inner group">
                
                {/* Mode Camera Stream */}
                {mode === 'camera' && (
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    muted 
                  />
                )}

                {/* Selected Image Preview */}
                {mode === 'upload' && selectedImage && (
                  <img 
                    src={selectedImage} 
                    alt="Foto Makanan" 
                    className="w-full h-full object-cover" 
                  />
                )}

                {/* Default Upload Dropzone Overlay */}
                {mode === 'upload' && !selectedImage && (
                  <label className="cursor-pointer flex flex-col items-center justify-center p-8 text-center space-y-3 w-full h-full">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-zinc-900 dark:text-white">Klik untuk Unggah Foto Makanan</p>
                      <p className="text-xs text-zinc-400 mt-1">Format: JPG, PNG, WEBP (Maksimal 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                )}

                {/* Laser Scan Animation Line when Scanning */}
                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400 animate-pulse absolute top-1/2 -translate-y-1/2" />
                    <div className="bg-black/80 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-500/50 shadow-2xl">
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>Groq AI sedang menganalisis foto makanan...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Control Buttons */}
              <div className="flex items-center gap-3">
                {mode === 'camera' && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isScanning}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil & Analisis Foto</span>
                  </button>
                )}

                {mode === 'upload' && selectedImage && (
                  <label className="w-full cursor-pointer py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 active:scale-95">
                    <RefreshCw className="w-4 h-4" />
                    <span>Ganti Foto Makanan</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

            </div>

            {/* Right Panel: AI Scanner Results Card */}
            <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white">Hasil Identifikasi Makanan</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    AI VISION VERIFIED
                  </span>
                </div>

                {/* Analysis Body */}
                {scanResult ? (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    
                    {/* Food Title & Calories */}
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Hidangan Terdeteksi
                      </span>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">{scanResult.food_name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{scanResult.description}</p>
                    </div>

                    {/* Macro Cards Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-zinc-400">Kalori</p>
                        <p className="text-lg font-black text-amber-500">{scanResult.calories} <span className="text-xs font-normal">kcal</span></p>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-zinc-400">Protein</p>
                        <p className="text-lg font-black text-emerald-500">{scanResult.protein} <span className="text-xs font-normal">g</span></p>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-0.5">
                        <p className="text-[9px] font-bold uppercase text-zinc-400">Karbohidrat</p>
                        <p className="text-lg font-black text-sky-500">{scanResult.carbs || 30} <span className="text-xs font-normal">g</span></p>
                      </div>
                    </div>

                    {/* AI Coach Mury Evaluation */}
                    {aiCoachAdvice && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Analisis Gizi & Catatan AI Coach Mury</span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {aiCoachAdvice}
                        </p>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-16 text-center text-zinc-400 space-y-3">
                    <ScanLine className="w-12 h-12 mx-auto opacity-20" />
                    <p className="text-xs max-w-xs mx-auto">
                      Unggah atau ambil foto piring makanan Anda di sebelah kiri untuk melihat rincian kalori & protein secara otomatis.
                    </p>
                  </div>
                )}
              </div>

              {/* 1-Click Log Button */}
              {scanResult && (
                <button
                  type="button"
                  onClick={handleSaveToFoodLog}
                  disabled={isLogging}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isLogging ? 'Menyimpan ke Jurnal...' : 'Catat Makanan Ini ke Jurnal'}</span>
                </button>
              )}

            </div>

          </div>

        </div>
      </main>

      {/* Modal Edit Profil */}
      <EditProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
