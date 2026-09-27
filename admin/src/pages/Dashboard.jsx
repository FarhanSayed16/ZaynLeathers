import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bar, Pie, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js"
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import { adminHeaders } from '../utils/adminApi'
import PageHeader from '../components/PageHeader'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
)

const Dashboard = ({ token }) => {
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('monthly')
  
  // Dashboard data states matching your backend response
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0
  })
  
  const [revenue, setRevenue] = useState({
    toteRevenue: 0,
    accessoriesRevenue: 0
  })
  
  const [ordersOverview, setOrdersOverview] = useState({
    toteOrders: 0,
    accessoriesOrders: 0
  })
  
  const [paymentMethods, setPaymentMethods] = useState({
    COD: 0,
    Razorpay: 0
  })
  
  const [statusStats, setStatusStats] = useState({
    OrderPlaced: 0,
    Packing: 0,
    Shipped: 0,
    OutForDelivery: 0,
    Delivered: 0,
    Cancelled: 0
  })
  
  const [recentOrders, setRecentOrders] = useState([])

  const [lowStock, setLowStock] = useState({
    critical: [],
    low: [],
    totalLowSkus: 0,
    totalOutSkus: 0,
    threshold: 3,
    loading: true,
  })
  
  // Monthly revenue trend data
  const [revenueTrend, setRevenueTrend] = useState({
    labels: [],
    apparelData: [],
    accessoriesData: [],
    combinedData: []
  })

  // Fetch dashboard data from correct endpoint
  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${backendUrl}/api/order/dashboard`, {
        headers: adminHeaders(token)
      })
      
      if (response.data.success) {
        const data = response.data
        
        // Set all the data from the API response
        setStats(data.stats || {
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0,
          totalRevenue: 0
        })
        
        setRevenue(data.revenue || {
          toteRevenue: 0,
          accessoriesRevenue: 0
        })
        
        setOrdersOverview(data.ordersOverview || {
          toteOrders: 0,
          accessoriesOrders: 0
        })
        
        setPaymentMethods(data.paymentMethods || {
          COD: 0,
          Razorpay: 0
        })
        
        setStatusStats(data.statusStats || {
          OrderPlaced: 0,
          Packing: 0,
          Shipped: 0,
          OutForDelivery: 0,
          Delivered: 0,
          Cancelled: 0
        })
        
        setRecentOrders(data.recentOrders || [])
        
        // Calculate revenue trend from recent orders
        if (data.recentOrders && data.recentOrders.length > 0) {
          calculateRevenueTrend(data.recentOrders)
        }
      } else {
        toast.error(response.data.message || "Failed to fetch dashboard data")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStock = async () => {
    if (!token) {
      setLowStock((s) => ({ ...s, loading: false }))
      return
    }
    try {
      const response = await axios.get(`${backendUrl}/api/product/low-stock`, {
        headers: adminHeaders(token),
        params: { limit: 10 },
      })
      if (response.data.success) {
        setLowStock({
          critical: response.data.critical || [],
          low: response.data.low || [],
          totalLowSkus: response.data.totalLowSkus || 0,
          totalOutSkus: response.data.totalOutSkus || 0,
          threshold: response.data.threshold ?? 3,
          loading: false,
        })
      }
    } catch (error) {
      console.error("Low stock fetch failed:", error)
      setLowStock((s) => ({ ...s, loading: false }))
    }
  }

  // Calculate revenue trend based on selected timeframe
  const calculateRevenueTrend = (orders) => {
    const trendData = {}
    
    orders.forEach(order => {
      const date = new Date(order.date)
      let label
      
      switch(timeframe) {
        case 'daily':
          label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          break
        case 'weekly':
          const weekNumber = Math.ceil(date.getDate() / 7)
          label = `Week ${weekNumber}, ${date.toLocaleDateString('en-IN', { month: 'short' })}`
          break
        case 'monthly':
          label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
          break
        case 'yearly':
          label = date.getFullYear().toString()
          break
        default:
          label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      }
      
      if (!trendData[label]) {
        trendData[label] = { apparel: 0, accessories: 0, total: 0 }
      }
      
      const orderTotal = order.amount || 0
      trendData[label].total += orderTotal
      
      // Split by department (accessories vs apparel/bags)
      let isAccessories = false
      for (const item of order.items || []) {
        const cat = item.department || item.category || ""
        if (cat === "accessories" || cat === "Accessory") {
          isAccessories = true
          break
        }
      }
      
      if (isAccessories) {
        trendData[label].accessories += orderTotal
      } else {
        trendData[label].apparel += orderTotal
      }
    })

    // Sort by date
    const sortedLabels = Object.keys(trendData).sort((a, b) => {
      if (timeframe === 'yearly') {
        return parseInt(a) - parseInt(b)
      }
      return new Date(a) - new Date(b)
    })

    setRevenueTrend({
      labels: sortedLabels.length ? sortedLabels : ['No Data'],
      apparelData: sortedLabels.map(label => trendData[label]?.apparel || 0),
      accessoriesData: sortedLabels.map(label => trendData[label]?.accessories || 0),
      combinedData: sortedLabels.map(label => trendData[label]?.total || 0)
    })
  }

  useEffect(() => {
    fetchDashboardData()
    fetchLowStock()
  }, [token])

  // Recalculate trend when timeframe changes
  useEffect(() => {
    if (recentOrders.length > 0) {
      calculateRevenueTrend(recentOrders)
    }
  }, [timeframe])

  // Summary cards data
  const summary = [
    { 
      title: "Total Orders", 
      value: stats.totalOrders.toLocaleString(),
    },
    { 
      title: "Total Products", 
      value: stats.totalProducts.toLocaleString(),
    },
    { 
      title: "Total Users", 
      value: stats.totalUsers.toLocaleString(),
    },
    { 
      title: "Total Revenue", 
      value: `₹${stats.totalRevenue.toLocaleString()}`,
    }
  ]

  // Revenue percentages (apparel = men+women; bags tracked separately in API when present)
  const apparelRev = revenue.apparelRevenue ?? revenue.toteRevenue ?? 0
  const bagsRev = revenue.bagsRevenue ?? 0
  const accRev = revenue.accessoriesRevenue ?? 0
  const totalRevenue = (apparelRev + bagsRev + accRev) || stats.totalRevenue
  const apparelPercent = totalRevenue ? ((apparelRev / totalRevenue) * 100).toFixed(1) : 0
  const bagsPercent = totalRevenue ? ((bagsRev / totalRevenue) * 100).toFixed(1) : 0
  const accessoriesPercent = totalRevenue ? ((accRev / totalRevenue) * 100).toFixed(1) : 0

  // Bar chart data - Orders Distribution by Type
  const ordersDistributionData = {
    labels: ["Apparel", "Bags", "Accessories"],
    datasets: [
      {
        label: "Orders Count",
        data: [
          ordersOverview.apparelOrders ?? ordersOverview.toteOrders ?? 0,
          ordersOverview.bagsOrders ?? 0,
          ordersOverview.accessoriesOrders ?? 0,
        ],
        backgroundColor: ["#6B3A2A", "#C4A574", "#2C1810"],
        borderRadius: 4,
      },
    ],
  }

  // Pie chart data - Order Status Distribution
  const orderStatusData = {
    labels: ["Order Placed", "Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
    datasets: [
      {
        data: [
          statusStats.OrderPlaced,
          statusStats.Packing,
          statusStats.Shipped,
          statusStats.OutForDelivery,
          statusStats.Delivered,
          statusStats.Cancelled
        ],
        backgroundColor: [
          "#C4A574",
          "#E8DED2",
          "#8B5A3C",
          "#6B3A2A",
          "#89c9b8",
          "#B45353",
        ],
        borderWidth: 0,
      },
    ],
  }

  // Pie chart data - Payment Methods
  const paymentMethodData = {
    labels: ["COD", "Razorpay", "Partial"],
    datasets: [
      {
        data: [paymentMethods.COD, paymentMethods.Razorpay, paymentMethods.Partial || 0],
        backgroundColor: ["#2C1810", "#6B3A2A", "#C4A574"],
        borderWidth: 0,
      },
    ],
  }

  // Stacked bar chart - Orders by Type
  const ordersByTypeData = {
    labels: ["Apparel", "Bags", "Accessories"],
    datasets: [
      {
        label: "Total Orders",
        data: [
          ordersOverview.apparelOrders ?? ordersOverview.toteOrders ?? 0,
          ordersOverview.bagsOrders ?? 0,
          ordersOverview.accessoriesOrders ?? 0,
        ],
        backgroundColor: ["#6B3A2A", "#C4A574", "#2C1810"],
      },
    ],
  }

  // Line chart data - Revenue Trend
  const revenueLineData = {
    labels: revenueTrend.labels,
    datasets: [
      {
        label: "Apparel",
        data: revenueTrend.apparelData,
        borderColor: "#6B3A2A",
        backgroundColor: "rgba(107, 58, 42, 0.12)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#6B3A2A",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: "Accessories",
        data: revenueTrend.accessoriesData,
        borderColor: "#C4A574",
        backgroundColor: "rgba(196, 165, 116, 0.12)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#C4A574",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-2 border-tz-navy border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Orders, revenue, and department mix for Zayn Leathers."
        actions={
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft hover:shadow-soft transition-all"
          >
            <p className="text-tz-navy/60 font-semibold text-sm">{item.title}</p>
            <h2 className="text-3xl font-display font-bold mt-2 text-tz-navy">{item.value}</h2>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-tz-navy">Inventory alerts</h3>
            <p className="text-sm text-tz-navy/60 mt-1">
              Sizes at or below {lowStock.threshold} units need restocking.
            </p>
          </div>
          <Link
            to="/list"
            className="text-sm font-semibold text-tz-pink hover:underline"
          >
            View all products →
          </Link>
        </div>

        {lowStock.loading ? (
          <div className="h-24 bg-tz-navy/5 rounded-xl animate-pulse" />
        ) : lowStock.totalOutSkus === 0 && lowStock.totalLowSkus === 0 ? (
          <p className="text-sm text-tz-navy/50 py-4">All active SKUs are above the low-stock threshold.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {lowStock.critical.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-tz-cherry mb-2">
                  Out of stock ({lowStock.totalOutSkus})
                </p>
                <ul className="space-y-2">
                  {lowStock.critical.map((row) => (
                    <li key={`${row.productId}-${row.size}`} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-tz-navy truncate">
                        {row.name}
                        {row.color ? ` · ${row.color}` : ""} — {row.size}
                      </span>
                      <Link
                        to={row.editPath}
                        className="shrink-0 text-xs font-semibold text-tz-cherry hover:underline"
                      >
                        Edit
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lowStock.low.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                  Low stock ({lowStock.totalLowSkus})
                </p>
                <ul className="space-y-2">
                  {lowStock.low.map((row) => (
                    <li key={`${row.productId}-${row.size}`} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-tz-navy truncate">
                        {row.name}
                        {row.color ? ` · ${row.color}` : ""} — {row.size}
                        <span className="text-tz-navy/50"> ({row.qty} left)</span>
                      </span>
                      <Link
                        to={row.editPath}
                        className="shrink-0 text-xs font-semibold text-tz-pink hover:underline"
                      >
                        Edit
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revenue Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-tz-navy/60 font-semibold text-sm">Apparel Revenue</p>
              <h2 className="text-2xl font-display font-bold mt-2 text-tz-navy">
                ₹{(revenue.apparelRevenue ?? revenue.toteRevenue ?? 0).toLocaleString()}
              </h2>
            </div>
            <div className="w-10 h-10 bg-tz-pink-soft rounded-full flex items-center justify-center">
              <span className="text-tz-pink font-bold text-sm">A</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-tz-navy/60">Share of total</span>
              <span className="text-tz-pink">{apparelPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className="bg-tz-pink h-1.5 rounded-full" 
                style={{ width: `${apparelPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-tz-navy/60 font-semibold text-sm">Bags Revenue</p>
              <h2 className="text-2xl font-display font-bold mt-2 text-tz-navy">
                ₹{(revenue.bagsRevenue || 0).toLocaleString()}
              </h2>
            </div>
            <div className="w-10 h-10 bg-tz-cream rounded-full flex items-center justify-center">
              <span className="text-tz-navy font-bold text-sm">B</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-tz-navy/60">Share of total</span>
              <span className="text-tz-navy">{bagsPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className="bg-[#C4A574] h-1.5 rounded-full" 
                style={{ width: `${bagsPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Accessories Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-tz-navy/60 font-semibold text-sm">Accessories Revenue</p>
              <h2 className="text-2xl font-display font-bold mt-2 text-tz-navy">
                ₹{(revenue.accessoriesRevenue || 0).toLocaleString()}
              </h2>
            </div>
            <div className="w-10 h-10 bg-tz-navy/10 rounded-full flex items-center justify-center">
              <span className="text-tz-navy font-bold text-sm">A</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-tz-navy/60">Share of total</span>
              <span className="text-tz-navy">{accessoriesPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className="bg-tz-navy h-1.5 rounded-full" 
                style={{ width: `${accessoriesPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Total Revenue */}
        <div className="bg-tz-navy p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 font-semibold text-sm">Total Revenue</p>
              <h2 className="text-2xl font-display font-bold mt-2 text-white">
                ₹{(totalRevenue || 0).toLocaleString()}
              </h2>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">₹</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-white/60">Combined total</span>
              <span className="text-white">100%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-white h-1.5 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Type Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h3 className="text-sm font-semibold text-tz-navy mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-tz-pink rounded-full"></span>
            Apparel Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-tz-navy">
                {ordersOverview.apparelOrders ?? ordersOverview.toteOrders ?? 0}
              </p>
              <p className="text-xs text-tz-navy/60 font-semibold">Line items</p>
            </div>
            <div className="text-center p-3 bg-tz-pink-soft/50 rounded-xl">
              <p className="text-2xl font-bold text-tz-pink">
                ₹{(revenue.apparelRevenue ?? revenue.toteRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-tz-pink/80 font-semibold">Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h3 className="text-sm font-semibold text-tz-navy mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#C4A574" }}></span>
            Bags Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-tz-navy">{ordersOverview.bagsOrders || 0}</p>
              <p className="text-xs text-tz-navy/60 font-semibold">Line items</p>
            </div>
            <div className="text-center p-3 bg-tz-pink-soft/50 rounded-xl">
              <p className="text-2xl font-bold text-tz-pink">
                ₹{(revenue.bagsRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-tz-pink/80 font-semibold">Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h3 className="text-sm font-semibold text-tz-navy mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-tz-navy rounded-full"></span>
            Accessories Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-tz-navy">{ordersOverview.accessoriesOrders || 0}</p>
              <p className="text-xs text-tz-navy/60 font-semibold">Line items</p>
            </div>
            <div className="text-center p-3 bg-tz-pink-soft/50 rounded-xl">
              <p className="text-2xl font-bold text-tz-pink">
                ₹{(revenue.accessoriesRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-tz-pink/80 font-semibold">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Orders Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h2 className="text-sm font-semibold mb-4 text-tz-navy">
            Orders Distribution by Type
          </h2>
          <Bar 
            data={ordersDistributionData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }} 
          />
          <div className="mt-4 flex justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "#6B3A2A" }}></div>
              <span className="text-xs font-semibold text-tz-navy">
                Apparel ({ordersOverview.apparelOrders ?? ordersOverview.toteOrders ?? 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "#C4A574" }}></div>
              <span className="text-xs font-semibold text-tz-navy">
                Bags ({ordersOverview.bagsOrders || 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "#2C1810" }}></div>
              <span className="text-xs font-semibold text-tz-navy">
                Accessories ({ordersOverview.accessoriesOrders || 0})
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart - Payment Methods */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h2 className="text-sm font-semibold mb-4 text-tz-navy">
            Payment Methods
          </h2>
          <div className="max-w-md mx-auto">
            <Pie 
              data={paymentMethodData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Pie Chart - Order Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h2 className="text-sm font-semibold mb-4 text-tz-navy">
            Order Status Distribution
          </h2>
          <div className="max-w-md mx-auto">
            <Pie 
              data={orderStatusData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: 11
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Bar Chart - Orders by Type (Simple) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft">
          <h2 className="text-sm font-semibold mb-4 text-tz-navy">
            Orders by Product Type
          </h2>
          <Bar 
            data={ordersByTypeData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }} 
          />
        </div>

        {/* Line Chart - Revenue Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-tz-pink-soft lg:col-span-2">
          <h2 className="text-sm font-semibold mb-4 text-tz-navy">
            Revenue Trend ({timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})
          </h2>
          {revenueTrend.labels[0] === 'No Data' ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
              No revenue data available for this timeframe
            </div>
          ) : (
            <Line data={revenueLineData} options={lineOptions} />
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-tz-pink-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-tz-pink-soft flex justify-between items-center">
          <h2 className="text-sm font-semibold text-tz-navy">Recent orders</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-tz-pink-soft text-tz-navy text-xs rounded-full">Apparel</span>
            <span className="px-3 py-1 bg-tz-cream text-tz-navy text-xs rounded-full">Bags</span>
            <span className="px-3 py-1 bg-tz-navy/10 text-tz-navy text-xs rounded-full">Accessories</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 8).map((order) => {
                const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                const orderTotal = order.amount || 0
                const mainStatus = order.items?.[0]?.status || 'OrderPlaced'
                
                // Determine department badge from line items
                let badge = "Apparel"
                for (const item of order.items || []) {
                  const dept = item.department || item.category || ""
                  if (dept === "accessories" || dept === "Accessory") {
                    badge = "Accessories"
                    break
                  }
                  if (dept === "bags") {
                    badge = "Bags"
                    break
                  }
                }
                
                return (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">
                      <Link to={`/orders/${order._id}`} className="underline font-semibold text-tz-navy">
                        #{order._id?.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        badge === "Accessories"
                          ? "bg-tz-navy/10 text-tz-navy"
                          : badge === "Bags"
                            ? "bg-tz-cream text-tz-navy"
                            : "bg-tz-pink-soft text-tz-navy"
                      }`}>
                        {badge}
                      </span>
                    </td>
                    <td className="px-6 py-4">{order.address?.firstName} {order.address?.lastName}</td>
                    <td className="px-6 py-4">{totalItems} items</td>
                    <td className="px-6 py-4 font-medium">₹{Number(orderTotal).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.payment ? 'bg-[#89c9b8]/30 text-[#4c8c7b]' : 'bg-tz-cream text-tz-navy/80'
                      }`}>
                        {order.payment ? 'Paid' : 'COD'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${mainStatus === 'Delivered' ? 'bg-[#89c9b8]/30 text-[#4c8c7b]' : ''}
                        ${mainStatus === 'Cancelled' ? 'bg-tz-cherry/10 text-tz-cherry' : ''}
                        ${mainStatus === 'Shipped' ? 'bg-[#9AD0F5]/30 text-[#6099c2]' : ''}
                        ${mainStatus === 'OutForDelivery' ? 'bg-tz-pink-soft/50 text-tz-pink' : ''}
                        ${mainStatus === 'Packing' ? 'bg-tz-cream text-tz-navy/80' : ''}
                        ${mainStatus === 'OrderPlaced' ? 'bg-tz-blue-soft/50 text-tz-blue' : ''}
                      `}>
                        {mainStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard