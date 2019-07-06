from django.http import HttpResponse
from django.shortcuts import render

from django.shortcuts import redirect, get_object_or_404
from django.views.generic import TemplateView

from polls.models import *

import csv
import os
from polls.exec_scrape import scrape_ocn

import django_filters
from rest_framework import viewsets,filters
from polls.serializer import *

def index(request):
    return HttpResponse("hello world!")

def conv(row,header):
    vals=row.split(",")
    return

class WorkerListView(TemplateView):
    template_name = "worker_list.html"

    def get(self, request, *args, **kwargs):

        context = super(WorkerListView,self).get_context_data(**kwargs)
        # books=Book.objects.all()
        # context["books"]=books

        # Clear DB
        for item in Device.objects.all():
            item.delete()

        scrape_ocn()

        data=[]
        root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path=root+"/supported_devices/mvno/ocn/current/csv/devices_ocn-scraped-edited.csv"
        with open(path) as f:
            reader=csv.reader(f)
            header=next(reader)
            data=[{col:val for col,val in zip(header,row)} for row in reader]

        # Store on DB
        for item in data:
            device=Device(id=item["id"],maker=item["maker"],name=item["name"])
            device.save()

        context["ocn"]=data

        return render(self.request, self.template_name, context)

class BookViewSet(viewsets.ModelViewSet):
    queryset=Book.objects.all()
    serializer_class=BookSerializer

class ImpressionViewSet(viewsets.ModelViewSet):
    queryset=Impression.objects.all()
    serializer_class=ImpressionSerializer

class OcnDeviceViewSet(viewsets.ModelViewSet):
    queryset=Device.objects.all()
    serializer_class=OcnDeviceSerializer
