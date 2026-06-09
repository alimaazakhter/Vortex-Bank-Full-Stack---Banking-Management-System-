'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Key, 
  Copy, 
  Check, 
  Calendar, 
  Bell, 
  Moon, 
  Sun,
  ShieldAlert,
  CreditCard,
  PiggyBank,
  Wallet,
  Camera,
  FolderOpen,
  Trash2,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { showToast } from './Toast';
import styles from './UserProfileClient.module.css';

interface UserProfileClientProps {
  user: {
    name: string;
    email: string;
    accountNo: string;
    joinDate: string;
    avatarUrl: string | null;
    themePreference: string;
    notificationPreference: string;
    balance: number;
    cardsCount: number;
    savingsPotsCount: number;
  };
}

const AVATAR_PRESETS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
  '/avatars/avatar-7.svg',
  '/avatars/avatar-8.svg',
  '/avatars/avatar-9.svg',
  '/avatars/avatar-10.svg',
  '/avatars/avatar-11.svg',
  '/avatars/avatar-12.svg'
];

const normalizeAvatar = (url: string | null): string => {
  if (!url) return '/avatars/avatar-1.svg';
  if (url === 'preset_1') return '/avatars/avatar-1.svg';
  if (url === 'preset_2') return '/avatars/avatar-2.svg';
  return url;
};

export default function UserProfileClient({ user }: UserProfileClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Details state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [selectedAvatar, setSelectedAvatar] = useState(normalizeAvatar(user.avatarUrl));
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Preferences state
  const [notificationPref, setNotificationPref] = useState(user.notificationPreference);
  const [themePref, setThemePref] = useState(user.themePreference);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  // Custom Avatar / Photo Upload / Webcam States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        editBtnRef.current &&
        !editBtnRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Ensure camera tracks are stopped if component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleTriggerUpload = () => {
    setIsDropdownOpen(false);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 200;
        canvas.height = 200;

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveAvatarDirectly(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerTakePhoto = async () => {
    setIsDropdownOpen(false);
    setIsWebcamOpen(true);
    setCapturedImage(null);
    setCameraError(null);
    setIsCameraLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      
      // Small delay to make sure modal is rendered and ref is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera connection error:', err);
      setCameraError('Unable to access webcam. Please check camera permissions.');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const video = videoRef.current;
      canvas.width = 200;
      canvas.height = 200;

      // Crop video frame to square center
      const size = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      ctx.drawImage(video, sx, sy, size, size, 0, 0, 200, 200);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleCloseWebcam = () => {
    stopCamera();
    setIsWebcamOpen(false);
    setCapturedImage(null);
  };

  const handleUseCapturedPhoto = () => {
    if (capturedImage) {
      saveAvatarDirectly(capturedImage);
      handleCloseWebcam();
    }
  };

  const handleDeletePhoto = () => {
    setIsDropdownOpen(false);
    const defaultPreset = '/avatars/avatar-1.svg';
    saveAvatarDirectly(defaultPreset);
  };

  const saveAvatarDirectly = async (url: string) => {
    setSelectedAvatar(url);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_details',
          name,
          email,
          avatarUrl: url
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Profile photo updated successfully!', 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to save profile photo', 'error');
      }
    } catch (err) {
      showToast('Error saving profile photo', 'error');
    }
  };

  const handleCopyAccountNo = () => {
    navigator.clipboard.writeText(user.accountNo);
    setCopied(true);
    showToast('Account number copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    setIsUpdatingDetails(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_details',
          name,
          email,
          avatarUrl: selectedAvatar
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully!', 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Error updating profile details', 'error');
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      showToast('Error changing password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !confirmPin) {
      showToast('Both PIN fields are required', 'error');
      return;
    }

    if (newPin !== confirmPin) {
      showToast('PINs do not match', 'error');
      return;
    }

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      showToast('PIN must be exactly 4 digits (e.g. 1234)', 'error');
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_pin',
          newPin
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Transaction PIN updated successfully!', 'success');
        setNewPin('');
        setConfirmPin('');
      } else {
        showToast(data.error || 'Failed to update PIN', 'error');
      }
    } catch (err) {
      showToast('Error updating PIN', 'error');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleUpdatePreferences = async (theme: string, notifications: string) => {
    setIsUpdatingPrefs(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themePreference: theme,
          notificationPreference: notifications
        })
      });

      const data = await res.json();
      if (res.ok) {
        setThemePref(theme);
        setNotificationPref(notifications);
        // Save theme in cookie for both logged-in and logged-out views
        document.cookie = `vortex_theme=${theme.toLowerCase()}; path=/; max-age=31536000; SameSite=Lax`;
        // Force update html theme class on client
        document.documentElement.classList.add('theme-transition');
        document.documentElement.setAttribute('data-theme', theme.toLowerCase());
        showToast('Preferences updated successfully!', 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to update preferences', 'error');
      }
    } catch (err) {
      showToast('Error updating preferences', 'error');
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const isEmoji = (str: string) => {
    const charCode = str.codePointAt(0);
    return charCode ? charCode > 127 : false;
  };

  const dateFormatted = new Date(user.joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Account Profile</h2>
        <p className={styles.subtitle}>Manage your profile details, theme settings, security passwords, and credentials.</p>
      </header>

      <div className={styles.layoutGrid}>
        
        {/* Left Side: Summary & Quick Settings */}
        <div className={styles.leftCol}>
          
          {/* User Details card */}
          <div className={`${styles.profileCard} glass-card`}>
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />

            <div className={styles.avatarMainWrapper}>
              <div className={styles.avatarMain}>
                {isEmoji(selectedAvatar) ? (
                  <span className={styles.avatarEmoji}>{selectedAvatar}</span>
                ) : (
                  <img src={selectedAvatar} alt="Avatar" className={styles.avatarImg} />
                )}
              </div>
              
              <button 
                type="button"
                ref={editBtnRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={styles.editOverlayBtn}
                title="Edit profile photo"
              >
                <Camera size={14} />
                <span>Edit</span>
              </button>

              {isDropdownOpen && (
                <div className={styles.avatarDropdown} ref={dropdownRef}>
                  <button type="button" className={styles.dropdownItem} onClick={handleTriggerTakePhoto}>
                    <Camera size={14} />
                    <span>Take photo</span>
                  </button>
                  <button type="button" className={styles.dropdownItem} onClick={handleTriggerUpload}>
                    <FolderOpen size={14} />
                    <span>Upload photo</span>
                  </button>
                  <button type="button" className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleDeletePhoto}>
                    <Trash2 size={14} />
                    <span>Delete photo</span>
                  </button>
                </div>
              )}
            </div>
            
            <h3 className={styles.userName}>{user.name}</h3>
            <p className={styles.userEmail}>{user.email}</p>

            <div className={styles.accountNoRow}>
              <span className={styles.accountNoLabel}>Account Number</span>
              <div className={styles.accountNoValue}>
                <code>{user.accountNo}</code>
                <button onClick={handleCopyAccountNo} className={styles.copyBtn} title="Copy Account Number">
                  {copied ? <Check size={14} className={styles.copySuccess} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className={styles.joinedRow}>
              <Calendar size={14} className={styles.iconSecondary} />
              <span>Joined {dateFormatted}</span>
            </div>
          </div>

          {/* Core metrics quick dashboard */}
          <div className={`${styles.statsCard} glass-card`}>
            <h4 className={styles.sectionTitle}>Account Overview</h4>
            
            <div className={styles.statItem}>
              <div className={styles.statLabelRow}>
                <Wallet size={16} className={styles.statIcon} />
                <span>Available Balance</span>
              </div>
              <strong className={styles.statValue}>₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statLabelRow}>
                <CreditCard size={16} className={styles.statIcon} />
                <span>Active Cards</span>
              </div>
              <strong className={styles.statValue}>{user.cardsCount} Cards</strong>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statLabelRow}>
                <PiggyBank size={16} className={styles.statIcon} />
                <span>Savings Pots</span>
              </div>
              <strong className={styles.statValue}>{user.savingsPotsCount} Pots</strong>
            </div>
          </div>

          {/* Preferences card */}
          <div className={`${styles.preferencesCard} glass-card`}>
            <h4 className={styles.sectionTitle}>SaaS Preferences</h4>

            {/* Theme Preference */}
            <div className={styles.preferenceRow}>
              <div className={styles.prefLeft}>
                {themePref === 'DARK' ? <Moon size={16} className={styles.iconPrimary} /> : <Sun size={16} className={styles.iconSecondary} />}
                <div className={styles.prefDetails}>
                  <p className={styles.prefLabel}>Theme Theme</p>
                  <p className={styles.prefDesc}>Switch between Dark and Light mode.</p>
                </div>
              </div>
              <button 
                disabled={isUpdatingPrefs}
                onClick={() => handleUpdatePreferences(themePref === 'DARK' ? 'LIGHT' : 'DARK', notificationPref)}
                className={`${styles.toggleSwitch} ${themePref === 'LIGHT' ? styles.toggleActive : ''}`}
              >
                <span className={styles.toggleKnob}></span>
              </button>
            </div>

            {/* Notification Preference */}
            <div className={styles.preferenceRow}>
              <div className={styles.prefLeft}>
                <Bell size={16} className={styles.iconPrimary} />
                <div className={styles.prefDetails}>
                  <p className={styles.prefLabel}>Real-Time Notifications</p>
                  <p className={styles.prefDesc}>Toggle browser toasts and app logs.</p>
                </div>
              </div>
              <button 
                disabled={isUpdatingPrefs}
                onClick={() => handleUpdatePreferences(themePref, notificationPref === 'ALL' ? 'NONE' : 'ALL')}
                className={`${styles.toggleSwitch} ${notificationPref === 'ALL' ? styles.toggleActive : ''}`}
              >
                <span className={styles.toggleKnob}></span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Form Settings tabs */}
        <div className={styles.rightCol}>
          
          <div className={styles.tabsRow}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>Personal Details</span>
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'security' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={16} />
              <span>Password & PIN</span>
            </button>
          </div>

          {activeTab === 'profile' ? (
            <div className={`${styles.tabContentCard} glass-card animated-fade-in`}>
              <h3 className={styles.formTitle}>Profile Information</h3>
              <p className={styles.formSubtitle}>Update your visual profile avatar, name, and registered email address.</p>

              <form onSubmit={handleUpdateDetails} className={styles.form}>
                
                {/* Avatar Selection Preset */}
                <div className={styles.avatarSelectionGroup}>
                  <label className={styles.formLabel}>Select Profile Avatar</label>
                  <div className={styles.avatarPresetsGrid}>
                    {AVATAR_PRESETS.map((preset, index) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSelectedAvatar(preset)}
                        className={`${styles.avatarPresetBtn} ${selectedAvatar === preset ? styles.activeAvatarPreset : ''}`}
                        title={`Preset ${index + 1}`}
                      >
                        <img src={preset} alt={`Preset ${index + 1}`} className={styles.presetImg} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="name-input">Full Name</label>
                  <input 
                    id="name-input"
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter your name"
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email-input">Email Address</label>
                  <input 
                    id="email-input"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email"
                    className="input-field"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdatingDetails} 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {isUpdatingDetails ? 'Saving Profile Details...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.securityCol}>
              
              {/* Change Password Card */}
              <div className={`${styles.tabContentCard} glass-card animated-fade-in`}>
                <h3 className={styles.formTitle}>Change Password</h3>
                <p className={styles.formSubtitle}>Ensure your login credentials remain secure. Use at least 6 characters.</p>

                <form onSubmit={handleChangePassword} className={styles.form}>
                  <div className="input-group">
                    <label htmlFor="curr-pwd-input">Current Password</label>
                    <input 
                      id="curr-pwd-input"
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="new-pwd-input">New Password</label>
                    <input 
                      id="new-pwd-input"
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="conf-pwd-input">Confirm New Password</label>
                    <input 
                      id="conf-pwd-input"
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isChangingPassword} 
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Change PIN Card */}
              <div className={`${styles.tabContentCard} glass-card animated-fade-in`}>
                <div className={styles.formTitleHeader}>
                  <h3 className={styles.formTitle}>Change Transaction PIN</h3>
                  <div className={styles.pinWarning}>
                    <ShieldAlert size={14} />
                    <span>Required for all money transfers</span>
                  </div>
                </div>
                <p className={styles.formSubtitle}>Set a secure 4-digit PIN to authorize deposits, withdrawals, and savings contributions.</p>

                <form onSubmit={handleChangePin} className={styles.form}>
                  <div className="input-group">
                    <label htmlFor="new-pin-input">New 4-Digit PIN</label>
                    <input 
                      id="new-pin-input"
                      type="password" 
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={newPin} 
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} 
                      placeholder="••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="conf-pin-input">Confirm New PIN</label>
                    <input 
                      id="conf-pin-input"
                      type="password" 
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={confirmPin} 
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                      placeholder="••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isChangingPin} 
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '12px', borderColor: 'var(--color-primary-glow)' }}
                  >
                    {isChangingPin ? 'Updating Transaction PIN...' : 'Update Transaction PIN'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Webcam Modal */}
      {isWebcamOpen && mounted && createPortal(
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-card`}>
            <div className={styles.modalHeader}>
              <h3>Take Profile Photo</h3>
              <button onClick={handleCloseWebcam} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {cameraError ? (
                <div className={styles.cameraErrorBox}>
                  <AlertTriangle size={36} className={styles.errorIcon} />
                  <p>{cameraError}</p>
                </div>
              ) : capturedImage ? (
                <div className={styles.previewContainer}>
                  <img src={capturedImage} alt="Captured" className={styles.capturedImg} />
                </div>
              ) : (
                <div className={styles.webcamView}>
                  {isCameraLoading && <div className={styles.cameraSpinner}>Starting camera...</div>}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={styles.videoStream}
                  />
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {cameraError ? (
                <button type="button" className="btn btn-secondary" onClick={handleCloseWebcam}>
                  Close
                </button>
              ) : capturedImage ? (
                <>
                  <button type="button" className="btn btn-secondary" onClick={handleTriggerTakePhoto}>
                    <RefreshCw size={14} />
                    <span>Retake</span>
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleUseCapturedPhoto}>
                    <span>Save Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseWebcam}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleCapture} disabled={isCameraLoading}>
                    <Camera size={14} />
                    <span>Capture</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
