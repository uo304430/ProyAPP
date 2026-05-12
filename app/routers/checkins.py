from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import WeeklyCheckinCreate

router = APIRouter(tags=["checkins"])


@router.post("/atleta/{athlete_id}/checkin/")
def upsert_checkin(athlete_id: int, data: WeeklyCheckinCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.WeeklyCheckin)
        .filter(
            models.WeeklyCheckin.athlete_id == athlete_id,
            models.WeeklyCheckin.week_start == data.week_start,
        )
        .first()
    )
    if existing:
        existing.fatigue = data.fatigue
        existing.sleep = data.sleep
        existing.motivation = data.motivation
        existing.stress = data.stress
        existing.soreness = data.soreness
        existing.notes = data.notes
    else:
        checkin = models.WeeklyCheckin(
            athlete_id=athlete_id,
            week_start=data.week_start,
            fatigue=data.fatigue,
            sleep=data.sleep,
            motivation=data.motivation,
            stress=data.stress,
            soreness=data.soreness,
            notes=data.notes,
            created_at=datetime.utcnow().isoformat(),
        )
        db.add(checkin)
    db.commit()
    return {"mensaje": "Check-in guardado"}


@router.get("/atleta/{athlete_id}/checkins/")
def get_checkins(athlete_id: int, db: Session = Depends(get_db)):
    checkins = (
        db.query(models.WeeklyCheckin)
        .filter(models.WeeklyCheckin.athlete_id == athlete_id)
        .order_by(models.WeeklyCheckin.week_start.desc())
        .limit(16)
        .all()
    )
    return {
        "athlete_id": athlete_id,
        "checkins": [
            {
                "id": c.id,
                "week_start": c.week_start,
                "fatigue": c.fatigue,
                "sleep": c.sleep,
                "motivation": c.motivation,
                "stress": c.stress,
                "soreness": c.soreness,
                "notes": c.notes,
            }
            for c in checkins
        ],
    }
