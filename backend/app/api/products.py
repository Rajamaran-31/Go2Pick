from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/api/products", tags=["Products"])


def product_to_response(product: dict, shop_name: str = None) -> ProductResponse:
    return ProductResponse(
        id=str(product["_id"]),
        shop_id=str(product["shop_id"]),
        name=product["name"],
        description=product.get("description"),
        image=product.get("image"),
        price=product["price"],
        stock=product.get("stock", 0),
        category=product.get("category"),
        unit=product.get("unit", "piece"),
        is_available=product.get("is_available", True),
        shop_name=shop_name,
        created_at=product.get("created_at", datetime.now(timezone.utc)),
    )


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    shop_id: Optional[str] = Query(None, description="Optional shop ID to filter by"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
):
    db = get_db()
    query = {"is_available": True}
    if shop_id:
        query["shop_id"] = to_object_id(shop_id)

    if category:
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    products = await db["products"].find(query).sort("name", 1).skip(skip).limit(limit).to_list(limit)

    # Fetch shop names in bulk
    shop_ids = list(set([p["shop_id"] for p in products]))
    shops = await db["shops"].find({"_id": {"$in": shop_ids}}).to_list(len(shop_ids))
    shop_map = {str(s["_id"]): s["name"] for s in shops}

    return [product_to_response(p, shop_map.get(str(p["shop_id"]), "Unknown")) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    db = get_db()
    try:
        product = await db["products"].find_one({"_id": to_object_id(product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    shop = await db["shops"].find_one({"_id": product["shop_id"]})
    shop_name = shop["name"] if shop else "Unknown"
    return product_to_response(product, shop_name)


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(require_role(["shopkeeper"])),
):
    db = get_db()
    shop = await db["shops"].find_one({"_id": to_object_id(product_data.shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if str(shop["owner_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your shop")

    product_doc = {
        "shop_id": to_object_id(product_data.shop_id),
        "name": product_data.name,
        "description": product_data.description,
        "image": product_data.image,
        "price": product_data.price,
        "stock": product_data.stock,
        "category": product_data.category,
        "unit": product_data.unit,
        "is_available": product_data.is_available,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db["products"].insert_one(product_doc)
    product_doc["_id"] = result.inserted_id
    return product_to_response(product_doc, shop["name"])


@router.post("/bulk", status_code=201)
async def bulk_create_products(
    products_data: List[ProductCreate],
    current_user: dict = Depends(require_role(["shopkeeper"])),
):
    if not products_data:
        raise HTTPException(status_code=400, detail="No products provided")

    db = get_db()
    shop_id = products_data[0].shop_id
    shop = await db["shops"].find_one({"_id": to_object_id(shop_id)})
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    if str(shop["owner_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your shop")

    documents = []
    for p in products_data:
        if str(p.shop_id) != shop_id:
            raise HTTPException(status_code=400, detail="All products must belong to the same shop")
            
        documents.append({
            "shop_id": to_object_id(p.shop_id),
            "name": p.name,
            "description": p.description,
            "image": p.image,
            "price": p.price,
            "stock": p.stock,
            "category": p.category,
            "unit": p.unit,
            "is_available": p.is_available,
            "created_at": datetime.now(timezone.utc),
        })

    if documents:
        await db["products"].insert_many(documents)
        
    return {"message": f"Successfully imported {len(documents)} products"}

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    update_data: ProductUpdate,
    current_user: dict = Depends(require_role(["shopkeeper"])),
):
    db = get_db()
    product = await db["products"].find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    shop = await db["shops"].find_one({"_id": product["shop_id"]})
    if str(shop["owner_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your product")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db["products"].update_one({"_id": to_object_id(product_id)}, {"$set": update_dict})
    updated = await db["products"].find_one({"_id": to_object_id(product_id)})
    return product_to_response(updated, shop["name"])


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(require_role(["shopkeeper"])),
):
    db = get_db()
    product = await db["products"].find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    shop = await db["shops"].find_one({"_id": product["shop_id"]})
    if str(shop["owner_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your product")

    await db["products"].delete_one({"_id": to_object_id(product_id)})
    return {"message": "Product deleted successfully"}
