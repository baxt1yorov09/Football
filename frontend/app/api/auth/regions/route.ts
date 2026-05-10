import { NextRequest, NextResponse } from 'next/server';

const DJANGO = process.env.DJANGO_API_URL ?? 'http://127.0.0.1:8000';

// Regions — public endpoint, token shart emas
export async function GET(req: NextRequest) {
  try {
    const djangoRes = await fetch(`${DJANGO}/api/auth/regions`, {
      cache: 'no-store',
    });

    if (!djangoRes.ok) {
      // Django route yo'q bo'lsa — static fallback qaytaramiz
      return NextResponse.json(FALLBACK_REGIONS);
    }

    const text = await djangoRes.text();
    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch {
    // Django ishlamasa ham forma ishlashi uchun static data
    return NextResponse.json(FALLBACK_REGIONS);
  }
}

const FALLBACK_REGIONS = [
  { id: 1,  name: "Toshkent shahri",    is_tashkent: true  },
  { id: 2,  name: "Toshkent viloyati",  is_tashkent: false },
  { id: 3,  name: "Andijon",            is_tashkent: false },
  { id: 4,  name: "Farg'ona",           is_tashkent: false },
  { id: 5,  name: "Namangan",           is_tashkent: false },
  { id: 6,  name: "Samarqand",          is_tashkent: false },
  { id: 7,  name: "Buxoro",             is_tashkent: false },
  { id: 8,  name: "Xorazm",             is_tashkent: false },
  { id: 9,  name: "Qashqadaryo",        is_tashkent: false },
  { id: 10, name: "Surxondaryo",        is_tashkent: false },
  { id: 11, name: "Sirdaryo",           is_tashkent: false },
  { id: 12, name: "Jizzax",             is_tashkent: false },
  { id: 13, name: "Navoiy",             is_tashkent: false },
  { id: 14, name: "Qoraqalpog'iston",   is_tashkent: false },
];
