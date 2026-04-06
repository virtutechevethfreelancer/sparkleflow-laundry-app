
import React, { useState, useMemo } from 'react';
import { 
  Search, Bell, Plus, CheckCircle, MessageSquare, Send, 
  Menu, Calendar, Clock, DollarSign, Banknote, CreditCard, 
  X, Printer, Copy, Sparkles, Trash2, MessageSquareDashed, ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  Order, OrderStatus, PaymentStatus, ServiceType, ShopSettings, 
  PriceList, NotificationConfig, AppNotification, SMSTemplate, 
  Message, PaymentMethod, OrderTimelineEvent
} from './types';
import { Sidebar } from './components/Sidebar';
import { StatsCards } from './components/StatsCards';
import { NewOrderModal } from './components/NewOrderModal';
import { SettingsView } from './components/SettingsView';
import { NotificationDropdown } from './components/NotificationDropdown';
import { generateCustomerNotification } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

// Initialize for tone rewriting in drafts
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

const DEFAULT_TEMPLATES: SMSTemplate[] = [
    { id: '1', name: 'Order Ready', category: 'Ready', content: 'Hi {customerName}, great news! Your order #{orderId} is ready for pickup at {shopName}. Total: ${totalAmount}.' },
    { id: '2', name: 'Order Received', category: 'Welcome', content: 'Thanks for visiting {shopName}, {customerName}! We have received your order #{orderId}. We will notify you when it is ready.' },
    { id: '3', name: 'Payment Reminder', category: 'Reminder', content: 'Hello {customerName}, friendly reminder that payment for order #{orderId} is pending. Total: ${totalAmount}.' }
];

const DEFAULT_SHOP_NAME = 'SparkleFlow Laundry';

// --- INITIAL DATA GENERATION ---
const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
};

const INITIAL_ORDERS: Order[] = [
    {
        id: 'ORD-1001',
        customerName: 'John Smith',
        customerPhone: '0917-123-4567',
        date: daysAgo(9),
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: daysAgo(9),
        items: [{ service: ServiceType.WASH_FOLD, quantity: 5, pricePerUnit: 15 }],
        totalAmount: 75,
        timeline: [
            { status: OrderStatus.RECEIVED, timestamp: daysAgo(9), note: 'Order created' },
            { status: OrderStatus.WASHING, timestamp: daysAgo(9), note: 'Washing started' },
            { status: OrderStatus.READY, timestamp: daysAgo(8), note: 'Ready for pickup' },
            { status: OrderStatus.COMPLETED, timestamp: daysAgo(7), note: 'Picked up' }
        ]
    },
    {
        id: 'ORD-1002',
        customerName: 'Sarah Johnson',
        customerPhone: '0918-234-5678',
        date: daysAgo(8),
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        paymentDate: daysAgo(8),
        items: [{ service: ServiceType.DRY_CLEAN, quantity: 2, pricePerUnit: 25 }],
        totalAmount: 50,
        timeline: [
             { status: OrderStatus.RECEIVED, timestamp: daysAgo(8), note: 'Order created' },
             { status: OrderStatus.COMPLETED, timestamp: daysAgo(6), note: 'Picked up' }
        ]
    },
    {
        id: 'ORD-1003',
        customerName: 'Michael Brown',
        customerPhone: '0919-345-6789',
        date: daysAgo(7),
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        items: [{ service: ServiceType.DUVET, quantity: 1, pricePerUnit: 30 }],
        totalAmount: 30,
        timeline: [{ status: OrderStatus.COMPLETED, timestamp: daysAgo(5), note: 'Completed' }]
    },
    {
        id: 'ORD-1004',
        customerName: 'Emily Davis',
        customerPhone: '0920-456-7890',
        date: daysAgo(6),
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.ONLINE,
        items: [{ service: ServiceType.IRONING, quantity: 10, pricePerUnit: 5 }],
        totalAmount: 50,
        timeline: [{ status: OrderStatus.COMPLETED, timestamp: daysAgo(4), note: 'Completed' }]
    },
    {
        id: 'ORD-1005',
        customerName: 'John Smith',
        customerPhone: '0917-123-4567',
        date: daysAgo(5),
        status: OrderStatus.READY,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        items: [{ service: ServiceType.WASH_FOLD, quantity: 3, pricePerUnit: 15 }],
        totalAmount: 45,
        generatedNotification: "Good day John Smith! Your laundry order #ORD-1005 is now ready for pickup. Thank you!",
        notificationSent: false,
        timeline: [{ status: OrderStatus.READY, timestamp: daysAgo(1), note: 'Ready' }]
    },
    {
        id: 'ORD-1006',
        customerName: 'Jessica Wilson',
        customerPhone: '0921-567-8901',
        date: daysAgo(4),
        status: OrderStatus.READY,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        items: [{ service: ServiceType.DRY_CLEAN, quantity: 1, pricePerUnit: 25 }],
        totalAmount: 25,
        generatedNotification: "Good day Jessica Wilson! Your laundry order #ORD-1006 is now ready for pickup. Thank you!",
        notificationSent: false,
        timeline: [{ status: OrderStatus.READY, timestamp: daysAgo(1), note: 'Ready' }]
    },
    {
        id: 'ORD-1007',
        customerName: 'David Martinez',
        customerPhone: '0922-678-9012',
        date: daysAgo(3),
        status: OrderStatus.READY,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.NONE,
        items: [{ service: ServiceType.WASH_FOLD, quantity: 4, pricePerUnit: 15 }, { service: ServiceType.IRONING, quantity: 5, pricePerUnit: 5 }],
        totalAmount: 85,
        generatedNotification: "Good day David Martinez! Your laundry order #ORD-1007 is now ready for pickup. Thank you!",
        notificationSent: false,
        timeline: [{ status: OrderStatus.READY, timestamp: daysAgo(0), note: 'Ready' }]
    },
    {
        id: 'ORD-1008',
        customerName: 'Sarah Johnson',
        customerPhone: '0918-234-5678',
        date: daysAgo(2),
        status: OrderStatus.WASHING,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CASH,
        items: [{ service: ServiceType.DUVET, quantity: 1, pricePerUnit: 30 }],
        totalAmount: 30,
        estimatedReadyTime: new Date(new Date().getTime() + 4*60*60*1000).toISOString(),
        timeline: [{ status: OrderStatus.WASHING, timestamp: daysAgo(1), note: 'Washing' }]
    },
    {
        id: 'ORD-1009',
        customerName: 'James Anderson',
        customerPhone: '0923-789-0123',
        date: daysAgo(1),
        status: OrderStatus.WASHING,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.NONE,
        items: [{ service: ServiceType.WASH_FOLD, quantity: 2, pricePerUnit: 15 }],
        totalAmount: 30,
        estimatedReadyTime: new Date(new Date().getTime() + 5*60*60*1000).toISOString(),
        timeline: [{ status: OrderStatus.WASHING, timestamp: daysAgo(0), note: 'Washing' }]
    },
    {
        id: 'ORD-1010',
        customerName: 'Robert Thomas',
        customerPhone: '0924-890-1234',
        date: daysAgo(0),
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.NONE,
        items: [{ service: ServiceType.DRY_CLEAN, quantity: 3, pricePerUnit: 25 }],
        totalAmount: 75,
        timeline: [{ status: OrderStatus.RECEIVED, timestamp: daysAgo(0), note: 'Received' }]
    }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
    { id: '1', title: 'New Order', message: 'New order #ORD-1010 from Robert Thomas', timestamp: new Date(), read: false, type: 'info', orderId: 'ORD-1010' },
    { id: '2', title: 'Order Ready', message: 'Order #ORD-1007 is ready for pickup', timestamp: new Date(Date.now() - 1000*60*30), read: false, type: 'success', orderId: 'ORD-1007' }
];

// Initial Messages (Migration from old structure)
const INITIAL_MESSAGES: Message[] = [
    // Creating a dummy sent message for demonstration
    {
        id: 'MSG-OLD-1',
        orderId: 'ORD-1005',
        customerName: 'John Smith',
        customerPhone: '0917-123-4567',
        content: 'Good day John Smith! Your laundry order #ORD-1005 is now ready for pickup. Thank you!',
        status: 'SENT',
        type: 'READY',
        createdAt: daysAgo(1),
        sentAt: daysAgo(1)
    }
];

// Logic to ensure all Ready/Completed orders have corresponding messages (Drafts or Sent)
const generateInitialMessages = (orders: Order[], currentMessages: Message[]): Message[] => {
    const messages = [...currentMessages];
    
    orders.forEach(order => {
        // 1. Ready Orders - Pickup Reminder
        if (order.status === OrderStatus.READY) {
            // Check if ANY message (Draft or Sent) of type READY exists for this order
            const exists = messages.some(m => m.orderId === order.id && m.type === 'READY');
            if (!exists) {
                messages.push({
                    id: `MSG-AUTO-${order.id}-READY`,
                    orderId: order.id,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    content: `Good day ${order.customerName}! Your laundry order #${order.id} is now ready for pickup. Please collect at your convenience. Thank you!`,
                    status: 'DRAFT',
                    type: 'READY',
                    createdAt: new Date().toISOString()
                });
            }
        }

        // 2. Completed Orders - Thank You Message
        if (order.status === OrderStatus.COMPLETED) {
            // Check if ANY message (Draft or Sent) of type THANK_YOU exists for this order
            const exists = messages.some(m => m.orderId === order.id && m.type === 'THANK_YOU');
            if (!exists) {
                messages.push({
                    id: `MSG-AUTO-${order.id}-THANKS`,
                    orderId: order.id,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    content: `Thank you for choosing ${DEFAULT_SHOP_NAME}! We appreciate your business and hope to serve you again soon. - ${DEFAULT_SHOP_NAME}`,
                    status: 'DRAFT',
                    type: 'THANK_YOU',
                    createdAt: new Date().toISOString()
                });
            }
        }
    });
    return messages;
};

function App() {
  // --- STATE MANAGEMENT ---
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  // Initialize messages with auto-generated drafts
  const [messages, setMessages] = useState<Message[]>(() => generateInitialMessages(INITIAL_ORDERS, INITIAL_MESSAGES));
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals & UI States
  const [isModalOpen, setIsModalOpen] = useState(false); // Used for New Order
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [viewOrderDetails, setViewOrderDetails] = useState<Order | null>(null);
  
  // Delete Modal States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  
  // Notifications
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Settings
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: DEFAULT_SHOP_NAME,
    phone: '(555) 123-4567',
    address: '123 Clean St, Wash City'
  });
  const [prices, setPrices] = useState<PriceList>({
    [ServiceType.WASH_FOLD]: 15,
    [ServiceType.DRY_CLEAN]: 25,
    [ServiceType.IRONING]: 5,
    [ServiceType.DUVET]: 30,
  });
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    tone: 'Friendly',
    signature: 'SparkleFlow Team'
  });
  const [templates, setTemplates] = useState<SMSTemplate[]>(DEFAULT_TEMPLATES);

  // --- ACTIONS ---

  const addAppNotification = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info', orderId?: string) => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      timestamp: new Date(),
      read: false,
      type,
      orderId
    };
    setAppNotifications(prev => [newNotif, ...prev]);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setAppNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: true} : n));
    if (notification.orderId) {
        setActiveTab('orders');
        setSearchQuery(notification.orderId);
        setIsNotifOpen(false);
    }
  };

  const handleAddOrder = (newOrder: Order) => {
    const orderWithTimeline = {
        ...newOrder,
        timeline: [{ status: OrderStatus.RECEIVED, timestamp: new Date().toISOString(), note: 'Order created' }]
    };
    setOrders([orderWithTimeline, ...orders]);
    addAppNotification('New Order', `Order #${newOrder.id} created`, 'success', newOrder.id);
  };

  const createDraft = (order: Order, type: 'READY' | 'THANK_YOU') => {
    // Check if ANY message (Draft or Sent) already exists for this order and type to prevent duplicates
    const exists = messages.some(m => m.orderId === order.id && m.type === type);
    if (exists) return;

    let content = '';
    if (type === 'READY') {
        content = `Good day ${order.customerName}! Your laundry order #${order.id} is now ready for pickup. Please collect at your convenience. Thank you!`;
    } else {
        content = `Thank you for choosing ${shopSettings.name}! We appreciate your business and hope to serve you again soon. - ${shopSettings.name}`;
    }

    const newDraft: Message = {
        id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        content: content,
        status: 'DRAFT',
        type: type,
        createdAt: new Date().toISOString()
    };

    setMessages(prev => [newDraft, ...prev]);
    // Only set toast if not triggered by status change which has its own toast
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = orders[orderIndex];
    if (order.status === OrderStatus.COMPLETED && newStatus !== OrderStatus.COMPLETED) return; 

    const timelineEvent: OrderTimelineEvent = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: `Status changed to ${newStatus}`
    };

    const updates: Partial<Order> = {
        status: newStatus,
        timeline: [...order.timeline, timelineEvent]
    };

    if (newStatus === OrderStatus.WASHING) {
        const est = new Date();
        est.setHours(est.getHours() + 4);
        updates.estimatedReadyTime = est.toISOString();
    }

    const updatedOrder = { ...order, ...updates } as Order;

    setOrders(prev => {
        const newOrders = [...prev];
        newOrders[orderIndex] = updatedOrder;
        return newOrders;
    });

    if (newStatus === OrderStatus.READY) {
        createDraft(updatedOrder, 'READY');
        addAppNotification('Order Ready', `Order #${orderId} is ready for pickup`, 'success', orderId);
    } else if (newStatus === OrderStatus.COMPLETED) {
        // Remove obsolete READY drafts to prevent duplicates/confusion
        setMessages(current => current.filter(m => !(m.orderId === orderId && m.type === 'READY' && m.status === 'DRAFT')));
        
        createDraft(updatedOrder, 'THANK_YOU');
        addAppNotification('Order Completed', `Order #${orderId} completed`, 'success', orderId);
    } else {
        addAppNotification('Status Update', `Order #${orderId} is now ${newStatus}`, 'info', orderId);
    }
    
    setNotificationToast(`Order status updated to ${newStatus}`);
  };

  // --- DELETE FUNCTIONALITY ---
  const handleDeleteClick = (order: Order) => {
    if (order.status === OrderStatus.COMPLETED) {
        setNotificationToast("Cannot delete completed orders. Please archive instead.");
        return;
    }
    setOrderToDelete(order);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (!orderToDelete) return;
    
    // Remove from orders list
    setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
    
    // Cleanup related drafts (Optional but good practice)
    setMessages(prev => prev.filter(m => m.orderId !== orderToDelete.id));

    setNotificationToast(`Order #${orderToDelete.id} deleted successfully`);
    setIsDeleteConfirmOpen(false);
    setOrderToDelete(null);
    
    // If viewing details of deleted order, close drawer
    if (viewOrderDetails?.id === orderToDelete.id) {
        setViewOrderDetails(null);
    }
  };


  const handleSendMessage = (messageId: string) => {
      setMessages(prev => prev.map(m => {
          if (m.id === messageId) {
              // Mock send logic
              setNotificationToast(`Message sent to ${m.customerName}`);
              addAppNotification('Message Sent', `Notification sent to ${m.customerName}`, 'success', m.orderId);
              return { ...m, status: 'SENT', sentAt: new Date().toISOString() };
          }
          return m;
      }));
  };

  const updateDraftContent = (id: string, newContent: string) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const deleteDraft = (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
  };

  const applyToneToDraft = async (draft: Message) => {
      try {
          const prompt = `Rewrite this SMS message to be ${notificationConfig.tone}. 
          Context: Customer ${draft.customerName}, Shop ${shopSettings.name}, Order ${draft.orderId}.
          Current text: "${draft.content}"
          Keep it concise and retain key info.`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
          });
          
          if (response.text) {
              updateDraftContent(draft.id, response.text.trim());
              setNotificationToast(`Applied ${notificationConfig.tone} tone`);
          }
      } catch (e) {
          console.error(e);
          setNotificationToast("Failed to apply tone");
      }
  };

  const handlePaymentSubmit = (method: PaymentMethod) => {
      if (!selectedOrderForPayment) return;
      
      setOrders(prev => prev.map(o => o.id === selectedOrderForPayment.id ? {
          ...o,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: method,
          paymentDate: new Date().toISOString()
      } : o));
      
      addAppNotification('Payment Received', `Payment recorded for #${selectedOrderForPayment.id}`, 'success', selectedOrderForPayment.id);
      
      setIsPaymentModalOpen(false);
      setSelectedOrderForPayment(null);
  };

  // --- ANALYTICS ---
  const analyticsData = useMemo(() => {
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const revenueData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', {weekday: 'short'}),
        revenue: orders.filter(o => o.date === date && (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.READY)).reduce((sum, o) => sum + o.totalAmount, 0)
    }));

    const serviceCounts: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(i => {
        serviceCounts[i.service] = (serviceCounts[i.service] || 0) + 1;
    }));
    
    const serviceData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }));

    return { revenueData, serviceData };
  }, [orders]);


  // --- FILTERING ---
  const filteredOrders = useMemo(() => {
      return orders.filter(order => {
          const matchesSearch = searchQuery === '' || 
              order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              order.customerPhone.includes(searchQuery);
          
          const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
          const matchesPayment = paymentFilter === 'ALL' || 
              (paymentFilter === 'PAID' && order.paymentStatus === PaymentStatus.PAID) ||
              (paymentFilter === 'UNPAID' && order.paymentStatus === PaymentStatus.UNPAID);
              
          return matchesSearch && matchesStatus && matchesPayment;
      });
  }, [orders, searchQuery, statusFilter, paymentFilter]);


  // --- VIEW RENDERING HELPERS ---

  const renderStatusBadge = (status: OrderStatus) => {
    const styles = {
      [OrderStatus.RECEIVED]: 'bg-slate-100 text-slate-600 border-slate-200',
      [OrderStatus.WASHING]: 'bg-blue-100 text-blue-600 border-blue-200',
      [OrderStatus.READY]: 'bg-purple-100 text-purple-600 border-purple-200',
      [OrderStatus.COMPLETED]: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // --- RENDER CONTENT SWITCH ---
  const renderContent = () => {
      switch (activeTab) {
        case 'dashboard':
        case 'orders':
            const stats = {
                totalOrders: orders.length,
                pendingOrders: orders.filter(o => o.status !== OrderStatus.COMPLETED).length,
                revenue: orders.reduce((acc, o) => acc + o.totalAmount, 0),
                pendingPayment: orders.filter(o => o.paymentStatus === PaymentStatus.UNPAID).reduce((acc, o) => acc + o.totalAmount, 0),
                readyOrders: orders.filter(o => o.status === OrderStatus.READY).length,
            };

            return (
                <div className="space-y-6 animate-fade-in-up">
                    {activeTab === 'dashboard' && <StatsCards stats={stats} />}

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <input 
                                    type="text" 
                                    placeholder="Search order ID, name..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">All Status</option>
                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select 
                                value={paymentFilter} 
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">All Payment</option>
                                <option value="PAID">Paid</option>
                                <option value="UNPAID">Unpaid</option>
                            </select>
                        </div>
                        {searchQuery || statusFilter !== 'ALL' || paymentFilter !== 'ALL' ? (
                            <button onClick={() => {setSearchQuery(''); setStatusFilter('ALL'); setPaymentFilter('ALL')}} className="text-sm text-red-500 hover:text-red-700 font-medium">Clear Filters</button>
                        ) : null}
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                {activeTab === 'dashboard' ? 'Recent Orders' : 'All Orders'}
                                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-2">{filteredOrders.length}</span>
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">ID / Date</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Change Status</th>
                                        <th className="px-6 py-4">Payment</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.length > 0 ? filteredOrders.slice(0, activeTab === 'dashboard' ? 10 : 50).map(order => (
                                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{order.id}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(order.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{order.customerName}</div>
                                                <div className="text-xs text-slate-500">{order.customerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStatusBadge(order.status)}
                                                {order.estimatedReadyTime && order.status === OrderStatus.WASHING && (
                                                    <div className="text-[10px] text-blue-600 mt-1 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Est: {new Date(order.estimatedReadyTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-36">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all cursor-pointer hover:border-blue-300 shadow-sm"
                                                    >
                                                        {Object.values(OrderStatus).map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                                        <ChevronDown className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                 <button 
                                                    onClick={() => {
                                                        if(order.paymentStatus === PaymentStatus.UNPAID) {
                                                            setSelectedOrderForPayment(order);
                                                            setIsPaymentModalOpen(true);
                                                        }
                                                    }}
                                                    className={`flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded transition-colors ${
                                                        order.paymentStatus === PaymentStatus.PAID 
                                                        ? 'text-emerald-700 bg-emerald-50 cursor-default' 
                                                        : 'text-orange-700 bg-orange-50 hover:bg-orange-100 cursor-pointer border border-orange-200'
                                                    }`}
                                                >
                                                    {order.paymentStatus === PaymentStatus.PAID ? (
                                                        <>
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                            <span>Paid</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign className="h-3.5 w-3.5" />
                                                            <span>Pay</span>
                                                        </>
                                                    )}
                                                </button>
                                                <div className="text-[10px] text-slate-400 mt-1 pl-1">
                                                    {order.paymentMethod !== PaymentMethod.NONE ? order.paymentMethod : 'Unpaid'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                ${order.totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button 
                                                        onClick={() => setViewOrderDetails(order)}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg text-sm font-medium shadow-sm transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(order)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center">
                                                    <Search className="h-12 w-12 mb-3 opacity-20" />
                                                    <p>No orders found matching your filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        
        case 'drafts':
            const activeDrafts = messages.filter(m => m.status === 'DRAFT');
            return (
                <div className="space-y-6 animate-fade-in-up">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquareDashed className="h-6 w-6 text-purple-600" />
                            Active Drafts
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{activeDrafts.length}</span>
                        </h2>
                    </div>

                    {activeDrafts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeDrafts.map(draft => {
                                const linkedOrder = orders.find(o => o.id === draft.orderId);
                                return (
                                    <div key={draft.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-full group hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{draft.customerName}</h3>
                                                <p className="text-xs text-slate-500">Order #{draft.orderId}</p>
                                                {linkedOrder && (
                                                    <p className={`text-[10px] font-bold uppercase mt-1 ${
                                                        linkedOrder.status === OrderStatus.READY ? 'text-purple-600' : 
                                                        linkedOrder.status === OrderStatus.COMPLETED ? 'text-emerald-600' : 'text-slate-500'
                                                    }`}>
                                                        {linkedOrder.status}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${draft.type === 'READY' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {draft.type === 'READY' ? 'Pickup Ready' : 'Thank You'}
                                            </span>
                                        </div>
                                        
                                        <textarea 
                                            className="flex-1 w-full p-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none resize-none transition-colors"
                                            value={draft.content}
                                            onChange={(e) => updateDraftContent(draft.id, e.target.value)}
                                            rows={4}
                                        />
                                        
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(draft.content)}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Copy text"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => applyToneToDraft(draft)}
                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title={`Apply ${notificationConfig.tone} tone`}
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteDraft(draft.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Discard draft"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleSendMessage(draft.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-purple-200"
                                            >
                                                <Send className="h-4 w-4" />
                                                Send Now
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-slate-100 border-dashed">
                            <MessageSquareDashed className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <h3 className="text-slate-600 font-medium">No active drafts</h3>
                            <p className="text-slate-400 text-sm mt-1">Drafts will appear when orders are Ready or Completed</p>
                        </div>
                    )}
                </div>
            );

        case 'sent':
            const sentMessages = messages.filter(m => m.status === 'SENT').sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime());
            return (
                <div className="space-y-6 animate-fade-in-up">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Send className="h-6 w-6 text-blue-600" />
                            Sent Messages
                        </h2>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Sent Time</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Message</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sentMessages.length > 0 ? sentMessages.map(msg => (
                                        <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(msg.sentAt!).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{msg.customerName}</div>
                                                <div className="text-xs text-slate-500">{msg.customerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <p className="text-sm text-slate-600 truncate">{msg.content}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${msg.type === 'READY' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {msg.type === 'READY' ? 'Pickup' : 'Thanks'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => {
                                                        setActiveTab('orders');
                                                        setSearchQuery(msg.orderId);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    View Order
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                No sent messages history.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );

        case 'analytics':
            return (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend (Last 7 Days)</h3>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={analyticsData.revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} prefix="$" />
                                    <Tooltip contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                                         {analyticsData.revenueData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={`rgba(59, 130, 246, ${0.5 + (index/10)})`} />
                                         ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
                             <h3 className="text-lg font-bold text-slate-800 mb-6">Popular Services</h3>
                             <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie 
                                        data={analyticsData.serviceData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={100} 
                                        fill="#8884d8"
                                        label
                                    >
                                        {analyticsData.serviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-100 text-center">
                            <h4 className="text-sm font-medium text-slate-500 uppercase">Avg. Order Value</h4>
                            <p className="text-3xl font-bold text-slate-800 mt-2">
                                ${(orders.reduce((sum, o) => sum + o.totalAmount, 0) / (orders.length || 1)).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-100 text-center">
                            <h4 className="text-sm font-medium text-slate-500 uppercase">Collection Rate</h4>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">
                                {((orders.filter(o => o.paymentStatus === PaymentStatus.PAID).length / (orders.length || 1)) * 100).toFixed(0)}%
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-100 text-center">
                            <h4 className="text-sm font-medium text-slate-500 uppercase">Repeat Customers</h4>
                            <p className="text-3xl font-bold text-purple-600 mt-2">
                                {/* Simple Logic: unique names vs total orders */}
                                {orders.length > 0 ? (100 - (new Set(orders.map(o => o.customerName)).size / orders.length * 100)).toFixed(0) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            );

        case 'settings':
            return (
                <SettingsView 
                    shopSettings={shopSettings}
                    onUpdateShopSettings={setShopSettings}
                    prices={prices}
                    onUpdatePrices={setPrices}
                    notificationConfig={notificationConfig}
                    onUpdateNotificationConfig={setNotificationConfig}
                    templates={templates}
                    onUpdateTemplates={setTemplates}
                    totalOrders={orders.length}
                />
            );
        default: return null;
      }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className="md:ml-64 flex-1 p-4 md:p-8 w-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 sticky top-0 z-30 bg-slate-50/80 backdrop-blur-sm py-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-200 rounded-lg">
                <Menu className="h-6 w-6" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                    {activeTab.replace('-', ' ')}
                </h1>
                <p className="text-slate-500 text-sm mt-1 hidden md:block">
                {activeTab === 'settings' ? 'Configure your shop preferences' : 'Welcome back, Manager'}
                </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 bg-white border border-slate-200 rounded-full transition-all relative ${isNotifOpen ? 'text-blue-600' : 'text-slate-500'}`}
              >
                <Bell className="h-5 w-5" />
                {appNotifications.filter(n=>!n.read).length > 0 && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)}
                notifications={appNotifications}
                onMarkRead={(id) => setAppNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))}
                onMarkAllRead={() => setAppNotifications(prev => prev.map(n => ({...n, read: true})))}
                onClearAll={() => setAppNotifications([])}
                onNotificationClick={handleNotificationClick}
              />
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden md:inline">New Order</span>
            </button>
          </div>
        </header>

        {renderContent()}

      </main>

      {/* --- MODALS --- */}

      {/* New / Quick Order Modal */}
      <NewOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddOrder}
        defaultPrices={prices}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && orderToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Order?</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Are you sure you want to delete <span className="font-semibold text-slate-700">Order #{orderToDelete.id}</span>? 
                            This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        onClick={() => setIsDeleteConfirmOpen(false)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDeleteOrder}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm shadow-red-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrderForPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Confirm Payment</h3>
                      <button onClick={() => setIsPaymentModalOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
                  </div>
                  <div className="text-center mb-8">
                      <p className="text-slate-500">Total Amount Due</p>
                      <p className="text-4xl font-bold text-slate-800 mt-2">${selectedOrderForPayment.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <button onClick={() => handlePaymentSubmit(PaymentMethod.CASH)} className="p-4 border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 flex flex-col items-center gap-2 transition-all">
                          <Banknote className="h-6 w-6" />
                          <span className="font-medium">Cash</span>
                      </button>
                      <button onClick={() => handlePaymentSubmit(PaymentMethod.CARD)} className="p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 flex flex-col items-center gap-2 transition-all">
                          <CreditCard className="h-6 w-6" />
                          <span className="font-medium">Card</span>
                      </button>
                  </div>
                  <button onClick={() => handlePaymentSubmit(PaymentMethod.ONLINE)} className="w-full py-3 text-sm font-medium text-slate-500 hover:text-blue-600">
                      Mark as Paid Online (Stripe/PayPal)
                  </button>
              </div>
          </div>
      )}

      {/* Order Details Drawer */}
      {viewOrderDetails && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end">
              <div className="w-full max-w-lg bg-white h-full shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300">
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Order #{viewOrderDetails.id}</h2>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                             <Calendar className="h-3.5 w-3.5" /> 
                             {new Date(viewOrderDetails.date).toLocaleDateString()} at {new Date(viewOrderDetails.date).toLocaleTimeString()}
                          </div>
                      </div>
                      <button onClick={() => setViewOrderDetails(null)} className="p-2 hover:bg-slate-200 rounded-full">
                          <X className="h-6 w-6 text-slate-500" />
                      </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      
                      {/* Status Timeline */}
                      <div>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Order Status</h3>
                          <div className="space-y-6 relative pl-2">
                               {/* Vertical Line */}
                               <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 z-0"></div>

                               {Object.values(OrderStatus).map((step, idx) => {
                                   const isCompleted = Object.values(OrderStatus).indexOf(viewOrderDetails.status) >= idx;
                                   const isCurrent = viewOrderDetails.status === step;
                                   const historyItem = viewOrderDetails.timeline.find(t => t.status === step);

                                   return (
                                       <div key={step} className="relative z-10 flex gap-4">
                                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white ${isCompleted ? 'border-blue-500 text-blue-500' : 'border-slate-300 text-transparent'}`}>
                                               <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-blue-500' : ''}`}></div>
                                           </div>
                                           <div className={`${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                               <p className="font-bold text-sm text-slate-800">{step}</p>
                                               {historyItem && (
                                                   <p className="text-xs text-slate-500">
                                                       {new Date(historyItem.timestamp).toLocaleString()}
                                                   </p>
                                               )}
                                           </div>
                                           {isCurrent && viewOrderDetails.status !== OrderStatus.COMPLETED && (
                                               <div className="ml-auto">
                                                   <button 
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded shadow-sm hover:bg-blue-700"
                                                        onClick={() => {
                                                            const nextIdx = idx + 1;
                                                            if (nextIdx < Object.values(OrderStatus).length) {
                                                                handleStatusChange(viewOrderDetails.id, Object.values(OrderStatus)[nextIdx]);
                                                                // Update local viewOrderDetails to reflect change (or at least status)
                                                                // Since state update is async, we just close to refresh or force sync.
                                                                setViewOrderDetails(null); 
                                                            }
                                                        }}
                                                    >
                                                        Advance
                                                    </button>
                                               </div>
                                           )}
                                       </div>
                                   );
                               })}
                          </div>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <h3 className="text-sm font-bold text-slate-900 mb-3">Items</h3>
                          <div className="space-y-2">
                              {viewOrderDetails.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-sm">
                                      <span>{item.quantity}x {item.service}</span>
                                      <span className="font-medium text-slate-700">${(item.quantity * item.pricePerUnit).toFixed(2)}</span>
                                  </div>
                              ))}
                              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                                  <span>Total</span>
                                  <span>${viewOrderDetails.totalAmount.toFixed(2)}</span>
                              </div>
                          </div>
                      </div>

                      {/* Associated Messages / Drafts */}
                       <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                           <h3 className="text-sm font-bold text-blue-900 mb-3">Communication History</h3>
                           {messages.filter(m => m.orderId === viewOrderDetails.id).length > 0 ? (
                               <div className="space-y-3">
                                   {messages.filter(m => m.orderId === viewOrderDetails.id).map(msg => (
                                       <div key={msg.id} className="bg-white p-3 rounded border border-blue-100 text-sm">
                                           <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-700">{msg.status === 'DRAFT' ? 'Draft' : 'Sent'}</span>
                                                <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                                           </div>
                                           <p className="text-slate-600">{msg.content}</p>
                                           {msg.status === 'DRAFT' && (
                                               <button 
                                                   onClick={() => { setViewOrderDetails(null); setActiveTab('drafts'); }}
                                                   className="text-xs text-blue-600 hover:underline mt-1"
                                               >
                                                   Go to Drafts
                                               </button>
                                           )}
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <p className="text-sm text-slate-500 italic">No messages yet.</p>
                           )}
                       </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                      <button 
                        onClick={() => window.print()} 
                        className="flex-1 flex items-center justify-center gap-2 border border-slate-300 bg-white py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                      >
                          <Printer className="h-4 w-4" /> Print Receipt
                      </button>
                      {viewOrderDetails.paymentStatus === PaymentStatus.UNPAID && (
                          <button 
                            onClick={() => {
                                setViewOrderDetails(null);
                                setSelectedOrderForPayment(viewOrderDetails);
                                setIsPaymentModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700"
                          >
                              <DollarSign className="h-4 w-4" /> Mark Paid
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Global Toast */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-2 animate-fade-in-up z-[60]">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
            body * { visibility: hidden; }
            #root { display: none; }
            .print-modal, .print-modal * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}

// Icon helper needed for Payment Modal button
function DollarSign(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}

export default App;
