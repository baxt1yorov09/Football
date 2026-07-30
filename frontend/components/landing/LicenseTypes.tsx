'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LICENSE_CATEGORIES, LICENSE_REQUIREMENTS, LICENSE_COLORS } from '@/lib/constants/licenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LicenseTypes() {
  const [activeCategory, setActiveCategory] = useState('main');
  const { isAuthenticated } = useAuth();

  const licenseEntries = Object.entries(LICENSE_REQUIREMENTS);
  const filteredLicenses = licenseEntries.filter(([code, license]) => {
    const categoryMap: { [key: string]: string[] } = {
      main: ['D', 'C', 'B', 'A', 'PRO'],
      gk: ['GK_1', 'GK_2', 'GK_3'],
      fitness: ['FITNESS_1', 'FITNESS_2', 'FITNESS_3'],
      specialist: ['SELEK', 'PSYCH', 'ANALYTICS_1', 'ANALYTICS_2'],
      renewal: ['C_RENEWAL', 'B_RENEWAL', 'A_RENEWAL', 'PRO_RENEWAL'],
      special: ['BEACH', 'FUTSAL_1', 'FUTSAL_2', 'FUTSAL_3', 'FUTSAL_GK_1', 'FUTSAL_GK_2', 'FUTSAL_GK_3'],
    };
    return categoryMap[activeCategory]?.includes(code);
  });

  return (
    <section id="licenses" className="scroll-mt-20 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-[#0D3B6E] mb-4">
          Litsenziya turlari
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          O&apos;zbekiston Murabbiylar ta&apos;limi tomonidan tasdiqlangan 26 ta litsenziya turi
        </p>
      </motion.div>

      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {LICENSE_CATEGORIES.map((category) => (
          <button
            key={category.key}
            onClick={() => setActiveCategory(category.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === category.key
                ? 'text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: activeCategory === category.key ? category.color : undefined,
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* License cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLicenses.map(([code, license], index) => {
          const color = LICENSE_COLORS[code as keyof typeof LICENSE_COLORS] || '#3498DB';
          const isPro = code === 'PRO';

          return (
            <motion.div
              key={code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={isAuthenticated ? `/apply/${code}` : `/auth?redirect=/apply/${code}`}>
                <Card 
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                    isPro ? 'border-2 border-[#F39C12]' : ''
                  }`}
                >
                  {/* Color bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: color }}
                  />

                  {/* Shimmer effect for PRO */}
                  {isPro && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-bold text-[#0D3B6E]">
                        {license.name}
                      </CardTitle>
                      {isPro && (
                        <Star className="w-5 h-5 text-[#F39C12] fill-[#F39C12]" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{license.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {license.waitingDays > 0 && (
                        <Badge variant="outline">
                          {license.waitingDays} kun kutish
                        </Badge>
                      )}
                      {license.minAge > 0 && (
                        <Badge variant="outline">
                          Min yosh: {license.minAge}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default LicenseTypes;
