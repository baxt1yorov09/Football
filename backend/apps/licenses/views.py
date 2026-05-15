from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime

from .models import License, LicenseType
from apps.applications.models import Application

# Services import - optional
try:
    from .services import generate_license_pdf, bulk_generate_licenses
    SERVICES_AVAILABLE = True
except ImportError:
    SERVICES_AVAILABLE = False


class LicenseTypeListView(APIView):
    """Faol litsenziya turlari ro'yxati (admin formalari uchun)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = LicenseType.objects.filter(is_active=True).order_by('sort_order', 'code')
        return Response({
            'results': [
                {
                    'code': t.code,
                    'name_uz': t.name_uz,
                    'name_ru': t.name_ru,
                    'category': t.category,
                    'color_hex': t.color_hex or '#1A56A0',
                }
                for t in qs
            ]
        })


class LicenseListView(APIView):
    """Get all licenses for current user (with rich data + summary stats)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import timedelta

        qs = License.objects.filter(user=request.user).select_related(
            'license_type', 'region'
        ).order_by('-issued_at')

        now = timezone.now()
        results = []
        active_count = 0
        expired_count = 0
        suspended_count = 0
        expiring_soon = 0

        for lic in qs:
            comp = lic.computed_status
            days_left = lic.days_until_expiry
            if comp == 'active':
                active_count += 1
                if 0 < days_left <= 30:
                    expiring_soon += 1
            elif comp == 'expired':
                expired_count += 1
            elif comp == 'suspended':
                suspended_count += 1

            results.append({
                'id': str(lic.id),
                'license_number': lic.license_number,
                'license_type_code': lic.license_type.code,
                'license_type_name': lic.license_type.name_uz,
                'license_type_category': lic.license_type.category,
                'color_hex': lic.license_type.color_hex or '#1A56A0',
                'region': (lic.region.name_uz if lic.region else
                           (request.user.region.name_uz if request.user.region else '')),
                'status': comp,
                'status_display': {
                    'active': 'Faol',
                    'expired': "Muddati o'tgan",
                    'suspended': "To'xtatilgan",
                    'revoked': 'Bekor qilingan',
                }.get(comp, comp),
                'issued_at': lic.issued_at.strftime('%Y-%m-%d') if lic.issued_at else '',
                'expires_at': lic.expires_at.strftime('%Y-%m-%d') if lic.expires_at else '',
                'days_left': days_left,
                'is_expiring_soon': 0 < days_left <= 30,
                'is_active': lic.is_active,
                'pdf_url': lic.pdf_url or '',
                'qr_code_url': lic.qr_code_url or '',
                'verification_url': f"/verify/{lic.id}",
            })

        return Response({
            'count': len(results),
            'summary': {
                'total': len(results),
                'active': active_count,
                'expired': expired_count,
                'suspended': suspended_count,
                'expiring_soon': expiring_soon,
            },
            'results': results,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def license_detail(request, license_id):
    """Get license details"""
    try:
        license_obj = get_object_or_404(License, id=license_id)
        
        # Check if user owns the license or is admin
        if not (request.user.is_staff or license_obj.user == request.user):
            return Response(
                {'error': 'Ruxsat berilmagan'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = {
            'id': license_obj.id,
            'license_number': license_obj.license_number,
            'license_type': {
                'id': license_obj.license_type.id,
                'name': license_obj.license_type.name,
                'category': license_obj.license_type.category,
            },
            'user': {
                'id': license_obj.user.id,
                'full_name': license_obj.user.get_full_name(),
                'phone': license_obj.user.phone,
                'email': license_obj.user.email,
            },
            'issued_at': license_obj.issued_at,
            'expires_at': license_obj.expires_at,
            'is_active': license_obj.is_active,
            'verification_code': license_obj.verification_code,
            'current_club': license_obj.current_club,
            'special_notes': license_obj.special_notes,
            'created_at': license_obj.created_at,
            'updated_at': license_obj.updated_at,
        }
        
        return Response(data)
        
    except License.DoesNotExist:
        return Response(
            {'error': 'Litsenziya topilmadi'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def license_verification(request, verification_code):
    """Verify license by verification code"""
    try:
        license_obj = get_object_or_404(License, verification_code=verification_code)
        
        # Check if license is active and not expired
        if not license_obj.is_active:
            return Response({
                'valid': False,
                'reason': 'Litsenziya nofaol'
            })
        
        if license_obj.expires_at < timezone.now():
            return Response({
                'valid': False,
                'reason': 'Litsenziya muddati tugagan'
            })
        
        data = {
            'valid': True,
            'license': {
                'license_number': license_obj.license_number,
                'license_type': license_obj.license_type.name,
                'holder_name': license_obj.user.get_full_name(),
                'issued_at': license_obj.issued_at,
                'expires_at': license_obj.expires_at,
                'current_club': license_obj.current_club,
            }
        }
        
        return Response(data)
        
    except License.DoesNotExist:
        return Response({
            'valid': False,
            'reason': 'Litsenziya topilmadi'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_license_pdf(request, license_id):
    """Download license PDF"""
    if not SERVICES_AVAILABLE:
        return Response(
            {'error': 'PDF generatsiya xizmatlari o\'rnatilmagan'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    try:
        license_obj = get_object_or_404(License, id=license_id)

        # Check if user owns the license or is admin
        if not (request.user.is_staff or license_obj.user == request.user):
            return Response(
                {'error': 'Ruxsat berilmagan'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate PDF
        certificate_style = request.GET.get('certificate', 'false').lower() == 'true'
        pdf_file = generate_license_pdf(license_id, certificate_style)

        # Prepare response
        response = Response(
            pdf_file.read(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{pdf_file.name}"'
        response['Content-Length'] = len(pdf_file)

        return response

    except License.DoesNotExist:
        return Response(
            {'error': 'Litsenziya topilmadi'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'PDF generatsiyada xatolik: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_generate_pdfs(request):
    """Generate PDFs for multiple licenses (Admin only)"""
    if not SERVICES_AVAILABLE:
        return Response(
            {'error': 'PDF generatsiya xizmatlari o\'rnatilmagan'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    try:
        license_ids = request.data.get('license_ids', [])

        if not license_ids:
            return Response(
                {'error': 'Litsenziya ID lari berilmagan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate PDFs
        pdf_files = bulk_generate_licenses(license_ids)

        if not pdf_files:
            return Response(
                {'error': 'Hech qanday PDF generatsiya qilinmadi'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Return success response with file count
        return Response({
            'success': True,
            'message': f'{len(pdf_files)} ta PDF muvaffaqiyatli generatsiya qilindi',
            'generated_files': len(pdf_files)
        })

    except Exception as e:
        return Response(
            {'error': f'Bulk PDF generatsiyada xatolik: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def issue_license(request, application_id):
    """Issue license from approved application (Admin only)"""
    try:
        application = get_object_or_404(Application, id=application_id)
        
        # Check if application is approved
        if application.status != 'approved':
            return Response(
                {'error': 'Ariza tasdiqlanmagan'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if license already issued
        if License.objects.filter(application=application).exists():
            return Response(
                {'error': 'Bu ariza uchun litsenziya allaqachon berilgan'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate license number
        license_type = application.license_type
        year = datetime.now().year
        license_count = License.objects.filter(
            license_type=license_type,
            issued_at__year=year
        ).count() + 1
        
        license_number = f"UFF-{year}-{license_type.code}-{license_count:06d}"
        
        # Create license
        license_obj = License.objects.create(
            license_number=license_number,
            license_type=license_type,
            user=application.user,
            application=application,
            issued_at=timezone.now(),
            expires_at=timezone.now() + timezone.timedelta(days=license_type.validity_days),
            current_club=application.data.get('current_club', ''),
            is_active=True,
            verification_code=f"VER{datetime.now().strftime('%Y%m%d%H%M%S')}{license_count:06d}",
        )
        
        # Update application status
        application.status = 'license_issued'
        application.save()
        
        return Response({
            'success': True,
            'license_id': license_obj.id,
            'license_number': license_number,
            'message': 'Litsenziya muvaffaqiyatli berildi'
        })
        
    except Application.DoesNotExist:
        return Response(
            {'error': 'Ariza topilmadi'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Litsenziya berishda xatolik: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def license_statistics(request):
    """Get license statistics (Admin only)"""
    try:
        # Basic statistics
        total_licenses = License.objects.count()
        active_licenses = License.objects.filter(is_active=True).count()
        expired_licenses = License.objects.filter(expires_at__lt=timezone.now()).count()
        
        # By license type
        license_types = LicenseType.objects.all()
        type_stats = []
        for lt in license_types:
            count = License.objects.filter(license_type=lt).count()
            type_stats.append({
                'license_type': lt.name,
                'count': count,
                'category': lt.category,
            })
        
        # By month (last 12 months)
        monthly_stats = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timezone.timedelta(days=i*30)
            month_end = month_start + timezone.timedelta(days=30)
            count = License.objects.filter(
                issued_at__gte=month_start,
                issued_at__lt=month_end
            ).count()
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count,
            })
        
        data = {
            'total_licenses': total_licenses,
            'active_licenses': active_licenses,
            'expired_licenses': expired_licenses,
            'by_type': type_stats,
            'by_month': monthly_stats,
        }
        
        return Response(data)
        
    except Exception as e:
        return Response(
            {'error': f'Statistikani olishda xatolik: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
