from rest_framework import generics

from api.models import Marker, Route
from api.serializers import MarkerSerializer, RouteSerializer


class MarkerList(generics.ListCreateAPIView):
    queryset = Marker.objects.all()
    serializer_class = MarkerSerializer

    # def perform_create(self, serializer):
    #     serializer.save(owner=self.request.user)


class MarkerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Marker.objects.all()
    serializer_class = MarkerSerializer


class RouteList(generics.ListCreateAPIView):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
