from rest_framework import serializers
from polls.models import *

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model=Book
        fields=("name","publisher","page")

class ImpressionSerializer(serializers.ModelSerializer):
    class Meta:
        model=Impression
        fields=("book","comment")

class OcnDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model=Device
        fields=("id","maker","name")
