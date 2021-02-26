from rest_framework import generics

from api.models import Marker, Route, Map
from api.serializers import MarkerSerializer, RouteSerializer, MapSerializer


class MapList(generics.ListCreateAPIView):
    queryset = Map.objects.all()
    serializer_class = MapSerializer


class MapDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Map.objects.all()
    serializer_class = MapSerializer


class MapMarkerList(generics.ListCreateAPIView):
    serializer_class = MarkerSerializer

    def get_queryset(self):
        map_id = self.kwargs['mapId']
        return Marker.objects.filter(map_id=map_id)

    # def perform_create(self, serializer):
    #     serializer.save(owner=self.request.user)


class MapMarkerDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MarkerSerializer

    def get_queryset(self):
        map_id = self.kwargs['mapId']
        return Marker.objects.filter(map_id=map_id)


class MapRouteList(generics.ListCreateAPIView):
    serializer_class = RouteSerializer

    def get_queryset(self):
        map_id = self.kwargs['mapId']
        return Route.objects.filter(map_id=map_id)
