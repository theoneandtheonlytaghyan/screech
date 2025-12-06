/**
 * PostMenu Component
 * Dropdown menu for post actions
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Flag,
  Send,
  Edit,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { copyToClipboard } from '../../utils/helpers';
import { IconButton } from '../common/Button';
import { ConfirmModal } from '../common/Modal';

const PostMenu = ({
  post,
  onDelete,
  onEdit,
  onBookmark,
  isBookmarked = false,
  showEditOption = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const menuRef = useRef(null);
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const isOwner = user?._id === post.author?._id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle copy link
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    const copied = await copyToClipboard(url);
    
    if (copied) {
      success('Link copied to clipboard!');
    } else {
      showError('Failed to copy link');
    }
    
    setIsOpen(false);
  };

  // Handle open in new tab
  const handleOpenNewTab = () => {
    window.open(`/post/${post._id}`, '_blank');
    setIsOpen(false);
  };

  // Handle message author
  const handleMessage = () => {
    navigate(`/messages/new/${post.author._id}`);
    setIsOpen(false);
  };

  // Handle bookmark
  const handleBookmark = () => {
    onBookmark?.(post._id);
    setIsOpen(false);
  };

  // Handle edit
  const handleEdit = () => {
    onEdit?.(post);
    setIsOpen(false);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await onDelete?.(post._id);
      setShowDeleteModal(false);
    } catch (err) {
      showError('Failed to delete post');
    }
  };

  // Handle report
  const handleReport = () => {
    setShowReportModal(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Trigger Button */}
        <IconButton
          icon={MoreHorizontal}
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          aria-label="Post options"
          aria-expanded={isOpen}
        />

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="dropdown animate-fade-in"
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Copy Link */}
            <MenuItem
              icon={Copy}
              label="Copy link"
              onClick={handleCopyLink}
            />

            {/* Open in New Tab */}
            <MenuItem
              icon={ExternalLink}
              label="Open in new tab"
              onClick={handleOpenNewTab}
            />

            {/* Bookmark */}
            {user && (
              <MenuItem
                icon={isBookmarked ? BookmarkCheck : Bookmark}
                label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                onClick={handleBookmark}
              />
            )}

            {/* Divider */}
            {user && <MenuDivider />}

            {/* Actions for non-owners */}
            {user && !isOwner && (
              <>
                <MenuItem
                  icon={Send}
                  label="Message author"
                  onClick={handleMessage}
                />
                <MenuItem
                  icon={Flag}
                  label="Report"
                  onClick={handleReport}
                  danger
                />
              </>
            )}

            {/* Actions for owner */}
            {isOwner && (
              <>
                {showEditOption && (
                  <MenuItem
                    icon={Edit}
                    label="Edit"
                    onClick={handleEdit}
                  />
                )}
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  onClick={() => {
                    setIsOpen(false);
                    setShowDeleteModal(true);
                  }}
                  danger
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Hoot"
        message="Are you sure you want to delete this hoot? This action cannot be undone."
        confirmText="Delete"
        danger
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={post._id}
      />
    </>
  );
};

/**
 * Menu Item Component
 */
const MenuItem = ({ icon: Icon, label, onClick, danger = false }) => {
  return (
    <button
      onClick={onClick}
      className={`
        dropdown-item
        ${danger ? 'text-red-500 hover:bg-red-500/10' : ''}
      `}
      role="menuitem"
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
};

/**
 * Menu Divider Component
 */
const MenuDivider = () => {
  return <div className="border-t border-screech-border my-1" />;
};

/**
 * Report Modal Component
 */
const ReportModal = ({ isOpen, onClose, postId }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const reasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate', label: 'Hate speech' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!reason) {
      showError('Please select a reason');
      return;
    }

    setLoading(true);

    try {
      // API call would go here
      // await reportsAPI.create({ postId, reason });
      success('Report submitted. Thank you for helping keep Screech safe.');
      onClose();
      setReason('');
    } catch (err) {
      showError('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-screech-border">
          <h2 className="text-lg font-semibold text-screech-text">
            Report this hoot
          </h2>
        </div>

        <div className="p-5">
          <p className="text-sm text-screech-textMuted mb-4">
            Why are you reporting this post?
          </p>

          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r.value}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors
                  ${reason === r.value 
                    ? 'bg-screech-accent/10 border border-screech-accent' 
                    : 'bg-screech-dark border border-transparent hover:border-screech-border'
                  }
                `}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${reason === r.value 
                      ? 'border-screech-accent' 
                      : 'border-screech-border'
                    }
                  `}
                >
                  {reason === r.value && (
                    <div className="w-2 h-2 rounded-full bg-screech-accent" />
                  )}
                </div>
                <span className="text-sm text-screech-text">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-screech-border">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="btn btn-primary"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostMenu;