from django.urls import path

from .views import (
    NotificationDeleteView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('/', NotificationListView.as_view()),
    path('unread-count', NotificationUnreadCountView.as_view(), name='notifications-unread-count'),
    path('unread-count/', NotificationUnreadCountView.as_view()),
    path('read-all', NotificationMarkAllReadView.as_view(), name='notifications-read-all'),
    path('read-all/', NotificationMarkAllReadView.as_view()),
    path('<uuid:notification_id>/read', NotificationMarkReadView.as_view(), name='notifications-read'),
    path('<uuid:notification_id>/read/', NotificationMarkReadView.as_view()),
    path('<uuid:notification_id>', NotificationDeleteView.as_view(), name='notifications-delete'),
    path('<uuid:notification_id>/', NotificationDeleteView.as_view()),
]
