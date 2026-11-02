from fastapi import APIRouter, Request
from sqlalchemy import asc, select

from backend.app.client.schema.content import TestimonialDetail
from backend.common.response.response_schema import ResponseModel, response_base
from backend.database.db_postgres import CurrentSession
from backend.models.testimonial import Testimonial

router = APIRouter(tags=['Testimonials'])


@router.get('/testimonials', summary='Published customer reviews')
async def list_testimonials(request: Request, db: CurrentSession) -> ResponseModel:
    stmt = (
        select(Testimonial)
        .where(Testimonial.is_active.is_(True))
        .order_by(asc(Testimonial.sort_order), asc(Testimonial.id))
        .limit(12)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return response_base.success(request=request, data=[TestimonialDetail.model_validate(t) for t in rows])
