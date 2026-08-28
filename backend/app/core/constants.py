from enum import Enum

class str_Enum(str, Enum):
    def __str__(self) -> str:
        return self.value

class EmotionType(str_Enum):
    HAPPY = "happy"
    NEUTRAL = "neutral"
    CONFUSED = "confused"
    INTERESTED = "interested"
    BORED = "bored"
    FRUSTRATED = "frustrated"
    SURPRISED = "surprised"

class ActivityType(str_Enum):
    WRITING = "writing"
    READING = "reading"
    LISTENING = "listening"
    SLEEPING = "sleeping"
    TALKING = "talking"
    USING_PHONE = "using_phone"
    RAISING_HAND = "raising_hand"
    STANDING = "standing"
    WALKING = "walking"
    COLLABORATING = "collaborating"
    USING_LAPTOP = "using_laptop"

class GazeTarget(str_Enum):
    TEACHER = "teacher"
    BOARD = "board"
    LAPTOP = "laptop"
    PHONE = "phone"
    AWAY = "away"
    OTHER_STUDENT = "other_student"

class PredictionType(str_Enum):
    ATTENTION_DROP = "attention_drop"
    FUTURE_ENGAGEMENT = "future_engagement"
    QUIZ_PERFORMANCE = "quiz_performance"
    EXAM_PERFORMANCE = "exam_performance"
    PARTICIPATION_TREND = "participation_trend"
    RISK_STUDENT = "risk_student"
    DROPOUT_RISK = "dropout_risk"

class UserRole(str_Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"

class LectureStatus(str_Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EventType(str_Enum):
    ATTENDANCE = "attendance"
    HAND_RAISE = "hand_raise"
    DISTRACTION = "distraction"
    QUESTION = "question"
    COLLABORATION = "collaboration"
