'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Comment } from '@/types';
import { getComments, addComment, updateComment, deleteComment } from '@/lib/comments';
import { error as logError } from '@/lib/logger';
import { MessageSquare, Reply, Edit2, Trash2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentsSectionProps {
  responseId: string;
  objectionId: string;
  onCommentAdded?: () => void;
}

export default function CommentsSection({ responseId, objectionId, onCommentAdded }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const loadComments = useCallback(() => {
    try {
      const allComments = getComments(responseId, objectionId);
      // Sort: top-level comments first, then replies by date
      const topLevel = allComments.filter(c => !c.parentId);
      const replies = allComments.filter(c => c.parentId);
      const sorted = topLevel.map(comment => ({
        comment,
        replies: replies.filter(r => r.parentId === comment.id).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }));
      const newComments = sorted.map(item => item.comment);
      
      // Only update if comments actually changed
      setComments(prev => {
        if (prev.length !== newComments.length) return newComments;
        // Deep comparison of comment IDs
        const idsChanged = prev.some((c, i) => c.id !== newComments[i]?.id);
        if (idsChanged) return newComments;
        return prev; // No changes, return previous state
      });
    } catch (error) {
      logError('Failed to load comments', error);
    }
  }, [responseId, objectionId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;

    try {
      addComment(responseId, objectionId, newCommentText.trim());
      setNewCommentText('');
      setShowAddComment(false);
      loadComments();
      onCommentAdded?.();
    } catch (error) {
      logError('Failed to add comment', error);
      alert('Failed to add comment');
    }
  };

  const handleReply = (parentId: string) => {
    if (!replyText.trim()) return;

    try {
      addComment(responseId, objectionId, replyText.trim(), parentId);
      setReplyText('');
      setReplyingTo(null);
      loadComments();
      onCommentAdded?.();
    } catch (error) {
      logError('Failed to add reply', error);
      alert('Failed to add reply');
    }
  };

  const handleEdit = (commentId: string) => {
    if (!editText.trim()) return;

    try {
      updateComment(commentId, editText.trim());
      setEditText('');
      setEditingId(null);
      loadComments();
    } catch (error) {
      logError('Failed to update comment', error);
      alert('Failed to update comment');
    }
  };

  const handleDelete = (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      deleteComment(commentId);
      loadComments();
      onCommentAdded?.();
    } catch (error) {
      logError('Failed to delete comment', error);
      alert('Failed to delete comment');
    }
  };

  const getReplies = (commentId: string): Comment[] => {
    const allComments = getComments(responseId, objectionId);
    return allComments.filter(c => c.parentId === commentId);
  };

  const isOwnComment = (author: string): boolean => {
    // Simple check - in real app, would compare with actual user ID
    return true; // For now, allow editing own comments
  };

  const allComments = getComments(responseId, objectionId);
  const topLevelComments = allComments.filter(c => !c.parentId);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {topLevelComments.length} {topLevelComments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddComment(!showAddComment)}
          className="text-xs"
        >
          {showAddComment ? 'Cancel' : 'Add Comment'}
        </Button>
      </div>

      <AnimatePresence>
        {showAddComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddComment(false);
                  setNewCommentText('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {topLevelComments.map((comment) => {
          const replies = getReplies(comment.id);
          const isEditing = editingId === comment.id;

          return (
            <div key={comment.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{comment.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                            {comment.edited && ' (edited)'}
                          </span>
                        </div>
                      </div>
                      {isOwnComment(comment.author) && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditText(comment.text);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </>
                )}
              </div>

              {/* Reply Form */}
              <AnimatePresence>
                {replyingTo === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 ml-4 space-y-2"
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyText.trim()}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Replies */}
              {replies.length > 0 && (
                <div className="mt-2 ml-4 space-y-2">
                  {replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm">
                      <p className="text-gray-900 dark:text-gray-100">{reply.text}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(reply.createdAt).toLocaleDateString()}
                        {reply.edited && ' (edited)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {topLevelComments.length === 0 && !showAddComment && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}

