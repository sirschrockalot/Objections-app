/**
 * EXAMPLE IMPLEMENTATION: Response Formatters
 * 
 * Centralized response formatting to ensure consistency
 * and reduce duplication across API routes.
 */

import { IObjectionNote } from '@/lib/models/ObjectionNote';
import { ICustomResponse } from '@/lib/models/CustomResponse';
import { IUser } from '@/lib/models/User';
import { IResponseTemplate } from '@/lib/models/ResponseTemplate';

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
 * Format multiple items using a formatter function
 */
export function formatMany<T, R>(
  items: T[],
  formatter: (item: T) => R
): R[] {
  return items.map(formatter);
}

/**
 * Example usage in route handler:
 * 
 * const notes = await ObjectionNote.find({ userId }).lean();
 * return { notes: formatMany(notes, formatNote) };
 */

