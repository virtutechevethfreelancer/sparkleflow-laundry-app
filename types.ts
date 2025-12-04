
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  WASHING = 'WASHING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  ONLINE = 'Online',
  PAYPAL = 'PayPal',
  STRIPE = 'Stripe',
  NONE = 'Pay on Pickup',
}

export enum ServiceType {
  WASH_FOLD = 'Wash & Fold',
  DRY_CLEAN = 'Dry Clean',
  IRONING = 'Ironing',
  DUVET = 'Duvet/Comforter',
}

export interface OrderItem {
  service: ServiceType;
  quantity: number;
  pricePerUnit: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string; // Order creation date
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  estimatedReadyTime?: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  generatedNotification?: string;
  notificationSent?: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  pendingPayment: number;
  readyOrders: number;
}

export interface ShopSettings {
  name: string;
  phone: string;
  address: string;
}

export interface NotificationConfig {
  tone: 'Professional' | 'Friendly' | 'Casual' | 'Urgent';
  signature: string;
}

export type PriceList = Record<ServiceType, number>;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'success' | 'info' | 'warning';
  orderId?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: 'Ready' | 'Welcome' | 'Reminder' | 'Custom';
}

export interface Message {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  content: string;
  status: 'DRAFT' | 'SENT';
  type: 'READY' | 'THANK_YOU';
  createdAt: string;
  sentAt?: string;
}