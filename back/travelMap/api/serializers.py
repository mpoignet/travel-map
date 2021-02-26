from rest_framework import serializers

from api.models import Marker, Route, Map


class MarkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marker
        fields = '__all__'


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'


class MapSerializer(serializers.ModelSerializer):
    # markers = serializers.PrimaryKeyRelatedField(many=True, queryset=Marker.objects.all())
    # routes = serializers.PrimaryKeyRelatedField(many=True, queryset=Route.objects.all())

    class Meta:
        model = Map
        fields = '__all__'
