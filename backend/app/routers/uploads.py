from fastapi import APIRouter, UploadFile, File, Depends
from app.auth import get_current_user
from app.upload import upload_image, upload_document

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    url = await upload_image(file, "products")
    return {"success": True, "url": url}


@router.post("/image")
async def upload_general_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    url = await upload_image(file, "general")
    return {"imageUrl": url, "success": True, "url": url}


@router.post("/shop-image")
async def upload_shop_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    url = await upload_image(file, "shops")
    return {"success": True, "url": url}


@router.post("/business-proof")
async def upload_business_proof(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    url = await upload_document(file, "business_proofs")
    return {"success": True, "url": url}


@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    url = await upload_image(file, "profiles")
    return {"success": True, "url": url}


@router.post("/support-attachment")
async def upload_support_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    url = await upload_document(file, "support_attachments")
    return {"success": True, "url": url}
