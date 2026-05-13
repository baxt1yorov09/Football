from django.urls import path
from .views import LicenseListView

urlpatterns = [
    path('', LicenseListView.as_view(), name='license-list'),
]
