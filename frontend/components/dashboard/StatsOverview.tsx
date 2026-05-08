'use client';

import { motion } from 'framer-motion';
import { Award, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { 
    label: 'Faol litsenziyalar', 
    value: 2, 
    icon: Award, 
    color: '#27AE60',
    bgColor: '#27AE60/10'
  },
  { 
    label: "Kutilmoqda", 
    value: 1, 
    icon: Clock, 
    color: '#F39C12',
    bgColor: '#F39C12/10'
  },
  { 
    label: 'Tasdiqlangan', 
    value: 5, 
    icon: CheckCircle, 
    color: '#3498DB',
    bgColor: '#3498DB/10'
  },
  { 
    label: "Muddati tugayapti", 
    value: 1, 
    icon: AlertTriangle, 
    color: '#E74C3C',
    bgColor: '#E74C3C/10'
  },
];

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.color + '15' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsOverview;
