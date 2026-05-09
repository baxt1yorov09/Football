from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileView(APIView):
    """Get current user profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'phone': user.phone,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'region': user.region.name_uz if user.region else None,
            'is_active': user.is_active,
            'created_at': user.created_at,
        }
        return Response(data)
