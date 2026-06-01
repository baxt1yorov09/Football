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
from rest_framework.permissions import IsAuthenticated, BasePermission
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.applications.models import Application
from apps.users.models import User, Region
from apps.licenses.models import LicenseType


# Admin rollarini tekshiruvchi permission (Django'ning `is_staff`
# o'rniga maxsus `role` maydoniga tayanadi — chunki yangi yaratilgan
# super_admin'larda is_staff=False bo'lishi mumkin).
ADMIN_ROLES = {'super_admin', 'region_admin', 'staff', 'viewer'}


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        return getattr(u, 'role', None) in ADMIN_ROLES or u.is_staff or u.is_superuser


class DashboardStatsView(APIView):
    """Get dashboard statistics"""
    permission_classes = [IsAuthenticated, IsAdminRole]
    
    @swagger_auto_schema(
        operation_description="Get dashboard statistics for admin panel",
        responses={200: 'Dashboard statistics'}
    )
    def get(self, request):
        from apps.licenses.models import License

        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        seven_days_ago = today - timedelta(days=7)
        fourteen_days_ago = today - timedelta(days=14)
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)

        def pct_change(curr, prev):
            if prev == 0:
                return 100.0 if curr > 0 else 0.0
            return round(((curr - prev) / prev) * 100, 1)

        # ===== Region scoping =====
        # region_admin faqat o'z viloyatidagi ma'lumotlarni ko'radi.
        # Super admin va boshqa rollar hammasini ko'radi.
        is_region_admin = (
            getattr(request.user, 'role', None) == 'region_admin'
            and getattr(request.user, 'region_id', None)
        )
        scoped_region_id = request.user.region_id if is_region_admin else None

        apps_qs = Application.objects.all()
        lic_qs = License.objects.all()
        users_qs = User.objects.all()
        if is_region_admin:
            apps_qs = apps_qs.filter(region_id=scoped_region_id)
            lic_qs = lic_qs.filter(Q(region_id=scoped_region_id) | Q(user__region_id=scoped_region_id))
            users_qs = users_qs.filter(region_id=scoped_region_id)

        # ===== Application statistics =====
        total_applications = apps_qs.count()
        pending_applications = apps_qs.filter(status='pending').count()
        under_review = apps_qs.filter(status='under_review').count()
        approved_total = apps_qs.filter(status='approved').count()
        rejected_total = apps_qs.filter(status='rejected').count()

        approved_this_month = apps_qs.filter(
            status='approved', reviewed_at__date__gte=thirty_days_ago
        ).count()
        approved_prev_month = apps_qs.filter(
            status='approved',
            reviewed_at__date__gte=sixty_days_ago,
            reviewed_at__date__lt=thirty_days_ago,
        ).count()

        # Period stats
        apps_today = apps_qs.filter(submitted_at__date=today).count()
        apps_yesterday = apps_qs.filter(submitted_at__date=yesterday).count()
        apps_week = apps_qs.filter(submitted_at__date__gte=seven_days_ago).count()
        apps_prev_week = apps_qs.filter(
            submitted_at__date__gte=fourteen_days_ago,
            submitted_at__date__lt=seven_days_ago,
        ).count()
        apps_month = apps_qs.filter(submitted_at__date__gte=thirty_days_ago).count()
        apps_prev_month = apps_qs.filter(
            submitted_at__date__gte=sixty_days_ago,
            submitted_at__date__lt=thirty_days_ago,
        ).count()

        # ===== License statistics =====
        total_licenses = lic_qs.count()
        active_licenses = lic_qs.filter(
            is_active=True, expires_at__gt=timezone.now()
        ).count()
        expired_licenses = lic_qs.filter(expires_at__lt=timezone.now()).count()
        new_licenses_month = lic_qs.filter(issued_at__date__gte=thirty_days_ago).count()
        new_licenses_prev_month = lic_qs.filter(
            issued_at__date__gte=sixty_days_ago, issued_at__date__lt=thirty_days_ago,
        ).count()

        # ===== User statistics =====
        total_users = users_qs.filter(role='coach').count()
        new_users_month = users_qs.filter(
            role='coach', date_joined__date__gte=thirty_days_ago
        ).count()
        new_users_prev_month = users_qs.filter(
            role='coach',
            date_joined__date__gte=sixty_days_ago,
            date_joined__date__lt=thirty_days_ago,
        ).count()

        # ===== License type distribution (correct field) =====
        license_distribution = list(apps_qs.values(
            'license_type__name_uz', 'license_type__code', 'license_type__color_hex'
        ).annotate(count=Count('id')).order_by('-count'))

        # ===== Regional distribution =====
        region_stats = list(apps_qs.exclude(region__isnull=True).values(
            'region__name_uz'
        ).annotate(count=Count('id')).order_by('-count')[:10])

        # ===== Monthly trend (last 6 months) =====
        six_months_ago = today - timedelta(days=180)
        monthly_trend = apps_qs.filter(
            submitted_at__date__gte=six_months_ago
        ).annotate(month=TruncMonth('submitted_at')).values('month').annotate(
            count=Count('id'),
            approved=Count('id', filter=Q(status='approved')),
            rejected=Count('id', filter=Q(status='rejected')),
        ).order_by('month')

        # ===== Recent applications (last 10) =====
        recent_apps = apps_qs.select_related(
            'user', 'license_type', 'region'
        ).order_by('-submitted_at')[:10]
        recent_activity = [{
            'id': str(a.id),
            'full_name': a.full_name or (a.user.full_name if a.user else ''),
            'license_type': a.license_type.name_uz if a.license_type else None,
            'region': a.region.name_uz if a.region else None,
            'status': a.status,
            'submitted_at': a.submitted_at.isoformat(),
        } for a in recent_apps]

        return Response({
            'overview': {
                'total_applications': total_applications,
                'pending_applications': pending_applications,
                'under_review': under_review,
                'approved_total': approved_total,
                'rejected_total': rejected_total,
                'approved_this_month': approved_this_month,
                'total_users': total_users,
                'new_users_this_month': new_users_month,
                'total_licenses': total_licenses,
                'active_licenses': active_licenses,
                'expired_licenses': expired_licenses,
                'new_licenses_this_month': new_licenses_month,
            },
            'changes': {
                'applications_month_pct': pct_change(apps_month, apps_prev_month),
                'applications_week_pct': pct_change(apps_week, apps_prev_week),
                'approved_pct': pct_change(approved_this_month, approved_prev_month),
                'users_pct': pct_change(new_users_month, new_users_prev_month),
                'licenses_pct': pct_change(new_licenses_month, new_licenses_prev_month),
            },
            'periods': {
                'today':      {'applications': apps_today,
                               'approved': apps_qs.filter(reviewed_at__date=today, status='approved').count(),
                               'rejected': apps_qs.filter(reviewed_at__date=today, status='rejected').count(),
                               'pending': apps_qs.filter(submitted_at__date=today, status__in=['pending', 'under_review']).count()},
                'yesterday':  {'applications': apps_yesterday,
                               'approved': apps_qs.filter(reviewed_at__date=yesterday, status='approved').count(),
                               'rejected': apps_qs.filter(reviewed_at__date=yesterday, status='rejected').count(),
                               'pending': apps_qs.filter(submitted_at__date=yesterday, status__in=['pending', 'under_review']).count()},
                'week':       {'applications': apps_week,
                               'approved': apps_qs.filter(reviewed_at__date__gte=seven_days_ago, status='approved').count(),
                               'rejected': apps_qs.filter(reviewed_at__date__gte=seven_days_ago, status='rejected').count(),
                               'pending': apps_qs.filter(submitted_at__date__gte=seven_days_ago, status__in=['pending', 'under_review']).count()},
                'month':      {'applications': apps_month,
                               'approved': apps_qs.filter(reviewed_at__date__gte=thirty_days_ago, status='approved').count(),
                               'rejected': apps_qs.filter(reviewed_at__date__gte=thirty_days_ago, status='rejected').count(),
                               'pending': apps_qs.filter(submitted_at__date__gte=thirty_days_ago, status__in=['pending', 'under_review']).count()},
            },
            'license_distribution': license_distribution,
            'region_stats': region_stats,
            'monthly_trend': [
                {
                    'month': item['month'].strftime('%Y-%m'),
                    'count': item['count'],
                    'approved': item['approved'],
                    'rejected': item['rejected'],
                } for item in monthly_trend
            ],
            'recent_activity': recent_activity,
            'scoped_region': (
                request.user.region.name_uz if is_region_admin and request.user.region else None
            ),
            'is_region_scoped': bool(is_region_admin),
            'server_time': timezone.now().isoformat(),
        })


class ApplicationReportView(APIView):
    """Generate application reports with filters"""
    permission_classes = [IsAuthenticated, IsAdminRole]
    
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
    permission_classes = [IsAuthenticated, IsAdminRole]
    
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
    permission_classes = [IsAuthenticated, IsAdminRole]
    
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
