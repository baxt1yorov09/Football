'use client';

import { motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';

// Uzbekistan regions data
const regions = [
  { id: 1, name: 'Toshkent shahri', coaches: 312, isTashkent: true },
  { id: 2, name: 'Toshkent viloyati', coaches: 198 },
  { id: 3, name: 'Samarqand', coaches: 267 },
  { id: 4, name: 'Buxoro', coaches: 189 },
  { id: 5, name: 'Andijon', coaches: 245 },
  { id: 6, name: 'Farg\'ona', coaches: 278 },
  { id: 7, name: 'Namangan', coaches: 234 },
  { id: 8, name: 'Xorazm', coaches: 156 },
  { id: 9, name: 'Navoiy', coaches: 134 },
  { id: 10, name: 'Qashqadaryo', coaches: 198 },
  { id: 11, name: 'Surxondaryo', coaches: 187 },
  { id: 12, name: 'Jizzax', coaches: 145 },
  { id: 13, name: 'Sirdaryo', coaches: 123 },
];

export function UzbekistanMap() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F4F6F9]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D3B6E] mb-4">
            O&apos;zbekiston viloyatlari
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            12 ta viloyat, Qoraqalpog&apos;iston Respublikasi va Toshkent shahri bo&apos;ylab murabbiylar tarqalishi
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Map visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-3xl p-8 shadow-lg"
          >
            <div className="aspect-square relative">
              {/* Stylized map representation */}
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Uzbekistan outline representation */}
                <path
                  d="M100 50 L300 50 L350 100 L350 300 L300 350 L200 380 L100 350 L50 300 L50 100 Z"
                  fill="#E8F4F8"
                  stroke="#1A56A0"
                  strokeWidth="2"
                />
                
                {/* Region markers */}
                {regions.slice(0, 8).map((region, index) => {
                  const angle = (index / 8) * Math.PI * 2;
                  const radius = 100;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  
                  return (
                    <g key={region.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={Math.max(8, region.coaches / 40)}
                        fill={region.isTashkent ? '#F39C12' : '#1A56A0'}
                        opacity={0.8}
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                      />
                      <text
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {region.coaches}
                      </text>
                    </g>
                  );
                })}
                
                {/* Tashkent highlight */}
                <circle cx={200} cy={200} r={15} fill="#F39C12" opacity={0.3}>
                  <animate attributeName="r" values="15;20;15" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>

              {/* Map legend */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#1A56A0]" />
                  <span className="text-gray-600">Viloyatlar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#F39C12]" />
                  <span className="text-gray-600">Toshkent</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Regions list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            {regions.map((region, index) => (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 8, transition: { duration: 0.2 } }}
                className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                  region.isTashkent 
                    ? 'bg-[#F39C12]/10 border-l-4 border-[#F39C12]' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 ${region.isTashkent ? 'text-[#F39C12]' : 'text-[#1A56A0]'}`} />
                  <span className={`font-medium ${region.isTashkent ? 'text-[#F39C12]' : 'text-gray-800'}`}>
                    {region.name}
                  </span>
                  {region.isTashkent && (
                    <span className="px-2 py-1 bg-[#F39C12] text-white text-xs rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{region.coaches}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default UzbekistanMap;
