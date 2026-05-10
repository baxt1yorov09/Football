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
