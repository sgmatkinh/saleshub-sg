import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { 
  Plus, Search, Edit3, Trash2, Package, 
  BarChart3, Hash, Tag, Download, Upload, X, Save, FileSpreadsheet, Filter,
  Printer 
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả'); 
  const fileInputRef = useRef(null);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Kiem_Kho_${new Date().toLocaleDateString()}`,
  });

  const categories = [
    "Tròng Kính Rocky", "Tròng Kính TL", "Tròng Kính DAT", 
    "Tròng Kính MAT", "Gọng Kính Mid", "Gọng Kính High", 
    "Gọng Kính TRE", "LENS", "Chung"
  ];

  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', unit: 'Cái', 
    stock: 0, price: 0, category: 'Tròng Kính Rocky', note: ''
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', sku: '', barcode: '', unit: 'Cái', stock: 0, price: 0, category: 'Tròng Kính Rocky', note: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Mày có chắc muốn xóa sản phẩm này không?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) alert("Xóa lỗi: " + error.message);
      else fetchProducts();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      stock: Math.floor(Number(formData.stock)),
      price: Math.floor(Number(formData.price))
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(dataToSave).eq('id', editingId);
      if (error) alert("Cập nhật lỗi: " + error.message);
      else { setIsModalOpen(false); fetchProducts(); }
    } else {
      const { error } = await supabase.from('products').insert([dataToSave]);
      if (error) alert("Thêm lỗi: " + error.message);
      else { setIsModalOpen(false); fetchProducts(); }
    }
  };

  const handleExportExcel = () => {
    if (products.length === 0) return alert("Kho hàng trống!");
    const header = ["Tên Sản Phẩm", "Danh Mục", "SKU", "Barcode", "Tồn Kho", "Đơn Vị", "Giá Bán"];
    const rows = products.map(p => [p.name, p.category, p.sku, p.barcode, p.stock, p.unit, p.price]);
    let csvContent = "\uFEFF" + header.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kho_Hang_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  const handleImportClick = () => { fileInputRef.current.click(); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) alert(`Đã chọn file: ${file.name}. Cần thư viện xlsx để đọc nội dung.`);
  };

  const totalValue = products.reduce((sum, p) => sum + (Math.floor(Number(p.price || 0)) * Math.floor(Number(p.stock || 0))), 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-slate-300 uppercase tracking-widest text-xs md:text-base">Đang nạp dữ liệu...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-8">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Danh mục hàng hóa</h1>
          <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Hệ thống quản lý kho SalesHub-SG</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
          
          <button onClick={handleImportClick} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase shadow-sm">
            <Upload size={14} className="text-blue-500" /> Nhập
          </button>

          <button onClick={handleExportExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase shadow-sm">
            <Download size={14} className="text-green-600" /> Xuất
          </button>

          <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all uppercase shadow-lg">
            <Printer size={14} className="text-orange-400" /> In kho
          </button>

          <button onClick={handleOpenAdd} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase sm:ml-2">
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* STATS BAR - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
        <StatCard label="Mặt hàng" val={products.length} icon={<Package size={18} className="text-blue-500"/>} />
        <StatCard label="Sắp hết" val={products.filter(p => p.stock < 5).length} icon={<Hash size={18} className="text-red-500"/>} />
        
        <div className="col-span-2 lg:col-span-1 bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 md:p-4 bg-slate-50 rounded-2xl shrink-0"><BarChart3 size={18} className="text-green-500"/></div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Tổng vốn tồn</p>
            <p className="text-sm md:text-lg font-black text-slate-900 truncate">{new Intl.NumberFormat('vi-VN').format(Math.round(totalValue))}đ</p>
          </div>
        </div>
        
        <div className="col-span-2 lg:col-span-1 bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 relative">
          <div className="p-3 md:p-4 bg-slate-50 rounded-2xl shrink-0"><Tag size={18} className="text-orange-500"/></div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lọc danh mục</p>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent font-black text-slate-900 text-xs md:text-sm outline-none cursor-pointer appearance-none pr-6"
            >
              <option value="Tất cả">Tất cả</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Filter size={12} className="text-slate-300 absolute right-4 md:right-6" />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[20px] md:rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" placeholder="Tìm tên hoặc SKU..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-1 ring-blue-500"
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {selectedCategory !== 'Tất cả' && (
            <button 
              onClick={() => setSelectedCategory('Tất cả')}
              className="w-full md:w-auto text-[9px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all uppercase"
            >
              Đang lọc: {selectedCategory} (X)
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase pl-6 tracking-widest">Sản phẩm</th>
                <th className="hidden md:table-cell p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tồn kho</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase text-right tracking-widest">Giá bán</th>
                <th className="p-4 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-800 text-[11px] md:text-sm uppercase leading-tight">{p.name}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-100 px-1 rounded">SKU: {p.sku || 'N/A'}</span>
                      <span className="md:hidden text-[9px] font-black text-blue-600 italic">{p.category}</span>
                      <span className={`md:hidden text-[9px] font-black ${p.stock > 10 ? 'text-green-600' : 'text-red-600'}`}>Tồn: {Math.floor(p.stock)}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell p-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${p.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {Math.floor(p.stock)} {p.unit}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-black text-slate-900 text-xs md:text-sm">{new Intl.NumberFormat('vi-VN').format(Math.floor(p.price))}đ</div>
                  </td>
                  <td className="p-4 text-center pr-6">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors active:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors active:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SECTION - Responsive Fullscreen on Mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in duration-300">
            <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingId ? "Cập nhật sản phẩm" : "Thêm hàng mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm</label>
                <input required value={formData.name} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm focus:ring-1 ring-blue-500 transition-all" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh mục</label>
                <select value={formData.category} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm cursor-pointer focus:ring-1 ring-blue-500 transition-all"
                  onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị</label>
                <input value={formData.unit} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm" 
                  onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3 md:block">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU</label>
                  <input value={formData.sku} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm" 
                    onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 md:hidden">Barcode</label>
                  <div className="md:hidden">
                     <input value={formData.barcode} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm" 
                      onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Barcode</label>
                <input value={formData.barcode} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-sm" 
                  onChange={e => setFormData({...formData, barcode: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tồn kho</label>
                  <input type="number" value={formData.stock} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-blue-600 text-sm" 
                    onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán</label>
                  <input type="number" value={formData.price} className="w-full bg-slate-50 p-4 rounded-xl outline-none mt-1 font-bold text-green-600 text-sm" 
                    onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              <div className="md:col-span-2 pt-4 pb-10 md:pb-0">
                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all uppercase tracking-[0.15em] text-[11px] shadow-lg active:scale-95">
                  <Save size={16} className="inline mr-2 mb-0.5"/> {editingId ? "Cập nhật ngay" : "Lưu sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPONENT IN ẨN */}
      <div style={{ display: 'none' }}>
        <InvoiceTemplate 
          ref={printRef} 
          type="inventory" 
          data={{ 
            items: filteredProducts, 
            total: filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
            note: `Báo cáo kho danh mục: ${selectedCategory}` 
          }} 
        />
      </div>

    </div>
  );
}

function StatCard({ label, val, icon }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-5 overflow-hidden">
      <div className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl shrink-0">{icon}</div>
      <div className="overflow-hidden">
        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <p className="text-sm md:text-xl font-black text-slate-900 truncate">{val}</p>
      </div>
    </div>
  );
}