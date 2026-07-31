"""
2FA yordamchi funksiyalar — TOTP va zaxira (recovery) kodlari.

Recovery kodlar foydalanuvchiga 1 marta ko'rsatiladi va DB'da SHA-256 hash
ko'rinishida saqlanadi. Har bir kod faqat bir marta ishlatilishi mumkin.
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime
from typing import Iterable, List

from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.utils import timezone

# Recovery kodlar soni va qisqartirish uzunligi
RECOVERY_CODE_COUNT = 10
RECOVERY_CODE_GROUPS = 2          # 2 ta guruh: XXXX-XXXX
RECOVERY_CODE_GROUP_LEN = 4        # har bir guruh 4 ta belgi
RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # chalkashlikni kamaytirish

# 2FA challenge tokeni umri (sekund)
TWO_FACTOR_TOKEN_TTL = 300  # 5 daqiqa
TWO_FACTOR_SIGNER_SALT = 'ufa.users.two_factor.login'


# ──────────────────────────────────────────────────────────────────────────
# Recovery kodlar
# ──────────────────────────────────────────────────────────────────────────
def generate_recovery_codes(count: int = RECOVERY_CODE_COUNT) -> List[str]:
    """`count` ta o'qish-oson recovery kod yaratadi (XXXX-XXXX shaklida)."""
    codes: List[str] = []
    for _ in range(count):
        groups = [
            ''.join(secrets.choice(RECOVERY_ALPHABET) for _ in range(RECOVERY_CODE_GROUP_LEN))
            for _ in range(RECOVERY_CODE_GROUPS)
        ]
        codes.append('-'.join(groups))
    return codes


def hash_recovery_code(code: str) -> str:
    """Kodni normalize qilib SHA-256 hash qaytaradi."""
    normalized = (code or '').upper().replace('-', '').replace(' ', '').strip()
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def make_recovery_code_records(codes: Iterable[str]) -> list[dict]:
    """Kodlar ro'yxatidan DB'ga yozish uchun JSON yozuvlar yasaydi."""
    return [{'hash': hash_recovery_code(c), 'used_at': None} for c in codes]


def verify_and_consume_recovery_code(user, code: str) -> bool:
    """Recovery kodni tekshiradi. To'g'ri bo'lsa — `used_at` belgilab, save qiladi.

    Returns: True (bir martalik kod ishlatildi) yoki False.
    """
    if not code or not user.recovery_codes:
        return False
    target = hash_recovery_code(code)
    changed = False
    for record in user.recovery_codes:
        if record.get('hash') == target and not record.get('used_at'):
            record['used_at'] = timezone.now().isoformat()
            changed = True
            break
    if changed:
        user.save(update_fields=['recovery_codes'])
        return True
    return False


def remaining_recovery_codes(user) -> int:
    if not user.recovery_codes:
        return 0
    return sum(1 for r in user.recovery_codes if not r.get('used_at'))


# ──────────────────────────────────────────────────────────────────────────
# TOTP tekshiruvi
# ──────────────────────────────────────────────────────────────────────────
def verify_totp_code(user, code: str, *, valid_window: int = 1) -> bool:
    """`pyotp` orqali TOTP kodni tekshiradi. Vaqt nosozligiga ±30s chidamlilik."""
    code = (code or '').replace(' ', '').strip()
    if not code or not user.totp_secret:
        return False
    try:
        import pyotp
    except ImportError:
        return False
    totp = pyotp.TOTP(user.totp_secret)
    return bool(totp.verify(code, valid_window=valid_window))


# ──────────────────────────────────────────────────────────────────────────
# 2FA challenge token (login orasidagi vaqtinchalik token)
# ──────────────────────────────────────────────────────────────────────────
def issue_two_factor_token(user) -> str:
    """OTP muvaffaqiyatli o'tgandan so'ng, 2FA bosqichi uchun qisqa muddatli token."""
    signer = TimestampSigner(salt=TWO_FACTOR_SIGNER_SALT)
    return signer.sign(str(user.id))


def consume_two_factor_token(token: str):
    """Tokenni tekshirib, user'ni qaytaradi yoki None.

    Returns: User yoki None
    """
    if not token:
        return None
    signer = TimestampSigner(salt=TWO_FACTOR_SIGNER_SALT)
    try:
        user_id = signer.unsign(token, max_age=TWO_FACTOR_TOKEN_TTL)
    except (BadSignature, SignatureExpired):
        return None
    from apps.users.models import User
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
