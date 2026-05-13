from django.urls import path
from .views import (
    SystemSettingsView, NotificationPreferencesView,
    RunBackupNowView, CleanLogsView, SystemStatusView,
)

urlpatterns = [
    path('system', SystemSettingsView.as_view(), name='system-settings'),
    path('system/', SystemSettingsView.as_view()),
    path('notifications', NotificationPreferencesView.as_view(), name='notification-prefs'),
    path('notifications/', NotificationPreferencesView.as_view()),
    path('backup-now', RunBackupNowView.as_view(), name='backup-now'),
    path('backup-now/', RunBackupNowView.as_view()),
    path('clean-logs', CleanLogsView.as_view(), name='clean-logs'),
    path('clean-logs/', CleanLogsView.as_view()),
    path('status', SystemStatusView.as_view(), name='system-status'),
    path('status/', SystemStatusView.as_view()),
]
