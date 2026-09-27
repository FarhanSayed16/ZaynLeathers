import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';
import ConfirmModal from '../components/ConfirmModal';
import WhatsAppCompose from '../components/WhatsAppCompose';
import PageHeader from '../components/PageHeader';
import { adminHeaders, formatAdminAddress, downloadOrdersCsv } from '../utils/adminApi';
import { isWhatsAppEnabled, useAdminFeatures } from '../context/AdminFeaturesContext';

const Orders = ({ token }) => {
  const { features } = useAdminFeatures();
  const whatsappOn = isWhatsAppEnabled(features);
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [shippingConfig, setShippingConfig] = useState({ enabled: false, partner: null });
  const [shippingBusyId, setShippingBusyId] = useState(null);
  const [packageDrafts, setPackageDrafts] = useState({});
  const [pendingStatus, setPendingStatus] = useState(null);
  const [waOrder, setWaOrder] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    paid: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getPkg = (order) => {
    const draft = packageDrafts[order._id] || {};
    return {
      weight: draft.weight ?? order.shipping?.weight ?? 0.5,
      length: draft.length ?? order.shipping?.length ?? 30,
      breadth: draft.breadth ?? order.shipping?.breadth ?? 25,
      height: draft.height ?? order.shipping?.height ?? 8,
    };
  };

  const setPkgField = (orderId, field, value) => {
    setPackageDrafts((prev) => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), [field]: value },
    }));
  };

  const fetchAllOrders = async (opts = {}) => {
    if (!token) return null;
    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {
          page: opts.page ?? currentPage,
          limit: itemsPerPage,
          status: selectedStatus,
          q: searchTerm,
          sortOrder,
          exportAll: Boolean(opts.exportAll),
        },
        { headers: adminHeaders(token) }
      );
      if (response.data.success) {
        if (opts.exportAll) return response.data.orders || [];
        setOrders(response.data.orders || []);
        const pg = response.data.pagination || {};
        setTotalPages(pg.totalPages || 1);
        setTotalFiltered(pg.total ?? (response.data.orders || []).length);
        if (response.data.stats) setStats(response.data.stats);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const exportCsv = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (features.analyticsPro) {
        const q = new URLSearchParams({
          from: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
        });
        const res = await axios.get(`${backendUrl}/api/analytics/export/orders?${q}`, {
          headers: adminHeaders(token),
          responseType: "blob",
        });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-line-items-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        if (res.headers["x-export-truncated"] === "true") {
          toast.info(`Export capped at ${res.headers["x-export-max-rows"] || 10000} rows`);
        }
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {
          page: 1,
          status: selectedStatus,
          q: searchTerm,
          sortOrder,
          exportAll: true,
        },
        { headers: adminHeaders(token) }
      );
      if (response.data.success) {
        downloadOrdersCsv(response.data.orders || []);
      } else {
        toast.error(response.data.message || 'Export failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingConfig = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/shipping/config`);
      if (res.data?.success) {
        setShippingConfig({
          enabled: Boolean(res.data.enabled),
          partner: res.data.partner || null,
        });
      }
    } catch {
      /* shipping config optional */
    }
  };

  const shippingAction = async (orderId, path, body) => {
    if (!token) return;
    setShippingBusyId(orderId);
    try {
      const res = await axios.post(
        `${backendUrl}/api/shipping/shiprocket/${path}/${orderId}`,
        body || {},
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Done');
        if (res.data.labelUrl) window.open(res.data.labelUrl, '_blank');
        await fetchAllOrders();
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Action failed');
    } finally {
      setShippingBusyId(null);
    }
  };

  const createShipment = async (orderId, order) => {
    const pkg = getPkg(order);
    await shippingAction(orderId, 'create', pkg);
  };

  const savePackage = async (orderId, order) => {
    if (!token) return;
    setShippingBusyId(orderId);
    try {
      const res = await axios.patch(
        `${backendUrl}/api/shipping/shiprocket/package/${orderId}`,
        getPkg(order),
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success('Package saved');
        await fetchAllOrders();
      } else {
        toast.error(res.data.message || 'Save failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setShippingBusyId(null);
    }
  };

  const refreshTracking = async (orderId) => {
    if (!token) return;
    setShippingBusyId(orderId);
    try {
      const res = await axios.get(
        `${backendUrl}/api/shipping/shiprocket/track/${orderId}`,
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success('Tracking refreshed');
        await fetchAllOrders();
      } else {
        toast.error(res.data.message || 'Refresh failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setShippingBusyId(null);
    }
  };

  const collectBalance = async (orderId) => {
    if (!token) return;
    setShippingBusyId(orderId);
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/collect-balance`,
        { orderId },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Balance collected');
        await fetchAllOrders();
      } else {
        toast.error(res.data.message || 'Failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setShippingBusyId(null);
    }
  };

  const refundAdvance = async (orderId) => {
    if (!token) return;
    const reason = window.prompt('Refund reason (optional, for customer email)') || '';
    if (!window.confirm('Refund the partial advance via Razorpay?')) return;
    setShippingBusyId(orderId);
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/refund-advance`,
        { orderId, reason },
        { headers: adminHeaders(token) }
      );
      if (res.data.success) {
        toast.success(res.data.message || 'Advance refunded');
        await fetchAllOrders();
      } else {
        toast.error(res.data.message || 'Refund failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setShippingBusyId(null);
    }
  };

  const canCreateShipment = (order) => {
    if (!shippingConfig.enabled) return false;
    if (order.shipping?.awbCode || order.shipping?.shipmentId) return false;
    const shippable = (order.items || []).filter((i) => i.status !== 'Cancelled');
    if (!shippable.length) return false;
    const allTerminal = shippable.every((i) =>
      ['Delivered', 'RTO', 'Returned'].includes(i.status)
    );
    if (allTerminal) return false;
    const isCod = String(order.paymentMethod || '').toUpperCase() === 'COD';
    if (!isCod && !order.payment) return false;
    return true;
  };

  const busy = (orderId) => shippingBusyId === orderId;

  // Change status handler
  const statusHandler = async (orderId, itemId, status) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, itemId, status },
        { headers: adminHeaders(token) }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully");
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed');
    } finally {
      setPendingStatus(null);
    }
  };

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => {
      fetchAllOrders();
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [token, currentPage, selectedStatus, searchTerm, sortOrder]);

  useEffect(() => {
    fetchShippingConfig();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchTerm, sortOrder]);

  const getStatusColor = (status) => {
    const colors = {
      'OrderPlaced': 'bg-tz-blue-soft/50 text-tz-blue',
      'Packing': 'bg-tz-cream text-tz-navy/80',
      'Shipped': 'bg-[#9AD0F5]/30 text-[#6099c2]',
      'OutForDelivery': 'bg-tz-pink-soft/50 text-tz-pink',
      'Delivered': 'bg-[#89c9b8]/30 text-[#4c8c7b]',
      'Cancelled': 'bg-tz-cherry/10 text-tz-cherry',
      'ReturnRequested': 'bg-violet-100 text-violet-800',
      'ReturnInTransit': 'bg-violet-50 text-violet-700',
      'Returned': 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Orders"
          subtitle="Search, pack, export, and message customers from here."
          actions={
            <>
              {shippingConfig.enabled ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#89c9b8]/25 text-[#2f6f62] border border-[#89c9b8]/40">
                  Shipping: {shippingConfig.partner || 'on'}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-tz-navy/60 border border-tz-pink-soft">
                  Shipping: manual
                </span>
              )}
              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-tz-navy text-white"
                title={features.analyticsPro ? "Line-item export (last 90 days)" : "Exports all rows matching the current search and status filter"}
              >
                Export CSV ({totalFiltered})
              </button>
            </>
          }
        />

        {/* Stats Cards - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-tz-pink-soft">
            <p className="text-xs sm:text-sm text-tz-navy/60 font-semibold">Total Orders</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-tz-navy font-display">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-tz-pink-soft">
            <p className="text-xs sm:text-sm text-tz-navy/60 font-semibold">Pending</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-tz-blue font-display">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-tz-pink-soft">
            <p className="text-xs sm:text-sm text-tz-navy/60 font-semibold">Delivered</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#89c9b8] font-display">{stats.delivered}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-tz-pink-soft">
            <p className="text-xs sm:text-sm text-tz-navy/60 font-semibold">Cancelled</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-tz-cherry font-display">{stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-tz-pink-soft col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-tz-navy/60 font-semibold">Paid</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-tz-navy font-display">{stats.paid}</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl border border-tz-pink-soft p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Status Toggle Buttons - Horizontal Scroll on Mobile */}
            <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="flex gap-1.5 sm:gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
                {['All', 'BalanceDue', 'OrderPlaced', 'Packing', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled', 'ReturnRequested', 'RTO', 'Returns', 'CancelledToday'].map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      selectedStatus === status
                        ? 'bg-tz-navy text-white shadow-sm scale-105'
                        : 'bg-white border border-tz-pink-soft text-tz-navy/80 hover:bg-tz-pink-soft/50'
                    }`}
                  >
                    {status === 'BalanceDue'
                      ? 'Balance due'
                      : status === 'CancelledToday'
                        ? 'Cancelled today'
                        : status.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Sort - Stack on Mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <input
                type="text"
                placeholder="Search phone, name, email, order ID, product…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:flex-1 lg:w-64 px-3 py-2 border rounded-xl focus:outline-none text-sm"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-xl focus:outline-none text-sm bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Display */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-tz-navy"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-tz-pink-soft p-8 sm:p-12 text-center">
              <img src={assets.empty_orders} alt="No orders" className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 text-base sm:text-lg">No orders found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-tz-pink-soft overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="bg-tz-cream p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <img src={assets.parcel_icon} alt="Parcel" className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">Order #{order._id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap">
                      <Link
                        to={`/orders/${order._id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tz-navy text-white"
                      >
                        Open
                      </Link>
                      {whatsappOn && (
                        <button
                          type="button"
                          onClick={() => setWaOrder(order)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#25D366] text-white"
                        >
                          WhatsApp
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(formatAdminAddress(order.address));
                          toast.success("Address copied");
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-tz-navy/20"
                      >
                        Copy address
                      </button>
                      {order.orderType && (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-tz-blue-soft/50 text-tz-navy">
                          {order.orderType}
                        </span>
                      )}
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${order.payment ? 'bg-[#89c9b8]/30 text-[#4c8c7b]' : 'bg-tz-cream text-tz-navy/80'}`}>
                        {order.payment
                          ? 'Paid'
                          : order.paymentMethod === 'Partial'
                            ? 'Partial'
                            : 'COD'}
                      </span>
                      {order.paymentMethod === 'Partial' && order.paymentDetails?.advancePaid && !order.paymentDetails?.balancePaid && (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Balance due ₹{order.paymentDetails.balanceAmount}
                        </span>
                      )}
                      {order.paymentMethod === 'Partial' && order.paymentDetails?.advancePaid && order.paymentDetails?.balancePaid && (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-[#89c9b8]/30 text-[#4c8c7b]">
                          Advance + balance paid
                        </span>
                      )}
                      {order.shipping?.awbCode && (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-tz-navy/10 text-tz-navy">
                          Synced via {order.shipping.partner || 'partner'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <h4 className="font-semibold text-gray-700 text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-tz-pink rounded-full"></span>
                            Customer Details
                          </h4>
                          <p className="text-xs sm:text-sm font-medium text-gray-800 flex flex-wrap items-center gap-2">
                            {order.isGuest && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                Guest
                              </span>
                            )}
                            {order.userId ? (
                              <Link to={`/users/${order.userId}`} className="underline">
                                {order.address.firstName} {order.address.lastName}
                              </Link>
                            ) : (
                              <>
                                {order.address.firstName} {order.address.lastName}
                              </>
                            )}
                          </p>
                          {order.shipping?.return?.reason && (
                            <p className="text-xs text-violet-800 mt-1">
                              Return reason: {order.shipping.return.reason}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                            {order.guestEmail || order.address?.email}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">{order.address.phone || order.guestPhone}</p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
                            {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country} - {order.address.zipcode}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <h4 className="font-semibold text-gray-700 text-xs sm:text-sm mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                            Payment Details
                          </h4>
                          <p className="text-xs text-gray-600">Method: {order.paymentMethod}</p>
                          <p className="text-xs text-gray-600">Items: {order.items.length}</p>
                          {order.paymentMethod === 'Partial' && order.paymentDetails && (
                            <div className="mt-1.5 text-xs text-gray-600 space-y-0.5 border-t border-gray-200 pt-1.5">
                              <p>Advance ({order.paymentDetails.advancePercent}%): ₹{order.paymentDetails.advanceAmount}
                                {order.paymentDetails.advancePaid ? ' · paid' : ''}
                              </p>
                              <p>Balance: ₹{order.paymentDetails.balanceAmount}
                                {order.paymentDetails.balancePaid ? ' · collected' : ' · due on delivery'}
                              </p>
                              {!order.paymentDetails.balancePaid && order.paymentDetails.advancePaid && (
                                <button
                                  type="button"
                                  onClick={() => collectBalance(order._id)}
                                  disabled={busy(order._id)}
                                  className="mt-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-tz-navy text-white disabled:opacity-60"
                                >
                                  Mark balance collected
                                </button>
                              )}
                              {order.paymentDetails.advancePaid && !order.paymentDetails.advanceRefunded && (
                                <button
                                  type="button"
                                  onClick={() => refundAdvance(order._id)}
                                  disabled={busy(order._id)}
                                  className="mt-1.5 ml-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-200 text-red-700 disabled:opacity-60"
                                >
                                  Refund advance
                                </button>
                              )}
                              {order.paymentDetails.advanceRefunded && (
                                <p className="text-[#4c8c7b] mt-1">Advance refunded</p>
                              )}
                              {order.paymentDetails.advanceKeptOnRto && !order.paymentDetails.advanceRefunded && (
                                <p className="text-amber-700 mt-1">Advance retained (RTO)</p>
                              )}
                            </div>
                          )}
                          <div className="mt-1 sm:mt-2">
                            <p className="text-sm sm:text-base font-bold text-gray-800">Total: ₹{order.amount}</p>
                            <p className="text-xs text-gray-400">(Including delivery fee)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping partner panel */}
                    {(shippingConfig.enabled || order.shipping?.awbCode || order.shipping?.shipmentId || order.shipping?.return?.requested) && (
                      <div className="mt-3 sm:mt-4 bg-tz-navy/[0.03] border border-tz-navy/10 rounded-lg p-2.5 sm:p-3 space-y-3">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-700 text-xs sm:text-sm mb-1">Courier shipping</h4>
                            {order.shipping?.awbCode || order.shipping?.shipmentId ? (
                              <div className="text-xs text-gray-600 space-y-0.5">
                                {order.shipping.courierName && (
                                  <p>Courier: <span className="font-medium text-gray-800">{order.shipping.courierName}</span></p>
                                )}
                                {order.shipping.awbCode && (
                                  <p>AWB: <span className="font-mono font-medium text-gray-800">{order.shipping.awbCode}</span></p>
                                )}
                                {order.shipping.status && <p>Partner status: {order.shipping.status}</p>}
                                {(order.shipping.freightCharge != null || order.shipping.chargedFee != null) && (
                                  <p className="mt-1">
                                    Cost: partner ₹{order.shipping.freightCharge ?? '—'}
                                    {' · '}
                                    charged ₹{order.shipping.chargedFee ?? 41}
                                  </p>
                                )}
                                {order.shipping.trackingUrl && (
                                  <a
                                    href={order.shipping.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-1 text-tz-blue underline font-medium"
                                  >
                                    Open tracking
                                  </a>
                                )}
                                {order.shipping.labelUrl && (
                                  <a
                                    href={order.shipping.labelUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block ml-3 mt-1 text-tz-blue underline font-medium"
                                  >
                                    Label PDF
                                  </a>
                                )}
                                {order.shipping.pickupScheduled && (
                                  <p className="text-[#4c8c7b] font-medium">Pickup scheduled</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 mb-2">
                                No shipment yet. Set package size, then create shipment for manufacturer pickup.
                              </p>
                            )}

                            {/* Package dims */}
                            {shippingConfig.enabled && !order.shipping?.awbCode && (
                              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg">
                                {['weight', 'length', 'breadth', 'height'].map((field) => (
                                  <label key={field} className="text-[10px] text-gray-500 uppercase tracking-wide">
                                    {field === 'weight' ? 'kg' : 'cm'} {field}
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      className="mt-0.5 w-full px-2 py-1 border rounded text-xs text-gray-800"
                                      value={getPkg(order)[field]}
                                      onChange={(e) => setPkgField(order._id, field, e.target.value)}
                                    />
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
                            {canCreateShipment(order) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => savePackage(order._id, order)}
                                  disabled={busy(order._id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-tz-navy/20 text-tz-navy hover:bg-white disabled:opacity-60"
                                >
                                  Save package
                                </button>
                                <button
                                  type="button"
                                  onClick={() => createShipment(order._id, order)}
                                  disabled={busy(order._id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-tz-navy text-white hover:bg-tz-navy/90 disabled:opacity-60"
                                >
                                  {busy(order._id) ? 'Working…' : `Ship with ${shippingConfig.partner || 'partner'}`}
                                </button>
                              </>
                            )}
                            {shippingConfig.enabled && order.shipping?.shipmentId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => shippingAction(order._id, 'label')}
                                  disabled={busy(order._id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-tz-navy/20 text-tz-navy hover:bg-white disabled:opacity-60"
                                >
                                  Print label
                                </button>
                                {!order.shipping.pickupScheduled && (
                                  <button
                                    type="button"
                                    onClick={() => shippingAction(order._id, 'pickup')}
                                    disabled={busy(order._id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-tz-navy/20 text-tz-navy hover:bg-white disabled:opacity-60"
                                  >
                                    Schedule pickup
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => refreshTracking(order._id)}
                                  disabled={busy(order._id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-tz-navy/20 text-tz-navy hover:bg-white disabled:opacity-60"
                                >
                                  Refresh tracking
                                </button>
                                {!['Delivered', 'Returned'].includes(order.items?.[0]?.status) && (
                                  <button
                                    type="button"
                                    onClick={() => shippingAction(order._id, 'cancel')}
                                    disabled={busy(order._id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                                  >
                                    Cancel shipment
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Return panel */}
                        {(order.shipping?.return?.requested || order.items?.some((i) => ['ReturnRequested', 'ReturnInTransit', 'Returned'].includes(i.status))) && (
                          <div className="border-t border-tz-navy/10 pt-2">
                            <h4 className="font-semibold text-gray-700 text-xs mb-1">Return</h4>
                            <p className="text-xs text-gray-600">
                              {order.shipping?.return?.reason
                                ? `Reason: ${order.shipping.return.reason}`
                                : 'Customer return in progress'}
                            </p>
                            {order.shipping?.return?.awbCode && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                Return AWB: <span className="font-mono">{order.shipping.return.awbCode}</span>
                                {order.shipping.return.trackingUrl && (
                                  <>
                                    {' · '}
                                    <a href={order.shipping.return.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline text-tz-blue">
                                      Track return
                                    </a>
                                  </>
                                )}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {shippingConfig.enabled &&
                                order.shipping?.return?.requested &&
                                !order.shipping?.return?.shipmentId && (
                                  <button
                                    type="button"
                                    onClick={() => shippingAction(order._id, 'return/approve')}
                                    disabled={busy(order._id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-tz-navy text-white disabled:opacity-60"
                                  >
                                    Approve return (create pickup)
                                  </button>
                                )}
                              {order.items?.some((i) => i.status === 'ReturnInTransit') && (
                                <button
                                  type="button"
                                  onClick={() => shippingAction(order._id, 'return/complete', { restock: true })}
                                  disabled={busy(order._id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-tz-navy/20 text-tz-navy disabled:opacity-60"
                                >
                                  Mark returned + restock
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="mt-3 sm:mt-4">
                      <h4 className="font-semibold text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3">Order Items</h4>
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.map((item) => (
                          <div key={item._id} className="bg-gray-50 rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 items-start">
                            <img
                              src={item.image?.[0]}
                              alt={item.name}
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                              onError={(e) => {
                                e.target.src = assets.placeholder_image || '';
                              }}
                            />
                            <div className="flex-1 w-full sm:w-auto">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 text-sm sm:text-base line-clamp-2">{item.name}</p>
                                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600 mt-1">
                                    <span>Qty: {item.quantity}</span>
                                    {item.color ? <span>Colour: {item.color}</span> : null}
                                    <span>Size: {item.size}</span>
                                    {item.sku ? <span>SKU: {item.sku}</span> : null}
                                    <span>Price: ₹{item.price}</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                                      {item.status}
                                    </span>
                                  </div>
                                </div>

                                <select
                                  disabled={item.status === "Cancelled" && order.cancelledBy === "USER"}
                                  className={`w-full sm:w-40 px-2 sm:px-3 py-1 sm:py-1.5 border rounded-lg text-xs
                                    ${item.status === "Cancelled" && order.cancelledBy === "USER"
                                      ? "bg-gray-200 cursor-not-allowed"
                                      : "bg-white"}
                                  `}
                                  value={item.status}
                                  onChange={(e) =>
                                    setPendingStatus({
                                      orderId: order._id,
                                      itemId: item._id,
                                      status: e.target.value,
                                    })
                                  }
                                >
                                  <option value="OrderPlaced">Order Placed</option>
                                  <option value="Packing">Packing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="OutForDelivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="RTO">RTO</option>
                                  <option value="ReturnRequested">Return Requested</option>
                                  <option value="ReturnInTransit">Return In Transit</option>
                                  <option value="Returned">Returned</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 pt-4 pb-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      {whatsappOn && waOrder && (
        <WhatsAppCompose
          variant="modal"
          order={waOrder}
          onClose={() => setWaOrder(null)}
        />
      )}
      <ConfirmModal
        open={Boolean(pendingStatus)}
        title="Change order status?"
        message={
          pendingStatus
            ? `Update this item to ${pendingStatus.status}? This emails the customer when status mail is enabled.`
            : ""
        }
        confirmText="Update"
        confirmClass="bg-tz-navy hover:bg-tz-pink"
        onCancel={() => setPendingStatus(null)}
        onConfirm={() =>
          statusHandler(pendingStatus.orderId, pendingStatus.itemId, pendingStatus.status)
        }
      />
    </div>
  );
};

export default Orders;
