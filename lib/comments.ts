import { Comment } from '@/types';
import { error as logError } from './logger';

const COMMENTS_KEY = 'objections-app-comments';

function getUserId(): string {
  if (typeof window === 'undefined') return 'user-1';
  
  let userId = localStorage.getItem('objections-app-user-id');
  if (!userId) {
    userId = `user-${Date.now()}`;
    localStorage.setItem('objections-app-user-id', userId);
  }
  return userId;
}

export function getComments(responseId: string, objectionId: string): Comment[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    if (!stored) return [];

    const allComments: Comment[] = JSON.parse(stored);
    return allComments.filter(
      c => c.responseId === responseId && c.objectionId === objectionId
    );
  } catch (error) {
    logError('Failed to load comments', error);
    return [];
  }
}

export function getAllCommentsForObjection(objectionId: string): Comment[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    if (!stored) return [];

    const allComments: Comment[] = JSON.parse(stored);
    return allComments.filter(c => c.objectionId === objectionId);
  } catch (error) {
    logError('Failed to load comments', error);
    return [];
  }
}

export function addComment(responseId: string, objectionId: string, text: string, parentId?: string): Comment {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add comment in server environment');
  }

  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    const allComments: Comment[] = stored ? JSON.parse(stored) : [];

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      responseId,
      objectionId,
      text,
      author: getUserId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId,
      edited: false,
    };

    allComments.push(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));

    return newComment;
  } catch (error) {
    logError('Failed to add comment', error);
    throw error;
  }
}

export function updateComment(commentId: string, text: string): Comment | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    if (!stored) return null;

    const allComments: Comment[] = JSON.parse(stored);
    const commentIndex = allComments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) return null;

    const userId = getUserId();
    if (allComments[commentIndex].author !== userId) {
      throw new Error('Not authorized to edit this comment');
    }

    allComments[commentIndex] = {
      ...allComments[commentIndex],
      text,
      updatedAt: new Date().toISOString(),
      edited: true,
    };

    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    return allComments[commentIndex];
  } catch (error) {
    logError('Failed to update comment', error);
    throw error;
  }
}

export function deleteComment(commentId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    if (!stored) return false;

    const allComments: Comment[] = JSON.parse(stored);
    const commentIndex = allComments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) return false;

    const userId = getUserId();
    if (allComments[commentIndex].author !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    // Also delete all child comments (replies)
    const commentIdsToDelete = new Set([commentId]);
    allComments.forEach(c => {
      if (c.parentId === commentId) {
        commentIdsToDelete.add(c.id);
      }
    });

    const filtered = allComments.filter(c => !commentIdsToDelete.has(c.id));
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(filtered));

    return true;
  } catch (error) {
    logError('Failed to delete comment', error);
    throw error;
  }
}

export function getCommentCount(responseId: string, objectionId: string): number {
  return getComments(responseId, objectionId).length;
}

