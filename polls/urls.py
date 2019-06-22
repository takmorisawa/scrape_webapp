from django.conf.urls import url
from django.urls import path
from . import views

import polls.views as manager_view

urlpatterns=[
    path("",views.index,name="index"),
    url(r'^worker_list/', manager_view.WorkerListView.as_view())
]
