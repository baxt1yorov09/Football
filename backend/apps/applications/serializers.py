"""
Application Serializers
"""
from rest_framework import serializers
from .models import Application, ApplicationTimeline


class ApplicationTimelineSerializer(serializers.ModelSerializer):
    """Application timeline/history serializer"""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = ApplicationTimeline
        fields = ['id', 'action', 'note', 'created_at', 'created_by_name']


class ApplicationSerializer(serializers.ModelSerializer):
    """Application serializer for regular users"""
    license_type_name = serializers.CharField(source='license_type.name', read_only=True)
    region_name = serializers.CharField(source='region.name_uz', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'license_type', 'license_type_name', 'region', 'region_name',
            'status', 'status_display', 'workplace', 'job_title', 'coaching_years',
            'prev_license_date', 'submitted_at', 'reviewed_at', 'admin_note',
            'rejection_reason', 'documents_count'
        ]
        read_only_fields = ['id', 'submitted_at', 'reviewed_at', 'reviewed_by']
    
    def get_documents_count(self, obj):
        return obj.document_set.count() if hasattr(obj, 'document_set') else 0


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new application"""
    
    class Meta:
        model = Application
        fields = [
            'license_type', 'region', 'workplace', 'job_title',
            'coaching_years', 'prev_license_date'
        ]


class ApplicationAdminSerializer(serializers.ModelSerializer):
    """Application serializer for admin users"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    license_type_name = serializers.CharField(source='license_type.name', read_only=True)
    region_name = serializers.CharField(source='region.name_uz', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    documents_count = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'user_name', 'user_phone', 'user_email',
            'license_type', 'license_type_name', 'region', 'region_name',
            'status', 'status_display', 'workplace', 'job_title', 'coaching_years',
            'prev_license_date', 'license_validity_start', 'license_validity_end',
            'admin_note', 'rejection_reason', 'submitted_at', 'reviewed_at',
            'reviewed_by', 'reviewed_by_name', 'documents_count', 'timeline'
        ]
    
    def get_documents_count(self, obj):
        return obj.document_set.count() if hasattr(obj, 'document_set') else 0
    
    def get_timeline(self, obj):
        timeline = ApplicationTimeline.objects.filter(application=obj).order_by('created_at')
        return ApplicationTimelineSerializer(timeline, many=True).data
