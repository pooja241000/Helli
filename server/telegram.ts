export interface TelegramRecipientResult {
  chatId: string;
  success: boolean;
  messageId?: number;
  error?: string;
  timestamp: string;
}

export interface TelegramDispatchSummary {
  status: 'delivered' | 'partial' | 'failed' | 'skipped_no_token';
  deliveredCount: number;
  totalRecipients: number;
  details: TelegramRecipientResult[];
}

export interface TelegramBotStatus {
  configured: boolean;
  connected: boolean;
  botUsername?: string;
  botFirstName?: string;
  configuredChatIds: string[];
  lastChecked: string;
  error?: string;
}

export function getConfiguredChatIds(): string[] {
  const ids: string[] = [];
  const env1 = process.env.TELEGRAM_CHAT_ID_1?.trim();
  const env2 = process.env.TELEGRAM_CHAT_ID_2?.trim();
  const env3 = process.env.TELEGRAM_CHAT_ID_3?.trim();

  if (env1) ids.push(env1);
  if (env2 && !ids.includes(env2)) ids.push(env2);
  if (env3 && !ids.includes(env3)) ids.push(env3);

  // Fallback defaults from specifications if not in env
  const defaults = ['8202503146', '7275581412', '8312506925'];
  for (const d of defaults) {
    if (!ids.includes(d)) {
      ids.push(d);
    }
  }

  return ids;
}

export function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || token === 'MY_TELEGRAM_BOT_TOKEN' || token.length < 15) {
    return null;
  }
  return token;
}

/**
 * Validates the bot token with Telegram getMe API without exposing the token
 */
export async function checkTelegramBotStatus(): Promise<TelegramBotStatus> {
  const token = getBotToken();
  const chatIds = getConfiguredChatIds();

  if (!token) {
    return {
      configured: false,
      connected: false,
      configuredChatIds: chatIds,
      lastChecked: new Date().toISOString(),
      error: 'TELEGRAM_BOT_TOKEN is missing or not set in backend environment.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await res.json()) as {
      ok: boolean;
      result?: { username?: string; first_name?: string };
      description?: string;
    };

    if (data.ok && data.result) {
      return {
        configured: true,
        connected: true,
        botUsername: data.result.username,
        botFirstName: data.result.first_name,
        configuredChatIds: chatIds,
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        configured: true,
        connected: false,
        configuredChatIds: chatIds,
        lastChecked: new Date().toISOString(),
        error: data.description || 'Telegram rejected bot credentials.',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error reaching Telegram API';
    return {
      configured: true,
      connected: false,
      configuredChatIds: chatIds,
      lastChecked: new Date().toISOString(),
      error: errorMsg,
    };
  }
}

/**
 * Sends a message to a single chat ID safely
 */
async function sendSingleMessage(
  token: string,
  chatId: string,
  htmlText: string
): Promise<TelegramRecipientResult> {
  const timestamp = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = (await res.json()) as {
      ok: boolean;
      result?: { message_id?: number };
      description?: string;
    };

    if (data.ok && data.result) {
      return {
        chatId,
        success: true,
        messageId: data.result.message_id,
        timestamp,
      };
    } else {
      return {
        chatId,
        success: false,
        error: data.description || 'Telegram API returned ok: false',
        timestamp,
      };
    }
  } catch (err: unknown) {
    return {
      chatId,
      success: false,
      error: err instanceof Error ? err.message : 'Network failure contacting Telegram',
      timestamp,
    };
  }
}

/**
 * Dispatches accident or test alerts to all configured contacts
 */
export async function sendAccidentAlert(params: {
  eventType: 'automatic_collision' | 'manual_sos' | 'system_test';
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  gpsValid: boolean;
  gForce?: number | null;
  isSimulated?: boolean;
}): Promise<TelegramDispatchSummary> {
  const token = getBotToken();
  const chatIds = getConfiguredChatIds();

  if (!token) {
    return {
      status: 'skipped_no_token',
      deliveredCount: 0,
      totalRecipients: chatIds.length,
      details: chatIds.map((id) => ({
        chatId: id,
        success: false,
        error: 'TELEGRAM_BOT_TOKEN is not configured on the server.',
        timestamp: new Date().toISOString(),
      })),
    };
  }

  // Format the alert text cleanly
  let titleHeader = '';
  if (params.eventType === 'automatic_collision') {
    titleHeader = '🚨 <b>ACCI ALERT: AUTOMATIC COLLISION DETECTED</b> 🚨';
  } else if (params.eventType === 'manual_sos') {
    titleHeader = '🆘 <b>ACCI ALERT: MANUAL SOS BUTTON PRESSED</b> 🆘';
  } else {
    titleHeader = '🧪 <b>ACCI ALERT: EMERGENCY SYSTEM TEST</b> 🧪';
  }

  const simNote = params.isSimulated
    ? '\n⚠️ <b>MODE: [EXHIBITION DEMO / SIMULATION]</b>\n'
    : '';

  let locationBlock = '';
  if (
    params.gpsValid &&
    params.latitude !== null &&
    params.latitude !== undefined &&
    params.longitude !== null &&
    params.longitude !== undefined
  ) {
    const lat = Number(params.latitude).toFixed(6);
    const lon = Number(params.longitude).toFixed(6);
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    locationBlock = `\n📍 <b>GPS Telemetry:</b>\n• Latitude: <code>${lat}</code>\n• Longitude: <code>${lon}</code>\n🗺️ <b>Live Map:</b> <a href="${mapsUrl}">${mapsUrl}</a>\n`;
  } else {
    locationBlock = `\n📍 <b>GPS Telemetry:</b>\n⚠️ <i>GPS fix unavailable (satellites searching or indoors)</i>\n`;
  }

  const gForceBlock =
    params.gForce !== null && params.gForce !== undefined
      ? `• Impact Force: <b>${params.gForce.toFixed(1)} m/s²</b>\n`
      : '';

  const messageText = `${titleHeader}${simNote}
<b>Event Time:</b> ${params.timestamp}
<b>System:</b> ESP32 MPU6050 + NEO-6M IoT Node
${gForceBlock}${locationBlock}
<i>Immediate assistance requested. This is an automated dispatch from the ACCI ALERT school science exhibition system.</i>`;

  const results: TelegramRecipientResult[] = [];

  for (const chatId of chatIds) {
    const res = await sendSingleMessage(token, chatId, messageText);
    results.push(res);
  }

  const deliveredCount = results.filter((r) => r.success).length;
  let status: 'delivered' | 'partial' | 'failed' = 'failed';
  if (deliveredCount === chatIds.length && chatIds.length > 0) {
    status = 'delivered';
  } else if (deliveredCount > 0) {
    status = 'partial';
  }

  return {
    status,
    deliveredCount,
    totalRecipients: chatIds.length,
    details: results,
  };
}
