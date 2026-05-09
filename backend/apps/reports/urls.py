from django.urls import path
from .views import (
    DashboardStatsView,
    ApplicationReportView,
    UserActivityReportView,
    LicenseStatisticsView
)

urlpatterns = [
    # Dashboard statistics
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Application reports
    path('applications/', ApplicationReportView.as_view(), name='application-report'),
    
    # User activity reports
    path('users/', UserActivityReportView.as_view(), name='user-activity-report'),
    
    # License statistics
    path('licenses/', LicenseStatisticsView.as_view(), name='license-statistics'),
]
