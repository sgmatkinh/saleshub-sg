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
  
  // Lấy thông tin shop để in ấn
  const [shopInfo, setShopInfo] = useState({});
  const [config, setConfig] = useState({});

  // States cho lọc thời gian
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // States cho chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // States cho in ấn
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Hoa_Don_Ban_Hang',
  });

  useEffect(() => {
    fetchOrders();
    // Load config để in ấn
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

  // Logic Xóa đơn hàng
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

  // Logic Lưu chỉnh sửa
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

  // Xuất Excel danh sách đơn hàng chi tiết
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

  // Xuất báo cáo tổng hợp
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

  // Logic lọc dữ liệu
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
    <div className="p-6 bg-[#F1F3F6] min-h-full font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TIÊU ĐỀ & CÔNG CỤ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lịch sử đơn hàng</h1>
            <p className="text-sm text-slate-500">Quản lý và xem lại tất cả hóa đơn đã xuất</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
              <Download size={16} /> Xuất DS Excel
            </button>
            <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm">
              <FileSpreadsheet size={16} /> Xuất Báo Cáo
            </button>
          </div>
        </div>

        {/* BỘ LỌC THỜI GIAN & TÌM KIẾM */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên khách, SĐT hoặc mã đơn..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2 outline-none">
              <option value="">Ngày</option>
              {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2 outline-none">
              <option value="">Tháng</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2 outline-none">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            {(filterDate || filterMonth) && (
              <button onClick={() => {setFilterDate(''); setFilterMonth('');}} className="text-[10px] text-red-500 font-bold uppercase underline">Xóa lọc</button>
            )}
          </div>
        </div>

        {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã đơn / Ngày</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Khách hàng</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tổng tiền</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-xs text-blue-600 mb-1">#{order.id.slice(0, 8)}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(order.created_at).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700 text-sm">{order.customer_name || "Khách lẻ"}</div>
                      <div className="text-[11px] text-slate-400">{order.customer_phone || "Không có SĐT"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-600 max-w-[200px] truncate font-medium">
                        {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-black text-slate-900">{(order.final_total || 0).toLocaleString()}đ</div>
                      {order.discount_amount > 0 && (
                        <div className="text-[10px] text-red-400 italic"> Giảm: {order.discount_amount.toLocaleString()}đ</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Eye size={16} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <FileText size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm">Không tìm thấy đơn hàng nào!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText size={20} />
                <h3 className="font-black uppercase tracking-tight">Chi tiết hóa đơn</h3>
              </div>
              <button onClick={() => {setSelectedOrder(null); setIsEditing(false);}} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Thông tin Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng</p>
                  {isEditing ? (
                    <input 
                      className="text-sm font-bold border-b border-blue-500 outline-none" 
                      value={editData.customer_name}
                      onChange={(e) => setEditData({...editData, customer_name: e.target.value})}
                    />
                  ) : (
                    <p className="font-bold text-slate-800">{selectedOrder.customer_name || "Khách lẻ"}</p>
                  )}
                  <p className="text-xs text-slate-500">{selectedOrder.customer_phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase text-right">Mã hóa đơn</p>
                  <p className="font-bold text-slate-800 text-xs">#{selectedOrder.id.slice(0, 12)}</p>
                  <p className="text-[10px] text-slate-500">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between">
                  <span>Sản phẩm</span>
                  <span>Thành tiền</span>
                </p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600 flex-1 font-medium">{item.name} <span className="text-blue-500 font-bold">x{item.qty}</span></span>
                    <span className="font-bold text-slate-800">{(item.price * item.qty).toLocaleString()}đ</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-right">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Tạm tính:</span>
                    <span>{selectedOrder.subtotal?.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-400 italic">
                    <span>Giảm giá:</span>
                    <span>-{selectedOrder.discount_amount?.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-blue-600 pt-1 border-t border-slate-200 mt-2">
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
                    className="w-full p-3 bg-blue-50 text-xs rounded-xl outline-none border border-blue-200"
                    value={editData.note}
                    onChange={(e) => setEditData({...editData, note: e.target.value})}
                  />
                ) : (
                  <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-xl italic">
                    {selectedOrder.note || "Không có ghi chú"}
                  </div>
                )}
              </div>
            </div>

            {/* Thao tác chân Modal */}
            <div className="p-6 bg-slate-50 grid grid-cols-3 gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleUpdateOrder} className="col-span-2 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700">
                    <Save size={16} /> Lưu thay đổi
                  </button>
                  <button onClick={() => setIsEditing(false)} className="bg-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase hover:bg-slate-300">
                    Hủy
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handlePrint()} className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-slate-900">
                    <Printer size={16} /> In đơn
                  </button>
                  <button onClick={() => {setIsEditing(true); setEditData(selectedOrder);}} className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-200">
                    <Edit3 size={16} /> Sửa
                  </button>
                  <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="flex items-center justify-center gap-2 bg-red-100 text-red-600 py-3 rounded-xl font-bold text-xs uppercase hover:bg-red-200">
                    <Trash2 size={16} /> Xóa
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KHU VỰC IN ẨN (ĐÃ FIX ĐỂ NHẬN ĐỦ DATA) */}
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