import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print'; // Thêm dòng này
import InvoiceTemplate from '../components/InvoiceTemplate'; // Thêm dòng này
import { 
  Plus, Search, Edit3, Trash2, Package, 
  BarChart3, Hash, Tag, Download, Upload, X, Save, FileSpreadsheet, Filter,
  Printer // Thêm icon máy in
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả'); 
  const fileInputRef = useRef(null);

  // LOGIC IN ẤN MỚI THÊM
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

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Đã chọn file: ${file.name}. Cần thư viện xlsx để đọc nội dung.`);
    }
  };

  const totalValue = products.reduce((sum, p) => sum + (Math.floor(Number(p.price || 0)) * Math.floor(Number(p.stock || 0))), 0);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-slate-300 uppercase tracking-widest">Đang nạp dữ liệu...</div>;

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-full">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Danh mục hàng hóa</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Hệ thống quản lý kho SalesHub-SG</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
          
          <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase shadow-sm">
            <Upload size={16} className="text-blue-500" /> Nhập Excel
          </button>

          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase shadow-sm">
            <Download size={16} className="text-green-600" /> Xuất Excel
          </button>

          {/* NÚT IN MỚI THÊM VÀO ĐÂY */}
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all uppercase shadow-lg">
            <Printer size={16} className="text-orange-400" /> In kiểm kho
          </button>

          <button onClick={handleOpenAdd} className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase ml-2">
            <Plus size={18} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Tổng mặt hàng" val={products.length} icon={<Package size={20} className="text-blue-500"/>} />
        <StatCard label="Sắp hết hàng" val={products.filter(p => p.stock < 5).length} icon={<Hash size={20} className="text-red-500"/>} />
        <StatCard 
          label="Tổng vốn tồn" 
          val={new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(totalValue)) + ' đ'} 
          icon={<BarChart3 size={20} className="text-green-500"/>} 
        />
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5 relative">
          <div className="p-4 bg-slate-50 rounded-2xl"><Tag size={20} className="text-orange-500"/></div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Danh mục ({categories.length})</p>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent font-black text-slate-900 text-sm outline-none cursor-pointer appearance-none"
            >
              <option value="Tất cả">Tất cả sản phẩm</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Filter size={14} className="text-slate-300 absolute right-6" />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" placeholder="Tìm theo tên sản phẩm..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none"
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {selectedCategory !== 'Tất cả' && (
            <button 
              onClick={() => setSelectedCategory('Tất cả')}
              className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-all"
            >
              ĐANG LỌC: {selectedCategory.toUpperCase()} (BẤM ĐỂ HỦY)
            </button>
          )}
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase pl-8 tracking-widest">Sản phẩm</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Tồn kho</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-right tracking-widest">Giá bán</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest pr-8">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-5 pl-8">
                  <p className="font-bold text-slate-800 text-sm uppercase">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tighter">SKU: {p.sku || 'N/A'}</p>
                </td>
                <td className="p-5 text-xs font-bold text-slate-500 italic">{p.category}</td>
                <td className="p-5 text-center">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${p.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {Math.floor(p.stock)} {p.unit}
                  </span>
                </td>
                <td className="p-5 text-right font-black text-slate-900 text-sm">{new Intl.NumberFormat('vi-VN').format(Math.floor(p.price))}đ</td>
                <td className="p-5 text-center pr-8">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit3 size={16}/></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL SECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingId ? "Cập nhật sản phẩm" : "Thêm hàng mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm</label>
                <input required value={formData.name} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh mục</label>
                <select value={formData.category} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-sm cursor-pointer"
                  onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị</label>
                <input value={formData.unit} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold" 
                  onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU</label>
                <input value={formData.sku} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold" 
                  onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Barcode</label>
                <input value={formData.barcode} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold" 
                  onChange={e => setFormData({...formData, barcode: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tồn kho</label>
                <input type="number" value={formData.stock} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-blue-600" 
                  onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán</label>
                <input type="number" value={formData.price} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mt-1 font-bold text-green-600" 
                  onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>

              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-[20px] hover:bg-blue-600 transition-all uppercase tracking-[0.2em] text-xs">
                  <Save size={18} className="inline mr-2"/> Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPONENT IN ẨN (ẨN KHỎI MÀN HÌNH CHÍNH) */}
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
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5">
      <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900">{val}</p>
      </div>
    </div>
  );
}