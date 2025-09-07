
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
  spendingByCategory: z.record(z.string(), z.number()).describe('A JSON string representing spending categorized by type with amount. Example: {"Food": 500000, "Transport": 200000}'),
  spendingLimit: z.number().describe('Monthly spending limit set by the user.'),
  transactionHistory: z.string().describe('A detailed transaction history for the month, with each transaction on a new line.'),
});
export type GenerateMonthlyReportInput = z.infer<typeof GenerateMonthlyReportInputSchema>;

const GenerateMonthlyReportOutputSchema = z.object({
  report: z.string().describe('The AI-generated monthly financial report in HTML format.'),
});
export type GenerateMonthlyReportOutput = z.infer<typeof GenerateMonthlyReportOutputSchema>;

export async function generateMonthlyReport(input: GenerateMonthlyReportInput): Promise<GenerateMonthlyReportOutput> {
  return generateMonthlyReportFlow(input);
}

const generateMonthlyReportPrompt = ai.definePrompt({
  name: 'generateMonthlyReportPrompt',
  input: {schema: GenerateMonthlyReportInputSchema},
  output: {schema: GenerateMonthlyReportOutputSchema},
  prompt: `You are a personal finance advisor. Create a comprehensive, friendly, and encouraging monthly financial report based on the following data. The currency is Indonesian Rupiah (Rp). The output must be a single block of HTML, without any markdown wrappers like \`\`\`html.

Data:
- Income: {{{income}}}
- Expenses: {{{expenses}}}
- Spending by Category: {{{spendingByCategory}}}
- Spending Limit: {{{spendingLimit}}}
- Transaction History:
{{{transactionHistory}}}

Structure your HTML report as follows:
1.  **Ringkasan Bulan Ini**: Start with a friendly opening. Summarize total income, expenses, and net savings (income - expenses). Mention if they are within their spending limit.
2.  **Analisis Pengeluaran**: Create a section to analyze spending.
    -   Show a breakdown of spending by category.
    -   Identify the top 3 spending categories.
    -   Provide specific, actionable insights based on their spending habits. For example, if 'Hangout' is high, suggest cheaper alternatives.
3.  **Saran & Rekomendasi**: Offer encouraging advice and concrete suggestions for the next month.
    -   Suggest realistic budget adjustments.
    -   Give tips to increase savings or reduce specific expenses.
4.  **Closing**: End with a motivational and positive closing statement.

Formatting Rules:
- Use HTML tags like <h1>, <h2>, <h3> for titles, <p> for paragraphs, <ul> and <li> for lists, and <strong> or <b> for emphasis.
- Format all currency values using 'Rp' prefix and standard Indonesian number formatting (e.g., Rp 1.500.000).
- Keep the tone encouraging, not judgmental.
`,
});

const generateMonthlyReportFlow = ai.defineFlow(
  {
    name: 'generateMonthlyReportFlow',
    inputSchema: GenerateMonthlyReportInputSchema,
    outputSchema: GenerateMonthlyReportOutputSchema,
  },
  async input => {
    const {output} = await generateMonthlyReportPrompt({
        ...input,
        // The prompt expects the raw object, it will be stringified by the template.
    });
    return output!;
  }
);
