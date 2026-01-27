import React, { useState, useEffect } from 'react';
import { 
  Store, Printer, ShieldCheck, Save, Percent, MapPin, Phone, 
  Smartphone, ReceiptText, Database, Mail, CalendarClock, 
  UserPlus, Trash2, Edit3, KeyRound, CreditCard, Image as ImageIcon,
  MoveUp
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function Settings() {
  const [activeSubTab, setActiveSubTab] = useState('shop');
  
  const [shopInfo, setShopInfo] = useState({
    name: 'SALESHUB-SG',
    phone: '0901234567',
    email: 'contact@saleshub.vn',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    footerNote: 'Cảm ơn quý khách, hẹn gặp lại!',
    bankName: 'VIB BANK',
    bankAccount: '707 827 837',
    accountName: 'TONG MINH NGUYEN',
    logoUrl: '', 
    qrUrl: '',   
  });

  const [config, setConfig] = useState({
    lowStockThreshold: 5,
    vatRate: 8,
    debtLimitDays: 30,
    autoPrint: false,
    printSize: '80mm',
    marginTopOffset: 0, 
  });

  const [systemUsers, setSystemUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'nhanvien', full_name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedShop = localStorage.getItem('shopInfo');
    const savedConfig = localStorage.getItem('appConfig');
    if (savedShop) setShopInfo(JSON.parse(savedShop));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setSystemUsers(data);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return alert('Nhập đủ tên và pass mới tạo được chứ mày!');
    setLoading(true);
    const { error } = await supabase.from('system_users').insert([newUser]);
    if (error) {
      alert('Lỗi rồi: ' + error.message);
    } else {
      setNewUser({ username: '', password: '', role: 'nhanvien', full_name: '' });
      fetchUsers();
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Mày có chắc muốn xóa đứa này khỏi hệ thống không?')) {
      const { error } = await supabase.from('system_users').delete().eq('id', id);
      if (!error) fetchUsers();
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('shopInfo', JSON.stringify(shopInfo));
    localStorage.setItem('appConfig', JSON.stringify(config));
    alert('✅ Đã lưu cấu hình hệ thống thành công!');
  };

  const MenuLink = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveSubTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
        activeSubTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="p-6 bg-[#F1F3F6] min-h-full font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cấu hình chi tiết</h1>
          <button onClick={handleSaveConfig} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all uppercase text-sm">
            <Save size={18} /> Lưu thay đổi
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-72 space-y-2">
            <MenuLink id="shop" icon={Store} label="Thông tin cửa hàng" />
            <MenuLink id="bank" icon={CreditCard} label="Ngân hàng & QR" />
            <MenuLink id="operation" icon={Smartphone} label="Vận hành & Kho" />
            <MenuLink id="print" icon={Printer} label="In ấn & Preview" />
            <MenuLink id="security" icon={ShieldCheck} label="Bảo mật & User" />
          </div>

          <div className="flex-1 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm min-h-[600px]">
            
            {activeSubTab === 'shop' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-black text-slate-800 border-b pb-4 flex items-center gap-2"><Store size={20}/> Thông tin cửa hàng</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tên cửa hàng</label>
                    <input type="text" value={shopInfo.name} onChange={e=>setShopInfo({...shopInfo, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Số điện thoại</label>
                    <input type="text" value={shopInfo.phone} onChange={e=>setShopInfo({...shopInfo, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Logo URL (Dán link ảnh)</label>
                    <input type="text" placeholder="https://..." value={shopInfo.logoUrl} onChange={e=>setShopInfo({...shopInfo, logoUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Địa chỉ</label>
                    <input type="text" value={shopInfo.address} onChange={e=>setShopInfo({...shopInfo, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lời nhắn chân trang (Footer Note)</label>
                    <textarea value={shopInfo.footerNote} onChange={e=>setShopInfo({...shopInfo, footerNote: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl h-20 outline-none resize-none font-medium" />
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'bank' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-black text-slate-800 border-b pb-4 flex items-center gap-2"><CreditCard size={20}/> Thông tin thanh toán</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tên ngân hàng</label>
                    <input type="text" placeholder="VIB, Vietcombank..." value={shopInfo.bankName} onChange={e=>setShopInfo({...shopInfo, bankName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Số tài khoản</label>
                    <input type="text" value={shopInfo.bankAccount} onChange={e=>setShopInfo({...shopInfo, bankAccount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tên chủ tài khoản</label>
                    <input type="text" value={shopInfo.accountName} onChange={e=>setShopInfo({...shopInfo, accountName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold uppercase outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">QR Code URL (Dán link ảnh)</label>
                    <input type="text" placeholder="https://..." value={shopInfo.qrUrl} onChange={e=>setShopInfo({...shopInfo, qrUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium outline-none" />
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
                    <ImageIcon className="text-orange-500" size={24}/>
                    <p className="text-xs text-orange-700 font-medium">Mẹo: Mày có thể lên <b>VietQR.net</b> tạo mã rồi dán link ảnh vào đây để QR tự cập nhật số tiền!</p>
                </div>
              </div>
            )}

            {activeSubTab === 'operation' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-black text-slate-800 border-b pb-4">Vận hành & Kho</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3"><Smartphone className="text-blue-500"/><span className="font-bold">Báo động tồn kho (Dưới mức này)</span></div>
                    <input type="number" value={config.lowStockThreshold} onChange={e=>setConfig({...config, lowStockThreshold: Number(e.target.value)})} className="w-20 p-2 text-center font-black bg-white rounded-lg border border-slate-200" />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3"><Percent className="text-emerald-500"/><span className="font-bold">Thuế GTGT (%)</span></div>
                    <input type="number" value={config.vatRate} onChange={e=>setConfig({...config, vatRate: Number(e.target.value)})} className="w-20 p-2 text-center font-black bg-white rounded-lg border border-slate-200" />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3"><CalendarClock className="text-orange-500"/><span className="font-bold">Định mức công nợ khách (Ngày)</span></div>
                    <input type="number" value={config.debtLimitDays} onChange={e=>setConfig({...config, debtLimitDays: Number(e.target.value)})} className="w-20 p-2 text-center font-black bg-white rounded-lg border border-slate-200" />
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'print' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-slate-800 border-b pb-4">Cấu hình In</h2>
                  <div className="flex gap-4">
                    <button onClick={()=>setConfig({...config, printSize:'80mm'})} className={`flex-1 p-4 rounded-xl border-2 font-black transition-all ${config.printSize==='80mm'?'border-blue-600 bg-blue-50 text-blue-600 shadow-md':'border-slate-100 text-slate-400'}`}>K80 (80mm)</button>
                    <button onClick={()=>setConfig({...config, printSize:'58mm'})} className={`flex-1 p-4 rounded-xl border-2 font-black transition-all ${config.printSize==='58mm'?'border-blue-600 bg-blue-50 text-blue-600 shadow-md':'border-slate-100 text-slate-400'}`}>K58 (58mm)</button>
                  </div>

                  <div className="p-5 bg-slate-900 rounded-2xl text-white space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-400"><MoveUp size={18}/> <span className="font-bold text-sm">Bù lề trên (Margin Top)</span></div>
                        <div className="flex items-center gap-2">
                            <input type="number" value={config.marginTopOffset} onChange={e=>setConfig({...config, marginTopOffset: Number(e.target.value)})} className="w-16 p-1 text-center font-black bg-slate-800 rounded border border-slate-700 text-white" />
                            <span className="text-[10px] font-bold">px</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-tight">Mẹo: Nhập số âm (VD: -15) để kéo nội dung lên nếu máy in chừa lề trắng quá nhiều.</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <span className="font-bold text-blue-900">Tự động in đơn</span>
                    <input type="checkbox" checked={config.autoPrint} onChange={e=>setConfig({...config, autoPrint: e.target.checked})} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                  </div>
                </div>
                
                <div className="bg-slate-100 p-4 rounded-3xl flex flex-col items-center border-2 border-dashed border-slate-300">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Bản xem trước hóa đơn</p>
                  <div 
                    className={`bg-white shadow-xl p-6 ${config.printSize === '58mm' ? 'w-48' : 'w-64'} text-[10px] font-mono leading-tight space-y-4 overflow-hidden transition-all`}
                    style={{ paddingTop: `${24 + config.marginTopOffset}px` }} // Preview bù lề trực tiếp
                  >
                    <div className="text-center border-b border-dashed pb-2">
                      <p className="font-black text-sm uppercase">{shopInfo.name || 'TÊN CỬA HÀNG'}</p>
                      <p className="text-[8px]">{shopInfo.address || 'Địa chỉ chưa cập nhật'}</p>
                      <p className="text-[8px]">SĐT: {shopInfo.phone || '000.000.000'}</p>
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="font-black text-[12px]">HÓA ĐƠN BÁN LẺ</p>
                      <p className="text-[8px]">Số: #HD0001 - {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="border-b border-dashed py-2">
                      <div className="flex justify-between"><span>Sản phẩm mẫu x1</span><span>100k</span></div>
                    </div>
                    <div className="text-right font-black pt-2">
                      <div className="flex justify-between text-[11px]"><span>TỔNG CỘNG:</span><span>100,000</span></div>
                    </div>
                    
                    {/* Hiển thị QR Preview nếu có link */}
                    {shopInfo.qrUrl && (
                      <div className="flex justify-center pt-2">
                        <img src={shopInfo.qrUrl} alt="QR" className="w-20 h-20 border p-1" />
                      </div>
                    )}

                    <div className="text-center pt-4 italic border-t border-dashed mt-4 text-[8px] text-slate-500 whitespace-pre-line">
                      {shopInfo.footerNote || 'Cảm ơn quý khách!'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-black text-slate-800 border-b pb-4">Quản lý tài khoản</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                   <input type="text" placeholder="Tên đăng nhập" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="p-2.5 rounded-xl border outline-none font-bold text-sm" />
                   <input type="password" placeholder="Mật khẩu" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="p-2.5 rounded-xl border outline-none font-bold text-sm" />
                   <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="p-2.5 rounded-xl border outline-none font-bold text-sm">
                      <option value="nhanvien">Nhân viên</option>
                      <option value="admin">Quản trị viên</option>
                   </select>
                   <button onClick={handleAddUser} disabled={loading} className="bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-slate-800 transition-all">
                      {loading ? '...' : <><UserPlus size={16}/> Thêm User</>}
                   </button>
                </div>

                <div className="space-y-2 mt-4">
                  {systemUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${u.role==='admin'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{u.username}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role === 'admin' ? '⭐ Quản trị' : '👤 Nhân viên'}</p>
                        </div>
                      </div>
                      <button onClick={()=>handleDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0F172A] p-6 rounded-[2rem] text-white flex justify-between items-center mt-10 shadow-xl">
                  <div className="flex items-center gap-3"><Database className="text-emerald-400" size={20}/><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Database Status</span></div>
                  <span className="text-emerald-400 font-black text-xs animate-pulse">CONNECTED</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}