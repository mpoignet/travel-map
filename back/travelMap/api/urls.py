from django.urls import path

from api.views import MapMarkerList, MapMarkerDetail, MapRouteList, MapList, MapDetail

urlpatterns = [
    path('maps/', MapList.as_view()),
    path('maps/<int:pk>/', MapDetail.as_view()),
    path('maps/<int:mapId>/markers/', MapMarkerList.as_view()),
    path('maps/<int:mapId>/markers/<int:pk>/', MapMarkerDetail.as_view()),
    path('maps/<int:mapId>/routes/', MapRouteList.as_view()),
]