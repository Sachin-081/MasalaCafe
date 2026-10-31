import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.account_deletion import AccountDeletionRequest
from app.models.user import User
from app.services.account_deletion_service import (
    cancel_student_request,
    list_admin_requests,
    list_student_requests,
    review_request,
    submit_request,
)
from app.services.permissions import require_role


class AccountDeletionRequestTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)
        self.db = self.Session()
        self.student_id = self._create_student(
            "STUDENT-REQUEST-1",
            "student-request@example.test",
        )
        self.other_student_id = self._create_student(
            "STUDENT-REQUEST-2",
            "student-request-2@example.test",
        )
        self.addCleanup(self._close_database)

    def _create_student(self, registration_number, email):
        student = User(
            name="Deletion Test Student",
            registration_number=registration_number,
            email=email,
            password_hash="test-hash",
            role="student",
        )
        self.db.add(student)
        self.db.commit()
        return student.id

    def _close_database(self):
        self.db.close()
        self.engine.dispose()

    def test_student_can_create_and_view_only_own_requests(self):
        request = submit_request(self.student_id, self.db)

        self.assertEqual(request.status, "pending")
        self.assertEqual(request.registration_number, "STUDENT-REQUEST-1")
        self.assertEqual(len(list_student_requests(self.student_id, self.db)), 1)
        self.assertEqual(list_student_requests(self.other_student_id, self.db), [])

    def test_duplicate_pending_request_is_rejected(self):
        submit_request(self.student_id, self.db)

        with self.assertRaises(HTTPException) as raised:
            submit_request(self.student_id, self.db)

        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(self.db.query(AccountDeletionRequest).count(), 1)

    def test_student_can_cancel_only_their_pending_request(self):
        request = submit_request(self.student_id, self.db)

        with self.assertRaises(HTTPException) as raised:
            cancel_student_request(request.id, self.other_student_id, self.db)
        self.assertEqual(raised.exception.status_code, 404)

        result = cancel_student_request(request.id, self.student_id, self.db)
        self.assertIn("cancelled", result["message"])
        self.assertEqual(self.db.query(AccountDeletionRequest).count(), 0)

    def test_admin_review_records_decision_and_note_without_deleting_student(self):
        request = submit_request(self.student_id, self.db)

        reviewed = review_request(
            request_id=request.id,
            decision="approved",
            admin_note="Verified identity",
            db=self.db,
        )

        self.assertEqual(reviewed.status, "approved")
        self.assertEqual(reviewed.admin_note, "Verified identity")
        self.assertIsNotNone(reviewed.reviewed_at)
        self.assertIsNotNone(self.db.query(User).filter_by(id=self.student_id).one())
        self.assertEqual(list_admin_requests("approved", self.db)[0].id, request.id)

    def test_reviewed_request_cannot_be_reviewed_again(self):
        request = submit_request(self.student_id, self.db)
        review_request(request.id, "rejected", None, self.db)

        with self.assertRaises(HTTPException) as raised:
            review_request(request.id, "approved", None, self.db)

        self.assertEqual(raised.exception.status_code, 409)

    def test_role_guards_reject_cross_role_access(self):
        student = self.db.query(User).filter_by(id=self.student_id).one()
        admin = User(
            name="Deletion Test Admin",
            registration_number="ADMIN-REQUEST-1",
            email="admin-request@example.test",
            password_hash="test-hash",
            role="admin",
        )
        self.db.add(admin)
        self.db.commit()

        with self.assertRaises(HTTPException) as admin_route_error:
            require_role("admin")(student)
        self.assertEqual(admin_route_error.exception.status_code, 403)

        with self.assertRaises(HTTPException) as student_route_error:
            require_role("student")(admin)
        self.assertEqual(student_route_error.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
