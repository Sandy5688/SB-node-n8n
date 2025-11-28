import { Job } from 'bullmq';
import { logger } from '../lib/logger';
import { getDb } from '../db/mongo';
import { sendMessage } from '../services/messaging';

interface MessagingRetryJobData {
  message_id: string;
  attempt: number;
  original_error?: string;
}

/**
 * Messaging Retry Worker
 * Retries failed message deliveries with exponential backoff
 */
export async function processMessagingRetry(job: Job<MessagingRetryJobData>): Promise<any> {
  const { message_id, attempt, original_error } = job.data;
  
  logger.info(`Messaging retry job started: id=${job.id} message=${message_id} attempt=${attempt}`);

  try {
    const db = await getDb();
    
    // Fetch the original message
    const message = await db.collection('messages').findOne({ message_id });
    
    if (!message) {
      logger.warn(`Message not found for retry: message_id=${message_id}`);
      return { ok: false, reason: 'message_not_found' };
    }

    // Check if message has already been delivered
    if (message.status === 'delivered' || message.status === 'sent') {
      logger.info(`Message already delivered: message_id=${message_id}`);
      return { ok: true, reason: 'already_delivered' };
    }

    // Check retry limit (max 5 retries)
    const retryCount = message.retry_count || 0;
    if (retryCount >= 5) {
      logger.warn(`Max retries reached for message: message_id=${message_id}`);
      
      await db.collection('messages').updateOne(
        { message_id },
        {
          $set: {
            status: 'failed',
            error: 'Max retries exceeded',
            updatedAt: new Date(),
          },
        }
      );
      
      return { ok: false, reason: 'max_retries_exceeded' };
    }

    // Update retry count
    await db.collection('messages').updateOne(
      { message_id },
      {
        $set: {
          status: 'retrying',
          retry_count: retryCount + 1,
          lastRetryAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Retry sending the message
    const result = await sendMessage({
      channel: message.channel,
      to: message.to,
      template_id: message.template_id,
      params: message.params || {},
      fallback: message.fallback,
    });

    if (result.ok) {
      // Update message status to delivered
      await db.collection('messages').updateOne(
        { message_id },
        {
          $set: {
            status: 'delivered',
            deliveredAt: new Date(),
            provider_id: result.provider_id,
            updatedAt: new Date(),
          },
        }
      );

      logger.info(`Message retry successful: message_id=${message_id} attempt=${retryCount + 1}`);
      return { ok: true, message_id, provider_id: result.provider_id };
    } else {
      // Retry failed, will be retried again if under limit
      logger.warn(`Message retry failed: message_id=${message_id} attempt=${retryCount + 1} error=${result.error}`);
      
      await db.collection('messages').updateOne(
        { message_id },
        {
          $set: {
            status: 'retry_failed',
            lastError: result.error,
            updatedAt: new Date(),
          },
        }
      );

      throw new Error(result.error || 'Message delivery failed');
    }
  } catch (err: any) {
    logger.error(`Messaging retry job failed: id=${job.id} message=${message_id} error=${err?.message}`);
    throw err;
  }
}

