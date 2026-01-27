import React, { forwardRef } from 'react';
// Import hình ảnh từ thư mục assets mày đã tạo
import logoShop from '../assets/images/logo-shop-net.png';
import qrPayment from '../assets/images/qr-thanh-toan.png';

const InvoiceTemplate = forwardRef(({ data, shopInfo, config }, ref) => {
  if (!data) return null;

  // Lấy cấu hình khổ giấy từ Settings, mặc định 80mm
  const printWidth = config?.printSize === '58mm' ? '58mm' : '80mm';
  
  // FIX: Hỗ trợ cả biến từ POS (customerPaid) và biến từ Database (customer_cash)
  const khachDua = Number(data.customerPaid || data.customer_cash || 0);
  
  // FIX: Hỗ trợ cả biến từ POS (finalTotal) và biến từ Database (final_total)
  const tongBill = Number(data.finalTotal || data.final_total || 0);
  
  // FIX: Tính toán số tiền thối lại chính xác
  const changeAmount = khachDua - tongBill;

  return (
    <div className="hidden">
      <div 
        ref={ref} 
        className="bg-white text-black print:block antialiased" 
        style={{ 
          width: printWidth, 
          margin: '0 auto',
          fontSize: "14px", 
          lineHeight: "1.4",
          color: "#000",
          fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: "500" // Tăng độ đậm mặc định cho nét chữ
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { 
              size: ${printWidth} auto; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            /* Đảm bảo nội dung luôn ở trung tâm khổ giấy */
            .print-container { 
              padding-left: 3mm !important; 
              padding-right: 3mm !important; 
              width: 100%;
              box-sizing: border-box;
            }
            /* Ép chữ đen đậm để máy in nhiệt bắt nét tốt hơn */
            * { color: black !important; }
            h1, h2, h3, b, strong, .font-black { font-weight: 900 !important; }
            /* Khử bóng và các hiệu ứng màu để máy in nhiệt in rõ nét */
            img { filter: grayscale(100%) contrast(150%) !important; }
          }
        `}} />
        
        {/* 1. LOGO & HEADER */}
        <div className="flex flex-col items-center text-center pt-4 mb-4 w-full print-container">
          <img 
            src={logoShop} 
            alt="logo shop" 
            className="w-20 h-20 object-contain mb-2 mx-auto block"
            style={{ 
              display: 'block', 
              maxWidth: '80px',
              // TAO ĐÃ BỎ brightness(0) Ở ĐÂY - ĐỂ NÓ HIỂN THỊ ĐÚNG HÌNH DẠNG LOGO
            }} 
            onError={(e) => e.target.style.display = 'none'} 
          />
          <h1 className="text-xl font-black uppercase w-full tracking-tight">
            {shopInfo?.name || config?.shopName || 'SALESHUB-SG'}
          </h1>
          <p className="text-[12px] leading-tight px-2 w-full font-semibold">
            {shopInfo?.address || config?.address}
          </p>
          <p className="text-[14px] font-black w-full mt-1">
            Hotline: {shopInfo?.phone || config?.phone || '0707827837'}
          </p>
        </div>

        <div className="border-b-2 border-black mb-3 mx-3"></div>

        {/* 2. THÔNG TIN ĐƠN HÀNG */}
        <div className="text-center mb-3 print-container">
          <h3 className="text-[17px] font-black uppercase">Hóa Đơn Bán Lẻ</h3>
          <p className="text-[11px] font-bold">{new Date(data.created_at || new Date()).toLocaleString('vi-VN')}</p>
          <p className="text-[11px] font-black">Mã HD: #{data.id?.toString().slice(0,10).toUpperCase() || 'N/A'}</p>
        </div>

        <div className="mb-3 space-y-1 text-[13px] print-container border-t border-black pt-2">
          <div className="flex justify-between">
            <span className="font-bold">Khách hàng:</span>
            <span className="font-black uppercase">{data.customerName || data.customer_name || 'Khách vãng lai'}</span>
          </div>
          {(data.customerPhone || data.customer_phone) && (
            <div className="flex justify-between font-bold">
              <span>Điện thoại:</span>
              <span>{data.customerPhone || data.customer_phone}</span>
            </div>
          )}
        </div>

        {/* THÔNG SỐ THỊ LỰC */}
        {data.eyeRefraction && (
          <div className="mb-3 p-2 border-2 border-black rounded-sm print-container">
            <p className="text-[11px] font-black uppercase mb-1 border-b border-black text-center">Thông số thị lực</p>
            <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-black">
              <span>Mắt</span><span>Cầu (SPH)</span><span>Trụ (CYL)</span>
              <span className="text-left font-bold italic">Phải (R):</span><span>{data.eyeRefraction.rightSph || '0.00'}</span><span>{data.eyeRefraction.rightCyl || '0.00'}</span>
              <span className="text-left font-bold italic">Trái (L):</span><span>{data.eyeRefraction.leftSph || '0.00'}</span><span>{data.eyeRefraction.leftCyl || '0.00'}</span>
            </div>
          </div>
        )}

        {/* 3. BẢNG SẢN PHẨM */}
        <table className="w-full mb-4 border-collapse print-container">
          <thead>
            <tr className="border-b-2 border-black text-left uppercase text-[12px] font-black">
              <th style={{ width: "55%" }} className="py-2 text-left">Sản phẩm</th>
              <th style={{ width: "15%" }} className="py-2 text-center">SL</th>
              <th style={{ width: "30%" }} className="py-2 text-right">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || data.products)?.map((item, index) => {
              let itemDiscount = 0;
              if (item.itemDiscountType === '%') {
                itemDiscount = (item.price * item.qty * (item.itemDiscountValue || 0)) / 100;
              } else {
                itemDiscount = Number(item.itemDiscountValue || item.discount || 0);
              }

              return (
                <tr key={index} className="align-top text-[13px] border-b border-gray-300">
                  <td className="py-2 pr-1">
                    <div className="font-black uppercase leading-tight">{item.name}</div>
                    {itemDiscount > 0 && (
                      <div className="text-[11px] italic font-bold">
                        - Giảm: {itemDiscount.toLocaleString()}đ
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-center font-black">{item.qty}</td>
                  <td className="py-2 text-right font-black">
                    {((item.qty * item.price) - itemDiscount).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 4. TỔNG CỘNG */}
        <div className="border-t-2 border-black pt-2 space-y-1 print-container">
          <div className="flex justify-between text-[14px] font-bold">
            <span>Tạm tính:</span>
            <span>{Number(data.subTotal || data.subtotal || 0).toLocaleString()}đ</span>
          </div>
          
          {(Number(data.orderDiscount || 0) > 0 || Number(data.discount_amount || 0) > 0) && (
            <div className="flex justify-between italic text-[14px] font-bold">
              <span>Giảm giá bill:</span>
              <span>-{Number(data.orderDiscount || data.discount_amount).toLocaleString()}đ</span>
            </div>
          )}

          <div className="flex justify-between text-[20px] font-black uppercase pt-1 border-t border-black mt-1">
            <span>Tổng cộng:</span>
            <span>{tongBill.toLocaleString()}đ</span>
          </div>
          
          <div className="pt-2 mt-1 border-t border-black">
            <div className="flex justify-between text-[13px] font-bold">
              <span>Khách đưa:</span>
              <span>{khachDua.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between font-black text-[15px]">
              <span>Tiền thối:</span>
              <span>{(changeAmount > 0 ? changeAmount : 0).toLocaleString()}đ</span>
            </div>
          </div>
        </div>

        {/* 5. GHI CHÚ */}
        {data.note && (
          <div className="mt-3 p-2 border-2 border-black text-[12px] font-bold italic print-container">
            Ghi chú: {data.note}
          </div>
        )}

        {/* 6. QR CODE & BANK INFO */}
        <div className="mt-6 flex flex-col items-center text-center w-full print-container pb-8">
          <p className="text-[12px] font-black uppercase mb-2">Thanh toán chuyển khoản</p>
          <img 
            src={qrPayment} 
            alt="QR" 
            className="w-40 h-40 object-contain mb-3 border-2 border-black p-1 mx-auto block"
            style={{ display: 'block', maxWidth: '160px' }}
            onError={(e) => e.target.style.display = 'none'} 
          />
          
          <div className="mb-4">
            <p className="text-[14px] font-black uppercase">VIB BANK</p>
            <p className="text-[22px] font-black tracking-tighter leading-none my-1">707.827.837</p>
            <p className="text-[14px] font-black uppercase">TONG MINH NGUYEN</p>
          </div>

          <p className="font-black italic uppercase text-[15px] border-t-2 border-black w-full pt-2">
            {shopInfo?.footerNote || 'Cảm ơn & Hẹn gặp lại!'}
          </p>
          <p className="text-[10px] mt-2 uppercase font-bold opacity-80">
            Powered by SalesHub-SaiGonOptic
          </p>
        </div>
      </div>
    </div>
  );
});

export default InvoiceTemplate;