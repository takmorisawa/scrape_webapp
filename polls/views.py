from django.http import HttpResponse
from django.shortcuts import render

from django.shortcuts import redirect, get_object_or_404
from django.views.generic import TemplateView

from polls.models import *

import csv
import os
from polls.exec_scrape import scrape_ocn

def index(request):
    return HttpResponse("hello world!")

def conv(row,header):
    vals=row.split(",")
    return

class WorkerListView(TemplateView):
    template_name = "worker_list.html"

    def get(self, request, *args, **kwargs):
        context = super(WorkerListView, self).get_context_data(**kwargs)

        books=Book.objects.all()
        context["books"]=books

        scrape_ocn()

        data=[]
        root=os.path.dirname(os.path.abspath(__file__))
        root=os.path.dirname(root)
        path=root+"/supported_devices/mvno/ocn/current/csv/devices_ocn-scraped-edited.csv"
        with open(path) as f:
            reader=csv.reader(f)
            header=next(reader)
            data=[{col:val for col,val in zip(header,row)} for row in reader]


        context["ocn"]=data

        return render(self.request, self.template_name, context)
