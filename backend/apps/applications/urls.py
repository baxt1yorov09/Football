from django.urls import path
from .views import (
    ApplicationListCreateView,
    ApplicationDetailView,
    AdminApplicationListView,
    AdminApplicationActionView,
    AdminOfflineApplicationCreateView,
    PublicApplicationListView,
)

urlpatterns = [
    # Public list (barcha foydalanuvchilarning arizalari)
    path('public/', PublicApplicationListView.as_view(), name='application-public'),
    path('public',  PublicApplicationListView.as_view()),

    # User application endpoints
    path('', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('<uuid:application_id>', ApplicationDetailView.as_view(), name='application-detail'),
    
    # Admin endpoints
    path('admin/all', AdminApplicationListView.as_view(), name='admin-application-list'),
    path('admin/offline', AdminOfflineApplicationCreateView.as_view(), name='admin-application-offline-create'),
    path('admin/<uuid:application_id>/action', AdminApplicationActionView.as_view(), name='admin-application-action'),
]
