import React from 'react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare const NewProjectModal: React.FC<NewProjectModalProps>;

export default NewProjectModal;
