def get_default_unit(category: str, name: str) -> str:
    """
    Get sensible default unit based on category and name:
    - Grocery items -> kg
    - Milk -> L
    - Vegetables/Fruits -> kg
    - Electronics -> pc
    - Furniture -> pc
    - Appliances -> pc
    - Default fallback -> pc
    """
    category_lower = (category or "").lower()
    name_lower = (name or "").lower()
    
    if "milk" in name_lower or "milk" in category_lower:
        return "L"
    elif "grocery" in category_lower:
        return "kg"
    elif "vegetable" in category_lower or "fruit" in category_lower or "fruits" in category_lower:
        return "kg"
    elif "electronics" in category_lower:
        return "pc"
    elif "furniture" in category_lower:
        return "pc"
    elif "appliances" in category_lower:
        return "pc"
    return "pc"
