from django.urls import path
from .views import (
    DashboardStatsView,
    ApplicationReportView,
    UserActivityReportView,
    LicenseStatisticsView
)
from .admin_views import (
    AdminReportStatsView,
    AdminReportTemplatesView,
    AdminReportListView,
    AdminReportDetailView,
    AdminReportGenerateView,
    AdminReportDownloadView,
    AdminReportDeleteView,
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

    # ───── Admin Reports Management ─────
    path('admin/stats', AdminReportStatsView.as_view(), name='admin-reports-stats'),
    path('admin/stats/', AdminReportStatsView.as_view()),
    path('admin/templates', AdminReportTemplatesView.as_view(), name='admin-reports-templates'),
    path('admin/templates/', AdminReportTemplatesView.as_view()),
    path('admin/list', AdminReportListView.as_view(), name='admin-reports-list'),
    path('admin/list/', AdminReportListView.as_view()),
    path('admin/generate', AdminReportGenerateView.as_view(), name='admin-reports-generate'),
    path('admin/generate/', AdminReportGenerateView.as_view()),
    path('admin/<int:report_id>', AdminReportDetailView.as_view(), name='admin-reports-detail'),
    path('admin/<int:report_id>/', AdminReportDetailView.as_view()),
    path('admin/<int:report_id>/download', AdminReportDownloadView.as_view(), name='admin-reports-download'),
    path('admin/<int:report_id>/download/', AdminReportDownloadView.as_view()),
    path('admin/<int:report_id>/delete', AdminReportDeleteView.as_view(), name='admin-reports-delete'),
    path('admin/<int:report_id>/delete/', AdminReportDeleteView.as_view()),
]
