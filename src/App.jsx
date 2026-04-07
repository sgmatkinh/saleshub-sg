import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './utils/supabaseClient'; 
import Login from './pages/Login'; 
import Inventory from './features/Inventory'; 
import POS from './features/POS';
import Customers from './features/Customers'; 
import Orders from './features/Orders';
import Dashboard from './features/Dashboard'; 
import SettingsPage from './features/Settings';
import { ShoppingCart, Package, LayoutDashboard, Settings, Users, ClipboardList, LogOut, Menu, X } from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false); // CHỐT CHẶN: Để phanh lại 3 giây
  const [timeLeft, setTimeLeft] = useState(30); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // THÊM MỚI: Quản lý đóng mở menu trên mobile
  const timerRef = useRef(null);

  // 1. Quản lý trạng thái đăng nhập (GIỮ NGUYÊN GỐC)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, s) => {
      if (_ev === 'SIGNED_IN') {
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

  // 2. Logic đếm ngược 30s (GIỮ NGUYÊN GỐC)
  useEffect(() => {
    if (!session || !isReady) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          supabase.auth.signOut().then(() => window.location.reload());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    const handleActivity = () => setTimeLeft(30);
    const events = ['mousemove', 'keypress', 'mousedown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [session, isReady]);

  // NẾU CHƯA CÓ SESSION HOẶC CHƯA HẾT 3 GIÂY CHỜ THÌ VẪN Ở LẠI LOGIN (GIỮ NGUYÊN GỐC)
  if (!session || !isReady) return <Login />;

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* HUD Hiển thị đếm ngược (GIỮ NGUYÊN GỐC) */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[999] bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">
        Phiên làm việc sắp hết: {timeLeft}s
      </div>

      {/* OVERLAY: Lớp phủ đen khi mở menu trên mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40] lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR: Đã thêm class để ẩn/hiện trên mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-[50] w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-400 italic tracking-tighter">SalesHub SG</h1>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest italic text-center">Version 2.0 Online</p>
          </div>
          {/* Nút đóng menu chỉ hiện trên mobile */}
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-8 flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'Báo cáo chung', icon: LayoutDashboard },
            { id: 'pos', label: 'Màn hình bán hàng', icon: ShoppingCart },
            { id: 'items', label: 'Quản lý kho hàng', icon: Package },
            { id: 'customers', label: 'Quản lý khách hàng', icon: Users },
            { id: 'orders', label: 'Lịch sử đơn hàng', icon: ClipboardList },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setIsSidebarOpen(false); // Tự đóng menu sau khi chọn trên mobile
              }} 
              className={`w-full flex items-center p-4 rounded-2xl font-bold transition-all ${tab===item.id?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon className="mr-3" size={20}/> {item.label}
            </button>
          ))}
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
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-slate-50 overflow-auto relative flex flex-col w-full">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 sm:px-8 sticky top-0 z-10 justify-between shrink-0">
            <div className="flex items-center gap-4">
              {/* NÚT MỞ MENU: Chỉ hiện trên mobile */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-all"
              >
                <Menu size={20} />
              </button>
              <h2 className="font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.3em] text-[10px] sm:text-xs truncate max-w-[150px] sm:max-w-none">
                {tab === 'dashboard' ? 'Tổng quan kinh doanh' : tab === 'pos' ? 'Thu ngân hệ thống' : tab === 'customers' ? 'Hồ sơ khách hàng' : tab === 'orders' ? 'Nhật ký giao dịch' : tab === 'settings' ? 'Cấu hình hệ thống' : 'Quản trị danh mục'}
              </h2>
            </div>
            <div onClick={() => setTab('settings')} className={`p-2 rounded-xl cursor-pointer transition-all ${tab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Settings size={20}/>
            </div>
        </header>

        <main className="animate-in fade-in duration-500 flex-1 overflow-auto">
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