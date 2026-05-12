from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import ConnectionRequestCreate

router = APIRouter(tags=["connections"])


def _enrich_user(conn_id: int, other_id: int, db: Session) -> dict:
    user = db.query(models.User).filter(models.User.id == other_id).first()
    profile = db.query(models.Profile).filter(models.Profile.user_id == other_id).first()
    return {
        "connection_id": conn_id,
        "user_id": other_id,
        "email": user.email if user else "?",
        "display_name": (profile.display_name if profile else None) or (user.email if user else "?"),
        "avatar_url": profile.avatar_url if profile else None,
    }


@router.post("/connections/send/")
def send_request(data: ConnectionRequestCreate, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == data.from_user_id).first():
        raise HTTPException(status_code=404, detail="Usuario origen no encontrado")

    target = db.query(models.User).filter(models.User.email == data.to_email.lower().strip()).first()
    if not target:
        raise HTTPException(status_code=404, detail="No existe ningún usuario con ese email")
    if target.id == data.from_user_id:
        raise HTTPException(status_code=400, detail="No puedes enviarte una solicitud a ti mismo")

    existing = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == data.from_user_id,
        models.CoachAthlete.athlete_id == target.id,
    ).first()
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Ya estáis conectados")
        raise HTTPException(status_code=400, detail="Ya tienes una solicitud pendiente con este usuario")

    db.add(models.CoachAthlete(
        coach_id=data.from_user_id,
        athlete_id=target.id,
        status="pending",
    ))
    db.commit()
    return {"mensaje": "Solicitud enviada"}


@router.get("/users/{user_id}/connections/pending/")
def get_pending(user_id: int, db: Session = Depends(get_db)):
    reqs = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.athlete_id == user_id,
        models.CoachAthlete.status == "pending",
    ).all()
    return {"pending": [_enrich_user(r.id, r.coach_id, db) for r in reqs]}


@router.get("/users/{user_id}/connections/")
def get_connections(user_id: int, db: Session = Depends(get_db)):
    coaches = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.athlete_id == user_id,
        models.CoachAthlete.status == "accepted",
    ).all()
    athletes = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == user_id,
        models.CoachAthlete.status == "accepted",
    ).all()
    return {
        "coaches": [_enrich_user(r.id, r.coach_id, db) for r in coaches],
        "athletes": [_enrich_user(r.id, r.athlete_id, db) for r in athletes],
    }


@router.put("/connections/{conn_id}/accept/")
def accept_connection(conn_id: int, db: Session = Depends(get_db)):
    conn = db.query(models.CoachAthlete).filter(models.CoachAthlete.id == conn_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    conn.status = "accepted"
    db.commit()
    return {"mensaje": "Solicitud aceptada"}


@router.get("/coach/{coach_id}/athletes/")
def get_coach_athletes(coach_id: int, db: Session = Depends(get_db)):
    links = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == coach_id,
        models.CoachAthlete.status == "accepted",
    ).all()
    result = []
    for link in links:
        user = db.query(models.User).filter(models.User.id == link.athlete_id).first()
        if not user:
            continue
        profile = db.query(models.Profile).filter(models.Profile.user_id == link.athlete_id).first()
        blocks = db.query(models.Block).filter(models.Block.athlete_id == link.athlete_id).order_by(models.Block.id.desc()).all()
        block_list = []
        for b in blocks:
            num_weeks = db.query(models.Week).filter(models.Week.block_id == b.id).count()
            block_list.append({"id": b.id, "name": b.name, "objective": b.objective, "num_weeks": num_weeks})
        result.append({
            "athlete_id": link.athlete_id,
            "display_name": (profile.display_name if profile else None) or user.email,
            "email": user.email,
            "avatar_url": profile.avatar_url if profile else None,
            "blocks": block_list,
        })
    return {"athletes": result}


@router.get("/coach/{coach_id}/weekly-overview/")
def get_weekly_overview(coach_id: int, db: Session = Depends(get_db)):
    from datetime import date, timedelta
    links = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == coach_id,
        models.CoachAthlete.status == "accepted",
    ).all()
    today = date.today()
    athletes_data = []
    total = 0
    active_count = 0
    no_active_count = 0

    for link in links:
        user = db.query(models.User).filter(models.User.id == link.athlete_id).first()
        if not user:
            continue
        profile = db.query(models.Profile).filter(models.Profile.user_id == link.athlete_id).first()
        total += 1

        blocks = db.query(models.Block).filter(models.Block.athlete_id == link.athlete_id).all()
        active_block_info = None
        status = "no_active_block"

        for block in blocks:
            if not block.start_date:
                continue
            num_weeks = db.query(models.Week).filter(models.Week.block_id == block.id).count()
            if num_weeks == 0:
                continue
            start = date.fromisoformat(block.start_date)
            end = start + timedelta(days=num_weeks * 7)
            if start <= today <= end:
                current_week_num = (today - start).days // 7 + 1
                current_week_num = max(1, min(current_week_num, num_weeks))
                week = db.query(models.Week).filter(
                    models.Week.block_id == block.id,
                    models.Week.week_number == current_week_num
                ).first()
                week_days = [False] * 7
                if week:
                    for day in db.query(models.Day).filter(models.Day.week_id == week.id).all():
                        if 1 <= day.day_number <= 7:
                            wc = db.query(models.PlannedWorkout).filter(
                                models.PlannedWorkout.day_id == day.id
                            ).count()
                            if wc > 0:
                                week_days[day.day_number - 1] = True
                active_block_info = {
                    "id": block.id, "name": block.name, "objective": block.objective,
                    "current_week": current_week_num, "total_weeks": num_weeks,
                    "week_days": week_days,
                }
                status = "active"
                active_count += 1
                break

        if status != "active":
            no_active_count += 1

        athletes_data.append({
            "athlete_id": link.athlete_id,
            "display_name": (profile.display_name if profile else None) or user.email,
            "avatar_url": profile.avatar_url if profile else None,
            "active_block": active_block_info,
            "status": status,
        })

    return {
        "stats": {"total": total, "active": active_count, "no_active_block": no_active_count},
        "athletes": athletes_data,
    }


@router.delete("/connections/{conn_id}/")
def delete_connection(conn_id: int, db: Session = Depends(get_db)):
    conn = db.query(models.CoachAthlete).filter(models.CoachAthlete.id == conn_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    db.delete(conn)
    db.commit()
    return {"mensaje": "Conexión eliminada"}
