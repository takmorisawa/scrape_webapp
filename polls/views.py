from django.http import HttpResponse
from django.shortcuts import render

from django.shortcuts import redirect, get_object_or_404
from django.views.generic import TemplateView

from polls.models import *

def index(request):
    return HttpResponse("hello world!")

class WorkerListView(TemplateView):
    template_name = "worker_list.html"

    def get(self, request, *args, **kwargs):
        context = super(WorkerListView, self).get_context_data(**kwargs)

        books=Book.objects.all()
        context["books"]=books

        return render(self.request, self.template_name, context)
