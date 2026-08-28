"""
Database Initialization & Seeding Script

Creates the local SQLite database schema and seeds it with default rooms, courses,
lectures, students, and user accounts so the frontend can immediately display data.
"""
import sys
import os
import asyncio
from datetime import datetime, UTC

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.security import get_password_hash
from app.infrastructure.database.session import engine, Base, async_session_maker
from app.infrastructure.database.models import (
    User, Student, Teacher, Room, Course, Lecture, CourseEnrollment
)

async def init_db():
    print("1. Creating database tables in SQLite...")
    async with engine.begin() as conn:
        # Recreate schema
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created [OK]")

from app.core.constants import UserRole

async def seed_data():
    print("\n2. Seeding default data...")
    async with async_session_maker() as db:
        # Create Users
        admin_user = User(
            email="admin@classroom.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        teacher_user = User(
            email="sarah.jenkins@classroom.edu",
            hashed_password=get_password_hash("teacher123"),
            full_name="Dr. Sarah Jenkins",
            role=UserRole.TEACHER,
            is_active=True
        )
        db.add(admin_user)
        db.add(teacher_user)
        await db.flush()

        # Create Teacher Profile
        teacher_profile = Teacher(
            user_id=teacher_user.id,
            employee_code="T1001",
            full_name="Dr. Sarah Jenkins",
            department="Computer Science"
        )
        db.add(teacher_profile)
        await db.flush()

        # Create Students
        student_names = [
            "Alex Rivera", "Betty Chen", "Chris Miller", "Daniel Kowalski",
            "Emily Watson", "Frank Zhang", "Grace Hopper", "Henry Jones"
        ]
        students = []
        for i, name in enumerate(student_names):
            uname = name.lower().replace(" ", "")
            stu_user = User(
                email=f"{uname}@classroom.edu",
                hashed_password=get_password_hash("student123"),
                full_name=name,
                role=UserRole.STUDENT,
                is_active=True
            )
            db.add(stu_user)
            await db.flush()

            student_profile = Student(
                user_id=stu_user.id,
                student_code=f"S10{i+1:02d}",
                full_name=name
            )
            db.add(student_profile)
            students.append(student_profile)
            
        await db.flush()

        # Create Room
        room = Room(
            name="Room 101",
            building="Engineering Hall",
            floor=1,
            capacity=30,
            layout_json={"seats": 30}
        )
        db.add(room)
        await db.flush()

        # Create Course
        course = Course(
            code="CS-229",
            name="Introduction to Deep Learning",
            semester="Fall 2026",
            teacher_id=teacher_profile.id
        )
        db.add(course)
        await db.flush()

        # Enroll all students
        for student in students:
            enrollment = CourseEnrollment(
                student_id=student.id,
                course_id=course.id,
                enrolled_at=datetime.now(UTC)
            )
            db.add(enrollment)

        # Create Lecture
        lecture = Lecture(
            course_id=course.id,
            room_id=room.id,
            teacher_id=teacher_profile.id,
            title="Neural Networks & Backpropagation",
            start_time=datetime.now(UTC),
            end_time=datetime.now(UTC)
        )
        db.add(lecture)
        
        await db.commit()
    print("Database seeding completed [OK]")

async def main():
    await init_db()
    await seed_data()
    print("\nInitialization success! Default credentials:")
    print("  * Admin   : username='admin', password='admin123'")
    print("  * Teacher : username='teacher', password='teacher123'")

if __name__ == "__main__":
    asyncio.run(main())
