from app.api.v1.schemas.common import PaginationParams, HealthResponse, ErrorResponse, SuccessResponse, TimeRange
from app.api.v1.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.api.v1.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse, TeacherListResponse
from app.api.v1.schemas.lecture import LectureCreate, LectureUpdate, LectureResponse, LectureListResponse
from app.api.v1.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceReport
from app.api.v1.schemas.engagement import EngagementResponse, EngagementTimeline, ClassroomEngagement
from app.api.v1.schemas.emotion import EmotionResponse, EmotionTimeline, ClassroomEmotionSummary
from app.api.v1.schemas.prediction import PredictionResponse, ExplanationFactor, RiskStudentResponse
from app.api.v1.schemas.analytics import DashboardStats, TeacherAnalyticsResponse, EnvironmentResponse, HeatmapResponse, TrendData
from app.api.v1.schemas.copilot import CopilotSuggestionResponse, CopilotChatRequest, CopilotChatResponse
from app.api.v1.schemas.transcript import TranscriptSegment, TranscriptResponse, LectureSummaryResponse

__all__ = [
    "PaginationParams",
    "HealthResponse",
    "ErrorResponse",
    "SuccessResponse",
    "TimeRange",
    "StudentCreate",
    "StudentUpdate",
    "StudentResponse",
    "StudentListResponse",
    "TeacherCreate",
    "TeacherUpdate",
    "TeacherResponse",
    "TeacherListResponse",
    "LectureCreate",
    "LectureUpdate",
    "LectureResponse",
    "LectureListResponse",
    "AttendanceCreate",
    "AttendanceResponse",
    "AttendanceReport",
    "EngagementResponse",
    "EngagementTimeline",
    "ClassroomEngagement",
    "EmotionResponse",
    "EmotionTimeline",
    "ClassroomEmotionSummary",
    "PredictionResponse",
    "ExplanationFactor",
    "RiskStudentResponse",
    "DashboardStats",
    "TeacherAnalyticsResponse",
    "EnvironmentResponse",
    "HeatmapResponse",
    "TrendData",
    "CopilotSuggestionResponse",
    "CopilotChatRequest",
    "CopilotChatResponse",
    "TranscriptSegment",
    "TranscriptResponse",
    "LectureSummaryResponse"
]
