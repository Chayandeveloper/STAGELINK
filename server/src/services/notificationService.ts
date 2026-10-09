import { getFirebaseApp } from '../config/firebase';
import { getMessaging, type MulticastMessage, type SendResponse } from 'firebase-admin/messaging';
import { User } from '../models/User';

interface SendChatNotificationParams {
  recipientId: string;
  senderName: string;
  messageText: string;
  conversationId: string;
  messageType?: string;
}

export class NotificationService {
  /**
   * Send push notification for a new chat message
   */
  static async sendChatPushNotification({
    recipientId,
    senderName,
    messageText,
    conversationId,
    messageType = 'text',
  }: SendChatNotificationParams): Promise<void> {
    try {
      const app = getFirebaseApp();
      if (!app) {
        // Firebase not configured yet
        return;
      }

      const recipient = await User.findById(recipientId).select('fcmTokens name');
      if (!recipient || !recipient.fcmTokens || recipient.fcmTokens.length === 0) {
        console.log(`ℹ️ [Push] Skipped for user ${recipient?.name || recipientId}: User has no registered device tokens yet.`);
        return;
      }

      console.log(`🚀 [Push] Sending push notification to ${recipient.name} (${recipient.fcmTokens.length} device(s))...`);

      let bodyPreview = messageText;
      if (messageType === 'image') {
        bodyPreview = '📷 Sent a photo';
      } else if (messageType === 'audio' || messageType === 'voice') {
        bodyPreview = '🎤 Sent a voice message';
      } else if (messageType === 'file') {
        bodyPreview = '📎 Sent an attachment';
      }

      if (bodyPreview.length > 100) {
        bodyPreview = bodyPreview.substring(0, 97) + '...';
      }

      const payload: MulticastMessage = {
        tokens: recipient.fcmTokens,
        notification: {
          title: senderName || 'StageLink Message',
          body: bodyPreview,
        },
        data: {
          type: 'chat_message',
          conversationId: String(conversationId),
          senderName: String(senderName || ''),
          messageText: String(bodyPreview || ''),
          click_action: `/dashboard/messages`,
        },
        webpush: {
          notification: {
            title: senderName || 'StageLink Message',
            body: bodyPreview,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            tag: `chat_${conversationId}`,
          },
          fcmOptions: {
            link: `/dashboard/messages`,
          },
        },
      };

      const messaging = getMessaging(app);
      const response = await messaging.sendEachForMulticast(payload);
      console.log(`✅ [Push] Notification delivered to ${response.successCount} of ${recipient.fcmTokens.length} device(s) for ${recipient.name}.`);

      // Clean up invalid/expired device tokens
      if (response.failureCount > 0) {
        const staleTokens: string[] = [];
        response.responses.forEach((resp: SendResponse, index: number) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/invalid-argument'
            ) {
              staleTokens.push(recipient.fcmTokens![index]);
            }
          }
        });

        if (staleTokens.length > 0) {
          await User.findByIdAndUpdate(recipientId, {
            $pull: { fcmTokens: { $in: staleTokens } },
          });
        }
      }
    } catch (error) {
      console.error('❌ Error sending FCM chat notification:', error);
    }
  }
}
