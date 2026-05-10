"""
PDF Service for UFF License System
"""
import os
import logging
from datetime import datetime, date
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from weasyprint.text.font_config import FontConfiguration

logger = logging.getLogger(__name__)

class PDFService:
    """PDF generation service for licenses"""
    
    @staticmethod
    def generate_license_pdf(application):
        """Generate PDF for approved license"""
        try:
            # Font configuration for Uzbek text
            font_config = FontConfiguration()
            
            # Context for template
            context = {
                'application': application,
                'user': application.user,
                'license_type': application.license_type,
                'generated_date': datetime.now().strftime('%d.%m.%Y'),
                'valid_from': application.license_validity_start or date.today(),
                'valid_until': application.license_validity_end,
                'site_url': settings.SITE_URL,
            }
            
            # Render HTML template
            html_string = render_to_string('pdfs/license_certificate.html', context)
            
            # Create CSS
            css_string = render_to_string('pdfs/license_styles.css')
            css = CSS(string=css_string, font_config=font_config)
            
            # Generate PDF
            html = HTML(string=html_string, base_url=settings.STATIC_ROOT)
            pdf = html.write_pdf(stylesheets=[css], font_config=font_config)
            
            # Save PDF
            filename = f"license_{application.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = os.path.join(settings.MEDIA_ROOT, 'licenses', filename)
            
            # Create directory if not exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            with open(filepath, 'wb') as f:
                f.write(pdf)
            
            logger.info(f"PDF generated for application {application.id}: {filename}")
            return filepath, filename
            
        except Exception as e:
            logger.error(f"Failed to generate PDF for application {application.id}: {str(e)}")
            return None, None
    
    @staticmethod
    def generate_application_summary_pdf(application):
        """Generate PDF summary of application"""
        try:
            font_config = FontConfiguration()
            
            context = {
                'application': application,
                'user': application.user,
                'license_type': application.license_type,
                'submitted_date': application.submitted_at,
                'status': application.get_status_display(),
                'site_url': settings.SITE_URL,
            }
            
            html_string = render_to_string('pdfs/application_summary.html', context)
            css_string = render_to_string('pdfs/summary_styles.css')
            css = CSS(string=css_string, font_config=font_config)
            
            html = HTML(string=html_string, base_url=settings.STATIC_ROOT)
            pdf = html.write_pdf(stylesheets=[css], font_config=font_config)
            
            filename = f"application_summary_{application.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = os.path.join(settings.MEDIA_ROOT, 'summaries', filename)
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            with open(filepath, 'wb') as f:
                f.write(pdf)
            
            logger.info(f"Application summary PDF generated for {application.id}: {filename}")
            return filepath, filename
            
        except Exception as e:
            logger.error(f"Failed to generate application summary PDF for {application.id}: {str(e)}")
            return None, None
    
    @staticmethod
    def generate_batch_applications_pdf(applications):
        """Generate PDF for multiple applications"""
        try:
            font_config = FontConfiguration()
            
            context = {
                'applications': applications,
                'generated_date': datetime.now().strftime('%d.%m.%Y'),
                'total_count': len(applications),
                'site_url': settings.SITE_URL,
            }
            
            html_string = render_to_string('pdfs/batch_applications.html', context)
            css_string = render_to_string('pdfs/batch_styles.css')
            css = CSS(string=css_string, font_config=font_config)
            
            html = HTML(string=html_string, base_url=settings.STATIC_ROOT)
            pdf = html.write_pdf(stylesheets=[css], font_config=font_config)
            
            filename = f"batch_applications_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = os.path.join(settings.MEDIA_ROOT, 'reports', filename)
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            with open(filepath, 'wb') as f:
                f.write(pdf)
            
            logger.info(f"Batch applications PDF generated: {filename}")
            return filepath, filename
            
        except Exception as e:
            logger.error(f"Failed to generate batch applications PDF: {str(e)}")
            return None, None
