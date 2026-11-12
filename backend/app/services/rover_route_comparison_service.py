from math import isclose

from app.schemas.rover_models import (
    RoverEnergyResponse,
    RoverMissionRequest,
    RoverRouteCandidate,
    RoverRouteComparisonResponse,
)
from app.services.rover_energy_service import rover_energy_service
from app.services.routing_service import get_routing_service


class RoverRouteComparisonService:

    STRATEGIES = (
        "shortest",
        "safest",
        "energy_efficient",
        "balanced",
    )

    WEIGHTS = {
        "distance": 0.40,
        "energy": 0.40,
        "slope": 0.20,
    }

    # Differences within these limits are treated as
    # practically equivalent for route selection.
    DISTANCE_TOLERANCE_M = 1.0
    ENERGY_TOLERANCE_WH = 1.0
    SLOPE_TOLERANCE_DEG = 0.1

    # Deterministic preference when candidate scores are equal.
    TIE_BREAK_PRIORITY = {
        "shortest": 0,
        "safest": 1,
        "energy_efficient": 2,
        "balanced": 3,
    }

    def __init__(self):
        self.routing_service = get_routing_service()
        self.energy_service = rover_energy_service

    # --------------------------------------------------
    # PYDANTIC MODEL TO DICTIONARY
    # --------------------------------------------------

    @staticmethod
    def _rover_specs_to_dict(rover_specs):

        if isinstance(rover_specs, dict):
            return rover_specs

        if hasattr(rover_specs, "model_dump"):
            return rover_specs.model_dump()

        if hasattr(rover_specs, "dict"):
            return rover_specs.dict()

        raise ValueError(
            "Rover specifications must be a dictionary or Pydantic model."
        )

    # --------------------------------------------------
    # ENERGY RESPONSE NORMALIZATION
    # --------------------------------------------------

    @staticmethod
    def _normalize_energy_response(result):

        if isinstance(result, RoverEnergyResponse):
            return result

        if isinstance(result, dict):

            if hasattr(RoverEnergyResponse, "model_validate"):
                return RoverEnergyResponse.model_validate(result)

            return RoverEnergyResponse.parse_obj(result)

        if hasattr(result, "model_dump"):

            data = result.model_dump(by_alias=True)

            if hasattr(RoverEnergyResponse, "model_validate"):
                return RoverEnergyResponse.model_validate(data)

            return RoverEnergyResponse.parse_obj(data)

        if hasattr(result, "dict"):

            data = result.dict(by_alias=True)

            if hasattr(RoverEnergyResponse, "model_validate"):
                return RoverEnergyResponse.model_validate(data)

            return RoverEnergyResponse.parse_obj(data)

        raise ValueError(
            "Energy service returned an unsupported response."
        )

    # --------------------------------------------------
    # COMPARISON METRICS
    # --------------------------------------------------

    def _get_candidate_metrics(self, candidate):
        energy = candidate["energy"]
        return {
            "distance": energy.round_trip.total_distance_m,
            "energy": energy.round_trip.total_energy_wh,
            "slope": candidate["maximum_segment_grade_deg"],
        }

    # --------------------------------------------------
    # TOLERANCE-AWARE NORMALIZATION
    # --------------------------------------------------

    @staticmethod
    def _within_tolerance(minimum, maximum, tolerance):
        difference = maximum - minimum
        return difference <= tolerance or isclose(difference, tolerance, rel_tol=0, abs_tol=1e-9)

    def _normalize_values(self, values, tolerance):

        minimum = min(values)
        maximum = max(values)

        # Do not exaggerate insignificant differences.
        if self._within_tolerance(minimum, maximum, tolerance):
            return [0.0 for _ in values]

        return [
            (value - minimum) / (maximum - minimum)
            for value in values
        ]

    # --------------------------------------------------
    # CHECK WHETHER CANDIDATES ARE EFFECTIVELY EQUAL
    # --------------------------------------------------

    def _candidates_effectively_equivalent(self, candidates):

        metrics = [self._get_candidate_metrics(candidate) for candidate in candidates]
        tolerances = {
            "distance": self.DISTANCE_TOLERANCE_M,
            "energy": self.ENERGY_TOLERANCE_WH,
            "slope": self.SLOPE_TOLERANCE_DEG,
        }
        for metric, tolerance in tolerances.items():
            values = [item[metric] for item in metrics]
            if not self._within_tolerance(min(values), max(values), tolerance):
                return False
        return True

    # --------------------------------------------------
    # CANDIDATE GENERATION
    # --------------------------------------------------

    def _generate_candidate(self, request, strategy):

        candidate = {
            "route_id": f"route_{strategy}",
            "strategy": strategy,
            "status": "failed",
            "algorithm": request.algorithm,
            "outbound_route_pixels": [],
            "return_route_pixels": [],
            "outbound_nodes_explored": 0,
            "return_nodes_explored": 0,
            "total_nodes_explored": 0,
            "outbound_distance_m": None,
            "return_distance_m": None,
            "energy": None,
            "feasible": False,
            "selection_score": None,
            "maximum_segment_grade_deg": None,
            "selected": False,
            "reason": None,
        }

        try:

            rover_specs = self._rover_specs_to_dict(
                request.rover
            )

            # OUTBOUND ROUTE

            outbound = self.routing_service.plan_route_full(
                start_pixel=request.start_pixel,
                destination_pixel=request.destination_pixel,
                algorithm=request.algorithm,
                route_mode=strategy,
                max_slope=float(
                    request.rover.max_slope_deg
                ),
            )

            # RETURN ROUTE

            return_route = self.routing_service.plan_route_full(
                start_pixel=request.destination_pixel,
                destination_pixel=request.start_pixel,
                algorithm=request.algorithm,
                route_mode=strategy,
                max_slope=float(
                    request.rover.max_slope_deg
                ),
            )

            # ROUND-TRIP ENERGY

            energy_result = self.energy_service.calculate_mission(
                outbound_segments=outbound["segments"],
                return_segments=return_route["segments"],
                rover_specs=rover_specs,
            )

            energy = self._normalize_energy_response(
                energy_result
            )

            feasible = bool(energy.mission_feasible)

            candidate.update({
                "status": "success",
                "outbound_route_pixels": outbound["route_pixels"],
                "return_route_pixels": return_route["route_pixels"],
                "outbound_nodes_explored": outbound["nodes_explored"],
                "return_nodes_explored": return_route["nodes_explored"],
                "total_nodes_explored": (
                    outbound["nodes_explored"]
                    + return_route["nodes_explored"]
                ),
                "outbound_distance_m": outbound["distance_m"],
                "return_distance_m": return_route["distance_m"],
                "energy": energy,
                "maximum_segment_grade_deg": max(
                    energy.outbound.maximum_slope_deg,
                    energy.return_leg.maximum_slope_deg,
                ),
                "feasible": feasible,
                "reason": energy.recommendation_reason,
            })

            if not feasible:
                candidate["reason"] = (
                    energy.recommendation_reason
                    or "Candidate failed rover energy or safety checks."
                )

        except Exception as exc:

            candidate["reason"] = (
                str(exc)
            )

        return candidate

    # --------------------------------------------------
    # CANDIDATE SELECTION
    # --------------------------------------------------

    def _select_best_candidate(self, candidates):

        feasible_candidates = [
            candidate
            for candidate in candidates
            if candidate["status"] == "success"
            and candidate["feasible"]
        ]

        if not feasible_candidates:
            return None

        metrics = [
            self._get_candidate_metrics(candidate)
            for candidate in feasible_candidates
        ]

        distances = [
            item["distance"]
            for item in metrics
        ]

        energies = [
            item["energy"]
            for item in metrics
        ]

        slopes = [
            item["slope"]
            for item in metrics
        ]

        normalized_distances = self._normalize_values(
            distances,
            self.DISTANCE_TOLERANCE_M,
        )

        normalized_energies = self._normalize_values(
            energies,
            self.ENERGY_TOLERANCE_WH,
        )

        normalized_slopes = self._normalize_values(
            slopes,
            self.SLOPE_TOLERANCE_DEG,
        )

        for index, candidate in enumerate(feasible_candidates):

            score = (
                self.WEIGHTS["distance"]
                * normalized_distances[index]
                + self.WEIGHTS["energy"]
                * normalized_energies[index]
                + self.WEIGHTS["slope"]
                * normalized_slopes[index]
            )

            candidate["selection_score"] = round(
                float(score),
                6,
            )

        selected = min(
            feasible_candidates,
            key=lambda candidate: (
                candidate["selection_score"],
                self.TIE_BREAK_PRIORITY.get(
                    candidate["strategy"],
                    99,
                ),
            ),
        )

        selected["selected"] = True

        return selected

    # --------------------------------------------------
    # RECOMMENDATION EXPLANATION
    # --------------------------------------------------

    def _build_recommendation_reason(self, selected, candidates):

        if selected is None:
            return (
                "No candidate passed the modeled round-trip rover constraints."
            )

        selected_strategy = selected["strategy"].replace("_", " ")
        metrics = self._get_candidate_metrics(selected)
        selected_distance = metrics["distance"]
        selected_energy = metrics["energy"]
        selected_slope = metrics["slope"]
        selected_score = selected["selection_score"]

        feasible_candidates = [
            candidate
            for candidate in candidates
            if candidate["status"] == "success"
            and candidate["feasible"]
        ]

        # Avoid claiming a meaningful advantage when all
        # candidates are practically equivalent.
        if len(feasible_candidates) == 1:
            explanation = f"The {selected_strategy} route was the only feasible candidate."
        elif self._candidates_effectively_equivalent(
            feasible_candidates
        ):

            explanation = (
                f"The backend selected the {selected_strategy} "
                f"route. All feasible candidates were effectively "
                f"equivalent within the configured comparison "
                f"tolerances: {self.DISTANCE_TOLERANCE_M:.1f} m "
                f"for distance, {self.ENERGY_TOLERANCE_WH:.1f} Wh "
                f"for energy, and "
                f"{self.SLOPE_TOLERANCE_DEG:.1f} degrees for "
                f"peak segment grade. The fixed strategy order broke the tie."
            )

        else:
            explanation = (
                f"The {selected_strategy} route had the best weighted selection score "
                f"({selected_score:.4f}) among feasible candidates. "
                "Weights are 40% distance, 40% energy, and 20% peak segment grade."
            )
            tied = [
                candidate["strategy"].replace("_", " ")
                for candidate in feasible_candidates
                if candidate is not selected and candidate["selection_score"] == selected_score
            ]
            if tied:
                explanation += (
                    f" Equal score with {', '.join(tied)}. The fixed strategy order broke that tie."
                )

        explanation += (
            f" Round trip: {selected_distance:.2f} m, {selected_energy:.3f} Wh, "
            f"and {selected_slope:.3f}° peak segment grade."
        )

        shortest = next(
            (
                candidate
                for candidate in candidates
                if candidate["strategy"] == "shortest"
                and candidate["status"] == "success"
            ),
            None,
        )

        if shortest is not None and not shortest["feasible"]:

            explanation += (
                " The shortest candidate was not feasible. "
                "Reason: "
                f"{shortest['reason']}."
            )

        return explanation

    # --------------------------------------------------
    # MAIN COMPARISON
    # --------------------------------------------------

    def compare_routes(
        self,
        request: RoverMissionRequest,
    ) -> RoverRouteComparisonResponse:

        candidates = []

        for strategy in self.STRATEGIES:

            candidate = self._generate_candidate(
                request=request,
                strategy=strategy,
            )

            candidates.append(candidate)

        successful_candidates = sum(
            candidate["status"] == "success"
            for candidate in candidates
        )

        feasible_candidates = sum(
            candidate["feasible"]
            for candidate in candidates
        )

        selected = self._select_best_candidate(candidates)
        failure_reasons = dict.fromkeys(
            candidate["reason"] for candidate in candidates
            if candidate["status"] == "failed" and candidate["reason"]
        )

        if selected is None:

            recommendation = "NO-GO"
            selected_route_id = None
            recommended_strategy = "none"

            status = (
                "success"
                if successful_candidates > 0
                else "failed"
            )

        else:

            recommendation = "GO"
            selected_route_id = selected["route_id"]
            recommended_strategy = selected["strategy"]
            status = "success"

        recommendation_reason = (
            self._build_recommendation_reason(
                selected,
                candidates,
            )
        )

        response_candidates = [
            RoverRouteCandidate(**candidate)
            for candidate in candidates
        ]

        return RoverRouteComparisonResponse(
            status=status,
            recommendation=recommendation,
            selected_route_id=selected_route_id,
            recommended_strategy=recommended_strategy,
            recommendation_reason=recommendation_reason,
            max_allowed_slope_deg=float(
                request.rover.max_slope_deg
            ),
            candidates=response_candidates,
            successful_candidates=successful_candidates,
            feasible_candidates=feasible_candidates,
            message=(
                "Route comparison completed."
                if selected is not None
                else " ".join(failure_reasons) or "No feasible route was found."
            ),
        )


# --------------------------------------------------
# SERVICE INSTANCE
# --------------------------------------------------

rover_route_comparison_service = RoverRouteComparisonService()
