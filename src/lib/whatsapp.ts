export async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("WhatsApp API credentials missing.");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: text
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (!response.ok) {
      console.error("Failed to send WhatsApp message:", result);
    }
    return result;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}

export async function sendWhatsAppImage(to: string, imageUrl: string, caption: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "image",
    image: {
      link: imageUrl,
      caption: caption
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error sending WhatsApp image:", error);
  }
}
