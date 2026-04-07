import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print'; 
import emailjs from '@emailjs/browser'; 
import InvoiceTemplate from '../components/InvoiceTemplate'; 
import {  
  ShoppingCart, CheckCircle, Trash2, Search, Loader2,  
  User, Phone, FileText, Plus, Minus, Mail, Tag, Sparkles, Printer, XCircle, Info, LayoutGrid
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]); 
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', note: '' });
  
  const [discountTotal, setDiscountTotal] = useState({ value: 0, type: 'VND' });
  const [customerCash, setCustomerCash] = useState(0);
  const [shopInfo, setShopInfo] = useState({});
  const [config, setConfig] = useState({});

  const [printData, setPrintData] = useState(null);

  const [showProductTips, setShowProductTips] = useState(false);
  const [showCustTips, setShowCustTips] = useState({ field: null, list: [] });
  const [alertMsg, setAlertMsg] = useState({ show: false, type: 'info', title: '', msg: '' });

  // Quản lý Tab trên Mobile
  const [activeMobileTab, setActiveMobileTab] = useState('products');

  useEffect(() => { 
    fetchInitialData();
    const savedShop = localStorage.getItem('shopInfo');
    const savedConfig = localStorage.getItem('appConfig');
    if (savedShop) setShopInfo(JSON.parse(savedShop));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  const printRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Hoa_Don_Ban_Hang',
    onAfterPrint: () => {
        setCart([]); 
        setCustomer({ name: '', phone: '', email: '', note: '' });
        setDiscountTotal({ value: 0, type: 'VND' }); 
        setCustomerCash(0);
        setPrintData(null);
        fetchInitialData();
    }
  });

  const fetchInitialData = async () => {
    const [prodRes, custRes] = await Promise.all([
      supabase.from('products').select('*').gt('stock', 0),
      supabase.from('customers').select('*')
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (custRes.data) setCustomers(custRes.data);
    setLoading(false);
  };

  const showAlert = (title, msg, type = 'info') => {
    setAlertMsg({ show: true, title, msg, type });
    if (type !== 'error') {
        setTimeout(() => setAlertMsg(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const sendEmailNotification = (orderData) => {
    const detailsHtml = orderData.items.map(i => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-size: 14px;">${i.name.toUpperCase()}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 14px;">${i.qty}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 14px;">${(i.price * i.qty).toLocaleString()}đ</td>
      </tr>
    `).join('');

    const templateParams = {
      customer_name: orderData.customerName || "Khách lẻ",
      customer_phone: orderData.customerPhone || "N/A",
      time: new Date().toLocaleString('vi-VN'),
      note: orderData.note || "Không có",
      order_details_html: detailsHtml,
      final_total: `${orderData.finalTotal.toLocaleString()}đ`
    };

    emailjs.send("service_eegdor5", "template_tp7jriz", templateParams, "6LYTzg-KAHISrLlTl")
      .then((res) => console.log('Mail sent!', res.status))
      .catch((err) => console.error('Mail error:', err));
  };

  const addToCart = (p) => {
    const exist = cart.find(i => i.id === p.id);
    if (exist) {
      if (exist.qty < p.stock) setCart(cart.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      else showAlert("Hết hàng!", `Sản phẩm ${p.name} đã hết tồn kho`, 'error');
    } else {
      setCart([...cart, { ...p, qty: 1, itemDiscountValue: 0, itemDiscountType: 'VND' }]);
    }
    setSearch('');
    setShowProductTips(false);
  };

  const updateItemDiscount = (id, value, type) => {
    setCart(cart.map(i => i.id === id ? { 
      ...i, 
      itemDiscountValue: value !== undefined ? Number(value) : i.itemDiscountValue,
      itemDiscountType: type || i.itemDiscountType 
    } : i));
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        const p = products.find(x => x.id === id);
        if (newQty > 0 && newQty <= p.stock) return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const calculateItemDiscount = (item) => {
    if (item.itemDiscountType === '%') {
      return (item.price * item.qty * (item.itemDiscountValue || 0)) / 100;
    }
    return item.itemDiscountValue || 0;
  };

  const subTotal = cart.reduce((sum, i) => sum + (i.price * i.qty - calculateItemDiscount(i)), 0);
  const totalDiscountAmount = discountTotal.type === '%' ? (subTotal * discountTotal.value) / 100 : discountTotal.value;
  const finalTotal = subTotal - totalDiscountAmount;
  const changeDue = customerCash > finalTotal ? customerCash - finalTotal : 0;

  const handleCheckout = async (shouldPrint = false) => {
    if (cart.length === 0) return showAlert("Thông báo", "Giỏ hàng đang trống mày ơi!", "info");
    
    const currentInvoiceData = {
        customerName: customer.name || "Khách lẻ",
        customerPhone: customer.phone || "N/A",
        customerEmail: customer.email || "",
        items: [...cart],
        subTotal: subTotal,
        orderDiscount: totalDiscountAmount,
        finalTotal: finalTotal,
        customerPaid: customerCash,
        changeDue: changeDue,
        note: customer.note
    };

    try {
      setLoading(true);
      let customerId = null;

      if (customer.phone && customer.phone.trim() !== '') {
        const { data: custData, error: custError } = await supabase
          .from('customers')
          .upsert({ 
            phone: customer.phone.trim(), 
            name: customer.name || "Khách lẻ", 
            email: customer.email || "",
            note: customer.note || "" 
          }, { onConflict: 'phone' })
          .select();
        
        if (!custError && custData) customerId = custData[0].id;
      }

      const { error: orderError } = await supabase.from('orders').insert([{
        customer_id: customerId,
        customer_name: customer.name || "Khách lẻ",
        customer_phone: customer.phone || "",
        subtotal: subTotal,
        discount_amount: totalDiscountAmount,
        final_total: finalTotal,
        customer_cash: customerCash,
        change_due: changeDue,
        items: cart,
        note: customer.note
      }]);

      if (orderError) throw orderError;
      await Promise.all(cart.map(item => supabase.rpc('decrement_stock', { row_id: item.id, amount: item.qty })));
      
      sendEmailNotification(currentInvoiceData);

      if (shouldPrint) {
        setPrintData(currentInvoiceData);
        setTimeout(() => handlePrint(), 300);
      } else {
        setCart([]); 
        setCustomer({ name: '', phone: '', email: '', note: '' });
        setDiscountTotal({ value: 0, type: 'VND' }); 
        setCustomerCash(0);
        fetchInitialData();
      }
      
      showAlert("Thành công", "Đã lưu đơn hàng lên hệ thống!", "success");
    } catch (error) {
      showAlert("Lỗi hệ thống", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCustInput = (field, val) => {
    setCustomer({...customer, [field]: val});
    if (val.length > 0) {
        const filtered = customers.filter(c => c[field]?.toString().toLowerCase().includes(val.toLowerCase()));
        setShowCustTips({ field, list: filtered.slice(0, 5) });
    } else {
        setShowCustTips({ field: null, list: [] });
    }
  };

  const selectCustTip = (c) => {
    setCustomer({ name: c.name, phone: c.phone, email: c.email || '', note: c.note || '' });
    setShowCustTips({ field: null, list: [] });
  };

  const filteredProducts = search.trim() === '' ? [] : products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const hotProducts = products.slice(0, 5);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] overflow-hidden bg-[#F8FAFC] font-sans text-slate-700 relative">
      
      {/* NÚT CHUYỂN TAB MOBILE - Đưa lên trên để tránh đè nút thanh toán */}
      <div className="lg:hidden shrink-0 flex bg-white shadow-sm p-2 border-b border-slate-200 justify-center gap-2 z-20">
        <button 
          onClick={() => setActiveMobileTab('products')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeMobileTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
        >
          <LayoutGrid size={14} /> Hàng hóa
        </button>
        <button 
          onClick={() => setActiveMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeMobileTab === 'cart' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
        >
          <ShoppingCart size={14} /> Giỏ ({cart.length})
        </button>
      </div>

      {/* ALERT MODAL */}
      {alertMsg.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className={`p-4 flex items-center gap-3 ${alertMsg.type === 'error' ? 'bg-red-50 text-red-600' : alertMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {alertMsg.type === 'error' ? <XCircle size={24}/> : alertMsg.type === 'success' ? <CheckCircle size={24}/> : <Info size={24}/>}
                    <h4 className="font-black uppercase text-sm tracking-tighter">{alertMsg.title}</h4>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">{alertMsg.msg}</p>
                    <button onClick={() => setAlertMsg({ ...alertMsg, show: false })} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase">Đã rõ</button>
                </div>
            </div>
        </div>
      )}

      {/* CỘT TRÁI: TÌM KIẾM & SẢN PHẨM */}
      <div className={`flex-[1.5] flex flex-col p-3 lg:p-4 gap-4 overflow-hidden ${activeMobileTab !== 'products' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3 relative shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input  
              type="text" placeholder="Gõ tên sản phẩm..."  
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-sm font-medium"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowProductTips(true); }}
              onBlur={() => setTimeout(() => setShowProductTips(false), 200)}
            />
            {showProductTips && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-slate-100 rounded-xl mt-2 z-50 overflow-hidden">
                    {filteredProducts.slice(0, 6).map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0">
                            <span className="text-sm font-bold uppercase">{p.name}</span>
                            <span className="text-xs font-black text-blue-600">{p.price.toLocaleString()}đ</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 shrink-0">
              <Sparkles size={12} className="text-amber-500" /> HOT:
            </span>
            {hotProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[11px] font-semibold text-blue-600 shrink-0">+ {p.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 no-scrollbar pb-10">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all cursor-pointer flex flex-col active:scale-95 h-fit shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[8px] lg:text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase truncate max-w-[60px]">{p.category}</span>
                  <span className="text-[8px] lg:text-[10px] text-slate-400 font-medium">Tồn: {p.stock}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs lg:text-sm line-clamp-2 mb-3 h-8 lg:h-10 uppercase">{p.name}</h4>
                <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-sm lg:text-md font-black text-slate-900">{p.price.toLocaleString()}đ</p>
                  <div className="p-1 lg:p-1.5 bg-blue-600 text-white rounded-lg"><Plus size={14}/></div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-300 py-20">
              <Search size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium italic text-center px-4">Nhập tên sản phẩm để bắt đầu bán hàng...</p>
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div className={`flex-1 lg:min-w-[450px] flex flex-col overflow-hidden bg-white lg:border-l border-slate-200 ${activeMobileTab !== 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header & Khách hàng */}
        <div className="p-4 border-b border-slate-100 space-y-4 bg-slate-50/50 shrink-0">
          <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                <ShoppingCart size={18} className="text-blue-600" /> Giỏ hàng ({cart.length})
              </h3>
              <button onClick={() => setCart([])} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase">Xóa giỏ</button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 relative">
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-slate-400"/>
                <input value={customer.name} placeholder="Tên khách" className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" 
                  onChange={e => handleCustInput('name', e.target.value)} 
                  onBlur={() => setTimeout(() => setShowCustTips({field: null, list: []}), 200)} />
                {showCustTips.field === 'name' && showCustTips.list.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-slate-100 rounded-lg z-[60] mt-1">
                      {showCustTips.list.map(c => <div key={c.id} onClick={() => selectCustTip(c)} className="p-2 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-50">{c.name} - {c.phone}</div>)}
                  </div>
                )}
              </div>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-slate-400"/>
                <input value={customer.phone} placeholder="Số điện thoại" className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" 
                  onChange={e => handleCustInput('phone', e.target.value)} 
                  onBlur={() => setTimeout(() => setShowCustTips({field: null, list: []}), 200)}/>
                {showCustTips.field === 'phone' && showCustTips.list.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-slate-100 rounded-lg z-[60] mt-1">
                      {showCustTips.list.map(c => <div key={c.id} onClick={() => selectCustTip(c)} className="p-2 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-50">{c.phone} - {c.name}</div>)}
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Danh sách items - Tự động giãn nở */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-xs py-10">
               <ShoppingCart size={40} className="mb-2" />
               Giỏ hàng trống
             </div>
          ) : cart.map(i => (
            <div key={i.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase truncate flex-1 pr-2">{i.name}</p>
                <button onClick={() => setCart(cart.filter(x => x.id !== i.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                  <button onClick={() => updateQty(i.id, -1)} className="p-1.5 text-slate-400"><Minus size={12}/></button>
                  <span className="w-8 text-center text-[11px] font-bold">{i.qty}</span>
                  <button onClick={() => updateQty(i.id, 1)} className="p-1.5 text-slate-400"><Plus size={12}/></button>
                </div>
                <div className="flex items-center gap-1 flex-1 max-w-[120px] bg-white border border-slate-200 rounded px-1">
                  <input type="number" placeholder="Giảm" value={i.itemDiscountValue || ''} className="w-full py-1 text-[10px] font-bold text-orange-600 outline-none bg-transparent" onChange={(e) => updateItemDiscount(i.id, e.target.value)} />
                  <button onClick={() => updateItemDiscount(i.id, undefined, i.itemDiscountType === 'VND' ? '%' : 'VND')} className="text-[9px] font-bold text-slate-400">{i.itemDiscountType}</button>
                </div>
                <p className="text-xs font-black text-slate-900">{(i.qty * i.price - calculateItemDiscount(i)).toLocaleString()}đ</p>
              </div>
            </div>
          ))}
        </div>

        {/* Panel Thanh toán - Bám dính phía dưới, không bị che */}
        <div className="bg-slate-900 text-white p-4 lg:p-6 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Giảm giá tổng</span>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <input type="number" value={discountTotal.value || ''} className="bg-transparent px-3 py-1 text-right text-blue-400 font-bold outline-none w-20 text-sm" onChange={e => setDiscountTotal({...discountTotal, value: Number(e.target.value)})} />
                  <button onClick={() => setDiscountTotal({...discountTotal, type: discountTotal.type === 'VND' ? '%' : 'VND'})} className="bg-slate-700 px-2 py-1 text-[10px] font-bold border-l border-slate-600">{discountTotal.type}</button>
              </div>
            </div>
            
            <div className="flex justify-between items-end py-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng cần thu</span>
              <span className="text-2xl font-black text-white">{finalTotal.toLocaleString()}đ</span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Khách đưa</p>
                <input type="number" value={customerCash || ''} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-md font-black text-green-400 outline-none" placeholder="0" onChange={e => setCustomerCash(Number(e.target.value))} />
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Tiền thối</p>
                <div className="p-2 text-md font-black text-orange-400 bg-slate-800/50 rounded-lg border border-white/5 truncate">{changeDue.toLocaleString()}đ</div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => handleCheckout(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2 transition-all">
                  <CheckCircle size={16} /> Lưu Đơn
              </button>
              <button onClick={() => handleCheckout(true)} className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                  <Printer size={18} /> In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* In ẩn */}
      <div style={{ display: 'none' }}>
        {printData && (
            <InvoiceTemplate 
              ref={printRef} 
              shopInfo={shopInfo}
              config={config}
              data={printData} 
            />
        )}
      </div>
    </div>
  );
}