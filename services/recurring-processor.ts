import { getActiveRecurringExpenses, updateRecurringExpense, createTransaction } from '@/lib/db/queries';
import { getDb } from '@/lib/db/db-client';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Process active recurring expenses and create transactions
 * This should be called when the app starts or on a schedule
 */
export async function processRecurringTransactions() {
    try {
        // Check if database is available
        const db = getDb();
        if (!db) {
            logger.warn('Database not ready for recurring transaction processing');
            return { success: false, created: 0, error: 'Database not ready' };
        }

        const recurringExpenses = await getActiveRecurringExpenses();
        const today = new Date();
        const todayStr = formatDateLocal(today);

        logger.info(`Processing ${recurringExpenses.length} active recurring expenses`);

        let createdCount = 0;
        const categoryNames: string[] = [];

        for (const recurring of recurringExpenses) {
            try {
                // Get the last processed date or start date
                const lastProcessedDate = recurring.last_processed
                    ? new Date(recurring.last_processed)
                    : new Date(recurring.start_date);

                // Check if we need to create a transaction
                const dueDate = calculateNextDueDate(lastProcessedDate, recurring.frequency);

                // If due date is today or in the past, create transaction
                if (dueDate <= todayStr) {
                    // Check if end date has passed
                    if (recurring.end_date && todayStr > recurring.end_date) {
                        logger.info(`Recurring ${recurring.id} has ended, deactivating`);
                        await updateRecurringExpense(recurring.id, { is_active: 0 });
                        continue;
                    }

                    // Get category info to determine type
                    const categoryResult = await db
                        .select({ type: categories.type, name: categories.name })
                        .from(categories)
                        .where(eq(categories.id, recurring.category_id))
                        .limit(1);

                    if (!categoryResult || categoryResult.length === 0) {
                        logger.error(`Category ${recurring.category_id} not found for recurring ${recurring.id}`);
                        continue;
                    }

                    const categoryType = categoryResult[0].type;

                    // Create the transaction
                    await createTransaction({
                        category_id: recurring.category_id,
                        account_id: recurring.account_id,
                        amount: recurring.amount,
                        type: categoryType,
                        date: dueDate,
                        notes: recurring.notes || `Auto-generated from recurring ${recurring.frequency} transaction`,
                        recurring_id: recurring.id,
                    });

                    // Update last_processed date
                    await updateRecurringExpense(recurring.id, {
                        last_processed: dueDate,
                    });

                    createdCount++;
                    categoryNames.push(categoryResult[0].name || `Bill #${recurring.id}`);
                    logger.info(`Created recurring transaction for recurring ${recurring.id}`);
                }
            } catch (error) {
                logger.error(`Error processing recurring ${recurring.id}:`, error);
            }
        }

        logger.info(`Processed recurring transactions: ${createdCount} created`);
        return { success: true, created: createdCount, categoryNames };
    } catch (error) {
        logger.error('Error in processRecurringTransactions:', error);
        return { success: false, created: 0, error };
    }
}

/**
 * Calculate the next due date based on frequency
 */
function calculateNextDueDate(lastDate: Date, frequency: string): string {
    const nextDate = new Date(lastDate);

    switch (frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return formatDateLocal(nextDate);
}

/**
 * Format date to YYYY-MM-DD without timezone shift
 */
function formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}
