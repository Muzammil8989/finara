import { getActiveRecurringExpenses, updateRecurringExpense, createTransaction } from '@/lib/db/queries';
import { getDb } from '@/lib/db/db-client';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/** Format date to YYYY-MM-DD without timezone shift */
function formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Calculate the next due date based on frequency */
function calculateNextDueDate(lastDate: Date, frequency: string): string {
    const nextDate = new Date(lastDate);
    switch (frequency) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
    }
    return formatDateLocal(nextDate);
}

/**
 * Process active recurring expenses and create transactions.
 * Call on app startup or on a schedule.
 */
export async function processRecurringTransactions() {
    try {
        const db = getDb();
        if (!db) {
            logger.warn('Database not ready for recurring transaction processing');
            return { success: false, created: 0, error: 'Database not ready' };
        }

        const recurringExpenses = await getActiveRecurringExpenses();
        const todayStr = formatDateLocal(new Date());

        logger.info(`Processing ${recurringExpenses.length} active recurring expenses`);

        let createdCount = 0;
        const categoryNames: string[] = [];

        for (const recurring of recurringExpenses) {
            try {
                // First occurrence: use start_date directly.
                // Subsequent occurrences: calculate next due from last_processed.
                const isFirstRun = !recurring.last_processed;
                const dueDate = isFirstRun
                    ? recurring.start_date
                    : calculateNextDueDate(new Date(recurring.last_processed!), recurring.frequency);

                if (dueDate <= todayStr) {
                    if (recurring.end_date && todayStr > recurring.end_date) {
                        logger.info(`Recurring ${recurring.id} has ended, deactivating`);
                        await updateRecurringExpense(recurring.id, { is_active: 0 });
                        continue;
                    }

                    const categoryResult = await db
                        .select({ type: categories.type, name: categories.name })
                        .from(categories)
                        .where(eq(categories.id, recurring.category_id))
                        .limit(1);

                    if (!categoryResult || categoryResult.length === 0) {
                        logger.error(`Category ${recurring.category_id} not found for recurring ${recurring.id}`);
                        continue;
                    }

                    await createTransaction({
                        category_id: recurring.category_id,
                        account_id: recurring.account_id,
                        amount: recurring.amount,
                        type: categoryResult[0].type,
                        date: dueDate,
                        notes: recurring.notes || `Auto-generated from recurring ${recurring.frequency} transaction`,
                        recurring_id: recurring.id,
                    });

                    await updateRecurringExpense(recurring.id, { last_processed: dueDate });

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
