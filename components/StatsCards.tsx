
import React from 'react';
import { DollarSign, ShoppingBag, Clock, AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Revenue',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: <DollarSign className="h-6 w-6 text-white" />,
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-200',
      trend: '+12.5%',
      label: 'vs last week'
    },
    {
      title: 'Active Orders',
      value: stats.pendingOrders.toString(),
      icon: <ShoppingBag className="h-6 w-6 text-white" />,
      bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      shadow: 'shadow-blue-200',
      trend: '+5',
      label: 'new today'
    },
    {
      title: 'Pending Payments',
      value: `$${stats.pendingPayment.toFixed(2)}`,
      icon: <AlertCircle className="h-6 w-6 text-white" />,
      bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      shadow: 'shadow-orange-200',
      trend: '3',
      label: 'overdue'
    },
    {
      title: 'Ready for Pickup',
      value: stats.readyOrders.toString(),
      icon: <Clock className="h-6 w-6 text-white" />,
      bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
      shadow: 'shadow-purple-200',
      trend: 'Action needed',
      label: ''
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl shadow-lg ${card.bg} ${card.shadow} transform group-hover:scale-110 transition-transform duration-300`}>
              {card.icon}
            </div>
            {card.label && (
                <div className="flex items-center space-x-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    <span>{card.trend}</span>
                </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{card.value}</h3>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowUpRight className="h-32 w-32 text-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
};
