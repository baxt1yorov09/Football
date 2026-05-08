import os
import io
import qrcode
from datetime import datetime
from django.conf import settings
from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from weasyprint import HTML, CSS
from PIL import Image, ImageDraw, ImageFont
import io

from .models import License, LicenseType


class LicensePDFGenerator:
    """PDF generator for coach licenses with QR codes"""
    
    def __init__(self, license_obj: License):
        self.license = license_obj
        self.license_type = license_obj.license_type
        self.coach = license_obj.user
        
    def generate_qr_code(self, data: str) -> Image.Image:
        """Generate QR code for license verification"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="#0D3B6E", back_color="white")
        
        # Add UFF logo in center
        logo_size = 40
        qr_img = qr_img.resize((300, 300))
        
        # Create a new image with logo in center
        combined = Image.new('RGB', (300, 300), 'white')
        combined.paste(qr_img, (0, 0))
        
        # Draw UFF text in center
        draw = ImageDraw.Draw(combined)
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        text = "UFF"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (300 - text_width) // 2
        y = (300 - text_height) // 2
        
        # White background for text
        draw.rectangle([x-5, y-5, x+text_width+5, y+text_height+5], fill='white')
        draw.text((x, y), text, fill="#F39C12", font=font)
        
        return combined
    
    def generate_verification_url(self) -> str:
        """Generate verification URL for QR code"""
        base_url = getattr(settings, 'FRONTEND_URL', 'https://uff.uz')
        return f"{base_url}/verify/{self.license.verification_code}"
    
    def generate_pdf(self) -> ContentFile:
        """Generate PDF license document"""
        
        # Generate QR code
        verification_url = self.generate_verification_url()
        qr_image = self.generate_qr_code(verification_url)
        
        # Convert QR to base64 for HTML
        qr_buffer = io.BytesIO()
        qr_image.save(qr_buffer, format='PNG')
        qr_base64 = qr_buffer.getvalue()
        
        # Prepare context data
        context = {
            'license': self.license,
            'license_type': self.license_type,
            'coach': self.coach,
            'qr_code': qr_base64,
            'verification_url': verification_url,
            'issued_date': self.license.issued_at.strftime('%d.%m.%Y'),
            'expiry_date': self.license.expires_at.strftime('%d.%m.%Y'),
            'today': datetime.now().strftime('%d.%m.%Y'),
        }
        
        # Render HTML template
        html_content = render_to_string('licenses/license_pdf.html', context)
        
        # Add custom CSS
        css = CSS(string='''
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
            }
            .license-container {
                width: 210mm;
                height: 297mm;
                position: relative;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            .header {
                background: linear-gradient(90deg, #0D3B6E 0%, #1A56A0 100%);
                color: white;
                padding: 20px;
                text-align: center;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #F39C12;
            }
            .license-body {
                padding: 30px;
            }
            .license-title {
                text-align: center;
                font-size: 28px;
                font-weight: bold;
                color: #0D3B6E;
                margin-bottom: 30px;
            }
            .license-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            .info-field {
                margin-bottom: 15px;
            }
            .info-label {
                font-weight: bold;
                color: #1A56A0;
                font-size: 12px;
                text-transform: uppercase;
            }
            .info-value {
                font-size: 16px;
                color: #333;
                margin-top: 5px;
            }
            .qr-section {
                text-align: center;
                margin-top: 40px;
            }
            .qr-code {
                width: 100px;
                height: 100px;
                border: 2px solid #F39C12;
                padding: 5px;
                background: white;
            }
            .footer {
                position: absolute;
                bottom: 20px;
                left: 30px;
                right: 30px;
                text-align: center;
                font-size: 10px;
                color: #666;
            }
            .signature {
                margin-top: 50px;
                text-align: right;
            }
            .signature-line {
                border-bottom: 1px solid #333;
                width: 200px;
                margin-left: auto;
                margin-bottom: 5px;
            }
            .signature-title {
                font-size: 12px;
                color: #666;
            }
        ''')
        
        # Generate PDF
        html = HTML(string=html_content)
        pdf_buffer = io.BytesIO()
        html.write_pdf(pdf_buffer, stylesheets=[css])
        
        # Create ContentFile
        pdf_content = pdf_buffer.getvalue()
        filename = f"license_{self.license.license_number}.pdf"
        
        return ContentFile(pdf_content, name=filename)
    
    def generate_certificate_pdf(self) -> ContentFile:
        """Generate certificate-style license document"""
        
        # Generate QR code
        verification_url = self.generate_verification_url()
        qr_image = self.generate_qr_code(verification_url)
        
        # Convert QR to base64 for HTML
        qr_buffer = io.BytesIO()
        qr_image.save(qr_buffer, format='PNG')
        qr_base64 = qr_buffer.getvalue()
        
        # Prepare context data
        context = {
            'license': self.license,
            'license_type': self.license_type,
            'coach': self.coach,
            'qr_code': qr_base64,
            'verification_url': verification_url,
            'issued_date': self.license.issued_at.strftime('%d.%m.%Y'),
            'expiry_date': self.license.expires_at.strftime('%d.%m.%Y'),
            'today': datetime.now().strftime('%d.%m.%Y'),
            'certificate_number': f"UFF-{self.license.license_number}",
        }
        
        # Render certificate template
        html_content = render_to_string('licenses/certificate_pdf.html', context)
        
        # Certificate CSS
        css = CSS(string='''
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: 'Georgia', serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #fff9e6 0%, #fff5cc 100%);
            }
            .certificate {
                width: 210mm;
                height: 297mm;
                position: relative;
                border: 10px solid #F39C12;
                padding: 40px;
                background: white;
            }
            .certificate-border {
                border: 2px solid #0D3B6E;
                height: 100%;
                position: relative;
                padding: 30px;
            }
            .certificate-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .certificate-logo {
                font-size: 36px;
                font-weight: bold;
                color: #F39C12;
                margin-bottom: 10px;
            }
            .certificate-title {
                font-size: 32px;
                font-weight: bold;
                color: #0D3B6E;
                margin-bottom: 10px;
            }
            .certificate-subtitle {
                font-size: 18px;
                color: #1A56A0;
                font-style: italic;
            }
            .certificate-body {
                text-align: center;
                margin: 40px 0;
            }
            .recipient-name {
                font-size: 28px;
                font-weight: bold;
                color: #0D3B6E;
                margin-bottom: 20px;
            }
            .certificate-text {
                font-size: 16px;
                line-height: 1.6;
                color: #333;
                margin-bottom: 30px;
            }
            .certificate-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 40px;
            }
            .detail-item {
                text-align: left;
            }
            .detail-label {
                font-weight: bold;
                color: #1A56A0;
                font-size: 14px;
            }
            .detail-value {
                font-size: 16px;
                color: #333;
                margin-top: 5px;
            }
            .certificate-footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 60px;
            }
            .qr-section {
                text-align: center;
            }
            .qr-code {
                width: 80px;
                height: 80px;
                border: 2px solid #F39C12;
                padding: 3px;
                background: white;
            }
            .qr-text {
                font-size: 10px;
                color: #666;
                margin-top: 5px;
            }
            .signature-section {
                text-align: right;
            }
            .signature-line {
                border-bottom: 2px solid #333;
                width: 250px;
                margin-bottom: 5px;
            }
            .signature-title {
                font-size: 14px;
                color: #333;
                font-weight: bold;
            }
            .certificate-seal {
                position: absolute;
                bottom: 40px;
                right: 40px;
                width: 100px;
                height: 100px;
                border: 3px solid #F39C12;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: bold;
                color: #F39C12;
            }
        ''')
        
        # Generate PDF
        html = HTML(string=html_content)
        pdf_buffer = io.BytesIO()
        html.write_pdf(pdf_buffer, stylesheets=[css])
        
        # Create ContentFile
        pdf_content = pdf_buffer.getvalue()
        filename = f"certificate_{self.license.license_number}.pdf"
        
        return ContentFile(pdf_content, name=filename)


def generate_license_pdf(license_id: int, certificate_style: bool = False) -> ContentFile:
    """Generate PDF for a specific license"""
    try:
        license_obj = License.objects.get(id=license_id)
        generator = LicensePDFGenerator(license_obj)
        
        if certificate_style:
            return generator.generate_certificate_pdf()
        else:
            return generator.generate_pdf()
            
    except License.DoesNotExist:
        raise ValueError(f"License with ID {license_id} not found")


def bulk_generate_licenses(license_ids: list[int]) -> list[ContentFile]:
    """Generate PDFs for multiple licenses"""
    pdfs = []
    for license_id in license_ids:
        try:
            pdf = generate_license_pdf(license_id)
            pdfs.append(pdf)
        except Exception as e:
            # Log error and continue
            print(f"Error generating PDF for license {license_id}: {e}")
            continue
    
    return pdfs
