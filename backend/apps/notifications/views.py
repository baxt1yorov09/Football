from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification


def _notification_to_dict(n):
    return {
        'id': str(n.id),
        'type': n.type,
        'type_label': n.get_type_display(),
        'title': n.title,
        'message': n.message,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat() if n.created_at else None,
        'read_at': n.read_at.isoformat() if n.read_at else None,
    }


class NotificationListView(APIView):
    """List user's notifications + unread count"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        # Filters
        is_read = request.query_params.get('is_read')
        if is_read in ('true', '1'):
            qs = qs.filter(is_read=True)
        elif is_read in ('false', '0'):
            qs = qs.filter(is_read=False)

        type_filter = request.query_params.get('type')
        if type_filter and type_filter != 'all':
            qs = qs.filter(type=type_filter)

        # Limit
        try:
            limit = int(request.query_params.get('limit', 50))
        except ValueError:
            limit = 50
        limit = min(max(limit, 1), 200)

        notifications = qs.order_by('-created_at')[:limit]
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        total_count = Notification.objects.filter(user=request.user).count()

        return Response({
            'results': [_notification_to_dict(n) for n in notifications],
            'unread_count': unread_count,
            'total_count': total_count,
        })


class NotificationUnreadCountView(APIView):
    """Lightweight endpoint for real-time badge polling"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})


class NotificationMarkReadView(APIView):
    """Mark a single notification as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            n = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        if not n.is_read:
            n.is_read = True
            n.read_at = timezone.now()
            n.save(update_fields=['is_read', 'read_at'])
        return Response(_notification_to_dict(n))


class NotificationMarkAllReadView(APIView):
    """Mark all notifications as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({'updated': updated})


class NotificationDeleteView(APIView):
    """Delete a notification"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        try:
            n = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        n.delete()
        return Response({'detail': "O'chirildi"})
