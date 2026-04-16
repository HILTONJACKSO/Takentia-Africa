import sys
import os
sys.path.insert(0, os.path.abspath("."))

from app.core.database import Base
import app.models

print("Mapped Classes:")
for mapper in Base.registry.mappers:
    cls = mapper.class_
    print(f"- {cls.__name__} (Table: {cls.__tablename__})")
    for rel in mapper.relationships:
        # Check if the target is a string or a class
        target = rel.argument
        print(f"  Relationship: {rel.key} -> {target}")
        if target == "Address" or (isinstance(target, str) and "Address" in target):
            print(f"  [!!] MATCH FOUND in {cls.__name__}.{rel.key}")

