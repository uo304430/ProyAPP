from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.dependencies import get_db
from app.schemas import ProfileUpsert

router = APIRouter(tags=["profiles"])


@router.get("/users/{user_id}/profile/")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    p = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    return {
        "user_id": user_id,
        "email": user.email,
        "role": user.role,
        "display_name": p.display_name if p else None,
        "avatar_url": p.avatar_url if p else None,
        "squat_pr": p.squat_pr if p else None,
        "bench_pr": p.bench_pr if p else None,
        "deadlift_pr": p.deadlift_pr if p else None,
    }


@router.put("/users/{user_id}/profile/")
def update_profile(user_id: int, data: ProfileUpsert, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    p = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if p:
        p.display_name = data.display_name
        p.avatar_url = data.avatar_url
        p.squat_pr = data.squat_pr
        p.bench_pr = data.bench_pr
        p.deadlift_pr = data.deadlift_pr
    else:
        db.add(models.Profile(
            user_id=user_id,
            display_name=data.display_name,
            avatar_url=data.avatar_url,
            squat_pr=data.squat_pr,
            bench_pr=data.bench_pr,
            deadlift_pr=data.deadlift_pr,
        ))
    db.commit()
    return {"mensaje": "Perfil actualizado"}
