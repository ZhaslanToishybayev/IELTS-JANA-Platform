"""Print local Reading content coverage for diagnostic/practice readiness."""

import sys

sys.path.insert(0, ".")

from app.database import SessionLocal
from app.services.content_coverage import get_reading_category_coverage


def main() -> int:
    db = SessionLocal()
    try:
        coverage = get_reading_category_coverage(db)
        print(f"Reading content ready: {coverage['ready']}")
        print(f"Total active approved Reading questions: {coverage['total_questions']}")
        print(f"Minimum per category: {coverage['minimum_per_category']}")
        for item in coverage["categories"]:
            status = "ready" if item["ready"] else "missing"
            print(f"- {item['category']}: {item['count']} ({status})")
        if coverage["missing_categories"]:
            print("Missing categories: " + ", ".join(coverage["missing_categories"]))
            return 1
        print("Missing categories: none")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
