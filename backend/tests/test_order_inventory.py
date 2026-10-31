import os
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.category import Category
from app.models.inventory import InventoryMovement, InventoryStock
from app.models.menu import MenuItem
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services.order_service import create_order, update_order_status


class OrderInventoryTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)
        self.db = self.Session()
        self.student_id, self.menu_item_id = self._seed_stock()
        self.addCleanup(self._close_database)

    def _seed_stock(self, quantity=5):
        student = User(
            name="Order Test Student",
            registration_number="ORDER-TEST-1",
            email="order-test@example.test",
            password_hash="test-hash",
            role="student",
        )
        category = Category(name="Order Test Category")
        self.db.add_all([student, category])
        self.db.flush()

        menu_item = MenuItem(
            name="Test Bajjis",
            price=Decimal("10.00"),
            category_id=category.id,
            is_available=True,
        )
        self.db.add(menu_item)
        self.db.flush()
        self.db.add(
            InventoryStock(
                menu_item_id=menu_item.id,
                stock_quantity=quantity,
                low_stock_threshold=2,
            )
        )
        self.db.commit()
        return student.id, menu_item.id

    def _create_order(self, quantity, db=None):
        return create_order(
            OrderCreate(
                items=[
                    {
                        "menu_item_id": self.menu_item_id,
                        "quantity": quantity,
                    }
                ]
            ),
            student_id=self.student_id,
            db=db or self.db,
        )

    def _close_database(self):
        self.db.close()
        self.engine.dispose()

    def test_order_exceeding_stock_is_rejected_without_changing_stock(self):
        with self.assertRaises(HTTPException) as raised:
            self._create_order(10)

        self.assertEqual(raised.exception.status_code, 409)
        self.assertIn("Test Bajjis", raised.exception.detail)
        self.assertIn("available 5", raised.exception.detail)
        self.assertEqual(
            self.db.query(InventoryStock.stock_quantity)
            .filter_by(menu_item_id=self.menu_item_id)
            .scalar(),
            5,
        )
        self.assertEqual(self.db.query(Order).count(), 0)
        self.assertEqual(self.db.query(InventoryMovement).count(), 0)

    def test_successful_order_deducts_stock_and_records_movement(self):
        order = self._create_order(3)

        self.assertEqual(order.items[0].quantity, 3)
        self.assertEqual(
            self.db.query(InventoryStock.stock_quantity)
            .filter_by(menu_item_id=self.menu_item_id)
            .scalar(),
            2,
        )
        movement = self.db.query(InventoryMovement).one()
        self.assertEqual(movement.quantity_change, -3)
        self.assertEqual(movement.quantity_before, 5)
        self.assertEqual(movement.quantity_after, 2)

    def test_insufficient_later_item_rolls_back_earlier_deduction(self):
        second_item = MenuItem(
            name="Second Test Item",
            price=Decimal("5.00"),
            category_id=self.db.query(MenuItem)
            .filter_by(id=self.menu_item_id)
            .one()
            .category_id,
            is_available=True,
        )
        self.db.add(second_item)
        self.db.flush()
        self.db.add(
            InventoryStock(
                menu_item_id=second_item.id,
                stock_quantity=1,
                low_stock_threshold=0,
            )
        )
        self.db.commit()

        with self.assertRaises(HTTPException) as raised:
            create_order(
                OrderCreate(
                    items=[
                        {"menu_item_id": self.menu_item_id, "quantity": 3},
                        {"menu_item_id": second_item.id, "quantity": 2},
                    ]
                ),
                student_id=self.student_id,
                db=self.db,
            )

        self.assertIn("Second Test Item", raised.exception.detail)
        self.assertEqual(
            self.db.query(InventoryStock.stock_quantity)
            .filter_by(menu_item_id=self.menu_item_id)
            .scalar(),
            5,
        )
        self.assertEqual(
            self.db.query(InventoryStock.stock_quantity)
            .filter_by(menu_item_id=second_item.id)
            .scalar(),
            1,
        )
        self.assertEqual(self.db.query(Order).count(), 0)
        self.assertEqual(self.db.query(InventoryMovement).count(), 0)

    def test_order_status_updates_do_not_deduct_stock_again(self):
        order = self._create_order(3)
        for status in ("preparing", "ready", "completed"):
            update_order_status(order.id, status, self.db)

        self.assertEqual(
            self.db.query(InventoryStock.stock_quantity)
            .filter_by(menu_item_id=self.menu_item_id)
            .scalar(),
            2,
        )
        self.assertEqual(self.db.query(InventoryMovement).count(), 1)

    def test_failed_order_commit_rolls_back_order_stock_and_movement(self):
        def fail_before_commit(_session):
            raise RuntimeError("simulated database commit failure")

        event.listen(self.db, "before_commit", fail_before_commit)
        try:
            with self.assertRaises(HTTPException) as raised:
                self._create_order(3)
        finally:
            event.remove(self.db, "before_commit", fail_before_commit)

        self.assertEqual(raised.exception.status_code, 500)
        self.assertEqual(
            self.db.query(InventoryStock.stock_quantity)
            .filter_by(menu_item_id=self.menu_item_id)
            .scalar(),
            5,
        )
        self.assertEqual(self.db.query(Order).count(), 0)
        self.assertEqual(self.db.query(InventoryMovement).count(), 0)

    def test_concurrent_orders_cannot_oversell_stock(self):
        self.db.close()
        with tempfile.TemporaryDirectory() as directory:
            database_path = os.path.join(directory, "concurrent-orders.sqlite").replace("\\", "/")
            engine = create_engine(
                f"sqlite:///{database_path}",
                connect_args={"check_same_thread": False, "timeout": 15},
            )

            @event.listens_for(engine, "connect")
            def set_sqlite_timeout(connection, _record):
                connection.execute("PRAGMA busy_timeout = 15000")

            @event.listens_for(engine, "begin")
            def serialize_sqlite_transactions(connection):
                connection.exec_driver_sql("BEGIN IMMEDIATE")

            Base.metadata.create_all(engine)
            Session = sessionmaker(bind=engine, expire_on_commit=False)
            seed_db = Session()
            self.student_id, self.menu_item_id = self._seed_stock_in(seed_db)
            seed_db.close()

            barrier = threading.Barrier(2)

            def place_concurrent_order():
                db = Session()
                try:
                    barrier.wait(timeout=10)
                    order = self._create_order(3, db=db)
                    return ("created", order.id)
                except HTTPException as error:
                    return ("rejected", error.status_code)
                finally:
                    db.close()

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(lambda _index: place_concurrent_order(), range(2)))

                self.assertEqual(sum(outcome[0] == "created" for outcome in outcomes), 1)
                self.assertIn(("rejected", 409), outcomes)

                verify_db = Session()
                try:
                    remaining = (
                        verify_db.query(InventoryStock.stock_quantity)
                        .filter_by(menu_item_id=self.menu_item_id)
                        .scalar()
                    )
                    self.assertEqual(remaining, 2)
                    self.assertEqual(verify_db.query(Order).count(), 1)
                finally:
                    verify_db.close()
            finally:
                engine.dispose()

    @staticmethod
    def _seed_stock_in(db):
        student = User(
            name="Concurrent Test Student",
            registration_number="ORDER-CONCURRENT-1",
            email="order-concurrent@example.test",
            password_hash="test-hash",
            role="student",
        )
        category = Category(name="Concurrent Test Category")
        db.add_all([student, category])
        db.flush()
        item = MenuItem(
            name="Test Bajjis",
            price=Decimal("10.00"),
            category_id=category.id,
            is_available=True,
        )
        db.add(item)
        db.flush()
        db.add(
            InventoryStock(
                menu_item_id=item.id,
                stock_quantity=5,
                low_stock_threshold=2,
            )
        )
        db.commit()
        return student.id, item.id


if __name__ == "__main__":
    unittest.main()
