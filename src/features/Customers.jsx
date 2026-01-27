import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { 
  UserPlus, Search, Edit3, Trash2, Phone, Mail, 
  History, CreditCard, Download, Upload, X, Save, 
  User, MapPin, Notebook as Note, PlusCircle, Star,
  Printer, Package
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

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-slate-300 uppercase tracking-widest">Đang tải hồ sơ...</div>;

  return (
    <div className="flex h-full bg-[#F8FAFC] overflow-hidden">
      
      {/* DANH SÁCH TRÁI: KHÁCH HÀNG */}
      <div className="w-[400px] border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Khách hàng</h2>
            <button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', email:'', address:'', note:''}); setIsModalOpen(true); }} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
              <UserPlus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" placeholder="Tìm tên, SĐT..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => fileInputRef.current.click()} className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50">
              <Upload size={12}/> Nhập
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" />
            <button onClick={handleExportExcel} className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:bg-slate-50">
              <Download size={12}/> Xuất
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)).map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCustomer(c)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
            >
              <div className="flex justify-between items-start">
                <p className="font-black text-slate-800 text-sm uppercase">{c.name}</p>
                <div className="flex gap-1">
                   <button onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setFormData(c); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit3 size={14}/></button>
                   <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs font-medium">
                <Phone size={12} /> {c.phone}
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-400 text-[10px]">
                <Mail size={12} /> {c.email || 'Không có email'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DANH SÁCH PHẢI: LỊCH SỬ HÓA ĐƠN */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {selectedCustomer ? (
          <>
            <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomer.name}</h1>
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase">
                    {totalAccumulated > 5000000 ? 'Khách VIP' : 'Khách Thân Thiết'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-2">
                  <MapPin size={12}/> {selectedCustomer.address || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tích lũy</p>
                <p className="text-2xl font-black text-blue-600">
                  {new Intl.NumberFormat('vi-VN').format(Math.floor(totalAccumulated))}đ
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                  <History size={18} className="text-blue-500"/> Lịch sử mua hàng ({orders.length})
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all">
                  <PlusCircle size={14}/> Tạo đơn mới
                </button>
              </div>

              <div className="space-y-4">
                {orders.length > 0 ? orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Mã đơn: #{order.id.toString().slice(0,8)}</span>
                        <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                          <Star size={12} className="text-yellow-500"/> {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-lg">{new Intl.NumberFormat('vi-VN').format(Math.floor(order.final_total))}đ</p>
                        <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => preparePrint(order)} className="p-1 text-slate-400 hover:text-green-600" title="In lại hóa đơn">
                            <Printer size={16}/>
                          </button>
                          <button className="text-slate-400 hover:text-blue-600"><Edit3 size={16}/></button>
                          <button className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    </div>

                    {/* PHẦN CHI TIẾT SẢN PHẨM ĐÃ MUA (ADD NEW) */}
                    <div className="mb-4 space-y-2 border-t border-slate-50 pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2">
                        <Package size={12}/> Chi tiết sản phẩm:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500">{item.qty}</span>
                              <span className="font-bold text-slate-700 uppercase">{item.name}</span>
                            </div>
                            <span className="font-medium text-slate-500">
                              {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                        <Note size={12}/> Ghi chú đơn hàng:
                      </p>
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        {order.note || 'Không có ghi chú cho đơn hàng này.'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                    <CreditCard size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Khách hàng này chưa có hóa đơn nào</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <User size={64} strokeWidth={1} className="mb-4 opacity-20"/>
            <p className="font-black uppercase text-xs tracking-[0.3em] opacity-40">Chọn một khách hàng để xem chi tiết</p>
          </div>
        )}
      </div>

      {/* MODAL THÊM/SỬA KHÁCH HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingId ? 'Cập nhật hồ sơ' : 'Thêm khách hàng mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <input required value={formData.name} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input required value={formData.phone} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-slate-700" 
                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input value={formData.email} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-slate-700" 
                    onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                <input value={formData.address} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-slate-700" 
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all uppercase tracking-widest text-xs shadow-xl shadow-blue-100">
                <Save size={18} className="inline mr-2"/> Lưu hồ sơ khách hàng
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