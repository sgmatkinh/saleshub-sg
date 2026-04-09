import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { 
  FileText, Search, Calendar, User, 
  ChevronRight, Eye, Download, Loader2,
  Filter, ArrowLeftRight, Printer, Trash2, Edit3, Save, X, FileSpreadsheet
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [shopInfo, setShopInfo] = useState({});
  const [config, setConfig] = useState({});

  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Hoa_Don_Ban_Hang',
  });

  useEffect(() => {
    fetchOrders();
    const savedShop = localStorage.getItem('shopInfo');
    const savedConfig = localStorage.getItem('appConfig');
    if (savedShop) setShopInfo(JSON.parse(savedShop));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi lấy đơn hàng:', error);
    } else {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Mày có chắc muốn xóa vĩnh viễn đơn hàng này không? Không hoàn tác được đâu!")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) alert("Lỗi khi xóa: " + error.message);
      else {
        setOrders(orders.filter(o => o.id !== id));
        setSelectedOrder(null);
      }
    }
  };

  const handleUpdateOrder = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ note: editData.note, customer_name: editData.customer_name })
      .eq('id', editData.id);

    if (error) alert("Lỗi cập nhật: " + error.message);
    else {
      alert("Cập nhật thành công!");
      setIsEditing(false);
      setSelectedOrder(editData);
      fetchOrders();
    }
  };

  const exportToExcel = () => {
    const header = ["Mã Đơn", "Ngày", "Khách Hàng", "SĐT", "Sản Phẩm", "Tổng Tiền", "Ghi Chú"];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8),
      new Date(o.created_at).toLocaleString('vi-VN'),
      o.customer_name || "Khách lẻ",
      o.customer_phone || "",
      o.items?.map(i => `${i.name}(x${i.qty})`).join('; '),
      o.final_total,
      o.note || ""
    ]);
    let csvContent = "\uFEFF" + header.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Danh_Sach_Don_Hang_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const exportReport = () => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
    const header = ["BÁO CÁO DOANH THU", "", "", ""];
    const summary = [
      ["Thời gian lọc", `${filterDate || 'Tất cả'} / ${filterMonth || 'Tất cả'} / ${filterYear}`],
      ["Tổng số đơn hàng", filteredOrders.length],
      ["TỔNG DOANH THU", totalRevenue.toLocaleString() + "đ"],
      ["", ""],
      ["Chi tiết đơn hàng trong kỳ:", "", "", ""]
    ];
    const subHeader = ["Mã đơn", "Ngày", "Khách hàng", "Thành tiền"];
    const rows = filteredOrders.map(o => [o.id.slice(0, 8), new Date(o.created_at).toLocaleDateString(), o.customer_name, o.final_total]);
    
    let csvContent = "\uFEFF" + summary.map(e => e.join(",")).join("\n") + "\n" + subHeader.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_Cao_Doanh_Thu.csv`;
    link.click();
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const matchSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.customer_phone?.includes(searchTerm) ||
                       order.id.includes(searchTerm);
    
    const d = filterDate ? orderDate.getDate() === parseInt(filterDate) : true;
    const m = filterMonth ? (orderDate.getMonth() + 1) === parseInt(filterMonth) : true;
    const y = filterYear ? orderDate.getFullYear() === parseInt(filterYear) : true;

    return matchSearch && d && m && y;
  });

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div className="p-3 md:p-6 bg-[#F1F3F6] min-h-full font-sans">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* TIÊU ĐỀ & CÔNG CỤ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight text-center md:text-left">Lịch sử đơn hàng</h1>
            <p className="text-xs md:text-sm text-slate-500 text-center md:text-left">Quản lý và xem lại tất cả hóa đơn đã xuất</p>
          </div>

          <div className="flex flex-row justify-center lg:justify-end gap-2">
            <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
              <Download size={14} /> Xuất DS
            </button>
            <button onClick={exportReport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-[10px] md:text-xs font-bold hover:bg-green-700 shadow-sm">
              <FileSpreadsheet size={14} /> Báo Cáo
            </button>
          </div>
        </div>

        {/* BỘ LỌC THỜI GIAN & TÌM KIẾM */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm khách, SĐT hoặc mã đơn..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2 flex-1 overflow-x-auto pb-1">
              <Filter size={14} className="text-slate-400 shrink-0" />
              <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-slate-50 border-none rounded-lg text-[11px] font-bold p-2 outline-none">
                <option value="">Ngày</option>
                {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-slate-50 border-none rounded-lg text-[11px] font-bold p-2 outline-none">
                <option value="">Tháng</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Th {i+1}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-slate-50 border-none rounded-lg text-[11px] font-bold p-2 outline-none">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            {(filterDate || filterMonth) && (
              <button onClick={() => {setFilterDate(''); setFilterMonth('');}} className="text-[10px] text-red-500 font-bold uppercase underline shrink-0 px-2">Xóa lọc</button>
            )}
          </div>
        </div>

        {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-3 md:p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn hàng</th>
                  {/* Ẩn cột khách hàng trên mobile nhỏ, gộp vào cột đầu */}
                  <th className="hidden sm:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</th>
                  <th className="hidden lg:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                  <th className="p-3 md:p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tổng</th>
                  <th className="p-3 md:p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-20 md:w-auto"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-3 md:p-4">
                      <div className="font-bold text-xs text-blue-600 mb-0.5">#{order.id.slice(0, 8)}</div>
                      <div className="text-[10px] md:text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                        <Calendar size={10} /> {new Date(order.created_at).toLocaleString('vi-VN')}
                      </div>
                      {/* Hiển thị khách hàng ở đây khi trên mobile */}
                      <div className="sm:hidden font-medium text-slate-700 text-[11px] truncate max-w-[120px]">
                        {order.customer_name || "Khách lẻ"}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell p-4">
                      <div className="font-bold text-slate-700 text-sm">{order.customer_name || "Khách lẻ"}</div>
                      <div className="text-[11px] text-slate-400">{order.customer_phone || "Không có SĐT"}</div>
                    </td>
                    <td className="hidden lg:table-cell p-4">
                      <div className="text-xs text-slate-600 max-w-[200px] truncate font-medium">
                        {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <div className="font-black text-slate-900 text-xs md:text-sm">{(order.final_total || 0).toLocaleString()}đ</div>
                      {order.discount_amount > 0 && (
                        <div className="text-[9px] md:text-[10px] text-red-400 italic"> -{order.discount_amount.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 bg-blue-50 sm:bg-transparent hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center justify-center mx-auto"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="py-12 px-6 text-center">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <FileText size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm">Không tìm thấy đơn hàng nào!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG - RESPONSIVE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText size={20} />
                <h3 className="font-black uppercase tracking-tight text-sm md:text-base">Chi tiết hóa đơn</h3>
              </div>
              <button onClick={() => {setSelectedOrder(null); setIsEditing(false);}} className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-slate-500 hover:text-red-500 transition-colors font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Thông tin Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Khách hàng</p>
                  {isEditing ? (
                    <input 
                      className="w-full text-sm font-bold border-b-2 border-blue-500 outline-none pb-1 bg-blue-50/50 px-1" 
                      value={editData.customer_name}
                      onChange={(e) => setEditData({...editData, customer_name: e.target.value})}
                    />
                  ) : (
                    <p className="font-bold text-slate-800 text-sm">{selectedOrder.customer_name || "Khách lẻ"}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedOrder.customer_phone || "Không có SĐT"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase text-right mb-1">Mã hóa đơn</p>
                  <p className="font-bold text-slate-800 text-[11px]">#{selectedOrder.id.slice(0, 12)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="bg-slate-50 rounded-2xl p-3 md:p-4 space-y-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between">
                  <span>Sản phẩm</span>
                  <span>Thành tiền</span>
                </p>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div className="flex-1 pr-4">
                        <div className="text-slate-700 font-bold leading-tight">{item.name}</div>
                        <div className="text-[10px] text-blue-500 font-medium">Số lượng: {item.qty}</div>
                      </div>
                      <span className="font-bold text-slate-800 shrink-0">{(item.price * item.qty).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Tạm tính:</span>
                    <span>{selectedOrder.subtotal?.toLocaleString()}đ</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-[11px] text-red-400 italic">
                      <span>Giảm giá:</span>
                      <span>-{selectedOrder.discount_amount?.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-blue-600 pt-2 border-t border-slate-200 mt-1">
                    <span>TỔNG CỘNG:</span>
                    <span>{selectedOrder.final_total?.toLocaleString()}đ</span>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú đơn</p>
                {isEditing ? (
                  <textarea 
                    className="w-full p-3 bg-blue-50 text-xs rounded-xl outline-none border border-blue-200 focus:ring-1 ring-blue-500"
                    rows="2"
                    value={editData.note}
                    onChange={(e) => setEditData({...editData, note: e.target.value})}
                  />
                ) : (
                  <div className="p-3 bg-blue-50 text-blue-700 text-[11px] rounded-xl italic leading-relaxed">
                    {selectedOrder.note || "Không có ghi chú"}
                  </div>
                )}
              </div>
            </div>

            {/* Thao tác chân Modal - Nút to dễ bấm */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0 pb-8 sm:pb-6">
              <div className="grid grid-cols-3 gap-2">
                {isEditing ? (
                  <>
                    <button onClick={handleUpdateOrder} className="col-span-2 flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-[11px] uppercase shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                      <Save size={16} /> Lưu lại
                    </button>
                    <button onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-[11px] uppercase active:scale-95 transition-transform">
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handlePrint()} className="flex flex-col items-center justify-center gap-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-[10px] uppercase active:scale-95 transition-transform shadow-lg">
                      <Printer size={18} /> In
                    </button>
                    <button onClick={() => {setIsEditing(true); setEditData(selectedOrder);}} className="flex flex-col items-center justify-center gap-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold text-[10px] uppercase active:scale-95 transition-transform">
                      <Edit3 size={18} /> Sửa
                    </button>
                    <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="flex flex-col items-center justify-center gap-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold text-[10px] uppercase active:scale-95 transition-transform">
                      <Trash2 size={18} /> Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KHU VỰC IN ẨN */}
      <div style={{ display: 'none' }}>
        {selectedOrder && (
          <InvoiceTemplate 
            ref={printRef} 
            shopInfo={shopInfo}
            config={config}
            data={{
              customerName: selectedOrder.customer_name || "Khách lẻ",
              customerPhone: selectedOrder.customer_phone || "N/A",
              items: selectedOrder.items,
              subTotal: selectedOrder.subtotal,
              orderDiscount: selectedOrder.discount_amount,
              finalTotal: selectedOrder.final_total,
              customerPaid: selectedOrder.customer_cash || selectedOrder.final_total,
              changeDue: selectedOrder.change_due || 0,
              note: selectedOrder.note
            }} 
          />
        )}
      </div>
    </div>
  );
}