"""
Reports API Views
"""
from django.db.models import Count, Q, Avg, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.applications.models import Application
from apps.users.models import User, Region
from apps.licenses.models import LicenseType


class DashboardStatsView(APIView):
    """Get dashboard statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get dashboard statistics for admin panel",
        responses={200: 'Dashboard statistics'}
    )
    def get(self, request):
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        
        # Application statistics
        total_applications = Application.objects.count()
        pending_applications = Application.objects.filter(status='pending').count()
        under_review = Application.objects.filter(status='under_review').count()
        approved_this_month = Application.objects.filter(
            status='approved',
            reviewed_at__date__gte=thirty_days_ago
        ).count()
        
        # User statistics
        total_users = User.objects.filter(role='coach').count()
        new_users_this_month = User.objects.filter(
            role='coach',
            date_joined__date__gte=thirty_days_ago
        ).count()
        
        # License type distribution
        license_distribution = Application.objects.values(
            'license_type__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Regional distribution
        region_stats = Application.objects.values(
            'region__name_uz'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Monthly trend (last 6 months)
        six_months_ago = today - timedelta(days=180)
        monthly_trend = Application.objects.filter(
            submitted_at__date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('submitted_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        return Response({
            'overview': {
                'total_applications': total_applications,
                'pending_applications': pending_applications,
                'under_review': under_review,
                'approved_this_month': approved_this_month,
                'total_users': total_users,
                'new_users_this_month': new_users_this_month,
            },
            'license_distribution': list(license_distribution),
            'region_stats': list(region_stats),
            'monthly_trend': [
                {
                    'month': item['month'].strftime('%Y-%m'),
                    'count': item['count']
                } for item in monthly_trend
            ]
        })


class ApplicationReportView(APIView):
    """Generate application reports with filters"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Generate application report with date range and filters",
        manual_parameters=[
            openapi.Parameter('start_date', openapi.IN_QUERY, type=openapi.TYPE_STRING, format='date'),
            openapi.Parameter('end_date', openapi.IN_QUERY, type=openapi.TYPE_STRING, format='date'),
            openapi.Parameter('status', openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter('license_type', openapi.IN_QUERY, type=openapi.TYPE_STRING),
            openapi.Parameter('region', openapi.IN_QUERY, type=openapi.TYPE_STRING),
        ],
        responses={200: 'Application report'}
    )
    def get(self, request):
        # Get filter parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')
        license_type = request.query_params.get('license_type')
        region = request.query_params.get('region')
        
        # Base queryset
        queryset = Application.objects.all()
        
        # Apply date filters
        if start_date:
            queryset = queryset.filter(submitted_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(submitted_at__date__lte=end_date)
        
        # Apply other filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if license_type:
            queryset = queryset.filter(license_type_id=license_type)
        if region:
            queryset = queryset.filter(region_id=region)
        
        # Calculate statistics
        total_count = queryset.count()
        
        status_breakdown = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Average processing time (approved applications only)
        avg_processing_time = queryset.filter(
            status='approved',
            reviewed_at__isnull=False
        ).annotate(
            processing_time=ExpressionWrapper(
                F('reviewed_at') - F('submitted_at'),
                output_field=DurationField()
            )
        ).aggregate(avg_time=Avg('processing_time'))
        
        # Applications per day
        daily_stats = queryset.annotate(
            day=F('submitted_at__date')
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        return Response({
            'filters_applied': {
                'start_date': start_date,
                'end_date': end_date,
                'status': status_filter,
                'license_type': license_type,
                'region': region,
            },
            'summary': {
                'total_applications': total_count,
                'avg_processing_time_days': (
                    avg_processing_time['avg_time'].days 
                    if avg_processing_time['avg_time'] 
                    else None
                ),
            },
            'status_breakdown': list(status_breakdown),
            'daily_stats': [
                {
                    'date': item['day'].strftime('%Y-%m-%d'),
                    'count': item['count']
                } for item in daily_stats
            ]
        })


class UserActivityReportView(APIView):
    """Get user activity report"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get user registration and activity statistics",
        responses={200: 'User activity report'}
    )
    def get(self, request):
        today = timezone.now().date()
        
        # Registration trend (last 6 months)
        six_months_ago = today - timedelta(days=180)
        registration_trend = User.objects.filter(
            role='coach',
            date_joined__date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        # Active users (have submitted applications)
        active_users = User.objects.filter(
            role='coach',
            applications__isnull=False
        ).distinct().count()
        
        # Users by region
        users_by_region = User.objects.filter(
            role='coach'
        ).values(
            'region__name_uz'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Top users by applications
        top_users = User.objects.filter(
            role='coach'
        ).annotate(
            application_count=Count('applications')
        ).order_by('-application_count')[:10]
        
        return Response({
            'registration_trend': [
                {
                    'month': item['month'].strftime('%Y-%m'),
                    'new_users': item['count']
                } for item in registration_trend
            ],
            'active_users': active_users,
            'users_by_region': list(users_by_region),
            'top_users': [
                {
                    'name': user.full_name,
                    'phone': user.phone,
                    'applications': user.application_count
                } for user in top_users
            ]
        })


class LicenseStatisticsView(APIView):
    """Get license statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get detailed license type statistics",
        responses={200: 'License statistics'}
    )
    def get(self, request):
        # Statistics by license type
        license_stats = LicenseType.objects.annotate(
            total_applications=Count('applications'),
            approved=Count('applications', filter=Q(applications__status='approved')),
            pending=Count('applications', filter=Q(applications__status='pending')),
            rejected=Count('applications', filter=Q(applications__status='rejected')),
        ).values(
            'name', 'code', 'total_applications', 
            'approved', 'pending', 'rejected'
        ).order_by('-total_applications')
        
        # Approval rate by license type
        approval_rates = []
        for stat in license_stats:
            total = stat['total_applications']
            approved = stat['approved']
            rate = (approved / total * 100) if total > 0 else 0
            approval_rates.append({
                'license_type': stat['name'],
                'approval_rate': round(rate, 2)
            })
        
        return Response({
            'license_stats': list(license_stats),
            'approval_rates': approval_rates
        })
