# 🏆 O'ZBEKISTON FUTBOL FEDERATSIYASI — MURABBIY LITSENZIYA TIZIMI

Milliy miqyosdagi murabbiy litsenziya ro'yxatdan o'tish tizimi.

## 📋 Loyiha tarkibi

- **Web Portal** (Next.js 14) — murabbiylar uchun
- **Admin Panel** (Next.js 14) — federatsiya xodimlari uchun  
- **Telegram Bot** (python-telegram-bot) — bildirishnomalar
- **Backend API** (Django 5 + DRF) — barcha biznes logikasi
- **PDF Generator** — avtomatik litsenziya chiqarish

## 🚀 Boshlash

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Telegram Bot
cd telegram_bot
pip install -r requirements.txt
python main.py
```

## 🗄️ Database

PostgreSQL 16 bilan ishlaydi. Barcha 11 ta jadval avtomatik yaratiladi.

## 🔐 Xavfsizlik

- JWT Authentication
- SMS OTP (Eskiz.uz)
- Rate limiting
- File security (virus scan)
- RBAC (Role-Based Access Control)

---

**O'zbekiston Futbol Federatsiyasi, 2026**
