from django.db import models


class Map(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['created']


class MapObject(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=100, blank=True, default='')

    map = models.ForeignKey(Map, on_delete=models.CASCADE)

    class Meta:
        ordering = ['created']
        abstract = True


class Marker(MapObject):
    lat = models.FloatField()
    lng = models.FloatField()


class Route(MapObject):
    geoJson = models.JSONField()
