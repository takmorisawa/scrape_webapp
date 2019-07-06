from django.db import models

class Book(models.Model):

    name=models.CharField("書籍名",max_length=255)
    publisher=models.CharField("出版社",max_length=255,blank=True)
    page=models.IntegerField("ページ数",blank=True,default=0)

    def __str__(self):
        return self.name

class Impression(models.Model):

    book=models.ForeignKey(Book,verbose_name="書籍",related_name="impressions",on_delete=models.CASCADE)
    comment=models.TextField("コメント",blank=True)

    def __str__(self):
        return self.comment

class Device(models.Model):

    id=models.IntegerField("id",primary_key=True)
    maker=models.CharField("maker",max_length=255)
    name=models.CharField("name",max_length=255)

    def __str__(self):
        return self.name
