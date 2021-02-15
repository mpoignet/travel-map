from django.urls import path

from api.views import MarkerList, MarkerDetail

urlpatterns = [
    path('markers/', MarkerList.as_view()),
    path('markers/<int:pk>/', MarkerDetail.as_view()),
]