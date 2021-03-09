from django.db import models


class Map(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['created']


class MapObject(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['created']
        abstract = True


class Marker(MapObject):
    map = models.ForeignKey(Map, related_name='markers', on_delete=models.CASCADE)
    lat = models.FloatField()
    lng = models.FloatField()


class Route(MapObject):
    map = models.ForeignKey(Map, related_name='routes', on_delete=models.CASCADE)
    geoJson = models.JSONField()
