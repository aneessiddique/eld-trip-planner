from django.test import TestCase
from datetime import datetime, timezone
from .hos_engine import generate_hos_log


class HosEngineTests(TestCase):
    def test_generate_hos_log_minimal_route(self):
        start = datetime(2026, 4, 18, 8, 0, tzinfo=timezone.utc)
        entries = generate_hos_log(
            origin="Chicago, IL",
            destination="Indianapolis, IN",
            total_distance_miles=200,
            start_time=start,
        )
        self.assertGreaterEqual(len(entries), 4)
        self.assertEqual(entries[0].status, "OFF_DUTY")
        self.assertEqual(entries[1].status, "ON_DUTY")
        self.assertEqual(entries[-1].status, "OFF_DUTY")
