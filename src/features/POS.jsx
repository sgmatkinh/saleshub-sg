import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useReactToPrint } from 'react-to-print'; 
import emailjs from '@emailjs/browser'; // CHÈN THÊM: Thư viện gửi mail
import InvoiceTemplate from '../components/InvoiceTemplate'; 
import {  
  ShoppingCart, CheckCircle, Trash2, Search, Loader2,  
  User, Phone, FileText, Plus, Minus, Mail, Tag, Sparkles, Printer, XCircle, Info
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
    loading && setLoading(false);
  };

  const showAlert = (title, msg, type = 'info') => {
    setAlertMsg({ show: true, title, msg, type });
    if (type !== 'error') {
        setTimeout(() => setAlertMsg({ ...alertMsg, show: false }), 3000);
    }
  };

  // --- HÀM GỬI EMAIL ĐÃ SỬA: DÁN MÃ TRỰC TIẾP ---
  const sendEmailNotification = (orderData) => {
    const details = orderData.items.map(i => `- ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString()}đ`).join('\n');

    const templateParams = {
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      final_total: `${orderData.finalTotal.toLocaleString()}đ`,
      order_details: details,
      note: orderData.note || "Không có"
    };

    // Mày dán mã của mày vào 3 dòng dưới này:
    const serviceId = "service_eegdor5";
    const templateId = "template_fg5v24i";
    const publicKey = "6LYTzg-KAHISrLlTl";

    if (serviceId && templateId && publicKey) {
        emailjs.send(serviceId, templateId, templateParams, publicKey)
          .then(() => console.log('Email đã gửi thành công mày ơi!'))
          .catch((err) => console.error('Lỗi gửi mail rồi:', err));
    } else {
        console.error("Thiếu mã EmailJS trong code rồi mày.");
    }
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
      
      // GỬI MAIL THÔNG BÁO
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

  if (loading) return <div className="flex h-full items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#F8FAFC] p-4 gap-4 font-sans text-slate-700 relative">
      
      {alertMsg.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className={`p-4 flex items-center gap-3 ${alertMsg.type === 'error' ? 'bg-red-50 text-red-600' : alertMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {alertMsg.type === 'error' ? <XCircle size={24}/> : alertMsg.type === 'success' ? <CheckCircle size={24}/> : <Info size={24}/>}
                    <h4 className="font-black uppercase text-sm tracking-tighter">{alertMsg.title}</h4>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">{alertMsg.msg}</p>
                    <button onClick={() => setAlertMsg({ ...alertMsg, show: false })} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-colors">Đã rõ</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex-[1.5] flex flex-col gap-4 overflow-hidden">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input  
              type="text" placeholder="Gõ tên sản phẩm để tìm kiếm..."  
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-sm font-medium"
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
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mr-1">
              <Sparkles size={12} className="text-amber-500" /> Gợi ý:
            </span>
            {hotProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="px-3 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100 rounded-full text-[11px] font-semibold text-blue-600 transition-all active:scale-90">+ {p.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-1 no-scrollbar">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col group active:scale-95 h-fit">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">{p.category}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Tồn: {p.stock}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm line-clamp-2 mb-3 h-10 uppercase">{p.name}</h4>
                <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-md font-black text-slate-900">{p.price.toLocaleString()}đ</p>
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg"><Plus size={14}/></div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-300 py-20">
              <Search size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium italic">Nhập tên sản phẩm để bắt đầu bán hàng...</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-[450px] flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-4 bg-slate-50/50">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                  <ShoppingCart size={18} className="text-blue-600" /> Giỏ hàng ({cart.length})
                </h3>
                <button onClick={() => setCart([])} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase">Xóa giỏ</button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 relative">
               <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-slate-400"/>
                  <input value={customer.name} placeholder="Tên khách hàng" className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" 
                    onChange={e => handleCustInput('name', e.target.value)} 
                    onBlur={() => setTimeout(() => setShowCustTips({field: null, list: []}), 200)} />
                  {showCustTips.field === 'name' && showCustTips.list.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-slate-100 rounded-lg z-[60] mt-1">
                        {showCustTips.list.map(c => <div key={c.id} onClick={() => selectCustTip(c)} className="p-2 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">{c.name} - {c.phone}</div>)}
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
                        {showCustTips.list.map(c => <div key={c.id} onClick={() => selectCustTip(c)} className="p-2 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">{c.phone} - {c.name}</div>)}
                    </div>
                  )}
               </div>
               <div className="relative col-span-2">
                  <Mail size={14} className="absolute left-3 top-3 text-slate-400"/>
                  <input value={customer.email} placeholder="Email khách hàng" className="w-full pl-9 p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" 
                    onChange={e => handleCustInput('email', e.target.value)}
                    onBlur={() => setTimeout(() => setShowCustTips({field: null, list: []}), 200)} />
               </div>
               <div className="relative col-span-2">
                  <FileText size={14} className="absolute left-3 top-3 text-slate-400"/>
                  <textarea value={customer.note} placeholder="Ghi chú đơn hàng..." className="w-full pl-9 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400 h-10 resize-none" onChange={e => setCustomer({...customer, note: e.target.value})} />
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {cart.map(i => (
              <div key={i.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-slate-700 uppercase truncate flex-1 pr-2">{i.name}</p>
                  <button onClick={() => setCart(cart.filter(x => x.id !== i.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                    <button onClick={() => updateQty(i.id, -1)} className="p-1.5 text-slate-400 hover:text-blue-500"><Minus size={12}/></button>
                    <span className="w-8 text-center text-xs font-bold">{i.qty}</span>
                    <button onClick={() => updateQty(i.id, 1)} className="p-1.5 text-slate-400 hover:text-blue-500"><Plus size={12}/></button>
                  </div>
                  <div className="flex items-center gap-1 flex-1 max-w-[140px] bg-white border border-slate-200 rounded px-1">
                    <Tag size={12} className="text-orange-400"/>
                    <input type="number" placeholder="Giảm" value={i.itemDiscountValue || ''} className="w-full py-1 text-[10px] font-bold text-orange-600 outline-none" onChange={(e) => updateItemDiscount(i.id, e.target.value)} />
                    <button onClick={() => updateItemDiscount(i.id, undefined, i.itemDiscountType === 'VND' ? '%' : 'VND')} className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded hover:bg-orange-100 text-slate-600">{i.itemDiscountType}</button>
                  </div>
                  <p className="text-sm font-black text-slate-900">{(i.qty * i.price - calculateItemDiscount(i)).toLocaleString()}đ</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-t-3xl shadow-2xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Giảm giá tổng</span>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <input type="number" value={discountTotal.value || ''} className="bg-transparent px-3 py-1 text-right text-blue-400 font-bold outline-none w-20" onChange={e => setDiscountTotal({...discountTotal, value: Number(e.target.value)})} />
                    <button onClick={() => setDiscountTotal({...discountTotal, type: discountTotal.type === 'VND' ? '%' : 'VND'})} className="bg-slate-700 px-2 py-1 text-[10px] font-bold hover:bg-blue-600 transition-colors border-l border-slate-600">{discountTotal.type}</button>
                </div>
              </div>
              <div className="flex justify-between items-end py-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng cần thu</span>
                <span className="text-3xl font-black text-white">{finalTotal.toLocaleString()}đ</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tiền khách đưa</p>
                  <input type="number" value={customerCash || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xl font-black text-green-400 outline-none" placeholder="0" onChange={e => setCustomerCash(Number(e.target.value))} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tiền thối lại</p>
                  <div className="p-3 text-xl font-black text-orange-400 bg-slate-800/50 rounded-xl border border-white/5">{changeDue.toLocaleString()}đ</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => handleCheckout(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10">
                    <CheckCircle size={18} /> Thanh toán & Lưu Đơn
                </button>
                <button onClick={() => handleCheckout(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                    <Printer size={20} /> Thanh toán & In Hóa Đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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