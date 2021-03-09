from rest_framework import serializers
from drf_writable_nested.serializers import WritableNestedModelSerializer

from api.models import Marker, Route, Map


class MarkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marker
        exclude = ['map']


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        exclude = ['map']


class MapSerializer(WritableNestedModelSerializer):
    markers = MarkerSerializer(many=True, allow_null=True)
    routes = RouteSerializer(many=True, allow_null=True)

    class Meta:
        model = Map
        depth = 1
        fields = '__all__'
