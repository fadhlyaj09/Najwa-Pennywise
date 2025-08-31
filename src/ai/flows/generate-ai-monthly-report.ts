'use server';
/**
 * @fileOverview Generates a monthly financial report with AI-driven insights.
 *
 * - generateMonthlyReport - A function to generate the monthly report.
 * - GenerateMonthlyReportInput - The input type for the generateMonthlyReport function.
 * - GenerateMonthlyReportOutput - The return type for the generateMonthlyReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMonthlyReportInputSchema = z.object({
  income: z.number().describe('Total income for the month.'),
  expenses: z.number().describe('Total expenses for the month.'),
  spendingByCategory: z.record(z.string(), z.number()).describe('Spending categorized by type with amount.'),
  spendingLimit: z.number().describe('Monthly spending limit set by the user.'),
  transactionHistory: z.string().describe('A detailed transaction history for the month.'),
});
export type GenerateMonthlyReportInput = z.infer<typeof GenerateMonthlyReportInputSchema>;

const GenerateMonthlyReportOutputSchema = z.object({
  report: z.string().describe('The AI-generated monthly financial report.'),
});
export type GenerateMonthlyReportOutput = z.infer<typeof GenerateMonthlyReportOutputSchema>;

export async function generateMonthlyReport(input: GenerateMonthlyReportInput): Promise<GenerateMonthlyReportOutput> {
  return generateMonthlyReportFlow(input);
}

const generateMonthlyReportPrompt = ai.definePrompt({
  name: 'generateMonthlyReportPrompt',
  input: {schema: GenerateMonthlyReportInputSchema},
  output: {schema: GenerateMonthlyReportOutputSchema},
  prompt: `You are a personal finance advisor, create a comprehensive monthly financial report based on the following data. The currency is Indonesian Rupiah (Rp).

Income: {{{income}}}
Expenses: {{{expenses}}}
Spending by Category: {{{spendingByCategory}}}
Spending Limit: {{{spendingLimit}}}
Transaction History: {{{transactionHistory}}}

Analyze this information and provide insights and summaries of spending habits, and suggest areas for improvement. Format all currency values in Indonesian Rupiah (Rp).
`,
});

const generateMonthlyReportFlow = ai.defineFlow(
  {
    name: 'generateMonthlyReportFlow',
    inputSchema: GenerateMonthlyReportInputSchema,
    outputSchema: GenerateMonthlyReportOutputSchema,
  },
  async input => {
    const {output} = await generateMonthlyReportPrompt(input);
    return output!;
  }
);
