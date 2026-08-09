from django.urls import path
from .views import (
    LicenseListView, LicenseTypeListView, license_verification,
    PublicLicenseListView, SelfLicenseCreateView, download_license_file,
    delete_self_license,
)
from .admin_views import (
    AdminLicenseStatsView,
    AdminLicenseListView,
    AdminLicenseDetailView,
    AdminLicenseUpdateView,
    AdminLicenseRevokeView,
    AdminLicenseCreateView,
    AdminLicenseBulkView,
    AdminLicenseExportView,
)

urlpatterns = [
    path('', LicenseListView.as_view(), name='license-list'),

    # Faol turlar ro'yxati (form'lar uchun)
    path('types/', LicenseTypeListView.as_view(), name='license-types'),
    path('types',  LicenseTypeListView.as_view()),

    # Foydalanuvchi o'zining mavjud litsenziyasini kiritishi
    path('self/', SelfLicenseCreateView.as_view(), name='license-self-create'),
    path('self',  SelfLicenseCreateView.as_view()),

    # Public list (barcha murabbiylar)
    path('public/', PublicLicenseListView.as_view(), name='license-public'),
    path('public',  PublicLicenseListView.as_view()),

    # Public verification (QR kod orqali)
    path('verify/<uuid:license_id>/', license_verification, name='license-verify'),
    path('verify/<uuid:license_id>',  license_verification),

    # Litsenziya PDF/rasmini yuklab olish (foydalanuvchi o'ziga tegishli yoki admin)
    path('<uuid:license_id>/pdf/', download_license_file, name='license-download'),
    path('<uuid:license_id>/pdf',  download_license_file),

    # Foydalanuvchi o'zi qo'shgan litsenziyani o'chirish
    path('self/<uuid:license_id>/', delete_self_license, name='license-self-delete'),
    path('self/<uuid:license_id>',  delete_self_license),

    # ── Admin endpoints ────────────────────────
    # Trailing-slash bilan va u'siz ikkala variant (Next.js rewrite uchun)
    path('admin/stats/',  AdminLicenseStatsView.as_view(),  name='admin-license-stats'),
    path('admin/stats',   AdminLicenseStatsView.as_view()),

    path('admin/list/',   AdminLicenseListView.as_view(),   name='admin-license-list'),
    path('admin/list',    AdminLicenseListView.as_view()),

    path('admin/create/', AdminLicenseCreateView.as_view(), name='admin-license-create'),
    path('admin/create',  AdminLicenseCreateView.as_view()),

    path('admin/bulk/',   AdminLicenseBulkView.as_view(),   name='admin-license-bulk'),
    path('admin/bulk',    AdminLicenseBulkView.as_view()),

    path('admin/export/', AdminLicenseExportView.as_view(), name='admin-license-export'),
    path('admin/export',  AdminLicenseExportView.as_view()),

    path('admin/<uuid:pk>/',          AdminLicenseDetailView.as_view(), name='admin-license-detail'),
    path('admin/<uuid:pk>',           AdminLicenseDetailView.as_view()),
    path('admin/<uuid:pk>/update/',   AdminLicenseUpdateView.as_view(), name='admin-license-update'),
    path('admin/<uuid:pk>/update',    AdminLicenseUpdateView.as_view()),
    path('admin/<uuid:pk>/revoke/',   AdminLicenseRevokeView.as_view(), name='admin-license-revoke'),
    path('admin/<uuid:pk>/revoke',    AdminLicenseRevokeView.as_view()),
]
