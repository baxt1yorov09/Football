from django.urls import path
from .views import LicenseListView
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
