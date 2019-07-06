from django.conf.urls import url
from django.urls import path
from . import views
from rest_framework import routers

urlpatterns=[
    path("",views.index,name="index"),
    url(r'^ocn/',views.WorkerListView.as_view()),
]

router=routers.DefaultRouter()
router.register(r"books",views.BookViewSet)
router.register(r"impressions",views.ImpressionViewSet)
router.register(r"devices",views.OcnDeviceViewSet)
