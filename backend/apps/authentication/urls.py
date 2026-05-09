from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SendOTPView, VerifyOTPView, UserProfileView, LogoutView, RegionsListView

urlpatterns = [
    # OTP Authentication
    path('send-otp', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp', VerifyOTPView.as_view(), name='verify-otp'),

    # JWT Token
    path('refresh', TokenRefreshView.as_view(), name='token-refresh'),

    # User Profile
    path('me', UserProfileView.as_view(), name='user-profile'),

    # Logout
    path('logout', LogoutView.as_view(), name='logout'),

    # Regions
    path('regions', RegionsListView.as_view(), name='regions-list'),
]
