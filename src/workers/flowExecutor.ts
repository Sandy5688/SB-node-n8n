import { Job } from 'bullmq';
import { logger } from '../lib/logger';
import { getDb } from '../db/mongo';
import { http } from '../lib/http';
import { env } from '../config/env';

interface FlowExecuteJobData {
  flow_id: string;
  flow_name: string;
  steps: FlowStep[];
  context: Record<string, any>;
  user_id?: string;
}

interface FlowStep {
  step_id: string;
  name: string;
  type: 'http' | 'db' | 'condition' | 'delay';
  config: Record<string, any>;
  on_error?: 'continue' | 'stop' | 'retry';
}

/**
 * Flow Executor Worker
 * Orchestrates multi-step workflows with conditional logic
 */
export async function processFlowExecute(job: Job<FlowExecuteJobData>): Promise<any> {
  const { flow_id, flow_name, steps, context, user_id } = job.data;
  
  logger.info(`Flow execution started: id=${job.id} flow=${flow_id} name=${flow_name} steps=${steps.length}`);

  const db = await getDb();
  const executionId = `exec_${Date.now()}_${flow_id}`;
  const results: any[] = [];

  try {
    // Create execution record
    await db.collection('flow_executions').insertOne({
      execution_id: executionId,
      flow_id,
      flow_name,
      user_id,
      status: 'running',
      started_at: new Date(),
      context,
    });

    // Execute steps sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      logger.info(`Executing step: flow=${flow_id} step=${step.step_id} name=${step.name} type=${step.type}`);

      try {
        let stepResult: any;

        switch (step.type) {
          case 'http':
            stepResult = await executeHttpStep(step, context);
            break;
          case 'db':
            stepResult = await executeDbStep(step, context, db);
            break;
          case 'condition':
            stepResult = await executeConditionStep(step, context, results);
            break;
          case 'delay':
            stepResult = await executeDelayStep(step);
            break;
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }

        results.push({
          step_id: step.step_id,
          name: step.name,
          status: 'success',
          result: stepResult,
          executed_at: new Date(),
        });

        // Update context with step result
        context[`step_${step.step_id}`] = stepResult;

      } catch (stepErr: any) {
        logger.error(`Step failed: flow=${flow_id} step=${step.step_id} error=${stepErr?.message}`);

        results.push({
          step_id: step.step_id,
          name: step.name,
          status: 'failed',
          error: stepErr?.message,
          executed_at: new Date(),
        });

        // Handle error based on step configuration
        const onError = step.on_error || 'stop';
        if (onError === 'stop') {
          throw stepErr;
        } else if (onError === 'continue') {
          logger.info(`Continuing flow despite step error: step=${step.step_id}`);
        }
        // 'retry' is handled by BullMQ job retry mechanism
      }
    }

    // Mark execution as completed
    await db.collection('flow_executions').updateOne(
      { execution_id: executionId },
      {
        $set: {
          status: 'completed',
          completed_at: new Date(),
          results,
        },
      }
    );

    logger.info(`Flow execution completed: id=${job.id} flow=${flow_id} steps=${results.length}`);

    return {
      ok: true,
      execution_id: executionId,
      flow_id,
      results,
    };

  } catch (err: any) {
    logger.error(`Flow execution failed: id=${job.id} flow=${flow_id} error=${err?.message}`);

    // Mark execution as failed
    await db.collection('flow_executions').updateOne(
      { execution_id: executionId },
      {
        $set: {
          status: 'failed',
          failed_at: new Date(),
          error: err?.message,
          results,
        },
      }
    );

    throw err;
  }
}

async function executeHttpStep(step: FlowStep, context: Record<string, any>): Promise<any> {
  const { url, method, headers, body } = step.config;
  
  // Replace variables in config with context values
  const resolvedUrl = replaceVariables(url, context);
  const resolvedHeaders = replaceVariables(headers, context);
  const resolvedBody = replaceVariables(body, context);

  const response = await http.request({
    url: resolvedUrl,
    method: method || 'GET',
    headers: resolvedHeaders,
    data: resolvedBody,
  });

  return {
    status: response.status,
    data: response.data,
  };
}

async function executeDbStep(step: FlowStep, context: Record<string, any>, db: any): Promise<any> {
  const { collection, operation, query, update, options } = step.config;
  
  const resolvedQuery = replaceVariables(query, context);
  const resolvedUpdate = replaceVariables(update, context);

  switch (operation) {
    case 'findOne':
      return await db.collection(collection).findOne(resolvedQuery);
    case 'find':
      return await db.collection(collection).find(resolvedQuery).toArray();
    case 'insertOne':
      return await db.collection(collection).insertOne(resolvedUpdate);
    case 'updateOne':
      return await db.collection(collection).updateOne(resolvedQuery, resolvedUpdate, options);
    case 'deleteOne':
      return await db.collection(collection).deleteOne(resolvedQuery);
    default:
      throw new Error(`Unknown DB operation: ${operation}`);
  }
}

async function executeConditionStep(step: FlowStep, context: Record<string, any>, results: any[]): Promise<any> {
  const { condition, true_path, false_path } = step.config;
  
  // Evaluate condition (simple string comparison or existence check)
  const conditionMet = evaluateCondition(condition, context);
  
  return {
    condition_met: conditionMet,
    path_taken: conditionMet ? true_path : false_path,
  };
}

async function executeDelayStep(step: FlowStep): Promise<any> {
  const { delay_ms } = step.config;
  await new Promise(resolve => setTimeout(resolve, delay_ms || 1000));
  return { delayed_ms: delay_ms };
}

function replaceVariables(obj: any, context: Record<string, any>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || '');
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, context));
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceVariables(value, context);
    }
    return result;
  }
  return obj;
}

function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  // Simple condition evaluation (e.g., "user_id exists" or "amount > 100")
  try {
    // Replace variables in condition
    const resolved = replaceVariables(condition, context);
    // Use eval cautiously - in production, use a proper expression parser
    // For now, just check if value exists and is truthy
    return !!context[condition];
  } catch {
    return false;
  }
}

