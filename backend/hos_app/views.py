from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .serializers import TripCalculatorSerializer
from .hos_engine import calculate_trip_plan


@method_decorator(csrf_exempt, name="dispatch")
class CalculateTripView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            serializer = TripCalculatorSerializer(data=data)
            if not serializer.is_valid():
                return JsonResponse(serializer.errors, status=400)

            validated = serializer.validated_data
            result = calculate_trip_plan(
                current_location=validated["current_location"],
                pickup_location=validated["pickup_location"],
                dropoff_location=validated["dropoff_location"],
                start_time=validated["start_time"],
                current_cycle_used_hours=validated["current_cycle_used_hours"],
                pre_trip_minutes=validated["pre_trip_minutes"],
                pickup_stop_minutes=validated["pickup_stop_minutes"],
                dropoff_stop_minutes=validated["dropoff_stop_minutes"],
                fuel_interval_miles=validated["fuel_interval_miles"],
            )
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    def options(self, request, *args, **kwargs):
        response = JsonResponse({})
        response["Allow"] = "POST, OPTIONS"
        return response
