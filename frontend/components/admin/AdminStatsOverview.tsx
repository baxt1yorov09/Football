'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { 
    label: 'Jami arizalar', 
    value: '1,247', 
    change: '+12%',
    trend: 'up',
    icon: FileText, 
    color: '#3498DB',
    bgColor: '#3498DB/10'
  },
  { 
    label: 'Faol litsenziyalar', 
    value: '892', 
    change: '+8%',
    trend: 'up',
    icon: Award, 
    color: '#27AE60',
    bgColor: '#27AE60/10'
  },
  { 
    label: 'Yangi foydalanuvchilar', 
    value: '156', 
    change: '+23%',
    trend: 'up',
    icon: Users, 
    color: '#F39C12',
    bgColor: '#F39C12/10'
  },
  { 
    label: "Kutilayotgan arizalar", 
    value: '23', 
    change: '-15%',
    trend: 'down',
    icon: Clock, 
    color: '#E74C3C',
    bgColor: '#E74C3C/10'
  },
];

const recentStats = [
  { period: 'Bugun', applications: 12, approved: 8, rejected: 2, pending: 2 },
  { period: 'Dushanba', applications: 18, approved: 12, rejected: 3, pending: 3 },
  { period: 'Hafta', applications: 89, approved: 65, rejected: 12, pending: 12 },
  { period: 'Oy', applications: 342, approved: 287, rejected: 28, pending: 27 },
];

export function AdminStatsOverview() {
  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
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
                      <p className="text-3xl font-bold text-[#0D3B6E]">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendIcon 
                          className={`w-4 h-4 ${
                            stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                          }`} 
                        />
                        <span className={`text-sm font-medium ${
                          stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-gray-500">vs o'tgan oy</span>
                      </div>
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

      {/* Detailed Stats Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Statistics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Arizalar statistikasi
            </h3>
            <div className="space-y-4">
              {recentStats.map((stat, index) => (
                <div key={stat.period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{stat.period}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>{stat.applications}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>{stat.approved}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{stat.pending}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>{stat.rejected}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* License Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Litsenziyalar taqsimoti
            </h3>
            <div className="space-y-3">
              {[
                { type: 'PRO', count: 45, color: '#F39C12' },
                { type: 'A', count: 128, color: '#E67E22' },
                { type: 'B', count: 234, color: '#1ABC9C' },
                { type: 'C', count: 287, color: '#3498DB' },
                { type: 'D', count: 198, color: '#9B59B6' },
              ].map((license) => (
                <div key={license.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: license.color }}
                    />
                    <span className="font-medium text-gray-700">{license.type} Litsenziya</span>
                  </div>
                  <span className="font-semibold text-[#0D3B6E]">{license.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminStatsOverview;
