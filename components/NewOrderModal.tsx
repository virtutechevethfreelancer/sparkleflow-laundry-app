
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ServiceType, OrderItem, PaymentStatus, OrderStatus, PriceList, PaymentMethod } from '../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
  defaultPrices: PriceList;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSubmit, defaultPrices }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { service: ServiceType.WASH_FOLD, quantity: 1, pricePerUnit: defaultPrices[ServiceType.WASH_FOLD] }
  ]);
  
  // New Payment States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.NONE);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);

  // Update logic when Payment Method changes
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === PaymentMethod.NONE) {
      setPaymentStatus(PaymentStatus.UNPAID);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { service: ServiceType.WASH_FOLD, quantity: 1, pricePerUnit: defaultPrices[ServiceType.WASH_FOLD] }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    if (field === 'service') {
        // Auto-update price based on selected service from global settings
        const serviceType = value as ServiceType;
        newItems[index].pricePerUnit = defaultPrices[serviceType];
    }
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      customerName,
      customerPhone,
      date: new Date().toISOString().split('T')[0],
      status: OrderStatus.RECEIVED,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      items,
      totalAmount: calculateTotal(),
    };
    onSubmit(newOrder);
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setItems([{ service: ServiceType.WASH_FOLD, quantity: 1, pricePerUnit: defaultPrices[ServiceType.WASH_FOLD] }]);
    setPaymentMethod(PaymentMethod.NONE);
    setPaymentStatus(PaymentStatus.UNPAID);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">New Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Items</label>
              <button type="button" onClick={handleAddItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <select
                      className="w-full p-2 border border-slate-200 rounded-md text-sm"
                      value={item.service}
                      onChange={(e) => updateItem(index, 'service', e.target.value)}
                    >
                      {Object.values(ServiceType).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2 border border-slate-200 rounded-md text-sm"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="w-20 pt-2 text-right text-sm font-medium text-slate-600">
                    ${item.pricePerUnit * item.quantity}
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(index)} className="pt-2 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-slate-700">Total</span>
            <span className="text-2xl font-bold text-blue-600">${calculateTotal().toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
              >
                <option value={PaymentMethod.NONE}>Unpaid (Pay on pickup)</option>
                <option value={PaymentMethod.CASH}>Cash</option>
                <option value={PaymentMethod.CARD}>Card</option>
                <option value={PaymentMethod.PAYPAL}>PayPal</option>
                <option value={PaymentMethod.STRIPE}>Stripe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100 disabled:text-slate-500"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                disabled={paymentMethod === PaymentMethod.NONE}
              >
                <option value={PaymentStatus.UNPAID}>Unpaid</option>
                <option value={PaymentStatus.PAID}>Paid</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-200 mt-2"
          >
            Create Order
          </button>
        </form>
      </div>
    </div>
  );
};