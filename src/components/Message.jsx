import { message } from 'antd';

/**
 * Reusable Message Component
 * Wrapper around Ant Design's message API for consistent alert handling
 */

export const Message = {
  /**
   * Show success message
   * @param {string} content - Message content
   * @param {number} duration - Display duration in seconds (default: 2)
   */
  success: (content, duration = 2) => {
    message.success({
      content,
      duration,
    });
  },

  /**
   * Show error message
   * @param {string} content - Message content
   * @param {number} duration - Display duration in seconds (default: 2)
   */
  error: (content, duration = 2) => {
    message.error({
      content,
      duration,
    });
  },

  /**
   * Show warning message
   * @param {string} content - Message content
   * @param {number} duration - Display duration in seconds (default: 2)
   */
  warning: (content, duration = 2) => {
    message.warning({
      content,
      duration,
    });
  },

  /**
   * Show info message
   * @param {string} content - Message content
   * @param {number} duration - Display duration in seconds (default: 2)
   */
  info: (content, duration = 2) => {
    message.info({
      content,
      duration,
    });
  },

  /**
   * Show loading message (no auto-close)
   * @param {string} content - Message content
   * @returns {function} Function to close the message
   */
  loading: (content) => {
    return message.loading({
      content,
      duration: 0,
    });
  },

  /**
   * Close all messages
   */
  closeAll: () => {
    message.destroy();
  },
};

export default Message;
