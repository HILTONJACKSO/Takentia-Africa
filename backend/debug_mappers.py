import sys
import os
sys.path.insert(0, os.path.abspath("."))

try:
    from app.core.database import Base
    import app.models
    from sqlalchemy import inspect

    print("Checking mappers...")
    for mapper in Base.registry.mappers:
        print(f"Mapper: {mapper.class_.__name__}")
        for rel in mapper.relationships:
            print(f"  Relationship: {rel.key} -> {rel.target.name if hasattr(rel.target, 'name') else rel.target}")
except Exception as e:
    print(f"Introspection Error: {e}")
    import traceback
    traceback.print_exc()
