def to_object_id(id_str) -> str:
    """
    Compatibility shim: returns plain string ID to support Firestore document IDs,
    minimizing diffs in router endpoints.
    """
    return str(id_str)
