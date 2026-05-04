import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useFocusTrap, useEscapeKey } from '@hooks/useFocusManagement';
import { createModalProps, generateId } from '@utils/accessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
}

/**
 * Modal Component
 * Fully accessible modal dialog with focus management and keyboard navigation
 * Meets WCAG 2.1 AA standards for modal dialogs
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  size = 'medium',
  closeOnBackdropClick = true,
  showCloseButton = true,
}) => {
  const titleId = generateId('modal-title');
  const descriptionId = description ? generateId('modal-description') : undefined;
  
  // Focus trap for accessibility
  const focusTrapRef = useFocusTrap(isOpen);
  
  // Handle escape key
  useEscapeKey(onClose, isOpen);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    full: 'max-w-full mx-4',
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
        className={`
          relative bg-white dark:bg-gray-800 rounded-lg shadow-xl
          w-full ${sizeClasses[size]}
          max-h-[90vh] overflow-y-auto
          transform transition-all
          ${className}
        `}
        {...createModalProps(titleId, descriptionId)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 
            id={titleId}
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          
          {showCloseButton && (
            <Button
              variant="secondary"
              size="small"
              onClick={onClose}
              className="p-2"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="px-6 pt-4">
            <p 
              id={descriptionId}
              className="text-gray-600 dark:text-gray-400"
            >
              {description}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation Modal Component
 * Pre-configured modal for confirmation dialogs
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={isLoading}
            autoFocus
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;