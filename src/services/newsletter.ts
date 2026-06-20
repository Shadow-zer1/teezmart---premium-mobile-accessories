export interface SubscribeResponse {
  success: boolean;
  message?: string;
}

export const subscribeToNewsletter = async (email: string): Promise<SubscribeResponse> => {
  const brevoApiKey = import.meta.env.VITE_BREVO_API_KEY;
  const listId = parseInt(import.meta.env.VITE_BREVO_LIST_ID || '2');

  if (!brevoApiKey) {
    console.error('Brevo API key is missing. Please check your .env file.');
    return { success: false, message: 'Newsletter service is temporarily unavailable.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        listIds: [listId], 
        updateEnabled: true 
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const result = await response.json();
      return { success: false, message: result.message || 'Subscription failed.' };
    }
  } catch (err) {
    return { success: false, message: 'Service unavailable. Please try again later.' };
  }
};