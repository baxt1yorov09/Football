from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SendOTPView, VerifyOTPView, UserProfileView, LogoutView,
    RegionsListView, AdminLoginView, TwoFactorLoginView,
)

urlpatterns = [
    # OTP Authentication
    path('send-otp', SendOTPView.as_view(), name='send-otp'),
    path('send-otp/', SendOTPView.as_view()),
    path('verify-otp', VerifyOTPView.as_view(), name='verify-otp'),
    path('verify-otp/', VerifyOTPView.as_view()),

    # 2FA login (TOTP/recovery code) — OTP'dan keyingi bosqich
    path('2fa-login', TwoFactorLoginView.as_view(), name='2fa-login'),
    path('2fa-login/', TwoFactorLoginView.as_view()),

    # JWT Token
    path('refresh', TokenRefreshView.as_view(), name='token-refresh'),

    # User Profile
    path('me', UserProfileView.as_view(), name='user-profile'),

    # Logout
    path('logout', LogoutView.as_view(), name='logout'),

    # Regions
    path('regions', RegionsListView.as_view(), name='regions-list'),

    # Admin Authentication
    path('admin/login', AdminLoginView.as_view(), name='admin-login'),
]
