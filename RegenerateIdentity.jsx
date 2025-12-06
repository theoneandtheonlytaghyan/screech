/**
 * RegenerateIdentity Component
 * Modal/form for regenerating user's anonymous identity
 */

import { useState } from 'react';
import { RefreshCw, AlertTriangle, Check, Shuffle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CLANS } from '../../utils/constants';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';

const RegenerateIdentity = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [keepClan, setKeepClan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewIdentity, setPreviewIdentity] = useState(null);

  const { user, regenerateIdentity } = useAuth();
  const { success, error: showError } = useToast();

  // Generate a preview identity (client-side only for UI)
  const generatePreview = () => {
    const adjectives = ['Silent', 'Shadow', 'Mystic', 'Phantom', 'Hidden', 'Midnight', 'Cosmic'];
    const nouns = ['Whisper', 'Hunter', 'Seeker', 'Guardian', 'Watcher', 'Prowler', 'Spirit'];
    const colors = ['#8B7355', '#D2B48C', '#A0826D', '#C19A6B', '#967969', '#B8956A'];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const clan = keepClan ? user?.clan : CLANS[Math.floor(Math.random() * CLANS.length)];

    setPreviewIdentity({
      username: `${adjective}${noun}#${number}`,
      avatarColor: color,
      clan
    });
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    setLoading(true);

    try {
      const result = await regenerateIdentity(keepClan);

      if (result.success) {
        success('Your identity has been regenerated! 🦉');
        onSuccess?.(result.user);
        onClose();
      } else {
        showError(result.error || 'Failed to regenerate identity');
      }
    } catch (err) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Reset on close
  const handleClose = () => {
    setPreviewIdentity(null);
    setKeepClan(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Regenerate Identity"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-500 mb-1">Important</p>
            <p className="text-screech-textMuted">
              Regenerating your identity will give you a new username and avatar.
              Your posts, stats, and clan rank will remain.
            </p>
          </div>
        </div>

        {/* Current Identity */}
        <div>
          <h4 className="text-sm font-semibold text-screech-textMuted mb-3">
            Current Identity
          </h4>
          <IdentityCard
            username={user?.username}
            avatarColor={user?.avatarColor}
            clan={user?.clan}
          />
        </div>

        {/* Preview Identity */}
        {previewIdentity && (
          <div>
            <h4 className="text-sm font-semibold text-screech-textMuted mb-3">
              Preview (Example)
            </h4>
            <IdentityCard
              username={previewIdentity.username}
              avatarColor={previewIdentity.avatarColor}
              clan={previewIdentity.clan}
              isPreview
            />
            <p className="text-xs text-screech-textMuted mt-2 text-center">
              ⚠️ This is just a preview. Your actual new identity will be different.
            </p>
          </div>
        )}

        {/* Options */}
        <div>
          <h4 className="text-sm font-semibold text-screech-textMuted mb-3">
            Options
          </h4>

          {/* Keep Clan Option */}
          <label className="flex items-center gap-3 p-4 bg-screech-dark rounded-xl cursor-pointer hover:bg-screech-border transition-colors">
            <input
              type="checkbox"
              checked={keepClan}
              onChange={(e) => {
                setKeepClan(e.target.checked);
                if (previewIdentity) {
                  setPreviewIdentity({
                    ...previewIdentity,
                    clan: e.target.checked ? user?.clan : CLANS[Math.floor(Math.random() * CLANS.length)]
                  });
                }
              }}
              className="sr-only"
            />
            <div
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                ${keepClan
                  ? 'bg-screech-accent border-screech-accent'
                  : 'border-screech-border'
                }
              `}
            >
              {keepClan && <Check size={14} className="text-screech-dark" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-screech-text">Keep my clan</p>
              <p className="text-xs text-screech-textMuted">
                Stay in {user?.clan?.name} clan ({user?.clan?.emoji})
              </p>
            </div>
          </label>
        </div>

        {/* Preview Button */}
        <Button
          variant="secondary"
          fullWidth
          icon={Shuffle}
          onClick={generatePreview}
        >
          Generate Preview
        </Button>

        {/* Cooldown Info */}
        <div className="text-center">
          <p className="text-xs text-screech-textMuted">
            You can regenerate your identity up to 3 times per day.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-screech-border">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            icon={RefreshCw}
            onClick={handleRegenerate}
            loading={loading}
          >
            Regenerate
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Identity Card Component
 */
const IdentityCard = ({
  username,
  avatarColor,
  clan,
  isPreview = false
}) => {
  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-xl border
        ${isPreview
          ? 'bg-screech-accent/5 border-screech-accent/20 border-dashed'
          : 'bg-screech-dark border-screech-border'
        }
      `}
    >
      <Avatar
        username={username}
        color={avatarColor}
        emoji={clan?.emoji}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-screech-text truncate">
          {username}
        </p>
        {clan && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{clan.emoji}</span>
            <span className="text-sm text-screech-textMuted">{clan.name} Clan</span>
          </div>
        )}
      </div>
      <div
        className="w-8 h-8 rounded-full"
        style={{ backgroundColor: avatarColor }}
        title={`Avatar color: ${avatarColor}`}
      />
    </div>
  );
};

/**
 * Regenerate Identity Button
 * Standalone button to trigger the modal
 */
export const RegenerateIdentityButton = ({
  variant = 'secondary',
  size = 'md',
  showIcon = true,
  children = 'New Identity'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={showIcon ? RefreshCw : undefined}
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </Button>

      <RegenerateIdentity
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

/**
 * Quick Regenerate Card
 * Card component for settings page
 */
export const RegenerateIdentityCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-screech-accent/10 rounded-xl">
              <RefreshCw size={24} className="text-screech-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-screech-text mb-1">
                Regenerate Identity
              </h3>
              <p className="text-sm text-screech-textMuted mb-3">
                Get a new anonymous username and avatar while keeping your stats and posts.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-screech-textMuted">Current:</span>
                <span className="font-medium text-screech-accent">
                  {user?.username}
                </span>
                <span>{user?.clan?.emoji}</span>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Change
          </Button>
        </div>
      </Card>

      <RegenerateIdentity
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default RegenerateIdentity;