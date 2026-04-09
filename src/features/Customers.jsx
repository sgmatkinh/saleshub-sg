import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { 
  UserPlus, Search, Edit3, Trash2, Phone, Mail, 
  History, CreditCard, Download, Upload, X, Save, 
  User, MapPin, Notebook as Note, PlusCircle, Star,
  Printer, Package, ChevronLeft
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orders, setOrders] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const printRef = useRef();
  const [printData, setPrintData] = useState(null);

  const handlePrintOrder = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Hoa_Don_Khach_Hang',
  });

  const preparePrint = (order) => {
    setPrintData({
      customerName: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      subTotal: order.final_total, 
      finalTotal: order.final_total,
      items: order.items || [],
      note: order.note
    });
    setTimeout(() => {
      handlePrintOrder();
    }, 200);
  };

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', note: ''
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchOrders(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const fetchOrders = async (customerId) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('customers').update(formData).eq('id', editingId);
      if (error) alert("Lỗi: " + error.message);
      else { setIsModalOpen(false); fetchCustomers(); }
    } else {
      const { error } = await supabase.from('customers').insert([formData]);
      if (error) alert("Lỗi: " + error.message);
      else { setIsModalOpen(false); fetchCustomers(); }
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Xóa khách này là mất hết lịch sử đó, chắc chưa mày?")) {
      await supabase.from('customers').delete().eq('id', id);
      setSelectedCustomer(null);
      fetchCustomers();
    }
  };

  const handleExportExcel = () => {
    const header = ["Tên", "SĐT", "Email", "Địa chỉ", "Ghi chú"];
    const rows = customers.map(c => [c.name, c.phone, c.email, c.address, c.note]);
    let csvContent = "\uFEFF" + header.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DS_KhachHang.csv`;
    link.click();
  };

  const totalAccumulated = orders.reduce((sum, o) => sum + Number(o.final_total || 0), 0);

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-slate-300 uppercase tracking-widest text-xs">Đang tải hồ sơ...</div>;

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#F8FAFC] overflow-hidden">
      
      {/* DANH SÁCH TRÁI: KHÁCH HÀNG (Ẩn trên mobile khi đã chọn khách) */}
      <div className={`${selectedCustomer ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] border-r border-slate-200 bg-white flex-col h-full`}>
        <div className="p-4 md:p-6 border-b border-slate-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">Khách hàng</h2>
            <button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', email:'', address:'', note:''}); setIsModalOpen(true); }} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
              <UserPlus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" placeholder="Tìm tên, SĐT..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-1 ring-blue-500"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => fileInputRef.current.click()} className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 active:bg-slate-100">
              <Upload size={12}/> Nhập
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" />
            <button onClick={handleExportExcel} className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50 active:bg-slate-100">
              <Download size={12}/> Xuất
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
          {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)).map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCustomer(c)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
            >
              <div className="flex justify-between items-start">
                <p className="font-black text-slate-800 text-sm uppercase leading-tight truncate mr-2">{c.name}</p>
                <div className="flex gap-1 shrink-0">
                   <button onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setFormData(c); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 active:bg-blue-100 rounded-md"><Edit3 size={14}/></button>
                   <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id); }} className="p-1.5 text-slate-400 hover:text-red-500 active:bg-red-100 rounded-md"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-slate-600 text-xs font-bold">
                <Phone size={12} className="text-blue-500" /> {c.phone}
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-400 text-[10px] truncate italic">
                <Mail size={12} /> {c.email || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DANH SÁCH PHẢI: CHI TIẾT & LỊCH SỬ (Hiện trên mobile khi chọn khách) */}
      <div className={`${!selectedCustomer ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#F8FAFC] h-full overflow-hidden`}>
        {selectedCustomer ? (
          <>
            {/* Header chi tiết */}
            <div className="p-4 md:p-8 bg-white border-b border-slate-200 sticky top-0 z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedCustomer(null)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full">
                    <ChevronLeft size={24} className="text-slate-600"/>
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedCustomer.name}</h1>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${totalAccumulated > 5000000 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {totalAccumulated > 5000000 ? 'VIP' : 'Thân thiết'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1.5 flex items-center gap-1.5 font-medium">
                      <MapPin size={12} className="shrink-0 text-slate-300"/> 
                      <span className="truncate max-w-[200px] sm:max-w-none">{selectedCustomer.address || 'Chưa có địa chỉ'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-blue-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-0">Tổng tích lũy</p>
                  <p className="text-lg md:text-2xl font-black text-blue-600 leading-none">
                    {new Intl.NumberFormat('vi-VN').format(Math.floor(totalAccumulated))}đ
                  </p>
                </div>
              </div>
            </div>

            {/* List lịch sử */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                  <History size={16} className="text-blue-500"/> Lịch sử ({orders.length})
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-md">
                  <PlusCircle size={14}/> Tạo đơn
                </button>
              </div>

              <div className="space-y-4 pb-10">
                {orders.length > 0 ? orders.map(order => (
                  <div key={order.id} className="bg-white p-4 md:p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">HĐ: #{order.id.toString().slice(-6).toUpperCase()}</span>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                          <Star size={10} className="text-yellow-500 shrink-0"/> {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 text-sm md:text-lg">{new Intl.NumberFormat('vi-VN').format(Math.floor(order.final_total))}đ</p>
                        <div className="flex gap-1 justify-end mt-2 md:opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => preparePrint(order)} className="p-1.5 text-slate-400 hover:text-green-600 active:bg-green-50 rounded-lg"><Printer size={16}/></button>
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 active:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                          <button className="p-1.5 text-slate-400 hover:text-red-500 active:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 space-y-1.5 border-t border-slate-50 pt-4">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500">{item.qty}</span>
                            <span className="font-bold text-slate-700 uppercase truncate max-w-[120px] md:max-w-none">{item.name}</span>
                          </div>
                          <span className="font-black text-slate-500 whitespace-nowrap">
                            {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                        <Note size={12} className="text-slate-300"/> Ghi chú:
                      </p>
                      <p className="text-[10px] text-slate-600 italic leading-relaxed">
                        {order.note || 'Không có ghi chú.'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                    <CreditCard size={40} className="mx-auto text-slate-100 mb-4"/>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em]">Chưa có giao dịch nào</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
            <User size={64} strokeWidth={1} className="mb-4 opacity-10"/>
            <p className="font-black uppercase text-[10px] tracking-[0.3em] opacity-30 leading-loose">Chọn một khách hàng<br/>để xem chi tiết lịch sử</p>
          </div>
        )}
      </div>

      {/* MODAL THÊM/SỬA - Fullscreen mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden p-6 md:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingId ? 'Cập nhật hồ sơ' : 'Thêm khách hàng mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="space-y-4 md:space-y-5 overflow-y-auto pb-10 sm:pb-0">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <input required value={formData.name} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm text-slate-700 focus:ring-1 ring-blue-500 transition-all" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input required type="tel" value={formData.phone} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm text-slate-700" 
                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input value={formData.email} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm text-slate-700" 
                    onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                <input value={formData.address} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm text-slate-700" 
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú đặc biệt</label>
                <textarea rows="3" value={formData.note} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm text-slate-700" 
                  onChange={e => setFormData({...formData, note: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-100 active:scale-[0.98]">
                <Save size={18} className="inline mr-2 mb-0.5"/> Lưu hồ sơ khách
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMPONENT IN ẨN */}
      <div style={{ display: 'none' }}>
        <InvoiceTemplate ref={printRef} data={printData} type="pos" />
      </div>

    </div>
  );
}