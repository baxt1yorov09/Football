"""
Email Service for UFF License System
"""
import os
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

def send_email_otp(email: str, code: str) -> bool:
    """Foydalanuvchi emailiga tasdiqlash kodini yuborish.

    Development'da (console backend) kod terminalga chiqadi.
    Production'da SMTP orqali haqiqiy email yuboriladi.
    """
    subject = "O'zbekiston Murabbiylar ta'limi — Tasdiqlash kodi"
    plain_message = (
        f"Assalomu alaykum!\n\n"
        f"Tizimga kirish uchun tasdiqlash kodingiz: {code}\n\n"
        f"Kod 5 daqiqa ichida amal qiladi.\n"
        f"Agar bu so'rovni siz yubormagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.\n\n"
        f"— O'zbekiston Murabbiylar ta'limi"
    )
    html_message = (
        f"<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;"
        f"border:1px solid #E5E7EB;border-radius:12px\">"
        f"<h2 style=\"color:#0D3B6E;margin:0 0 12px\">Tasdiqlash kodi</h2>"
        f"<p style=\"color:#374151;margin:0 0 16px\">Tizimga kirish uchun quyidagi kodni kiriting:</p>"
        f"<div style=\"font-size:32px;font-weight:700;letter-spacing:8px;color:#F39C12;"
        f"padding:16px;background:#FFF7ED;border-radius:8px;text-align:center;margin-bottom:16px\">{code}</div>"
        f"<p style=\"color:#6B7280;font-size:13px;margin:0\">Kod 5 daqiqa ichida amal qiladi. "
        f"Agar bu so'rovni siz yubormagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>"
        f"</div>"
    )
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"OTP email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {e}")
        return False


class EmailService:
    """Email service for sending notifications"""
    
    @staticmethod
    def send_application_status_notification(application, new_status, old_status=None):
        """Send email notification when application status changes"""
        try:
            user = application.user
            subject = f"Ariza statusi o'zgardi: {application.get_status_display()}"
            
            # Email context
            context = {
                'user': user,
                'application': application,
                'new_status': new_status,
                'old_status': old_status,
                'status_display': application.get_status_display(),
            }
            
            # Render email templates
            html_message = render_to_string('emails/application_status.html', context)
            plain_message = strip_tags(html_message)
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Email sent to {user.email} for application {application.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new users"""
        try:
            subject = "UFF Litsenziya Tizimiga Xush Kelibsiz!"
            
            context = {
                'user': user,
            }
            
            html_message = render_to_string('emails/welcome.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Welcome email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_license_approved_notification(application):
        """Send email when license is approved"""
        try:
            user = application.user
            subject = f"Litsenziya tasdiqlandi: {application.license_type.name}"
            
            context = {
                'user': user,
                'application': application,
            }
            
            html_message = render_to_string('emails/license_approved.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"License approved email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send license approved email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_additional_docs_requested(application, admin_note):
        """Send email when additional documents are requested"""
        try:
            user = application.user
            subject = f"Qo'shimcha hujjatlar talab qilinadi: {application.license_type.name}"
            
            context = {
                'user': user,
                'application': application,
                'admin_note': admin_note,
            }
            
            html_message = render_to_string('emails/additional_docs_requested.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Additional docs requested email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send additional docs email to {user.email}: {str(e)}")
            return False
