from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import CompetitionCreate, CompetitionUpdate

router = APIRouter(tags=["competitions"])


@router.post("/atleta/{athlete_id}/competitions/")
def create_competition(athlete_id: int, data: CompetitionCreate, db: Session = Depends(get_db)):
    comp = models.Competition(
        athlete_id=athlete_id,
        name=data.name,
        date=data.date,
        weight_class=data.weight_class,
        federation=data.federation,
        squat_best=data.squat_best,
        bench_best=data.bench_best,
        deadlift_best=data.deadlift_best,
        total=data.total,
        notes=data.notes,
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return {"id": comp.id}


@router.get("/atleta/{athlete_id}/competitions/")
def get_competitions(athlete_id: int, db: Session = Depends(get_db)):
    comps = (
        db.query(models.Competition)
        .filter(models.Competition.athlete_id == athlete_id)
        .order_by(models.Competition.date.desc())
        .all()
    )
    return {
        "athlete_id": athlete_id,
        "competitions": [
            {
                "id": c.id,
                "name": c.name,
                "date": c.date,
                "weight_class": c.weight_class,
                "federation": c.federation,
                "squat_best": c.squat_best,
                "bench_best": c.bench_best,
                "deadlift_best": c.deadlift_best,
                "total": c.total,
                "notes": c.notes,
            }
            for c in comps
        ],
    }


@router.put("/competitions/{comp_id}/")
def update_competition(comp_id: int, data: CompetitionUpdate, db: Session = Depends(get_db)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="No encontrado")
    for field, val in data.dict(exclude_unset=True).items():
        setattr(comp, field, val)
    db.commit()
    return {"mensaje": "Actualizado"}


@router.delete("/competitions/{comp_id}/")
def delete_competition(comp_id: int, db: Session = Depends(get_db)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(comp)
    db.commit()
    return {"mensaje": "Eliminado"}
