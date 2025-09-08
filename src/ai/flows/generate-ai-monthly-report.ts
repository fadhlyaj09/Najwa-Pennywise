
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
  spendingByCategory: z.record(z.string(), z.number()).describe('An object mapping spending categories to their total amounts. Example: {"Food": 500000, "Transport": 200000}'),
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
  prompt: `You are a cool and savvy personal finance buddy from South Jakarta (Jaksel). Create a monthly financial report that's insightful but also super chill and easy to read. Use a mix of casual Indonesian and English. The output must be a single block of HTML, without any markdown wrappers like \`\`\`html.

Your persona:
- You are supportive, not judgmental.
- You use slang like "literally", "which is", "like", "bro", "gokil", "cuan".
- You understand the lifestyle: coffee shops, hangouts, concerts, etc.

Data:
- Income: {{{income}}}
- Expenses: {{{expenses}}}
- Spending by Category: {{spendingByCategory}}
- Spending Limit: {{{spendingLimit}}}
- Transaction History:
{{{transactionHistory}}}

Structure your HTML report as follows:
1.  <h4>Monthly Recap, Bro!</h4>: Start with a chill greeting. Spill the tea on the total income, expenses, and the net savings (income - expenses). Mention if they're killing it or overspending their limit, but keep it positive.
2.  <h4>Where Your Money Goes</h4>: Create a section to analyze their spending.
    -   Give a breakdown of spending by category. Make it easy to read, maybe a simple list.
    -   Point out the top 3 spending categories. Be like, "Looks like you're spending a lot on..."
    -   Provide specific, actionable insights that are actually doable. For example, if 'Hangout' is high, suggest, "Maybe we can switch the fancy coffee shop with a literally good local coffee spot? The cuan could be used for something else."
3.  <h4>Tips & Tricks for Next Month</h4>: Offer some pro-tips for the upcoming month.
    -   Suggest some chill budget adjustments, not super strict ones.
    -   Give ideas on how to save more without sacrificing the fun.
4.  <h4>Closing</h4>: End with a motivational and positive closing statement. Sign it off with your name.

Formatting Rules:
- Use HTML tags like <h4>, <p>, <ul>, <li>, and <strong> or <b>.
- Format all currency values using 'Rp' prefix and standard Indonesian number formatting (e.g., Rp 1.500.000). No cents.
- Keep the tone super encouraging. You're their best finance bro!
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
