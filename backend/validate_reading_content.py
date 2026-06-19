"""Validate active approved Reading questions in the configured database."""

import sys

sys.path.insert(0, ".")

from app.database import SessionLocal
from app.models import Question
from app.services.content_validation import (
    VALID_READING_TYPES,
    get_reading_category_counts,
    validate_reading_question,
    validate_reading_question_warnings,
)


def main() -> int:
    db = SessionLocal()
    try:
        questions = (
            db.query(Question)
            .filter(
                Question.module == "READING",
                Question.is_active.is_(True),
                Question.approved.is_(True),
            )
            .all()
        )
        category_counts = get_reading_category_counts(questions)
        failures = []
        warnings = []

        for question in questions:
            errors = validate_reading_question(question)
            if errors:
                failures.append((question, errors))
            question_warnings = validate_reading_question_warnings(question)
            if question_warnings:
                warnings.append((question, question_warnings))

        print(f"Checked {len(questions)} active approved Reading questions.")
        print(f"Errors count: {sum(len(errors) for _, errors in failures)}")
        print(f"Warnings count: {sum(len(items) for _, items in warnings)}")
        print("Category counts:")
        for category in sorted(VALID_READING_TYPES):
            print(f"- {category}: {category_counts[category]}")

        if failures:
            print(f"Reading content validation failed with {len(failures)} questions containing errors.")
            for question, errors in failures:
                label = f"#{question.id} {question.passage_title or 'Untitled'} [{question.question_type}]"
                print(label)
                for error in errors:
                    print(f"  - {error}")
            return 1

        if warnings:
            print(f"Reading content validation warnings in {len(warnings)} questions:")
            for question, items in warnings:
                label = f"#{question.id} {question.passage_title or 'Untitled'} [{question.question_type}]"
                print(label)
                for warning in items:
                    print(f"  - {warning}")

        missing = [category for category, count in category_counts.items() if count == 0]
        if missing:
            print(f"Reading content validation failed. Missing categories: {', '.join(missing)}")
            return 1

        print("Reading content validation passed.")
        print(f"Checked {len(questions)} active approved Reading questions.")
        print("All 7 Reading categories are represented.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
