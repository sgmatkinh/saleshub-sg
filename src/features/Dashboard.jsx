import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  Clock, Calendar, ArrowUpRight, ChevronRight, Eye,
  ShoppingCart // <-- Thiếu thằng này nè mày
} from 'lucide-react';

export default function Dashboard({ setTab }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayRev: 0, monthRev: 0, yearRev: 0, totalOrders: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeRange, setTimeRange] = useState(7); // 7, 30, 60, 90 ngày
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. Đồng hồ điện tử chạy liên tục
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let todayRev = 0;
      let monthRev = 0;
      let yearRev = 0;

      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const orderTotal = Number(order.final_total || 0);

        if (orderDate.toLocaleDateString('en-CA') === todayStr) todayRev += orderTotal;
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) monthRev += orderTotal;
        if (orderDate.getFullYear() === currentYear) yearRev += orderTotal;
      });

      setStats({ todayRev, monthRev, yearRev, totalOrders: orders.length });
      setRecentOrders(orders.slice(0, 5)); 

      const lastNDays = [...Array(timeRange)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (timeRange - 1 - i));
        return {
          date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          revenue: orders
            .filter(o => new Date(o.created_at).toLocaleDateString('en-CA') === d.toLocaleDateString('en-CA'))
            .reduce((sum, o) => sum + Number(o.final_total), 0)
        };
      });
      setChartData(lastNDays);

    } catch (err) {
      console.error("Lỗi Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#F1F3F6] min-h-full space-y-6 font-sans">
      
      {/* HEADER: ĐỒNG HỒ & CHÀO HỎI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bảng điều khiển</h1>
          <p className="text-slate-500 text-sm font-medium italic">Chào mày, chúc mày hôm nay chốt thật nhiều đơn!</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-blue-600 font-mono">
              {currentTime.toLocaleTimeString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <Clock className="text-slate-300" size={28} />
        </div>
      </div>

      {/* TỔNG QUAN DOANH THU */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Doanh thu hôm nay", value: stats.todayRev, icon: DollarSign, color: "bg-blue-500" },
          { label: "Doanh thu tháng này", value: stats.monthRev, icon: TrendingUp, color: "bg-emerald-500" },
          { label: "Doanh thu năm nay", value: stats.yearRev, icon: Calendar, color: "bg-violet-500" },
          { label: "Tổng đơn hàng", value: stats.totalOrders, icon: ShoppingBag, color: "bg-orange-500", noVND: true }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${item.color} text-white`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-xl font-black text-slate-800">
                {item.value.toLocaleString()}{item.noVND ? '' : 'đ'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* BIỂU ĐỒ DOANH THU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Biểu đồ doanh thu
            </h3>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value={7}>7 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={60}>60 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [value.toLocaleString() + 'đ', 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart size={18} className="text-violet-500" /> Phân tích cột
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-7)}>
                <XAxis dataKey="date" fontSize={9} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [value.toLocaleString() + 'đ', 'Doanh thu']} />
                <Bar dataKey="revenue" radius={[10, 10, 10, 10]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#c4b5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ĐƠN HÀNG GẦN NHẤT */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={18} className="text-orange-500" /> Hóa đơn bán lẻ gần nhất
          </h3>
          <button 
            onClick={() => setTab('orders')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">Khách hàng</th>
                <th className="p-4 text-center">Sản phẩm</th>
                <th className="p-4 text-right">Tổng tiền</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-700 text-sm">{order.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{new Date(order.created_at).toLocaleTimeString('vi-VN')}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                      {order.items?.length || 0} món
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-slate-900">
                    {order.final_total.toLocaleString()}đ
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center justify-center gap-1">
                      <ArrowUpRight size={12} /> Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}