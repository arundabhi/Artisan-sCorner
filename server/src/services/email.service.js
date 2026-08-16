/**
 * Mock email sender service.
 * @param {Object} options - { email, subject, message }
 * @returns {Promise<any>}
 */
export const sendEmail = async (options) => {
  console.log(`Sending email to ${options.email} with subject "${options.subject}"`);
  // Mock success resolve
  return Promise.resolve({ success: true, messageId: `mock_${Date.now()}` });
};
