'use client';

import { motion } from 'framer-motion';
import { 
  Plus, 
  Download, 
  Upload, 
  FileText, 
  Users, 
  Award,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function QuickActions() {
  const { t } = useI18n();
  const quickActions = [
    {
      title: t('admin.lic_panel.new_license'),
      description: t('admin.lic_panel.title'),
      icon: Award,
      color: '#F39C12',
      bgColor: '#F39C12/10',
      action: 'create-license'
    },
    {
      title: t('admin.lic_panel.export'),
      description: t('common.download'),
      icon: Download,
      color: '#3498DB',
      bgColor: '#3498DB/10',
      action: 'export-applications'
    },
    {
      title: t('admin.users_panel.new_user'),
      description: t('admin.users_panel.subtitle'),
      icon: Upload,
      color: '#27AE60',
      bgColor: '#27AE60/10',
      action: 'bulk-import'
    },
    {
      title: t('admin.settings'),
      description: t('admin.tabs.system'),
      icon: Settings,
      color: '#9B59B6',
      bgColor: '#9B59B6/10',
      action: 'system-backup'
    },
  ];
  const handleAction = (action: string) => {
    console.log('Action:', action);
    // TODO: Implement action handlers
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-[#0D3B6E]">
          {t('admin.realtime_stats')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-3 p-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.button
                key={action.action}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAction(action.action)}
                className="p-4 rounded-xl border border-gray-200 hover:border-[#F39C12] hover:shadow-md transition-all text-left group"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <h4 className="font-semibold text-[#0D3B6E] text-sm mb-1 group-hover:text-[#F39C12] transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {action.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
