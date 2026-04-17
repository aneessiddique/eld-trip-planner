from django.urls import path
from .views import TripCalculatorAPIView

urlpatterns = [
    path("calculate-trip/", TripCalculatorAPIView.as_view(), name="calculate_trip"),
]
