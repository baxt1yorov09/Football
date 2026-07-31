"""
SMS Service Integrations
Supports: Eskiz.uz, Playmobile, and Mock service for development
"""
import os
import random
import requests
from abc import ABC, abstractmethod
from typing import Dict, Optional
from django.conf import settings


class SMSService(ABC):
    """Abstract base class for SMS services"""
    
    @abstractmethod
    def send_sms(self, phone: str, message: str) -> Dict:
        """Send SMS and return result"""
        pass
    
    @abstractmethod
    def send_otp(self, phone: str, code: str) -> Dict:
        """Send OTP SMS"""
        pass


class MockSMSService(SMSService):
    """Mock SMS service for development/testing"""

    def send_sms(self, phone: str, message: str) -> Dict:
        """Mock send SMS - print a highly visible block to console."""
        bar = "=" * 60
        print(f"\n{bar}\n[MOCK SMS]  →  {phone}\n{message}\n{bar}\n", flush=True)
        return {
            'success': True,
            'message_id': f'mock-{random.randint(10000, 99999)}',
            'status': 'sent'
        }

    def send_otp(self, phone: str, code: str) -> Dict:
        """Mock send OTP — show the code in big letters."""
        bar = "=" * 60
        print(
            f"\n{bar}\n[MOCK SMS OTP]  →  {phone}\n"
            f"   Kod / Код: >>>  {code}  <<<\n{bar}\n",
            flush=True,
        )
        return {
            'success': True,
            'message_id': f'mock-{random.randint(10000, 99999)}',
            'status': 'sent'
        }


class EskizSMSService(SMSService):
    """Eskiz.uz SMS service integration"""
    
    BASE_URL = "https://notify.eskiz.uz/api"
    
    def __init__(self):
        self.email = getattr(settings, 'ESKIZ_EMAIL', os.getenv('ESKIZ_EMAIL', ''))
        self.password = getattr(settings, 'ESKIZ_PASSWORD', os.getenv('ESKIZ_PASSWORD', ''))
        self.from_name = getattr(settings, 'ESKIZ_FROM', os.getenv('ESKIZ_FROM', 'UFA'))
        # Pre-issued long-lived JWT (from Eskiz cabinet → API/Settings).
        # If set, login step is skipped.
        self.static_token = getattr(settings, 'ESKIZ_TOKEN', os.getenv('ESKIZ_TOKEN', ''))
        self.token = None

    def _get_token(self) -> Optional[str]:
        """Get auth token from Eskiz (static token preferred)."""
        if self.static_token:
            return self.static_token
        try:
            response = requests.post(
                f"{self.BASE_URL}/auth/login",
                json={'email': self.email, 'password': self.password}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('data', {}).get('token')
        except Exception as e:
            print(f"Eskiz auth error: {e}")
        return None
    
    def send_sms(self, phone: str, message: str) -> Dict:
        """Send SMS via Eskiz.uz"""
        token = self._get_token()
        if not token:
            return {'success': False, 'error': 'Failed to get auth token'}
        
        try:
            # Format phone number
            phone = self._format_phone(phone)
            
            response = requests.post(
                f"{self.BASE_URL}/message/sms/send",
                headers={'Authorization': f'Bearer {token}'},
                json={
                    'mobile_phone': phone,
                    'message': message,
                    'from': self.from_name
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'message_id': data.get('id'),
                    'status': 'sent'
                }
            else:
                return {
                    'success': False,
                    'error': f'Eskiz API error: {response.status_code}',
                    'response': response.text
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def send_otp(self, phone: str, code: str) -> Dict:
        """Send OTP via Eskiz"""
        message = f"UFA Litsenziya tizimi. Tasdiqlash kodi: {code}"
        return self.send_sms(phone, message)
    
    def _format_phone(self, phone: str) -> str:
        """Format phone number for Eskiz (without +)"""
        # Remove + and any non-digit characters
        phone = phone.replace('+', '').replace(' ', '').replace('-', '')
        # Ensure it starts with 998
        if phone.startswith('998'):
            return phone
        elif phone.startswith('9'):
            return '998' + phone
        return phone


class PlaymobileSMSService(SMSService):
    """Playmobile SMS service integration"""
    
    BASE_URL = "https://api.playmobile.uz"
    
    def __init__(self):
        self.username = getattr(settings, 'PLAYMOBILE_USERNAME', os.getenv('PLAYMOBILE_USERNAME', ''))
        self.password = getattr(settings, 'PLAYMOBILE_PASSWORD', os.getenv('PLAYMOBILE_PASSWORD', ''))
        self.originator = getattr(settings, 'PLAYMOBILE_ORIGINATOR', os.getenv('PLAYMOBILE_ORIGINATOR', 'UFA'))
    
    def send_sms(self, phone: str, message: str) -> Dict:
        """Send SMS via Playmobile"""
        try:
            # Format phone
            phone = self._format_phone(phone)
            
            response = requests.post(
                f"{self.BASE_URL}/sms/send",
                auth=(self.username, self.password),
                json={
                    'recipient': phone,
                    'originator': self.originator,
                    'message': message
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'message_id': data.get('message_id'),
                    'status': 'sent'
                }
            else:
                return {
                    'success': False,
                    'error': f'Playmobile API error: {response.status_code}',
                    'response': response.text
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def send_otp(self, phone: str, code: str) -> Dict:
        """Send OTP via Playmobile"""
        message = f"UFA Litsenziya tizimi. Tasdiqlash kodi: {code}"
        return self.send_sms(phone, message)
    
    def _format_phone(self, phone: str) -> str:
        """Format phone number for Playmobile"""
        # Remove + and any non-digit characters
        phone = phone.replace('+', '').replace(' ', '').replace('-', '')
        # Playmobile format
        if phone.startswith('998'):
            return phone
        elif phone.startswith('9'):
            return '998' + phone
        return phone


class SMSServiceFactory:
    """Factory for creating SMS service instances"""
    
    @staticmethod
    def get_service(service_type: str = None) -> SMSService:
        """Get SMS service instance based on type"""
        if service_type is None:
            service_type = getattr(settings, 'SMS_SERVICE', 'mock')
        
        services = {
            'mock': MockSMSService,
            'eskiz': EskizSMSService,
            'playmobile': PlaymobileSMSService,
        }
        
        service_class = services.get(service_type.lower(), MockSMSService)
        return service_class()


# Convenience functions
def send_sms(phone: str, message: str, service_type: str = None) -> Dict:
    """Send SMS using configured service"""
    service = SMSServiceFactory.get_service(service_type)
    return service.send_sms(phone, message)


def send_otp(phone: str, code: str, service_type: str = None) -> Dict:
    """Send OTP using configured service"""
    service = SMSServiceFactory.get_service(service_type)
    return service.send_otp(phone, code)
