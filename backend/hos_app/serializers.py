from rest_framework import serializers


class TripCalculatorSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    start_time = serializers.DateTimeField()
    current_cycle_used_hours = serializers.FloatField(min_value=0.0, default=0.0)
    pre_trip_minutes = serializers.IntegerField(default=30)
    pickup_stop_minutes = serializers.IntegerField(default=60)
    dropoff_stop_minutes = serializers.IntegerField(default=60)
    fuel_interval_miles = serializers.IntegerField(default=1000)


class HosLogEntrySerializer(serializers.Serializer):
    status = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    duration_hours = serializers.FloatField()
    description = serializers.CharField()
    miles = serializers.FloatField()
    remarks = serializers.CharField(allow_blank=True)
