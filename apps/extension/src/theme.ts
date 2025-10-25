export const colors = {
  primary: '#18be94',
  primaryHover: '#13a179',
  backgroundLight: '#f5f5f7',
  backgroundWhite: '#ffffff',
  backgroundGray: '#e8e8f0',
  border: '#d0d0d8',
  borderLight: '#e0e0e8',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textDisabled: '#d0d0d8',
  textWhite: '#ffffff',
  textMuted: '#888888',
  errorBg: '#fef2f2',
  errorText: '#991b1b',
  errorBorder: '#dc2626',
  argoGray6: '#6D7F8B',
};

export const getCodeBackgroundColor = (isUser: boolean) =>
  isUser ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)';
