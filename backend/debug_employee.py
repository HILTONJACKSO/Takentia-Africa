import sys
import os
sys.path.insert(0, os.path.abspath("."))

try:
    from app.core.database import Base
    from app.models.hr import Employee
    from sqlalchemy import inspect
    import app.models

    print(f"Inspecting Employee class in {Employee.__module__}")
    
    # Try to find 'Address' in any attribute or relationship
    from sqlalchemy.orm import class_mapper
    mapper = class_mapper(Employee)
    
    print(f"Employee Mapper: {mapper}")
    for prop in mapper.iterate_properties:
        print(f"  Property: {prop.key} (Type: {type(prop).__name__})")
        if hasattr(prop, 'mapper'):
            print(f"    Target Mapper: {prop.mapper}")
            if 'Address' in str(prop.mapper) or 'Address' in str(prop):
                print(f"    [!!] FOUND ADDRESS REFERENCE IN {prop.key}")

except Exception as e:
    print(f"Introspection Error: {e}")
    import traceback
    traceback.print_exc()
