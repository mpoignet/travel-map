from rest_framework import serializers

from api.models import Marker, Route


class MarkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marker
        fields = '__all__'


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'

# class MapSerializer(serializers.ModelSerializer):
#     objects = serializers.PrimaryKeyRelatedField(many=True, queryset=MapObject.objects.all())
#
#     class Meta:
#         model = Map
#         fields = ['id', 'title', 'code']
