"""
Application API Views
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Q
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

from apps.users.models import User
from apps.licenses.models import LicenseType
from apps.documents.models import Document
from .models import Application, ApplicationTimeline
from .serializers import (
    ApplicationSerializer, 
    ApplicationCreateSerializer,
    ApplicationTimelineSerializer, 
    ApplicationAdminSerializer
)
from utils.email_service import EmailService


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ApplicationListCreateView(APIView):
    """Get user's applications or create new application"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    @swagger_auto_schema(
        operation_description="Get list of user's applications",
        responses={200: ApplicationSerializer(many=True)}
    )
    def get(self, request):
        """Get user's applications"""
        applications = Application.objects.filter(user=request.user)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        serializer = ApplicationSerializer(applications, many=True)
        return Response({
            'applications': serializer.data,
            'total': applications.count()
        })

    @swagger_auto_schema(
        operation_description="Create new application",
        request_body=ApplicationCreateSerializer,
        responses={
            201: ApplicationSerializer,
            400: 'Bad Request',
            403: 'Forbidden - Already has pending application'
        }
    )
    def post(self, request):
        """Create new application"""
        serializer = ApplicationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has pending application for this license type
        license_type_id = serializer.validated_data.get('license_type')
        existing_pending = Application.objects.filter(
            user=request.user,
            license_type_id=license_type_id,
            status__in=['pending', 'under_review', 'additional_docs']
        ).exists()

        if existing_pending:
            return Response(
                {'error': 'Sizda allaqachon kutilayotgan ariza mavjud'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create application
        validated_data = serializer.validated_data
        
        # License_type endi code bilan keladi, validation serializer da bo'ladi
        
        application = Application.objects.create(
            user=request.user,
            region=getattr(request.user, 'region', None),  # Get region from user profile, None if doesn't exist
            **validated_data
        )

        # Create timeline entry
        ApplicationTimeline.objects.create(
            application=application,
            action='submitted',
            note='Ariza yuborildi',
            created_by=request.user
        )

        return Response(
            ApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED
        )


class ApplicationDetailView(APIView):
    """Get, update or cancel specific application"""
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get application details",
        responses={200: ApplicationSerializer, 404: 'Not Found'}
    )
    def get(self, request, application_id):
        """Get application details"""
        try:
            application = Application.objects.get(
                id=application_id,
                user=request.user
            )
        except Application.DoesNotExist:
            return Response(
                {'error': 'Ariza topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ApplicationSerializer(application)
        timeline = ApplicationTimeline.objects.filter(
            application=application
        ).order_by('created_at')
        timeline_serializer = ApplicationTimelineSerializer(timeline, many=True)

        return Response({
            'application': serializer.data,
            'timeline': timeline_serializer.data
        })

    @swagger_auto_schema(
        operation_description="Cancel application (only if pending)",
        responses={200: 'Cancelled', 400: 'Bad Request', 403: 'Forbidden'}
    )
    def delete(self, request, application_id):
        """Cancel application"""
        try:
            application = Application.objects.get(
                id=application_id,
                user=request.user
            )
        except Application.DoesNotExist:
            return Response(
                {'error': 'Ariza topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only pending applications can be cancelled
        if application.status not in ['pending', 'under_review']:
            return Response(
                {'error': 'Faqat kutilayotgan arizalarni bekor qilish mumkin'},
                status=status.HTTP_403_FORBIDDEN
            )

        application.status = 'cancelled'
        application.save()

        ApplicationTimeline.objects.create(
            application=application,
            action='rejected',
            note='Foydalanuvchi tomonidan bekor qilindi',
            created_by=request.user
        )

        return Response({'message': 'Ariza bekor qilindi'})


class AdminApplicationListView(APIView):
    """Admin: List all applications with filtering"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination

    @swagger_auto_schema(
        operation_description="Get all applications (admin only)",
        manual_parameters=[
            openapi.Parameter('status', openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter('region', openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter('license_type', openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter('search', openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        responses={200: ApplicationAdminSerializer(many=True)}
    )
    def get(self, request):
        """Get all applications with filters"""
        applications = Application.objects.all()

        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            applications = applications.filter(status=status_filter)

        region_filter = request.query_params.get('region')
        if region_filter:
            applications = applications.filter(region_id=region_filter)

        license_type_filter = request.query_params.get('license_type')
        if license_type_filter:
            applications = applications.filter(license_type_id=license_type_filter)

        search = request.query_params.get('search')
        if search:
            applications = applications.filter(
                Q(user__full_name__icontains=search) |
                Q(user__phone__icontains=search) |
                Q(id__icontains=search)
            )

        # Statistics
        stats = {
            'total': Application.objects.count(),
            'pending': Application.objects.filter(status='pending').count(),
            'under_review': Application.objects.filter(status='under_review').count(),
            'approved': Application.objects.filter(status='approved').count(),
            'rejected': Application.objects.filter(status='rejected').count(),
        }

        serializer = ApplicationAdminSerializer(
            applications.order_by('-submitted_at'), many=True
        )

        return Response({
            'applications': serializer.data,
            'statistics': stats
        })


class AdminApplicationActionView(APIView):
    """Admin: Approve, reject, or request additional documents"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    @swagger_auto_schema(
        operation_description="Admin action on application",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'action': openapi.Schema(type=openapi.TYPE_STRING, enum=['approve', 'reject', 'request_docs']),
                'note': openapi.Schema(type=openapi.TYPE_STRING),
                'rejection_reason': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={200: ApplicationAdminSerializer, 404: 'Not Found', 400: 'Bad Request'}
    )
    def post(self, request, application_id):
        """Perform admin action on application"""
        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response(
                {'error': 'Ariza topilmadi'},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')
        note = request.data.get('note', '')

        if action not in ['approve', 'reject', 'request_docs']:
            return Response(
                {'error': 'Noto\'g\'ri harakat'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update application status
        if action == 'approve':
            application.status = 'approved'
            application.reviewed_at = timezone.now()
            application.reviewed_by = request.user
            timeline_action = 'approved'
            timeline_note = note or 'Ariza tasdiqlandi'

        elif action == 'reject':
            application.status = 'rejected'
            application.rejection_reason = request.data.get('rejection_reason', '')
            application.reviewed_at = timezone.now()
            application.reviewed_by = request.user
            timeline_action = 'rejected'
            timeline_note = note or 'Ariza rad etildi'

        else:  # request_docs
            application.status = 'additional_docs'
            timeline_action = 'additional_docs'
            timeline_note = note or 'Qo\'shimcha hujjatlar talab qilindi'

        application.save()

        # Create timeline entry
        ApplicationTimeline.objects.create(
            application=application,
            action=timeline_action,
            note=timeline_note,
            created_by=request.user
        )

        return Response(ApplicationAdminSerializer(application).data)
