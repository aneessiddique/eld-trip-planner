import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .serializers import TripCalculatorSerializer
from .hos_engine import calculate_trip_plan


def cors_response(data, status=200):
    """
    Helper function to add CORS headers to every single response.
    This is required because Vercel serverless bypasses Django middleware.
    """
    if isinstance(data, JsonResponse):
        response = data
    else:
        response = JsonResponse(data, status=status, safe=False)

    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    )
    response["Access-Control-Max-Age"] = "86400"
    return response


@csrf_exempt
def calculate_trip(request):
    # Step 1: Handle preflight OPTIONS request
    # Browser sends OPTIONS before POST to check CORS
    if request.method == "OPTIONS":
        return cors_response({})

    # Step 2: Handle actual POST request
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Your existing trip calculation logic stays here
            # Do NOT change any calculation logic
            # Just make sure the final return uses cors_response

            serializer = TripCalculatorSerializer(data=data)
            if not serializer.is_valid():
                return cors_response(serializer.errors, status=400)

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
            return cors_response(result)

        except json.JSONDecodeError:
            return cors_response(
                {"error": "Invalid JSON in request body"},
                status=400
            )
        except Exception as e:
            return cors_response(
                {"error": str(e)},
                status=500
            )

    # Step 3: Reject any other methods
    return cors_response(
        {"error": "Method not allowed"},
        status=405
    )
