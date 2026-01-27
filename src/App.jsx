import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './utils/supabaseClient'; 
import Login from './pages/Login'; 
import Inventory from './features/Inventory'; 
import POS from './features/POS';
import Customers from './features/Customers'; 
import Orders from './features/Orders';
import Dashboard from './features/Dashboard'; 
import SettingsPage from './features/Settings';
import { ShoppingCart, Package, LayoutDashboard, Settings, Users, ClipboardList, LogOut } from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false); // CHỐT CHẶN: Để phanh lại 3 giây
  const [timeLeft, setTimeLeft] = useState(30); 
  const timerRef = useRef(null);

  // 1. Quản lý trạng thái đăng nhập
  useEffect(() => {
    // Kiểm tra session lúc đầu
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) setIsReady(true); // Nếu đã đăng nhập sẵn từ trước thì vào thẳng
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      if (_ev === 'SIGNED_IN') {
        // NẾU LÀ ĐĂNG NHẬP MỚI: Phanh lại 3 giây để ngắm đèn xanh bên Login
        setSession(s);
        setTimeout(() => {
          setIsReady(true);
        }, 3000);
      } else if (_ev === 'SIGNED_OUT') {
        setSession(null);
        setIsReady(false);
      } else {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Logic đếm ngược 30s (Giữ nguyên của mày, không đụng vào)
  useEffect(() => {
    if (!session || !isReady) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          supabase.auth.signOut().then(() => window.location.reload());
          return 30; // Trả về 30 theo logic cũ của mày
        }
        return prev - 1;
      });
    }, 1000);

    const handleActivity = () => setTimeLeft(30); // Reset về 30 theo logic cũ
    const events = ['mousemove', 'keypress', 'mousedown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [session, isReady]);

  // NẾU CHƯA CÓ SESSION HOẶC CHƯA HẾT 3 GIÂY CHỜ THÌ VẪN Ở LẠI LOGIN
  if (!session || !isReady) return <Login />;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* HUD Hiển thị đếm ngược */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[999] bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">
        Phiên làm việc sắp hết: {timeLeft}s
      </div>

      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-3xl font-black text-blue-400 italic tracking-tighter">SalesHub SaiGonOptic</h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest italic text-center">Version 2.0 Online</p>
        </div>
        
        <nav className="mt-8 flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <button onClick={() => setTab('dashboard')} className={`w-full flex items-center p-4 rounded-2xl font-bold transition-all ${tab==='dashboard'?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard className="mr-3" size={20}/> Báo cáo chung
          </button>
          <button onClick={() => setTab('pos')} className={`w-full flex items-center p-4 rounded-2xl font-bold transition-all ${tab==='pos'?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'text-slate-400 hover:bg-slate-800'}`}>
            <ShoppingCart className="mr-3" size={20}/> Màn hình bán hàng
          </button>
          <button onClick={() => setTab('items')} className={`w-full flex items-center p-4 rounded-2xl font-bold transition-all ${tab==='items'?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'text-slate-400 hover:bg-slate-800'}`}>
            <Package className="mr-3" size={20}/> Quản lý kho hàng
          </button>
          <button onClick={() => setTab('customers')} className={`w-full flex items-center p-4 rounded-2xl font-bold transition-all ${tab==='customers'?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'text-slate-400 hover:bg-slate-800'}`}>
            <Users className="mr-3" size={20}/> Quản lý khách hàng
          </button>
          <button onClick={() => setTab('orders')} className={`w-full flex items-center p-4 rounded-2xl font-bold transition-all ${tab==='orders'?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'text-slate-400 hover:bg-slate-800'}`}>
            <ClipboardList className="mr-3" size={20}/> Lịch sử đơn hàng
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={() => { supabase.auth.signOut().then(() => window.location.reload()); }} className="w-full flex items-center p-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all">
             <LogOut className="mr-3" size={18}/> Đăng xuất
           </button>
        </div>

        <div className="p-6 border-t border-slate-800">
            <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Máy chủ: Đang kết nối
            </div>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-50 overflow-auto relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 sticky top-0 z-10 justify-between">
            <h2 className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs">
              {tab === 'dashboard' ? 'Tổng quan kinh doanh' : tab === 'pos' ? 'Thu ngân hệ thống' : tab === 'customers' ? 'Hồ sơ khách hàng' : tab === 'orders' ? 'Nhật ký giao dịch' : tab === 'settings' ? 'Cấu hình hệ thống' : 'Quản trị danh mục'}
            </h2>
            <div onClick={() => setTab('settings')} className={`p-2 rounded-xl cursor-pointer transition-all ${tab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Settings size={20}/>
            </div>
        </header>

        <main className="animate-in fade-in duration-500 h-[calc(100vh-80px)]">
          {tab === 'dashboard' && <Dashboard setTab={setTab} />}
          {tab === 'pos' && <POS />}
          {tab === 'items' && <Inventory />}
          {tab === 'customers' && <Customers />}
          {tab === 'orders' && <Orders />}
          {tab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}