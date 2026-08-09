"""
Application Serializers
"""
from rest_framework import serializers
from .models import Application, ApplicationTimeline
from apps.licenses.models import LicenseType
from apps.users.models import Region


class ApplicationTimelineSerializer(serializers.ModelSerializer):
    """Application timeline/history serializer"""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = ApplicationTimeline
        fields = ['id', 'action', 'note', 'created_at', 'created_by_name']


class ApplicationSerializer(serializers.ModelSerializer):
    """Application serializer for regular users"""
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    license_type_name = serializers.CharField(source='license_type.name_uz', read_only=True)
    license_type_code = serializers.CharField(source='license_type.code', read_only=True)
    region_name = serializers.SerializerMethodField()
    residence_region_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    queue_number = serializers.IntegerField(read_only=True)
    queue_total = serializers.IntegerField(read_only=True)
    documents_count = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'user_name', 'user_phone', 'user_email', 'full_name', 'phone',
            'license_type', 'license_type_name', 'license_type_code',
            'region', 'region_name', 'residence_region', 'residence_region_name',
            'status', 'status_display', 'workplace', 'job_title', 'coaching_years',
            'prev_license_date', 'submitted_at', 'reviewed_at', 'reviewed_by_name',
            'queue_number', 'queue_total', 'is_offline',
            'admin_note', 'rejection_reason', 'documents_count', 'documents', 'timeline'
        ]
        read_only_fields = ['id', 'submitted_at', 'reviewed_at', 'reviewed_by']
    
    def get_user_name(self, obj):
        """Get user full name from application full_name first, then user profile"""
        # First check if application has its own full_name
        if obj.full_name:
            return obj.full_name
        
        # Fallback to user profile
        user = obj.user
        if user.full_name:
            return user.full_name
        if user.first_name or user.last_name:
            return f"{user.first_name or ''} {user.last_name or ''}".strip()
        # Ism kiritilmagan - telefon va email alohida maydonlarda
        return 'Ism kiritilmagan'
    
    def get_user_phone(self, obj):
        """Get user phone from application phone first, then user profile"""
        # First check if application has its own phone
        if obj.phone:
            return obj.phone
        
        # Fallback to user profile
        return obj.user.phone
    
    def get_region_name(self, obj):
        """Get region name"""
        if obj.region:
            return obj.region.name_uz or obj.region.name or str(obj.region)
        return None

    def get_residence_region_name(self, obj):
        """Get residence region name"""
        if obj.residence_region:
            return obj.residence_region.name_uz or str(obj.residence_region)
        return None
    
    def get_documents_count(self, obj):
        return obj.document_set.count() if hasattr(obj, 'document_set') else 0
    
    def get_documents(self, obj):
        """Get all documents for this application"""
        documents = []
        if hasattr(obj, 'document_set'):
            for doc in obj.document_set.all():
                documents.append({
                    'id': str(doc.id),
                    'doc_type': doc.doc_type,
                    'doc_type_display': doc.get_doc_type_display(),
                    'file_url': doc.file_url,
                    'file_name': doc.file_name,
                    'file_size': doc.file_size,
                    'mime_type': doc.mime_type,
                    'is_verified': doc.is_verified,
                    'uploaded_at': doc.uploaded_at.isoformat()
                })
        return documents
    
    def get_timeline(self, obj):
        timeline = ApplicationTimeline.objects.filter(application=obj).order_by('created_at')
        return ApplicationTimelineSerializer(timeline, many=True).data


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new application"""
    license_type = serializers.SlugRelatedField(
        slug_field='code',
        queryset=LicenseType.objects.filter(is_active=True)
    )
    region = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(),
        required=False,
        allow_null=True
    )
    residence_region = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(),
        required=False,
        allow_null=True
    )
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Application
        fields = [
            'license_type', 'region', 'residence_region', 'workplace', 'job_title',
            'coaching_years', 'prev_license_date', 'full_name', 'phone'
        ]


class AdminOfflineApplicationCreateSerializer(serializers.Serializer):
    """Admin: daftardan (offline) o'quvchini navbat sanasi bilan qo'shish."""
    full_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    license_type = serializers.SlugRelatedField(
        slug_field='code',
        queryset=LicenseType.objects.filter(is_active=True)
    )
    region = serializers.PrimaryKeyRelatedField(queryset=Region.objects.all())
    residence_region = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(), required=False, allow_null=True
    )
    workplace = serializers.CharField(required=False, allow_blank=True)
    job_title = serializers.CharField(required=False, allow_blank=True)
    coaching_years = serializers.IntegerField(required=False, default=0)
    # Daftarga ro'yxatga olingan sana — navbatdagi o'rinni belgilaydi
    queue_date = serializers.DateField()
    status = serializers.ChoiceField(
        choices=[s[0] for s in Application.STATUS_CHOICES],
        required=False, default='pending'
    )


class ApplicationAdminSerializer(serializers.ModelSerializer):
    """Application serializer for admin users"""
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    license_type_name = serializers.CharField(source='license_type.name_uz', read_only=True)
    license_type_code = serializers.CharField(source='license_type.code', read_only=True)
    region_name = serializers.CharField(source='region.name_uz', read_only=True)
    residence_region_name = serializers.CharField(source='residence_region.name_uz', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    queue_number = serializers.IntegerField(read_only=True)
    queue_total = serializers.IntegerField(read_only=True)
    documents_count = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'user_name', 'user_phone', 'user_email',
            'license_type', 'license_type_name', 'license_type_code',
            'region', 'region_name', 'residence_region', 'residence_region_name',
            'status', 'status_display', 'workplace', 'job_title', 'coaching_years',
            'prev_license_date', 'license_validity_start', 'license_validity_end',
            'queue_number', 'queue_total', 'is_offline', 'queue_priority',
            'admin_note', 'rejection_reason', 'submitted_at', 'reviewed_at',
            'reviewed_by', 'reviewed_by_name', 'documents_count', 'documents', 'timeline'
        ]

    def get_user_name(self, obj):
        """Arizadagi full_name'ni avval ko'rsatadi, keyin user profilidan oladi"""
        if obj.full_name:
            return obj.full_name
        user = obj.user
        if user.full_name:
            return user.full_name
        if user.first_name or user.last_name:
            return f"{user.first_name or ''} {user.last_name or ''}".strip()
        return 'Ism kiritilmagan'

    def get_user_phone(self, obj):
        """Arizadagi phone'ni avval ko'rsatadi, keyin user profilidan oladi"""
        if obj.phone:
            return obj.phone
        return obj.user.phone

    def get_documents_count(self, obj):
        return obj.document_set.count() if hasattr(obj, 'document_set') else 0
    
    def get_documents(self, obj):
        """Get all documents for this application"""
        documents = []
        if hasattr(obj, 'document_set'):
            for doc in obj.document_set.all():
                documents.append({
                    'id': str(doc.id),
                    'doc_type': doc.doc_type,
                    'doc_type_display': doc.get_doc_type_display(),
                    'file_url': doc.file_url,
                    'file_name': doc.file_name,
                    'file_size': doc.file_size,
                    'mime_type': doc.mime_type,
                    'is_verified': doc.is_verified,
                    'uploaded_at': doc.uploaded_at.isoformat()
                })
        return documents
    
    def get_timeline(self, obj):
        timeline = ApplicationTimeline.objects.filter(application=obj).order_by('created_at')
        return ApplicationTimelineSerializer(timeline, many=True).data
