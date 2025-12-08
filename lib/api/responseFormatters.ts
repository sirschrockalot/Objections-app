/**
 * Response Formatters
 * 
 * Centralized response formatting to ensure consistency
 * and reduce duplication across API routes.
 */

import { IObjectionNote } from '@/lib/models/ObjectionNote';
import { ICustomResponse } from '@/lib/models/CustomResponse';
import { IUser } from '@/lib/models/User';
import { IResponseTemplate } from '@/lib/models/ResponseTemplate';
import { IPracticeSession } from '@/lib/models/PracticeSession';
import { IConfidenceRating } from '@/lib/models/ConfidenceRating';
import { IReviewSchedule } from '@/lib/models/ReviewSchedule';
import { IPoints } from '@/lib/models/Points';

/**
 * Format objection note for API response
 */
export function formatNote(note: IObjectionNote) {
  return {
    objectionId: note.objectionId,
    note: note.note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

/**
 * Format custom response for API response
 */
export function formatCustomResponse(response: ICustomResponse) {
  return {
    id: response.responseId,
    objectionId: response.objectionId,
    text: response.text,
    isCustom: response.isCustom,
    createdAt: response.createdAt.toISOString(),
    createdBy: response.createdBy,
    upvotes: response.upvotes,
    upvotedBy: response.upvotedBy,
  };
}

/**
 * Format user for API response (excludes sensitive data)
 */
export function formatUser(user: IUser) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    isActive: user.isActive,
    isAdmin: user.isAdmin || false,
    mustChangePassword: user.mustChangePassword || false,
  };
}

/**
 * Format response template for API response
 */
export function formatTemplate(template: IResponseTemplate) {
  return {
    id: template.templateId,
    name: template.name,
    acknowledge: template.acknowledge,
    reframe: template.reframe,
    value: template.value,
    nextStep: template.nextStep,
    createdAt: template.createdAt.toISOString(),
  };
}

/**
 * Format practice session for API response
 */
export function formatPracticeSession(session: IPracticeSession) {
  return {
    id: session._id.toString(),
    userId: session.userId,
    sessionId: session.sessionId,
    date: session.date.toISOString(),
    objectionsPracticed: session.objectionsPracticed,
    duration: session.duration,
    challengeMode: session.challengeMode,
    timeLimit: session.timeLimit,
    goal: session.goal,
  };
}

/**
 * Format confidence rating for API response
 */
export function formatConfidenceRating(rating: IConfidenceRating) {
  return {
    objectionId: rating.objectionId,
    rating: rating.rating,
    date: rating.date.toISOString(),
  };
}

/**
 * Format review schedule for API response
 */
export function formatReviewSchedule(schedule: IReviewSchedule) {
  return {
    objectionId: schedule.objectionId,
    nextReviewDate: schedule.nextReviewDate, // Already a string (ISO date)
    interval: schedule.interval,
    easeFactor: schedule.easeFactor,
    repetitions: schedule.repetitions,
    lastReviewDate: schedule.lastReviewDate,
    isDue: schedule.isDue,
  };
}

/**
 * Format points entry for API response
 */
export function formatPoints(points: IPoints) {
  return {
    id: points.pointsId,
    userId: points.userId,
    points: points.points,
    reason: points.reason,
    date: points.date.toISOString(),
    metadata: points.metadata,
  };
}

/**
 * Format multiple items using a formatter function
 */
export function formatMany<T, R>(
  items: T[],
  formatter: (item: T) => R
): R[] {
  return items.map(formatter);
}

