from django.db import models


class TripPlan(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    origin = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    total_distance_miles = models.PositiveIntegerField()
    start_time = models.DateTimeField()

    def __str__(self):
        return f"{self.origin} → {self.destination} ({self.total_distance_miles} mi)"
