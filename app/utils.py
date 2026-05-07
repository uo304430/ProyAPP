def calc_e1rm(weight: float, reps: int, rpe: float) -> float:
    if not weight or weight <= 0:
        return 0.0
    reps_eq = reps + (10 - rpe)
    return round(weight / (1.0278 - 0.0278 * reps_eq), 2)
