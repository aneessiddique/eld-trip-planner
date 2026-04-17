from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripCalculatorSerializer
from .hos_engine import calculate_trip_plan


class TripCalculatorAPIView(APIView):
    def post(self, request):
        serializer = TripCalculatorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            result = calculate_trip_plan(
                current_location=data["current_location"],
                pickup_location=data["pickup_location"],
                dropoff_location=data["dropoff_location"],
                start_time=data["start_time"],
                current_cycle_used_hours=data["current_cycle_used_hours"],
                pre_trip_minutes=data["pre_trip_minutes"],
                pickup_stop_minutes=data["pickup_stop_minutes"],
                dropoff_stop_minutes=data["dropoff_stop_minutes"],
                fuel_interval_miles=data["fuel_interval_miles"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result)
