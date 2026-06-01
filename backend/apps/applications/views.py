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
    ApplicationAdminSerializer,
    AdminOfflineApplicationCreateSerializer,
)
from utils.email_service import EmailService


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class PublicApplicationListView(APIView):
    """Barcha foydalanuvchilarning arizalari ro'yxati (umumiy ko'rish).
    Telefon va email faqat adminlar uchun ko'rinadi."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Application.objects.select_related(
            'user', 'user__region', 'license_type', 'region'
        ).order_by('-submitted_at')

        p = request.query_params
        search = (p.get('search') or '').strip()
        type_f = (p.get('license_type') or '').strip()
        status_f = (p.get('status') or '').strip()
        region_f = (p.get('region') or '').strip()

        if status_f and status_f != 'all':
            qs = qs.filter(status=status_f)
        if type_f:
            qs = qs.filter(license_type__code=type_f)
        if region_f:
            qs = qs.filter(Q(region_id=region_f) | Q(user__region_id=region_f))
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(user__full_name__icontains=search) |
                Q(license_type__name_uz__icontains=search) |
                Q(license_type__code__icontains=search)
            )

        # Pagination
        try:
            limit = max(1, min(int(p.get('limit', 20)), 100))
            offset = max(0, int(p.get('offset', 0)))
        except (TypeError, ValueError):
            limit, offset = 20, 0

        total = qs.count()
        items = list(qs[offset:offset + limit])

        is_admin = request.user.is_staff or request.user.is_superuser

        # Pre-compute queue totals/positions for pending statuses
        pending_statuses = ['pending', 'under_review', 'additional_docs']
        total_in_queue = Application.objects.filter(status__in=pending_statuses).count()

        results = []
        for app in items:
            full_name = app.full_name or app.user.full_name or ''
            row = {
                'id': str(app.id),
                'full_name': full_name,
                'license_type_code': app.license_type.code if app.license_type else '',
                'license_type_name': app.license_type.name_uz if app.license_type else '',
                'license_type_name_ru': (
                    app.license_type.name_ru or app.license_type.name_uz
                ) if app.license_type else '',
                'color_hex': (app.license_type.color_hex if app.license_type else '') or '#1A56A0',
                'region': (app.region.name_uz if app.region else
                           (app.user.region.name_uz if app.user.region else '')),
                'status': app.status,
                'status_display': dict(Application.STATUS_CHOICES).get(app.status, app.status),
                'submitted_at': app.submitted_at.strftime('%Y-%m-%d') if app.submitted_at else '',
                'reviewed_at': app.reviewed_at.strftime('%Y-%m-%d') if app.reviewed_at else '',
            }

            # Navbatga kiradigan statuslar (completed arxivga o'tadi)
            active_statuses = ['pending', 'under_review', 'additional_docs', 'approved', 'called', 'studying']

            # Queue position for pending applications (by region)
            if app.status in pending_statuses and app.submitted_at:
                region_qs = Application.objects.filter(
                    status__in=pending_statuses,
                    region_id=app.region_id,
                )
                row['queue_position'] = region_qs.filter(
                    submitted_at__lte=app.submitted_at,
                ).count()
                row['queue_total'] = region_qs.count()
                row['queue_region'] = app.region.name_uz if app.region else ''
            # Queue position for approved/called/studying applications (by region + license type)
            elif app.status in ['approved', 'called', 'studying'] and app.license_type:
                region_type_qs = Application.objects.filter(
                    status__in=['approved', 'called', 'studying'],
                    region_id=app.region_id,
                    license_type=app.license_type,
                )
                # Agar reviewed_at bo'lmasa submitted_at ishlatiladi
                order_field = app.reviewed_at or app.submitted_at
                if order_field:
                    row['queue_position'] = region_type_qs.filter(
                        reviewed_at__lte=order_field,
                    ).count() if app.reviewed_at else region_type_qs.filter(
                        submitted_at__lte=order_field,
                    ).count()
                else:
                    row['queue_position'] = 1
                row['queue_total'] = region_type_qs.count()
                row['queue_region'] = app.region.name_uz if app.region else ''
            else:
                row['queue_position'] = None
                row['queue_total'] = None
                row['queue_region'] = ''

            # Faqat admin uchun shaxsiy ma'lumot
            if is_admin:
                row['phone'] = (app.phone or app.user.phone or '')
                row['email'] = app.user.email or ''

            results.append(row)

        return Response({
            'count': total,
            'limit': limit,
            'offset': offset,
            'results': results,
        })


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
        print(f"DEBUG: ===== APPLICATION CREATION START =====")
        print(f"DEBUG: User: {request.user}")
        print(f"DEBUG: Request method: {request.method}")
        print(f"DEBUG: Request content type: {request.content_type}")
        print(f"DEBUG: Request POST data: {dict(request.POST)}")
        print(f"DEBUG: Request FILES: {dict(request.FILES)}")
        print(f"DEBUG: ========================================")
        
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
        
        # Extract full_name and phone for this application only
        full_name = validated_data.pop('full_name', None)
        phone = validated_data.pop('phone', None)
        print(f"DEBUG: full_name received: {full_name}")
        print(f"DEBUG: phone received: {phone}")
        
        # License_type endi code bilan keladi, validation serializer da bo'ladi
        # region = O'qimoqchi bo'lgan hudud (admin yo'naltirish uchun)
        # residence_region = Yashaydigan hudud
        region = validated_data.pop('region', None) or getattr(request.user, 'region', None)
        residence_region = validated_data.pop('residence_region', None) or getattr(request.user, 'region', None)
        
        application = Application.objects.create(
            user=request.user,
            full_name=full_name,  # Save full_name to this application only
            phone=phone,          # Save phone to this application only
            region=region,
            residence_region=residence_region,
            **validated_data
        )
        
        print(f"DEBUG: Saved application with full_name: {application.full_name}, phone: {application.phone}")
        
        print(f"DEBUG: Saved application with full_name: {application.full_name}")

        # Handle document uploads
        from apps.documents.models import Document
        import uuid
        import os
        
        print(f"DEBUG: ===== DOCUMENT UPLOAD DEBUG =====")
        print(f"DEBUG: request.FILES = {request.FILES}")
        print(f"DEBUG: request.FILES keys = {list(request.FILES.keys())}")
        print(f"DEBUG: request.POST keys = {list(request.POST.keys())}")
        print(f"DEBUG: request.content_type = {request.content_type}")
        print(f"DEBUG: ======================================")
        
        document_fields = {
            'passport': 'Pasport',
            'photo_3x4': 'Rasm 3x4', 
            'prev_license': 'Oldingi litsenziya'
        }
        
        for field_name, display_name in document_fields.items():
            if field_name in request.FILES:
                print(f"DEBUG: Found file for {field_name}")
                uploaded_file = request.FILES[field_name]
                
                # Generate unique filename
                file_extension = os.path.splitext(uploaded_file.name)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                
                # Create documents directory if it doesn't exist
                documents_dir = os.path.join('media', 'documents')
                os.makedirs(documents_dir, exist_ok=True)
                
                # Save file to disk
                file_path = os.path.join(documents_dir, unique_filename)
                print(f"DEBUG: Saving file to: {file_path}")
                print(f"DEBUG: Current working directory: {os.getcwd()}")
                with open(file_path, 'wb+') as destination:
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)
                
                # Store the actual file URL
                file_url = f"/media/documents/{unique_filename}"
                print(f"DEBUG: File URL: {file_url}")
                print(f"DEBUG: File exists after save: {os.path.exists(file_path)}")
                
                Document.objects.create(
                    application=application,
                    doc_type=field_name,
                    file_url=file_url,
                    file_name=uploaded_file.name,
                    file_size=uploaded_file.size,
                    mime_type=uploaded_file.content_type
                )
                
                print(f"DEBUG: Saved document {field_name} - {uploaded_file.name}")

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
                {'error': f'Ariza topilmadi: {application_id}. Foydalanuvchi: {request.user.id} ({request.user.phone})'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only pending applications can be cancelled
        if application.status not in ['pending', 'under_review']:
            return Response(
                {'error': f'Faqat "Kutilmoqda" yoki "Ko\'rib chiqilmoqda" statusidagi arizalarni o\'chirish mumkin. Joriy status: "{application.status}". Ariza ID: {application.id}'},
                status=status.HTTP_403_FORBIDDEN
            )

        application.status = 'cancelled'
        application.save()

        ApplicationTimeline.objects.create(
            application=application,
            action='cancelled',
            note='Foydalanuvchi tomonidan bekor qilindi',
            created_by=request.user
        )

        return Response({'message': 'Ariza bekor qilindi'})

    @swagger_auto_schema(
        operation_description="Update application (only if pending)",
        request_body=ApplicationCreateSerializer,
        responses={200: ApplicationSerializer, 400: 'Bad Request', 403: 'Forbidden', 404: 'Not Found'}
    )
    def patch(self, request, application_id):
        """Update application details (only allowed for pending applications)"""
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

        # Only pending and under_review applications can be updated
        if application.status not in ['pending', 'under_review']:
            return Response(
                {'error': f'Faqat "Kutilmoqda" yoki "Ko\'rib chiqilmoqda" statusidagi arizalarni tahrirlash mumkin. Joriy status: "{application.status}". Ariza ID: {application.id}'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update fields
        allowed_fields = ['workplace', 'job_title', 'coaching_years', 'license_type']
        for field in allowed_fields:
            if field in request.data:
                setattr(application, field, request.data[field])

        application.save()

        # Create timeline entry
        ApplicationTimeline.objects.create(
            application=application,
            action='updated',
            note='Ariza ma\'lumotlari yangilandi',
            created_by=request.user
        )

        serializer = ApplicationSerializer(application)
        return Response({
            'application': serializer.data,
            'message': 'Ariza ma\'lumotlari yangilandi'
        })


class AdminApplicationListView(APIView):
    """Admin: List all applications with filtering"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination

    # Arxivga o'tkazilgan statuslar (default bo'yicha ko'rsatilmaydi)
    ARCHIVED_STATUSES = ['completed', 'no_show', 'cancelled']

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

        # Region admin'ni o'z viloyatidagi arizalar bilan cheklaymiz.
        # Super admin va boshqa rollar barchasini ko'radi.
        if getattr(request.user, 'role', None) == 'region_admin' and getattr(request.user, 'region_id', None):
            applications = applications.filter(region_id=request.user.region_id)

        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            applications = applications.filter(status=status_filter)
        else:
            # Default: arxivga o'tganlarni ko'rsatma
            applications = applications.exclude(status__in=self.ARCHIVED_STATUSES)

        region_filter = request.query_params.get('region')
        if region_filter:
            # region_admin uchun — boshqa viloyatni filterlay olmaydi
            if getattr(request.user, 'role', None) == 'region_admin' and getattr(request.user, 'region_id', None):
                if str(region_filter) != str(request.user.region_id):
                    applications = applications.none()
            else:
                applications = applications.filter(region_id=region_filter)

        license_type_filter = request.query_params.get('license_type')
        if license_type_filter:
            # Frontend turi `code` (masalan 'A', 'B', 'PRO') yuboradi, eski integer ID ham qo'llab-quvvatlanadi.
            if str(license_type_filter).isdigit():
                applications = applications.filter(license_type_id=int(license_type_filter))
            else:
                applications = applications.filter(license_type__code=license_type_filter)

        # GK / FITNESS / FUTSAL kabi turlar uchun daraja (level) filtri
        level_filter = request.query_params.get('level')
        if level_filter:
            try:
                applications = applications.filter(license_type__level=int(level_filter))
            except (TypeError, ValueError):
                pass

        search = request.query_params.get('search')
        if search:
            applications = applications.filter(
                Q(user__full_name__icontains=search) |
                Q(user__phone__icontains=search) |
                Q(id__icontains=search)
            )

        # Statistics — region_admin uchun ham o'z viloyati bo'yicha
        stats_qs = Application.objects.all()
        if getattr(request.user, 'role', None) == 'region_admin' and getattr(request.user, 'region_id', None):
            stats_qs = stats_qs.filter(region_id=request.user.region_id)

        # Asosiy statuslar (arxivga o'tmaganlar)
        active_qs = stats_qs.exclude(status__in=self.ARCHIVED_STATUSES)
        stats = {
            'total': active_qs.count(),
            'pending': stats_qs.filter(status='pending').count(),
            'under_review': stats_qs.filter(status='under_review').count(),
            'approved': stats_qs.filter(status='approved').count(),
            'called': stats_qs.filter(status='called').count(),
            'studying': stats_qs.filter(status='studying').count(),
            'rejected': stats_qs.filter(status='rejected').count(),
            'completed': stats_qs.filter(status='completed').count(),
            'no_show': stats_qs.filter(status='no_show').count(),
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

    # Ruxsat etilgan harakatlar
    VALID_ACTIONS = ['approve', 'reject', 'request_docs', 'call', 'start_study', 'complete', 'no_show']

    @swagger_auto_schema(
        operation_description="Admin action on application",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'action': openapi.Schema(type=openapi.TYPE_STRING, enum=VALID_ACTIONS),
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

        # Region admin faqat o'z viloyatidagi arizaga ta'sir o'tkaza oladi
        if (getattr(request.user, 'role', None) == 'region_admin'
                and getattr(request.user, 'region_id', None)
                and application.region_id
                and application.region_id != request.user.region_id):
            return Response(
                {'error': 'Bu ariza sizning viloyatingizga tegishli emas'},
                status=status.HTTP_403_FORBIDDEN
            )

        action = request.data.get('action')
        note = request.data.get('note', '')

        if action not in self.VALID_ACTIONS:
            return Response(
                {'error': 'Noto\'g\'ri harakat', 'valid_actions': self.VALID_ACTIONS},
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
            rejection_reason = request.data.get('rejection_reason', '').strip()
            if not rejection_reason:
                return Response(
                    {'error': 'Rad etish sababi majburiy'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            application.status = 'rejected'
            application.rejection_reason = rejection_reason
            application.reviewed_at = timezone.now()
            application.reviewed_by = request.user
            timeline_action = 'rejected'
            timeline_note = note or f'Ariza rad etildi: {rejection_reason}'

        elif action == 'request_docs':
            application.status = 'additional_docs'
            timeline_action = 'additional_docs'
            timeline_note = note or 'Qo\'shimcha hujjatlar talab qilindi'

        # === O'QISH WORKFLOW ===
        elif action == 'call':
            # Telefon qilib chaqirish
            application.status = 'called'
            timeline_action = 'called'
            timeline_note = note or 'Telefon qilib o\'qishga chaqirildi'

        elif action == 'start_study':
            # O'qishni boshladi
            application.status = 'studying'
            timeline_action = 'studying'
            timeline_note = note or 'O\'qishni boshladi'

        elif action == 'complete':
            # O'qib bo'lgan (arxivga)
            application.status = 'completed'
            application.reviewed_at = timezone.now()
            application.reviewed_by = request.user
            timeline_action = 'completed'
            timeline_note = note or 'O\'qib bitirdi (arxivga o\'tkazildi)'

        elif action == 'no_show':
            # Chaqirildi lekin kelmadi
            application.status = 'no_show'
            timeline_action = 'no_show'
            timeline_note = note or 'Chaqirildi lekin kelmadi'

        application.save()

        # Create timeline entry
        ApplicationTimeline.objects.create(
            application=application,
            action=timeline_action,
            note=timeline_note,
            created_by=request.user
        )

        return Response(ApplicationAdminSerializer(application).data)


class AdminOfflineApplicationCreateView(APIView):
    """Admin: daftardagi (offline) o'quvchini navbat sanasi bilan qo'shish.

    Navbat raqami (region + litsenziya turi doirasida) queue_priority bo'yicha
    avtomatik hisoblanadi — eski sanali offline yozuvlar oldinda turadi va
    platformadan kelgan arizalarning raqami o'zi suriladi.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = AdminOfflineApplicationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        region = data['region']

        # Region admin faqat o'z viloyatiga qo'sha oladi
        if (getattr(request.user, 'role', None) == 'region_admin'
                and getattr(request.user, 'region_id', None)
                and region.id != request.user.region_id):
            return Response(
                {'error': 'Faqat o\'z viloyatingizga qo\'sha olasiz'},
                status=status.HTTP_403_FORBIDDEN
            )

        full_name = data['full_name'].strip()
        phone = (data.get('phone') or '').strip()

        # Foydalanuvchi: telefon bo'lsa get_or_create, bo'lmasa placeholder
        # AbstractUser.username unique — offline userlar uchun unikal qiymat beriladi
        import uuid as _uuid
        if phone:
            user, _created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    'username': f"offline_{_uuid.uuid4().hex[:12]}",
                    'full_name': full_name,
                    'role': 'coach',
                    'region': region,
                },
            )
        else:
            user = User.objects.create(
                username=f"offline_{_uuid.uuid4().hex[:12]}",
                phone=f"offline-{_uuid.uuid4().hex[:12]}",
                full_name=full_name, role='coach', region=region,
            )

        # queue_date (DateField) -> queue_priority (DateTimeField), tushdagi vaqt
        from datetime import datetime, time
        qd = data['queue_date']
        naive = datetime.combine(qd, time(12, 0))
        queue_priority = timezone.make_aware(naive) if timezone.is_naive(naive) else naive

        application = Application(
            user=user,
            full_name=full_name,
            phone=phone or None,
            license_type=data['license_type'],
            region=region,
            residence_region=data.get('residence_region') or region,
            workplace=data.get('workplace') or None,
            job_title=data.get('job_title') or None,
            coaching_years=data.get('coaching_years') or 0,
            status=data.get('status') or 'pending',
            is_offline=True,
            queue_priority=queue_priority,
        )
        application.save()

        ApplicationTimeline.objects.create(
            application=application,
            action='submitted',
            note='Daftardan kiritildi (offline)',
            created_by=request.user,
        )

        return Response(
            ApplicationAdminSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )
