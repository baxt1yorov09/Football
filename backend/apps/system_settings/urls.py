from django.urls import path
from .views import (
    SystemSettingsView, NotificationPreferencesView,
    RunBackupNowView, CleanLogsView, SystemStatusView,
    BackupListView, BackupDownloadView, BackupDeleteView,
    MaintenanceStatusView, ContactMessageView,
    BroadcastNotificationView,
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
    path('broadcast', BroadcastNotificationView.as_view(), name='broadcast-notification'),
    path('broadcast/', BroadcastNotificationView.as_view()),
    path('status', SystemStatusView.as_view(), name='system-status'),
    path('status/', SystemStatusView.as_view()),
    # Backup management
    path('backups', BackupListView.as_view(), name='backup-list'),
    path('backups/', BackupListView.as_view()),
    path('backups/<str:name>/download', BackupDownloadView.as_view(), name='backup-download'),
    path('backups/<str:name>/download/', BackupDownloadView.as_view()),
    path('backups/<str:name>', BackupDeleteView.as_view(), name='backup-delete'),
    path('backups/<str:name>/', BackupDeleteView.as_view()),
    # Public — banner uchun (auth talab qilmaydi)
    path('maintenance-status', MaintenanceStatusView.as_view(), name='maintenance-status'),
    path('maintenance-status/', MaintenanceStatusView.as_view()),
    # Public — kontakt formasi
    path('contact', ContactMessageView.as_view(), name='contact-message'),
    path('contact/', ContactMessageView.as_view()),
]
