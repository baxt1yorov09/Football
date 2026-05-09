from django.urls import path
from .views import UserProfileView

urlpatterns = [
    # User profile endpoints
    path('me', UserProfileView.as_view(), name='user-profile'),
]
