#!/bin/bash
# ═══════════════════════════════════════════════════════
# UFA License System — Server Deploy Script
# Serverga birinchi marta deploy qilish uchun ishlatiladi
# ═══════════════════════════════════════════════════════

set -e

echo "=== 1. System paketlarni yangilash ==="
apt-get update && apt-get upgrade -y
apt-get install -y curl git

echo "=== 2. Docker o'rnatish ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

echo "=== 3. Loyiha papkasini yaratish ==="
mkdir -p /var/www/ufa
cd /var/www/ufa

echo "=== 4. .env faylni tekshirish ==="
if [ ! -f .env ]; then
    echo "XATO: .env fayl topilmadi!"
    echo "Avval .env.example'dan nusxa oling va to'ldiring:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo "=== 5. Docker konteynerlarni build va ishga tushirish ==="
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

echo "=== 6. 30 soniya kutamiz (servislar yuklanishi uchun) ==="
sleep 30

echo "=== 7. Holat tekshiruvi ==="
docker compose ps

echo ""
echo "=== TAYYOR! ==="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Nginx:    http://localhost:80"
echo ""
echo "Super admin yaratish uchun:"
echo "  docker compose exec backend python manage.py createsuperuser"
echo ""
echo "SSL sertifikat olish uchun (domen DNS tayyor bo'lgandan keyin):"
echo "  apt install certbot python3-certbot-nginx"
echo "  certbot --nginx -d yourdomain.uz -d www.yourdomain.uz"
