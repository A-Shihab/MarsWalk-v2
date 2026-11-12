from copy import deepcopy

from app.schemas.rover_models import RoverMissionRequest
from app.services.rover_route_comparison_service import rover_route_comparison_service


def comparison_request():
    return RoverMissionRequest(
        start_pixel={"x": 1946, "y": 2051},
        destination_pixel={"x": 1962, "y": 2057},
        algorithm="astar",
        rover={
            "battery_capacity_wh": 7200,
            "average_speed_mps": 0.05,
            "flat_power_w": 100,
            "rover_mass_kg": 200,
        },
    )


def test_above_tolerance_segment_grade_changes_selection():
    result = rover_route_comparison_service.compare_routes(comparison_request())
    candidates = {candidate.strategy: candidate for candidate in result.candidates}
    shortest = candidates["shortest"]
    safest = candidates["safest"]

    assert result.feasible_candidates == 4
    assert shortest.maximum_segment_grade_deg == 3.773
    assert safest.maximum_segment_grade_deg == 3.295
    assert shortest.energy.round_trip.total_distance_m == safest.energy.round_trip.total_distance_m
    assert shortest.energy.round_trip.total_energy_wh == safest.energy.round_trip.total_energy_wh
    assert shortest.selection_score == 0.2
    assert safest.selection_score == 0
    assert result.selected_route_id == safest.route_id
    assert "effectively equivalent" not in result.recommendation_reason


def test_segment_grade_within_tolerance_uses_fixed_priority():
    service = rover_route_comparison_service
    safest = service._generate_candidate(comparison_request(), "safest")
    shortest = deepcopy(safest)
    shortest["strategy"] = "shortest"
    shortest["maximum_segment_grade_deg"] = safest["maximum_segment_grade_deg"] + 0.05
    candidates = [safest, shortest]

    selected = service._select_best_candidate(candidates)

    assert selected is shortest
    assert all(candidate["selection_score"] == 0 for candidate in candidates)
    reason = service._build_recommendation_reason(selected, candidates)
    assert "effectively equivalent" in reason
    assert "0.1 degrees for peak segment grade" in reason
