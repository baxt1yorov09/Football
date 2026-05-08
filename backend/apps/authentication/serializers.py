"""Authentication serializers for OTP and JWT authentication"""
from rest_framework import serializers
from apps.users.models import User, OTPCode
import random
from datetime import timedelta
from django.utils import timezone


class PhoneSerializer(serializers.Serializer):
    """Serializer for phone number validation"""
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        """Validate Uzbekistan phone number format"""
        # Remove any non-digit characters except +
        cleaned = ''.join(c for c in value if c.isdigit() or c == '+')
        
        # Check if starts with +998
        if not cleaned.startswith('+998'):
            raise serializers.ValidationError("Telefon raqam +998 bilan boshlanishi kerak")
        
        # Check if valid Uzbekistan phone code
        valid_codes = ['90', '91', '93', '94', '95', '97', '98', '99', '88']
        code = cleaned[4:6]
        if code not in valid_codes:
            raise serializers.ValidationError("Noto'g'ri telefon raqam kodi")
        
        # Check total length
        if len(cleaned) != 13:
            raise serializers.ValidationError("Noto'g'ri telefon raqam uzunligi")
        
        return cleaned


class OTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    phone = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=6)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'full_name', 'birth_date', 'gender', 
            'region', 'avatar_url', 'workplace', 'role', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'phone', 'role', 'is_active', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new user after OTP verification"""
    class Meta:
        model = User
        fields = ['full_name', 'birth_date', 'gender', 'region', 'workplace']


class TokenResponseSerializer(serializers.Serializer):
    """Serializer for token response"""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserProfileSerializer()
    is_new_user = serializers.BooleanField()
