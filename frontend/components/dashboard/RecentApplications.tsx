'use client';

import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APPLICATION_STATUS } from '@/lib/constants/licenses';

const applications = [
  {
    id: 'APP-2026-001234',
    type: 'PRO Litsenziya',
    status: 'under_review',
    submittedAt: '08.05.2026 14:30',
    reviewedAt: '09.05.2026 09:15',
  },
  {
    id: 'APP-2026-001198',
    type: 'D Litsenziya',
    status: 'approved',
    submittedAt: '15.04.2026 10:20',
    reviewedAt: '17.04.2026 11:45',
  },
  {
    id: 'APP-2026-001156',
    type: 'C Litsenziya',
    status: 'rejected',
    submittedAt: '01.04.2026 16:00',
    reviewedAt: '03.04.2026 14:30',
    rejectionReason: 'Kutish muddati yetarli emas',
  },
];

const statusConfig = {
  pending: { color: '#F39C12', icon: Clock, bgColor: '#F39C12/10' },
  under_review: { color: '#3498DB', icon: Eye, bgColor: '#3498DB/10' },
  additional_docs: { color: '#E67E22', icon: FileText, bgColor: '#E67E22/10' },
  approved: { color: '#27AE60', icon: CheckCircle, bgColor: '#27AE60/10' },
  rejected: { color: '#E74C3C', icon: XCircle, bgColor: '#E74C3C/10' },
};

export function RecentApplications() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E]">
          So'nggi arizalar
        </CardTitle>
        <Link 
          href="/applications"
          className="text-sm text-[#1A56A0] hover:text-[#F39C12] flex items-center gap-1"
        >
          Barchasini ko'rish
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {applications.map((app, index) => {
            const status = statusConfig[app.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1A56A0]/30 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: status.color + '15' }}
                  >
                    <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
                  </div>

                  {/* Application Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0D3B6E]">{app.id}</span>
                      <Badge 
                        variant="secondary" 
                        style={{ 
                          backgroundColor: status.color + '15', 
                          color: status.color,
                          border: 'none'
                        }}
                      >
                        {APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS]?.label || app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{app.type}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Yuborildi: {app.submittedAt}</span>
                      {app.reviewedAt && <span>Ko'rib chiqildi: {app.reviewedAt}</span>}
                    </div>
                    {app.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">
                        Sabab: {app.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action */}
                <Link href={`/applications/${app.id}`}>
                  <Button variant="ghost" size="sm" className="text-[#1A56A0]">
                    Batafsil
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentApplications;
