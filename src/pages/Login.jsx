import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import logoImg from '../assets/images/logo-shop-net.png';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, Activity, Terminal, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSuccess) return; // Chặn bấm nhiều lần khi đã thành công

    setLoading(true);
    setErrorShake(false);
    setErrorMessage('');
    
    // Đăng nhập bình thường với supabase mày đã import
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      setErrorShake(true);
      setErrorMessage("TRUY CẬP BỊ TỪ CHỐI: SAI THÔNG TIN");
      setTimeout(() => setErrorShake(false), 500);
      setLoading(false);
    } else {
      // 1. KÍCH HOẠT TRẠNG THÁI THÀNH CÔNG (ĐÈN XANH LÊN)
      setIsSuccess(true);
      setLoading(false);
      
      // 2. PHANH LẠI 3 GIÂY ĐỂ NGẮM. 
      // Không cần dùng persistSession: false nữa vì ta sẽ dùng window.location để điều hướng cứng
      setTimeout(() => {
        window.location.href = '/dashboard'; 
      }, 3000); 
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
      
      {/* 1. HIỆU ỨNG ĐÈN NỀN & GRID */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      {/* CHỖ NÀY: Giữ opacity-100 để không bị trắng trang/biến mất */}
      <div className={`w-full max-w-md z-10 transition-all duration-1000 ${isSuccess ? 'scale-105' : 'scale-100'}`}>
        
        {/* 2. KHU VỰC LOGO & KHIÊN BẢO MẬT */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            
            <div className="relative p-1.5 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl ring-1 ring-white/10 overflow-visible">
              
              <div className="relative overflow-hidden rounded-[2.2rem] bg-black/20">
                <img 
                  src={logoImg} 
                  alt="Logo SalesHub" 
                  className="w-32 h-32 object-contain p-4 relative z-10" 
                />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-fast"></div>
              </div>

              <div className={`absolute -bottom-1 -right-1 p-2.5 rounded-xl border-4 border-[#020617] shadow-lg flex items-center justify-center overflow-hidden transition-all duration-500 z-20 ${isSuccess ? 'bg-green-500 shadow-[0_0_20px_#22c55e] scale-110' : 'bg-blue-600 shadow-blue-500 animate-super-float'}`}>
                <ShieldCheck size={22} className="text-white relative z-10" />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. KHUNG FORM ĐĂNG NHẬP */}
        <div className={`
          bg-slate-900/40 backdrop-blur-2xl border p-10 rounded-[3rem] shadow-2xl transition-all duration-500
          ${errorShake ? 'animate-shake border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10'}
          ${isSuccess ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)] bg-green-500/5' : ''}
        `}>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
                <Terminal size={14} className={isSuccess ? 'text-green-500' : 'text-blue-500'} />
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
                  {isSuccess ? 'ACCESS GRANTED' : 'Secure Terminal v2.0'}
                </h2>
            </div>
            
            <div className="relative inline-block">
               <h1 className={`text-3xl font-black uppercase tracking-tighter italic bg-clip-text text-transparent animate-text-shimmer transition-all duration-700 bg-gradient-to-r from-slate-400 via-white to-slate-400 ${isSuccess ? 'from-green-400 via-white to-green-400' : ''}`}>
                  Mắt Kính Sài Gòn
               </h1>
               
               <div className="relative h-[2px] w-full mt-2 overflow-hidden bg-white/5 rounded-full">
                  <div className={`absolute inset-0 w-[200%] animate-line-chase-reverse ${isSuccess ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-infinite-chase-reverse'}`}></div>
               </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="text-red-500" size={18} />
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{errorMessage}</p>
              </div>
            )}

            <div className="relative group">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSuccess ? 'text-green-500' : 'text-slate-500 group-focus-within:text-blue-400'}`} size={20} />
              <input 
                type="email" 
                required
                readOnly={isSuccess}
                className={`w-full bg-black/40 border rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all font-bold placeholder:text-slate-600 ${isSuccess ? 'border-green-500/50' : 'border-white/5 focus:ring-2 focus:ring-blue-500/50'}`}
                placeholder="Email Hệ Thống"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSuccess ? 'text-green-500' : 'text-slate-500 group-focus-within:text-blue-400'}`} size={20} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                readOnly={isSuccess}
                className={`w-full bg-black/40 border rounded-2xl py-4 pl-12 pr-12 text-white outline-none transition-all font-bold placeholder:text-slate-600 ${isSuccess ? 'border-green-500/50' : 'border-white/5 focus:ring-2 focus:ring-blue-500/50'}`}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!isSuccess && (
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
                >
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              )}
            </div>

            <button 
              disabled={loading || isSuccess}
              className={`w-full py-4 rounded-2xl font-black uppercase text-sm shadow-lg transition-all flex items-center justify-center gap-3 relative overflow-hidden group
                ${isSuccess ? 'bg-green-600 shadow-[0_0_25px_#22c55e] text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} 
                disabled:opacity-90`}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              {loading ? (
                <Loader2 className="animate-spin" size={20} /> 
              ) : isSuccess ? (
                <span className="flex items-center gap-2 tracking-widest">HỆ THỐNG ĐÃ MỞ <ShieldCheck size={18}/></span>
              ) : (
                <>Đăng Nhập Hệ Thống <Activity size={18} /></>
              )}
            </button>
          </form>

          {/* 4. ĐÈN TRẠNG THÁI */}
          <div className="mt-10 pt-6 border-t border-white/5 text-center">
             <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border transition-all duration-500 ${isSuccess ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_1px] ${
                  isSuccess 
                  ? 'bg-green-500 shadow-green-500 animate-pulse' 
                  : errorShake ? 'bg-red-500 shadow-red-500' : 'animate-warning-light'
                }`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest italic transition-colors ${isSuccess ? 'text-green-400' : 'text-slate-400'}`}>
                  {isSuccess ? "Truy Cập Thành Công" : "Hệ Thống Được Bảo Vệ"}
                </span>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes warning-light {
          0%, 49% { background-color: #ef4444; box-shadow: 0 0 12px #ef4444; } 
          50%, 100% { background-color: #fbbf24; box-shadow: 0 0 12px #fbbf24; }    
        }
        .animate-warning-light { animation: warning-light 1s infinite; }
        @keyframes text-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .animate-text-shimmer { animation: text-shimmer 3s infinite linear; }
        @keyframes line-chase-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .bg-infinite-chase-reverse { background: linear-gradient(to left, transparent 0%, rgba(59, 130, 246, 0.8) 25%, transparent 50%, rgba(59, 130, 246, 0.8) 75%, transparent 100%); background-size: 50% 100%; }
        .animate-line-chase-reverse { animation: line-chase-reverse 2s infinite linear; }
        @keyframes super-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        .animate-super-float { animation: super-float 4s infinite ease-in-out; }
        @keyframes shimmer { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(150%) skewX(-20deg); } }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        .animate-shimmer-fast { animation: shimmer 3s infinite linear; animation-delay: 1s; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}} />
    </div>
  );
}