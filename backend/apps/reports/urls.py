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
    path('dashboard', DashboardStatsView.as_view()),

    # Application reports
    path('applications/', ApplicationReportView.as_view(), name='application-report'),
    path('applications', ApplicationReportView.as_view()),

    # User activity reports
    path('users/', UserActivityReportView.as_view(), name='user-activity-report'),
    path('users', UserActivityReportView.as_view()),

    # License statistics
    path('licenses/', LicenseStatisticsView.as_view(), name='license-statistics'),
    path('licenses', LicenseStatisticsView.as_view()),
]
